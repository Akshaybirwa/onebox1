import { Router, Request, Response } from 'express';
import { getEmails, getEmailById, getEmailStats } from '../models/email.model';
import { searchEmails, indexEmail } from '../config/elasticsearch';

const router = Router();

// Get all emails with optional filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, accountId, folder, limit, skip } = req.query;
    
    console.log(`📧 Fetching emails with filters:`, { category, accountId, folder, limit, skip });
    
    const emails = await getEmails({
      category: category as string,
      accountId: accountId as string,
      folder: folder as string,
      limit: limit ? parseInt(limit as string) : undefined,
      skip: skip ? parseInt(skip as string) : undefined
    });

    console.log(`✅ Found ${emails.length} emails in database`);

    // Transform for frontend
    const transformedEmails = emails.map(email => ({
      id: email.id,
      sender: email.from,
      subject: email.subject,
      date: email.date.toISOString().split('T')[0],
      category: email.category,
      preview: email.preview || email.bodyText.substring(0, 150),
      body: email.bodyText,
      accountId: email.accountId // Include accountId for fetching by ID
    }));

    res.json(transformedEmails);
  } catch (error) {
    console.error('❌ Error fetching emails:', error);
    res.status(500).json({ error: 'Failed to fetch emails', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Search emails using Elasticsearch (MUST be before /:id route)
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { query, folder, accountId } = req.query;
    
    console.log(`🔍 Searching emails:`, { query, folder, accountId });
    
    if (!query) {
      return res.status(400).json({ error: 'query parameter is required' });
    }

    const results = await searchEmails(query as string, {
      folder: folder as string,
      accountId: accountId as string
    });

    console.log(`✅ Found ${results.length} search results`);

    // Transform for frontend
    const transformedEmails = results.map((email: any) => {
      // Handle date - could be Date object or string
      let dateStr: string;
      if (email.date instanceof Date) {
        dateStr = email.date.toISOString().split('T')[0];
      } else if (typeof email.date === 'string') {
        dateStr = new Date(email.date).toISOString().split('T')[0];
      } else {
        dateStr = new Date().toISOString().split('T')[0]; // Fallback to today
      }
      
      return {
        id: email.id,
        sender: email.from,
        subject: email.subject,
        date: dateStr,
        category: email.category,
        preview: email.preview || (email.bodyText ? email.bodyText.substring(0, 150) : ''),
        body: email.bodyText,
        accountId: email.accountId // Include accountId for fetching by ID
      };
    });

    res.json(transformedEmails);
  } catch (error) {
    console.error('❌ Error searching emails:', error);
    res.status(500).json({ error: 'Failed to search emails', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get email by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { accountId } = req.query;
    
    console.log(`📧 Fetching email by ID: ${id}, accountId: ${accountId}`);
    
    if (!accountId) {
      return res.status(400).json({ error: 'accountId is required' });
    }

    const email = await getEmailById(id, accountId as string);
    
    if (!email) {
      console.log(`⚠️ Email not found: ${id} for account ${accountId}`);
      return res.status(404).json({ error: 'Email not found' });
    }

    // Transform for frontend
    const transformedEmail = {
      id: email.id,
      sender: email.from,
      subject: email.subject,
      date: email.date.toISOString().split('T')[0],
      category: email.category,
      preview: email.preview || email.bodyText.substring(0, 150),
      body: email.bodyText
    };

    res.json(transformedEmail);
  } catch (error) {
    console.error('❌ Error fetching email:', error);
    res.status(500).json({ error: 'Failed to fetch email', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get email statistics
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.query;
    console.log(`📊 Fetching email statistics${accountId ? ` for account: ${accountId}` : ' (all accounts)'}`);
    const stats = await getEmailStats(accountId as string | undefined);
    console.log(`✅ Stats:`, stats);
    res.json(stats);
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Manual sync endpoint (for testing)
router.post('/sync', async (req: Request, res: Response) => {
  try {
    console.log(`🔄 Manual sync requested`);
    const { initializeIMAPAccounts } = await import('../services/imap.service');
    const accounts = await initializeIMAPAccounts();
    res.json({ 
      message: 'Sync initiated', 
      accountsConnected: accounts.length,
      note: 'Check server logs for sync progress'
    });
  } catch (error) {
    console.error('❌ Error initiating sync:', error);
    res.status(500).json({ error: 'Failed to initiate sync', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Re-index all emails from MongoDB to Elasticsearch
router.post('/reindex', async (req: Request, res: Response) => {
  try {
    console.log(`🔄 Re-indexing all emails from MongoDB to Elasticsearch...`);
    
    // Get all emails from MongoDB
    const allEmails = await getEmails({});
    console.log(`📧 Found ${allEmails.length} emails in MongoDB`);
    
    if (allEmails.length === 0) {
      return res.json({ 
        message: 'No emails to re-index', 
        indexed: 0,
        total: 0
      });
    }
    
    // Index each email
    let indexed = 0;
    let errors = 0;
    
    for (const email of allEmails) {
      try {
        await indexEmail(email);
        indexed++;
        if (indexed % 10 === 0) {
          console.log(`   Progress: ${indexed}/${allEmails.length} emails indexed...`);
        }
      } catch (error) {
        errors++;
        console.error(`❌ Error indexing email ${email.id}:`, error);
      }
    }
    
    console.log(`✅ Re-indexing complete: ${indexed} indexed, ${errors} errors`);
    
    res.json({ 
      message: 'Re-indexing complete', 
      indexed,
      errors,
      total: allEmails.length
    });
  } catch (error) {
    console.error('❌ Error re-indexing emails:', error);
    res.status(500).json({ error: 'Failed to re-index emails', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
