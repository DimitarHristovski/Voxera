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

    if (this.isListening) {
      console.log('Wake word detection already listening')
      return
    }

    try {
      this.recognition = new SpeechRecognition()
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

    this.recognition.onerror = (event: any) => {
      const error = (event as any).error || 'unknown'
      console.error('Speech recognition error:', error)
      // Don't restart on certain errors that indicate permission issues
      if (error === 'not-allowed' || error === 'service-not-allowed') {
        console.error('Microphone permission denied')
        this.isListening = false
        return
      }
      // Restart on recoverable errors
      if (error === 'no-speech' || error === 'aborted' || error === 'network') {
        if (this.isListening) {
          setTimeout(() => {
            if (this.isListening && !this.recognition) {
              this.start()
            }
          }, 1000)
        }
      }
    }

      this.recognition.onend = () => {
        // Automatically restart if we're still supposed to be listening
        if (this.isListening) {
          console.log('Speech recognition ended, restarting...')
          setTimeout(() => {
            if (this.isListening && !this.recognition) {
              this.start()
            }
          }, 500)
        }
      }

      this.recognition.onstart = () => {
        console.log('✅ Wake word detection started successfully')
      }

      this.recognition.start()
      this.isListening = true
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

