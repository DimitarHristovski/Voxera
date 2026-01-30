// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, Window, AppHandle};

// Tauri command to register global hotkeys
// Desktop-first: Hotkey triggers recording directly, even when window is hidden
#[tauri::command]
async fn register_hotkey(
    window: Window,
    shortcut: String,
) -> Result<String, String> {
    let app_handle = window.app_handle();
    
    // Register global shortcut using global_shortcut_manager
    // Default: Command+T (Mac) or Control+T (Windows/Linux)
    // Desktop-first behavior: Show window AND trigger recording toggle
    let shortcut_clone = shortcut.clone();
    app_handle
        .global_shortcut_manager()
        .register(&shortcut, move |_app: AppHandle, _shortcut, event| {
            if event.state == tauri::global_shortcut::ShortcutState::Pressed {
                println!("🔥 Hotkey pressed: {}", _shortcut);
                // Show window and bring to front
                // Try different window labels
                let window = _app.get_window("main")
                    .or_else(|| _app.get_window("voxera"))
                    .or_else(|| _app.windows().values().next().cloned());
                
                if let Some(window) = window {
                    println!(" window found, showing and focusing");
                    let _ = window.show();
                    let _ = window.set_focus();
                    // Trigger recording toggle event
                    let _ = window.emit("toggle-recording", ());
                    println!("✅ toggle-recording event emitted");
                } else {
                    println!("❌ No window found!");
                }
            }
        })
        .map_err(|e| format!("Failed to register hotkey '{}': {}", shortcut_clone, e))?;
    
    Ok(format!("Hotkey '{}' registered successfully", shortcut))
}

// Tauri command to toggle recording
#[tauri::command]
async fn toggle_recording(window: Window) -> Result<bool, String> {
    // Emit event to frontend to toggle recording state
    window
        .emit("toggle-recording", ())
        .map_err(|e| format!("Failed to emit event: {}", e))?;
    Ok(true)
}

// Tauri command to get app version
#[tauri::command]
async fn get_version() -> Result<String, String> {
    Ok(env!("CARGO_PKG_VERSION").to_string())
}

// Tauri command to test hotkey registration
#[tauri::command]
async fn test_hotkey(window: Window) -> Result<String, String> {
    // Try to register a test hotkey to verify the system works
    let app_handle = window.app_handle();
    let test_shortcut = "Control+Shift+T"; // Different from main hotkey to avoid conflicts
    
    app_handle
        .global_shortcut_manager()
        .register(&test_shortcut, move |_app: AppHandle, _shortcut, _event| {
            if let Some(window) = _app.get_window("main") {
                let _ = window.emit("hotkey-test", "Test hotkey works!");
            }
        })
        .map_err(|e| format!("Test hotkey registration failed: {}", e))?;
    
    Ok("Test hotkey registered successfully".to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            register_hotkey,
            toggle_recording,
            get_version,
            test_hotkey
        ])
        // Desktop-first: Handle window close to hide instead of quit (optional)
        // Uncomment if you want window to hide on close instead of quitting:
        // .on_window_event(|event| {
        //     if let tauri::WindowEvent::CloseRequested { api, .. } = event.event() {
        //         event.window().hide().unwrap();
        //         api.prevent_close();
        //     }
        // })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

