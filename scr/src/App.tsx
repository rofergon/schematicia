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

const INITIAL_ASSISTANT_MESSAGE = `Hola, soy Schematicia. Describe el circuito que necesitas y te ayudaré a proponer un esquema,
lista de componentes y recomendaciones para construirlo de forma segura.`

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: INITIAL_ASSISTANT_MESSAGE,
      createdAt: Date.now(),
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [currentPlan, setCurrentPlan] = useState<CircuitPlan | null>(null)

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
