'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Edit, Check, Copy, Download, Play, Square, Volume2, Gauge, Music, Languages, Loader2 } from 'lucide-react'
import Statistics from './Statistics'
import { t } from '@/lib/i18n'

interface OutputDisplayProps {
  output: string
  onCopy: () => void
  onOutputChange?: (newOutput: string) => void
  onClose?: () => void
}

export default function OutputDisplay({ output, onCopy, onOutputChange, onClose }: OutputDisplayProps) {
  const [copied, setCopied] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState<string>('')
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [speechRate, setSpeechRate] = useState(1.0)
  const [speechPitch, setSpeechPitch] = useState(1.0)
  const [isEditing, setIsEditing] = useState(false)
  const [editedOutput, setEditedOutput] = useState<string>(output)
  const [isTranslating, setIsTranslating] = useState(false)
  const [targetLanguage, setTargetLanguage] = useState<string>('en')
  const [translatedOutput, setTranslatedOutput] = useState<string | null>(null)
  const [translationUsage, setTranslationUsage] = useState<{ promptTokens: number; completionTokens: number; totalTokens: number; model: string } | undefined>(undefined)
  const [userSelectedVoice, setUserSelectedVoice] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load state from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const savedEditedOutput = localStorage.getItem('voxera-edited-output')
      const savedTranslatedOutput = localStorage.getItem('voxera-translated-output')
      const savedSelectedVoice = localStorage.getItem('voxera-selected-voice')
      const savedSpeechRate = localStorage.getItem('voxera-speech-rate')
      const savedSpeechPitch = localStorage.getItem('voxera-speech-pitch')
      const savedTargetLanguage = localStorage.getItem('voxera-target-language')
      const savedTranslationUsage = localStorage.getItem('voxera-translation-usage')

      if (savedEditedOutput && savedEditedOutput !== output) {
        setEditedOutput(savedEditedOutput)
      } else {
        setEditedOutput(output)
      }
      if (savedTranslatedOutput) {
        setTranslatedOutput(savedTranslatedOutput)
      }
      if (savedSelectedVoice) {
        setSelectedVoice(savedSelectedVoice)
      }
      if (savedSpeechRate) {
        setSpeechRate(parseFloat(savedSpeechRate))
      }
      if (savedSpeechPitch) {
        setSpeechPitch(parseFloat(savedSpeechPitch))
      }
      if (savedTargetLanguage) {
        setTargetLanguage(savedTargetLanguage)
      }
      if (savedTranslationUsage) {
        try {
          setTranslationUsage(JSON.parse(savedTranslationUsage))
        } catch (e) {
          console.error('Failed to parse saved translation usage:', e)
        }
      }
    } catch (e) {
      console.error('Failed to load state from localStorage:', e)
    }
  }, []) // Only run on mount

  // Update edited output when output prop changes (but preserve user edits if they exist)
  useEffect(() => {
    const savedEditedOutput = typeof window !== 'undefined' ? localStorage.getItem('voxera-edited-output') : null
    if (!savedEditedOutput || savedEditedOutput === output) {
      setEditedOutput(output)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('voxera-edited-output')
      }
    }
    // Don't clear translated output on output change - user might want to keep it
  }, [output])

  useEffect(() => {
    // Load available voices - filter for Google voices only
    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices()
      // Filter to only Google voices (names typically include "Google" or voiceURI contains "google")
      const googleVoices = allVoices.filter(voice => {
        const nameLower = voice.name.toLowerCase()
        const uriLower = voice.voiceURI.toLowerCase()
        return nameLower.includes('google') || uriLower.includes('google')
      })
      
      // Use Google voices if available, otherwise use all voices (fallback)
      const availableVoices = googleVoices.length > 0 ? googleVoices : allVoices
      
      setVoices(availableVoices)
      
      // Only set default voice if no voice is selected and no saved voice exists
      if (availableVoices.length > 0 && !selectedVoice) {
        const savedVoice = typeof window !== 'undefined' ? localStorage.getItem('voxera-selected-voice') : null
        if (savedVoice && availableVoices.find(v => v.name === savedVoice)) {
          // Use saved voice if it still exists
          setSelectedVoice(savedVoice)
        } else {
          // Fallback: prefer English voices
          const defaultVoice = availableVoices.find(v => v.lang.startsWith('en')) || availableVoices[0]
          if (defaultVoice) {
            setSelectedVoice(defaultVoice.name)
          }
        }
      }
    }

    loadVoices()
    
    // Voices may load asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }

    // Cleanup on unmount
    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel()
      }
    }
  }, []) // Remove selectedVoice and output from dependencies to avoid loops

  // Use translated output if available, otherwise use edited output
  const displayOutput = translatedOutput !== null ? translatedOutput : editedOutput

  // Detect language from current output and auto-select matching voice
  useEffect(() => {
    if (!displayOutput || voices.length === 0) return
    // Don't auto-change if user manually selected a voice
    if (userSelectedVoice) return

    // Comprehensive multi-language detection
    const detectLanguage = (text: string): string => {
      // Language detection using word patterns (more accurate)
      const languageWordPatterns: Record<string, RegExp[]> = {
        'de': [
          /\b(der|die|das|und|ist|sind|für|mit|auf|zu|von|ein|eine|einer|einem|einen|nicht|auch|wird|werden|haben|hat|kann|muss|soll|wurde|wurden|ich|du|er|sie|es|wir|ihr)\b/i,
          /[äöüßÄÖÜ]/i
        ],
        'es': [
          /\b(el|la|los|las|y|es|son|para|con|de|un|una|del|que|en|por|más|no|se|le|te|me|nos|os)\b/i,
          /[áéíóúñüÁÉÍÓÚÑÜ]/i
        ],
        'fr': [
          /\b(le|la|les|et|est|sont|pour|avec|de|un|une|des|que|dans|par|plus|pas|se|il|elle|nous|vous|ils|elles)\b/i,
          /[àâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ]/i
        ],
        'it': [
          /\b(il|la|lo|gli|le|e|è|sono|per|con|di|un|una|uno|del|che|in|da|più|non|si|noi|voi|loro)\b/i,
          /[àèéìíîòóùúÀÈÉÌÍÎÒÓÙÚ]/i
        ],
        'pt': [
          /\b(o|a|os|as|e|é|são|para|com|de|um|uma|do|da|que|em|por|mais|não|se|nós|vocês|eles|elas)\b/i,
          /[ãõáéíóúâêôÃÕÁÉÍÓÚÂÊÔ]/i
        ],
        'ru': [
          /[а-яёА-ЯЁ]/i,
          /\b(и|в|не|что|он|на|я|с|со|как|а|то|все|она|так|его|но|да|ты|к|у|же|вы|за|бы|по|только|её|мне|было|вот|от|меня|ещё|нет|о|из|ему|теперь|когда|даже|ну|вдруг|ли|если|уже|или|нет|быть|был|была|были|было)\b/i
        ],
        'zh': [
          /[\u4e00-\u9fff]/i,
          /[\u3400-\u4dbf]/i
        ],
        'ja': [
          /[\u3040-\u309f\u30a0-\u30ff]/i,
          /[\u4e00-\u9faf]/i
        ],
        'ko': [
          /[\uac00-\ud7a3]/i,
          /[\u1100-\u11ff]/i
        ],
        'ar': [
          /[\u0600-\u06ff]/i,
          /\b(و|في|من|إلى|على|هو|هي|أن|لا|ما|هذا|هذه|كان|كانت|يكون|تكون)\b/i
        ],
        'hi': [
          /[\u0900-\u097f]/i,
          /\b(और|में|के|का|है|हैं|को|से|पर|यह|वह|कर|करने|हो|होने|था|थी|थे)\b/i
        ],
        'nl': [
          /\b(de|het|een|en|is|zijn|voor|met|van|op|te|in|dat|die|niet|aan|ook|kan|moet|zou|was|waren|ik|jij|hij|zij|wij|jullie)\b/i
        ],
        'pl': [
          /\b(i|w|na|z|do|się|że|nie|o|od|po|za|dla|przez|przy|przed|nad|pod|między|jest|są|był|była|było|byli|były)\b/i,
          /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/i
        ],
        'tr': [
          /\b(ve|ile|bir|bu|şu|o|ben|sen|o|biz|siz|onlar|var|yok|olmak|etmek|yapmak|gitmek|gelmek|görmek|almak|vermek)\b/i,
          /[çğıöşüÇĞIİÖŞÜ]/i
        ],
        'sv': [
          /\b(och|i|att|det|som|på|är|av|för|med|till|om|inte|den|han|hon|vi|de|ni|jag|du|han|hon|den|det|de)\b/i,
          /[åäöÅÄÖ]/i
        ],
        'da': [
          /\b(og|i|at|det|som|på|er|af|for|med|til|om|ikke|den|han|hun|vi|de|i|du|han|hun|den|det|de)\b/i,
          /[æøåÆØÅ]/i
        ],
        'no': [
          /\b(og|i|at|det|som|på|er|av|for|med|til|om|ikke|den|han|hun|vi|de|jeg|du|han|hun|den|det|de)\b/i,
          /[æøåÆØÅ]/i
        ],
        'fi': [
          /\b(ja|on|ei|se|tämä|hän|me|te|he|minä|sinä|hän|me|te|he|olla|olla|tulla|mennä|nähdä|ottaa|antaa)\b/i,
          /[äöåÄÖÅ]/i
        ],
        'cs': [
          /\b(a|v|na|z|do|se|že|ne|o|od|po|za|pro|přes|při|před|nad|pod|mezi|je|jsou|byl|byla|bylo|byli|byly)\b/i,
          /[áčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/i
        ]
      }

      // Score languages based on matches
      const languageScores: Record<string, number> = {}
      
      for (const [lang, patterns] of Object.entries(languageWordPatterns)) {
        let score = 0
        for (const pattern of patterns) {
          const matches = text.match(pattern)
          if (matches) {
            score += matches.length
          }
        }
        if (score > 0) {
          languageScores[lang] = score
        }
      }

      // Return language with highest score, or default to English
      if (Object.keys(languageScores).length > 0) {
        const detectedLang = Object.entries(languageScores).sort((a, b) => b[1] - a[1])[0][0]
        return detectedLang
      }

      // Fallback: check for character patterns if no word matches
      const charPatterns: Record<string, RegExp> = {
        'es': /[áéíóúñü]/i,
        'fr': /[àâäéèêëïîôùûüÿç]/i,
        'it': /[àèéìíîòóùú]/i,
        'pt': /[ãõáéíóúâêô]/i,
        'ru': /[а-яё]/i,
        'zh': /[\u4e00-\u9fff]/i,
        'ja': /[\u3040-\u309f\u30a0-\u30ff]/i,
        'ko': /[\uac00-\ud7a3]/i,
        'ar': /[\u0600-\u06ff]/i,
        'hi': /[\u0900-\u097f]/i,
      }
      
      for (const [lang, pattern] of Object.entries(charPatterns)) {
        if (pattern.test(text)) {
          return lang
        }
      }

      return 'en' // Default to English
    }
    
    const detectedLang = detectLanguage(displayOutput)
    
    // Find Google voice matching detected language
    // Try exact match first, then language-region match (e.g., 'de' or 'de-DE')
    const matchingVoice = voices.find(v => {
      const voiceLang = v.lang.toLowerCase()
      return voiceLang === detectedLang || voiceLang.startsWith(detectedLang + '-')
    }) || voices.find(v => {
      // Fallback: try matching by first two characters (e.g., 'en' matches 'en-US', 'en-GB')
      const voiceLang = v.lang.toLowerCase().split('-')[0]
      return voiceLang === detectedLang
    })
    
    // Auto-select voice based on detected language
    if (matchingVoice) {
      // Always update if language changed, even if voice name is same (handles language switches)
      const currentVoice = voices.find(v => v.name === selectedVoice)
      const currentLang = currentVoice?.lang.toLowerCase().split('-')[0]
      
      if (matchingVoice.name !== selectedVoice || currentLang !== detectedLang) {
        setSelectedVoice(matchingVoice.name)
        setUserSelectedVoice(false) // Reset flag when auto-selecting
      }
    } else if (!selectedVoice && voices.length > 0) {
      // Fallback: prefer English voices if no match found
      const defaultVoice = voices.find(v => {
        const lang = v.lang.toLowerCase()
        return lang.startsWith('en') || lang === 'en'
      }) || voices[0]
      
      if (defaultVoice) {
        setSelectedVoice(defaultVoice.name)
        setUserSelectedVoice(false) // Reset flag when auto-selecting
      }
    }
  }, [displayOutput, voices, selectedVoice, userSelectedVoice]) // Include userSelectedVoice

  // Save settings to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      if (selectedVoice) {
        localStorage.setItem('voxera-selected-voice', selectedVoice)
      }
    } catch (e) {
      console.error('Failed to save selected voice to localStorage:', e)
    }
  }, [selectedVoice])

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem('voxera-speech-rate', speechRate.toString())
    } catch (e) {
      console.error('Failed to save speech rate to localStorage:', e)
    }
  }, [speechRate])

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem('voxera-speech-pitch', speechPitch.toString())
    } catch (e) {
      console.error('Failed to save speech pitch to localStorage:', e)
    }
  }, [speechPitch])

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem('voxera-target-language', targetLanguage)
    } catch (e) {
      console.error('Failed to save target language to localStorage:', e)
    }
  }, [targetLanguage])

  const handleCopy = async () => {
    await onCopy()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!displayOutput) return

    // Create a blob with the text content
    const blob = new Blob([displayOutput], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    
    // Create a temporary anchor element and trigger download
    const link = document.createElement('a')
    link.href = url
    link.download = `voxera-output-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`
    document.body.appendChild(link)
    link.click()
    
    // Cleanup
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleSpeak = () => {
    if (isSpeaking) {
      // Stop speaking
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      utteranceRef.current = null
    } else {
      // Start speaking
      if (!window.speechSynthesis) {
        alert('Text-to-speech is not supported in your browser')
        return
      }

      // Clean any previous utterance
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(displayOutput)
      utteranceRef.current = utterance

      // Set voice
      const voice = voices.find(v => v.name === selectedVoice)
      if (voice) {
        utterance.voice = voice
      }

      // Set speech parameters
      utterance.rate = speechRate
      utterance.pitch = speechPitch
      utterance.volume = 1.0

      // Event handlers
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => {
        setIsSpeaking(false)
        utteranceRef.current = null
      }
      utterance.onerror = () => {
        setIsSpeaking(false)
        utteranceRef.current = null
      }

      window.speechSynthesis.speak(utterance)
    }
  }

  const handleStop = () => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
    utteranceRef.current = null
  }

  const handleEdit = () => {
    setIsEditing(true)
    setEditedOutput(output)
    // Focus textarea after a brief delay to ensure it's rendered
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 100)
  }

  const handleSaveEdit = () => {
    if (onOutputChange) {
      onOutputChange(editedOutput)
    }
    setIsEditing(false)
    setTranslatedOutput(null) // Clear translation when editing
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('voxera-edited-output', editedOutput)
        localStorage.removeItem('voxera-translated-output')
      } catch (e) {
        console.error('Failed to save edited output to localStorage:', e)
      }
    }
  }

  const handleCancelEdit = () => {
    setEditedOutput(output)
    setIsEditing(false)
  }

  const handleTranslate = async () => {
    if (!editedOutput || isTranslating) return

    setIsTranslating(true)
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: editedOutput,
          targetLanguage: targetLanguage,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Translation failed')
      }

      const { translatedText, usage } = await response.json()
      setTranslatedOutput(translatedText)
      if (onOutputChange) {
        onOutputChange(translatedText)
      }
      // Store translation usage for statistics
      setTranslationUsage(usage)
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('voxera-translated-output', translatedText)
          if (usage) {
            localStorage.setItem('voxera-translation-usage', JSON.stringify(usage))
          }
        } catch (e) {
          console.error('Failed to save translation to localStorage:', e)
        }
      }
    } catch (error) {
      console.error('Translation error:', error)
      alert(error instanceof Error ? error.message : 'Failed to translate')
    } finally {
      setIsTranslating(false)
    }
  }

  // Common languages for translation
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
    { code: 'nl', name: 'Dutch' },
    { code: 'pl', name: 'Polish' },
    { code: 'tr', name: 'Turkish' },
    { code: 'sv', name: 'Swedish' },
    { code: 'da', name: 'Danish' },
    { code: 'no', name: 'Norwegian' },
    { code: 'fi', name: 'Finnish' },
    { code: 'cs', name: 'Czech' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mt-8"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-white/60 rounded-full"></div>
              <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-md">{t('enrichedOutput')}</h2>
            </div>
        <div className="flex items-center gap-3 flex-wrap">
          {onClose && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 text-slate-100 hover:text-white hover:bg-red-500/30 rounded-lg transition-all"
              title="Close output"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
          <AnimatePresence mode="wait">
            {!isEditing ? (
              <motion.button
                key="edit"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleEdit}
                className="px-5 py-2.5 text-sm font-semibold bg-green-500/90 hover:bg-green-600 backdrop-blur-sm text-white rounded-xl shadow-lg hover:shadow-xl border border-green-400/50 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                {t('edit')}
              </motion.button>
            ) : (
              <motion.div
                key="save-cancel"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex gap-2"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSaveEdit}
                  className="px-5 py-2.5 text-sm font-semibold bg-green-500/90 hover:bg-green-600 backdrop-blur-sm text-white rounded-xl shadow-lg hover:shadow-xl border border-green-400/50 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {t('save')}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCancelEdit}
                  className="px-5 py-2.5 text-sm font-semibold bg-gray-500/90 hover:bg-gray-600 backdrop-blur-sm text-white rounded-xl shadow-lg hover:shadow-xl border border-gray-400/50 flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  {t('cancel')}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
                    className="px-5 py-2.5 text-sm font-semibold bg-white/90 hover:bg-white backdrop-blur-sm text-slate-700 rounded-xl shadow-lg hover:shadow-xl border border-white/50 flex items-center gap-2"
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.span
                  key="copied"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {t('copied')}
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {t('copy')}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDownload}
            disabled={!displayOutput}
            className="px-5 py-2.5 text-sm font-semibold bg-green-500/90 hover:bg-green-600 backdrop-blur-sm text-white rounded-xl shadow-lg hover:shadow-xl border border-green-400/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title={t('download')}
          >
            <Download className="w-4 h-4" />
            {t('download')}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSpeak}
            className={`px-5 py-2.5 text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl border flex items-center gap-2 ${
              isSpeaking
                ? 'bg-red-500 hover:bg-red-600 text-white border-red-400/50'
                : 'bg-blue-500 hover:bg-blue-600 text-white border-blue-400/50'
            }`}
          >
            <AnimatePresence mode="wait">
              {isSpeaking ? (
                <motion.span
                  key="stop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <motion.span
                    className="w-2 h-2 bg-white rounded-full"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [1, 0.5, 1],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                    }}
                  />
                  {t('stop')}
                </motion.span>
              ) : (
                <motion.span
                  key="read"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  {t('read')}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Translation Controls */}
      {!isEditing && (
        <div className="mb-4 bg-white/25 backdrop-blur-md p-5 rounded-xl border border-white/40 shadow-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex-1 w-full md:w-auto">
              <label className="block text-sm font-semibold text-slate-100 mb-2.5 flex items-center gap-2">
                <Languages className="w-4 h-4" />
                Translate to
              </label>
              <div className="flex gap-2">
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  disabled={isTranslating}
                  className="flex-1 px-4 py-2.5 bg-white/95 text-slate-800 rounded-lg border border-white/60 focus:outline-none focus:ring-2 focus:ring-white/60 disabled:opacity-50 shadow-sm font-medium"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleTranslate}
                  disabled={isTranslating || !editedOutput}
                  className="px-6 py-2.5 text-sm font-semibold bg-purple-500/90 hover:bg-purple-600 text-white rounded-lg transition-all shadow-lg hover:shadow-xl border border-purple-400/50 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isTranslating ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4" />
                      Translating...
                    </>
                  ) : (
                    <>
                      <Languages className="w-4 h-4" />
                      Translate
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voice Controls */}
      <div className="mb-4 bg-white/25 backdrop-blur-md p-5 rounded-xl border border-white/40 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Voice Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-100 mb-2.5 flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              {t('voice')}
            </label>
            <select
              value={selectedVoice}
              onChange={(e) => {
                setSelectedVoice(e.target.value)
                setUserSelectedVoice(true) // Mark as user-selected to prevent auto-override
              }}
              disabled={isSpeaking || voices.length === 0}
              className="w-full px-4 py-2.5 bg-white/95 text-slate-800 rounded-lg border border-white/60 focus:outline-none focus:ring-2 focus:ring-white/60 disabled:opacity-50 shadow-sm font-medium"
              title="Select a voice that matches the output language for best results"
            >
              {voices.length === 0 ? (
                <option value="">{t('loadingVoices')}</option>
              ) : (
                voices.map((voice, index) => {
                  // Show language name for better UX
                  const langCode = voice.lang.split('-')[0]
                  const langName = new Intl.DisplayNames(['en'], { type: 'language' }).of(langCode) || langCode
                  // Use voiceURI as key (unique identifier) or fallback to index if not available
                  const uniqueKey = voice.voiceURI || `${voice.name}-${voice.lang}-${index}`
                  return (
                    <option key={uniqueKey} value={voice.name}>
                      {voice.name} - {langName} ({voice.lang})
                    </option>
                  )
                })
              )}
            </select>
          </div>

          {/* Speech Rate */}
          <div>
            <label className="block text-sm font-semibold text-slate-100 mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Gauge className="w-4 h-4" />
                {t('speed')}
              </span>
              <span className="text-xs bg-white/20 px-2 py-1 rounded font-mono">{speechRate.toFixed(1)}x</span>
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              disabled={isSpeaking}
              className="w-full h-2.5 bg-white/30 rounded-lg appearance-none cursor-pointer disabled:opacity-50 accent-white"
              style={{
                background: `linear-gradient(to right, white 0%, white ${((speechRate - 0.5) / 1.5) * 100}%, rgba(255,255,255,0.3) ${((speechRate - 0.5) / 1.5) * 100}%, rgba(255,255,255,0.3) 100%)`
              }}
            />
          </div>

          {/* Speech Pitch */}
          <div>
            <label className="block text-sm font-semibold text-slate-100 mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Music className="w-4 h-4" />
                {t('pitch')}
              </span>
              <span className="text-xs bg-white/20 px-2 py-1 rounded font-mono">{speechPitch.toFixed(1)}</span>
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={speechPitch}
              onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
              disabled={isSpeaking}
              className="w-full h-2.5 bg-white/30 rounded-lg appearance-none cursor-pointer disabled:opacity-50 accent-white"
              style={{
                background: `linear-gradient(to right, white 0%, white ${((speechPitch - 0.5) / 1.5) * 100}%, rgba(255,255,255,0.3) ${((speechPitch - 0.5) / 1.5) * 100}%, rgba(255,255,255,0.3) 100%)`
              }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white/95 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-2xl border border-white/50 hover:shadow-3xl transition-shadow">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editedOutput}
            onChange={(e) => setEditedOutput(e.target.value)}
            className="w-full min-h-[300px] text-base md:text-lg font-mono text-gray-800 leading-relaxed bg-transparent border-2 border-blue-300 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 resize-y"
            placeholder="Edit your output here..."
          />
        ) : (
          <pre className="text-base md:text-lg whitespace-pre-wrap font-mono overflow-x-auto text-gray-800 leading-relaxed">
            {displayOutput}
          </pre>
        )}
      </div>

      {/* Translation Statistics */}
      {translationUsage && (
        <Statistics usage={translationUsage} type="translation" />
      )}
    </motion.div>
  )
}

