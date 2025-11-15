# Windows Setup Guide

## Quick Fix for MongoDB Connection Error

If you're seeing `ECONNREFUSED ::1:27017` error, MongoDB is not running. Here are your options:

### Option 1: Install and Start MongoDB Locally (Recommended)

1. **Download MongoDB Community Server:**
   - Visit: https://www.mongodb.com/try/download/community
   - Select Windows x64
   - Download and run the installer

2. **Install MongoDB:**
   - Run the installer
   - Choose "Complete" installation
   - Install as a Windows Service (recommended)
   - Install MongoDB Compass (optional GUI tool)

3. **Start MongoDB Service:**
   ```powershell
   # Check if MongoDB service exists
   Get-Service -Name MongoDB
   
   # Start MongoDB service
   net start MongoDB
   
   # Or use PowerShell
   Start-Service MongoDB
   ```

4. **Verify MongoDB is Running:**
   ```powershell
   # Test connection
   mongosh
   # Or if mongosh is not in PATH:
   "C:\Program Files\MongoDB\Server\7.0\bin\mongosh.exe"
   ```

5. **Update your .env file:**
   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/email-clarity
   ```

### Option 2: Use MongoDB Atlas (Cloud - Free Tier)

1. **Create Free Account:**
   - Visit: https://www.mongodb.com/cloud/atlas/register
   - Sign up for free (M0 cluster)

2. **Create a Cluster:**
   - Choose a cloud provider and region
   - Create cluster (takes 3-5 minutes)

3. **Get Connection String:**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

4. **Update your .env file:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/email-clarity?retryWrites=true&w=majority
   ```

### Option 3: Use Docker (If you have Docker installed)

```powershell
# Pull MongoDB image
docker pull mongo

# Run MongoDB container
docker run -d -p 27017:27017 --name mongodb mongo

# Verify it's running
docker ps
```

## Elasticsearch Setup

### Option 1: Download and Run Elasticsearch

1. **Download Elasticsearch:**
   - Visit: https://www.elastic.co/downloads/elasticsearch
   - Download Windows ZIP
   - Extract to a folder (e.g., `C:\elasticsearch`)

2. **Start Elasticsearch:**
   ```powershell
   cd C:\elasticsearch\bin
   .\elasticsearch.bat
   ```

3. **Verify it's running:**
   ```powershell
   curl http://localhost:9200
   ```

### Option 2: Use Docker

```powershell
docker pull docker.elastic.co/elasticsearch/elasticsearch:8.11.0
docker run -d -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" --name elasticsearch docker.elastic.co/elasticsearch/elasticsearch:8.11.0
```

## Troubleshooting

### MongoDB Service Won't Start

```powershell
# Check MongoDB service status
Get-Service MongoDB

# View MongoDB logs
Get-Content "C:\Program Files\MongoDB\Server\7.0\log\mongod.log" -Tail 50

# Restart MongoDB service
Restart-Service MongoDB
```

### Port Already in Use

If port 27017 is already in use:

```powershell
# Find what's using the port
netstat -ano | findstr :27017

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Firewall Issues

If you can't connect, check Windows Firewall:

```powershell
# Allow MongoDB through firewall
New-NetFirewallRule -DisplayName "MongoDB" -Direction Inbound -LocalPort 27017 -Protocol TCP -Action Allow
```

## Quick Start Commands

```powershell
# Start MongoDB
net start MongoDB

# Start Elasticsearch (if installed locally)
cd C:\elasticsearch\bin
.\elasticsearch.bat

# Start backend (in another terminal)
cd email-clarity-backend
npm run dev
```

## Verify Everything is Running

1. **MongoDB:** Open `mongosh` or check service status
2. **Elasticsearch:** `curl http://localhost:9200`
3. **Backend:** Should show "✅ Connected to MongoDB" and "✅ Elasticsearch index created"

