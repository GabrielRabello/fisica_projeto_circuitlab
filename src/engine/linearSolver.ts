/**
 * Solver linear.
 *
 * Resolve o sistema Ax = b (por exemplo, via eliminação de Gauss com
 * pivoteamento parcial) e devolve o vetor de incógnitas x.
 */
import type { LinearSystem } from '@/types/simulation'

/**
 * Resolve o sistema linear e retorna o vetor solução x.
 *
 * TODO: implementar a eliminação de Gauss / decomposição LU.
 */
export function solve(_system: LinearSystem): number[] {
  throw new Error('solve: não implementado')
}
