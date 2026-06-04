'use client';
/**
 * React Query cache persistence to IndexedDB.
 *
 * Why: our query cache lives only in memory, so every page refresh wipes it and
 * each conversation/board re-renders a skeleton while it refetches from zero.
 * Slack feels instant after a refresh because it rehydrates a local snapshot and
 * renders it immediately, revalidating in the background. This does the same:
 *
 *  1. On boot we restore the dehydrated cache from IndexedDB and `hydrate()` it
 *     into the client BEFORE any query mounts (gated by `IsRestoringProvider`),
 *     so restored queries are `success` (not `pending`) and skip the skeleton.
 *  2. While restoring, queries don't fetch — no wasted request, no
 *     fetch-then-replace flash. Once restore completes they revalidate in the
 *     background (data already on screen, only `isFetching` flips).
 *  3. We persist (throttled) on every cache change, plus a best-effort flush when
 *     the tab is hidden/closed.
 *
 * IndexedDB (not localStorage) on purpose: it's async (never blocks the main
 * thread) and has room for the message/board caches — localStorage is ~5MB and
 * synchronous. This is the same split Slack uses (Cache API + IndexedDB).
 *
 * Zero external deps: `dehydrate`/`hydrate`/`IsRestoringProvider` ship with
 * @tanstack/react-query, and the IndexedDB key/value helpers below are ~30 lines.
 */
import { QueryClient, dehydrate, hydrate, type DehydratedState } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Bump when the persisted shape changes in a way that makes old blobs unsafe to
// hydrate; on mismatch the stored cache is discarded instead of restored.
const BUSTER = 'v1';
const CACHE_KEY = 'reactQuery';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // discard snapshots older than a day
const PERSIST_THROTTLE_MS = 1000;

/**
 * Query-key roots worth persisting — the read caches that drive instant render.
 * Volatile/derived caches (search, the bootstrap marker, live notifications) are
 * intentionally excluded so they always re-resolve fresh on a new session.
 */
const PERSIST_KEYS = new Set<string>([
  // chat
  'messages',
  'channels',
  'dms',
  'channel',
  'chat-unread',
  'pins',
  'replies',
  'user-threads',
  'org-members',
  // boards
  'workspaces',
  'workspace-boards',
  'board',
]);

interface PersistedCache {
  buster: string;
  timestamp: number;
  clientState: DehydratedState;
}

// ---- minimal IndexedDB key/value store --------------------------------------

const DB_NAME = 'indihive';
const STORE = 'kv';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbRequest<T>(makeReq: (store: IDBObjectStore) => IDBRequest, mode: IDBTransactionMode) {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = makeReq(tx.objectStore(STORE));
        tx.oncomplete = () => {
          resolve(req.result as T);
          db.close();
        };
        tx.onerror = () => {
          reject(tx.error);
          db.close();
        };
      }),
  );
}

const idbGet = <T>(key: string) => idbRequest<T>((s) => s.get(key), 'readonly');
const idbSet = (key: string, val: unknown) =>
  idbRequest<void>((s) => s.put(val, key), 'readwrite');
const idbDel = (key: string) => idbRequest<void>((s) => s.delete(key), 'readwrite');

// ---- restore / persist -------------------------------------------------------

const shouldDehydrateQuery = (query: { queryKey: unknown; state: { status: string } }) => {
  if (query.state.status !== 'success') return false;
  const root = Array.isArray(query.queryKey) ? query.queryKey[0] : query.queryKey;
  return typeof root === 'string' && PERSIST_KEYS.has(root);
};

/** Hydrate the in-memory cache from the persisted snapshot. Safe to call once on
 *  boot; a missing, stale, or version-busted snapshot is discarded silently. */
export async function restoreQueryCache(): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  try {
    const persisted = await idbGet<PersistedCache | undefined>(CACHE_KEY);
    if (!persisted) return;
    if (persisted.buster !== BUSTER || Date.now() - persisted.timestamp > MAX_AGE_MS) {
      await idbDel(CACHE_KEY);
      return;
    }
    hydrate(queryClient, persisted.clientState);
  } catch {
    // A corrupt/unreadable snapshot must never block boot — just start fresh.
  }
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;

async function persistNow(): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  try {
    const clientState = dehydrate(queryClient, { shouldDehydrateQuery });
    await idbSet(CACHE_KEY, { buster: BUSTER, timestamp: Date.now(), clientState });
  } catch {
    // Ignore quota/serialization failures — persistence is best-effort.
  }
}

function schedulePersist() {
  if (persistTimer) return; // coalesce a burst of cache writes into one flush
  persistTimer = setTimeout(() => {
    persistTimer = null;
    void persistNow();
  }, PERSIST_THROTTLE_MS);
}

let started = false;
/** Begin mirroring cache changes to IndexedDB. Call once, after restore. */
export function startPersisting(): void {
  if (started || typeof window === 'undefined') return;
  started = true;
  queryClient.getQueryCache().subscribe(schedulePersist);
  // visibilitychange is far more reliable than unload for flushing the last state.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void persistNow();
  });
  window.addEventListener('pagehide', () => void persistNow());
}

/** Wipe both the in-memory cache and the persisted snapshot. Call on logout so the
 *  next user on this browser never sees the previous user's conversations. */
export async function purgePersistedCache(): Promise<void> {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  try {
    queryClient.clear();
  } catch {
    // ignore
  }
  if (typeof indexedDB === 'undefined') return;
  try {
    await idbDel(CACHE_KEY);
  } catch {
    // ignore
  }
}
