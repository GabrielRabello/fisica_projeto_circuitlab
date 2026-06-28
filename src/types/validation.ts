/**
 * Tipos do validador de circuito.
 */
import type { ComponentId, NodeId } from './circuit'

export type ValidationSeverity = 'error' | 'warning'

export type ValidationCode =
  | 'open-circuit' // Circuito aberto
  | 'short-circuit' // Curto-circuito
  | 'floating-component' // Componente desconectado
  | 'no-source' // Ausência de fonte
  | 'no-ground' // Ausência de nó de referência

export interface ValidationIssue {
  code: ValidationCode
  severity: ValidationSeverity
  message: string
  /** Elementos envolvidos no problema, quando aplicável. */
  components?: ComponentId[]
  nodes?: NodeId[]
}

export interface ValidationReport {
  valid: boolean
  issues: ValidationIssue[]
}
