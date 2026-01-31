# Vercel Setup for VOXERA Desktop App

## Overview

Since your API keys are stored in Vercel's environment variables, you need to configure the desktop app to connect to your Vercel deployment.

## Step 1: Get Your Vercel URL

1. Go to your Vercel dashboard
2. Find your VOXERA project
3. Copy the deployment URL (e.g., `https://voxera.vercel.app` or `https://voxera-xyz.vercel.app`)

## Step 2: Update Tauri Configuration

Edit `src-tauri/tauri.conf.json` and replace `YOUR_VERCEL_URL` with your actual Vercel URL:

```json
{
  "build": {
    "beforeDevCommand": "",
    "beforeBuildCommand": "npm run build",
    "devPath": "https://YOUR_VERCEL_URL.vercel.app",
    "distDir": "../.next/standalone",
    "withGlobalTauri": false
  }
}
```

**Example:**
```json
"devPath": "https://voxera.vercel.app"
```

## Step 3: Verify Vercel Environment Variables

Make sure these are set in your Vercel project settings:

- `OPENAI_API_BASE_URL` (e.g., `https://api.openai.com/v1`)
- `OPENAI_API_KEY` (your API key)
- `OPENAI_MODEL` (e.g., `gpt-4`)
- `WHISPER_MODEL` (e.g., `whisper-1`)

## Step 4: Rebuild Desktop App

After updating the Vercel URL:

```bash
npm run tauri:build
```

## Step 5: Test

1. Run the built desktop app
2. It should connect to your Vercel deployment
3. API calls will use the keys stored in Vercel

## Important Notes

- **No local server needed**: The desktop app connects directly to Vercel
- **API keys stay secure**: They're only in Vercel, never in the desktop app
- **HTTPS required**: Vercel uses HTTPS, which is secure
- **CORS**: Vercel should handle CORS automatically for Next.js apps

## Troubleshooting

### App doesn't connect to Vercel
- Check the URL in `tauri.conf.json` matches your Vercel deployment
- Verify the Vercel deployment is live and accessible
- Check browser console for connection errors

### API calls fail
- Verify environment variables are set in Vercel
- Check Vercel function logs for errors
- Ensure API routes are deployed correctly

### CORS errors
- Vercel should handle CORS automatically
- If issues persist, check Vercel logs

