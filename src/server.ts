/**
 * HTTP server bootstrap.
 * Starts the Express app and handles graceful shutdown signals.
 */
import app from './app';
import { env } from './config/env';
import { prisma } from './config';

/** Arena comparisons can take a long time under parallel Ollama load. */
const LONG_REQUEST_TIMEOUT_MS = 1_200_000;

const server = app.listen(env.PORT, () => {
  console.log(`Server listening on port ${env.PORT} [${env.NODE_ENV}]`);
  console.log('✓ Backend Started');
});

// Prevent Node/Express from closing long-running Arena requests early.
server.timeout = LONG_REQUEST_TIMEOUT_MS;
server.keepAliveTimeout = LONG_REQUEST_TIMEOUT_MS + 5_000;
server.headersTimeout = LONG_REQUEST_TIMEOUT_MS + 10_000;

const shutdown = async (signal: string): Promise<void> => {
  console.log(`${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
