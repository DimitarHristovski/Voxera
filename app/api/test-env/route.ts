import { NextResponse } from 'next/server'

/**
 * Test endpoint to verify environment variables are loaded
 * Access at: http://localhost:3000/api/test-env
 */
export async function GET() {
  const apiKey = (process.env.OPEN_KEY || '').trim()
  
  return NextResponse.json({
    success: true,
    envCheck: {
      OPEN_KEY_exists: !!process.env.OPEN_KEY,
      OPEN_KEY_length: process.env.OPEN_KEY ? process.env.OPEN_KEY.length : 0,
      OPEN_KEY_trimmed_length: apiKey.length,
      OPEN_KEY_starts_with_sk: apiKey.startsWith('sk-'),
      OPEN_KEY_prefix: apiKey ? apiKey.substring(0, 10) + '...' : 'none',
      OPENAI_API_BASE_URL: process.env.OPENAI_API_BASE_URL || 'not set',
      WHISPER_MODEL: process.env.WHISPER_MODEL || 'not set',
    },
    message: apiKey 
      ? '✅ API key is loaded correctly!' 
      : '❌ API key is NOT loaded. Restart the server after updating .env.local'
  })
}

