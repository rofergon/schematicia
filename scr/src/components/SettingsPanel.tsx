interface SettingsPanelProps {
  apiKey: string
  model: string
  temperature: number
  onApiKeyChange: (value: string) => void
  onModelChange: (value: string) => void
  onTemperatureChange: (value: number) => void
}

const COMMON_MODELS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o mini (recomendado)' },
  { value: 'gpt-4.1-mini', label: 'GPT-4.1 mini' },
  { value: 'o4-mini', label: 'o4-mini' },
]

export function SettingsPanel({
  apiKey,
  model,
  temperature,
  onApiKeyChange,
  onModelChange,
  onTemperatureChange,
}: SettingsPanelProps) {
  const isCustomModel = !COMMON_MODELS.some((option) => option.value === model) || model === ''
  const selectValue = isCustomModel ? 'custom' : model

  return (
    <details className="settings">
      <summary>Configuración</summary>
      <div className="settings__content">
        <label className="field">
          <span className="field__label">OpenAI API key</span>
          <input
            type="password"
            className="field__input"
            value={apiKey}
            onChange={(event) => onApiKeyChange(event.target.value)}
            placeholder="sk-..."
            autoComplete="off"
          />
        </label>

        <label className="field">
          <span className="field__label">Modelo</span>
          <select
            className="field__input"
            value={selectValue}
            onChange={(event) => {
              if (event.target.value === 'custom') {
                onModelChange('')
                return
              }

              onModelChange(event.target.value)
            }}
          >
            {COMMON_MODELS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
            <option value="custom">Personalizado</option>
          </select>
          {isCustomModel ? (
            <input
              className="field__input"
              type="text"
              placeholder="Nombre del modelo"
              value={model}
              onChange={(event) => onModelChange(event.target.value)}
            />
          ) : null}
        </label>

        <label className="field">
          <span className="field__label">Creatividad (temperatura)</span>
          <input
            className="field__input"
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={temperature}
            onChange={(event) => onTemperatureChange(Number(event.target.value))}
          />
          <span className="field__help">Valor actual: {temperature.toFixed(1)}</span>
        </label>

        <p className="settings__hint">
          La clave se guarda únicamente en tu navegador mediante <code>localStorage</code>. No se envía a ningún servidor.
        </p>
      </div>
    </details>
  )
}
