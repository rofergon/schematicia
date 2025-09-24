import type { ChatMessage } from '../types/chat'
import type { CircuitDesignResponse, CircuitPlan } from '../types/circuit'
import { formatHistory } from './chat'
import { ChatOpenAI, ChatPromptTemplate, StructuredOutputParser } from './langchain'

const parser = StructuredOutputParser.fromSpec<CircuitDesignResponse>({
  instructions:
    'Devuelve un objeto JSON con la forma { "response": string, "circuit": { "title": string, "summary": string, "components": Array<Component>, "connections": Array<Connection>, "notes": string[], "assumptions": string[], "warnings": string[] } }. Cada Component debe tener id, label, type y opcionalmente description, pins, position (con x e y numéricos). Cada Connection requiere from y to que coincidan con ids de componentes y puede incluir label, description e id.',
  validate: validateCircuitDesign,
})

const prompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `Eres Schematicia, una ingeniera electrónica experta. Tu tarea es interpretar instrucciones del usuario para diseñar circuitos
electrónicos claros y didácticos. Siempre devuelves información estructurada en formato JSON siguiendo estrictamente las instrucciones de formato proporcionadas.

- Prioriza la claridad pedagógica, explica cómo funciona el circuito.
- Antes de generar una respuesta, valida que todas las referencias cruzadas (componentes y conexiones) coinciden.
- Propón valores realistas, orientados a prototipos en protoboard o PCBs sencillas.
- Cuando no puedas atender la solicitud, informa el motivo y sugiere alternativas seguras.

Incluye recomendaciones de pruebas y advertencias si el diseño involucra altos voltajes o corrientes elevadas.
{format_instructions}`,
  ],
  [
    'user',
    `Contexto previo:
{history}

Nueva petición:
{input}`,
  ],
])

interface GenerateCircuitOptions {
  apiKey: string
  model: string
  temperature: number
  userInput: string
  history: ChatMessage[]
}

export async function generateCircuitDesign(options: GenerateCircuitOptions): Promise<CircuitDesignResponse> {
  const { apiKey, model, temperature, userInput, history } = options

  if (!apiKey) {
    throw new Error('Debes proporcionar una API key de OpenAI para generar diseños.')
  }

  const llm = new ChatOpenAI({
    apiKey,
    model,
    temperature,
    maxRetries: 2,
  })

  const historyText = formatHistory(history)

  const messages = prompt.format({
    input: userInput,
    history: historyText,
    format_instructions: parser.getFormatInstructions(),
  })

  const rawResponse = await llm.invoke(messages)
  return parser.parse(rawResponse)
}

function validateCircuitDesign(input: unknown): CircuitDesignResponse {
  if (typeof input !== 'object' || input === null) {
    throw new Error('El modelo debe devolver un objeto JSON válido.')
  }

  const data = input as Record<string, unknown>
  if (typeof data.response !== 'string') {
    throw new Error('El campo "response" debe ser una cadena de texto.')
  }

  const circuit = data.circuit
  if (typeof circuit !== 'object' || circuit === null) {
    throw new Error('El campo "circuit" debe ser un objeto.')
  }

  const parsedCircuit = validateCircuit(circuit)

  return {
    response: data.response,
    circuit: parsedCircuit,
  }
}

function validateCircuit(input: unknown): CircuitPlan {
  if (typeof input !== 'object' || input === null) {
    return {
      title: 'Esquema propuesto',
      summary: 'Sin resumen disponible.',
      components: [],
      connections: [],
      notes: [],
      assumptions: [],
      warnings: [],
    }
  }

  const circuitData = input as Record<string, unknown>

  const title = typeof circuitData.title === 'string' ? circuitData.title : 'Esquema propuesto'
  const summary = typeof circuitData.summary === 'string' ? circuitData.summary : 'Sin resumen disponible.'

  const components = Array.isArray(circuitData.components)
    ? circuitData.components
        .map((component: unknown) => validateComponent(component))
        .filter(
          (component: ReturnType<typeof validateComponent>): component is NonNullable<ReturnType<typeof validateComponent>> =>
            component !== null,
        )
    : []

  const connections = Array.isArray(circuitData.connections)
    ? circuitData.connections
        .map((connection: unknown) => validateConnection(connection, components))
        .filter(
          (connection: ReturnType<typeof validateConnection>): connection is NonNullable<ReturnType<typeof validateConnection>> =>
            connection !== null,
        )
    : []

  return {
    title,
    summary,
    components,
    connections,
    notes: Array.isArray(circuitData.notes)
      ? circuitData.notes.filter((value: unknown): value is string => typeof value === 'string')
      : [],
    assumptions: Array.isArray(circuitData.assumptions)
      ? circuitData.assumptions.filter((value: unknown): value is string => typeof value === 'string')
      : [],
    warnings: Array.isArray(circuitData.warnings)
      ? circuitData.warnings.filter((value: unknown): value is string => typeof value === 'string')
      : [],
  }
}

function validateComponent(input: unknown): CircuitPlan['components'][number] | null {
  if (typeof input !== 'object' || input === null) {
    return null
  }

  const component = input as Record<string, unknown>

  if (typeof component.id !== 'string' || typeof component.label !== 'string' || typeof component.type !== 'string') {
    return null
  }

  return {
    id: component.id,
    label: component.label,
    type: component.type,
    description: typeof component.description === 'string' ? component.description : undefined,
    pins: typeof component.pins === 'number' ? component.pins : undefined,
    position:
      typeof component.position === 'object' && component.position !== null
        ? validatePosition(component.position as Record<string, unknown>)
        : undefined,
  }
}

function validatePosition(
  position: Record<string, unknown>,
): CircuitPlan['components'][number]['position'] {
  const x = typeof position.x === 'number' ? position.x : undefined
  const y = typeof position.y === 'number' ? position.y : undefined

  if (typeof x === 'number' && typeof y === 'number') {
    return { x, y }
  }

  return undefined
}

function validateConnection(
  connection: unknown,
  components: CircuitPlan['components'],
): CircuitPlan['connections'][number] | null {
  if (typeof connection !== 'object' || connection === null) {
    return null
  }

  const data = connection as Record<string, unknown>

  if (typeof data.from !== 'string' || typeof data.to !== 'string') {
    return null
  }

  const componentIds = new Set(components.map((component) => component.id))
  if (!componentIds.has(data.from) || !componentIds.has(data.to)) {
    return null
  }

  return {
    id: typeof data.id === 'string' ? data.id : undefined,
    from: data.from,
    to: data.to,
    label: typeof data.label === 'string' ? data.label : undefined,
    description: typeof data.description === 'string' ? data.description : undefined,
  }
}
