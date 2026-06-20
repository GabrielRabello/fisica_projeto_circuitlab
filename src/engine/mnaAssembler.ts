/**
 * Montador MNA (Modified Nodal Analysis).
 *
 * Constrói o sistema linear Ax = b a partir do grafo elétrico:
 *   - A = matriz de condutâncias
 *   - x = vetor de tensões nodais e correntes de fontes
 *   - b = vetor de excitações
 */
import type { CircuitGraph } from '@/types/circuit'
import type { LinearSystem } from '@/types/simulation'

/**
 * Monta o sistema linear da análise nodal modificada para o circuito dado.
 *
 * TODO: implementar a montagem das estampas (stamps) por componente.
 */
export function assembleSystem(_graph: CircuitGraph): LinearSystem {
  throw new Error('assembleSystem: não implementado')
}
