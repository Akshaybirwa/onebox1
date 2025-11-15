import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { saveEmail } from '../models/email.model';
import { indexEmail } from '../config/elasticsearch';
import { classifyEmail } from './categorization.service';
import { sendInterestedWebhooks } from './webhook.service';
import { generateAIReply } from './ai-reply.service';
import { sendAutoReply } from './email-sender.service';
import { EmailDocument } from '../types/email';

interface IMAPConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  secure: boolean;
  accountId: string;
}

export class IMAPService {
  private client: ImapFlow | null = null;
  private config: IMAPConfig;
  private isIdleActive: boolean = false;
  private idleReconnectTimer: NodeJS.Timeout | null = null;
  private existsHandler: ((data: { path: string; count: number }) => Promise<void>) | null = null;

  constructor(config: IMAPConfig) {
    this.config = config;
  }

  // Getter for client to check connection status
  getClient(): ImapFlow | null {
    return this.client;
  }

  getAccountId(): string {
    return this.config.accountId;
  }

  async connect(): Promise<void> {
    try {
      console.log(`   Connecting to ${this.config.host}:${this.config.port} as ${this.config.user}...`);
      console.log(`   Account ID: ${this.config.accountId}`);
      
      this.client = new ImapFlow({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: {
          user: this.config.user,
          pass: this.config.password
        },
        logger: false
      });

      // Handle connection errors and IDLE reconnection
      this.client.on('error', (error: Error) => {
        console.error(`❌ IMAP error for ${this.config.accountId}:`, error.message);
        
        // If IDLE was active, mark it as inactive and attempt to reconnect
        if (this.isIdleActive) {
          console.log(`⚠️ IDLE interrupted for ${this.config.accountId} due to error`);
          this.isIdleActive = false;
          
          // Attempt to reconnect IDLE after a delay
          if (this.idleReconnectTimer) {
            clearTimeout(this.idleReconnectTimer);
          }
          
          this.idleReconnectTimer = setTimeout(async () => {
            if (this.client && !this.isIdleActive) {
              console.log(`🔄 Attempting to restart IDLE for ${this.config.accountId}...`);
              await this.startIdle();
            }
          }, 5000);
        }
      });

      await this.client.connect();
      console.log(`✅ Connected to IMAP: ${this.config.accountId} (${this.config.user})`);
    } catch (error) {
      console.error(`❌ IMAP connection error for ${this.config.accountId}:`, error);
      if (error instanceof Error) {
        console.error(`   Error details: ${error.message}`);
        if (error.message.includes('authentication') || error.message.includes('Invalid credentials') || error.message.includes('LOGIN failed')) {
          console.error(`   ⚠️ Authentication failed - check password for ${this.config.user}`);
          console.error(`   ⚠️ Make sure you're using an App Password (not regular password) for Gmail`);
        }
      }
      // Don't throw - allow server to start even if IMAP fails
      this.client = null;
    }
  }

  async syncInitialEmails(): Promise<void> {
    if (!this.client) {
      console.warn(`⚠️ IMAP client not connected for ${this.config.accountId}, skipping sync`);
      return;
    }

    console.log(`📥 Starting initial email sync for ${this.config.accountId}...`);

    try {
      console.log(`   Acquiring mailbox lock for ${this.config.accountId}...`);
      const lock = await this.client.getMailboxLock('INBOX');
      try {
        // Get emails from last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        console.log(`   Searching for emails since ${thirtyDaysAgo.toISOString().split('T')[0]}...`);
        const messages = await this.client.search({
          since: thirtyDaysAgo
        });

        // Handle case where search returns false
        const messageList = Array.isArray(messages) ? messages : [];
        console.log(`📧 Found ${messageList.length} emails for ${this.config.accountId}`);

        if (messageList.length === 0) {
          console.log(`ℹ️ No emails found for ${this.config.accountId} in the last 30 days`);
          return;
        }

        // Process in batches to avoid overwhelming the system
        const batchSize = 5;
        let processedCount = 0;
        
        for (let i = 0; i < messageList.length; i += batchSize) {
          const batch = messageList.slice(i, i + batchSize);
          console.log(`📦 ${this.config.accountId}: Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(messageList.length / batchSize)} (${batch.length} emails)`);
          
          await Promise.all(
            batch.map((uid: number) => this.processEmail(uid))
          );
          
          processedCount += batch.length;
          console.log(`✅ ${this.config.accountId}: Processed ${processedCount}/${messageList.length} emails`);
        }

        console.log(`✅ Initial sync completed for ${this.config.accountId} - ${processedCount} emails processed`);
      } finally {
        lock.release();
        console.log(`   Released mailbox lock for ${this.config.accountId}`);
      }
    } catch (error) {
      console.error(`❌ Error syncing initial emails for ${this.config.accountId}:`, error);
      if (error instanceof Error) {
        console.error(`   Error details: ${error.message}`);
      }
      // Don't throw - allow server to continue
    }
  }

  async startIdle(): Promise<void> {
    if (!this.client) {
      console.warn(`⚠️ Cannot start IDLE for ${this.config.accountId} - client not connected`);
      return;
    }

    if (this.isIdleActive) {
      console.log(`ℹ️ IDLE already active for ${this.config.accountId}`);
      return;
    }

    try {
      const lock = await this.client.getMailboxLock('INBOX');
      try {
        this.isIdleActive = true;
        console.log(`🔄 Starting IDLE for ${this.config.accountId} (real-time email monitoring)...`);

        // Get current message count
        const status = await this.client.status('INBOX', { messages: true });
        let lastCount = status.messages || 0;
        console.log(`   Current INBOX count for ${this.config.accountId}: ${lastCount} messages`);

        // Set up event listener for new messages (only once)
        // Remove any existing handler first
        if (this.existsHandler) {
          this.client.removeListener('exists', this.existsHandler);
        }
        
        this.existsHandler = async (data: { path: string; count: number }) => {
          if (data.path === 'INBOX' && data.count > lastCount) {
            const newCount = data.count;
            const newEmailCount = newCount - lastCount;
            console.log(`📬 ${newEmailCount} new email(s) detected for ${this.config.accountId} (total: ${newCount})`);
            
            // Process new emails
            try {
              const processLock = await this.client!.getMailboxLock('INBOX');
              try {
                // Get UIDs of new messages using sequence numbers
                const messages = await this.client!.search({ 
                  seq: `${lastCount + 1}:${newCount}` 
                });
                
                const messageList = Array.isArray(messages) ? messages : [];
                console.log(`   Processing ${messageList.length} new email(s) for ${this.config.accountId}...`);
                
                for (const uid of messageList) {
                  await this.processEmail(uid);
                }
                
                lastCount = newCount;
                console.log(`✅ Processed ${messageList.length} new email(s) for ${this.config.accountId}`);
              } finally {
                processLock.release();
              }
            } catch (error) {
              console.error(`❌ Error processing new emails for ${this.config.accountId}:`, error);
            }
          }
        };

        this.client.on('exists', this.existsHandler);

        // Note: Error handler is already set up in connect() method
        // IDLE errors will be handled by the existing error handler

        // Start IDLE (returns true if successful)
        const idleStarted = await this.client.idle();
        
        if (!idleStarted) {
          console.warn(`⚠️ IDLE not started for ${this.config.accountId} - will retry`);
          this.isIdleActive = false;
          lock.release();
          
          // Retry after 3 seconds
          setTimeout(async () => {
            if (this.client && !this.isIdleActive) {
              await this.startIdle();
            }
          }, 3000);
        } else {
          console.log(`✅ IDLE active for ${this.config.accountId} - monitoring for new emails in real-time`);
          lock.release();
        }
      } catch (error) {
        lock.release();
        console.error(`❌ Error starting IDLE for ${this.config.accountId}:`, error);
        this.isIdleActive = false;
        
        // Retry after 5 seconds
        setTimeout(async () => {
          if (this.client && !this.isIdleActive) {
            await this.startIdle();
          }
        }, 5000);
      }
    } catch (error) {
      console.error(`❌ Error acquiring lock for IDLE ${this.config.accountId}:`, error);
      this.isIdleActive = false;
      
      // Retry after 5 seconds
      setTimeout(async () => {
        if (this.client && !this.isIdleActive) {
          await this.startIdle();
        }
      }, 5000);
    }
  }

  private async processEmail(uid: number): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      // Fetch email
      const message = await this.client.fetchOne(uid, { 
        envelope: true, 
        bodyStructure: true,
        source: true 
      });

      if (!message || !message.source) {
        console.warn(`⚠️ No message or source for UID ${uid}`);
        return;
      }

      // Parse email
      const parsed = await simpleParser(message.source);
      
      // Extract body text
      const bodyText = parsed.text || parsed.html?.replace(/<[^>]*>/g, '') || '';
      const preview = bodyText.substring(0, 150) + (bodyText.length > 150 ? '...' : '');

      // Extract sender email
      const fromEmail = parsed.from?.value?.[0]?.address || parsed.from?.text || '';

      // Classify email using improved classification function
      const category = classifyEmail(
        parsed.subject || '',
        bodyText,
        fromEmail
      );

      // Use messageId if available, otherwise use uid as fallback
      // messageId is unique across accounts and better for duplicate prevention
      const messageId = parsed.messageId || `${this.config.accountId}_${uid}`;
      const emailId = messageId.replace(/[<>]/g, ''); // Remove angle brackets from messageId

      // Create email document
      const emailDoc: EmailDocument = {
        id: emailId,
        from: parsed.from?.text || parsed.from?.value?.[0]?.address || '',
        to: parsed.to?.text || (parsed.to?.value?.map((v: any) => v.address).join(', ')) || '',
        subject: parsed.subject || '(No Subject)',
        bodyText: bodyText,
        folder: 'INBOX',
        date: parsed.date || new Date(),
        accountId: this.config.accountId,
        category: category,
        preview: preview
      };

      // Save to MongoDB using the saveEmail function
      await this.saveEmail(emailDoc);

      // Index in Elasticsearch
      try {
        await indexEmail(emailDoc);
        console.log(`🔍 Indexed email in Elasticsearch: ${emailDoc.subject.substring(0, 50)}`);
      } catch (error) {
        console.error(`❌ Error indexing email in Elasticsearch:`, error);
      }

      // Send webhooks if interested
      if (category === 'interested') {
        await sendInterestedWebhooks({
          subject: emailDoc.subject,
          from: emailDoc.from
        });
      }

      // Send auto-reply based on category
      // Skip spam and meetings categories
      if (category !== 'spam' && category !== 'meetings') {
        try {
          // Generate AI reply
          const replyBody = await generateAIReply(
            category,
            emailDoc.subject,
            emailDoc.bodyText,
            fromEmail
          );

          if (replyBody && replyBody.trim()) {
            // Extract recipient email (the sender of the original email)
            const recipientEmail = fromEmail;
            
            // Send auto-reply
            const replySent = await sendAutoReply(
              this.config.accountId as 'account1' | 'account2',
              recipientEmail,
              emailDoc.subject,
              replyBody,
              emailDoc.id
            );

            if (replySent) {
              console.log(`📧 Auto-reply sent for category "${category}" to ${recipientEmail}`);
            } else {
              console.warn(`⚠️ Failed to send auto-reply for category "${category}" to ${recipientEmail}`);
            }
          } else {
            console.log(`ℹ️ No auto-reply generated for category "${category}"`);
          }
        } catch (error) {
          console.error(`❌ Error sending auto-reply:`, error);
          // Don't throw - continue processing even if auto-reply fails
        }
      } else {
        console.log(`ℹ️ Skipping auto-reply for category "${category}"`);
      }

      console.log(`✅ Processed email: ${emailDoc.subject.substring(0, 50)} (${category})`);
    } catch (error) {
      console.error(`❌ Error processing email ${uid} for ${this.config.accountId}:`, error);
    }
  }

  /**
   * Save email to MongoDB
   * Prevents duplicates using messageId (id) + accountId
   */
  private async saveEmail(email: EmailDocument): Promise<void> {
    try {
      const { saveEmail: saveEmailToDB } = await import('../models/email.model');
      
      // Check if email exists and save/update
      const savedEmail = await saveEmailToDB(email);
      
      if (savedEmail) {
        console.log(`💾 Saved email to MongoDB: "${email.subject.substring(0, 50)}" (ID: ${email.id}, Account: ${email.accountId})`);
      }
    } catch (error) {
      console.error(`❌ Error saving email to MongoDB:`, error);
      throw error; // Re-throw to allow caller to handle
    }
  }

  async disconnect(): Promise<void> {
    if (this.idleReconnectTimer) {
      clearTimeout(this.idleReconnectTimer);
      this.idleReconnectTimer = null;
    }
    
    if (this.client) {
      this.isIdleActive = false;
      await this.client.logout();
      this.client = null;
      console.log(`✅ Disconnected from IMAP: ${this.config.accountId}`);
    }
  }

  // Get IDLE status
  isIdleRunning(): boolean {
    return this.isIdleActive;
  }
}

/**
 * Get IMAP configuration for a specific account
 */
function getIMAPConfig(accountId: 'account1' | 'account2'): IMAPConfig | null {
  const prefix = accountId === 'account1' ? 'IMAP1' : 'IMAP2';
  
  const host = process.env[`${prefix}_HOST`]?.trim();
  const user = process.env[`${prefix}_USER`]?.trim();
  
  console.log(`🔍 Checking configuration for ${accountId}:`);
  console.log(`   ${prefix}_HOST: ${host ? '✓' : '✗'}`);
  console.log(`   ${prefix}_USER: ${user ? '✓' : '✗'}`);
  
  if (!host || !user) {
    console.error(`❌ ${accountId}: Missing IMAP configuration (${prefix}_HOST or ${prefix}_USER)`);
    return null;
  }

  const port = parseInt(process.env[`${prefix}_PORT`] || '993');
  const password = (process.env[`${prefix}_PASSWORD`] || process.env[`${prefix}_PASS`] || '').trim();
  const secure = process.env[`${prefix}_SECURE`] === 'true' || process.env[`${prefix}_TLS`] === 'true';

  console.log(`   ${prefix}_PORT: ${port}`);
  console.log(`   ${prefix}_PASS: ${password ? `✓ (${password.length} chars)` : '✗ MISSING'}`);
  console.log(`   ${prefix}_TLS: ${secure}`);
  
  // Debug: Check which env var was used
  if (process.env[`${prefix}_PASSWORD`]) {
    console.log(`   Using ${prefix}_PASSWORD from env`);
  } else if (process.env[`${prefix}_PASS`]) {
    console.log(`   Using ${prefix}_PASS from env`);
  }

  if (!password) {
    console.error(`❌ ${accountId}: Missing IMAP password (${prefix}_PASSWORD or ${prefix}_PASS)`);
    return null;
  }

  return {
    host,
    port,
    user,
    password,
    secure,
    accountId
  };
}

/**
 * Start IMAP sync for a specific account
 */
async function startIMAP(accountId: 'account1' | 'account2'): Promise<IMAPService | null> {
  console.log(`\n🔄 Starting IMAP sync for ${accountId}...`);
  
  const config = getIMAPConfig(accountId);
  if (!config) {
    console.error(`❌ Skipping ${accountId} - configuration not found or invalid`);
    return null;
  }

  try {
    console.log(`📡 Creating IMAP service for ${accountId} (${config.user})...`);
    const account = new IMAPService(config);
    
    // Connect to IMAP
    console.log(`🔌 Connecting to IMAP server for ${accountId}...`);
    await account.connect();
    
    // Check if connection was successful
    const client = account.getClient();
    if (!client) {
      console.error(`❌ ${accountId}: Connection failed - client is null`);
      return null;
    }

    console.log(`✅ ${accountId}: Connected successfully, starting email sync...`);

    // Sync initial emails
    try {
      await account.syncInitialEmails();
      console.log(`✅ ${accountId}: Initial email sync completed`);
    } catch (syncError) {
      console.error(`❌ ${accountId}: Error during initial sync:`, syncError);
      // Continue anyway - might still work for IDLE
    }
    
    // Start IDLE for real-time updates (non-blocking)
    // Don't await - let it start in background so account2 can initialize immediately
    account.startIdle().then(() => {
      console.log(`✅ ${accountId}: IDLE started for real-time updates`);
    }).catch((idleError) => {
      console.error(`❌ ${accountId}: Error starting IDLE:`, idleError);
      // Continue anyway - sync still works
    });
    
    console.log(`✅ ${accountId}: IMAP sync initialized successfully\n`);
    return account;
  } catch (error) {
    console.error(`❌ Failed to initialize ${accountId}:`, error);
    if (error instanceof Error) {
      console.error(`   Error message: ${error.message}`);
      console.error(`   Error stack: ${error.stack}`);
    }
    return null;
  }
}

/**
 * Initialize all IMAP accounts
 */
export async function initializeIMAPAccounts(): Promise<IMAPService[]> {
  const accounts: IMAPService[] = [];

  console.log('\n' + '='.repeat(60));
  console.log('📧 INITIALIZING IMAP ACCOUNTS');
  console.log('='.repeat(60));

  // Start account1
  console.log('\n📧 [1/2] Initializing IMAP Account 1...');
  const account1 = await startIMAP('account1');
  if (account1) {
    accounts.push(account1);
    console.log(`✅ Account1 added to active accounts list`);
  } else {
    console.error(`❌ Account1 failed to initialize - check configuration`);
  }

  // Small delay between accounts to avoid rate limiting
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Start account2
  console.log('\n📧 [2/2] Initializing IMAP Account 2...');
  const account2 = await startIMAP('account2');
  if (account2) {
    accounts.push(account2);
    console.log(`✅ Account2 added to active accounts list`);
  } else {
    console.error(`❌ Account2 failed to initialize - check configuration`);
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ IMAP INITIALIZATION COMPLETE`);
  console.log(`   Total accounts connected: ${accounts.length}/2`);
  
  // Wait a moment for IDLE to start, then show status
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  if (accounts.length === 2) {
    const account1 = accounts.find(a => a.getAccountId() === 'account1');
    const account2 = accounts.find(a => a.getAccountId() === 'account2');
    
    console.log(`   ✓ Account1: Connected ${account1?.isIdleRunning() ? '& IDLE Active' : '(IDLE starting...)'}`);
    console.log(`   ✓ Account2: Connected ${account2?.isIdleRunning() ? '& IDLE Active' : '(IDLE starting...)'}`);
    console.log(`\n📧 Real-time email monitoring: ${accounts.filter(a => a.isIdleRunning()).length}/2 accounts in IDLE mode`);
    console.log(`📥 Initial sync: Fetched last 30 days of emails from both accounts`);
  } else if (accounts.length === 1) {
    const activeAccount = accounts[0];
    const inactiveAccount = activeAccount.getAccountId() === 'account1' ? 'account2' : 'account1';
    console.log(`   ✓ ${activeAccount.getAccountId()}: Connected ${activeAccount.isIdleRunning() ? '& IDLE Active' : '(IDLE starting...)'}`);
    console.log(`   ✗ ${inactiveAccount}: Failed`);
  } else {
    console.log(`   ✗ Account1: Failed`);
    console.log(`   ✗ Account2: Failed`);
  }
  console.log('='.repeat(60));
  console.log(`\n💡 Both accounts are now monitoring for new emails in real-time via IMAP IDLE`);
  console.log(`   New emails will appear in the backend within seconds of arrival\n`);
  
  return accounts;
}

