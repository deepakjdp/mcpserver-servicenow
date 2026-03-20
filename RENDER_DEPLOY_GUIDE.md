# Deploy ServiceNow MCP Server to Render.com

Complete step-by-step guide to deploy your ServiceNow MCP server to Render.com (100% free tier available).

## ✨ Why Render?

- ✅ **Free tier** with 750 hours/month
- ✅ **Automatic HTTPS**
- ✅ **Auto-deploy from Git**
- ✅ **Easy environment variables**
- ✅ **No credit card required for free tier**
- ✅ **Simple web interface**

---

## 📋 Prerequisites

1. **GitHub account** (to store your code)
2. **Render account** (free - we'll create this)
3. **ServiceNow credentials**

---

## 🚀 Step-by-Step Deployment

### Step 1: Push Your Code to GitHub

First, we need to get your code on GitHub:

```bash
# Navigate to your project
cd /Users/deepakkumarsharma/Desktop/servicenow-server-sse

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit for Render deployment"

# Create a new repository on GitHub
# Go to: https://github.com/new
# Name it: servicenow-mcp-server
# Don't initialize with README (we already have code)

# Add GitHub as remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/servicenow-mcp-server.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Alternative: Use GitHub Desktop**
1. Download GitHub Desktop: https://desktop.github.com
2. Open GitHub Desktop
3. Click "Add" → "Add Existing Repository"
4. Select your project folder
5. Click "Publish repository"

---

### Step 2: Sign Up for Render

1. **Go to**: https://render.com
2. **Click**: "Get Started" or "Sign Up"
3. **Choose**: "Sign up with GitHub" (easiest)
4. **Authorize** Render to access your GitHub repositories
5. **Complete** your profile (optional)

---

### Step 3: Create a New Web Service

1. **Click**: "New +" button (top right)
2. **Select**: "Web Service"
3. **Connect** your GitHub repository:
   - If you don't see your repo, click "Configure account" to grant access
   - Find and select: `servicenow-mcp-server`
4. **Click**: "Connect"

---

### Step 4: Configure Your Web Service

Fill in the following settings:

#### Basic Settings

**Name**: `servicenow-mcp-server`
- This will be part of your URL: `servicenow-mcp-server.onrender.com`

**Region**: Choose closest to you
- `Oregon (US West)`
- `Ohio (US East)`
- `Frankfurt (Europe)`
- `Singapore (Asia)`

**Branch**: `main`
- Or whatever your default branch is

**Root Directory**: Leave empty
- Unless your code is in a subdirectory

#### Build & Deploy Settings

**Runtime**: `Node`
- Render auto-detects this from package.json

**Build Command**:
```bash
npm install && npm run build
```

**Start Command**:
```bash
node build/index.js
```

#### Instance Type

**Free**: Select "Free" tier
- 512 MB RAM
- Shared CPU
- Sleeps after 15 minutes of inactivity
- 750 hours/month free

---

### Step 5: Add Environment Variables

Scroll down to **Environment Variables** section:

Click "Add Environment Variable" for each of these:

1. **Key**: `SERVICENOW_INSTANCE_URL`
   - **Value**: `https://your-instance.service-now.com`
   - Replace with your actual ServiceNow instance URL

2. **Key**: `SERVICENOW_USERNAME`
   - **Value**: `your-username`
   - Your ServiceNow username

3. **Key**: `SERVICENOW_PASSWORD`
   - **Value**: `your-password`
   - Your ServiceNow password

4. **Key**: `PORT`
   - **Value**: `8080`
   - Render will use this port

5. **Key**: `NODE_ENV`
   - **Value**: `production`
   - Optional but recommended

**Important**: Click the "eye" icon to hide sensitive values!

---

### Step 6: Deploy!

1. **Click**: "Create Web Service" (bottom of page)
2. **Wait**: Render will now:
   - Clone your repository
   - Install dependencies (`npm install`)
   - Build your project (`npm run build`)
   - Start your server (`node build/index.js`)
3. **Monitor**: Watch the deployment logs in real-time
4. **Success**: When you see "Your service is live 🎉"

**Deployment typically takes 2-5 minutes**

---

### Step 7: Get Your URL

Once deployed, you'll see:

**Your service URL**: `https://servicenow-mcp-server.onrender.com`

This is your public URL! 🎉

---

### Step 8: Test Your Deployment

Open a terminal and test:

```bash
# Test health endpoint
curl https://servicenow-mcp-server.onrender.com/health

# Should return:
# {"status":"healthy","timestamp":"2024-...","servicenow":{"connected":true}}

# Test SSE endpoint (for MCP)
curl -N https://servicenow-mcp-server.onrender.com/sse

# Should start streaming events
```

Or open in browser:
- Health: https://servicenow-mcp-server.onrender.com/health
- Info: https://servicenow-mcp-server.onrender.com/

---

## 🔧 Configure IBM Consulting Advantage

Now use your Render URL in IBM Consulting Advantage:

### For Bob MCP Client

Edit `~/.bob/settings/mcp_settings.json`:

```json
{
  "mcpServers": {
    "servicenow": {
      "url": "https://servicenow-mcp-server.onrender.com/sse",
      "disabled": false,
      "alwaysAllow": [],
      "disabledTools": []
    }
  }
}
```

### For IBM watsonx Code Assistant

Use this URL in your MCP configuration:
```
https://servicenow-mcp-server.onrender.com/sse
```

---

## 🔄 Auto-Deploy Updates

Render automatically deploys when you push to GitHub:

```bash
# Make changes to your code
# Then:
git add .
git commit -m "Update server"
git push

# Render automatically detects the push and redeploys!
```

---

## 📊 Monitor Your Service

### View Logs

1. Go to your service dashboard on Render
2. Click "Logs" tab
3. See real-time logs of your application

### View Metrics

1. Click "Metrics" tab
2. See:
   - CPU usage
   - Memory usage
   - Request count
   - Response times

### View Events

1. Click "Events" tab
2. See deployment history and status changes

---

## ⚙️ Advanced Configuration

### Custom Domain (Optional)

1. Go to "Settings" tab
2. Scroll to "Custom Domain"
3. Click "Add Custom Domain"
4. Follow instructions to configure DNS

### Health Check Path

Render automatically checks `/health` endpoint. Your server already has this!

### Auto-Deploy

- **Enabled by default**
- Disable in Settings → "Auto-Deploy" if needed

---

## 💰 Free Tier Limits

Render Free tier includes:

- ✅ **750 hours/month** (enough for 1 service running 24/7)
- ✅ **512 MB RAM**
- ✅ **Shared CPU**
- ✅ **Automatic HTTPS**
- ⚠️ **Sleeps after 15 min inactivity** (wakes up on first request)
- ⚠️ **Cold start**: ~30 seconds to wake up

### Prevent Sleep (Optional)

If you need 24/7 uptime without sleep:

**Option 1**: Upgrade to paid tier ($7/month)

**Option 2**: Use a free uptime monitor to ping your service:
- UptimeRobot: https://uptimerobot.com (free)
- Ping every 5 minutes to keep service awake

---

## 🔒 Security Best Practices

### 1. Use Environment Variables

✅ Already done! Never commit credentials to Git.

### 2. Enable HTTPS

✅ Automatic on Render!

### 3. Add API Key Authentication (Optional)

Add to your environment variables:
- **Key**: `API_KEY`
- **Value**: `your-secure-random-key`

Then update your code to check this key.

### 4. Restrict CORS (Optional)

Update `src/index.ts` to only allow IBM domains.

---

## 🐛 Troubleshooting

### Build Failed

**Check build logs** for errors:
- Missing dependencies? Add to `package.json`
- TypeScript errors? Fix in your code
- Wrong Node version? Add `.node-version` file

### Service Won't Start

**Check start command**:
- Should be: `node build/index.js`
- Make sure `build/` directory exists after build

### Can't Connect to ServiceNow

**Check environment variables**:
1. Go to "Environment" tab
2. Verify all variables are set correctly
3. Click "Save Changes" if you edit them
4. Service will auto-restart

### Service is Sleeping

**Free tier sleeps after 15 min**:
- First request takes ~30 seconds (cold start)
- Subsequent requests are fast
- Use uptime monitor to prevent sleep

### 502 Bad Gateway

**Service might be starting**:
- Wait 30-60 seconds
- Check logs for errors
- Verify PORT environment variable is set

---

## 📞 Get Help

### Render Support

- Documentation: https://render.com/docs
- Community: https://community.render.com
- Status: https://status.render.com

### Check Service Status

1. Go to your service dashboard
2. Look for status indicator (green = healthy)
3. Check "Events" tab for issues

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Render account created
- [ ] Web service created and connected to GitHub
- [ ] Build command set: `npm install && npm run build`
- [ ] Start command set: `node build/index.js`
- [ ] Environment variables added (ServiceNow credentials)
- [ ] Service deployed successfully
- [ ] Health endpoint tested: `/health`
- [ ] SSE endpoint tested: `/sse`
- [ ] URL configured in IBM Consulting Advantage
- [ ] Tested from IBM ICA

---

## 🎉 Success!

Your ServiceNow MCP server is now:
- ✅ Deployed on Render
- ✅ Publicly accessible via HTTPS
- ✅ Auto-deploys on Git push
- ✅ Ready to use with IBM Consulting Advantage

**Your MCP URL**:
```
https://servicenow-mcp-server.onrender.com/sse
```

Use this URL in IBM Consulting Advantage to connect to your ServiceNow instance!

---

## 🔄 Next Steps

1. **Test thoroughly** with IBM Consulting Advantage
2. **Monitor logs** for any issues
3. **Set up uptime monitoring** if needed (to prevent sleep)
4. **Consider upgrading** to paid tier for better performance
5. **Add more features** to your MCP server

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Node.js on Render](https://render.com/docs/deploy-node-express-app)
- [Environment Variables](https://render.com/docs/environment-variables)
- [Custom Domains](https://render.com/docs/custom-domains)
- [MCP Protocol](https://modelcontextprotocol.io/)

Happy deploying! 🚀