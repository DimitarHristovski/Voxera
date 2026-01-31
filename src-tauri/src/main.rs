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
    
    // Check if this is the default hotkey that was registered at startup
    let default_hotkey = "CommandOrControl+Shift+M";
    
    if shortcut == default_hotkey {
        println!("🔧 Frontend requesting default hotkey registration: {}", shortcut);
        println!("💡 Startup registration should already be active, but re-registering to ensure it works");
    } else {
        println!("🔧 Frontend requesting custom hotkey registration: {}", shortcut);
    }
    
    // Unregister first to avoid conflicts
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
        // Users can bring the window back using platform-specific hotkeys
        .on_window_event(|event| {
            match event.event() {
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    println!("🪟 Window close requested - hiding window instead of quitting");
                    println!("🔄 App will continue running in the background");
                    println!("💡 Press Cmd+Shift+M (Mac) or Ctrl+Shift+M (Windows/Linux) to bring the window back");
                    let _ = event.window().hide();
                    api.prevent_close();
                }
                _ => {}
            }
        })
        .setup(|app| {
            println!("✅ VOXERA app started - connecting to local server");
            println!("💡 Closing the window will hide it, but the app stays running");
            
            println!("💡 Hold Shift to bring the window back");
            
            println!("💡 The app will continue running in the background even when window is closed");
            
            // Register hotkey immediately at app startup so it works even when window is hidden
            // This registration persists and won't be overwritten by frontend registration
            let app_handle = app.app_handle();
            let default_hotkey = "CommandOrControl+Shift+M";
            
            println!("🔧 Registering hotkey: {}", default_hotkey);
            
            // Unregister first to avoid conflicts
            let _ = app_handle.global_shortcut_manager().unregister(default_hotkey);
            
            // Get window first to ensure it exists
            let window_opt = app.get_window("main");
            if window_opt.is_none() {
                println!("⚠️ Window 'main' not found at startup, will register hotkey anyway");
            } else {
                println!("✅ Window 'main' found at startup");
            }
            
            println!("🔧 Registering global hotkey at startup: {}", default_hotkey);
            
            // Function to attempt hotkey registration (will retry if it fails)
            let attempt_register = |app_handle: tauri::AppHandle, hotkey: &str| -> Result<(), String> {
                // Unregister first to avoid conflicts
                let _ = app_handle.global_shortcut_manager().unregister(hotkey);
                
                let app_handle_clone = app_handle.clone();
                let hotkey_for_closure = hotkey.to_string();
                
                app_handle.global_shortcut_manager().register(hotkey, move || {
                    println!("🔥 Hotkey pressed: {}", hotkey_for_closure);
                    // Find the window - try multiple methods
                    let window = app_handle_clone.get_window("main")
                        .or_else(|| app_handle_clone.windows().values().next().cloned());
                    
                    if let Some(window) = window {
                        println!("✅ Window found, showing and focusing");
                        
                        // Critical: Show the window FIRST (this makes it visible)
                        if let Err(e) = window.show() {
                            println!("⚠️ Failed to show window: {:?}", e);
                        } else {
                            println!("✅ Window.show() succeeded");
                        }
                        
                        // Small delay to let show() complete
                        std::thread::sleep(std::time::Duration::from_millis(50));
                        
                        // Unminimize if minimized
                        if let Err(e) = window.unminimize() {
                            println!("⚠️ Failed to unminimize (might not be minimized): {:?}", e);
                        } else {
                            println!("✅ Window.unminimize() succeeded");
                        }
                        
                        // Bring to front and focus - CRITICAL for bringing app to foreground
                        // Try multiple times to ensure it works
                        for i in 1..=3 {
                            if let Err(e) = window.set_focus() {
                                println!("⚠️ Failed to set focus (attempt {}): {:?}", i, e);
                                if i < 3 {
                                    std::thread::sleep(std::time::Duration::from_millis(100));
                                }
                            } else {
                                println!("✅ Window.set_focus() succeeded (attempt {})", i);
                                break;
                            }
                        }
                        
                        // Try maximize/unmaximize trick to ensure visibility
                        let _ = window.maximize();
                        std::thread::sleep(std::time::Duration::from_millis(50));
                        let _ = window.unmaximize();
                        
                        // Final focus attempt after all operations
                        std::thread::sleep(std::time::Duration::from_millis(100));
                        let _ = window.set_focus();
                        
                        // Small delay to ensure window is visible before emitting events
                        std::thread::sleep(std::time::Duration::from_millis(50));
                        
                        // Emit events to frontend
                        match window.emit("hotkey-activated", ()) {
                            Ok(_) => println!("✅ hotkey-activated event emitted"),
                            Err(e) => println!("⚠️ Failed to emit hotkey-activated: {:?}", e),
                        }
                        match window.emit("toggle-recording", ()) {
                            Ok(_) => println!("✅ toggle-recording event emitted"),
                            Err(e) => println!("⚠️ Failed to emit toggle-recording: {:?}", e),
                        }
                        
                        println!("✅ Window opened and focused via hotkey - all operations completed");
                    } else {
                        println!("❌ No window found when hotkey pressed!");
                        println!("   Available windows: {:?}", app_handle_clone.windows().keys().collect::<Vec<_>>());
                    }
                }).map_err(|e| format!("Failed to register hotkey: {:?}", e))
            };
            
            // Attempt 1: Register immediately
            let app_handle_1 = app_handle.clone();
            let hotkey_1 = default_hotkey.to_string();
            match attempt_register(app_handle_1.clone(), default_hotkey) {
                Ok(_) => {
                    println!("✅ Global hotkey registered successfully at startup");
                    println!("💡 Press {} to open/show the app window", default_hotkey);
                    println!("💡 This hotkey will persist even if frontend reloads");
                }
                Err(e) => {
                    println!("⚠️ Failed to register hotkey at startup (attempt 1): {}", e);
                    
                    // Attempt 2: Retry after delay (production builds may need more time)
                    let app_handle_2 = app_handle.clone();
                    let hotkey_2 = default_hotkey.to_string();
                    std::thread::spawn(move || {
                        std::thread::sleep(std::time::Duration::from_millis(1000));
                        println!("🔧 Retrying hotkey registration (attempt 2): {}", hotkey_2);
                        match attempt_register(app_handle_2.clone(), &hotkey_2) {
                            Ok(_) => println!("✅ Global hotkey registered successfully on retry (attempt 2)"),
                            Err(e2) => {
                                println!("⚠️ Failed to register hotkey on retry (attempt 2): {}", e2);
                                
                                // Attempt 3: Final retry after longer delay
                                let app_handle_3 = app_handle_2.clone();
                                let hotkey_3 = hotkey_2.clone();
                                std::thread::spawn(move || {
                                    std::thread::sleep(std::time::Duration::from_millis(3000));
                                    println!("🔧 Final retry hotkey registration (attempt 3): {}", hotkey_3);
                                    match attempt_register(app_handle_3, &hotkey_3) {
                                        Ok(_) => println!("✅ Global hotkey registered successfully on final retry"),
                                        Err(e3) => {
                                            println!("❌ All hotkey registration attempts failed. Last error: {}", e3);
                                            println!("💡 On macOS, grant Accessibility permissions:");
                                            println!("   System Settings → Privacy & Security → Accessibility → Add VOXERA");
                                        }
                                    }
                                });
                            }
                        }
                    });
                }
            }
            
            // Also register after window is fully ready (additional safety for production)
            if let Some(_window) = app.get_window("main") {
                let app_handle_delayed = app_handle.clone();
                let hotkey_delayed = default_hotkey.to_string();
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(500));
                    println!("🔧 Additional hotkey registration after window ready: {}", hotkey_delayed);
                    if let Err(e) = attempt_register(app_handle_delayed, &hotkey_delayed) {
                        println!("⚠️ Delayed registration also failed: {}", e);
                    } else {
                        println!("✅ Delayed registration succeeded");
                    }
                });
            }
            
            
            // App will load from devPath in tauri.conf.json (http://localhost:3000)
            // No need to navigate - Tauri handles this automatically
            println!("🌐 App will load from: http://localhost:3000 (configured in tauri.conf.json)");
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
        
    // Note: In Tauri v1, we handle quit prevention in on_window_event
    // The app will stay running as long as at least one window exists (even if hidden)
    // To fully quit, users need to use Force Quit or kill the process
}

