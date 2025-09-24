import { useEffect, useMemo, useState, type ReactElement } from 'react'

import type { CircuitPlan } from '../types/circuit'

const NODE_WIDTH = 200
const NODE_HEIGHT = 120
const TOP_PADDING = 160
const SIDE_PADDING = 140
const COLUMN_GAP = 140
const ROW_GAP = 150
const ICON_DIAMETER = 38
const CANVAS_MIN_WIDTH = 640
const CANVAS_MIN_HEIGHT = 480
const CANVAS_MAX_WIDTH = 1280
const CANVAS_MAX_HEIGHT = 960

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
}

export function SchematicCanvas({ plan }: SchematicCanvasProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
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
      const y = TOP_PADDING + row * ROW_GAP
      positions.set(component.id, { x, y })
    })

    if (components.length === 1) {
      const [first] = components
      if (first && !first.position) {
        positions.set(first.id, { x: SIDE_PADDING + NODE_WIDTH / 2, y: TOP_PADDING })
      }
    }

    let minX = Number.POSITIVE_INFINITY
    let maxX = Number.NEGATIVE_INFINITY
    let minY = Number.POSITIVE_INFINITY
    let maxY = Number.NEGATIVE_INFINITY

    positions.forEach(({ x, y }) => {
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    })

    if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
      return {
        positions: new Map<string, { x: number; y: number }>(),
        width: CANVAS_MIN_WIDTH,
        height: CANVAS_MIN_HEIGHT,
      }
    }

    const widthSpan = Math.max(maxX - minX, 1)
    const heightSpan = Math.max(maxY - minY, 1)
    const availableWidth = Math.max(CANVAS_MAX_WIDTH - SIDE_PADDING * 2, 1)
    const availableHeight = Math.max(CANVAS_MAX_HEIGHT - TOP_PADDING - NODE_HEIGHT, 1)
    const scale = Math.min(availableWidth / widthSpan, availableHeight / heightSpan, 1)

    const contentWidth = Math.max(maxX - minX, 0) * scale
    const contentHeight = Math.max(maxY - minY, 0) * scale
    const rawWidth = contentWidth + SIDE_PADDING * 2
    const rawHeight = contentHeight + TOP_PADDING + NODE_HEIGHT
    const width = Math.max(CANVAS_MIN_WIDTH, Math.min(CANVAS_MAX_WIDTH, rawWidth))
    const height = Math.max(CANVAS_MIN_HEIGHT, Math.min(CANVAS_MAX_HEIGHT, rawHeight))
    const horizontalOffset = SIDE_PADDING + Math.max(0, (width - rawWidth) / 2)
    const verticalOffset = TOP_PADDING + Math.max(0, (height - rawHeight) / 2)

    const normalizedPositions = new Map<string, { x: number; y: number }>()
    positions.forEach(({ x, y }, id) => {
      const normalizedX = (x - minX) * scale + horizontalOffset
      const normalizedY = (y - minY) * scale + verticalOffset
      normalizedPositions.set(id, { x: normalizedX, y: normalizedY })
    })

    return { positions: normalizedPositions, width, height }
  }, [plan.components])

  useEffect(() => {
    if (!isFullscreen) {
      return undefined
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setIsFullscreen(false)
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFullscreen])

  const renderSvg = (instance: 'main' | 'fullscreen') => {
    const gridId = `schematic-grid-${instance}`
    const arrowId = `schematic-arrow-${instance}`
    const shadowId = `node-shadow-${instance}`

    return (
      <svg viewBox={`0 0 ${layout.width} ${layout.height}`} role="img" aria-label="Esquema del circuito propuesto">
      <defs>
        <pattern id={gridId} width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(148, 163, 184, 0.12)" strokeWidth="1" />
        </pattern>
        <marker id={arrowId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(148, 197, 255, 0.85)" />
        </marker>
        <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="rgba(59, 130, 246, 0.25)" />
        </filter>
      </defs>

      <rect
        className="schematic-canvas__grid"
        x="0"
        y="0"
        width={layout.width}
        height={layout.height}
        fill={`url(#${gridId})`}
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
              markerEnd={`url(#${arrowId})`}
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
            filter={`url(#${shadowId})`}
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
    )
  }

  return (
    <>
      <div className="schematic-canvas">
        <div className="schematic-canvas__toolbar">
          <button
            type="button"
            className="schematic-canvas__control"
            onClick={() => setIsFullscreen(true)}
            aria-label="Ver esquema a pantalla completa"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M5.5 3H10v1.5H6.5v3.5H5V3zm13.5 0v4.5h-1.5V4.5H14V3zM5 16.5h1.5V20H10v1.5H5.5zm13.5 0V21H14v-1.5h3.5V16.5z"
                fill="currentColor"
              />
            </svg>
            <span>Ampliar</span>
          </button>
        </div>
        {renderSvg('main')}
      </div>

      {isFullscreen ? (
        <div
          className="schematic-canvas__fullscreen-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`Visualización ampliada del esquema ${plan.title ?? ''}`}
          onClick={() => setIsFullscreen(false)}
        >
          <div
            className="schematic-canvas__fullscreen-inner"
            role="document"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="schematic-canvas__fullscreen-actions">
              <button
                type="button"
                className="schematic-canvas__control schematic-canvas__control--close"
                onClick={() => setIsFullscreen(false)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span>Cerrar</span>
              </button>
            </div>
            <div className="schematic-canvas schematic-canvas--fullscreen">{renderSvg('fullscreen')}</div>
          </div>
        </div>
      ) : null}
    </>
  )
}
