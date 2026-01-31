/**
 * MediaDevices API utility and polyfill
 * 
 * Provides a robust implementation of the MediaDevices API with:
 * - Polyfill for older browsers/webviews
 * - Proper initialization for Tauri contexts
 * - Error handling and retry logic
 * - Permission management
 */

/**
 * Check if running in Tauri
 */
function isTauri(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return '__TAURI_IPC__' in window && typeof (window as any).__TAURI_IPC__ === 'function'
  } catch {
    return false
  }
}

/**
 * Check if MediaDevices API is available
 */
export function isMediaDevicesAvailable(): boolean {
  if (typeof navigator === 'undefined') {
    console.debug('[MediaDevices] navigator is undefined')
    return false
  }

  if (!navigator.mediaDevices) {
    console.debug('[MediaDevices] navigator.mediaDevices is undefined')
    return false
  }

  if (typeof navigator.mediaDevices.getUserMedia !== 'function') {
    console.debug('[MediaDevices] navigator.mediaDevices.getUserMedia is not a function')
    return false
  }

  return true
}

/**
 * Polyfill for older browsers that use the deprecated API
 */
function getLegacyGetUserMedia(): ((constraints: MediaStreamConstraints) => Promise<MediaStream>) | null {
  if (typeof navigator === 'undefined') return null

  // Try the standard API first
  if (navigator.mediaDevices?.getUserMedia) {
    return navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)
  }

  // Fallback to deprecated API
  const legacyGetUserMedia =
    (navigator as any).getUserMedia ||
    (navigator as any).webkitGetUserMedia ||
    (navigator as any).mozGetUserMedia ||
    (navigator as any).msGetUserMedia

  if (legacyGetUserMedia) {
    return (constraints: MediaStreamConstraints) => {
      return new Promise((resolve, reject) => {
        legacyGetUserMedia.call(navigator, constraints, resolve, reject)
      })
    }
  }

  return null
}

/**
 * Initialize MediaDevices API polyfill if needed
 */
export function initializeMediaDevicesPolyfill(): void {
  if (typeof navigator === 'undefined') {
    console.debug('[MediaDevices] Cannot initialize polyfill: navigator is undefined')
    return
  }

  // If MediaDevices API is already available, no need to polyfill
  if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
    console.debug('[MediaDevices] API already available, no polyfill needed')
    return
  }

  const inTauri = isTauri()
  console.debug(`[MediaDevices] Initializing polyfill (Tauri: ${inTauri})`)

  // Create mediaDevices object if it doesn't exist
  if (!navigator.mediaDevices) {
    console.debug('[MediaDevices] Creating navigator.mediaDevices object')
    ;(navigator as any).mediaDevices = {}
  }

  // Polyfill getUserMedia if not available
  if (!navigator.mediaDevices.getUserMedia || typeof navigator.mediaDevices.getUserMedia !== 'function') {
    const legacyGetUserMedia = getLegacyGetUserMedia()
    if (legacyGetUserMedia) {
      console.debug('[MediaDevices] Using legacy getUserMedia polyfill')
      navigator.mediaDevices.getUserMedia = legacyGetUserMedia
    } else {
      console.warn('[MediaDevices] No getUserMedia implementation found (neither standard nor legacy)')
      
      // In Tauri, try to access the API after a delay (webview might not be ready)
      if (inTauri) {
        console.warn('[MediaDevices] Tauri detected - MediaDevices API may not be available yet.')
        console.warn('[MediaDevices] This could be a webview initialization issue.')
        console.warn('[MediaDevices] The webview should support MediaDevices API in secure contexts (localhost).')
        
        // Try to create a minimal error-throwing implementation so the error is clearer
        navigator.mediaDevices.getUserMedia = function(constraints: MediaStreamConstraints) {
          return Promise.reject(new Error(
            'MediaDevices API is not available in Tauri webview. ' +
            'This may indicate:\n' +
            '1. The webview does not support MediaDevices API\n' +
            '2. The app is not running in a secure context\n' +
            '3. System microphone permissions are not granted\n' +
            '4. Tauri webview needs to be updated or reconfigured\n\n' +
            'Please check:\n' +
            '- System microphone permissions\n' +
            '- Tauri version and webview compatibility\n' +
            '- That the app is running from localhost (secure context)'
          ))
        }
      } else {
        // For non-Tauri contexts, also provide a clear error
        navigator.mediaDevices.getUserMedia = function(constraints: MediaStreamConstraints) {
          return Promise.reject(new Error(
            'MediaDevices API is not available. ' +
            'Please ensure you are running in a secure context (HTTPS or localhost) ' +
            'and that your browser supports the MediaDevices API.'
          ))
        }
      }
    }
  }

  // Polyfill enumerateDevices if not available
  if (!navigator.mediaDevices.enumerateDevices) {
    navigator.mediaDevices.enumerateDevices = async () => {
      return []
    }
  }

  // Polyfill getSupportedConstraints if not available
  if (!navigator.mediaDevices.getSupportedConstraints) {
    navigator.mediaDevices.getSupportedConstraints = () => {
      return {
        width: true,
        height: true,
        aspectRatio: true,
        frameRate: true,
        facingMode: true,
        resizeMode: true,
        volume: true,
        sampleRate: true,
        sampleSize: true,
        echoCancellation: true,
        autoGainControl: true,
        noiseSuppression: true,
        latency: true,
        channelCount: true,
        deviceId: true,
        groupId: true,
      }
    }
  }
}

/**
 * Wait for MediaDevices API to become available
 * Useful in Tauri/webview contexts where the API might not be immediately available
 */
export async function waitForMediaDevices(maxWaitMs: number = 10000): Promise<void> {
  const startTime = Date.now()

  // Try to initialize polyfill first
  initializeMediaDevicesPolyfill()

  // Check immediately first
  if (isMediaDevicesAvailable()) {
    return
  }

  // Try multiple times with increasing delays
  let checkInterval = 50
  let attempts = 0
  const maxAttempts = Math.ceil(maxWaitMs / checkInterval)

  while (Date.now() - startTime < maxWaitMs && attempts < maxAttempts) {
    // Re-initialize polyfill on each attempt (in case it becomes available)
    initializeMediaDevicesPolyfill()

    if (isMediaDevicesAvailable()) {
      console.log(`✅ MediaDevices API became available after ${attempts * checkInterval}ms`)
      return
    }

    attempts++
    await new Promise(resolve => setTimeout(resolve, checkInterval))

    // Gradually increase check interval to reduce CPU usage
    if (attempts % 10 === 0 && checkInterval < 200) {
      checkInterval = Math.min(checkInterval * 1.5, 200)
    }
  }

  // Final check
  initializeMediaDevicesPolyfill()
  if (isMediaDevicesAvailable()) {
    return
  }

  // Provide detailed error information
  const errorDetails: string[] = []
  if (typeof navigator === 'undefined') {
    errorDetails.push('navigator is undefined')
  } else {
    if (!navigator.mediaDevices) {
      errorDetails.push('navigator.mediaDevices is undefined')
    } else {
      if (!navigator.mediaDevices.getUserMedia) {
        errorDetails.push('navigator.mediaDevices.getUserMedia is undefined')
      }
    }
    // Check for legacy APIs
    if ((navigator as any).getUserMedia) {
      errorDetails.push('Legacy getUserMedia found but not polyfilled')
    }
  }

  throw new Error(
    `MediaDevices API did not become available within ${maxWaitMs}ms. ` +
    `Details: ${errorDetails.join(', ')}. ` +
    'Please ensure you are running in a secure context (HTTPS or localhost) ' +
    'and that your browser/Tauri supports the MediaDevices API.'
  )
}

/**
 * Get user media with retry logic and better error handling
 */
export async function getUserMedia(
  constraints: MediaStreamConstraints,
  options?: { retries?: number; retryDelay?: number; waitTimeout?: number }
): Promise<MediaStream> {
  const retries = options?.retries ?? 3
  const retryDelay = options?.retryDelay ?? 1000
  const waitTimeout = options?.waitTimeout ?? 5000

  // Ensure MediaDevices API is available (with longer timeout)
  try {
    await waitForMediaDevices(waitTimeout)
  } catch (waitError) {
    // If waiting fails, try one more time with polyfill
    console.warn('Initial wait for MediaDevices failed, trying polyfill initialization...')
    initializeMediaDevicesPolyfill()
    
    // Check one more time
    if (!isMediaDevicesAvailable()) {
      throw new Error(
        `MediaDevices API is not available. This may be a Tauri/webview configuration issue. ` +
        `Original error: ${waitError instanceof Error ? waitError.message : String(waitError)}`
      )
    }
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      if (!isMediaDevicesAvailable()) {
        throw new Error('MediaDevices API is not available')
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      return stream
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Handle permission denied errors - allow retry instead of immediately failing
      if (
        error instanceof Error &&
        (error.name === 'NotAllowedError' ||
          error.name === 'PermissionDeniedError' ||
          error.message.includes('permission') ||
          error.message.includes('denied'))
      ) {
        // Always retry permission errors at least once
        // The permission dialog might need time to appear or user might grant it
        if (attempt < retries - 1) {
          console.log(`🔄 Permission denied (attempt ${attempt + 1}/${retries}), retrying...`)
          console.log('💡 Please grant microphone access when prompted')
          // Wait a bit longer for permission dialogs
          await new Promise(resolve => setTimeout(resolve, retryDelay * 1.5))
          continue // Retry
        }
        
        // Only throw error after all retries exhausted
        const platform = typeof navigator !== 'undefined' && (navigator as any).platform 
          ? (navigator as any).platform.toLowerCase() 
          : 'unknown'
        
        // Detect dev mode (localhost) vs production
        const isDevMode = typeof window !== 'undefined' && 
          (window.location.href.includes('localhost') || 
           window.location.href.includes('127.0.0.1'))
        
        let instructions = 'Microphone permission is required. Please grant access:\n\n'
        
        if (platform.includes('mac')) {
          if (isDevMode) {
            instructions += 'macOS (Development Mode):\n'
            instructions += '⚠️ In dev mode, permission is granted to Terminal, not the app\n\n'
            instructions += '1. System Settings → Privacy & Security → Microphone\n'
            instructions += '2. Enable access for Terminal (or iTerm2 if you use it)\n'
            instructions += '3. If Terminal is not listed, click the record button to trigger the permission dialog\n'
            instructions += '4. After granting, click the record button again\n'
            instructions += '\n💡 Note: In production builds, permission is granted to VOXERA app instead\n'
          } else {
            instructions += 'macOS (Production Build):\n'
            instructions += '1. System Settings → Privacy & Security → Microphone\n'
            instructions += '2. Enable access for VOXERA (not Terminal)\n'
            instructions += '3. After granting, quit the app (Cmd+Q) and relaunch\n'
            instructions += '4. Click the record button again to retry\n'
          }
        } else if (platform.includes('win')) {
          instructions += 'Windows:\n'
          instructions += '1. Settings → Privacy → Microphone\n'
          instructions += '2. Enable "Allow apps to access your microphone"\n'
          if (isDevMode) {
            instructions += '3. In dev mode, also enable access for your terminal/command prompt\n'
          }
          instructions += '4. Click the record button again to retry\n'
        } else {
          instructions += '1. Check system privacy settings\n'
          instructions += '2. Grant microphone permissions'
          if (isDevMode) {
            instructions += ' (in dev mode, grant to your terminal/command prompt)'
          }
          instructions += '\n3. Click the record button again to retry\n'
        }
        
        throw new Error(instructions)
      }

      // Don't retry on not found errors
      if (
        error instanceof Error &&
        (error.name === 'NotFoundError' || error.message.includes('not found'))
      ) {
        throw new Error('No microphone found. Please connect a microphone and try again.')
      }

      // Retry on other errors
      if (attempt < retries - 1) {
        console.warn(
          `Failed to get user media (attempt ${attempt + 1}/${retries}), retrying in ${retryDelay}ms...`,
          error
        )
        // Re-initialize polyfill before retry
        initializeMediaDevicesPolyfill()
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      }
    }
  }

  throw lastError || new Error('Failed to get user media after multiple attempts')
}

/**
 * Check if microphone permission is granted
 */
export async function checkMicrophonePermission(): Promise<boolean> {
  try {
    if (!isMediaDevicesAvailable()) {
      return false
    }

    // Try to get a stream to check permission
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    // Stop the stream immediately since we're just checking permission
    stream.getTracks().forEach(track => track.stop())
    return true
  } catch (error) {
    return false
  }
}

/**
 * Request microphone permission with automatic retry
 * This will keep trying to request permission until granted or max attempts reached
 * IMPORTANT: This function will trigger the browser/system permission dialog
 */
export async function requestMicrophonePermission(maxAttempts: number = 10): Promise<boolean> {
  // First, ensure MediaDevices API is available
  try {
    await waitForMediaDevices(5000)
  } catch (e) {
    console.warn('MediaDevices API not available, cannot request permission')
    return false
  }

  if (!isMediaDevicesAvailable()) {
    console.error('❌ MediaDevices API is not available - cannot request permission')
    return false
  }

  console.log(`🎤 Requesting microphone permission (will show permission dialog)...`)

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`🔄 Retrying microphone permission request (attempt ${attempt + 1}/${maxAttempts})...`)
        console.log('💡 Please look for the permission dialog and grant microphone access')
        // Wait a bit longer between retries to give user time
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
      
      // Directly call getUserMedia - this will trigger the permission dialog
      // The browser/webview will show a permission prompt
      // IMPORTANT: This MUST be called from a user interaction (like a button click)
      // to trigger the permission dialog
      console.log('📢 Calling getUserMedia - permission dialog should appear now...')
      console.log('💡 If no dialog appears, check your system settings for microphone permissions')
      
      // Use minimal constraints to ensure compatibility
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true  // Use simple audio: true for maximum compatibility
      })
      
      // Permission granted! Stop the stream immediately since we're just checking permission
      stream.getTracks().forEach(track => track.stop())
      console.log('✅ Microphone permission granted!')
      return true
    } catch (error: any) {
      const errorName = error?.name || ''
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      console.log(`Permission request result (attempt ${attempt + 1}):`, errorName, errorMessage)
      
      // Check if it's a permission denied error
      const isPermissionError = 
        errorName === 'NotAllowedError' ||
        errorName === 'PermissionDeniedError' ||
        errorMessage.includes('permission') ||
        errorMessage.includes('denied') ||
        errorMessage.includes('NotAllowed') ||
        errorMessage.includes('PermissionDenied')
      
      if (isPermissionError) {
        if (attempt < maxAttempts - 1) {
          // Calculate increasing delay - give more time on later attempts
          const delay = Math.min(2000 + (attempt * 1000), 5000)
          console.log(`⚠️ Permission denied (attempt ${attempt + 1}/${maxAttempts})`)
          console.log(`💡 Waiting ${delay}ms before retry...`)
          console.log(`💡 If you see a permission dialog, please click "Allow" or "Grant"`)
          
          // Wait before retrying to give user time to grant permission
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        } else {
          // After all attempts, provide helpful message
          const isDevMode = typeof window !== 'undefined' && 
            (window.location.href.includes('localhost') || 
             window.location.href.includes('127.0.0.1'))
          const platform = typeof navigator !== 'undefined' && (navigator as any).platform 
            ? (navigator as any).platform.toLowerCase() 
            : 'unknown'
          
          console.warn('⚠️ Microphone permission not granted after all attempts')
          console.warn('💡 The permission dialog may not have appeared, or permission was denied')
          console.warn('💡 Common issues and solutions:')
          
          if (isDevMode) {
            console.warn('   🔧 DEVELOPMENT MODE DETECTED:')
            console.warn('   → In dev mode, permission is granted to Terminal (not the app)')
            console.warn('   → Grant permission to Terminal in System Settings:')
            if (platform.includes('mac')) {
              console.warn('      macOS: System Settings → Privacy & Security → Microphone')
              console.warn('      → Enable access for Terminal (or iTerm2 if you use it)')
              console.warn('      → If Terminal is not listed, click the record button to trigger the dialog')
            } else if (platform.includes('win')) {
              console.warn('      Windows: Settings → Privacy → Microphone')
              console.warn('      → Enable "Allow apps to access your microphone"')
              console.warn('      → Also enable for your terminal/command prompt')
            }
            console.warn('   → After granting, click the record button again')
            console.warn('   → For production: Build with `npm run tauri:build` and grant to VOXERA app')
          } else {
            console.warn('   1. **Terminal vs Built App**: If running in dev mode, permission may be granted to Terminal.')
            console.warn('      → Build the app: npm run tauri:build')
            console.warn('      → Run the built app and grant permission to VOXERA (not Terminal)')
            console.warn('   2. **Missing NSMicrophoneUsageDescription**: Check Info.plist has NSMicrophoneUsageDescription')
            console.warn('   3. **Need to Relaunch**: After granting permission, completely quit (Cmd+Q) and relaunch the app')
            console.warn('   4. **Grant permission in system settings**:')
            if (platform.includes('mac')) {
              console.warn('      macOS: System Settings → Privacy & Security → Microphone')
              console.warn('      → Make sure VOXERA (not Terminal) has permission enabled')
            } else if (platform.includes('win')) {
              console.warn('      Windows: Settings → Privacy → Microphone')
            }
          }
          console.warn('   See MICROPHONE_PERMISSIONS.md for detailed troubleshooting')
          return false
        }
      } else {
        // Other error (not permission-related) - might be recoverable
        if (attempt < maxAttempts - 1) {
          console.warn(`⚠️ Error requesting permission (attempt ${attempt + 1}/${maxAttempts}):`, errorMessage)
          await new Promise(resolve => setTimeout(resolve, 1000))
          continue
        } else {
          console.error('❌ Failed to request microphone permission:', error)
          return false
        }
      }
    }
  }
  
  return false
}

/**
 * Get available audio input devices
 */
export async function getAudioInputDevices(): Promise<MediaDeviceInfo[]> {
  await waitForMediaDevices(2000)

  if (!isMediaDevicesAvailable()) {
    return []
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.filter(device => device.kind === 'audioinput')
  } catch (error) {
    console.error('Failed to enumerate devices:', error)
    return []
  }
}

