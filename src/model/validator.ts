/**
 * Validador de circuito.
 *
 * Inspeciona o grafo elétrico em busca de condições inválidas antes da
 * simulação: circuito aberto, curto-circuito, componentes desconectados,
 * ausência de fonte ou de nó de referência.
 */
import type { CircuitGraph } from '@/types/circuit'
import type { ValidationReport } from '@/types/validation'

/**
 * Valida o circuito e retorna um relatório com os problemas encontrados.
 *
 * TODO: implementar as verificações topológicas.
 */
export function validate(_graph: CircuitGraph): ValidationReport {
  throw new Error('validate: não implementado')
}
