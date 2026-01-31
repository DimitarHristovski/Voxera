import { NextRequest, NextResponse } from 'next/server'

/**
 * Translation API route
 * 
 * Translates text to a target language using AI.
 * Desktop-first: All AI calls go through server routes to keep API keys secure.
 * 
 * Expected input: { text: string, targetLanguage: string }
 * Expected output: { translatedText: string, targetLanguage: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, targetLanguage } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    if (!targetLanguage || typeof targetLanguage !== 'string') {
      return NextResponse.json(
        { error: 'Target language is required' },
        { status: 400 }
      )
    }

    // Use local or cloud OpenAI API
    // Use OPEN_KEY from .env.local
    const apiBaseUrl = process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1'
    // Trim whitespace from API key (common issue with .env files)
    const apiKey = (process.env.OPEN_KEY || '').trim()
    const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
    
    // Check if API key is required
    if (!apiKey) {
      console.error('❌ OPEN_KEY is not set in .env.local')
      return NextResponse.json(
        { 
          error: 'API key not configured. Please set OPEN_KEY in your .env.local file and restart the server.',
          details: 'The OPEN_KEY environment variable is missing or empty.'
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

    // Get language name for better prompt
    const langName = new Intl.DisplayNames(['en'], { type: 'language' }).of(targetLanguage) || targetLanguage

    const systemPrompt = `You are a professional translator. Translate text accurately while preserving meaning, tone, and formatting. Maintain markdown formatting, code blocks, and structure if present.`
    
    const userPrompt = `Translate the following text to ${langName} (${targetLanguage}). Preserve all formatting, markdown syntax, code blocks, and structure. Only translate the content, not the formatting syntax.

Text to translate:
${text}`

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    // Only add Authorization header if API key is provided
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    const response = await fetch(`${apiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3, // Lower temperature for more accurate translation
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Translation API error:', response.status, errorText)
      return NextResponse.json(
        { error: `Translation failed: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    const translatedText = data.choices[0].message.content

    // Extract token usage from response
    const usage = data.usage || {}
    const promptTokens = usage.prompt_tokens || 0
    const completionTokens = usage.completion_tokens || 0
    const totalTokens = usage.total_tokens || 0

    return NextResponse.json({
      translatedText,
      targetLanguage,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens,
        model,
      },
    })
  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json(
      { error: 'Failed to translate text' },
      { status: 500 }
    )
  }
}

