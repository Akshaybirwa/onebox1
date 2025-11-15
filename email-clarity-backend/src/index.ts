import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase, closeDatabase } from './config/database';
import { initializeElasticsearchIndex } from './config/elasticsearch';
import { initializeIMAPAccounts, IMAPService } from './services/imap.service';
import emailRoutes from './routes/emails.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`, req.query ? `Query: ${JSON.stringify(req.query)}` : '');
  next();
});

// Routes
app.use('/api/emails', emailRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize services
let imapAccounts: IMAPService[] = [];

async function startServer() {
  try {
    // Connect to MongoDB
    await connectDatabase();
    
    // Initialize Elasticsearch
    await initializeElasticsearchIndex();
    
    // Start Express server FIRST (so API is available even if IMAP fails)
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}/api/emails`);
    });
    
    // Initialize IMAP accounts (non-blocking)
    try {
      imapAccounts = await initializeIMAPAccounts();
      console.log(`📧 IMAP accounts connected: ${imapAccounts.length}`);
    } catch (error) {
      console.error('⚠️ IMAP initialization failed, but server is running:', error);
      // Server continues to run even if IMAP fails
    }
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    // Only exit if critical services fail
    if (error instanceof Error && error.message.includes('MongoDB')) {
      process.exit(1);
    }
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  
  // Disconnect IMAP accounts
  for (const account of imapAccounts) {
    await account.disconnect();
  }
  
  // Close database connection
  await closeDatabase();
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  
  // Disconnect IMAP accounts
  for (const account of imapAccounts) {
    await account.disconnect();
  }
  
  // Close database connection
  await closeDatabase();
  
  process.exit(0);
});

startServer();

