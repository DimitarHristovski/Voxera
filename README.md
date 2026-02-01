# VOXERA

A desktop application for voice capture, transcription, and AI enrichment. Built with Next.js (App Router) and Tauri.

## Table of Contents

- [Problem](#problem)
- [Features](#features)
- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)
- [Voice System](#voice-system)
- [Development](#development)
- [Troubleshooting](#troubleshooting)

## Problem

Voice input is faster and more natural than typing, but raw transcripts are often unstructured and require manual formatting. VOXERA solves this by providing a seamless desktop workflow that:

- Captures voice input via global hotkey or wake word
- Transcribes speech to text using AI
- Enriches transcripts into structured, usable output (Markdown, JSON, or plain text)
- Delivers copy-ready results for immediate use
- Supports multiple languages for transcription and output
- Provides text-to-speech with high-quality voice selection

The app runs as a standalone desktop application, allowing users to activate it from anywhere via a key combination, speak naturally, and receive processed, structured output.

## Features

### Core Features

- **Global Hotkey Activation**: Press `Cmd+Shift+V` (macOS) or `Ctrl+Shift+V` (Windows/Linux) from anywhere to activate
- **Wake Word Detection**: Say "Hey Voxera" to start recording automatically
- **Multi-language Support**: Transcribe and output in 8+ languages (English, Spanish, French, German, Italian, Portuguese, Russian)
- **Automatic Mode Detection**: Intelligently detects context (meeting, journal, task, planning, etc.) and formats accordingly
- **Structured Output**: Formats output as Markdown, JSON, or plain text
- **Text-to-Speech**: High-quality voice selection with one voice per language
- **Translation**: Translate transcripts to different languages
- **Usage Tracking**: Monitor token usage and costs

### Enrichment Modes

The app automatically detects and formats content for:

- **Meeting Notes**: Structured meeting summaries with action items
- **Journal Entries**: Personal reflections and diary entries
- **Task Lists**: Actionable todo items and reminders
- **Planning**: Roadmaps, goals, and strategic planning
- **Development Notes**: Code discussions and technical notes
- **Research**: Explanations, summaries, and learning notes
- **Creative Writing**: Stories, narratives, and fiction
- **Sales Notes**: Client calls, objections, and follow-ups
- **Therapy Notes**: Emotional processing and self-analysis
- **Commands**: Automation scripts and technical commands

## How It Works

### Voice Pipeline

The core pipeline follows a deterministic flow:

```
┌─────────────┐
│  Recording  │  ← Browser MediaRecorder API captures audio
└──────┬──────┘
       │
       ▼
┌─────────────┐
│Transcription│  ← Audio sent to /api/transcribe (OpenAI Whisper)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Enrichment │  ← Transcript sent to /api/enrich (AI processing)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Output    │  ← Structured result (Markdown/JSON/Plain)
└─────────────┘
```

### Step-by-Step Process

1. **Activation**: User presses hotkey or says "Hey Voxera"
2. **Recording**: Browser captures audio from microphone (WebM/Opus format)
3. **Transcription**: Audio blob sent to `/api/transcribe` endpoint
   - Server uses OpenAI Whisper API (or compatible service)
   - Returns transcript and detected language
4. **Enrichment**: Transcript sent to `/api/enrich` endpoint
   - AI analyzes content and detects mode (meeting, journal, etc.)
   - Applies appropriate formatting based on detected mode
   - Returns structured output in requested format
5. **Display**: Formatted output shown in UI
   - User can edit, copy, download, or translate
   - Text-to-speech available with voice selection

### Security Model

- **Server-Side API Calls**: All AI API calls happen server-side only
- **API Key Protection**: Keys stored in `.env.local`, never exposed to client
- **No Client Exposure**: Transcription and enrichment services are server-only
- **Minimal Permissions**: Tauri only requests necessary permissions (hotkeys, microphone)

## Architecture

VOXERA follows a desktop-first architecture with clear separation of concerns:

```
┌─────────────────┐
│   Tauri (Rust)  │  ← Global hotkeys, window lifecycle, native APIs
└────────┬────────┘
         │ IPC (Inter-Process Communication)
┌────────▼────────┐
│  Next.js (UI)   │  ← React components, UI state management
└────────┬────────┘
         │ HTTP (Server Routes)
┌────────▼────────┐
│  API Routes     │  ← Transcription & AI enrichment (server-side only)
└─────────────────┘
```

### Technology Stack

- **Frontend**: Next.js 16 (App Router), React 18, TypeScript, Tailwind CSS
- **Desktop Framework**: Tauri 1.x (Rust) for native desktop integration
- **Audio**: Browser MediaRecorder API (WebM/Opus format)
- **Backend**: Next.js API routes for secure server-side processing
- **AI Services**: OpenAI Whisper (transcription), OpenAI GPT (enrichment)
- **Speech Synthesis**: Web Speech API with quality-based voice selection

### Project Structure

```
voxera/
├── app/                    # Next.js App Router
│   ├── api/               # Server-side API routes
│   │   ├── transcribe/    # Transcription endpoint
│   │   ├── enrich/        # AI enrichment endpoint
│   │   ├── translate/     # Translation endpoint
│   │   ├── test-env/      # Environment variable testing
│   │   └── test-openai/   # OpenAI API key testing
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main page (pipeline orchestration)
│   └── globals.css         # Global styles
├── components/            # React components
│   ├── RecordingButton.tsx  # Recording UI component
│   ├── StatusIndicator.tsx  # Status display
│   └── OutputDisplay.tsx     # Output display with TTS, translation
├── lib/                   # Utility libraries
│   ├── audio-recorder.ts  # Audio recording logic
│   ├── media-devices.ts   # Media device utilities
│   ├── i18n.ts            # Internationalization
│   └── wake-word-detector.ts  # Wake word detection
├── src-tauri/            # Tauri Rust backend
│   ├── src/
│   │   └── main.rs       # Tauri commands and hotkey handling
│   ├── Cargo.toml
│   ├── tauri.conf.json   # Tauri configuration
│   └── Info.plist        # macOS permissions
└── package.json
```

## Installation

### Prerequisites

- **Node.js** 18+ and npm
- **Rust** (for Tauri) - Install via [rustup](https://rustup.rs/)
  - On macOS/Linux: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
  - On Windows: Download and run the installer from rustup.rs
- **System dependencies** for Tauri (varies by OS):
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
  - **Linux**: `libwebkit2gtk-4.0-dev`, `build-essential`, `curl`, `wget`, `libssl-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`
  - **Windows**: Microsoft Visual Studio C++ Build Tools

### Installation Steps

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd Voxera
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure environment variables**:

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your API key:

   ```env
   OPEN_KEY=your_openai_api_key_here
   OPENAI_API_BASE_URL=https://api.openai.com/v1
   WHISPER_MODEL=whisper-1
   OPENAI_MODEL=gpt-3.5-turbo
   ```

   **Note**: The app uses `OPEN_KEY` (not `OPENAI_API_KEY`) for the API key.

4. **Run in development mode**:

   ```bash
   npm run tauri:dev
   ```

   This will:
   - Start the Next.js dev server on `http://localhost:3000`
   - Compile the Tauri Rust backend
   - Launch the desktop application

5. **Build for production**:

   ```bash
   npm run build
   npm run tauri:build
   ```

   Outputs platform-specific installers in `src-tauri/target/release/bundle/`

### First Run

1. Launch the app (via `npm run tauri:dev` or the built executable)
2. Grant microphone permissions when prompted
   - **macOS**: System Settings → Privacy & Security → Microphone → Enable for Terminal (dev) or VOXERA (production)
   - **Windows**: Settings → Privacy → Microphone → Allow apps to access microphone
   - **Linux**: Depends on your desktop environment
3. Press the global hotkey (`Cmd+Shift+M` on macOS, `Ctrl+Shift+M` on Windows/Linux) to activate
4. Click the record button (or use hotkey again) to start recording
5. Speak naturally
6. Click stop (or use hotkey again) to process
7. View the enriched output and copy to clipboard

## Configuration

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Required: OpenAI API Key
OPEN_KEY=sk-proj-your-api-key-here

# Optional: OpenAI API Base URL (defaults to https://api.openai.com/v1)
OPENAI_API_BASE_URL=https://api.openai.com/v1

# Optional: Whisper Model (defaults to whisper-1)
WHISPER_MODEL=whisper-1

# Optional: OpenAI Model for enrichment (defaults to gpt-3.5-turbo)
OPENAI_MODEL=gpt-3.5-turbo
```

**Important**:

- The API key variable is `OPEN_KEY` (not `OPENAI_API_KEY`)
- Restart the Next.js server after changing `.env.local`
- Never commit `.env.local` to version control

### Customizing Hotkeys

Edit `src-tauri/src/main.rs` and modify the `register_hotkey` function:

```rust
let default_hotkey = "CommandOrControl+Shift+M";
```

Hotkey format follows Tauri's global shortcut syntax:

- `Command+Shift+V` (macOS)
- `Control+Shift+V` (Windows/Linux)
- `CommandOrControl+Shift+V` (works on both)

### API Endpoint Configuration

The app supports any OpenAI-compatible API endpoint, including:

- **LocalAI**: `http://localhost:8080/v1`
- **Ollama**: Configure to use OpenAI-compatible endpoint
- **vLLM**: Self-hosted OpenAI-compatible server
- **Cloud OpenAI**: `https://api.openai.com/v1` (default)

## Usage Guide

### Recording Methods

1. **Global Hotkey**: Press `Cmd+Shift+V` (macOS) or `Ctrl+Shift+V` (Windows/Linux)
   - Shows and focuses the window
   - Toggles recording on/off
   - Works from anywhere, even when app is hidden

2. **Wake Word**: Say "Hey Voxera"
   - Automatically starts recording
   - Works when app is in background
   - Requires microphone permissions

3. **Record Button**: Click the large record button in the UI
   - Manual start/stop control
   - Visual feedback during recording

### Output Formats

The app supports three output formats:

- **Markdown** (default): Structured text with headings, lists, emphasis
  - Best for: Notes, documentation, meeting summaries
- **JSON**: Structured data with schema
  - Best for: Programmatic use, data extraction
- **Plain**: Simple text fallback
  - Best for: Quick notes, simple text

### Text-to-Speech

- **Voice Selection**: Automatically selects best voice for detected language
- **Quality Priority**: Prefers Google voices, then neural/enhanced voices
- **One Voice Per Language**: Simplified selection (1 voice per language)
- **Controls**: Adjust speed, pitch, and voice selection
- **Read Button**: Click to hear the output read aloud

### Translation

- **Target Language**: Select from 8+ supported languages
- **Automatic Detection**: Detects source language from transcript
- **Preserves Formatting**: Maintains structure during translation
- **Usage Tracking**: Monitors token usage and costs

## API Documentation

### POST `/api/transcribe`

Transcribes audio to text using OpenAI Whisper API.

**Request**:

- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: FormData with `audio` field (File/Blob)

**Response**:

```json
{
  "transcript": "The transcribed text...",
  "language": "en"
}
```

**Error Responses**:

- `400`: No audio file provided
- `401`: API key invalid or expired
- `500`: Server error or API key not configured

### POST `/api/enrich`

Enriches transcript with AI processing and formatting.

**Request**:

```json
{
  "transcript": "Raw transcript text...",
  "format": "markdown" | "json" | "plain",
  "language": "en"
}
```

**Response**:

```json
{
  "output": "Enriched and formatted text...",
  "format": "markdown",
  "mode": "meeting",
  "usage": {
    "promptTokens": 100,
    "completionTokens": 200,
    "totalTokens": 300,
    "model": "gpt-3.5-turbo"
  }
}
```

**Auto-Detected Modes**:

- `meeting`: Meeting notes, discussions, decisions
- `journal`: Personal thoughts, reflections
- `task-capture`: Todo items, tasks, reminders
- `planning`: Roadmaps, goals, strategic planning
- `development`: Code discussions, technical notes
- `research`: Explanations, summaries, learning notes
- `sales`: Sales/client calls, objections, follow-ups
- `creative-writing`: Stories, narratives, fiction
- `therapy`: Emotional processing, self-analysis
- `command`: Commands, automation scripts

### POST `/api/translate`

Translates text to target language.

**Request**:

```json
{
  "text": "Text to translate...",
  "targetLanguage": "es"
}
```

**Response**:

```json
{
  "translatedText": "Translated text...",
  "targetLanguage": "es",
  "usage": {
    "promptTokens": 50,
    "completionTokens": 100,
    "totalTokens": 150,
    "model": "gpt-3.5-turbo"
  }
}
```

### GET `/api/test-env`

Tests if environment variables are loaded correctly.

**Response**:

```json
{
  "success": true,
  "envCheck": {
    "OPEN_KEY_exists": true,
    "OPEN_KEY_length": 164,
    "OPEN_KEY_starts_with_sk": true,
    "OPEN_KEY_prefix": "sk-proj-pV...",
    "OPENAI_API_BASE_URL": "https://api.openai.com/v1",
    "WHISPER_MODEL": "whisper-1"
  },
  "message": "✅ API key is loaded correctly!"
}
```

### GET `/api/test-openai`

Tests if OpenAI API key is valid and working.

**Response**:

```json
{
  "success": true,
  "message": "✅ API key is valid and working!",
  "apiKeyInfo": {
    "prefix": "sk-proj-pV...",
    "length": 164,
    "startsWithSk": true
  }
}
```

## Voice System

### Voice Selection

The app uses a quality-based voice selection system:

1. **Quality Scoring**: Voices are scored based on:
   - Google voices: +100 points (highest quality)
   - Neural/Enhanced voices: +50/+40 points
   - Premium voices: +30 points
   - Region-specific voices: +20 points
   - High-quality providers (Siri, etc.): +25/+15 points
   - Low-quality indicators: -10/-20 points

2. **Selection Priority**:
   - Highest quality score wins
   - One voice per language (base language code)
   - Prefers Google voices when available
   - Falls back to system voices if needed

3. **Available Voices**:
   - Google voices (if available in webview)
   - System voices (Siri, Windows voices, etc.)
   - Neural/Enhanced voices (premium quality)

### Voice Installation

Google voices come bundled with Chromium-based browsers and cannot be installed separately. The app automatically uses the best available voice for each language.

**To verify voices**:

1. Open the app and check browser console (F12)
2. Look for: `🎤 Loaded X high-quality voices (1 per language)`
3. Check available languages in the console output

**If no Google voices**:

- The app will use system voices as fallback
- On macOS: System voices (Siri, etc.) are available
- On Windows: Windows voices are available
- On Linux: Depends on installed speech engines

## Development

### Development Mode

```bash
npm run tauri:dev
```

This starts:

- Next.js dev server on `http://localhost:3000`
- Tauri development build
- Hot reload for both frontend and backend

### Building

```bash
# Build Next.js app
npm run build

# Build Tauri app
npm run tauri:build
```

Outputs are in `src-tauri/target/release/bundle/`

### Code Structure

- **Frontend**: React components in `app/` and `components/`
- **Backend**: API routes in `app/api/`
- **Desktop**: Rust code in `src-tauri/src/`
- **Utilities**: Helper functions in `lib/`

### Key Files

- `app/page.tsx`: Main pipeline orchestration
- `app/api/transcribe/route.ts`: Transcription endpoint
- `app/api/enrich/route.ts`: Enrichment endpoint with mode detection
- `components/OutputDisplay.tsx`: Output UI with TTS and translation
- `src-tauri/src/main.rs`: Hotkey handling and window management
- `lib/wake-word-detector.ts`: Wake word detection logic

## Troubleshooting

### Common Issues

**"Cargo not found"**

- Ensure Rust is installed: `rustup --version`
- Add `~/.cargo/bin` to your PATH

**Hotkey not working**

- Check system permissions:
  - **macOS**: System Settings → Privacy & Security → Accessibility → Enable for Terminal (dev) or VOXERA (production)
  - **Windows**: Settings → Privacy → Keyboard → Allow apps to access keyboard shortcuts
  - **Linux**: Depends on desktop environment

**Microphone not working**

- Grant microphone permissions in system settings
- **macOS**: System Settings → Privacy & Security → Microphone
- **Windows**: Settings → Privacy → Microphone
- Check browser console for permission errors

**"Transcription failed: Unauthorized"**

- Verify `OPEN_KEY` is set in `.env.local`
- Restart the Next.js server after changing `.env.local`
- Test API key: Open `http://localhost:3000/api/test-env`
- Check server console for detailed error messages

**No voices available**

- Check browser console for voice loading messages
- Verify webview supports Web Speech API
- On macOS: System voices should be available
- On Windows: Windows voices should be available

**Port 3000 already in use**

- Kill existing process: `lsof -ti:3000 | xargs kill -9` (macOS/Linux)
- Or use a different port in `next.config.js`

### Debugging

1. **Check server logs**: Look at the terminal where you ran `npm run tauri:dev`
2. **Check browser console**: F12 or right-click → Inspect
3. **Test endpoints**:
   - `http://localhost:3000/api/test-env` - Check environment variables
   - `http://localhost:3000/api/test-openai` - Test API key validity
4. **Verify API key**: Ensure it starts with `sk-` and is not expired

### Getting Help

- Check server console logs for detailed error messages
- Verify `.env.local` is in the project root
- Ensure API key is valid and has sufficient quota
- Test API key directly: `curl https://api.openai.com/v1/models -H "Authorization: Bearer YOUR_KEY"`

## License

[Your License Here]

---

**VOXERA** - Voice capture and AI enrichment desktop app. Built with ❤️ using Next.js and Tauri.
