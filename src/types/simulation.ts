/**
 * Tipos relacionados ao resultado da simulação (saída do motor MNA).
 */
import type { ComponentId, NodeId } from './circuit'

/** Grandezas calculadas para um componente. */
export interface ComponentResult {
  componentId: ComponentId
  /** Queda de tensão sobre o componente (V). */
  voltage: number
  /** Corrente que atravessa o componente (A). */
  current: number
  /** Potência dissipada (W) — P = V·I. */
  power: number
}

/** Resultado completo de uma simulação. */
export interface SimulationResult {
  /** Tensão nodal resolvida para cada nó (V). */
  nodeVoltages: Record<NodeId, number>
  /** Grandezas por componente. */
  components: Record<ComponentId, ComponentResult>
  /** Resistência equivalente vista pela fonte (Ω). */
  equivalentResistance: number
}

/** Sistema linear Ax = b montado pela análise nodal modificada (MNA). */
export interface LinearSystem {
  /** Matriz de condutâncias (A). */
  A: number[][]
  /** Vetor de excitações (b). */
  b: number[]
  /** Mapeia índice da matriz -> incógnita (tensão nodal ou corrente de fonte). */
  unknowns: string[]
}
