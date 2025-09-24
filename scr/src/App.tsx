import { useMemo, useState } from 'react'

import { MessageComposer } from './components/MessageComposer'
import { MessageList } from './components/MessageList'
import { SettingsPanel } from './components/SettingsPanel'
import { SchematicDetails } from './components/SchematicDetails'
import { useLocalStorage } from './hooks/useLocalStorage'
import { generateCircuitDesign } from './lib/circuitDesigner'
import type { ChatMessage } from './types/chat'
import type { CircuitPlan } from './types/circuit'
import './App.css'

const EXAMPLE_CIRCUIT_PLAN: CircuitPlan = {
  title: 'Circuito de ejemplo: LED con transistor y pulsador',
  summary:
    'Al presionar el pulsador SW1 se aplica 5 V a través de R2 a la base del transistor Q1. El transistor conduce y permite que la corriente fluya desde la fuente de 5 V por R1 y el LED, encendiéndolo. R3 mantiene la base descargada cuando el pulsador está abierto.',
  components: [
    {
      id: 'vcc',
      label: 'Fuente 5 V',
      type: 'Fuente DC',
      description: 'Alimentación principal del circuito para el LED y el transistor.',
    },
    {
      id: 'r_led',
      label: 'R1 220 Ω',
      type: 'Resistencia limitadora',
      description: 'Limita la corriente que atraviesa el LED a unos 15 mA.',
    },
    {
      id: 'led',
      label: 'D1 LED rojo',
      type: 'LED',
      description: 'Indicador luminoso controlado por el transistor Q1.',
    },
    {
      id: 'q1',
      label: 'Q1 2N2222',
      type: 'Transistor NPN',
      description: 'Actúa como interruptor para energizar al LED cuando recibe corriente de base.',
    },
    {
      id: 'r_base',
      label: 'R2 4.7 kΩ',
      type: 'Resistencia de base',
      description: 'Limita la corriente de base del transistor a aproximadamente 1 mA.',
    },
    {
      id: 'sw1',
      label: 'SW1 Pulsador',
      type: 'Interruptor momentáneo',
      description: 'Aplica 5 V a la red de polarización cuando se presiona.',
    },
    {
      id: 'r_pull',
      label: 'R3 100 kΩ',
      type: 'Resistencia de pull-down',
      description: 'Mantiene la base del transistor a potencial de tierra cuando el pulsador está abierto.',
    },
    {
      id: 'gnd',
      label: 'GND',
      type: 'Referencia',
      description: 'Retorno común del circuito.',
    },
  ],
  connections: [
    {
      id: 'vcc-rled',
      from: 'vcc',
      to: 'r_led',
      label: '5 V',
      description: 'Alimentación hacia el LED a través de la resistencia limitadora.',
    },
    {
      id: 'rled-led',
      from: 'r_led',
      to: 'led',
      label: '≈15 mA',
      description: 'Corriente limitada que atraviesa el LED.',
    },
    {
      id: 'led-q1',
      from: 'led',
      to: 'q1',
      description: 'El cátodo del LED se conecta al colector del transistor.',
    },
    {
      id: 'q1-gnd',
      from: 'q1',
      to: 'gnd',
      label: 'Emisor a tierra',
      description: 'El transistor conmuta el retorno del LED hacia tierra.',
    },
    {
      id: 'vcc-sw1',
      from: 'vcc',
      to: 'sw1',
      description: 'Proporciona 5 V al pulsador.',
    },
    {
      id: 'sw1-rbase',
      from: 'sw1',
      to: 'r_base',
      description: 'Al cerrar SW1, la corriente fluye hacia la resistencia de base.',
    },
    {
      id: 'rbase-q1',
      from: 'r_base',
      to: 'q1',
      label: 'Base Q1',
      description: 'La resistencia limita la corriente que entra a la base.',
    },
    {
      id: 'rpull-q1',
      from: 'r_pull',
      to: 'q1',
      description: 'R3 mantiene la base referenciada a tierra.',
    },
    {
      id: 'rpull-gnd',
      from: 'r_pull',
      to: 'gnd',
      label: 'Pull-down',
    },
  ],
  notes: [
    'Puedes sustituir el transistor 2N2222 por cualquier NPN de propósito general (ej. BC547) ajustando los valores de resistencia.',
    'Si utilizas una fuente distinta a 5 V, recalcula el valor de R1 para mantener la corriente del LED dentro de especificación.',
  ],
  assumptions: [
    'Se asume una fuente regulada de 5 V y un LED rojo con caída aproximada de 2 V.',
    'El transistor está conectado en configuración de conmutación saturada.',
  ],
  warnings: [
    'Verifica la polaridad del LED y las conexiones del transistor antes de energizar el circuito.',
  ],
}

const INITIAL_EXAMPLE_MESSAGE =
  'Mientras tanto, te muestro un circuito de ejemplo con una fuente de 5 V, un LED y un transistor con pulsador para que veas el formato de salida.'

const INITIAL_ASSISTANT_MESSAGE = `Hola, soy Schematicia. Describe el circuito que necesitas y te ayudaré a proponer un esquema,
lista de componentes y recomendaciones para construirlo de forma segura.`

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const now = Date.now()
    return [
      {
        id: 'welcome',
        role: 'assistant',
        content: INITIAL_ASSISTANT_MESSAGE,
        createdAt: now,
      },
      {
        id: 'example',
        role: 'assistant',
        content: `${INITIAL_EXAMPLE_MESSAGE}\n\n${EXAMPLE_CIRCUIT_PLAN.summary}`,
        createdAt: now + 1,
      },
    ]
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [currentPlan, setCurrentPlan] = useState<CircuitPlan | null>(EXAMPLE_CIRCUIT_PLAN)

  const [apiKey, setApiKey] = useLocalStorage('schematicia_openai_api_key', '')
  const [model, setModel] = useLocalStorage('schematicia_openai_model', 'gpt-4o-mini')
  const [temperature, setTemperature] = useLocalStorage('schematicia_openai_temperature', 0.2)

  const canSendMessages = useMemo(() => Boolean(apiKey) && Boolean(model), [apiKey, model])

  const handleSendMessage = async (rawMessage: string) => {
    const text = rawMessage.trim()
    if (!text) {
      return
    }

    const history = [...messages]
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      createdAt: Date.now(),
    }

    setMessages([...history, userMessage])
    setIsLoading(true)
    setErrorMessage(null)

    try {
      if (!apiKey) {
        throw new Error('Agrega tu API key de OpenAI en la sección de configuración.')
      }

      if (!model) {
        throw new Error('Selecciona o escribe un modelo válido de OpenAI.')
      }

      const design = await generateCircuitDesign({
        apiKey,
        model,
        temperature: typeof temperature === 'number' ? temperature : Number(temperature) || 0.2,
        userInput: text,
        history,
      })

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: design.response,
        createdAt: Date.now(),
      }

      setMessages([...history, userMessage, assistantMessage])
      setCurrentPlan(design.circuit)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No fue posible generar el diseño. Intenta nuevamente en unos instantes.'

      setErrorMessage(message)

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `⚠️ ${message}`,
        createdAt: Date.now(),
      }

      setMessages([...history, userMessage, assistantMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1>Schematicia Studio</h1>
          <p className="app__subtitle">
            Diseña esquemas electrónicos con ayuda de un modelo de lenguaje y obtén visualizaciones rápidas para tus prototipos.
          </p>
        </div>
        <SettingsPanel
          apiKey={apiKey}
          model={model}
          temperature={typeof temperature === 'number' ? temperature : Number(temperature) || 0.2}
          onApiKeyChange={setApiKey}
          onModelChange={setModel}
          onTemperatureChange={setTemperature}
        />
      </header>

      <main className="app__content">
        <section className="panel panel--chat">
          <div className="panel__body">
            <MessageList messages={messages} isLoading={isLoading} />
          </div>
          <div className="panel__footer">
            {!canSendMessages ? (
              <div className="notice">
                <strong>Configura tu API key</strong>
                <p>Agrega una API key válida de OpenAI para conversar con el asistente.</p>
              </div>
            ) : null}
            {errorMessage ? <div className="notice notice--error">{errorMessage}</div> : null}
            <MessageComposer
              disabled={isLoading || !canSendMessages}
              onSend={handleSendMessage}
              placeholder="Ejemplo: Diseña un regulador de 5V con entrada de 12V para alimentar un microcontrolador."
            />
          </div>
        </section>

        <section className="panel panel--schematic">
          <div className="panel__body panel__body--scroll">
            <SchematicDetails plan={currentPlan} />
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
