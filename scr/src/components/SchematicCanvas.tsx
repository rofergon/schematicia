import { useMemo } from 'react'

import type { CircuitPlan } from '../types/circuit'

const NODE_WIDTH = 160
const NODE_HEIGHT = 64
const HORIZONTAL_PADDING = 120
const VERTICAL_SPACING = 120

interface SchematicCanvasProps {
  plan: CircuitPlan
}

export function SchematicCanvas({ plan }: SchematicCanvasProps) {
  const layout = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>()

    plan.components.forEach((component, index) => {
      if (component.position) {
        positions.set(component.id, component.position)
        return
      }

      const column = index % 2
      const row = Math.floor(index / 2)
      const x = HORIZONTAL_PADDING + column * (NODE_WIDTH + 120)
      const y = 120 + row * VERTICAL_SPACING
      positions.set(component.id, { x, y })
    })

    const width = plan.components.length > 1 ? HORIZONTAL_PADDING * 2 + NODE_WIDTH * 2 + 120 : 520
    const height = Math.max(440, 200 + Math.ceil(plan.components.length / 2) * VERTICAL_SPACING)

    return { positions, width, height }
  }, [plan.components])

  return (
    <div className="schematic-canvas">
      <svg viewBox={`0 0 ${layout.width} ${layout.height}`} role="img" aria-label="Esquema del circuito propuesto">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
          </marker>
        </defs>

        {plan.connections.map((connection, index) => {
          const from = layout.positions.get(connection.from)
          const to = layout.positions.get(connection.to)
          if (!from || !to) {
            return null
          }

          const midX = (from.x + to.x) / 2
          const midY = (from.y + to.y) / 2
          const lineId = connection.id ?? `${connection.from}-${connection.to}-${index}`

          return (
            <g key={lineId} className="schematic-connection">
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                markerEnd="url(#arrow)"
                className="schematic-connection__line"
              />
              {connection.label ? (
                <text x={midX} y={midY - 6} className="schematic-connection__label">
                  {connection.label}
                </text>
              ) : null}
              {connection.description ? (
                <text x={midX} y={midY + 12} className="schematic-connection__description">
                  {connection.description}
                </text>
              ) : null}
            </g>
          )
        })}

        {plan.components.map((component) => {
          const position = layout.positions.get(component.id)
          if (!position) {
            return null
          }

          return (
            <g key={component.id} className="schematic-node" transform={`translate(${position.x - NODE_WIDTH / 2}, ${position.y - NODE_HEIGHT / 2})`}>
              <rect rx={12} ry={12} width={NODE_WIDTH} height={NODE_HEIGHT} />
              <text x={NODE_WIDTH / 2} y={26} className="schematic-node__label">
                {component.label}
              </text>
              <text x={NODE_WIDTH / 2} y={48} className="schematic-node__type">
                {component.type}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
