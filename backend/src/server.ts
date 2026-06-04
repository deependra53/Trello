import { createServer } from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDB } from './config/db.js';
import { setupSockets } from './sockets/index.js';
import { startAutomationEngine } from './services/automation.engine.js';
import { startDueReminderCron } from './jobs/dueReminder.js';

async function main() {
  await connectDB();
  const app = createApp();
  const server = createServer(app);

  await setupSockets(server);
  startAutomationEngine();
  startDueReminderCron();

  server.listen(env.PORT, env.HOST, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'IndiHive backend listening');
  });
}

main().catch((err) => {
  logger.error(err, 'failed to start');
  process.exit(1);
});
