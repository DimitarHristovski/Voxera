# VOXERA Architecture

## Design Principles

1. **Desktop-first mindset** - This is not a web app. All decisions prioritize desktop UX.
2. **Global hotkeys, window lifecycle, native integration** - Core desktop features are first-class.
3. **All AI calls go through server routes or Tauri backend** - API keys never exposed to client.
4. **Structured output > free text** - Prefer deterministic, structured formats (Markdown, JSON).
5. **Prefer boring, stable solutions** - No fancy abstractions, just reliable code.
6. **Avoid adding dependencies unless necessary** - Minimal dependency footprint.

## Architecture Overview

```
┌─────────────────┐
│   Tauri (Rust)  │  ← Global hotkeys, window control, native APIs
└────────┬────────┘
         │ IPC
┌────────▼────────┐
│  Next.js (UI)   │  ← React components, UI state
└────────┬────────┘
         │ HTTP
┌────────▼────────┐
│  API Routes     │  ← Transcription, AI enrichment (server-side only)
└─────────────────┘
```

## Data Flow

1. **Recording**: Browser MediaRecorder API → Audio Blob
2. **Transcription**: Audio Blob → `/api/transcribe` → Text
3. **Enrichment**: Text → `/api/enrich` → Structured Output (Markdown/JSON/Plain)
4. **Display**: Structured Output → UI → Clipboard

## Key Components

### Tauri Backend (`src-tauri/src/main.rs`)
- **Global hotkeys**: Registers system-wide shortcuts (Cmd+Shift+V / Ctrl+Shift+V)
- **Window lifecycle**: Show/hide/focus window on hotkey
- **IPC commands**: Bridge between Rust and frontend

### API Routes (Server-side only)
- **`/api/transcribe`**: Audio → Text (keeps transcription API keys secure)
- **`/api/enrich`**: Text → Structured Output (keeps AI API keys secure)
  - Supports formats: `markdown`, `json`, `plain`
  - Structured output preferred for deterministic, usable results

### Frontend (`app/page.tsx`)
- **Recording state**: Manages audio recording lifecycle
- **Pipeline state**: Tracks Recording → Transcription → Enrichment → Complete
- **Hotkey handling**: Listens for Tauri events, triggers recording

## Security

- **API keys**: Stored in `.env.local`, only accessible server-side
- **No client exposure**: All external API calls happen in Next.js API routes
- **Tauri security**: Minimal allowlist, only required permissions

## Window Lifecycle

- **Hotkey behavior**: Shows window AND triggers recording (desktop-first)
- **Close behavior**: Default quit (can be changed to hide in `main.rs`)
- **Focus**: Window brought to front on hotkey press

## Output Formats

### Markdown (default)
Structured Markdown with headings, lists, formatting. Best for most use cases.

### JSON
Structured JSON with schema:
```json
{
  "summary": "...",
  "actionItems": [...],
  "topics": [...]
}
```

### Plain
Plain text fallback for simple use cases.

## Dependencies

**Minimal set:**
- Next.js, React, React DOM (UI framework)
- Tauri (desktop framework)
- Tailwind CSS (styling)
- TypeScript (type safety)

**No state management libraries** - React hooks are sufficient.
**No UI component libraries** - Custom components for desktop-first UX.

## Future Considerations

- **System tray**: Minimize to tray instead of quitting
- **Recording from background**: Start recording even when window hidden
- **Output format selection**: UI to choose markdown/json/plain
- **History**: Store previous recordings locally
- **Export**: Save outputs to files

