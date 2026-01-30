/**
 * Wake word detector using Web Speech API
 * Listens for "Hey Voxera" to activate recording
 */

export class WakeWordDetector {
  private recognition: SpeechRecognition | null = null
  private isListening: boolean = false
  private onWakeWordDetected: (() => void) | null = null

  constructor(onWakeWordDetected: () => void) {
    this.onWakeWordDetected = onWakeWordDetected
  }

  start(): void {
    if (typeof window === 'undefined') return
    
    // Check if SpeechRecognition is available
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.warn('Speech Recognition API not available - wake word detection disabled')
      return
    }

    // If already listening, don't start again
    if (this.isListening && this.recognition) {
      console.log('Wake word detection already listening')
      return
    }

    // Clear any existing recognition before starting a new one
    if (this.recognition) {
      try {
        this.recognition.stop()
      } catch (e) {
        // Ignore errors when stopping
      }
      this.recognition = null
    }

    try {
      this.recognition = new SpeechRecognition()
      if (!this.recognition) {
        console.error('Failed to create SpeechRecognition instance')
        return
      }
      
      this.recognition.continuous = true
      this.recognition.interimResults = true // Enable interim results for faster detection
      this.recognition.lang = 'en-US' // Can be made configurable

      this.recognition.onresult = (event: any) => {
        // Check both final and interim results
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          const transcript = result[0].transcript.toLowerCase().trim()
          
          console.log('Speech detected:', transcript, 'isFinal:', result.isFinal)
          
          // Check for wake word variations
          const wakeWords = ['hey voxera', 'hey voxer', 'hey vox', 'voxera', 'hey voxera activate']
          
          if (wakeWords.some(wakeWord => transcript.includes(wakeWord))) {
            console.log('✅ Wake word detected:', transcript)
            this.onWakeWordDetected?.()
            // Stop listening temporarily to avoid multiple triggers
            this.stop()
            // Restart after a short delay
            setTimeout(() => {
              if (!this.isListening) {
                this.start()
              }
            }, 3000) // Increased delay to avoid immediate re-trigger
            return
          }
        }
      }

      if (!this.recognition) return
      
      this.recognition.onerror = (event: any) => {
      const error = (event as any).error || 'unknown'
      
      // Handle different error types
      if (error === 'not-allowed' || error === 'service-not-allowed') {
        console.error('❌ Microphone permission denied - wake word detection disabled')
        this.isListening = false
        this.recognition = null
        return
      }
      
      // "no-speech" is a normal timeout - not really an error, just restart silently
      if (error === 'no-speech') {
        // This is expected - the API times out when no speech is detected
        // The onend handler will restart it automatically
        console.log('🔇 No speech detected (timeout) - will restart automatically')
        return
      }
      
      // Log other errors
      if (error !== 'aborted') { // Don't log aborted errors (they're intentional)
        console.warn('⚠️ Speech recognition error:', error)
      }
      
      // Restart on recoverable errors (network issues, etc.)
      if (error === 'network' || error === 'audio-capture') {
        if (this.isListening) {
          console.log('🔄 Recoverable error, restarting in 1 second...')
          setTimeout(() => {
            if (this.isListening) {
              try {
                this.recognition = null // Clear old recognition
                this.start()
              } catch (restartError) {
                console.error('Failed to restart after error:', restartError)
              }
            }
          }, 1000)
        }
      }
    }

      if (!this.recognition) return
      
      this.recognition.onend = () => {
        // Automatically restart if we're still supposed to be listening
        if (this.isListening) {
          // Clear the recognition object before restarting
          const wasListening = this.isListening
          this.recognition = null
          
          // Small delay before restarting to avoid rapid restarts
          setTimeout(() => {
            if (wasListening && this.isListening) {
              try {
                this.start()
              } catch (error) {
                console.error('Failed to restart recognition:', error)
                this.isListening = false
                this.recognition = null
              }
            }
          }, 500)
        } else {
          this.recognition = null
        }
      }

      if (!this.recognition) return
      
      this.recognition.onstart = () => {
        console.log('✅ Wake word detection started successfully - listening for "Hey Voxera"')
        this.isListening = true
      }

      try {
        if (!this.recognition) return
        this.recognition.start()
        this.isListening = true
      } catch (error) {
        console.error('Failed to start recognition:', error)
        this.isListening = false
      }
    } catch (error) {
      console.error('Failed to start wake word detection:', error)
      this.isListening = false
    }
  }

  stop(): void {
    if (this.recognition) {
      this.isListening = false
      try {
        this.recognition.stop()
      } catch (error) {
        // Ignore errors when stopping
      }
      this.recognition = null
      console.log('Wake word detection stopped')
    }
  }

  isActive(): boolean {
    return this.isListening
  }
}

