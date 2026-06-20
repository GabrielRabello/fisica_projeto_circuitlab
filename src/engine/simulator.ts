/**
 * Orquestrador da simulação.
 *
 * Encadeia montagem (MNA) -> solução linear -> pós-processamento das
 * grandezas por componente (V, I, R, P).
 */
import type { CircuitGraph } from '@/types/circuit'
import type { SimulationResult } from '@/types/simulation'

/**
 * Executa a simulação completa do circuito e devolve as grandezas resolvidas.
 *
 * TODO: encadear assembleSystem -> solve -> extração de resultados.
 */
export function simulate(_graph: CircuitGraph): SimulationResult {
  throw new Error('simulate: não implementado')
}
