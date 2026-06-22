/**
 * Solver linear.
 *
 * Resolve o sistema Ax = b por eliminação de Gauss-Jordan com pivoteamento
 * parcial e devolve o vetor de incógnitas x. Lança erro se a matriz for
 * singular (circuito mal-condicionado: sem referência, laço de fontes, etc.).
 */
import type { LinearSystem } from '@/types/simulation'

const EPS = 1e-12

/** Resolve o sistema linear e retorna o vetor solução x. */
export function solve(system: LinearSystem): number[] {
  const n = system.b.length
  if (n === 0) return []

  // Cópias de trabalho (não mutamos o sistema recebido).
  const A = system.A.map((row) => row.slice())
  const b = system.b.slice()

  for (let col = 0; col < n; col++) {
    // Pivoteamento parcial: maior magnitude na coluna.
    let pivot = col
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(A[r][col]) > Math.abs(A[pivot][col])) pivot = r
    }
    if (Math.abs(A[pivot][col]) < EPS) {
      throw new Error('Sistema singular: o circuito não tem solução única.')
    }
    if (pivot !== col) {
      ;[A[col], A[pivot]] = [A[pivot], A[col]]
      ;[b[col], b[pivot]] = [b[pivot], b[col]]
    }

    // Elimina a coluna nas demais linhas.
    const diag = A[col][col]
    for (let r = 0; r < n; r++) {
      if (r === col) continue
      const factor = A[r][col] / diag
      if (factor === 0) continue
      for (let k = col; k < n; k++) A[r][k] -= factor * A[col][k]
      b[r] -= factor * b[col]
    }
  }

  // Sistema diagonalizado: x_i = b_i / A_ii.
  const x = new Array<number>(n)
  for (let i = 0; i < n; i++) x[i] = b[i] / A[i][i]
  return x
}
