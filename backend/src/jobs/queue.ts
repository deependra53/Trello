import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

/**
 * Lightweight queue abstraction. When Redis is reachable, uses BullMQ.
 * Otherwise runs the handler inline so dev/test environments work without
 * extra infra.
 */
export interface JobQueue<T> {
  add(name: string, data: T, delayMs?: number): Promise<void>;
}

interface BullQueueLike<T> {
  add(name: string, data: T, opts?: { delay?: number }): Promise<unknown>;
}

interface BullWorkerLike {
  on(event: string, cb: (...args: unknown[]) => void): void;
}

let bullmqAvailable: boolean | null = null;
let bullmq: typeof import('bullmq') | null = null;
let IORedis: typeof import('ioredis').default | null = null;

async function tryLoadBullmq() {
  if (bullmqAvailable !== null) return bullmqAvailable;
  try {
    bullmq = await import('bullmq');
    const ioredis = await import('ioredis');
    IORedis = ioredis.default;
    bullmqAvailable = true;
  } catch {
    bullmqAvailable = false;
  }
  return bullmqAvailable;
}

interface RedisConnection {
  host: string;
  port: number;
  maxRetriesPerRequest: null;
}

function redisConnection(): RedisConnection {
  const url = new URL(env.REDIS_URL);
  return {
    host: url.hostname,
    port: Number(url.port) || 6379,
    maxRetriesPerRequest: null,
  };
}

const queues = new Map<string, JobQueue<unknown>>();

export function createQueue<T>(name: string, handler: (data: T) => Promise<void>): JobQueue<T> {
  if (queues.has(name)) return queues.get(name) as JobQueue<T>;

  const enabled =
    env.NODE_ENV === 'production' || (env.NODE_ENV === 'development' && env.REDIS_URL);

  if (!enabled) {
    const inline: JobQueue<T> = {
      async add(_n, data, delayMs) {
        const run = () => handler(data).catch((e) => logger.error(e, `inline job ${name} failed`));
        if (delayMs && delayMs > 0) setTimeout(run, delayMs);
        else void run();
      },
    };
    queues.set(name, inline as JobQueue<unknown>);
    return inline;
  }

  // Lazy-init BullMQ
  let bullQueue: BullQueueLike<T> | null = null;
  const initPromise = (async () => {
    const available = await tryLoadBullmq();
    if (!available || !bullmq || !IORedis) {
      logger.warn(`bullmq not installed — running ${name} inline`);
      return;
    }
    const connection = redisConnection();
    bullQueue = new bullmq.Queue(name, { connection }) as BullQueueLike<T>;
    const worker = new bullmq.Worker(name, async (job) => handler(job.data as T), {
      connection,
    }) as unknown as BullWorkerLike;
    worker.on('failed', (...args) => logger.error({ args }, `job ${name} failed`));
  })().catch((e) => logger.error(e, `failed to init queue ${name}`));

  const queue: JobQueue<T> = {
    async add(jobName, data, delayMs) {
      await initPromise;
      if (bullQueue) {
        await bullQueue.add(jobName, data, delayMs ? { delay: delayMs } : undefined);
      } else {
        // Fallback to inline if init failed
        if (delayMs && delayMs > 0) {
          setTimeout(
            () => handler(data).catch((e) => logger.error(e, `inline job ${name} failed`)),
            delayMs,
          );
        } else {
          handler(data).catch((e) => logger.error(e, `inline job ${name} failed`));
        }
      }
    },
  };
  queues.set(name, queue as JobQueue<unknown>);
  return queue;
}
