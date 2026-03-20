# ServiceNow MCP Server (SSE - Browser Accessible)

A browser-accessible Model Context Protocol (MCP) server for ServiceNow incident management using Server-Sent Events (SSE) transport.

## 🌟 Key Features

- ✅ **Browser Accessible** - Access via HTTP/SSE from any browser
- ✅ **AI Assistant Compatible** - Works with Bob, Claude, and other MCP clients
- ✅ **Four ServiceNow Tools** - Complete incident management (get, list, create, update)
- ✅ **RESTful Health Checks** - Monitor server status
- ✅ **CORS Enabled** - Cross-origin requests supported
- ✅ **Type-Safe** - Full TypeScript implementation with Zod validation

## 🆚 Difference from Stdio Version

| Feature | Stdio Server | SSE Server (This One) |
|---------|--------------|----------------------|
| Browser Access | ❌ No | ✅ Yes |
| AI Assistant Access | ✅ Yes | ✅ Yes |
| HTTP Endpoints | ❌ No | ✅ Yes |
| Port Required | ❌ No | ✅ Yes (3000) |
| Testing | Command line only | Browser, curl, Postman |
| Use Case | AI assistants only | Browsers + AI assistants |

## 📦 Installation

### Prerequisites

- Node.js v18+ (you have v24.14.0 ✅)
- npm
- ServiceNow instance with API access

### Setup

1. **Install dependencies:**
   ```bash
   cd servicenow-server-sse
   /usr/local/bin/npm install
   ```

2. **Build the server:**
   ```bash
   /usr/local/bin/npm run build
   ```

3. **Set environment variables:**
   ```bash
   export SERVICENOW_INSTANCE_URL="https://your-instance.service-now.com"
   export SERVICENOW_USERNAME="your-username"
   export SERVICENOW_PASSWORD="your-password"
   export PORT=3000  # Optional, defaults to 3000
   ```

4. **Start the server:**
   ```bash
   /usr/local/bin/npm start
   ```

## 🚀 Quick Start

### Start the Server

```bash
# Set credentials
export SERVICENOW_INSTANCE_URL="https://dev12345.service-now.com"
export SERVICENOW_USERNAME="admin"
export SERVICENOW_PASSWORD="your-password"

# Start server
cd servicenow-server-sse
/usr/local/bin/npm start
```

You should see:
```
🚀 ServiceNow MCP Server (SSE) running on http://localhost:3000
📡 SSE endpoint: http://localhost:3000/sse
💚 Health check: http://localhost:3000/health
📖 API info: http://localhost:3000/
🔗 ServiceNow instance: https://dev12345.service-now.com
```

## 🌐 Browser Access

### Health Check

Open in browser: `http://localhost:3000/health`

Response:
```json
{
  "status": "healthy",
  "server": "servicenow-server-sse",
  "version": "0.1.0",
  "servicenow_instance": "https://your-instance.service-now.com"
}
```

### API Information

Open in browser: `http://localhost:3000/`

Shows available tools and endpoints.

### SSE Connection

The MCP protocol endpoint: `http://localhost:3000/sse`

This is used by MCP clients (AI assistants) to connect.

## 🛠️ Available Tools

### 1. get_incident

Retrieve incident details by number or sys_id.

**Parameters:**
- `incident_id` (required): Incident number (e.g., "INC0010001") or sys_id

**Example:**
```json
{
  "incident_id": "INC0010001"
}
```

### 2. list_incidents

Query incidents with filters and pagination.

**Parameters:**
- `state` (optional): 1=New, 2=In Progress, 3=On Hold, 6=Resolved, 7=Closed
- `priority` (optional): 1=Critical, 2=High, 3=Moderate, 4=Low, 5=Planning
- `assigned_to` (optional): User sys_id or username
- `assignment_group` (optional): Group sys_id or name
- `caller_id` (optional): Caller sys_id or username
- `created_after` (optional): ISO 8601 date
- `created_before` (optional): ISO 8601 date
- `limit` (optional): 1-100, default 10
- `offset` (optional): Pagination offset, default 0

**Example:**
```json
{
  "state": "2",
  "priority": "1",
  "limit": 20
}
```

### 3. create_incident

Create a new incident.

**Parameters:**
- `short_description` (required): Brief description
- `caller_id` (required): Caller sys_id or username
- `description` (optional): Detailed description
- `urgency` (optional): 1=High, 2=Medium, 3=Low
- `impact` (optional): 1=High, 2=Medium, 3=Low
- `priority` (optional): 1-5
- `assignment_group` (optional): Group sys_id or name
- `assigned_to` (optional): User sys_id or username
- `category` (optional): Category
- `subcategory` (optional): Subcategory

**Example:**
```json
{
  "short_description": "Email server down",
  "caller_id": "john.doe",
  "urgency": "1",
  "impact": "1"
}
```

### 4. update_incident

Update an existing incident.

**Parameters:**
- `incident_id` (required): Incident number or sys_id
- `state` (optional): New state
- `priority` (optional): New priority
- `assigned_to` (optional): Assign to user
- `assignment_group` (optional): Assign to group
- `work_notes` (optional): Add work notes
- `close_notes` (optional): Close notes
- `resolution_code` (optional): Resolution code
- `short_description` (optional): Update description
- `description` (optional): Update detailed description

**Example:**
```json
{
  "incident_id": "INC0010001",
  "state": "2",
  "assigned_to": "jane.smith",
  "work_notes": "Investigating the issue"
}
```

## 🔌 Using with AI Assistants

### Configure Bob

Edit `~/.bob/settings/mcp_settings.json`:

```json
{
  "mcpServers": {
    "servicenow-sse": {
      "url": "http://localhost:3000/sse",
      "disabled": false,
      "alwaysAllow": [],
      "disabledTools": []
    }
  }
}
```

**Note:** For SSE servers, use `url` instead of `command` and `args`.

### Configure Claude Desktop

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

### Restart Your AI Assistant

After configuration, restart Bob or Claude Desktop to connect to the server.

## 🧪 Testing

### Using curl

```bash
# Health check
curl http://localhost:3000/health

# API info
curl http://localhost:3000/

# SSE connection (will stream events)
curl -N http://localhost:3000/sse
```

### Using Browser

1. Open `http://localhost:3000/` to see API information
2. Open `http://localhost:3000/health` to check server health
3. Use browser developer tools to test SSE connection

### Using Postman

1. Import the server URL: `http://localhost:3000`
2. Test health endpoint: GET `/health`
3. Test SSE endpoint: GET `/sse` (use EventSource)

## 🔒 Security Considerations

### Production Deployment

For production use, consider:

1. **Authentication**: Add API key or OAuth authentication
2. **HTTPS**: Use TLS/SSL certificates
3. **Rate Limiting**: Implement request rate limits
4. **CORS**: Restrict allowed origins
5. **Environment Variables**: Use secure secret management
6. **Firewall**: Restrict access to trusted IPs

### Example with Authentication

```typescript
// Add to Express middleware
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

## 📊 Monitoring

### Health Check Endpoint

```bash
curl http://localhost:3000/health
```

Returns server status and configuration.

### Logs

The server logs to console:
- Connection events
- Request handling
- Errors and warnings

### Process Management

Use PM2 for production:

```bash
npm install -g pm2
pm2 start build/index.js --name servicenow-sse
pm2 logs servicenow-sse
pm2 restart servicenow-sse
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
export PORT=3001
npm start
```

### CORS Errors

The server has CORS enabled for all origins. If you need to restrict:

```typescript
app.use(cors({
  origin: 'https://your-domain.com',
  methods: ['GET', 'POST'],
}));
```

### ServiceNow Connection Issues

1. Verify credentials are correct
2. Check ServiceNow instance URL (no trailing slash)
3. Ensure user has `itil` role
4. Test ServiceNow API directly with curl

### SSE Connection Drops

- Check network stability
- Implement reconnection logic in client
- Monitor server logs for errors

## 🚀 Deployment

### Local Development

```bash
npm run dev
```

### Production

```bash
# Build
npm run build

# Start with PM2
pm2 start build/index.js --name servicenow-sse

# Or with systemd
sudo systemctl start servicenow-sse
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "build/index.js"]
```

## 📚 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API information and available tools |
| `/health` | GET | Health check and server status |
| `/sse` | GET | MCP SSE connection endpoint |
| `/message` | POST | MCP message handling (used by SSE) |

## 🔄 Comparison with Stdio Server

Both servers provide the same ServiceNow tools, but differ in access method:

**Use Stdio Server when:**
- Only using with AI assistants (Bob, Claude)
- Don't need browser access
- Want simpler configuration
- Prefer no exposed ports

**Use SSE Server when:**
- Need browser access
- Want to test with curl/Postman
- Building web applications
- Need HTTP health checks
- Want monitoring endpoints

## 📖 Additional Resources

- [MCP Protocol Documentation](https://modelcontextprotocol.io/)
- [ServiceNow REST API](https://developer.servicenow.com/dev.do#!/reference/api/latest/rest/)
- [Server-Sent Events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)

## 📝 License

MIT

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section
2. Review ServiceNow API documentation
3. Verify server logs
4. Test with curl before using with clients