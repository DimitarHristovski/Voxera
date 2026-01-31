# VOXERA

A desktop application for voice capture, transcription, and AI enrichment. Built with Next.js (App Router) and Tauri.

## Problem

Voice input is faster and more natural than typing, but raw transcripts are often unstructured and require manual formatting. VOXERA solves this by providing a seamless desktop workflow that:

- Captures voice input via global hotkey
- Transcribes speech to text
- Enriches transcripts into structured, usable output (Markdown, JSON, or plain text)
- Delivers copy-ready results for immediate use

The app runs as a standalone desktop application, allowing users to activate it from anywhere via a key combination, speak naturally, and receive processed, structured output.

## Architecture Overview

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

### Voice Pipeline

The core pipeline follows a deterministic flow:

1. **Recording** → Browser MediaRecorder API captures audio from microphone
2. **Transcription** → Audio blob sent to `/api/transcribe` (server-side, keeps API keys secure)
3. **Enrichment** → Transcript sent to `/api/enrich` for AI processing (formatting, structuring, context adaptation)
4. **Output** → Structured result displayed and ready to copy

### Technology Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Desktop Framework**: Tauri (Rust) for native desktop integration
- **Audio**: Browser MediaRecorder API (WebM/Opus format)
- **Backend**: Next.js API routes for secure server-side processing

## Setup Instructions

### Prerequisites

- **Node.js** 18+ and npm
- **Rust** (for Tauri) - Install via [rustup](https://rustup.rs/)
  - On macOS/Linux: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
  - On Windows: Download and run the installer from rustup.rs
- **System dependencies** for Tauri (varies by OS):
  - macOS: Xcode Command Line Tools
  - Linux: `libwebkit2gtk-4.0-dev`, `build-essential`, `curl`, `wget`, `libssl-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`
  - Windows: Microsoft Visual Studio C++ Build Tools

### Installation

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and configure your API settings:
   
   **For Local OpenAI API** (recommended for privacy/offline):
   ```env
   OPENAI_API_BASE_URL=http://localhost:8080/v1
   OPENAI_API_KEY=
   OPENAI_MODEL=gpt-4
   WHISPER_MODEL=whisper-1
   ```
   
   **For Cloud OpenAI API**:
   ```env
   OPENAI_API_BASE_URL=https://api.openai.com/v1
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-4
   WHISPER_MODEL=whisper-1
   ```
   
   The app supports any OpenAI-compatible API endpoint, including:
   - LocalAI (https://github.com/go-skynet/LocalAI)
   - Ollama (https://ollama.ai)
   - vLLM
   - Any other OpenAI-compatible server

3. **Run in development mode**:

   **Option A: Server runs independently (recommended)**:
   ```bash
   # Terminal 1: Start the server (runs independently)
   npm run server:dev
   
   # Terminal 2: Start the Tauri app (connects to existing server)
   npm run tauri:dev
   ```
   The server will continue running even if you quit the Tauri app!

   **Option B: Traditional mode** (server stops when app quits):
   ```bash
   npm run tauri:dev
   ```
   This will:
   - Start the Next.js dev server on `http://localhost:3000`
   - Compile the Tauri Rust backend
   - Launch the desktop application

4. **Build for production**:
   ```bash
   npm run build
   npm run tauri:build
   ```
   Outputs platform-specific installers in `src-tauri/target/release/bundle/`

5. **Run production server independently**:
   ```bash
   # Start the standalone server (runs independently)
   npm run server:start
   
   # Then run the built Tauri app
   # The server will continue running even if you quit the app!
   ```
   
   See `SERVER_SETUP.md` for detailed server setup instructions.

### First Run

1. Launch the app (via `npm run tauri:dev` or the built executable)
2. Grant microphone permissions when prompted
3. Press the global hotkey (`Cmd+Shift+V` on macOS, `Ctrl+Shift+V` on Windows/Linux) to activate
4. Click the record button (or use hotkey again) to start recording
5. Speak naturally
6. Click stop (or use hotkey again) to process
7. View the enriched output and copy to clipboard

## Design Decisions

### Desktop-First Approach

- **Global hotkeys**: System-wide keyboard shortcuts work even when the app is in the background
- **Window lifecycle**: Hotkey shows and focuses the window, then triggers recording
- **Native integration**: Tauri provides access to OS-level features without web limitations
- **Standalone execution**: App runs independently, not in a browser
- **Always-on server**: The Next.js server runs continuously - closing the window hides it but keeps the server active. Use the hotkey to bring the window back.

### Security: Server-Side API Calls

- **All AI calls go through Next.js API routes**: API keys are stored in `.env.local` and never exposed to the client
- **No client-side API exposure**: Transcription and enrichment services are called server-side only
- **Minimal Tauri permissions**: Only required permissions are enabled (hotkeys, window control)

### Structured Output Over Free Text

- **Format options**: Markdown (default), JSON, or plain text
- **Deterministic results**: Structured formats ensure consistent, usable output
- **Copy-ready**: Output is formatted for immediate use (paste into documents, code, etc.)

### Boring, Stable Solutions

- **No external state management**: React hooks are sufficient for this app's complexity
- **No UI component libraries**: Custom components tailored for desktop UX
- **Minimal dependencies**: Only essential packages (Next.js, React, Tauri, Tailwind)
- **Explicit code**: Prefer clear, straightforward implementations over clever abstractions

### Hotkey Activation

- **Default hotkey**: `Cmd+Shift+V` (macOS) or `Ctrl+Shift+V` (Windows/Linux)
- **Customizable**: Modify in `src-tauri/src/main.rs` (`register_hotkey` function)
- **Desktop-first behavior**: Hotkey shows window AND triggers recording toggle
- **Works from anywhere**: Global shortcut works system-wide, even when app is hidden

### Enrichment Strategy

The enrichment step (`/api/enrich`) transforms raw transcripts into structured output. Current implementation supports:

- **Markdown**: Formatted text with headings, lists, emphasis
- **JSON**: Structured data with schema (summary, action items, topics)
- **Plain**: Simple text fallback

The enrichment logic can be customized to:
- Format transcripts into specific structures
- Extract action items or key points
- Adapt context (e.g., meeting notes, code comments, documentation)
- Summarize long transcripts
- Apply domain-specific transformations

## Project Structure

```
voxera/
├── app/                    # Next.js App Router
│   ├── api/               # Server-side API routes
│   │   ├── transcribe/    # Transcription endpoint
│   │   └── enrich/        # AI enrichment endpoint
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main page (pipeline orchestration)
│   └── globals.css         # Global styles
├── components/            # React components
│   ├── RecordingButton.tsx
│   ├── StatusIndicator.tsx
│   └── OutputDisplay.tsx
├── lib/                   # Utility libraries
│   └── audio-recorder.ts  # Audio recording logic
├── src-tauri/            # Tauri Rust backend
│   ├── src/
│   │   └── main.rs       # Tauri commands and hotkey handling
│   ├── Cargo.toml
│   └── tauri.conf.json
└── package.json
```

## Configuration

### Customizing Hotkeys

Edit `src-tauri/src/main.rs` and modify the `register_hotkey` function. Hotkey format follows Tauri's global shortcut syntax (e.g., `Command+Shift+V`, `Control+Alt+R`).

### API Integration

The app includes placeholder implementations. To enable full functionality:

1. **Transcription** (`app/api/transcribe/route.ts`):
   - Uncomment and configure OpenAI Whisper API integration
   - Or integrate with AssemblyAI, Deepgram, or another service
   - Ensure `OPENAI_API_KEY` (or equivalent) is set in `.env.local`

2. **Enrichment** (`app/api/enrich/route.ts`):
   - Uncomment and configure OpenAI GPT or Anthropic Claude integration
   - Customize the prompt to match your desired output format
   - Adjust temperature and other parameters for deterministic output

## Development Notes

- **Audio Format**: Records in WebM/Opus format for broad browser support
- **Error Handling**: All async operations include error handling and user feedback
- **State Management**: Uses React hooks (no external state library needed)
- **Type Safety**: Full TypeScript coverage

## Troubleshooting

- **"Cargo not found"**: Ensure Rust is installed and `~/.cargo/bin` is in your PATH
- **Hotkey not working**: Check system permissions (macOS may require Accessibility permissions)
- **Microphone not working**: Grant microphone permissions in system settings
- **API errors**: Verify API keys are set in `.env.local` and the file is not committed to git

## License

[Your License Here]
