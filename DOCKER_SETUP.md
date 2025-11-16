# Docker Setup Guide

This guide explains how to run the Email Clarity application using Docker and Docker Compose.

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Git (to clone the repository)

## 🚀 Quick Start

### 1. Create Environment File

Create a `.env` file in the root directory with your configuration:

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

### 2. Build and Start Services

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes all data)
docker-compose down -v
```

### 3. Access the Application

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3001
- **MongoDB**: localhost:27017
- **Elasticsearch**: http://localhost:9200

## 🐳 Services

The Docker Compose setup includes:

1. **MongoDB** - Email storage database
2. **Elasticsearch** - Full-text search engine
3. **Backend** - Node.js/Express API server
4. **Frontend** - React application served via Nginx

## 📁 Docker Files

- `email-clarity-backend/Dockerfile` - Backend container
- `email-clarity-ui/Dockerfile` - Frontend production container
- `email-clarity-ui/Dockerfile.dev` - Frontend development container
- `docker-compose.yml` - Production orchestration
- `docker-compose.dev.yml` - Development override

## 🔧 Configuration

### Environment Variables

All environment variables can be set in the root `.env` file or passed directly to docker-compose:

```bash
# Using .env file
docker-compose up -d

# Or override specific variables
GEMINI_API_KEY=your-key docker-compose up -d
```

### Backend Environment Variables

- `PORT` - Backend port (default: 3001)
- `MONGODB_URI` - MongoDB connection string (auto-configured for Docker)
- `ELASTICSEARCH_URL` - Elasticsearch URL (auto-configured for Docker)
- `IMAP1_USER`, `IMAP1_PASSWORD` - First email account credentials
- `IMAP2_USER`, `IMAP2_PASSWORD` - Second email account credentials (optional)
- `GEMINI_API_KEY` - Google Gemini API key for auto-reply
- `SLACK_WEBHOOK_URL` - Slack webhook URL (optional)
- `INTERESTED_WEBHOOK_URL` - Custom webhook URL (optional)

### Frontend Environment Variables

- `VITE_API_BASE` - API base URL (auto-configured for Docker)

## 🛠️ Development Mode

For development with hot-reload:

```bash
# Use development compose file
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

This will:
- Enable hot-reload for backend and frontend
- Mount source code as volumes
- Use development containers

## 🔍 Debugging

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
docker-compose logs -f elasticsearch
```

### Execute Commands in Containers

```bash
# Backend container
docker-compose exec backend sh

# MongoDB shell
docker-compose exec mongodb mongosh email-clarity

# Elasticsearch
docker-compose exec elasticsearch curl http://localhost:9200/_cluster/health
```

### Check Service Health

```bash
# Check all services
docker-compose ps

# Health check status
docker ps --format "table {{.Names}}\t{{.Status}}"
```

## 📊 Volumes

Data is persisted in Docker volumes:

- `mongodb_data` - MongoDB database files
- `elasticsearch_data` - Elasticsearch indices
- `backend_logs` - Backend application logs

To backup data:

```bash
# Backup MongoDB
docker-compose exec mongodb mongodump --archive=/data/backup.archive --db=email-clarity
docker cp email-clarity-mongodb:/data/backup.archive ./mongodb-backup.archive

# Backup Elasticsearch
docker-compose exec elasticsearch elasticsearch-dump --input=http://localhost:9200 --output=/tmp/es-backup
docker cp email-clarity-elasticsearch:/tmp/es-backup ./elasticsearch-backup
```

## 🔄 Updating

To update the application:

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose build --no-cache
docker-compose up -d

# Or rebuild specific service
docker-compose build backend
docker-compose up -d backend
```

## 🧹 Cleanup

```bash
# Stop containers
docker-compose down

# Remove containers and volumes (⚠️ deletes data)
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Clean up unused Docker resources
docker system prune -a
```

## 🚨 Troubleshooting

### Services Won't Start

1. **Check ports are available**:
   ```bash
   # Check if ports are in use
   netstat -an | grep :3001
   netstat -an | grep :27017
   netstat -an | grep :9200
   netstat -an | grep :80
   ```

2. **Check Docker logs**:
   ```bash
   docker-compose logs
   ```

3. **Verify environment variables**:
   ```bash
   docker-compose config
   ```

### MongoDB Connection Issues

- Ensure MongoDB container is healthy: `docker-compose ps mongodb`
- Check MongoDB logs: `docker-compose logs mongodb`
- Verify connection string in backend logs

### Elasticsearch Memory Issues

If Elasticsearch fails to start due to memory:

```yaml
# In docker-compose.yml, adjust memory settings
environment:
  - "ES_JAVA_OPTS=-Xms256m -Xmx256m"
```

### Frontend Not Connecting to Backend

1. Check nginx proxy configuration in frontend container
2. Verify backend is running: `docker-compose ps backend`
3. Check backend health: `curl http://localhost:3001/health`
4. View nginx logs: `docker-compose logs frontend`

### IMAP Connection Issues

- Verify IMAP credentials in `.env` file
- Check backend logs for IMAP connection errors
- Ensure you're using app-specific passwords for Gmail
- Check firewall settings for IMAP ports

## 📝 Production Deployment

For production deployment:

1. **Use environment-specific compose file**:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

2. **Set up reverse proxy** (nginx/traefik) for HTTPS

3. **Configure secrets management**:
   - Use Docker secrets or external secret management
   - Never commit `.env` files

4. **Set up backups**:
   - Regular MongoDB backups
   - Elasticsearch snapshots
   - Volume backups

5. **Monitor resources**:
   ```bash
   docker stats
   ```

## 🔐 Security Notes

- Never commit `.env` files to version control
- Use Docker secrets for sensitive data in production
- Regularly update base images for security patches
- Use specific image tags instead of `latest`
- Enable firewall rules for exposed ports
- Use HTTPS in production (configure reverse proxy)

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MongoDB Docker Hub](https://hub.docker.com/_/mongo)
- [Elasticsearch Docker Hub](https://hub.docker.com/_/elasticsearch)

