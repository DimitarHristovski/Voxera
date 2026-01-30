'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Clock, Mic, FileText, Zap, CheckCircle } from 'lucide-react'
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
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-red-500/30 to-red-600/30 backdrop-blur-xl text-white rounded-2xl shadow-2xl border border-red-400/40">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-semibold">Error: {error}</span>
        </div>
      </motion.div>
    )
  }

  const statusConfig = {
    idle: { 
      text: t('idle'), 
      color: 'text-slate-100', 
      bg: 'bg-white/20',
      border: 'border-white/40',
      Icon: Clock
    },
    recording: { 
      text: t('recording'), 
      color: 'text-white', 
      bg: 'bg-red-500/90',
      border: 'border-red-400/50',
      Icon: Mic
    },
    transcribing: { 
      text: t('transcribing'), 
      color: 'text-white', 
      bg: 'bg-yellow-500/90',
      border: 'border-yellow-400/50',
      Icon: FileText
    },
    enriching: { 
      text: t('enriching'), 
      color: 'text-white', 
      bg: 'bg-blue-500/90',
      border: 'border-blue-400/50',
      Icon: Zap
    },
    complete: { 
      text: t('complete'), 
      color: 'text-white', 
      bg: 'bg-green-500/90',
      border: 'border-green-400/50',
      Icon: CheckCircle
    },
  }

  const config = statusConfig[state]

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state}
        initial={{ opacity: 0, scale: 0.9, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -10 }}
        transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
        className="text-center"
      >
        <div className={`inline-flex items-center gap-3 px-6 py-3 ${config.bg} ${config.color} rounded-xl shadow-xl backdrop-blur-md border ${config.border}`}>
          {state !== 'idle' && (
            <motion.div
              className="relative"
              animate={{
                scale: [1, 1.15, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <config.Icon className="w-5 h-5" />
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{
                  scale: [1, 1.8, 1],
                  opacity: [0.6, 0, 0.6],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                }}
              >
                <config.Icon className="w-5 h-5" />
              </motion.div>
            </motion.div>
          )}
          <span className="text-sm md:text-base font-semibold tracking-wide">{config.text}</span>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

