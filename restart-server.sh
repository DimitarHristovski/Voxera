#!/bin/bash
echo "🛑 Stopping all Next.js servers..."
pkill -f 'next-server' 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null
sleep 2
echo "✅ All servers stopped"
echo ""
echo "🚀 Now run: npm run tauri:dev"
echo "   This will start a fresh server that loads .env.local"
