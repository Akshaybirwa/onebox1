import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDatabase(): Promise<Db> {
  if (db) {
    return db;
  }

  // Use 127.0.0.1 instead of localhost to avoid IPv6 issues on Windows
  const defaultUri = 'mongodb://127.0.0.1:27017/emailbox';
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || defaultUri;
  
  // Extract database name from URI or use default "emailbox"
  let dbName = 'emailbox';
  if (uri.includes('/')) {
    const uriParts = uri.split('/');
    if (uriParts.length > 3) {
      const lastPart = uriParts[uriParts.length - 1];
      const extractedName = lastPart.split('?')[0]; // Remove query params
      if (extractedName && extractedName.trim() !== '') {
        dbName = extractedName;
      }
    }
  }
  
  // Replace localhost with 127.0.0.1 if not using a custom URI
  const finalUri = uri.includes('localhost') && !process.env.MONGODB_URI && !process.env.MONGO_URI
    ? uri.replace('localhost', '127.0.0.1')
    : uri;
  
  try {
    console.log(`🔌 Connecting to MongoDB: ${finalUri.replace(/:[^:@]+@/, ':****@')}`); // Hide password
    client = new MongoClient(finalUri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      connectTimeoutMS: 10000,
    });
    
    await client.connect();
    db = client.db(dbName);
    console.log(`✅ Connected to MongoDB database: ${dbName}`);
    
    // Test the connection
    const collections = await db.listCollections().toArray();
    console.log(`📁 Found ${collections.length} collections in database`);
    
    return db;
  } catch (error: any) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('💡 Make sure MongoDB is running. You can:');
    console.error('   1. Install MongoDB: https://www.mongodb.com/try/download/community');
    console.error('   2. Start MongoDB service: net start MongoDB (Windows)');
    console.error('   3. Or use MongoDB Atlas (cloud): Update MONGODB_URI in .env');
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('MongoDB connection closed');
  }
}

export function getDatabase(): Db {
  if (!db) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return db;
}

