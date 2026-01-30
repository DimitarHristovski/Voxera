'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { t } from '@/lib/i18n'

type PipelineState = 'idle' | 'recording' | 'transcribing' | 'enriching' | 'complete'

interface StatusIndicatorProps {
  state: PipelineState
  error: string | null
}

export default function StatusIndicator({ state, error }: StatusIndicatorProps) {
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="text-center"
      >
        <div className="inline-flex items-center px-5 py-2.5 bg-red-500/90 backdrop-blur-sm text-white rounded-xl shadow-lg border border-red-400/50">
          <span className="text-sm font-semibold">Error: {error}</span>
        </div>
      </motion.div>
    )
  }

  const statusConfig = {
    idle: { text: t('idle'), color: 'text-slate-100', bg: 'bg-white/20' },
    recording: { text: t('recording'), color: 'text-white', bg: 'bg-red-500/90' },
    transcribing: { text: t('transcribing'), color: 'text-white', bg: 'bg-yellow-500/90' },
    enriching: { text: t('enriching'), color: 'text-white', bg: 'bg-blue-500/90' },
    complete: { text: t('complete'), color: 'text-white', bg: 'bg-green-500/90' },
  }

  const config = statusConfig[state]

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <div className={`inline-flex items-center gap-3 px-6 py-3 ${config.bg} ${config.color} rounded-xl shadow-xl backdrop-blur-md border border-white/40`}>
          {state !== 'idle' && (
            <motion.div
              className="relative"
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <div className="w-3 h-3 rounded-full bg-current"></div>
              <motion.div
                className="absolute inset-0 w-3 h-3 rounded-full bg-current"
                animate={{
                  scale: [1, 2, 1],
                  opacity: [0.75, 0, 0.75],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                }}
              />
            </motion.div>
          )}
          <span className="text-sm md:text-base font-semibold tracking-wide">{config.text}</span>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

