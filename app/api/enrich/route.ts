import { NextRequest, NextResponse } from 'next/server'

/**
 * AI Enrichment API route
 * 
 * Desktop-first: All AI calls go through server routes to keep API keys secure.
 * Structured output preferred over free text.
 * Automatic mode detection: Classifies transcript context and uses appropriate prompts.
 * 
 * Expected input: { transcript: string, format?: 'markdown' | 'json' | 'plain' }
 * Expected output: { output: string, format: string, mode: string }
 * 
 * Format options:
 * - 'markdown': Structured Markdown with headings, lists, formatting
 * - 'json': Structured JSON (e.g., { summary, actionItems, topics })
 * - 'plain': Plain text (default, fallback)
 * 
 * Auto-detected modes:
 * - 'meeting': Meeting notes, discussions, decisions
 * - 'development': Code discussions, technical notes, programming
 * - 'journal': Personal thoughts, reflections, diary entries
 * - 'brain-dump': Quick notes, ideas, unstructured thoughts
 * - 'task-capture': Todo items, tasks, reminders
 * - 'planning': Roadmaps, goals, multi-step thinking, strategic planning
 * - 'research': Explanations, summaries, learning notes, "understand this" voice notes
 * - 'sales': Sales/client calls, objections, needs analysis, follow-up drafts
 * - 'creative-writing': Creative writing, stories, narratives, fiction
 * - 'therapy': Therapy-style reflection, emotional processing, self-analysis
 * - 'command': Commands, automation scripts, instructions, technical commands
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transcript, format = 'markdown', language } = body

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      )
    }

    if (!['markdown', 'json', 'plain'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be markdown, json, or plain' },
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

    // Step 1: Classify the transcript to detect mode (works with any language)
    const mode = await classifyTranscript(transcript, apiBaseUrl, apiKey, model, language)
    
    // Step 2: Build context-specific prompts based on detected mode
    // Prompts are language-aware and will respond in the same language as the transcript
    let systemPrompt: string
    let userPrompt: string
    
    // Build prompts based on detected mode and format (multilingual support)
    const modePrompts = getModePrompts(mode, format, transcript, language)
    systemPrompt = modePrompts.systemPrompt
    userPrompt = modePrompts.userPrompt

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
        temperature: 0.7, // Higher temperature for more conversational, natural responses
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Enrichment API error:', response.status, errorText)
      console.error('API Base URL:', apiBaseUrl)
      console.error('Model:', model)
      console.error('Endpoint:', `${apiBaseUrl}/chat/completions`)
      
      // Try to parse error message from response
      let errorMessage = response.statusText || 'Unknown error'
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.error?.message) {
          errorMessage = errorData.error.message
        } else if (errorData.message) {
          errorMessage = errorData.message
        }
      } catch (e) {
        // If parsing fails, use the raw text or status text
        if (errorText) {
          errorMessage = errorText.substring(0, 200) // Limit length
        }
      }
      
      // Provide more helpful error messages
      if (response.status === 404) {
        errorMessage = `API endpoint not found. Please check your OPENAI_API_BASE_URL (${apiBaseUrl}). The model "${model}" might not be available.`
      } else if (response.status === 401) {
        errorMessage = 'API authentication failed. Please check your API key.'
      } else if (response.status === 400) {
        errorMessage = `Bad request: ${errorMessage}. The model "${model}" might not be supported.`
      }
      
      return NextResponse.json(
        { error: `Enrichment failed: ${errorMessage}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    let enrichedText = data.choices[0].message.content

    // Extract token usage from response
    const usage = data.usage || {}
    const promptTokens = usage.prompt_tokens || 0
    const completionTokens = usage.completion_tokens || 0
    const totalTokens = usage.total_tokens || 0

    // For JSON format, try to parse and re-stringify to ensure valid JSON
    if (format === 'json') {
      try {
        const parsed = JSON.parse(enrichedText)
        enrichedText = JSON.stringify(parsed, null, 2)
      } catch (e) {
        // If parsing fails, try to extract JSON from markdown code blocks
        const jsonMatch = enrichedText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/)
        if (jsonMatch) {
          enrichedText = JSON.stringify(JSON.parse(jsonMatch[1]), null, 2)
        }
      }
    }

    return NextResponse.json({
      output: enrichedText,
      format,
      mode,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens,
        model,
      },
    })
  } catch (error) {
    console.error('Enrichment error:', error)
    return NextResponse.json(
      { error: 'Failed to enrich transcript' },
      { status: 500 }
    )
  }
}

/**
 * Classify transcript to detect context mode
 * Supports all languages - classification works regardless of transcript language
 */
async function classifyTranscript(
  transcript: string,
  apiBaseUrl: string,
  apiKey: string,
  model: string,
  language?: string | null
): Promise<string> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`
  }

  // Multilingual classification prompt - works with any language
  const classificationPrompt = `Classify this transcript into one of these categories (respond in English):
- "meeting": Meeting notes, team discussions, decisions, planning sessions
- "development": Code discussions, technical notes, programming, debugging
- "journal": Personal thoughts, reflections, diary entries, daily logs
- "brain-dump": Quick notes, ideas, unstructured thoughts, stream of consciousness
- "task-capture": Todo items, tasks, reminders, action items
- "planning": Roadmaps, goals, strategic planning, multi-step thinking, project planning
- "research": Explanations, summaries, learning notes, "understand this" voice notes, educational content
- "sales": Sales calls, client calls, objections, needs analysis, follow-up drafts, customer interactions
- "creative-writing": Creative writing, stories, narratives, fiction, poetry, creative content
- "therapy": Therapy-style reflection, emotional processing, self-analysis, therapeutic notes
- "command": Commands, automation scripts, instructions, technical commands, system operations

The transcript may be in any language. Classify based on content type, not language.
Respond with ONLY the category name, nothing else.

Transcript: ${transcript.substring(0, 500)}` // Use first 500 chars for classification

  try {
    const systemPrompt = `You are a multilingual classification assistant. Classify transcripts in any language. Respond with only the category name in English: meeting, development, journal, brain-dump, task-capture, planning, research, sales, creative-writing, therapy, or command.`

    const response = await fetch(`${apiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [
          { 
            role: 'system', 
            content: systemPrompt
          },
          { role: 'user', content: classificationPrompt },
        ],
        temperature: 0.1, // Very low temperature for deterministic classification
        max_tokens: 20,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.warn('Classification failed:', response.status, errorText)
      console.warn('API Base URL:', apiBaseUrl)
      console.warn('Model:', model)
      console.warn('Using default mode: brain-dump')
      return 'brain-dump' // Default fallback
    }

    const data = await response.json()
    const classification = data.choices[0].message.content.trim().toLowerCase()
    
    // Validate classification
    const validModes = [
      'meeting', 'development', 'journal', 'brain-dump', 'task-capture',
      'planning', 'research', 'sales', 'creative-writing', 'therapy', 'command'
    ]
    if (validModes.includes(classification)) {
      return classification
    }
    
    return 'brain-dump' // Default fallback
  } catch (error) {
    console.error('Classification error:', error)
    return 'brain-dump' // Default fallback
  }
}

/**
 * Get mode-specific prompts based on detected context
 * Supports all languages - responds in the same language as the transcript
 */
function getModePrompts(
  mode: string,
  format: string,
  transcript: string,
  language?: string | null
): { systemPrompt: string; userPrompt: string } {
  // Language-aware system prompts - will respond in the transcript's language
  const languageNote = language 
    ? ` Respond in the same language as the transcript (detected: ${language}).`
    : ' Respond in the same language as the transcript.'

  const modeConfig: Record<string, { system: string; user: (t: string, langNote: string) => string }> = {
    meeting: {
      system: `You are a friendly, conversational meeting assistant. Help organize meeting transcripts into clear, structured notes. Be natural and helpful, like you're chatting with a colleague.${languageNote}`,
      user: (t, langNote) => `Hey! I just recorded a meeting. Can you help me organize this into clear notes? Include:
- Meeting title/context
- Key discussion points
- Decisions made
- Action items with owners (if mentioned)
- Next steps

Transcript: ${t}`
    },
    development: {
      system: `You are a friendly, conversational tech assistant. Help organize technical discussions and code notes into clear documentation. Be approachable and helpful.${languageNote}`,
      user: (t, langNote) => `I recorded some technical notes. Can you help me organize this into clear documentation? Include:
- Technical context
- Code snippets or technical details (if mentioned)
- Solutions or approaches discussed
- Technical decisions
- Implementation notes

Transcript: ${t}`
    },
    journal: {
      system: `You are a warm, understanding journaling companion. Help organize personal thoughts and reflections into meaningful journal entries. Be empathetic and supportive.${languageNote}`,
      user: (t, langNote) => `I just recorded some thoughts. Can you help me organize this into a journal entry? Keep my personal voice while making it clear and organized. Include:
- Date/context (if mentioned)
- Main thoughts or reflections
- Key insights
- Personal observations

Transcript: ${t}`
    },
    'brain-dump': {
      system: `You are a friendly, creative thinking partner. Help organize scattered thoughts and ideas into clear, useful notes. Be encouraging and helpful.${languageNote}`,
      user: (t, langNote) => `I just did a brain dump of ideas. Can you help me organize this? Extract and organize:
- Main ideas
- Key points
- Related thoughts grouped together
- Any actionable items

Transcript: ${t}`
    },
    'task-capture': {
      system: `You are a helpful, organized task assistant. Help turn voice notes into clear, actionable task lists. Be practical and friendly.${languageNote}`,
      user: (t, langNote) => `I recorded some tasks. Can you help me organize this into a clear task list? Include:
- Clear task items
- Priorities (if mentioned)
- Due dates or timeframes (if mentioned)
- Context or notes for each task

Transcript: ${t}`
    },
    planning: {
      system: `You are a friendly, strategic planning partner. Help organize planning notes, roadmaps, and goals into clear strategic documents. Be encouraging and practical.${languageNote}`,
      user: (t, langNote) => `I recorded some planning thoughts. Can you help me organize this into a clear strategic plan? Include:
- Goals and objectives
- Roadmap or timeline (if mentioned)
- Key milestones
- Dependencies or prerequisites
- Success criteria
- Multi-step breakdown (if applicable)

Transcript: ${t}`
    },
    research: {
      system: `You are a helpful, curious learning companion. Help organize research notes, explanations, and learning materials into clear educational content. Be engaging and supportive.${languageNote}`,
      user: (t, langNote) => `I recorded some research or learning notes. Can you help me organize this into clear educational content? Include:
- Main topic or concept
- Key explanations or definitions
- Important points or takeaways
- Related concepts or connections
- Summary or conclusion
- Questions for further exploration (if applicable)

Transcript: ${t}`
    },
    sales: {
      system: `You are a helpful, professional sales assistant. Help organize sales and client call notes into clear sales documentation. Be practical and focused.${languageNote}`,
      user: (t, langNote) => `I recorded a sales or client call. Can you help me organize this into clear sales notes? Include:
- Client/company information
- Needs and pain points identified
- Objections raised and responses
- Proposed solutions or products
- Next steps and follow-up actions
- Deal status or timeline

Transcript: ${t}`
    },
    'creative-writing': {
      system: `You are an inspiring, creative writing partner. Help polish creative writing, stories, and narratives while preserving the author's unique voice. Be encouraging and artistic.${languageNote}`,
      user: (t, langNote) => `I recorded some creative writing. Can you help me polish this while keeping my creative voice? Include:
- Story structure or narrative flow
- Character development (if mentioned)
- Setting and atmosphere
- Dialogue formatting (if applicable)
- Literary devices or techniques used
- Suggestions for improvement (optional)

Transcript: ${t}`
    },
    therapy: {
      system: `You are a warm, empathetic therapeutic companion. Help organize therapy-style reflections and emotional processing into meaningful therapeutic notes. Be gentle, supportive, and understanding.${languageNote}`,
      user: (t, langNote) => `I recorded some personal reflections. Can you help me organize this thoughtfully? Be sensitive and supportive. Include:
- Emotional themes or patterns
- Key insights or realizations
- Triggers or situations discussed
- Coping strategies or tools mentioned
- Progress or growth observed
- Action items for self-care (if applicable)

Transcript: ${t}`
    },
    command: {
      system: `You are a helpful, precise technical assistant. Help organize commands, automation scripts, and technical instructions into clear technical documentation. Be accurate and practical.${languageNote}`,
      user: (t, langNote) => `I recorded some technical commands or instructions. Can you help me organize this into clear technical documentation? Include:
- Command or script structure
- Parameters and options
- Expected behavior or output
- Prerequisites or dependencies
- Error handling (if mentioned)
- Usage examples or documentation

Transcript: ${t}`
    }
  }

  const config = modeConfig[mode] || modeConfig['brain-dump']
  let systemPrompt = config.system
  let userPrompt = config.user(transcript, languageNote)

  // Adjust for format (maintain language awareness)
  if (format === 'json') {
    systemPrompt = `You are a multilingual assistant that extracts structured information. Always respond with valid JSON only, no markdown formatting.${languageNote}`
    if (mode === 'meeting') {
      userPrompt = `Extract structured information from this meeting transcript as JSON. Use the same language as the transcript for text fields:
{
  "title": "Meeting title or topic",
  "attendees": ["person1", "person2"],
  "summary": "Brief summary",
  "decisions": ["decision1", "decision2"],
  "actionItems": [{"task": "item", "owner": "person", "due": "date"}],
  "topics": ["topic1", "topic2"]
}

Transcript: ${transcript}`
    } else if (mode === 'task-capture') {
      userPrompt = `Extract tasks from this transcript as JSON. Use the same language as the transcript:
{
  "tasks": [{"task": "description", "priority": "high/medium/low", "due": "date", "notes": "context"}],
  "summary": "Brief summary"
}

Transcript: ${transcript}`
    } else if (mode === 'planning') {
      userPrompt = `Extract planning information from this transcript as JSON. Use the same language as the transcript:
{
  "goals": ["goal1", "goal2"],
  "roadmap": [{"milestone": "description", "timeline": "date", "dependencies": ["dep1"]}],
  "steps": ["step1", "step2"],
  "successCriteria": ["criterion1", "criterion2"],
  "summary": "Brief summary"
}

Transcript: ${transcript}`
    } else if (mode === 'research') {
      userPrompt = `Extract research information from this transcript as JSON. Use the same language as the transcript:
{
  "topic": "Main topic",
  "keyConcepts": ["concept1", "concept2"],
  "explanations": ["explanation1", "explanation2"],
  "takeaways": ["takeaway1", "takeaway2"],
  "relatedTopics": ["topic1", "topic2"],
  "summary": "Brief summary"
}

Transcript: ${transcript}`
    } else if (mode === 'sales') {
      userPrompt = `Extract sales information from this transcript as JSON. Use the same language as the transcript:
{
  "client": "Client name or company",
  "needs": ["need1", "need2"],
  "painPoints": ["point1", "point2"],
  "objections": [{"objection": "text", "response": "text"}],
  "solutions": ["solution1", "solution2"],
  "nextSteps": ["step1", "step2"],
  "dealStatus": "status",
  "summary": "Brief summary"
}

Transcript: ${transcript}`
    } else if (mode === 'therapy') {
      userPrompt = `Extract therapeutic reflection information from this transcript as JSON. Use the same language as the transcript:
{
  "emotionalThemes": ["theme1", "theme2"],
  "insights": ["insight1", "insight2"],
  "triggers": ["trigger1", "trigger2"],
  "copingStrategies": ["strategy1", "strategy2"],
  "progress": "Progress notes",
  "selfCareActions": ["action1", "action2"],
  "summary": "Brief summary"
}

Transcript: ${transcript}`
    } else if (mode === 'command') {
      userPrompt = `Extract command/automation information from this transcript as JSON. Use the same language as the transcript:
{
  "command": "Command or script",
  "parameters": ["param1", "param2"],
  "description": "What it does",
  "prerequisites": ["req1", "req2"],
  "expectedOutput": "Expected result",
  "examples": ["example1", "example2"],
  "summary": "Brief summary"
}

Transcript: ${transcript}`
    } else {
      userPrompt = `Extract structured information from this transcript as JSON. Use the same language as the transcript:
{
  "summary": "Brief summary",
  "keyPoints": ["point1", "point2"],
  "topics": ["topic1", "topic2"],
  "actionItems": ["item1", "item2"]
}

Transcript: ${transcript}`
    }
  } else if (format === 'plain') {
    systemPrompt = `You are a multilingual assistant that formats transcripts into clear, readable plain text.${languageNote}`
    userPrompt = `Format this transcript into clear, readable plain text with proper paragraphs and structure. Use the same language as the transcript.

Transcript: ${transcript}`
  }

  return { systemPrompt, userPrompt }
}

