/**
 * Cost calculator for OpenAI API usage
 * Pricing as of 2024 (adjust based on your API provider)
 */

export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  model: string
}

export interface CostBreakdown {
  promptCost: number
  completionCost: number
  totalCost: number
  model: string
}

// Model pricing per 1M tokens (input/output)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // GPT-4 models
  'gpt-4': { input: 30.0, output: 60.0 },
  'gpt-4-turbo': { input: 10.0, output: 30.0 },
  'gpt-4o': { input: 5.0, output: 15.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  
  // GPT-3.5 models
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
  'gpt-3.5-turbo-16k': { input: 3.0, output: 4.0 },
  
  // Whisper (per minute of audio)
  'whisper-1': { input: 0.006, output: 0 }, // $0.006 per minute
  
  // Default fallback
  'default': { input: 1.0, output: 2.0 },
}

/**
 * Calculate cost for token usage
 */
export function calculateCost(usage: TokenUsage): CostBreakdown {
  const model = usage.model.toLowerCase()
  
  // Find pricing for model (check for partial matches)
  let pricing = MODEL_PRICING[model] || MODEL_PRICING['default']
  
  // Check for model variants (e.g., gpt-4-0125, gpt-4-turbo-preview)
  if (!MODEL_PRICING[model]) {
    if (model.includes('gpt-4o')) {
      pricing = MODEL_PRICING['gpt-4o']
    } else if (model.includes('gpt-4-turbo') || model.includes('gpt-4-turbo')) {
      pricing = MODEL_PRICING['gpt-4-turbo']
    } else if (model.includes('gpt-4')) {
      pricing = MODEL_PRICING['gpt-4']
    } else if (model.includes('gpt-3.5')) {
      pricing = MODEL_PRICING['gpt-3.5-turbo']
    } else if (model.includes('whisper')) {
      pricing = MODEL_PRICING['whisper-1']
    }
  }
  
  // Calculate costs (pricing is per 1M tokens)
  const promptCost = (usage.promptTokens / 1_000_000) * pricing.input
  const completionCost = (usage.completionTokens / 1_000_000) * pricing.output
  const totalCost = promptCost + completionCost
  
  return {
    promptCost,
    completionCost,
    totalCost,
    model: usage.model,
  }
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  if (cost < 0.001) {
    return `$${(cost * 1000).toFixed(3)}¢`
  }
  return `$${cost.toFixed(4)}`
}

/**
 * Format token count
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(2)}M`
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(2)}K`
  }
  return tokens.toLocaleString()
}

