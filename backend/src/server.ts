import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDB } from './config/db.js';

async function main() {
  await connectDB();
  const app = createApp();
  app.listen(env.PORT, env.HOST, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'TrelloX backend listening');
  });
}

main().catch((err) => {
  logger.error(err, 'failed to start');
  process.exit(1);
});
