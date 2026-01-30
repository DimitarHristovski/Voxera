'use client'

import { motion } from 'framer-motion'
import { t } from '@/lib/i18n'

interface RecordingButtonProps {
  isRecording: boolean
  onClick: () => void
}

export default function RecordingButton({ isRecording, onClick }: RecordingButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: isRecording ? 1.05 : 1.1 }}
      whileTap={{ scale: 0.95 }}
      animate={{
        scale: isRecording ? 1.1 : 1,
        boxShadow: isRecording
          ? '0 0 40px rgba(239, 68, 68, 0.6), 0 0 80px rgba(239, 68, 68, 0.4)'
          : '0 10px 40px rgba(0, 0, 0, 0.3)',
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      className={`
        relative w-32 h-32 md:w-36 md:h-36 rounded-full
        ${isRecording
          ? 'bg-red-500 hover:bg-red-600 shadow-2xl shadow-red-500/60 ring-4 ring-red-300/50'
          : 'bg-white/95 hover:bg-white backdrop-blur-sm shadow-2xl shadow-black/30'
        }
        focus:outline-none focus:ring-4 focus:ring-white/50
        border-2 ${isRecording ? 'border-red-200' : 'border-white/60'}
        group
      `}
      aria-label={isRecording ? t('stopRecording') : t('startRecording')}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {isRecording ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-lg shadow-inner flex items-center justify-center"
          >
            <motion.div
              className="w-6 h-6 bg-red-500 rounded-sm"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </motion.div>
        ) : (
          <motion.div
            className="w-0 h-0 border-l-[24px] md:border-l-[28px] border-l-slate-600 border-t-[16px] md:border-t-[20px] border-t-transparent border-b-[16px] md:border-b-[20px] border-b-transparent ml-1 group-hover:border-l-slate-700 transition-colors"
            whileHover={{ x: 2 }}
          />
        )}
      </div>
      {isRecording && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full bg-red-400 opacity-40"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.4, 0, 0.4],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
          <motion.div
            className="absolute inset-0 rounded-full bg-red-300/30"
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          />
        </>
      )}
    </motion.button>
  )
}

