'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  const [hotkey, setHotkey] = useState<string>('Control+Alt+A')
  const [hotkeyStatus, setHotkeyStatus] = useState<'idle' | 'registered' | 'failed'>('idle')
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [uiLanguage, setUiLanguage] = useState<SupportedLanguage>(getLanguage())
  const [isListeningForWakeWord, setIsListeningForWakeWord] = useState(false)
  const audioRecorderRef = useRef<AudioRecorder | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const wakeWordDetectorRef = useRef<WakeWordDetector | null>(null)

  // Update translations when language changes
  useEffect(() => {
    setLanguage(uiLanguage)
  }, [uiLanguage])

  // Load state from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const savedTranscript = localStorage.getItem('voxera-transcript')
      const savedEnrichedOutput = localStorage.getItem('voxera-enriched-output')
      const savedDetectedMode = localStorage.getItem('voxera-detected-mode')
      const savedEnrichmentUsage = localStorage.getItem('voxera-enrichment-usage')

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

  // Initialize wake word detector
  useEffect(() => {
    // Request microphone permission first
    const initializeWakeWordDetector = async () => {
      try {
        // Request microphone permission
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true })
          console.log('Microphone permission granted')
        } catch (permError) {
          console.warn('Microphone permission not granted:', permError)
          setIsListeningForWakeWord(false)
          return
        }

        // Small delay to ensure permission is fully processed
        await new Promise(resolve => setTimeout(resolve, 500))

        wakeWordDetectorRef.current = new WakeWordDetector(() => {
          console.log('🎤 Wake word detected! Starting recording...')
          // Start recording immediately if not already recording (same as hotkey)
          if (!isRecording) {
            handleStartRecording()
          }
        })
        
        // Start listening for wake word with a small delay
        setTimeout(() => {
          if (wakeWordDetectorRef.current) {
            wakeWordDetectorRef.current.start()
            setIsListeningForWakeWord(true)
          }
        }, 1000)
      } catch (error) {
        console.error('Failed to initialize wake word detector:', error)
        setIsListeningForWakeWord(false)
      }
    }

    initializeWakeWordDetector()

    return () => {
      if (wakeWordDetectorRef.current) {
        wakeWordDetectorRef.current.stop()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      ]).then(([{ invoke }, { listen }]) => {
        const platform = navigator.platform.toLowerCase()
        const detectedHotkey = platform.includes('mac') 
          ? 'Command+Control+A' 
          : 'Control+Alt+A'
        setHotkey(detectedHotkey)
      
        // Register global hotkey
        invoke('register_hotkey', { shortcut: detectedHotkey })
          .then((result) => {
            console.log('✅ Hotkey registration successful:', result)
            setHotkeyStatus('registered')
          })
          .catch(err => {
            console.error('❌ Failed to register hotkey:', err)
            setHotkeyStatus('failed')
            // Don't set error state - hotkey is optional, app can still work with button
            console.warn('App will work with button clicks, but hotkey is unavailable')
          })

        // Listen for toggle-recording events from Tauri
        listen('toggle-recording', (event) => {
          console.log('🔔 Hotkey triggered: toggle-recording event received', event)
          // Use setTimeout to ensure the event is processed after window is shown
          setTimeout(() => {
            // Start recording if not recording, stop if recording (toggle behavior)
            if (!isRecording) {
              handleStartRecording()
            } else {
              handleStopRecording()
            }
          }, 100)
        }).then(fn => {
          unlistenFn = fn
          console.log('✅ Event listener set up successfully')
        }).catch(err => {
          console.error('❌ Failed to set up event listener:', err)
        })
      }).catch(err => {
        console.error('Failed to load Tauri APIs:', err)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Separate function to start recording (used by wake word and hotkey)
  const handleStartRecording = async () => {
    // Stop wake word detection when recording starts
    if (wakeWordDetectorRef.current) {
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
      setRecordingDuration(0)
      
      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording')
      setPipelineState('idle')
      // Restart wake word detection if recording failed
      setTimeout(() => {
        if (wakeWordDetectorRef.current && !wakeWordDetectorRef.current.isActive()) {
          wakeWordDetectorRef.current.start()
          setIsListeningForWakeWord(true)
        }
      }, 1000)
    }
  }

  // Separate function to stop recording
  const handleStopRecording = async () => {
    setIsRecording(false)
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
      recordingIntervalRef.current = null
    }
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
        wakeWordDetectorRef.current.start()
        setIsListeningForWakeWord(true)
      }
    }, 1000)
  }

  const handleToggleRecording = async () => {
    if (isRecording) {
      await handleStopRecording()
    } else {
      await handleStartRecording()
    }
  }

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
        {/* Header with animation */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center space-y-4"
        >
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
            <svg className="w-4 h-4 text-slate-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-slate-100 font-medium">{t('press')}</span>
            <kbd className="px-3 py-1.5 bg-white/40 backdrop-blur-sm text-white rounded-lg text-xs md:text-sm font-mono font-bold border border-white/50 shadow-md">
              {hotkey.replace('Command', 'Cmd').replace('Control', 'Ctrl').replace('Alt', 'Alt')}
            </kbd>
            <span className="text-sm text-slate-100 font-medium">{t('toActivate')}</span>
            {isListeningForWakeWord && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
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

        {/* Recording Button with Duration */}
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
          {transcript && (
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
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
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
                      <svg className="w-4 h-4 text-slate-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
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
                <svg className="w-5 h-5 text-slate-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
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
    </main>
  )
}

