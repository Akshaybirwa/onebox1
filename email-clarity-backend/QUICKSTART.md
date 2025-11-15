# Quick Start Guide

## Prerequisites Setup

### 1. MongoDB
```bash
# Install MongoDB (if not installed)
# macOS: brew install mongodb-community
# Ubuntu: sudo apt-get install mongodb
# Windows: Download from https://www.mongodb.com/try/download/community

# Start MongoDB
mongod
```

### 2. Elasticsearch
```bash
# Install Elasticsearch (if not installed)
# macOS: brew install elasticsearch
# Ubuntu: sudo apt-get install elasticsearch
# Windows: Download from https://www.elastic.co/downloads/elasticsearch

# Start Elasticsearch
elasticsearch
# Or on macOS with Homebrew:
brew services start elasticsearch

# Verify it's running
curl http://localhost:9200
```

## Backend Setup

1. **Install dependencies:**
```bash
cd email-clarity-backend
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your IMAP credentials
```

3. **For Gmail IMAP:**
   - Enable 2-factor authentication
   - Generate an App Password: https://myaccount.google.com/apppasswords
   - Use the app password in `IMAP1_PASSWORD` and `IMAP2_PASSWORD`

4. **Start the server:**
```bash
npm run dev
```

The server will:
- Connect to MongoDB
- Initialize Elasticsearch index
- Connect to both IMAP accounts
- Fetch last 30 days of emails
- Start IDLE for real-time email processing

## API Testing

### Get All Emails
```bash
curl http://localhost:3001/api/emails
```

### Get Emails by Category
```bash
curl http://localhost:3001/api/emails?category=interested
```

### Search Emails
```bash
curl "http://localhost:3001/api/emails/search?query=partnership"
```

### Get Statistics
```bash
curl http://localhost:3001/api/emails/stats/summary
```

## Frontend Integration

Update your frontend to use the backend API:

```typescript
// Example: src/services/api.ts
const API_BASE = 'http://localhost:3001/api';

export const fetchEmails = async (category?: string) => {
  const url = category 
    ? `${API_BASE}/emails?category=${category}`
    : `${API_BASE}/emails`;
  const response = await fetch(url);
  return response.json();
};

export const searchEmails = async (query: string) => {
  const response = await fetch(`${API_BASE}/emails/search?query=${encodeURIComponent(query)}`);
  return response.json();
};

export const fetchStats = async () => {
  const response = await fetch(`${API_BASE}/emails/stats/summary`);
  return response.json();
};
```

## Troubleshooting

### IMAP Connection Fails
- Verify IMAP is enabled in your email account
- Check firewall settings
- For Gmail: Use app-specific passwords, not your regular password
- Verify port numbers (993 for SSL, 143 for non-SSL)

### Elasticsearch Not Found
- Ensure Elasticsearch is running: `curl http://localhost:9200`
- Check Elasticsearch logs for errors
- Verify ELASTICSEARCH_URL in .env

### MongoDB Connection Error
- Ensure MongoDB is running: `mongosh`
- Check MONGODB_URI in .env
- Verify MongoDB is accessible on the configured port

### No Emails Syncing
- Check server logs for IMAP connection status
- Verify IMAP credentials are correct
- Check if emails exist in the INBOX folder
- Review IDLE connection status in logs

