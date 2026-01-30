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
    const requestFormData = await request.formData()
    const audioFile = requestFormData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // Use local or cloud OpenAI API
    // Support both OPENAI_API_KEY and OPEN_API for compatibility
    const apiBaseUrl = process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1'
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPEN_API || ''
    
    // For local API, key might be optional (some local servers don't require it)
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
    }

    const response = await fetch(`${apiBaseUrl}/audio/transcriptions`, {
      method: 'POST',
      headers,
      body: uploadFormData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Transcription API error:', response.status, errorText)
      return NextResponse.json(
        { error: `Transcription failed: ${response.statusText}` },
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

