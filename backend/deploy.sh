#!/bin/bash

# CardTracker Pro Backend Deployment Script for Render

echo "🚀 Starting CardTracker Pro Backend Deployment..."

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the backend directory"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed"
    exit 1
fi

echo "✅ Node.js and npm are available"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if installation was successful
if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check if server.js exists
if [ ! -f "server.js" ]; then
    echo "❌ Error: server.js not found"
    exit 1
fi

echo "✅ server.js found"

# Check if required environment variables are set (for production)
if [ "$NODE_ENV" = "production" ]; then
    echo "🔍 Checking production environment variables..."
    
    required_vars=("MONGODB_URI" "JWT_SECRET" "PORT")
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        echo "❌ Error: Missing required environment variables:"
        printf '%s\n' "${missing_vars[@]}"
        echo "Please set these variables in your Render dashboard"
        exit 1
    fi
    
    echo "✅ All required environment variables are set"
fi

# Test the server
echo "🧪 Testing server startup..."
timeout 10s node server.js &
SERVER_PID=$!
sleep 3

# Check if server is running
if ps -p $SERVER_PID > /dev/null; then
    echo "✅ Server started successfully"
    kill $SERVER_PID 2>/dev/null
else
    echo "❌ Error: Server failed to start"
    exit 1
fi

echo "🎉 CardTracker Pro Backend is ready for deployment!"
echo ""
echo "📋 Next steps:"
echo "1. Push your code to GitHub"
echo "2. Connect your repository to Render"
echo "3. Set environment variables in Render dashboard"
echo "4. Deploy your service"
echo ""
echo "🔗 Useful links:"
echo "- Render Dashboard: https://dashboard.render.com"
echo "- MongoDB Atlas: https://cloud.mongodb.com"
echo "- SendGrid: https://app.sendgrid.com"
echo ""
echo "📚 Documentation: backend/RENDER_DEPLOYMENT.md"
