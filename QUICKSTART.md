# ServiceNow SSE MCP Server - Quick Start

Get your browser-accessible ServiceNow MCP server running in 5 minutes!

## What You'll Get

✅ Browser-accessible MCP server on `http://localhost:3000`
✅ Works with AI assistants (Bob, Claude)
✅ Four ServiceNow tools (get, list, create, update incidents)
✅ Health check and monitoring endpoints

## Prerequisites

- ✅ Node.js installed (you have v24.14.0)
- ✅ ServiceNow instance credentials
- ✅ Server already built

## Step 1: Set Environment Variables (1 minute)

```bash
export SERVICENOW_INSTANCE_URL="https://your-instance.service-now.com"
export SERVICENOW_USERNAME="your-username"
export SERVICENOW_PASSWORD="your-password"
```

**Replace with your actual ServiceNow credentials!**

## Step 2: Start the Server (30 seconds)

```bash
cd servicenow-server-sse
./start.sh
```

You should see:
```
🚀 ServiceNow MCP Server (SSE) running on http://localhost:3000
📡 SSE endpoint: http://localhost:3000/sse
💚 Health check: http://localhost:3000/health
📖 API info: http://localhost:3000/
```

## Step 3: Test in Browser (1 minute)

Open these URLs in your browser:

1. **API Info**: http://localhost:3000/
2. **Health Check**: http://localhost:3000/health

You should see JSON responses!

## Step 4: Configure AI Assistant (2 minutes)

### For Bob

Edit `~/.bob/settings/mcp_settings.json`:

```json
{
  "mcpServers": {
    "servicenow-sse": {
      "url": "http://localhost:3000/sse",
      "disabled": false
    }
  }
}
```

### For Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "servicenow-sse": {
      "url": "http://localhost:3000/sse"
    }
  }
}
```

## Step 5: Restart and Test (1 minute)

1. Restart your AI assistant
2. Try: "List ServiceNow incidents"
3. Try: "Show me incident INC0010001"

## Quick Commands to Try

### View Incidents
- "List all high-priority ServiceNow incidents"
- "Show me incident INC0010001"
- "List incidents assigned to john.doe"

### Create Incidents
- "Create a ServiceNow incident: Email server down, caller jane.smith"
- "Create an incident for VPN access issue"

### Update Incidents
- "Update incident INC0010001: assign to jane.smith"
- "Close incident INC0010001 with resolution 'Fixed'"

## Testing with curl

```bash
# Health check
curl http://localhost:3000/health

# API information
curl http://localhost:3000/

# SSE connection (will stream)
curl -N http://localhost:3000/sse
```

## Troubleshooting

### "Port 3000 already in use"

```bash
# Use a different port
export PORT=3001
./start.sh
```

### "Authentication failed"

- Check your ServiceNow credentials
- Verify instance URL (no trailing slash)
- Ensure user has `itil` role

### "Cannot connect to ServiceNow"

- Verify instance URL is accessible
- Check internet connection
- Test ServiceNow login in browser

## Stopping the Server

Press `Ctrl+C` in the terminal where the server is running.

## Running in Background

```bash
# Start in background
nohup ./start.sh > server.log 2>&1 &

# Check if running
ps aux | grep "node.*servicenow"

# Stop
pkill -f "node.*servicenow"
```

## What's Next?

1. ✅ Explore all four tools
2. ✅ Try complex queries with filters
3. ✅ Integrate with your workflow
4. ✅ Set up monitoring

## Key Differences from Stdio Server

| Feature | Stdio | SSE (This) |
|---------|-------|------------|
| Browser Access | ❌ | ✅ |
| AI Assistant | ✅ | ✅ |
| Port Required | ❌ | ✅ (3000) |
| Health Checks | ❌ | ✅ |
| Testing | CLI only | Browser, curl |

## Need Help?

- See full [README.md](README.md) for detailed documentation
- Check server logs for errors
- Test health endpoint: http://localhost:3000/health

Happy incident managing! 🎉