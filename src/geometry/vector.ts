/**
 * Álgebra vetorial 2D e testes geométricos — funções puras.
 *
 * Operam sobre `Point` ({ x, y }) e são independentes de Vue/DOM, podendo ser
 * usadas tanto pela renderização quanto pela detecção de cliques.
 */
import type { Point } from '@/types/circuit'

export const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y })
export const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y })
export const scale = (a: Point, s: number): Point => ({ x: a.x * s, y: a.y * s })

export const len = (a: Point): number => Math.hypot(a.x, a.y)
export const dist = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y)

export const normalize = (a: Point): Point => {
  const l = len(a) || 1
  return { x: a.x / l, y: a.y / l }
}

/** Vetor perpendicular (rotação de 90°). */
export const perp = (a: Point): Point => ({ x: -a.y, y: a.x })

/** Interpolação linear entre `a` e `b` (t ∈ [0, 1]). */
export const lerp = (a: Point, b: Point, t: number): Point => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
})

/** Distância de um ponto `p` ao segmento de reta `a`–`b`. */
export function distToSegment(p: Point, a: Point, b: Point): number {
  const ab = sub(b, a)
  const l2 = ab.x * ab.x + ab.y * ab.y
  if (l2 === 0) return dist(p, a)
  let t = ((p.x - a.x) * ab.x + (p.y - a.y) * ab.y) / l2
  t = Math.max(0, Math.min(1, t))
  return dist(p, { x: a.x + ab.x * t, y: a.y + ab.y * t })
}

/** Alinha um ponto à grade de passo `grid`. */
export function snap(p: Point, grid: number): Point {
  return { x: Math.round(p.x / grid) * grid, y: Math.round(p.y / grid) * grid }
}
