// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, Window, AppHandle};

// Tauri command to register global hotkeys
// Desktop-first: Hotkey activates/shows the window AND toggles recording
// This allows seamless workflow integration - press hotkey to start/stop recording
#[tauri::command]
async fn register_hotkey(
    window: Window,
    shortcut: String,
) -> Result<String, String> {
    let app_handle = window.app_handle();
    
    // Register global shortcut using global_shortcut_manager
    // Default: Control+A (all platforms)
    // Desktop-first behavior: Show window, bring to front, AND toggle recording
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
                    println!("✅ Window found, showing and focusing");
                    // Ensure window is visible and on top
                    let _ = window.show();
                    let _ = window.unminimize(); // Unminimize if minimized
                    let _ = window.set_focus(); // Bring to front and focus
                    // Small delay to ensure window is visible before emitting event
                    std::thread::sleep(std::time::Duration::from_millis(100));
                    // Emit event to notify frontend that hotkey was pressed (for window activation)
                    match window.emit("hotkey-activated", ()) {
                        Ok(_) => println!("✅ Window activated via hotkey, event emitted"),
                        Err(e) => println!("❌ Failed to emit hotkey-activated event: {:?}", e),
                    }
                    // Also emit toggle-recording event to start/stop recording
                    match window.emit("toggle-recording", ()) {
                        Ok(_) => println!("✅ Toggle recording event emitted via hotkey"),
                        Err(e) => println!("❌ Failed to emit toggle-recording event: {:?}", e),
                    }
                } else {
                    println!("❌ No window found! Available windows: {:?}", _app.windows().keys().collect::<Vec<_>>());
                }
            }
        })
        .map_err(|e| {
            let error_msg = format!("Failed to register hotkey '{}': {}", shortcut_clone, e);
            println!("❌ Hotkey registration error: {}", error_msg);
            error_msg
        })?;
    
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

// Tauri command to get platform
#[tauri::command]
async fn get_platform() -> Result<String, String> {
    #[cfg(target_os = "macos")]
    return Ok("darwin".to_string());
    #[cfg(target_os = "windows")]
    return Ok("win32".to_string());
    #[cfg(target_os = "linux")]
    return Ok("linux".to_string());
    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    return Ok("unknown".to_string());
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
            get_platform,
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

