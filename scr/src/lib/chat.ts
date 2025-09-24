import type { ChatMessage } from '../types/chat'

export function formatHistory(messages: ChatMessage[]): string {
  if (messages.length === 0) {
    return 'No hay conversación previa.'
  }

  return messages
    .map((message) => {
      const speaker = message.role === 'user' ? 'Usuario' : message.role === 'assistant' ? 'Asistente' : 'Sistema'
      return `${speaker}: ${message.content}`
    })
    .join('\n')
}
