/**
 * Desenho dos símbolos esquemáticos de cada componente.
 *
 * Cada função desenha o símbolo ao longo do eixo definido pelos terminais
 * `a`–`b`, usando o vetor direção e seu perpendicular para posicionar o corpo
 * (zigue-zague do resistor, placas da bateria, etc.). São funções puras de
 * desenho: recebem o contexto já configurado (cor/espessura) e estampam nele.
 */
import { add, dist, lerp, normalize, perp, scale, sub } from '@/geometry/vector'
import type { Point } from '@/types/circuit'
import { SYMBOL_AMPLITUDE } from './constants'

interface Axis {
  /** Vetor unitário de `a` para `b`. */
  dir: Point
  /** Perpendicular unitário ao eixo. */
  n: Point
  /** Comprimento do componente. */
  length: number
  /** Ponto médio do eixo. */
  mid: Point
}

function axisOf(a: Point, b: Point): Axis {
  const length = dist(a, b) || 1
  const dir = normalize(sub(b, a))
  return { dir, n: perp(dir), length, mid: lerp(a, b, 0.5) }
}

function line(ctx: CanvasRenderingContext2D, p: Point, q: Point): void {
  ctx.beginPath()
  ctx.moveTo(p.x, p.y)
  ctx.lineTo(q.x, q.y)
  ctx.stroke()
}

function polyline(ctx: CanvasRenderingContext2D, pts: Point[]): void {
  ctx.beginPath()
  ctx.moveTo(pts[0].x, pts[0].y)
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
  ctx.stroke()
}

/** Pequeno contato (círculo de borda traçada e miolo branco). */
function contactDot(ctx: CanvasRenderingContext2D, p: Point): void {
  ctx.save()
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

/** Fio condutor: simples segmento reto entre os terminais. */
export function drawWire(ctx: CanvasRenderingContext2D, a: Point, b: Point): void {
  line(ctx, a, b)
}

/** Resistor: terminais retos com corpo em zigue-zague no centro. */
export function drawResistor(ctx: CanvasRenderingContext2D, a: Point, b: Point): void {
  const { dir, n, length, mid } = axisOf(a, b)
  const bodyHalf = Math.min(length * 0.35, 28)
  const start = add(mid, scale(dir, -bodyHalf))
  const end = add(mid, scale(dir, bodyHalf))

  line(ctx, a, start)
  line(ctx, end, b)

  const teeth = 6
  const pts: Point[] = [start]
  for (let i = 0; i < teeth; i++) {
    const t = (i + 0.5) / teeth
    const sign = i % 2 === 0 ? 1 : -1
    pts.push(add(lerp(start, end, t), scale(n, SYMBOL_AMPLITUDE * sign)))
  }
  pts.push(end)
  polyline(ctx, pts)
}

/** Fonte de tensão (bateria DC): placa longa (+) e placa curta espessa (−). */
export function drawSource(ctx: CanvasRenderingContext2D, a: Point, b: Point): void {
  const { dir, n, mid } = axisOf(a, b)
  const gap = 8
  const longHalf = SYMBOL_AMPLITUDE
  const shortHalf = SYMBOL_AMPLITUDE * 0.55

  const longPlate = add(mid, scale(dir, -gap / 2))
  const shortPlate = add(mid, scale(dir, gap / 2))

  line(ctx, a, longPlate)
  line(ctx, shortPlate, b)

  // Placa longa e fina (terminal positivo).
  line(ctx, add(longPlate, scale(n, longHalf)), add(longPlate, scale(n, -longHalf)))

  // Placa curta e espessa (terminal negativo).
  ctx.save()
  ctx.lineWidth = ctx.lineWidth * 1.8
  line(ctx, add(shortPlate, scale(n, shortHalf)), add(shortPlate, scale(n, -shortHalf)))
  ctx.restore()

  // Sinal "+" junto à placa longa.
  const plus = add(longPlate, scale(n, longHalf + 9))
  line(ctx, add(plus, scale(dir, -3)), add(plus, scale(dir, 3)))
  line(ctx, add(plus, scale(n, -3)), add(plus, scale(n, 3)))
}

/**
 * Chave (interruptor SPST): dois contatos e uma alavanca pivotada.
 *
 * Fechada, a alavanca liga os dois contatos (conduz). Aberta, ela se ergue num
 * ângulo, deixando um vão visível — o circuito fica interrompido.
 */
export function drawSwitch(
  ctx: CanvasRenderingContext2D,
  a: Point,
  b: Point,
  closed: boolean,
): void {
  const { dir, n, mid } = axisOf(a, b)
  const half = SYMBOL_AMPLITUDE
  const pivot = add(mid, scale(dir, -half))
  const contact = add(mid, scale(dir, half))

  line(ctx, a, pivot)
  line(ctx, contact, b)

  let tip: Point
  if (closed) {
    tip = contact
  } else {
    const leverLen = half * 2
    const angle = Math.PI / 6 // 30° acima do eixo
    tip = add(
      pivot,
      add(scale(dir, leverLen * Math.cos(angle)), scale(n, -leverLen * Math.sin(angle))),
    )
  }
  line(ctx, pivot, tip)

  contactDot(ctx, pivot)
  contactDot(ctx, contact)
}
