import type { CircuitPlan } from '../types/circuit'
import { SchematicCanvas } from './SchematicCanvas'

interface SchematicDetailsProps {
  plan: CircuitPlan | null
}

export function SchematicDetails({ plan }: SchematicDetailsProps) {
  if (!plan) {
    return (
      <div className="schematic-placeholder">
        <h2>Visualización del esquema</h2>
        <p>
          Describe el circuito que quieres construir. El asistente generará una propuesta con componentes, conexiones y notas para
          ayudarte a prototipar.
        </p>
        <ul>
          <li>Indica el objetivo (por ejemplo: fuente regulada, sensor con microcontrolador, etapa de potencia, etc.).</li>
          <li>Comparte restricciones importantes: voltaje de entrada, disponibilidad de componentes, o espacio físico.</li>
          <li>Solicita optimizaciones como consumo, costo o facilidad de montaje.</li>
        </ul>
      </div>
    )
  }

  return (
    <div className="schematic-details">
      <div className="schematic-details__intro">
        <h2>{plan.title}</h2>
        <p>{plan.summary}</p>
      </div>

      <SchematicCanvas plan={plan} />

      <section className="schematic-details__section">
        <h3>Componentes</h3>
        <ul className="schematic-list">
          {plan.components.map((component) => (
            <li key={component.id} className="schematic-list__item">
              <div>
                <strong>{component.label}</strong>
                <span className="schematic-list__type">{component.type}</span>
              </div>
              {component.description ? <p className="schematic-list__description">{component.description}</p> : null}
            </li>
          ))}
        </ul>
      </section>

      {plan.connections.length > 0 ? (
        <section className="schematic-details__section">
          <h3>Conexiones</h3>
          <ul className="schematic-list">
            {plan.connections.map((connection, index) => (
              <li key={connection.id ?? `${connection.from}-${connection.to}-${index}`} className="schematic-list__item">
                <div>
                  <strong>{connection.from}</strong> → <strong>{connection.to}</strong>
                </div>
                {connection.label ? <span className="schematic-list__type">{connection.label}</span> : null}
                {connection.description ? (
                  <p className="schematic-list__description">{connection.description}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {plan.notes.length > 0 ? (
        <section className="schematic-details__section">
          <h3>Notas de implementación</h3>
          <ul>
            {plan.notes.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {plan.assumptions.length > 0 ? (
        <section className="schematic-details__section">
          <h3>Suposiciones</h3>
          <ul>
            {plan.assumptions.map((assumption, index) => (
              <li key={index}>{assumption}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {plan.warnings.length > 0 ? (
        <section className="schematic-details__section schematic-details__section--warning">
          <h3>Advertencias</h3>
          <ul>
            {plan.warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="schematic-details__section schematic-details__section--info">
        <h3>Recursos visuales</h3>
        <p>
          Para enriquecer la iconografía de tus diagramas puedes apoyarte en colecciones públicas como{' '}
          <a
            className="schematic-details__link"
            href="https://tabler-icons.io/i/circuit-resistor"
            target="_blank"
            rel="noreferrer"
          >
            Tabler Icons (paquete Circuit)
          </a>
          , que ofrece símbolos vectoriales de electrónica bajo licencia MIT, listos para incorporar en documentación o
          presentaciones.
        </p>
      </section>

      <section className="schematic-details__section">
        <h3>JSON sugerido</h3>
        <pre className="schematic-details__json">{JSON.stringify(plan, null, 2)}</pre>
      </section>
    </div>
  )
}
