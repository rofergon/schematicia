import { type FormEvent, useState } from 'react'

interface MessageComposerProps {
  disabled?: boolean
  placeholder?: string
  onSend: (message: string) => void
}

export function MessageComposer({ disabled, placeholder, onSend }: MessageComposerProps) {
  const [value, setValue] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!value.trim()) {
      return
    }

    onSend(value.trim())
    setValue('')
  }

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <textarea
        className="composer__input"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder ?? 'Describe el circuito que necesitas...'}
        rows={4}
        disabled={disabled}
      />
      <div className="composer__actions">
        <button type="submit" className="button" disabled={disabled || value.trim().length === 0}>
          Generar esquema
        </button>
      </div>
    </form>
  )
}
