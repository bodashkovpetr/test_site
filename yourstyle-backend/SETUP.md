# YourStyle Backend - Complete Setup Guide

This guide provides step-by-step instructions for setting up the YourStyle furniture e-commerce backend on Windows with XAMPP.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installing Docker Desktop](#installing-docker-desktop)
3. [Installing Node.js](#installing-nodejs)
4. [Setting Up the Backend](#setting-up-the-backend)
5. [Database Setup](#database-setup)
6. [Configuring Apache Reverse Proxy](#configuring-apache-reverse-proxy)
7. [Running the Application](#running-the-application)
8. [SSL Configuration](#ssl-configuration)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:
- Windows 10/11 (64-bit)
- XAMPP installed (with Apache)
- Administrator access to your system
- Internet connection

---

## Installing Docker Desktop

Docker is required to run PostgreSQL and pgAdmin in containers.

### Step 1: Download Docker Desktop
1. Visit: https://www.docker.com/products/docker-desktop/
2. Download Docker Desktop for Windows
3. Run the installer (requires admin privileges)

### Step 2: Install Docker Desktop
1. Follow the installation wizard
2. Enable WSL 2 (Windows Subsystem for Linux) if prompted
3. Restart your computer when prompted

### Step 3: Verify Installation
Open Command Prompt or PowerShell and run:
```bash
docker --version
docker-compose --version
```

You should see version numbers for both commands.

---

## Installing Node.js

### Step 1: Download Node.js
1. Visit: https://nodejs.org/
2. Download the LTS (Long Term Support) version
3. Run the installer

### Step 2: Install Node.js
1. Follow the installation wizard
2. Keep all default options
3. Ensure "Add to PATH" is checked

### Step 3: Verify Installation
Open Command Prompt and run:
```bash
node --version
npm --version
```

You should see version numbers for both commands.

---

## Setting Up the Backend

### Step 1: Place Backend Files
1. Copy the `yourstyle-backend` folder to your desired location
   - Recommended: `C:\projects\yourstyle-backend`
2. Open Command Prompt in this directory:
   ```bash
   cd C:\projects\yourstyle-backend
   ```

### Step 2: Install Dependencies
Run the following command:
```bash
npm install
```

Or if using Yarn:
```bash
yarn install
```

This will install all required Node.js packages.

### Step 3: Configure Environment Variables
1. Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```

2. Open `.env` in a text editor and update the values:
   ```env
   PORT=3000
   NODE_ENV=production
   
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=yourstyle_db
   DB_USER=yourstyle_user
   DB_PASSWORD=your_secure_password_here
   
   JWT_SECRET=your_random_jwt_secret_key_min_32_chars
   JWT_EXPIRES_IN=7d
   
   CORS_ORIGIN=http://yourstyle.space,http://plitka.live,https://yourstyle.space,https://plitka.live
   
   PGADMIN_EMAIL=admin@yourstyle.space
   PGADMIN_PASSWORD=admin_password_here
   ```

   **Important Security Notes:**
   - Change `DB_PASSWORD` to a strong, unique password
   - Generate a random `JWT_SECRET` (use a password generator for 32+ characters)
   - Change `PGADMIN_PASSWORD` to a secure password
   - Update `CORS_ORIGIN` to match your actual domain(s)

---

## Database Setup

### Step 1: Start Docker Containers
From the `yourstyle-backend` directory, run:
```bash
docker-compose up -d
```

This starts PostgreSQL and pgAdmin in the background.

### Step 2: Verify Containers Are Running
```bash
docker ps
```

You should see two containers:
- `yourstyle-postgres`
- `yourstyle-pgadmin`

### Step 3: Wait for PostgreSQL to Initialize
Wait about 10-15 seconds for PostgreSQL to fully start.

### Step 4: Run Database Migrations
This creates all necessary tables:
```bash
npm run migrate
```

Or with Yarn:
```bash
yarn migrate
```

You should see: `✓ Migrations completed successfully!`

### Step 5: Seed Products Data
Import the initial products into the database:
```bash
npm run seed
```

Or with Yarn:
```bash
yarn seed
```

You should see messages for each product being seeded.

### Step 6: Access pgAdmin (Optional)
To manage your database visually:

1. Open browser and go to: http://localhost:5050
2. Login with:
   - Email: Value from `PGADMIN_EMAIL` in `.env`
   - Password: Value from `PGADMIN_PASSWORD` in `.env`

3. Add a new server connection:
   - Right-click "Servers" → "Register" → "Server"
   - General tab:
     - Name: YourStyle Database
   - Connection tab:
     - Host: postgres (use the container name)
     - Port: 5432
     - Database: yourstyle_db
     - Username: yourstyle_user
     - Password: (your DB_PASSWORD from .env)
   - Click "Save"

---

## Configuring Apache Reverse Proxy

This allows Apache to forward `/api/*` requests to your Node.js backend.

### Step 1: Enable Required Apache Modules
1. Open XAMPP Control Panel
2. Click "Config" next to Apache → "httpd.conf"
3. Find and uncomment these lines (remove the `#` at the beginning):
   ```apache
   LoadModule proxy_module modules/mod_proxy.so
   LoadModule proxy_http_module modules/mod_proxy_http.so
   LoadModule headers_module modules/mod_headers.so
   ```
4. Save the file

### Step 2: Add Reverse Proxy Configuration
1. Copy `apache-reverse-proxy.conf` to `C:\xampp\apache\conf\extra\`

2. Open `C:\xampp\apache\conf\httpd.conf` and add at the end:
   ```apache
   Include conf/extra/apache-reverse-proxy.conf
   ```

3. Adjust paths in `apache-reverse-proxy.conf` if needed:
   - Change `DocumentRoot` to match your frontend location
   - Example: `DocumentRoot "C:/xampp/htdocs/yourstyle"`

### Step 3: Configure hosts File (for local testing)
1. Open Notepad as Administrator
2. Open file: `C:\Windows\System32\drivers\etc\hosts`
3. Add these lines:
   ```
   127.0.0.1 yourstyle.space
   127.0.0.1 plitka.live
   ```
4. Save the file

### Step 4: Restart Apache
1. In XAMPP Control Panel, click "Stop" for Apache
2. Wait a few seconds
3. Click "Start" for Apache

---

## Running the Application

### Step 1: Start the Backend Server

#### Development Mode (with auto-restart on code changes):
```bash
npm run dev
```

Or with Yarn:
```bash
yarn dev
```

#### Production Mode:
```bash
npm start
```

Or with Yarn:
```bash
yarn start
```

### Step 2: Verify Backend is Running
You should see:
```
╔════════════════════════════════════════════╗
║   YourStyle Backend Server                 ║
║   Environment: production                  ║
║   Port: 3000                               ║
║   Status: Running ✓                        ║
╚════════════════════════════════════════════╝
```

### Step 3: Test the API
Open browser and go to: http://localhost:3000/health

You should see:
```json
{
  "status": "ok",
  "timestamp": "2025-10-19T...",
  "environment": "production"
}
```

### Step 4: Test Through Apache Proxy
Open browser and go to: http://yourstyle.space/api/products

You should see a JSON response with all products.

---

## SSL Configuration

### Using Let's Encrypt (Recommended for Production)

1. **Install Certbot for Windows:**
   - Download from: https://certbot.eff.org/
   - Follow installation instructions

2. **Stop Apache temporarily:**
   - In XAMPP, click "Stop" for Apache

3. **Generate SSL Certificate:**
   ```bash
   certbot certonly --standalone -d yourstyle.space -d www.yourstyle.space
   ```

4. **Copy Certificates:**
   ```bash
   copy C:\Certbot\live\yourstyle.space\fullchain.pem C:\xampp\apache\conf\ssl.crt\yourstyle.crt
   copy C:\Certbot\live\yourstyle.space\privkey.pem C:\xampp\apache\conf\ssl.key\yourstyle.key
   copy C:\Certbot\live\yourstyle.space\chain.pem C:\xampp\apache\conf\ssl.crt\yourstyle-chain.crt
   ```

5. **Enable SSL in XAMPP:**
   - Edit `C:\xampp\apache\conf\httpd.conf`
   - Uncomment: `LoadModule ssl_module modules/mod_ssl.so`
   - Uncomment: `Include conf/extra/httpd-ssl.conf`

6. **Restart Apache**

### SSL Renewal

Let's Encrypt certificates expire after 90 days. To renew:

```bash
certbot renew
```

Then copy the new certificates again and restart Apache.

**Automate Renewal (Optional):**
- Use Windows Task Scheduler to run renewal every 60 days
- Create a batch script that runs `certbot renew` and copies certificates

---

## Troubleshooting

### Issue: "Cannot connect to database"

**Solution:**
1. Check if PostgreSQL container is running:
   ```bash
   docker ps
   ```
2. Restart Docker containers:
   ```bash
   docker-compose down
   docker-compose up -d
   ```
3. Verify credentials in `.env` match Docker configuration

---

### Issue: "Port 3000 already in use"

**Solution:**
1. Find what's using port 3000:
   ```bash
   netstat -ano | findstr :3000
   ```
2. Kill the process:
   ```bash
   taskkill /PID <process_id> /F
   ```
   Or change the PORT in `.env` to another value (e.g., 3001)

---

### Issue: "CORS error in browser console"

**Solution:**
1. Verify `CORS_ORIGIN` in `.env` includes your domain
2. Check Apache reverse proxy configuration has CORS headers
3. Clear browser cache
4. Check browser developer console for exact error

---

### Issue: "Apache won't start after adding proxy config"

**Solution:**
1. Check Apache error logs: `C:\xampp\apache\logs\error.log`
2. Verify proxy modules are uncommented in `httpd.conf`
3. Check syntax of `apache-reverse-proxy.conf`
4. Test Apache configuration:
   ```bash
   C:\xampp\apache\bin\httpd.exe -t
   ```

---

### Issue: "JWT token invalid or expired"

**Solution:**
1. Tokens expire after 7 days by default
2. User needs to login again to get a new token
3. Frontend should handle 401 errors and redirect to login
4. Check `JWT_SECRET` hasn't changed (this invalidates all tokens)

---

### Issue: "Docker containers won't start"

**Solution:**
1. Ensure Docker Desktop is running
2. Check if ports 5432 or 5050 are already in use:
   ```bash
   netstat -ano | findstr :5432
   netstat -ano | findstr :5050
   ```
3. Stop any existing PostgreSQL services
4. Restart Docker Desktop

---

### Issue: "Migration or seed fails"

**Solution:**
1. Ensure PostgreSQL is fully started (wait 15 seconds after `docker-compose up`)
2. Check database credentials in `.env`
3. Manually connect to database to verify:
   ```bash
   docker exec -it yourstyle-postgres psql -U yourstyle_user -d yourstyle_db
   ```
4. Drop and recreate database if needed:
   ```sql
   DROP DATABASE IF EXISTS yourstyle_db;
   CREATE DATABASE yourstyle_db;
   ```

---

## Additional Commands

### Stop Backend Server
Press `Ctrl+C` in the terminal running the server

### Stop Docker Containers
```bash
docker-compose down
```

### View Backend Logs
If running in background:
```bash
docker-compose logs -f
```

### View PostgreSQL Logs
```bash
docker logs yourstyle-postgres
```

### Backup Database
```bash
docker exec yourstyle-postgres pg_dump -U yourstyle_user yourstyle_db > backup.sql
```

### Restore Database
```bash
docker exec -i yourstyle-postgres psql -U yourstyle_user yourstyle_db < backup.sql
```

---

## Production Deployment Notes

For production deployment:

1. **Change all default passwords** in `.env`
2. **Use strong JWT secret** (32+ random characters)
3. **Set `NODE_ENV=production`**
4. **Use process manager** like PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name yourstyle-backend
   pm2 save
   pm2 startup
   ```
5. **Set up automatic SSL renewal** with certbot
6. **Configure firewall** to only allow necessary ports
7. **Regular database backups** (daily recommended)
8. **Monitor logs** for errors and security issues
9. **Keep dependencies updated** but test before updating in production

---

## Support

For issues or questions:
- Check the [README.md](README.md) for API documentation
- Review error logs in `C:\xampp\apache\logs\` or Docker logs
- Ensure all prerequisites are met
- Verify environment variables are correctly set

---

## Linux Deployment (Alternative)

If deploying on Linux server instead of Windows:

### Quick Start:
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# Clone/upload project
cd /var/www/yourstyle-backend

# Install dependencies
npm install

# Configure .env
cp .env.example .env
nano .env

# Start Docker
docker-compose up -d

# Run migrations and seed
npm run migrate
npm run seed

# Install PM2
npm install -g pm2

# Start backend
pm2 start server.js --name yourstyle-backend
pm2 save
pm2 startup

# For Nginx (instead of Apache):
sudo nano /etc/nginx/sites-available/yourstyle
# Add proxy configuration similar to Apache config
# Test: sudo nginx -t
# Reload: sudo systemctl reload nginx
```

---

**Last Updated:** October 2025  
**Version:** 1.0.0
