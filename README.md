# Email Clarity

A comprehensive email management system with intelligent categorization, real-time IMAP synchronization, full-text search, and AI-powered auto-replies. Built with Node.js/TypeScript backend and React/TypeScript frontend.

## 🚀 Features

### Backend Features
- ✅ **IMAP Sync (2 accounts)**: Real-time email synchronization using IMAP IDLE
- ✅ **MongoDB Storage**: Persistent email storage with all required fields
- ✅ **Elasticsearch Search**: Full-text search across all emails
- ✅ **AI Categorization**: Intelligent email classification into categories (interested, not-interested, meetings, out-of-office, spam, inbox)
- ✅ **AI Auto-Reply**: **Powered by Google Gemini API** - Automatically generates and sends contextual replies based on email categories
- ✅ **Webhook Integration**: Automatic notifications for interested leads via Slack and custom webhooks
- ✅ **RESTful API**: Complete API endpoints for frontend integration

### Frontend Features
- ✅ **Modern UI**: Built with React, TypeScript, and shadcn/ui components
- ✅ **Email Dashboard**: View emails by category with filtering and search
- ✅ **Email Viewer**: Full email viewing with body content
- ✅ **Statistics Dashboard**: Real-time email statistics and analytics
- ✅ **Account Management**: Support for multiple email accounts
- ✅ **Responsive Design**: Works on desktop and mobile devices

## 📋 Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB
- **Search Engine**: Elasticsearch
- **Email Sync**: IMAPflow (IMAP IDLE)
- **Email Parsing**: Mailparser
- **Email Sending**: Nodemailer
- **AI Integration**: **Google Gemini API** (for auto-reply generation)
- **Other**: dotenv, cors, axios

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn/ui (Radix UI components)
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **State Management**: TanStack Query (React Query)
- **Icons**: Lucide React
- **Charts**: Recharts

## 🏗️ Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   React UI      │────────▶│  Express API    │
│   (Frontend)    │         │   (Backend)     │
└─────────────────┘         └─────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
            ┌───────▼──────┐  ┌──────▼──────┐  ┌────▼──────┐
            │   MongoDB    │  │Elasticsearch│  │  IMAP     │
            │  (Storage)   │  │  (Search)   │  │  (Sync)   │
            └──────────────┘  └─────────────┘  └───────────┘
                                     │
                            ┌────────▼─────────┐
                            │  Gemini API      │
                            │  (Auto-Reply)    │
                            └──────────────────┘
```

## 📁 Project Structure

```
outbox/
├── email-clarity-backend/          # Backend service
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts         # MongoDB connection
│   │   │   └── elasticsearch.ts    # Elasticsearch client & indexing
│   │   ├── models/
│   │   │   └── email.model.ts      # MongoDB email operations
│   │   ├── routes/
│   │   │   └── emails.routes.ts    # API routes
│   │   ├── services/
│   │   │   ├── imap.service.ts     # IMAP sync & IDLE
│   │   │   ├── categorization.service.ts  # Email classification
│   │   │   ├── ai-reply.service.ts # Gemini API auto-reply
│   │   │   ├── email-sender.service.ts    # Email sending
│   │   │   └── webhook.service.ts  # Webhook notifications
│   │   ├── types/
│   │   │   └── email.ts            # TypeScript types
│   │   └── index.ts                # Main server file
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── email-clarity-ui/               # Frontend application
│   ├── src/
│   │   ├── api/
│   │   │   └── emails.ts           # API client
│   │   ├── components/
│   │   │   ├── EmailList.tsx       # Email list component
│   │   │   ├── EmailViewer.tsx     # Email viewer component
│   │   │   ├── DashboardSidebar.tsx # Sidebar navigation
│   │   │   ├── StatsCards.tsx      # Statistics display
│   │   │   ├── SearchBar.tsx       # Search functionality
│   │   │   └── ui/                 # shadcn/ui components
│   │   ├── pages/
│   │   │   ├── Index.tsx           # Main dashboard
│   │   │   └── NotFound.tsx        # 404 page
│   │   ├── config/
│   │   │   └── api.ts              # API configuration
│   │   ├── App.tsx                 # Root component
│   │   └── main.tsx                # Entry point
│   ├── package.json
│   ├── vite.config.ts
│   └── README.md
│
└── README.md                       # This file
```

## 🛠️ Setup Instructions

### Prerequisites

1. **Node.js 18+** and npm
2. **MongoDB** running on `localhost:27017` (or configure via `MONGODB_URI`)
3. **Elasticsearch** running on `http://localhost:9200`
4. **Google Gemini API Key** (for auto-reply feature)

### Backend Setup

1. **Navigate to backend directory:**
```bash
cd email-clarity-backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**
Create a `.env` file in `email-clarity-backend/` directory:

```env
# Server
PORT=3001

# MongoDB
MONGODB_URI=mongodb://localhost:27017/email-clarity

# Elasticsearch
ELASTICSEARCH_URL=http://localhost:9200

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

# Gemini API (Required for auto-reply)
GEMINI_API_KEY=your-gemini-api-key-here

# Webhooks (Optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
INTERESTED_WEBHOOK_URL=https://your-webhook-url.com/interested
```

4. **For Gmail IMAP Setup:**
   - Enable 2-factor authentication on your Gmail account
   - Generate an App Password: https://myaccount.google.com/apppasswords
   - Use the app password (not your regular password) in `IMAP1_PASSWORD` and `IMAP2_PASSWORD`

5. **Get Gemini API Key:**
   - Visit: https://makersuite.google.com/app/apikey
   - Create a new API key
   - Add it to your `.env` file as `GEMINI_API_KEY`

6. **Start the backend server:**
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

The server will:
- Connect to MongoDB
- Initialize Elasticsearch index
- Connect to both IMAP accounts
- Fetch last 30 days of emails
- Start IDLE for real-time email processing

### Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd email-clarity-ui
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure API endpoint:**
Update `src/config/api.ts` if your backend runs on a different port:

```typescript
export const API_BASE_URL = 'http://localhost:3001';
```

4. **Start the development server:**
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` (or the port shown in terminal).

5. **Build for production:**
```bash
npm run build
npm preview
```

## 🐳 Docker Setup

The easiest way to run the entire application is using Docker Compose, which includes MongoDB and Elasticsearch.

### Quick Start with Docker

1. **Create a `.env` file in the root directory:**
```bash
# IMAP Account 1 (Required)
IMAP1_USER=your-email1@gmail.com
IMAP1_PASSWORD=your-app-password-1

# IMAP Account 2 (Optional)
IMAP2_USER=your-email2@gmail.com
IMAP2_PASSWORD=your-app-password-2

# Gemini API Key (Required for auto-reply)
GEMINI_API_KEY=your-gemini-api-key

# Webhooks (Optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
INTERESTED_WEBHOOK_URL=https://your-webhook-url.com/interested
```

2. **Build and start all services:**
```bash
docker-compose up -d
```

3. **Access the application:**
- **Frontend**: http://localhost
- **Backend API**: http://localhost:3001
- **MongoDB**: localhost:27017
- **Elasticsearch**: http://localhost:9200

### Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild after code changes
docker-compose build --no-cache
docker-compose up -d

# Development mode with hot-reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Docker Files

- `email-clarity-backend/Dockerfile` - Backend container
- `email-clarity-ui/Dockerfile` - Frontend production container
- `docker-compose.yml` - Main orchestration file
- `DOCKER_SETUP.md` - Detailed Docker documentation

For more detailed Docker setup instructions, troubleshooting, and production deployment guidelines, see [DOCKER_SETUP.md](./DOCKER_SETUP.md).

## 📡 API Endpoints

### Base URL
```
http://localhost:3001/api/emails
```

### Get All Emails
```http
GET /api/emails
Query Parameters:
  - category: Filter by category (interested, not-interested, meetings, out-of-office, spam, inbox)
  - accountId: Filter by account (account1, account2)
  - folder: Filter by folder (INBOX, etc.)
  - limit: Number of results (default: 100)
  - skip: Number of results to skip (default: 0)
```

**Example:**
```bash
curl http://localhost:3001/api/emails?category=interested&limit=50
```

### Get Email by ID
```http
GET /api/emails/:id?accountId=account1
```

**Example:**
```bash
curl "http://localhost:3001/api/emails/12345?accountId=account1"
```

### Search Emails
```http
GET /api/emails/search?query=search+term
Query Parameters:
  - query: Search term (required)
  - folder: Filter by folder
  - accountId: Filter by account
```

**Example:**
```bash
curl "http://localhost:3001/api/emails/search?query=partnership&accountId=account1"
```

### Get Statistics
```http
GET /api/emails/stats/summary?accountId=account1
```

**Response:**
```json
{
  "total": 150,
  "interested": 25,
  "notInterested": 10,
  "meetings": 15,
  "outOfOffice": 8,
  "spam": 92
}
```

### Manual Sync
```http
POST /api/emails/sync
```

Triggers a manual sync of IMAP accounts.

### Re-index Emails
```http
POST /api/emails/reindex
```

Re-indexes all emails from MongoDB to Elasticsearch.

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🤖 AI Auto-Reply with Gemini API

The system uses **Google Gemini API** to generate intelligent auto-replies based on email categories:

### How It Works

1. **Email Reception**: When an email is received via IMAP
2. **Categorization**: Email is classified into a category (interested, not-interested, out-of-office, etc.)
3. **Reply Generation**: For applicable categories, the system:
   - Uses predefined templates for common scenarios
   - Can leverage Gemini API for custom reply generation
   - Automatically sends replies via SMTP

### Reply Templates

The system includes predefined reply templates:
- **Interested**: "Thank you! Our team will reach out to you very soon. Please stay connected."
- **Not Interested**: "Thank you for your response! No worries, we won't disturb you further."
- **Out of Office**: "Thank you for informing! We will follow up once you are back."

### Categories That Trigger Replies

- ✅ `interested` - Sends acknowledgment reply
- ✅ `not-interested` - Sends polite decline reply
- ✅ `out-of-office` - Sends acknowledgment reply
- ❌ `meetings` - No auto-reply (handled separately)
- ❌ `spam` - No auto-reply

### Configuration

Ensure your `.env` file includes:
```env
GEMINI_API_KEY=your-gemini-api-key-here
```

**Note**: The system will work with predefined templates even without Gemini API key, but Gemini integration provides more intelligent and contextual replies when needed.

## 📧 Email Categorization

Emails are automatically categorized using keyword-based classification:

### Categories

- **Interested**: Contains keywords like "interested", "sounds good", "let's connect", "tell me more"
- **Not Interested**: Contains "not interested", "no thanks", "not a good fit", "unsubscribe"
- **Meetings**: Contains "meeting", "schedule", "zoom", "calendar invite", "appointment"
- **Out of Office**: Contains "out of office", "ooo", "away until", "on leave", "vacation"
- **Spam**: Transactional emails, newsletters, no-reply senders, promotional content
- **Inbox**: Default category for regular emails

## 🔗 Webhook Integration

When an email is categorized as "Interested", the backend automatically sends POST requests to:

1. **Slack Webhook** (`SLACK_WEBHOOK_URL`)
2. **Custom Webhook** (`INTERESTED_WEBHOOK_URL`)

**Payload Format:**
```json
{
  "subject": "Email subject",
  "sender": "sender@example.com",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🐛 Troubleshooting

### IMAP Connection Issues
- ✅ Ensure you're using app-specific passwords for Gmail (not regular passwords)
- ✅ Check firewall settings for IMAP ports (993 for SSL)
- ✅ Verify IMAP is enabled in your email account settings
- ✅ For Gmail, ensure "Less secure app access" is enabled or use App Passwords

### Elasticsearch Connection
- ✅ Ensure Elasticsearch is running: `curl http://localhost:9200`
- ✅ Check Elasticsearch logs for errors
- ✅ Verify `ELASTICSEARCH_URL` in `.env` matches your Elasticsearch instance

### MongoDB Connection
- ✅ Ensure MongoDB is running: `mongosh` or `mongo`
- ✅ Check connection string in `.env` (`MONGODB_URI`)
- ✅ Verify MongoDB is accessible on the configured port (default: 27017)

### Gemini API Issues
- ✅ Verify `GEMINI_API_KEY` is set correctly in `.env`
- ✅ Check API key is valid and has quota available
- ✅ System will continue working with templates if API key is missing

### No Emails Syncing
- ✅ Check server logs for IMAP connection status
- ✅ Verify IMAP credentials are correct
- ✅ Check if emails exist in the INBOX folder
- ✅ Review IDLE connection status in logs
- ✅ Try manual sync: `POST /api/emails/sync`

### Frontend Not Connecting to Backend
- ✅ Verify backend is running on port 3001
- ✅ Check CORS settings in backend
- ✅ Verify `API_BASE_URL` in `src/config/api.ts`
- ✅ Check browser console for CORS or network errors

## 📝 Development

### Backend Development
```bash
cd email-clarity-backend
npm run dev    # Runs with hot-reload using tsx watch
npm run build  # Compiles TypeScript to JavaScript
npm run lint   # Runs ESLint
```

### Frontend Development
```bash
cd email-clarity-ui
npm run dev      # Starts Vite dev server
npm run build    # Builds for production
npm run preview  # Preview production build
npm run lint     # Runs ESLint
```

## 📄 License

ISC

## 👥 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For issues and questions:
- Check the troubleshooting section above
- Review the individual README files in `email-clarity-backend/` and `email-clarity-ui/`
- Check server logs for detailed error messages

---

**Built with ❤️ using Node.js, React, MongoDB, Elasticsearch, and Google Gemini API**

