#!/bin/bash
echo "=== VOXERA Server Environment Diagnostic ==="
echo ""
echo "1. Checking .env.local file:"
if [ -f .env.local ]; then
  echo "   ✅ .env.local exists"
  OPEN_KEY_LINE=$(head -1 .env.local)
  if [[ $OPEN_KEY_LINE == OPEN_KEY=* ]]; then
    KEY_LENGTH=$(echo "$OPEN_KEY_LINE" | cut -d'=' -f2 | wc -c)
    echo "   ✅ Format correct (starts with OPEN_KEY=)"
    echo "   Key length: $KEY_LENGTH characters"
  else
    echo "   ❌ Format incorrect - should start with OPEN_KEY="
  fi
else
  echo "   ❌ .env.local NOT FOUND"
fi

echo ""
echo "2. Checking for running Next.js servers:"
lsof -ti:3000 2>/dev/null | while read pid; do
  echo "   Process $pid on port 3000:"
  ps -p $pid -o command= 2>/dev/null | head -1
done || echo "   No processes on port 3000"

echo ""
echo "3. To fix:"
echo "   - Kill all servers: pkill -f 'next-server' && lsof -ti:3000 | xargs kill -9 2>/dev/null"
echo "   - Restart: npm run tauri:dev"
echo "   - Test: http://localhost:3000/api/test-env"
