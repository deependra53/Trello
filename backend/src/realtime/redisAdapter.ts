import type { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

/**
 * Attach the socket.io Redis adapter so board/user/channel rooms and their
 * broadcasts fan out across every backend instance (each node keeps its own
 * in-memory room table; Redis pub/sub bridges them — no DB round-trips).
 *
 * Degrades gracefully: if Redis can't be reached we keep the default in-memory
 * adapter, which is correct for a single instance. Local delivery never depends
 * on Redis — the adapter delivers to local sockets first, then publishes — so a
 * Redis outage can't drop same-node events.
 */
export async function attachRedisAdapter(io: Server): Promise<boolean> {
  const makeClient = (): Redis =>
    new Redis(env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: null,
      retryStrategy: (times) => Math.min(times * 200, 2000),
    });

  const pub = makeClient();
  const sub = pub.duplicate();
  // Keep transient connection errors from crashing the process.
  pub.on('error', () => undefined);
  sub.on('error', () => undefined);

  try {
    await Promise.all([connectWithTimeout(pub), connectWithTimeout(sub)]);
    io.adapter(createAdapter(pub, sub));
    logger.info('socket.io using Redis adapter (multi-instance ready)');
    return true;
  } catch (err) {
    logger.warn(
      { err: err instanceof Error ? err.message : String(err) },
      'Redis unavailable — socket.io using in-memory adapter (single-instance)',
    );
    pub.disconnect();
    sub.disconnect();
    return false;
  }
}

function connectWithTimeout(client: Redis, ms = 2000): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('redis connect timeout')), ms);
    client
      .connect()
      .then(() => {
        clearTimeout(timer);
        resolve();
      })
      .catch((e) => {
        clearTimeout(timer);
        reject(e instanceof Error ? e : new Error(String(e)));
      });
  });
}
