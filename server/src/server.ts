import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { config } from './config/env.js';

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    const app = createApp();

    const server = app.listen(config.port, () => {
      console.log(`=======================================================`);
      console.log(`🚀 InterviewAI Server running on port ${config.port}`);
      console.log(`   Environment: ${config.nodeEnv}`);
      console.log(`   AI Provider: ${config.llmProvider} (${config.llmModel})`);
      console.log(`   API URL:     http://localhost:${config.port}/api`);
      console.log(`=======================================================`);
    });

    const shutdown = () => {
      console.log('\nGracefully shutting down InterviewAI server...');
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
