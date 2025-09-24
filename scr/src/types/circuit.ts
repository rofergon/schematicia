export interface CircuitComponent {
  id: string
  label: string
  type: string
  description?: string
  pins?: number
  position?: {
    x: number
    y: number
  }
}

export interface CircuitConnection {
  id?: string
  from: string
  to: string
  label?: string
  description?: string
}

export interface CircuitPlan {
  title: string
  summary: string
  components: CircuitComponent[]
  connections: CircuitConnection[]
  notes: string[]
  assumptions: string[]
  warnings: string[]
}

export interface CircuitDesignResponse {
  response: string
  circuit: CircuitPlan
}
