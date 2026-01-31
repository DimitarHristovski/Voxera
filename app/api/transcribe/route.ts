import { NextRequest, NextResponse } from 'next/server'

/**
 * Transcription API route
 * 
 * This endpoint handles audio transcription using a transcription service.
 * API keys should be stored in environment variables and never exposed to the client.
 * 
 * Expected input: FormData with 'audio' field containing audio blob
 * Expected output: { transcript: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Log request origin for debugging
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const origin = request.headers.get('origin') || request.headers.get('referer') || 'unknown'
    const isTauri = userAgent.includes('Tauri') || origin.includes('tauri')
    
    console.log('📥 Transcription request received:', {
      userAgent: userAgent.substring(0, 50),
      origin: origin.substring(0, 50),
      isTauri,
      method: request.method,
      url: request.url
    })
    
    const requestFormData = await request.formData()
    const audioFile = requestFormData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // Use local or cloud OpenAI API
    // Use OPEN_KEY from .env.local
    const apiBaseUrl = process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1'
    // Trim whitespace from API key (common issue with .env files)
    const apiKey = (process.env.OPEN_KEY || '').trim()
    
    // Log for debugging (don't log the actual key value)
    console.log('🔍 Transcription API Config Check:')
    console.log('   apiBaseUrl:', apiBaseUrl)
    console.log('   hasApiKey:', !!apiKey)
    console.log('   apiKeyLength:', apiKey ? apiKey.length : 0)
    console.log('   apiKeyPrefix:', apiKey ? apiKey.substring(0, 10) + '...' : 'none')
    console.log('   apiKeyStartsWithSk:', apiKey ? apiKey.startsWith('sk-') : false)
    console.log('   whisperModel:', process.env.WHISPER_MODEL || 'whisper-1')
    console.log('   All env vars:', {
      OPEN_KEY_exists: !!process.env.OPEN_KEY,
      OPEN_KEY_length: process.env.OPEN_KEY ? process.env.OPEN_KEY.length : 0,
      OPENAI_API_BASE_URL: process.env.OPENAI_API_BASE_URL,
      WHISPER_MODEL: process.env.WHISPER_MODEL
    })
    
    // Check if API key is required (most APIs require it)
    if (!apiKey) {
      console.error('❌ OPEN_KEY is not set in .env.local')
      return NextResponse.json(
        { 
          error: 'API key not configured. Please set OPEN_KEY in your .env.local file and restart the server.',
          details: 'The OPEN_KEY environment variable is missing or empty. Check your .env.local file.'
        },
        { status: 500 }
      )
    }
    
    if (!apiBaseUrl) {
      return NextResponse.json(
        { error: 'OpenAI API base URL not configured' },
        { status: 500 }
      )
    }

    const audioBuffer = await audioFile.arrayBuffer()
    const uploadFormData = new FormData()
    uploadFormData.append('file', new Blob([audioBuffer]), audioFile.name)
    uploadFormData.append('model', process.env.WHISPER_MODEL || 'whisper-1')
    // Auto-detect language - Whisper will automatically detect the language
    // Optionally, you can set a specific language code if needed
    // uploadFormData.append('language', 'auto')

    const headers: HeadersInit = {}
    
    // Only add Authorization header if API key is provided
    // Don't set Content-Type for FormData - browser will set it with boundary
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
      console.log('✅ Authorization header set with API key')
      console.log('   Key prefix:', apiKey.substring(0, 10) + '...')
      console.log('   Key length:', apiKey.length)
    } else {
      console.error('❌ No API key available - Authorization header NOT set')
    }

    console.log('📤 Sending transcription request:', {
      url: `${apiBaseUrl}/audio/transcriptions`,
      method: 'POST',
      hasAuthHeader: !!headers['Authorization'],
      headers: Object.keys(headers),
      model: process.env.WHISPER_MODEL || 'whisper-1',
      fileSize: audioFile.size,
      fileName: audioFile.name
    })

    const response = await fetch(`${apiBaseUrl}/audio/transcriptions`, {
      method: 'POST',
      headers,
      body: uploadFormData,
    })
    
    console.log('📥 Transcription response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorDetails: any = {}
      
      // Try to parse error JSON for more details
      try {
        errorDetails = JSON.parse(errorText)
      } catch {
        errorDetails = { message: errorText }
      }
      
      console.error('❌ Transcription API error:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        errorDetails,
        apiBaseUrl,
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey ? apiKey.length : 0,
        apiKeyPrefix: apiKey ? apiKey.substring(0, 15) + '...' : 'none',
        requestUrl: `${apiBaseUrl}/audio/transcriptions`,
        authHeaderSet: !!headers['Authorization']
      })
      
      // Log the actual error from OpenAI
      if (errorDetails.error) {
        console.error('OpenAI API Error Details:', errorDetails.error)
      }
      
      // Provide more helpful error messages
      let errorMessage = `Transcription failed: ${response.statusText}`
      if (response.status === 401) {
        const apiError = errorDetails.error?.message || errorDetails.message || errorText
        errorMessage = `Unauthorized: API key is invalid or expired. ${apiError}`
        if (apiKey && !apiKey.startsWith('sk-')) {
          errorMessage += ' Note: Your API key should start with "sk-". Check your OPEN_KEY in .env.local.'
        }
      } else if (response.status === 404) {
        errorMessage = `API endpoint not found. Check your OPENAI_API_BASE_URL (${apiBaseUrl}). The endpoint should be ${apiBaseUrl}/audio/transcriptions`
      } else if (response.status === 400) {
        errorMessage = `Bad request: ${errorDetails.error?.message || errorText || response.statusText}. Check your audio file format and model configuration.`
      }
      
      // For 401 errors, include more diagnostic info
      const errorResponse: any = { 
        error: errorMessage
      }
      
      if (response.status === 401) {
        errorResponse.details = `API Error: ${errorDetails.error?.message || errorText}`
        errorResponse.diagnostics = {
          apiKeyLoaded: !!apiKey,
          apiKeyLength: apiKey ? apiKey.length : 0,
          apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'none',
          authHeaderSet: !!headers['Authorization'],
          apiBaseUrl: apiBaseUrl,
          openaiError: errorDetails.error || errorText
        }
        errorResponse.troubleshooting = 'If API key is loaded but still getting 401, the key may be invalid, expired, or lack Whisper API access. Check your OpenAI account at https://platform.openai.com/api-keys'
      } else {
        errorResponse.details = errorDetails.error?.message || errorText
      }
      
      return NextResponse.json(
        errorResponse,
        { status: response.status }
      )
    }

    const data = await response.json()
    // Return both transcript and detected language if available
    return NextResponse.json({ 
      transcript: data.text,
      language: data.language || null // Whisper API may return detected language
    })
  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    )
  }
}

