import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
}

/**
 * Get SMTP configuration for a specific account
 */
function getSMTPConfig(accountId: 'account1' | 'account2'): SMTPConfig | null {
  const prefix = accountId === 'account1' ? 'IMAP1' : 'IMAP2';
  
  // For Gmail, use smtp.gmail.com
  // If IMAP host is gmail, use Gmail SMTP, otherwise try to derive from IMAP host
  const imapHost = process.env[`${prefix}_HOST`]?.trim() || '';
  let host = 'smtp.gmail.com';
  if (imapHost.includes('gmail')) {
    host = 'smtp.gmail.com';
  } else if (imapHost) {
    // Try to derive SMTP host from IMAP host (e.g., imap.example.com -> smtp.example.com)
    host = imapHost.replace(/^imap\./, 'smtp.');
  }
  
  const user = process.env[`${prefix}_USER`]?.trim();
  const password = (process.env[`${prefix}_PASS`] || process.env[`${prefix}_PASSWORD`] || '').trim();
  
  // Gmail uses port 587 for TLS or 465 for SSL
  // Default to 587 (TLS) which is more common
  const port = parseInt(process.env[`${prefix}_SMTP_PORT`] || '587');
  const secure = port === 465; // Port 465 uses SSL, port 587 uses TLS

  if (!user || !password) {
    console.error(`❌ ${accountId}: Missing SMTP credentials (${prefix}_USER or ${prefix}_PASS)`);
    return null;
  }

  return {
    host,
    port,
    secure,
    user,
    password
  };
}

/**
 * Create SMTP transporter for an account
 */
function createTransporter(accountId: 'account1' | 'account2'): nodemailer.Transporter | null {
  const config = getSMTPConfig(accountId);
  if (!config) {
    return null;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure, // true for 465 (SSL), false for 587 (TLS)
      auth: {
        user: config.user,
        pass: config.password
      },
      // For Gmail, we need to allow less secure apps or use OAuth2
      // Since we're using app passwords, this should work
      tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false
      }
    });

    return transporter;
  } catch (error) {
    console.error(`❌ Error creating SMTP transporter for ${accountId}:`, error);
    return null;
  }
}

/**
 * Send email reply
 */
export async function sendEmailReply(
  accountId: 'account1' | 'account2',
  to: string,
  subject: string,
  replyBody: string,
  originalMessageId?: string
): Promise<boolean> {
  const transporter = createTransporter(accountId);
  if (!transporter) {
    console.error(`❌ Cannot send email reply: SMTP transporter not available for ${accountId}`);
    return false;
  }

  const config = getSMTPConfig(accountId);
  if (!config) {
    return false;
  }

  try {
    // Verify SMTP connection
    await transporter.verify();
    console.log(`✅ SMTP connection verified for ${accountId}`);

    // Prepare subject line (add Re: if not already present)
    const replySubject = subject.trim().toLowerCase().startsWith('re:') 
      ? subject 
      : `Re: ${subject}`;

    // Prepare email options
    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${config.user}" <${config.user}>`,
      to: to,
      subject: replySubject,
      text: replyBody,
      html: `<p>${replyBody.replace(/\n/g, '<br>')}</p>`,
      // Add inReplyTo and references for proper email threading
      ...(originalMessageId && {
        inReplyTo: `<${originalMessageId}>`,
        references: `<${originalMessageId}>`
      })
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email reply sent successfully from ${accountId} to ${to}`);
    console.log(`   Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending email reply from ${accountId}:`, error);
    if (error instanceof Error) {
      console.error(`   Error details: ${error.message}`);
    }
    return false;
  }
}

/**
 * Send auto-reply based on email category
 */
export async function sendAutoReply(
  accountId: 'account1' | 'account2',
  to: string,
  originalSubject: string,
  replyBody: string,
  originalMessageId?: string
): Promise<boolean> {
  if (!replyBody || !replyBody.trim()) {
    console.log(`ℹ️ Skipping auto-reply: Empty reply body`);
    return false;
  }

  return await sendEmailReply(accountId, to, originalSubject, replyBody, originalMessageId);
}

