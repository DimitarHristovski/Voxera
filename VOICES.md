# Google Voices Installation Guide

## How Google Voices Work

Google voices are provided by the browser's Web Speech API (`window.speechSynthesis`). They are **not installed separately** - they come bundled with Chromium-based browsers.

## For VOXERA Desktop App

VOXERA uses Tauri, which embeds a webview (browser engine) to display the UI. The voices available depend on the webview engine:

### macOS
- Uses **WebKit** (Safari's engine)
- Google voices may not be available by default
- System voices (Siri, etc.) are available through the Web Speech API

### Windows
- Uses **Edge WebView2** (Chromium-based)
- Google voices should be available automatically
- If not, ensure Edge is up to date

### Linux
- Uses **WebKitGTK** or **Chromium**
- Google voices depend on the installed webview
- May need to install additional speech packages

## Checking Available Voices

1. **Open the app** and open the browser console (F12 or right-click → Inspect)
2. **Look for console messages:**
   ```
   🎤 Loaded X Google voices (1 per language) from Y available Google voices
   Available languages: en (Google US English), es (Google español), ...
   ```
3. **If you see:**
   ```
   ⚠️ No Google voices found. Make sure you have Google voices installed.
   All available voices: [list of voices]
   ```
   Then Google voices are not available in your webview.

## Solutions

### Option 1: Use Chrome/Chromium Webview (Recommended)
- Ensure you're using a Chromium-based webview
- On Windows: Edge WebView2 (usually installed automatically)
- On Linux: May need to install Chromium or use a Chromium-based browser

### Option 2: Use System Voices
If Google voices aren't available, the app can fall back to system voices. However, the current implementation filters for Google voices only. To use system voices:

1. Modify `components/OutputDisplay.tsx`
2. Change the filter to include all voices instead of just Google voices
3. Or remove the Google-only filter entirely

### Option 3: Test in Browser First
1. Open Chrome/Edge browser
2. Go to `http://localhost:3000` (when your Next.js server is running)
3. Check if Google voices are available in the browser
4. If they work in the browser, they should work in the Tauri app

## Verifying Voices Work

1. **Record some audio** and get a transcript
2. **Click the "Read" button** in the output display
3. **If you hear speech**, the voice is working
4. **If you don't hear anything**, check:
   - Browser console for errors
   - System volume settings
   - Voice selection in the dropdown

## Technical Details

The app filters voices using:
```javascript
const googleVoices = allVoices.filter(voice => {
  const nameLower = voice.name.toLowerCase()
  const uriLower = voice.voiceURI.toLowerCase()
  return nameLower.includes('google') || uriLower.includes('google')
})
```

This checks if "google" appears in the voice name or URI. Common Google voice names include:
- "Google US English"
- "Google español"
- "Google français"
- etc.

## Troubleshooting

**Q: No voices appear in the dropdown**
- Check browser console for errors
- Verify `window.speechSynthesis` is available
- Try refreshing the app

**Q: Voices appear but don't speak**
- Check system volume
- Verify the selected voice is valid
- Check browser console for speech synthesis errors

**Q: Only system voices, no Google voices**
- Your webview may not support Google voices
- Consider using system voices or switching to a Chromium-based webview

