import { getDatabase } from '../config/database';
import { EmailDocument } from '../types/email';

const COLLECTION_NAME = 'emails';

export async function saveEmail(email: EmailDocument): Promise<EmailDocument> {
  const db = getDatabase();
  const collection = db.collection<EmailDocument>(COLLECTION_NAME);
  
  // Use messageId (id) + accountId for duplicate prevention
  const existing = await collection.findOne({ 
    id: email.id, 
    accountId: email.accountId 
  });
  
  const now = new Date();
  
  if (existing) {
    // Update existing email
    const updated = {
      ...email,
      updatedAt: now
    };
    await collection.updateOne(
      { _id: existing._id },
      { 
        $set: updated
      }
    );
    console.log(`🔄 Updated existing email: ${email.id} (Account: ${email.accountId})`);
    return { ...existing, ...updated };
  } else {
    // Insert new email
    const emailWithTimestamps = {
      ...email,
      createdAt: now,
      updatedAt: now
    };
    const result = await collection.insertOne(emailWithTimestamps);
    console.log(`✨ Inserted new email: ${email.id} (Account: ${email.accountId}, Category: ${email.category})`);
    return { ...emailWithTimestamps, _id: result.insertedId };
  }
}

export async function getEmails(
  filter: {
    category?: string;
    accountId?: string;
    folder?: string;
    limit?: number;
    skip?: number;
  } = {}
): Promise<EmailDocument[]> {
  const db = getDatabase();
  const collection = db.collection<EmailDocument>(COLLECTION_NAME);
  
  const query: any = {};
  if (filter.category) query.category = filter.category;
  if (filter.accountId) query.accountId = filter.accountId;
  if (filter.folder) query.folder = filter.folder;
  
  const limit = filter.limit || 100;
  const skip = filter.skip || 0;
  
  return collection
    .find(query)
    .sort({ date: -1 })
    .limit(limit)
    .skip(skip)
    .toArray();
}

export async function getEmailById(id: string, accountId: string): Promise<EmailDocument | null> {
  const db = getDatabase();
  const collection = db.collection<EmailDocument>(COLLECTION_NAME);
  return collection.findOne({ id, accountId });
}

export async function getEmailStats(accountId?: string): Promise<{
  total: number;
  interested: number;
  notInterested: number;
  meetings: number;
  outOfOffice: number;
  spam: number;
}> {
  const db = getDatabase();
  const collection = db.collection<EmailDocument>(COLLECTION_NAME);
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Build base query with date filter
  const baseQuery: any = { date: { $gte: thirtyDaysAgo } };
  
  // Add accountId filter if provided
  if (accountId) {
    baseQuery.accountId = accountId;
  }
  
  // Build category-specific queries
  const interestedQuery = { ...baseQuery, category: 'interested' };
  const notInterestedQuery = { ...baseQuery, category: 'not-interested' };
  const meetingsQuery = { ...baseQuery, category: 'meetings' };
  const outOfOfficeQuery = { ...baseQuery, category: 'out-of-office' };
  const spamQuery = { ...baseQuery, category: 'spam' };
  
  const [total, interested, notInterested, meetings, outOfOffice, spam] = await Promise.all([
    collection.countDocuments(baseQuery),
    collection.countDocuments(interestedQuery),
    collection.countDocuments(notInterestedQuery),
    collection.countDocuments(meetingsQuery),
    collection.countDocuments(outOfOfficeQuery),
    collection.countDocuments(spamQuery)
  ]);
  
  return {
    total,
    interested,
    notInterested,
    meetings,
    outOfOffice,
    spam
  };
}

