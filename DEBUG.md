# Debugging Desktop Transcription Issue

## The Problem
Desktop app shows "Error: Transcription failed: Unauthorized" but web version works.

## Root Cause
The Next.js server was started **before** `.env.local` was created/updated, so it doesn't have the `OPEN_KEY` environment variable loaded.

## Solution

### Step 1: Stop All Servers
```bash
# Kill all Next.js processes
pkill -f 'next-server'
lsof -ti:3000 | xargs kill -9 2>/dev/null
```

### Step 2: Verify .env.local
```bash
# Check the file exists and has your key
head -1 .env.local
# Should show: OPEN_KEY=sk-proj-...
```

### Step 3: Restart Fresh
```bash
npm run tauri:dev
```

### Step 4: Test API Key is Loaded
Open in browser: `http://localhost:3000/api/test-env`

Should show:
```json
{
  "message": "✅ API key is loaded correctly!",
  "envCheck": {
    "OPEN_KEY_exists": true,
    "OPEN_KEY_starts_with_sk": true
  }
}
```

### Step 5: Try Transcribing
1. Record audio in desktop app
2. Check **SERVER console** (not browser console) for:
   ```
   🔍 Transcription API Config Check:
      hasApiKey: true  ← Should be TRUE
   ```

## If Still Not Working

Check server console logs when you try to transcribe. Look for:
- `🔍 Transcription API Config Check` - shows if key is loaded
- `❌ Transcription API error` - shows the actual error from OpenAI

If `hasApiKey: false`, the server didn't load `.env.local`. Make sure:
1. `.env.local` is in project root (same folder as `package.json`)
2. File has no quotes around the key: `OPEN_KEY=sk-proj-...` (not `OPEN_KEY="sk-proj-..."`)
3. Server was restarted after creating/updating `.env.local`

