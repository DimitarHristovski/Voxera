#!/bin/bash
# Script to start Tauri dev with environment variables properly loaded

echo "🔄 Starting VOXERA with environment variables..."
echo ""

# Kill any existing servers
echo "🛑 Stopping existing servers..."
pkill -f 'next-server' 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null
sleep 2

# Verify .env.local exists
if [ ! -f .env.local ]; then
  echo "❌ ERROR: .env.local not found!"
  echo "   Create it with: OPEN_KEY=your_api_key_here"
  exit 1
fi

# Check if OPEN_KEY is set
if ! grep -q "^OPEN_KEY=" .env.local; then
  echo "❌ ERROR: OPEN_KEY not found in .env.local"
  exit 1
fi

echo "✅ .env.local found and verified"
echo ""

# Start Tauri dev (this will start Next.js which loads .env.local)
echo "🚀 Starting Tauri dev server..."
echo "   The server will load .env.local automatically"
echo ""

npm run tauri:dev

