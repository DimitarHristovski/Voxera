'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Copy, X, Maximize2, Lightbulb, Info, Video, User } from 'lucide-react'
import RecordingButton from '@/components/RecordingButton'
import OutputDisplay from '@/components/OutputDisplay'
import StatusIndicator from '@/components/StatusIndicator'
import Statistics from '@/components/Statistics'
import { AudioRecorder } from '@/lib/audio-recorder'
import { WakeWordDetector } from '@/lib/wake-word-detector'
import { t, setLanguage, getLanguage, type SupportedLanguage } from '@/lib/i18n'

type PipelineState = 'idle' | 'recording' | 'transcribing' | 'enriching' | 'complete'

// Helper to check if Tauri is available
function isTauriAvailable(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return '__TAURI_IPC__' in window && typeof (window as any).__TAURI_IPC__ === 'function'
  } catch {
    return false
  }
}

export default function Home() {
  const [isRecording, setIsRecording] = useState(false)
  const [pipelineState, setPipelineState] = useState<PipelineState>('idle')
  const [transcript, setTranscript] = useState<string>('')
  const [enrichedOutput, setEnrichedOutput] = useState<string>('')
  const [detectedMode, setDetectedMode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [enrichmentUsage, setEnrichmentUsage] = useState<{ promptTokens: number; completionTokens: number; totalTokens: number; model: string } | undefined>(undefined)
  const [hotkey, setHotkey] = useState<string>('Control+A')
  const [hotkeyStatus, setHotkeyStatus] = useState<'idle' | 'registered' | 'failed'>('idle')
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [uiLanguage, setUiLanguage] = useState<SupportedLanguage>(getLanguage())
  const [isListeningForWakeWord, setIsListeningForWakeWord] = useState(false)
  const [showTranscript, setShowTranscript] = useState(true)
  const [showOutput, setShowOutput] = useState(true)
  const [showHelp, setShowHelp] = useState(false)
  const [showNameInput, setShowNameInput] = useState(false)
  const [userName, setUserName] = useState<string>('')
  const audioRecorderRef = useRef<AudioRecorder | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const wakeWordDetectorRef = useRef<WakeWordDetector | null>(null)
  const handleToggleRecordingRef = useRef<(() => Promise<void>) | null>(null)

  // Update translations when language changes
  useEffect(() => {
    setLanguage(uiLanguage)
  }, [uiLanguage])

  // Function to speak a message using Web Speech API
  // Memoized with useCallback to ensure it always uses the current uiLanguage
  const speakMessage = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('Speech synthesis not available')
      return
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const speak = () => {
      const utterance = new SpeechSynthesisUtterance(text)
      
      // Try to find a voice matching the current UI language
      const voices = window.speechSynthesis.getVoices()
      const langCode = uiLanguage
      const matchingVoice = voices.find(v => {
        const voiceLang = v.lang.toLowerCase().split('-')[0]
        return voiceLang === langCode
      }) || voices.find(v => v.lang.toLowerCase().startsWith(langCode + '-'))

      if (matchingVoice) {
        utterance.voice = matchingVoice
      }

      // Set speech parameters
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0

      window.speechSynthesis.speak(utterance)
    }

    // If voices are not loaded yet, wait for them
    const voices = window.speechSynthesis.getVoices()
    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        speak()
        window.speechSynthesis.onvoiceschanged = null
      }
    } else {
      speak()
    }
  }, [uiLanguage])

  // Load state from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const savedUserName = localStorage.getItem('voxera-user-name')
      const savedTranscript = localStorage.getItem('voxera-transcript')
      const savedEnrichedOutput = localStorage.getItem('voxera-enriched-output')
      const savedDetectedMode = localStorage.getItem('voxera-detected-mode')
      const savedEnrichmentUsage = localStorage.getItem('voxera-enrichment-usage')

      if (savedUserName) {
        setUserName(savedUserName)
      }

      if (savedTranscript) {
        setTranscript(savedTranscript)
      }
      if (savedEnrichedOutput) {
        setEnrichedOutput(savedEnrichedOutput)
        setPipelineState('complete')
      }
      if (savedDetectedMode) {
        setDetectedMode(savedDetectedMode)
      }
      if (savedEnrichmentUsage) {
        try {
          setEnrichmentUsage(JSON.parse(savedEnrichmentUsage))
        } catch (e) {
          console.error('Failed to parse saved enrichment usage:', e)
        }
      }
    } catch (e) {
      console.error('Failed to load state from localStorage:', e)
    }
  }, [])

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      if (transcript) {
        localStorage.setItem('voxera-transcript', transcript)
      } else {
        localStorage.removeItem('voxera-transcript')
      }
    } catch (e) {
      console.error('Failed to save transcript to localStorage:', e)
    }
  }, [transcript])

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      if (enrichedOutput) {
        localStorage.setItem('voxera-enriched-output', enrichedOutput)
      } else {
        localStorage.removeItem('voxera-enriched-output')
      }
    } catch (e) {
      console.error('Failed to save enriched output to localStorage:', e)
    }
  }, [enrichedOutput])

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      if (detectedMode) {
        localStorage.setItem('voxera-detected-mode', detectedMode)
      } else {
        localStorage.removeItem('voxera-detected-mode')
      }
    } catch (e) {
      console.error('Failed to save detected mode to localStorage:', e)
    }
  }, [detectedMode])

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      if (enrichmentUsage) {
        localStorage.setItem('voxera-enrichment-usage', JSON.stringify(enrichmentUsage))
      } else {
        localStorage.removeItem('voxera-enrichment-usage')
      }
    } catch (e) {
      console.error('Failed to save enrichment usage to localStorage:', e)
    }
  }, [enrichmentUsage])

  // Separate function to start recording (used by wake word and hotkey)
  const handleStartRecording = useCallback(async () => {
    // Prevent starting if already recording
    if (isRecording) {
      console.warn('⚠️ Already recording, ignoring start request')
      return
    }

    // Stop wake word detection when recording starts
    if (wakeWordDetectorRef.current) {
      console.log('🛑 Stopping wake word detection for recording')
      wakeWordDetectorRef.current.stop()
      setIsListeningForWakeWord(false)
    }

    try {
      if (!audioRecorderRef.current) {
        audioRecorderRef.current = new AudioRecorder()
      }
      await audioRecorderRef.current.start()
      setIsRecording(true)
      setPipelineState('recording')
      setTranscript('')
      setEnrichedOutput('')
      setDetectedMode(null)
      setError(null)
      setEnrichmentUsage(undefined)
      
      // Clear localStorage when starting a new recording
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('voxera-transcript')
          localStorage.removeItem('voxera-enriched-output')
          localStorage.removeItem('voxera-detected-mode')
          localStorage.removeItem('voxera-enrichment-usage')
          localStorage.removeItem('voxera-edited-output')
          localStorage.removeItem('voxera-translated-output')
          localStorage.removeItem('voxera-translation-usage')
        } catch (e) {
          console.error('Failed to clear localStorage:', e)
        }
      }
      // Duration will be reset by the useEffect when isRecording becomes true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording')
      setPipelineState('idle')
      // Restart wake word detection if recording failed
      setTimeout(() => {
        if (wakeWordDetectorRef.current && !wakeWordDetectorRef.current.isActive()) {
          try {
            wakeWordDetectorRef.current.start()
            setIsListeningForWakeWord(true)
          } catch (error) {
            console.error('Failed to restart wake word detection:', error)
          }
        }
      }, 1000)
    }
  }, [isRecording])

  // Initialize wake word detector
  useEffect(() => {
    // Request microphone permission first
    const initializeWakeWordDetector = async () => {
      try {
        // Request microphone permission
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true })
          console.log('✅ Microphone permission granted')
        } catch (permError) {
          console.warn('❌ Microphone permission not granted:', permError)
          setIsListeningForWakeWord(false)
          return
        }

        // Small delay to ensure permission is fully processed
        await new Promise(resolve => setTimeout(resolve, 500))

        wakeWordDetectorRef.current = new WakeWordDetector(() => {
          console.log('🎤 Wake word detected! Starting recording...')
          // Start recording immediately if not already recording
          if (!isRecording) {
            handleStartRecording()
          }
        })
        
        // Start listening for wake word with a small delay
        setTimeout(() => {
          if (wakeWordDetectorRef.current && !isRecording) {
            try {
              wakeWordDetectorRef.current.start()
              setIsListeningForWakeWord(true)
              console.log('✅ Wake word detector started')
            } catch (error) {
              console.error('Failed to start wake word detector:', error)
              setIsListeningForWakeWord(false)
            }
          }
        }, 1000)
      } catch (error) {
        console.error('Failed to initialize wake word detector:', error)
        setIsListeningForWakeWord(false)
      }
    }

    // Only initialize if not recording
    if (!isRecording) {
      initializeWakeWordDetector()
    }

    return () => {
      if (wakeWordDetectorRef.current) {
        wakeWordDetectorRef.current.stop()
      }
    }
  }, [isRecording, handleStartRecording])

  useEffect(() => {
    // Initialize audio recorder
    audioRecorderRef.current = new AudioRecorder()

    let unlistenFn: (() => void) | null = null

    // Only set up Tauri features if Tauri is available
    if (isTauriAvailable()) {
      // Dynamically import Tauri APIs only when needed
      Promise.all([
        import('@tauri-apps/api/tauri'),
        import('@tauri-apps/api/event')
      ]).then(async ([{ invoke }, { listen }]) => {
        // Detect platform and use appropriate hotkey
        // macOS uses Command, Windows/Linux use Control
        let primaryHotkey: string
        let alternativeHotkeys: string[]
        
        try {
          // Try to detect platform via Tauri
          const platform = await invoke('get_platform', {}).catch(() => null)
          const isMac = platform === 'darwin' || navigator.platform.toUpperCase().includes('MAC')
          
          if (isMac) {
            // macOS: Use Command instead of Control
            primaryHotkey = 'Command+Shift+V'
            alternativeHotkeys = ['Command+Shift+X', 'Command+Alt+V', 'Command+Control+V']
            console.log('🍎 Detected macOS, using Command-based hotkeys')
          } else {
            // Windows/Linux: Use Control
            primaryHotkey = 'Control+Shift+V'
            alternativeHotkeys = ['Control+Shift+X', 'Control+Alt+V', 'Alt+Shift+V']
            console.log('🪟 Detected Windows/Linux, using Control-based hotkeys')
          }
        } catch (e) {
          // Fallback: try to detect from user agent
          const isMac = navigator.platform.toUpperCase().includes('MAC')
          if (isMac) {
            primaryHotkey = 'Command+Shift+V'
            alternativeHotkeys = ['Command+Shift+X', 'Command+Alt+V']
          } else {
            primaryHotkey = 'Control+Shift+V'
            alternativeHotkeys = ['Control+Shift+X', 'Control+Alt+V']
          }
          console.log('⚠️ Could not detect platform via Tauri, using fallback detection')
        }
        
        console.log('🔧 Attempting to register hotkey:', primaryHotkey)
        
        // Function to try registering a hotkey
        const tryRegisterHotkey = async (hotkey: string, isPrimary: boolean = true): Promise<boolean> => {
          try {
            const result = await invoke('register_hotkey', { shortcut: hotkey })
            console.log(`✅ Hotkey registration successful (${isPrimary ? 'primary' : 'fallback'}):`, result)
            setHotkey(hotkey)
            setHotkeyStatus('registered')
            console.log('💡 Press', hotkey, 'to activate the window and toggle recording')
            return true
          } catch (err: any) {
            const errorMsg = err?.toString() || JSON.stringify(err)
            console.error(`❌ Failed to register hotkey '${hotkey}':`, errorMsg)
            
            // Check if it's a conflict error
            if (errorMsg.includes('already registered') || errorMsg.includes('conflict') || errorMsg.includes('permission')) {
              console.warn(`⚠️ Hotkey '${hotkey}' is blocked or already in use`)
            }
            return false
          }
        }

        // Listen for hotkey activation events FIRST
        // Hotkey activates the window AND toggles recording for seamless workflow integration
        const setupListener = async () => {
          try {
            console.log('🔧 Setting up hotkey event listeners...')
            
            // Listen for window activation
            const unlistenActivated = await listen('hotkey-activated', async (event) => {
              console.log('🔔 Hotkey activated event received:', event)
              console.log('✅ Window activated via hotkey')
              
              // Double-check window is visible (frontend can also help ensure visibility)
              if (isTauriAvailable()) {
                try {
                  const { appWindow } = await import('@tauri-apps/api/window')
                  await appWindow.show()
                  await appWindow.setFocus()
                  console.log('✅ Frontend confirmed window is shown and focused')
                } catch (windowErr) {
                  console.warn('⚠️ Could not access window from frontend:', windowErr)
                }
              }
            })
            console.log('✅ hotkey-activated listener registered')
            
            // Listen for toggle recording event (emitted by hotkey)
            const unlistenToggle = await listen('toggle-recording', async (event) => {
              console.log('🔔 Toggle recording event received via hotkey:', event)
              console.log('🔄 Attempting to toggle recording...')
              // Toggle recording when hotkey is pressed
              // Use ref to get the latest function
              if (handleToggleRecordingRef.current) {
                console.log('✅ handleToggleRecording found, calling...')
                try {
                  await handleToggleRecordingRef.current()
                  console.log('✅ Recording toggled successfully via hotkey')
                } catch (toggleErr) {
                  console.error('❌ Error toggling recording:', toggleErr)
                }
              } else {
                console.warn('⚠️ handleToggleRecording not available yet - ref is null')
                console.warn('⚠️ This might happen if the component is still initializing')
              }
            })
            console.log('✅ toggle-recording listener registered')
            
            // Store both unlisten functions
            unlistenFn = () => {
              console.log('🧹 Cleaning up hotkey listeners...')
              unlistenActivated()
              unlistenToggle()
            }
            console.log('✅ Hotkey activation and toggle recording listeners set up successfully')
            console.log('💡 Hotkey listeners are ready. Press the registered hotkey to test.')
          } catch (err) {
            console.error('❌ Failed to set up hotkey listeners:', err)
            console.error('Error details:', JSON.stringify(err, null, 2))
            if (err instanceof Error) {
              console.error('Error stack:', err.stack)
            }
          }
        }
        
        // Set up listeners BEFORE trying to register hotkey
        // This ensures listeners are ready when hotkey is pressed
        await setupListener()
        
        // Now register the hotkey after listeners are ready
        console.log('🔧 Starting hotkey registration process...')
        
        // Try primary hotkey first
        tryRegisterHotkey(primaryHotkey, true)
          .then((success) => {
            if (!success) {
              console.warn('⚠️ Primary hotkey failed. Trying alternatives...')
              // Try alternatives one by one
              let altIndex = 0
              const tryNextAlternative = () => {
                if (altIndex < alternativeHotkeys.length) {
                  const altHotkey = alternativeHotkeys[altIndex]
                  console.log(`🔄 Trying alternative hotkey: ${altHotkey}`)
                  tryRegisterHotkey(altHotkey, false)
                    .then((success) => {
                      if (!success) {
                        altIndex++
                        tryNextAlternative()
                      }
                    })
                } else {
                  console.error('❌ All hotkey attempts failed')
                  setHotkeyStatus('failed')
                  console.warn('App will work with button clicks, but hotkey is unavailable')
                  console.warn('💡 You may need to grant Accessibility permissions (macOS) or check system settings')
                }
              }
              tryNextAlternative()
            } else {
              console.log('🎉 Hotkey registration complete! The app is ready to use.')
            }
          })
      }).catch(err => {
        console.error('Failed to load Tauri APIs:', err)
        setHotkeyStatus('failed')
      })
    }

    // Cleanup function
    return () => {
      if (unlistenFn) {
        unlistenFn()
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
      if (audioRecorderRef.current?.isRecording()) {
        audioRecorderRef.current.stop().catch(console.error)
      }
    }
  }, [speakMessage]) // Include speakMessage in dependencies so it updates when uiLanguage changes

  // Manage recording timer with useEffect to prevent multiple intervals
  useEffect(() => {
    if (isRecording) {
      // Reset duration when starting
      setRecordingDuration(0)
      
      // Create interval that increments every second (1000ms)
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)
      
      // Cleanup function to clear interval when recording stops or component unmounts
      return () => {
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current)
          recordingIntervalRef.current = null
        }
      }
    } else {
      // Clear interval when not recording
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
    }
  }, [isRecording])

  // Separate function to stop recording
  const handleStopRecording = async () => {
    setIsRecording(false)
    setPipelineState('transcribing')
    setError(null)

    try {
      if (!audioRecorderRef.current) {
        throw new Error('Audio recorder not initialized')
      }

      // Get audio blob from recording
      const audioBlob = await audioRecorderRef.current.stop()
      
      // Step 1: Transcribe
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      
      const transcriptResponse = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!transcriptResponse.ok) {
        const errorData = await transcriptResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Transcription failed')
      }

      const { transcript: transcribedText, language: detectedLanguage } = await transcriptResponse.json()
      setTranscript(transcribedText)
      setShowTranscript(true) // Show transcript when it's ready
      setPipelineState('enriching')

      // Step 2: AI Enrichment
      const enrichResponse = await fetch('/api/enrich', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          transcript: transcribedText,
          format: 'markdown',
          language: detectedLanguage || null
        }),
      })

      if (!enrichResponse.ok) {
        const errorData = await enrichResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Enrichment failed')
      }

      const { output, format, mode, usage } = await enrichResponse.json()
      setEnrichedOutput(output)
      setShowOutput(true) // Show output when it's ready
      setDetectedMode(mode || null)
      if (usage) {
        setEnrichmentUsage(usage)
      }
      setPipelineState('complete')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setPipelineState('idle')
      // Restart wake word detection if recording failed
      setTimeout(() => {
        if (wakeWordDetectorRef.current && !wakeWordDetectorRef.current.isActive()) {
          wakeWordDetectorRef.current.start()
          setIsListeningForWakeWord(true)
        }
      }, 1000)
    }
    
    // Restart wake word detection after recording stops
    setTimeout(() => {
      if (wakeWordDetectorRef.current && !wakeWordDetectorRef.current.isActive()) {
        try {
          console.log('🔄 Restarting wake word detection after recording')
          wakeWordDetectorRef.current.start()
          setIsListeningForWakeWord(true)
        } catch (error) {
          console.error('Failed to restart wake word detection:', error)
        }
      }
    }, 1500)
  }

  const handleToggleRecording = useCallback(async () => {
    if (isRecording) {
      await handleStopRecording()
    } else {
      await handleStartRecording()
    }
  }, [isRecording, handleStartRecording, handleStopRecording])

  // Update ref whenever handleToggleRecording changes
  useEffect(() => {
    handleToggleRecordingRef.current = handleToggleRecording
  }, [handleToggleRecording])

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleCopyOutput = async () => {
    if (enrichedOutput) {
      await navigator.clipboard.writeText(enrichedOutput)
    }
  }

  const handleNameSubmit = useCallback(() => {
    if (userName.trim()) {
      console.log('✅ Name submitted:', userName.trim())
      // Save name to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('voxera-user-name', userName.trim())
      }
      setShowNameInput(false)
    }
  }, [userName])

  return (
    <main className="min-h-screen p-6 md:p-8 flex flex-col items-center justify-center bg-gradient-to-r from-slate-300 to-slate-500 relative overflow-hidden">
      {/* Background decoration with animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Language Selector */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 right-4 z-20"
      >
        <select
          value={uiLanguage}
          onChange={(e) => {
            const newLang = e.target.value as SupportedLanguage
            setUiLanguage(newLang)
            setLanguage(newLang)
          }}
          className="px-4 py-2 bg-white/90 hover:bg-white backdrop-blur-sm text-slate-700 rounded-xl border border-white/50 shadow-lg font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
        >
          <option value="en">🇺🇸 English</option>
          <option value="es">🇪🇸 Español</option>
          <option value="fr">🇫🇷 Français</option>
          <option value="de">🇩🇪 Deutsch</option>
          <option value="it">🇮🇹 Italiano</option>
          <option value="pt">🇵🇹 Português</option>
          <option value="ru">🇷🇺 Русский</option>
          <option value="zh">🇨🇳 中文</option>
          <option value="ja">🇯🇵 日本語</option>
          <option value="ko">🇰🇷 한국어</option>
          <option value="ar">🇸🇦 العربية</option>
          <option value="hi">🇮🇳 हिन्दी</option>
        </select>
      </motion.div>

      <div className="w-full max-w-5xl space-y-8 md:space-y-10 relative z-10">
        {/* Header with Icon and Title */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center space-y-4"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, type: "spring", stiffness: 200 }}
            className="flex justify-center mb-4"
          >
            <div className="relative">
              <motion.div
                className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl flex items-center justify-center"
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(59, 130, 246, 0.5)",
                    "0 0 40px rgba(147, 51, 234, 0.5)",
                    "0 0 20px rgba(59, 130, 246, 0.5)",
                  ],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Mic className="w-12 h-12 md:w-14 md:h-14 text-white" />
              </motion.div>
              <motion.div
                className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.8, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />
            </div>
          </motion.div>
          
          <div className="inline-block">
            <motion.h1
              className="text-5xl md:text-7xl font-extrabold mb-2 text-white drop-shadow-2xl tracking-tight"
              animate={{
                textShadow: [
                  "0 0 20px rgba(255,255,255,0.3)",
                  "0 0 30px rgba(255,255,255,0.5)",
                  "0 0 20px rgba(255,255,255,0.3)",
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {t('appName')}
            </motion.h1>
            <motion.div
              className="h-1 w-24 bg-white/40 mx-auto rounded-full"
              initial={{ width: 0 }}
              animate={{ width: 96 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-slate-100 text-lg md:text-xl font-medium"
          >
            {t('tagline')}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/25 backdrop-blur-md rounded-xl border border-white/40 shadow-lg"
          >
            <Video className="w-4 h-4 text-slate-100" />
            <span className="text-sm text-slate-100 font-medium">{t('press')}</span>
            <kbd className="px-3 py-1.5 bg-white/40 backdrop-blur-sm text-white rounded-lg text-xs md:text-sm font-mono font-bold border border-white/50 shadow-md">
              {hotkey.replace('Command', 'Cmd').replace('Control', 'Ctrl').replace('Alt', 'Alt')}
            </kbd>
            <span className="text-sm text-slate-100 font-medium">{t('toActivate')}</span>
            <span className="text-xs text-slate-200/80 ml-2">({t('orSay')} "Hey Voxera" {t('toRecord')})</span>
            {isListeningForWakeWord && !isRecording && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="ml-2 flex items-center gap-1.5 px-2 py-1 bg-blue-500/30 rounded-lg border border-blue-400/50"
              >
                <motion.div
                  className="w-2 h-2 bg-blue-400 rounded-full"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [1, 0.6, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                  }}
                />
                <span className="text-xs text-blue-100 font-medium">Listening for "Hey Voxera"</span>
              </motion.div>
            )}
            <AnimatePresence>
              {hotkeyStatus === 'registered' && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="ml-2 w-2 h-2 bg-green-400 rounded-full"
                  title={t('hotkeyRegistered')}
                >
                  <motion.span
                    className="absolute w-2 h-2 bg-green-400 rounded-full"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [1, 0, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  />
                </motion.span>
              )}
              {hotkeyStatus === 'failed' && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="ml-2 w-2 h-2 bg-yellow-400 rounded-full"
                  title={t('hotkeyFailed')}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* Status Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <StatusIndicator state={pipelineState} error={error} />
        </motion.div>

        {/* Recording Button with Duration - Centered and Prominent */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          className="flex flex-col items-center gap-4"
        >
          <RecordingButton
            isRecording={isRecording}
            onClick={handleToggleRecording}
          />
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 text-white"
              >
                <motion.div
                  className="w-2 h-2 bg-red-500 rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [1, 0.5, 1],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                  }}
                />
                <span className="text-lg font-mono font-semibold drop-shadow-md">
                  {formatDuration(recordingDuration)}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {transcript && showTranscript && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="mt-8"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 bg-white/60 rounded-full"></div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-md">{t('transcript')}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-xs md:text-sm text-slate-100 bg-white/25 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/40 font-medium"
                  >
                    {transcript.split(' ').length} words
                  </motion.span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      navigator.clipboard.writeText(transcript)
                    }}
                    className="p-2 text-slate-100 hover:text-white hover:bg-white/20 rounded-lg transition-all"
                    title={t('copy')}
                  >
                    <Copy className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setShowTranscript(false)
                      setTranscript('')
                    }}
                    className="p-2 text-slate-100 hover:text-white hover:bg-red-500/30 rounded-lg transition-all"
                    title="Close transcript"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-white/95 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-2xl border border-white/50 hover:shadow-3xl transition-shadow"
              >
                <p className="text-base md:text-lg text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {transcript}
                </p>
              </motion.div>
            </motion.div>
          )}
          {transcript && !showTranscript && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-8"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowTranscript(true)}
                className="w-full px-4 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl border border-white/40 text-white font-medium transition-all flex items-center justify-center gap-2"
              >
                <Maximize2 className="w-4 h-4" />
                Show Transcript
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {enrichedOutput && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <AnimatePresence>
                {detectedMode && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="mb-4 flex items-center justify-center"
                  >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/25 backdrop-blur-md rounded-xl border border-white/40 shadow-lg">
                      <Lightbulb className="w-4 h-4 text-slate-100" />
                      <span className="text-xs text-slate-100 font-medium uppercase tracking-wide">
                        {detectedMode.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <OutputDisplay
                output={enrichedOutput}
                onCopy={handleCopyOutput}
                onOutputChange={(newOutput) => setEnrichedOutput(newOutput)}
                onClose={() => {
                  setShowOutput(false)
                  setEnrichedOutput('')
                }}
              />
              {enrichmentUsage && (
                <Statistics usage={enrichmentUsage} type="enrichment" />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {pipelineState === 'idle' && !transcript && !enrichedOutput && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="text-center mt-12 space-y-4"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/15 backdrop-blur-sm rounded-xl border border-white/30"
              >
                <Info className="w-5 h-5 text-slate-100" />
                <p className="text-slate-100 text-sm md:text-base font-medium">
                  {t('clickToStart')}
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap justify-center gap-4 text-xs text-slate-200/80"
              >
                {[
                  { color: 'bg-green-400', text: t('recording') },
                  { color: 'bg-yellow-400', text: t('transcribing') },
                  { color: 'bg-blue-400', text: t('enriching') },
                  { color: 'bg-purple-400', text: t('read') },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-center gap-1.5"
                  >
                    <motion.div
                      className={`w-1.5 h-1.5 ${item.color} rounded-full`}
                      animate={{
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: index * 0.2,
                      }}
                    />
                    <span>{item.text}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Name Input Modal */}
      <AnimatePresence>
        {showNameInput && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowNameInput(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/50 p-8 max-w-md w-full mx-4"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">{t('enterYourName')}</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    {t('enterYourName')}
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && userName.trim()) {
                        handleNameSubmit()
                      } else if (e.key === 'Escape') {
                        setShowNameInput(false)
                      }
                    }}
                    autoFocus
                    className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 text-lg"
                    placeholder="Type your name..."
                  />
                </div>
                
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNameSubmit}
                    disabled={!userName.trim()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Continue
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowNameInput(false)}
                    className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-all"
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

