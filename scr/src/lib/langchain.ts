import type { ChatRole } from '../types/chat'

export interface PromptMessage {
  role: ChatRole
  content: string
}

type TemplateInput = Array<[ChatRole, string]>

function interpolate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    if (key in variables) {
      return variables[key]
    }

    return `{${key}}`
  })
}

export class ChatPromptTemplate {
  private readonly templates: TemplateInput

  private constructor(templates: TemplateInput) {
    this.templates = templates
  }

  static fromMessages(messages: TemplateInput) {
    return new ChatPromptTemplate(messages)
  }

  format(variables: Record<string, string>): PromptMessage[] {
    return this.templates.map(([role, template]) => ({
      role,
      content: interpolate(template, variables),
    }))
  }
}

interface StructuredParserSpec<T> {
  instructions: string
  validate: (input: unknown) => T
}

export class StructuredOutputParser<T> {
  private readonly spec: StructuredParserSpec<T>

  constructor(spec: StructuredParserSpec<T>) {
    this.spec = spec
  }

  static fromSpec<T>(spec: StructuredParserSpec<T>) {
    return new StructuredOutputParser(spec)
  }

  getFormatInstructions(): string {
    return this.spec.instructions
  }

  parse(text: string): T {
    // Eliminar delimitadores de bloque de código Markdown si existen
    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim()
    try {
      const data = JSON.parse(cleaned)
      return this.spec.validate(data)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`No se pudo interpretar la respuesta del modelo: ${error.message}`)
      }

      throw new Error('No se pudo interpretar la respuesta del modelo.')
    }
  }
}

interface OpenAIMessage {
  role: ChatRole
  content: Array<{ type: 'input_text'; text: string }>
}

interface ChatOpenAIOptions {
  apiKey: string
  model: string
  temperature?: number
  maxRetries?: number
}

interface OpenAIResponseContent {
  type: string
  text?: string
  [key: string]: unknown
}

interface OpenAIResponseChoice {
  message?: {
    content?: OpenAIResponseContent[]
  }
  content?: OpenAIResponseContent[]
  text?: string
}

interface OpenAIResponseBody {
  output_text?: string
  output?: OpenAIResponseChoice[]
  choices?: OpenAIResponseChoice[]
  error?: {
    message?: string
  }
}

export class ChatOpenAI {
  private readonly apiKey: string
  private readonly model: string
  private readonly temperature: number
  private readonly maxRetries: number

  constructor(options: ChatOpenAIOptions) {
    this.apiKey = options.apiKey
    this.model = options.model
    this.temperature = options.temperature ?? 0.2
    this.maxRetries = options.maxRetries ?? 2
  }

  async invoke(messages: PromptMessage[]): Promise<string> {
    const payload = {
      model: this.model,
      temperature: this.temperature,
      input: messages.map<OpenAIMessage>((message) => ({
        role: message.role,
        content: [{ type: 'input_text', text: message.content }],
      })),
    }

    let attempt = 0
    let lastError: unknown

    while (attempt <= this.maxRetries) {
      try {
        const response = await fetch('https://api.openai.com/v1/responses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(payload),
        })

        const data: OpenAIResponseBody = await response.json()
        // DEBUG: Mostrar la respuesta cruda de la API
        console.log('[ChatOpenAI] Respuesta cruda de la API:', JSON.stringify(data, null, 2))

        if (!response.ok) {
          const errorMessage = data?.error?.message ?? 'Respuesta no válida del modelo.'
          throw new Error(errorMessage)
        }

        if (typeof data.output_text === 'string') {
          return data.output_text.trim()
        }

        const text = extractTextFromResponse(data)
        if (text) {
          return text
        }

        throw new Error('La respuesta del modelo no contenía texto interpretable.')
      } catch (error) {
        lastError = error
        attempt += 1
        if (attempt > this.maxRetries) {
          if (error instanceof Error) {
            throw error
          }

          throw new Error('No fue posible obtener una respuesta del modelo.')
        }
      }
    }

    if (lastError instanceof Error) {
      throw lastError
    }

    throw new Error('No fue posible obtener una respuesta del modelo.')
  }
}

function extractTextFromResponse(data: OpenAIResponseBody): string | null {
  if (!data) {
    return null
  }

  const output = Array.isArray(data.output) ? data.output : data.choices
  if (!Array.isArray(output)) {
    return null
  }

  for (const item of output) {
    if (item?.message?.content) {
      const segments = item.message.content
      if (Array.isArray(segments)) {
        const textSegment = segments.find((segment) => segment?.type === 'output_text' || segment?.type === 'text')
        if (textSegment && typeof textSegment.text === 'string') {
          return textSegment.text.trim()
        }
      }
    }

    if (Array.isArray(item?.content)) {
      const textSegment = item.content.find((segment) => segment?.type === 'output_text' || segment?.type === 'text')
      if (textSegment && typeof textSegment.text === 'string') {
        return textSegment.text.trim()
      }
    }

    if (typeof item?.text === 'string') {
      return item.text.trim()
    }
  }

  return null
}
