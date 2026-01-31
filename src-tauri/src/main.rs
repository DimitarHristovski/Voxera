// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, Window, GlobalShortcutManager};

// Tauri command to register global hotkeys
// Desktop-first: Hotkey activates/shows the window AND toggles recording
// This allows seamless workflow integration - press hotkey to start/stop recording
#[tauri::command]
async fn register_hotkey(
    window: Window,
    shortcut: String,
) -> Result<String, String> {
    let app_handle = window.app_handle();
    
    // Unregister the hotkey first if it's already registered (handles hot reload scenarios)
    let _ = app_handle.global_shortcut_manager().unregister(&shortcut);
    
    // Register global shortcut using global_shortcut_manager
    // Default: Control+A (all platforms)
    // Desktop-first behavior: Show window, bring to front, AND toggle recording
    let shortcut_for_closure = shortcut.clone();
    let shortcut_for_error = shortcut.clone();
    let app_handle_clone = app_handle.clone();
    
    app_handle
        .global_shortcut_manager()
        .register(&shortcut, move || {
            println!("🔥 Hotkey pressed: {}", shortcut_for_closure);
            // Show window and bring to front
            // Try different window labels
            let window = app_handle_clone.get_window("main")
                .or_else(|| app_handle_clone.get_window("voxera"))
                .or_else(|| app_handle_clone.windows().values().next().cloned());
            
            if let Some(window) = window {
                println!("✅ Window found, opening and focusing");
                // First, ensure window is shown (this opens it if hidden)
                if let Err(e) = window.show() {
                    println!("⚠️ Failed to show window: {:?}", e);
                }
                // Unminimize if minimized
                if let Err(e) = window.unminimize() {
                    println!("⚠️ Failed to unminimize window: {:?}", e);
                }
                // Unmaximize if needed (to ensure window is visible)
                if let Err(_e) = window.unmaximize() {
                    // Ignore error - window might not be maximized
                }
                // Bring to front and focus - this is critical for opening the app
                if let Err(e) = window.set_focus() {
                    println!("⚠️ Failed to set focus: {:?}", e);
                }
                // Also try maximize then restore to ensure window is visible
                let _ = window.maximize();
                std::thread::sleep(std::time::Duration::from_millis(50));
                let _ = window.unmaximize();
                // Small delay to ensure window is visible before emitting event
                std::thread::sleep(std::time::Duration::from_millis(100));
                println!("✅ Window opened and focused via hotkey");
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
                println!("❌ No window found! Available windows: {:?}", app_handle_clone.windows().keys().collect::<Vec<_>>());
            }
        })
        .map_err(|e| {
            let error_msg = format!("Failed to register hotkey '{}': {}", shortcut_for_error, e);
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
    let app_handle_clone = app_handle.clone();
    
    app_handle
        .global_shortcut_manager()
        .register(&test_shortcut, move || {
            if let Some(window) = app_handle_clone.get_window("main") {
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
        // Desktop-first: Handle window close to hide instead of quit
        // This keeps the app running in the background so the server stays alive
        // Users can bring the window back using the hotkey (Control+Shift+A)
        .on_window_event(|event| {
            match event.event() {
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    println!("🪟 Window close requested - hiding window instead of quitting");
                    println!("🔄 App will continue running in the background");
                    println!("💡 Use hotkey (Control+Shift+A) to bring the window back");
                    let _ = event.window().hide();
                    api.prevent_close();
                }
                _ => {}
            }
        })
        .setup(|app| {
            println!("✅ VOXERA app started - connecting to Vercel");
            println!("💡 Closing the window will hide it, but the app stays running");
            println!("💡 Use the hotkey (Control+Shift+A) to bring the window back");
            println!("💡 The app will continue running in the background even when window is closed");
            
            // Navigate to Vercel URL - use multiple methods to ensure it works
            let vercel_url = "https://voxera-peach.vercel.app";
            if let Some(window) = app.get_window("main") {
                println!("🌐 Navigating to: {}", vercel_url);
                
                // Method 1: Immediate aggressive navigation
                let nav_script = format!(
                    r#"
                    (function() {{
                        const targetUrl = '{}';
                        console.log('Current URL:', window.location.href);
                        console.log('Target URL:', targetUrl);
                        
                        // Force immediate navigation
                        try {{
                            window.location.replace(targetUrl);
                        }} catch(e) {{
                            console.error('Replace failed:', e);
                            window.location.href = targetUrl;
                        }}
                    }})();
                    "#,
                    vercel_url
                );
                
                // Execute immediately
                if let Err(e) = window.eval(&nav_script) {
                    println!("⚠️ Failed to navigate via eval: {:?}", e);
                } else {
                    println!("✅ Navigation script executed");
                }
                
                // Method 2: Multiple delayed attempts to ensure navigation
                let window_clone1 = window.clone();
                let window_clone2 = window.clone();
                let window_clone3 = window.clone();
                
                // Attempt 1: After 200ms
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(200));
                    let script = format!(r#"window.location.replace('{}');"#, vercel_url);
                    if let Err(e) = window_clone1.eval(&script) {
                        println!("⚠️ Delayed navigation 1 failed: {:?}", e);
                    }
                });
                
                // Attempt 2: After 500ms
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(500));
                    let script = format!(r#"if (!window.location.href.includes('voxera-peach.vercel.app')) {{ window.location.href = '{}'; }}"#, vercel_url);
                    if let Err(e) = window_clone2.eval(&script) {
                        println!("⚠️ Delayed navigation 2 failed: {:?}", e);
                    }
                });
                
                // Attempt 3: After 1000ms (last resort)
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(1000));
                    let script = format!(r#"window.top.location.href = '{}';"#, vercel_url);
                    if let Err(e) = window_clone3.eval(&script) {
                        println!("⚠️ Delayed navigation 3 failed: {:?}", e);
                    }
                });
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
        
    // Note: In Tauri v1, we handle quit prevention in on_window_event
    // The app will stay running as long as at least one window exists (even if hidden)
    // To fully quit, users need to use Force Quit or kill the process
}

