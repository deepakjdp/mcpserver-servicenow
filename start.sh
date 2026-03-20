#!/bin/bash

# ServiceNow MCP Server (SSE) Start Script

echo "🚀 Starting ServiceNow MCP Server (SSE)..."
echo ""

# Check if environment variables are set
if [ -z "$SERVICENOW_INSTANCE_URL" ]; then
    echo "⚠️  Warning: SERVICENOW_INSTANCE_URL not set"
    echo "Please set your ServiceNow credentials:"
    echo ""
    echo "export SERVICENOW_INSTANCE_URL=\"https://your-instance.service-now.com\""
    echo "export SERVICENOW_USERNAME=\"your-username\""
    echo "export SERVICENOW_PASSWORD=\"your-password\""
    echo ""
    echo "Then run this script again."
    exit 1
fi

if [ -z "$SERVICENOW_USERNAME" ]; then
    echo "❌ Error: SERVICENOW_USERNAME not set"
    exit 1
fi

if [ -z "$SERVICENOW_PASSWORD" ]; then
    echo "❌ Error: SERVICENOW_PASSWORD not set"
    exit 1
fi

echo "✓ ServiceNow Instance: $SERVICENOW_INSTANCE_URL"
echo "✓ Username: $SERVICENOW_USERNAME"
echo ""

# Check if build directory exists
if [ ! -d "build" ]; then
    echo "📦 Build directory not found. Building..."
    /usr/local/bin/npm run build
    echo ""
fi

# Start the server
echo "🌐 Starting server on port ${PORT:-3000}..."
echo ""
/usr/local/bin/npm start

# Made with Bob
