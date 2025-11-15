import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export async function sendInterestedWebhooks(email: { subject: string; from: string }): Promise<void> {
  const slackWebhook = process.env.SLACK_WEBHOOK_URL;
  const interestedWebhook = process.env.INTERESTED_WEBHOOK_URL;
  
  const payload = {
    subject: email.subject,
    sender: email.from,
    timestamp: new Date().toISOString()
  };
  
  const promises: Promise<any>[] = [];
  
  if (slackWebhook) {
    promises.push(
      axios.post(slackWebhook, {
        text: `🎯 New Interested Lead!`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*New Interested Lead*\n\n*Subject:* ${email.subject}\n*From:* ${email.from}`
            }
          }
        ]
      }).catch((error: Error) => {
        console.error('❌ Slack webhook error:', error.message);
      })
    );
  }
  
  if (interestedWebhook) {
    promises.push(
      axios.post(interestedWebhook, payload).catch((error: Error) => {
        console.error('❌ Interested webhook error:', error.message);
      })
    );
  }
  
  await Promise.allSettled(promises);
  console.log('✅ Webhooks sent for interested email');
}

