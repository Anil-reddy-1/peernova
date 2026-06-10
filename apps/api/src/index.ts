// Load environment variables first
import './config/env';




import { createApp } from './app';
import { logger } from './lib/pino';
import { initializeSocket } from './api/v1/chat/socket';


const PORT = parseInt(process.env.PORT || process.env.API_PORT || '4000', 10);

async function main() {
  const app = createApp();

  const server = app.listen(PORT, () => {
    logger.info({ port: PORT }, `🚀 API server listening on port ${PORT}`);
    logger.info(`📚 API docs available at http://localhost:${PORT}/api-docs`);
    logger.info(`❤️  Health check at http://localhost:${PORT}/health`);
  });

  // Initialize Socket.IO
  initializeSocket(server);

  // ─── Graceful Shutdown ─────────────────────────────────
  const gracefulShutdown = async (signal: string) => {
    logger.info({ signal }, 'Received shutdown signal, starting graceful shutdown...');

    // Stop accepting new connections
    server.close(async () => {
      logger.info('HTTP server closed');



      logger.info('Graceful shutdown complete');
      process.exit(0);
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30_000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // ─── Unhandled Error Handlers ──────────────────────────
  process.on('unhandledRejection', (reason: unknown) => {
    logger.error({ reason }, 'Unhandled Promise Rejection');
  });

  process.on('uncaughtException', (error: Error) => {
    logger.fatal({ error }, 'Uncaught Exception — shutting down');
    process.exit(1);
  });
}

main().catch((error) => {
  logger.fatal({ error }, 'Failed to start server');
  process.exit(1);
});
