import { useEffect, useRef } from 'react'

import type { ChatMessage } from '../types/chat'

interface MessageListProps {
  messages: ChatMessage[]
  isLoading: boolean
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  return (
    <div className="message-list">
      {messages.map((message) => {
        const author = message.role === 'user' ? 'Tú' : message.role === 'assistant' ? 'Schematicia' : 'Sistema'

        return (
          <article key={message.id} className={`message message--${message.role}`}>
            <header className="message__meta">
              <span className="message__author">{author}</span>
            </header>
            <p className="message__content">{message.content}</p>
          </article>
        )
      })}

      {isLoading ? (
        <article className="message message--assistant message--loading">
          <header className="message__meta">
            <span className="message__author">Schematicia</span>
          </header>
          <div className="message__content">
            <span className="loader-dot" />
            <span className="loader-dot" />
            <span className="loader-dot" />
          </div>
        </article>
      ) : null}

      <div ref={endRef} />
    </div>
  )
}
