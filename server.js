// server.js
import http from 'http';
import app from './app.js';
import connectDB from './config/db.js';
import { config } from './config/index.js';

const server = http.createServer(app);

const start = async () => {
  try {
    await connectDB();
    server.listen(config.port, () => {
      console.log(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.info('SIGTERM received. Shutting down gracefully.');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});
