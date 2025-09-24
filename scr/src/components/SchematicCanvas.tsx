import { useMemo, type ReactElement } from 'react'

import type { CircuitPlan } from '../types/circuit'

const NODE_WIDTH = 200
const NODE_HEIGHT = 120
const VERTICAL_PADDING_TOP = 160
const VERTICAL_PADDING_BOTTOM = 200
const SIDE_PADDING = 140
const COLUMN_GAP = 140
const ROW_GAP = 150
const ICON_DIAMETER = 38

type IconKey =
  | 'supply'
  | 'led'
  | 'transistor'
  | 'switch'
  | 'resistor'
  | 'ground'
  | 'generic'

function resolveIconKey(type: string): IconKey {
  const normalized = type.toLowerCase()

  if (normalized.includes('fuente') || normalized.includes('vcc') || normalized.includes('dc')) {
    return 'supply'
  }

  if (normalized.includes('led')) {
    return 'led'
  }

  if (normalized.includes('transistor') || normalized.includes('mosfet')) {
    return 'transistor'
  }

  if (normalized.includes('interruptor') || normalized.includes('pulsador') || normalized.includes('switch')) {
    return 'switch'
  }

  if (normalized.includes('resist')) {
    return 'resistor'
  }

  if (normalized.includes('gnd') || normalized.includes('tierra') || normalized.includes('ground')) {
    return 'ground'
  }

  return 'generic'
}

const ICONS: Record<IconKey, ReactElement> = {
  supply: (
    <g className="schematic-node__icon-shape">
      <circle cx="0" cy="0" r="9" />
      <line x1="-12" y1="-12" x2="12" y2="-12" />
      <line x1="-12" y1="12" x2="12" y2="12" />
      <line x1="0" y1="-16" x2="0" y2="16" />
    </g>
  ),
  led: (
    <g className="schematic-node__icon-shape">
      <polygon points="-4,-6 6,0 -4,6" />
      <line x1="-12" y1="0" x2="-4" y2="0" />
      <line x1="6" y1="0" x2="14" y2="0" />
      <path d="M 2 -10 L 10 -18" />
      <path d="M 6 -8 L 14 -16" />
    </g>
  ),
  transistor: (
    <g className="schematic-node__icon-shape">
      <circle cx="-2" cy="0" r="10" />
      <line x1="-12" y1="-10" x2="6" y2="8" />
      <line x1="-12" y1="10" x2="8" y2="-12" />
      <polyline points="2,12 12,12 12,-2" />
      <polygon points="8,-2 12,-2 12,2" />
    </g>
  ),
  switch: (
    <g className="schematic-node__icon-shape">
      <line x1="-14" y1="8" x2="-2" y2="8" />
      <line x1="10" y1="-8" x2="14" y2="-8" />
      <circle cx="-2" cy="8" r="3" />
      <circle cx="10" cy="-8" r="3" />
      <line x1="-2" y1="8" x2="10" y2="-8" />
    </g>
  ),
  resistor: (
    <g className="schematic-node__icon-shape">
      <polyline points="-14,0 -10,-6 -6,6 -2,-6 2,6 6,-6 10,6 14,0" />
    </g>
  ),
  ground: (
    <g className="schematic-node__icon-shape">
      <line x1="-12" y1="8" x2="12" y2="8" />
      <line x1="-8" y1="12" x2="8" y2="12" />
      <line x1="-4" y1="16" x2="4" y2="16" />
      <line x1="0" y1="-6" x2="0" y2="8" />
    </g>
  ),
  generic: (
    <g className="schematic-node__icon-shape">
      <rect x="-10" y="-10" width="20" height="20" rx="4" />
      <circle cx="0" cy="0" r="3" />
    </g>
  ),
}

interface SchematicCanvasProps {
  plan: CircuitPlan
  className?: string
}

export function SchematicCanvas({ plan, className }: SchematicCanvasProps) {
  const layout = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>()
    const components = plan.components
    const columns = components.length > 6 ? 4 : components.length > 4 ? 3 : 2
    const columnWidth = NODE_WIDTH + COLUMN_GAP

    components.forEach((component, index) => {
      if (component.position) {
        positions.set(component.id, component.position)
        return
      }

      const column = index % columns
      const row = Math.floor(index / columns)
      const x = SIDE_PADDING + column * columnWidth + NODE_WIDTH / 2
      const y = VERTICAL_PADDING_TOP + row * ROW_GAP
      positions.set(component.id, { x, y })
    })

    if (components.length === 1) {
      const [first] = components
      if (first && !first.position) {
        positions.set(first.id, { x: SIDE_PADDING + NODE_WIDTH / 2, y: VERTICAL_PADDING_TOP })
      }
    }

    let minX = Number.POSITIVE_INFINITY
    let maxX = Number.NEGATIVE_INFINITY
    let minY = Number.POSITIVE_INFINITY
    let maxY = Number.NEGATIVE_INFINITY

    positions.forEach(({ x, y }) => {
      minX = Math.min(minX, x - NODE_WIDTH / 2)
      maxX = Math.max(maxX, x + NODE_WIDTH / 2)
      minY = Math.min(minY, y - NODE_HEIGHT / 2)
      maxY = Math.max(maxY, y + NODE_HEIGHT / 2)
    })

    if (!Number.isFinite(minX)) {
      minX = 0
      maxX = NODE_WIDTH
      minY = 0
      maxY = NODE_HEIGHT
    }

    const contentWidth = maxX - minX
    const contentHeight = maxY - minY
    const width = Math.max(640, contentWidth + SIDE_PADDING * 2)
    const height = Math.max(520, contentHeight + VERTICAL_PADDING_TOP + VERTICAL_PADDING_BOTTOM)
    const originX = minX - SIDE_PADDING
    const originY = minY - VERTICAL_PADDING_TOP

    return { positions, width, height, originX, originY }
  }, [plan.components])

  const canvasClassName = ['schematic-canvas', className].filter(Boolean).join(' ')

  return (
    <div className={canvasClassName}>
      <svg
        viewBox={`${layout.originX} ${layout.originY} ${layout.width} ${layout.height}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Esquema del circuito propuesto"
      >
        <defs>
          <pattern id="schematic-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(148, 163, 184, 0.12)" strokeWidth="1" />
          </pattern>
          <marker id="schematic-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(148, 197, 255, 0.85)" />
          </marker>
          <filter id="node-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="rgba(59, 130, 246, 0.25)" />
          </filter>
        </defs>

        <rect
          className="schematic-canvas__grid"
          x="0"
          y="0"
          width={layout.width}
          height={layout.height}
          fill="url(#schematic-grid)"
        />

        {plan.connections.map((connection, index) => {
          const from = layout.positions.get(connection.from)
          const to = layout.positions.get(connection.to)
          if (!from || !to) {
            return null
          }

          const lineId = connection.id ?? `${connection.from}-${connection.to}-${index}`
          const dx = to.x - from.x
          const dy = to.y - from.y
          const offset = Math.min(180, Math.max(60, Math.hypot(dx, dy) * 0.35))
          const curvature = dy === 0 ? offset * Math.sign(dx || 1) : offset * Math.sign(dy)
          const controlX = from.x + dx / 2
          const controlY = from.y + dy / 2 - curvature
          const midX = (from.x + to.x) / 2
          const midY = (from.y + to.y) / 2 - curvature * 0.25

          return (
            <g key={lineId} className="schematic-connection">
              <path
                className="schematic-connection__path"
                d={`M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`}
                markerEnd="url(#schematic-arrow)"
              >
                <title>{connection.description ?? connection.label ?? `${connection.from} → ${connection.to}`}</title>
              </path>
              <circle className="schematic-connection__endpoint" cx={from.x} cy={from.y} r={5} />
              <circle className="schematic-connection__endpoint" cx={to.x} cy={to.y} r={5} />
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

          const iconKey = resolveIconKey(component.type)

          return (
            <g
              key={component.id}
              className="schematic-node"
              transform={`translate(${position.x - NODE_WIDTH / 2}, ${position.y - NODE_HEIGHT / 2})`}
              filter="url(#node-shadow)"
            >
              <title>{component.description ?? component.type}</title>
              <rect rx={18} ry={18} width={NODE_WIDTH} height={NODE_HEIGHT} />
              <g
                className="schematic-node__icon"
                transform={`translate(${NODE_WIDTH / 2}, ${ICON_DIAMETER})`}
                aria-hidden="true"
              >
                <circle r={ICON_DIAMETER / 2} />
                <g transform="translate(0, 2)">{ICONS[iconKey]}</g>
              </g>
              <text x={NODE_WIDTH / 2} y={ICON_DIAMETER + 44} className="schematic-node__label">
                {component.label}
              </text>
              <text x={NODE_WIDTH / 2} y={ICON_DIAMETER + 66} className="schematic-node__type">
                {component.type}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
