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
      whileHover={{ scale: isRecording ? 1.05 : 1.08 }}
      whileTap={{ scale: 0.95 }}
      animate={{
        scale: isRecording ? 1.05 : 1,
        boxShadow: isRecording
          ? '0 0 60px rgba(239, 68, 68, 0.8), 0 0 120px rgba(239, 68, 68, 0.5), 0 0 180px rgba(239, 68, 68, 0.3)'
          : '0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(147, 51, 234, 0.3)',
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      className={`
        relative w-36 h-36 md:w-40 md:h-40 rounded-full
        ${isRecording
          ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-2xl ring-4 ring-red-400/50 ring-offset-4 ring-offset-transparent'
          : 'bg-gradient-to-br from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 backdrop-blur-xl shadow-2xl border-2 border-white/30'
        }
        focus:outline-none focus:ring-4 focus:ring-purple-400/50
        group overflow-hidden
      `}
      aria-label={isRecording ? t('stopRecording') : t('startRecording')}
    >
      {/* Animated background gradient for recording state */}
      {isRecording && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-red-400 via-red-500 to-red-600"
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}
      
      <div className="absolute inset-0 flex items-center justify-center z-10">
        {isRecording ? (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            className="w-16 h-16 md:w-20 md:h-20 bg-white/95 rounded-2xl shadow-2xl flex items-center justify-center backdrop-blur-sm"
          >
            <motion.div
              className="w-8 h-8 md:w-10 md:h-10 bg-red-500 rounded-lg"
              animate={{ 
                opacity: [1, 0.6, 1],
                scale: [1, 0.95, 1],
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            className="relative"
            whileHover={{ x: 3 }}
          >
            <div className="w-0 h-0 border-l-[32px] md:border-l-[36px] border-l-white border-t-[20px] md:border-t-[24px] border-t-transparent border-b-[20px] md:border-b-[24px] border-b-transparent ml-2 drop-shadow-lg" />
            <motion.div
              className="absolute inset-0 w-0 h-0 border-l-[32px] md:border-l-[36px] border-l-purple-300 border-t-[20px] md:border-t-[24px] border-t-transparent border-b-[20px] md:border-b-[24px] border-b-transparent ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
              animate={{
                x: [0, 2, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
              }}
            />
          </motion.div>
        )}
      </div>
      
      {/* Pulsing rings for recording state */}
      {isRecording && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-red-400/60"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.6, 0, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-red-300/40"
            animate={{
              scale: [1, 1.6, 1],
              opacity: [0.4, 0, 0.4],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeOut',
              delay: 0.3,
            }}
          />
        </>
      )}
      
      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 via-transparent to-transparent"
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </motion.button>
  )
}

