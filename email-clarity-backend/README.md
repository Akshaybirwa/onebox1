# Email Clarity Backend

A complete Node.js + TypeScript backend for email management with IMAP sync, Elasticsearch search, and AI categorization.

## Features

- ✅ **IMAP Sync (2 accounts)**: Real-time email synchronization using IMAP IDLE
- ✅ **MongoDB Storage**: Persistent email storage with all required fields
- ✅ **Elasticsearch Search**: Full-text search across emails
- ✅ **AI Categorization**: Keyword-based email classification
- ✅ **Webhook Integration**: Automatic notifications for interested leads
- ✅ **RESTful API**: Complete API endpoints for frontend integration

## Prerequisites

- Node.js 18+ and npm
- MongoDB running on localhost:27017 (or configure via MONGODB_URI)
- Elasticsearch running on http://localhost:9200

## Installation

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

3. Update `.env` with your IMAP credentials and webhook URLs:
```env
# IMAP Account 1
IMAP1_HOST=imap.gmail.com
IMAP1_PORT=993
IMAP1_USER=your-email1@gmail.com
IMAP1_PASSWORD=your-app-password-1
IMAP1_SECURE=true

# IMAP Account 2
IMAP2_HOST=imap.gmail.com
IMAP2_PORT=993
IMAP2_USER=your-email2@gmail.com
IMAP2_PASSWORD=your-app-password-2
IMAP2_SECURE=true

# Webhooks
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
INTERESTED_WEBHOOK_URL=https://your-webhook-url.com/interested
```

## Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## API Endpoints

### Get All Emails
```
GET /api/emails
Query Parameters:
  - category: Filter by category (interested, not-interested, meetings, out-of-office, spam)
  - accountId: Filter by account (account1, account2)
  - folder: Filter by folder (INBOX, etc.)
  - limit: Number of results (default: 100)
  - skip: Number of results to skip (default: 0)
```

### Get Email by ID
```
GET /api/emails/:id?accountId=account1
```

### Search Emails
```
GET /api/emails/search/query?query=search+term
Query Parameters:
  - query: Search term (required)
  - folder: Filter by folder
  - accountId: Filter by account
```

### Get Statistics
```
GET /api/emails/stats/summary
Returns:
  - total: Total emails (last 30 days)
  - interested: Interested emails
  - notInterested: Not interested emails
  - meetings: Meeting emails
  - outOfOffice: Out of office emails
  - spam: Spam emails
```

### Health Check
```
GET /health
```

## Email Categorization

Emails are automatically categorized based on keyword matching:

- **Interested**: Contains "interested"
- **Meetings**: Contains "meeting" or "schedule"
- **Not Interested**: Contains "not interested", "no thanks", or "not a good fit"
- **Out of Office**: Contains "out of office", "out of the office", or "ooo"
- **Spam**: Default category for all other emails

## Webhook Integration

When an email is categorized as "Interested", the backend automatically sends POST requests to:
1. `SLACK_WEBHOOK_URL` - Slack notification
2. `INTERESTED_WEBHOOK_URL` - Custom webhook

Payload format:
```json
{
  "subject": "Email subject",
  "sender": "sender@example.com",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## IMAP Sync Behavior

- **On Startup**: Fetches last 30 days of emails from both accounts
- **Real-time**: Uses IMAP IDLE to process new emails immediately
- **No Cron Jobs**: All processing happens in real-time

## Project Structure

```
email-clarity-backend/
├── src/
│   ├── config/
│   │   ├── database.ts          # MongoDB connection
│   │   └── elasticsearch.ts     # Elasticsearch client & indexing
│   ├── models/
│   │   └── email.model.ts       # MongoDB email operations
│   ├── routes/
│   │   └── emails.routes.ts     # API routes
│   ├── services/
│   │   ├── imap.service.ts      # IMAP sync & IDLE
│   │   ├── categorization.service.ts  # AI categorization
│   │   └── webhook.service.ts   # Webhook notifications
│   ├── types/
│   │   └── email.ts             # TypeScript types
│   └── index.ts                 # Main server file
├── .env.example                 # Environment variables template
├── package.json
├── tsconfig.json
└── README.md
```

## Troubleshooting

### IMAP Connection Issues
- Ensure you're using app-specific passwords for Gmail
- Check firewall settings for IMAP ports
- Verify IMAP is enabled in your email account settings

### Elasticsearch Connection
- Ensure Elasticsearch is running: `curl http://localhost:9200`
- Check Elasticsearch logs for errors

### MongoDB Connection
- Ensure MongoDB is running: `mongosh`
- Check connection string in `.env`

## License

ISC

