'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { calculateCost, formatCost, formatTokens, type TokenUsage } from '@/lib/cost-calculator'
import { t } from '@/lib/i18n'

interface StatisticsProps {
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
    model: string
  }
  type: 'transcription' | 'enrichment' | 'translation'
}

interface SessionStats {
  totalTokens: number
  totalCost: number
  transcriptionTokens: number
  enrichmentTokens: number
  translationTokens: number
  transcriptionCost: number
  enrichmentCost: number
  translationCost: number
  requestCount: number
}

export default function Statistics({ usage, type }: StatisticsProps) {
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalTokens: 0,
    totalCost: 0,
    transcriptionTokens: 0,
    enrichmentTokens: 0,
    translationTokens: 0,
    transcriptionCost: 0,
    enrichmentCost: 0,
    translationCost: 0,
    requestCount: 0,
  })
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    // Load stats from localStorage
    const savedStats = localStorage.getItem('voxera-stats')
    if (savedStats) {
      try {
        setSessionStats(JSON.parse(savedStats))
      } catch (e) {
        console.error('Failed to load stats:', e)
      }
    }
  }, [])

  useEffect(() => {
    if (!usage) return

    const tokenUsage: TokenUsage = {
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
      model: usage.model,
    }

    const costBreakdown = calculateCost(tokenUsage)

    setSessionStats((prev) => {
      const updated = { ...prev }
      
      if (type === 'transcription') {
        // Whisper pricing is per minute, estimate tokens
        updated.transcriptionTokens += tokenUsage.totalTokens
        updated.transcriptionCost += costBreakdown.totalCost
      } else if (type === 'enrichment') {
        updated.enrichmentTokens += tokenUsage.totalTokens
        updated.enrichmentCost += costBreakdown.totalCost
      } else if (type === 'translation') {
        updated.translationTokens += tokenUsage.totalTokens
        updated.translationCost += costBreakdown.totalCost
      }

      updated.totalTokens = updated.transcriptionTokens + updated.enrichmentTokens + updated.translationTokens
      updated.totalCost = updated.transcriptionCost + updated.enrichmentCost + updated.translationCost
      updated.requestCount += 1

      // Save to localStorage
      localStorage.setItem('voxera-stats', JSON.stringify(updated))
      
      return updated
    })
  }, [usage, type])

  if (!usage && sessionStats.totalTokens === 0) {
    return null // Don't show stats if no usage
  }

  const currentCost = usage ? calculateCost(usage as TokenUsage).totalCost : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mt-6 bg-white/25 backdrop-blur-md p-5 rounded-xl border border-white/40 shadow-lg"
    >
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-slate-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-lg font-semibold text-slate-100">{t('usageStatistics')}</h3>
        </div>
        <motion.svg
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="w-5 h-5 text-slate-100"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </motion.button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 space-y-4 overflow-hidden"
          >
            {/* Current Request */}
            {usage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/10 p-4 rounded-lg border border-white/20"
              >
                <h4 className="text-sm font-semibold text-slate-200 mb-2">{t('currentRequest')} ({type})</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <div className="text-slate-300 text-xs">Prompt Tokens</div>
                    <div className="text-white font-mono">{formatTokens(usage.promptTokens)}</div>
                  </div>
                  <div>
                    <div className="text-slate-300 text-xs">Completion Tokens</div>
                    <div className="text-white font-mono">{formatTokens(usage.completionTokens)}</div>
                  </div>
                  <div>
                    <div className="text-slate-300 text-xs">{t('totalTokens')}</div>
                    <div className="text-white font-mono">{formatTokens(usage.totalTokens)}</div>
                  </div>
                  <div>
                    <div className="text-slate-300 text-xs">{t('totalCost')}</div>
                    <div className="text-white font-mono font-semibold">{formatCost(currentCost)}</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-400">Model: {usage.model}</div>
              </motion.div>
            )}

            {/* Session Totals */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 p-4 rounded-lg border border-white/20"
            >
              <h4 className="text-sm font-semibold text-slate-200 mb-3">{t('sessionTotals')}</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 text-sm">{t('totalTokens')}</span>
                  <span className="text-white font-mono font-semibold">{formatTokens(sessionStats.totalTokens)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 text-sm">{t('totalCost')}</span>
                  <span className="text-white font-mono font-semibold text-green-300">{formatCost(sessionStats.totalCost)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 text-sm">{t('requests')}</span>
                  <span className="text-white font-mono">{sessionStats.requestCount}</span>
                </div>
              </div>
            </motion.div>

            {/* Breakdown by Type */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/10 p-4 rounded-lg border border-white/20"
            >
              <h4 className="text-sm font-semibold text-slate-200 mb-3">{t('breakdownByType')}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">{t('transcription')}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-xs font-mono">{formatTokens(sessionStats.transcriptionTokens)}</span>
                    <span className="text-white font-mono">{formatCost(sessionStats.transcriptionCost)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">{t('enrichment')}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-xs font-mono">{formatTokens(sessionStats.enrichmentTokens)}</span>
                    <span className="text-white font-mono">{formatCost(sessionStats.enrichmentCost)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">{t('translation')}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-xs font-mono">{formatTokens(sessionStats.translationTokens)}</span>
                    <span className="text-white font-mono">{formatCost(sessionStats.translationCost)}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Reset Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const resetStats: SessionStats = {
                  totalTokens: 0,
                  totalCost: 0,
                  transcriptionTokens: 0,
                  enrichmentTokens: 0,
                  translationTokens: 0,
                  transcriptionCost: 0,
                  enrichmentCost: 0,
                  translationCost: 0,
                  requestCount: 0,
                }
                setSessionStats(resetStats)
                localStorage.setItem('voxera-stats', JSON.stringify(resetStats))
              }}
              className="w-full px-4 py-2 text-sm font-medium bg-red-500/20 hover:bg-red-500/30 text-red-100 rounded-lg border border-red-400/30 transition-all"
            >
              {t('resetStatistics')}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed Summary */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-3 flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-4">
              <div>
                <span className="text-slate-300">{t('totalTokens')}: </span>
                <span className="text-white font-mono font-semibold">{formatTokens(sessionStats.totalTokens)}</span>
              </div>
              <div>
                <span className="text-slate-300">{t('totalCost')}: </span>
                <span className="text-green-300 font-mono font-semibold">{formatCost(sessionStats.totalCost)}</span>
              </div>
            </div>
            <div className="text-slate-400 text-xs">{sessionStats.requestCount} {t('requests')}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

