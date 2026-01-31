import { NextResponse } from 'next/server'

/**
 * Test endpoint to verify OpenAI API key is valid
 * Access at: http://localhost:3000/api/test-openai
 */
export async function GET() {
  const apiKey = (process.env.OPEN_KEY || '').trim()
  const apiBaseUrl = process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1'
  
  if (!apiKey) {
    return NextResponse.json({
      success: false,
      error: 'API key not loaded',
      message: 'OPEN_KEY is not set in .env.local'
    }, { status: 500 })
  }
  
  try {
    // Test the API key by calling OpenAI's models endpoint
    const response = await fetch(`${apiBaseUrl}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      let errorDetails: any = {}
      try {
        errorDetails = JSON.parse(errorText)
      } catch {
        errorDetails = { message: errorText }
      }
      
      return NextResponse.json({
        success: false,
        error: `OpenAI API rejected the key (${response.status})`,
        openaiError: errorDetails.error || errorDetails,
        status: response.status,
        statusText: response.statusText,
        message: `Your API key is being rejected by OpenAI. Check: https://platform.openai.com/api-keys`
      }, { status: 200 }) // Return 200 so we can see the error details
    }
    
    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      message: '✅ API key is valid and working!',
      apiKeyInfo: {
        prefix: apiKey.substring(0, 10) + '...',
        length: apiKey.length,
        startsWithSk: apiKey.startsWith('sk-')
      },
      openaiResponse: {
        hasModels: !!data.data,
        modelCount: data.data?.length || 0
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to test API key',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

