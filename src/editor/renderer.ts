/**
 * Renderização da cena no Canvas 2D.
 *
 * Função pura `renderScene`: limpa o canvas, desenha a grade, todos os
 * componentes e a sobreposição de seleção (caixa tracejada + alças). Não lê
 * estado global — recebe tudo via `Scene`, o que mantém o render testável e
 * desacoplado do Vue/store.
 */
import type { CircuitComponent, ComponentId, Point } from '@/types/circuit'
import type { ComponentFlow } from '@/engine/currentFlow'
import {
  colors,
  FLOW_DOT_RADIUS,
  FLOW_DOT_SPACING,
  FLOW_MAX_SPEED,
  FLOW_MIN_SPEED,
  GRID_SIZE,
  HANDLE_SIZE,
  STROKE_WIDTH,
  SYMBOL_AMPLITUDE,
} from './constants'
import { drawResistor, drawSource, drawSwitch, drawWire } from './symbols'
import { formatQuantity } from '@/utils/units'

/** Unidade do valor elétrico exibido para cada tipo (vazio = não exibe). */
const VALUE_UNIT: Partial<Record<CircuitComponent['kind'], string>> = {
  resistor: 'Ω',
  'voltage-source': 'V',
}

export interface Scene {
  /** Largura/altura em px de mundo (CSS). */
  width: number
  height: number
  components: CircuitComponent[]
  selectedId: ComponentId | null
  /** Fluxo de corrente por componente (anima o caminho); ausente = sem animação. */
  flow?: Record<ComponentId, ComponentFlow>
  /** Tempo acumulado (s) que avança os pontos do fluxo. */
  flowTime?: number
  /** Maior corrente da malha (A), para normalizar a velocidade dos pontos. */
  flowMaxCurrent?: number
}

export function renderScene(ctx: CanvasRenderingContext2D, scene: Scene): void {
  ctx.fillStyle = colors.background
  ctx.fillRect(0, 0, scene.width, scene.height)
  drawGrid(ctx, scene.width, scene.height)

  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const c of scene.components) {
    ctx.strokeStyle = colors.stroke
    ctx.lineWidth = STROKE_WIDTH
    drawComponent(ctx, c)
    drawTerminals(ctx, c)
    if (!c.labelsHidden) {
      if (c.labelA) drawLabel(ctx, c.a, c.labelA)
      if (c.labelB) drawLabel(ctx, c.b, c.labelB)
    }
    if (c.label && !c.titleHidden) {
      drawCenterLabel(ctx, { x: (c.a.x + c.b.x) / 2, y: (c.a.y + c.b.y) / 2 }, c.label)
    }
    const unit = VALUE_UNIT[c.kind]
    if (unit) {
      const mid = { x: (c.a.x + c.b.x) / 2, y: (c.a.y + c.b.y) / 2 }
      drawValueLabel(ctx, { x: mid.x, y: mid.y - (SYMBOL_AMPLITUDE + 10) }, formatQuantity(c.value, unit))
    }
    if (c.locked) {
      drawLockBadge(ctx, { x: (c.a.x + c.b.x) / 2, y: (c.a.y + c.b.y) / 2 + SYMBOL_AMPLITUDE + 14 })
    }
  }

  // Pontos animados sobre os componentes que conduzem (sobre os símbolos).
  if (scene.flow) {
    const time = scene.flowTime ?? 0
    const maxI = scene.flowMaxCurrent ?? 0
    for (const c of scene.components) {
      const f = scene.flow[c.id]
      if (f) drawFlow(ctx, c.a, c.b, f, time, maxI)
    }
  }

  const selected = scene.selectedId
    ? scene.components.find((c) => c.id === scene.selectedId)
    : undefined
  if (selected) drawSelection(ctx, selected)
}

/**
 * Desenha os pontos da corrente deslizando ao longo do eixo `a`→`b`, no sentido
 * do fluxo. A velocidade cresce suavemente com a intensidade (mais corrente =
 * pontos mais rápidos); cada ponto leva um halo branco para destacar do símbolo.
 */
function drawFlow(
  ctx: CanvasRenderingContext2D,
  a: Point,
  b: Point,
  flow: ComponentFlow,
  time: number,
  maxCurrent: number,
): void {
  const len = Math.hypot(b.x - a.x, b.y - a.y)
  if (len < 1) return
  const ux = (b.x - a.x) / len
  const uy = (b.y - a.y) / len

  const ratio = maxCurrent > 0 ? flow.current / maxCurrent : 1
  const speed = FLOW_MIN_SPEED + (FLOW_MAX_SPEED - FLOW_MIN_SPEED) * Math.sqrt(ratio)
  // Deslocamento dentro de um período (0..spacing), sempre positivo.
  const offset = (((time * speed) % FLOW_DOT_SPACING) + FLOW_DOT_SPACING) % FLOW_DOT_SPACING

  ctx.save()
  ctx.fillStyle = colors.current
  ctx.strokeStyle = colors.background
  ctx.lineWidth = 1
  for (let d = offset; d < len; d += FLOW_DOT_SPACING) {
    // direction +1: avança de `a`→`b`; -1: de `b`→`a`.
    const dist = flow.direction === 1 ? d : len - d
    const x = a.x + ux * dist
    const y = a.y + uy * dist
    ctx.beginPath()
    ctx.arc(x, y, FLOW_DOT_RADIUS, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }
  ctx.restore()
}

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.save()
  ctx.strokeStyle = colors.grid
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let x = 0; x <= w; x += GRID_SIZE) {
    ctx.moveTo(x + 0.5, 0)
    ctx.lineTo(x + 0.5, h)
  }
  for (let y = 0; y <= h; y += GRID_SIZE) {
    ctx.moveTo(0, y + 0.5)
    ctx.lineTo(w, y + 0.5)
  }
  ctx.stroke()
  ctx.restore()
}

function drawComponent(ctx: CanvasRenderingContext2D, c: CircuitComponent): void {
  switch (c.kind) {
    case 'resistor':
      drawResistor(ctx, c.a, c.b)
      break
    case 'voltage-source':
      drawSource(ctx, c.a, c.b)
      break
    case 'switch':
      drawSwitch(ctx, c.a, c.b, c.closed ?? false)
      break
    case 'wire':
      drawWire(ctx, c.a, c.b)
      break
  }
}

const FONT_FAMILY = 'system-ui, sans-serif'
const SUB_RATIO = 0.72 // tamanho do subscrito relativo à base

/** Divide o texto em base e subscrito a partir do primeiro `_` ("R_1" → "R","1"). */
function splitSubscript(text: string): { base: string; sub: string } {
  const i = text.indexOf('_')
  if (i === -1) return { base: text, sub: '' }
  return { base: text.slice(0, i), sub: text.slice(i + 1) }
}

/** Largura total do texto já considerando o subscrito. */
function scriptWidth(ctx: CanvasRenderingContext2D, text: string, basePx: number): number {
  const { base, sub } = splitSubscript(text)
  ctx.font = `600 ${basePx}px ${FONT_FAMILY}`
  let w = ctx.measureText(base).width
  if (sub) {
    ctx.font = `600 ${Math.round(basePx * SUB_RATIO)}px ${FONT_FAMILY}`
    w += ctx.measureText(sub).width
  }
  return w
}

/**
 * Desenha um texto centrado em `centerX` na linha-base `y`, tratando o que vem
 * após `_` como subscrito (fonte menor, deslocada para baixo). Com `halo`,
 * traça um contorno na cor dada para legibilidade sobre o fundo.
 */
function drawScriptText(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  y: number,
  text: string,
  basePx: number,
  color: string,
  halo?: string,
): void {
  const { base, sub } = splitSubscript(text)
  const baseFont = `600 ${basePx}px ${FONT_FAMILY}`
  const subFont = `600 ${Math.round(basePx * SUB_RATIO)}px ${FONT_FAMILY}`
  const subDy = basePx * 0.22

  ctx.textAlign = 'left'
  const total = scriptWidth(ctx, text, basePx)
  let x = centerX - total / 2

  const stamp = (s: string, font: string, dy: number): void => {
    ctx.font = font
    if (halo) {
      ctx.lineWidth = 3
      ctx.strokeStyle = halo
      ctx.strokeText(s, x, y + dy)
    }
    ctx.fillStyle = color
    ctx.fillText(s, x, y + dy)
    x += ctx.measureText(s).width
  }

  stamp(base, baseFont, 0)
  if (sub) stamp(sub, subFont, subDy)
}

/** Rótulo curto junto a um terminal, com halo branco para legibilidade. */
function drawLabel(ctx: CanvasRenderingContext2D, p: Point, text: string): void {
  ctx.save()
  ctx.textBaseline = 'bottom'
  drawScriptText(ctx, p.x, p.y - 7, text, 11, colors.label, colors.background)
  ctx.restore()
}

/** Valor elétrico (ex.: "1 kΩ", "9 V") em texto discreto acima do componente. */
function drawValueLabel(ctx: CanvasRenderingContext2D, p: Point, text: string): void {
  ctx.save()
  ctx.textBaseline = 'bottom'
  drawScriptText(ctx, p.x, p.y, text, 11, colors.value, colors.background)
  ctx.restore()
}

/** Rótulo no centro da figura, sobre um retângulo branco para legibilidade. */
function drawCenterLabel(ctx: CanvasRenderingContext2D, mid: Point, text: string): void {
  ctx.save()
  ctx.textBaseline = 'middle'
  const w = scriptWidth(ctx, text, 12)
  const halfW = w / 2 + 5
  const halfH = 9

  ctx.fillStyle = colors.background
  ctx.strokeStyle = colors.grid
  ctx.lineWidth = 1
  ctx.fillRect(mid.x - halfW, mid.y - halfH, halfW * 2, halfH * 2)
  ctx.strokeRect(mid.x - halfW, mid.y - halfH, halfW * 2, halfH * 2)

  drawScriptText(ctx, mid.x, mid.y + 0.5, text, 12, colors.label)
  ctx.restore()
}

/** Pequeno cadeado indicando um componente travado. */
function drawLockBadge(ctx: CanvasRenderingContext2D, p: Point): void {
  ctx.save()
  ctx.strokeStyle = colors.lock
  ctx.fillStyle = colors.lock
  ctx.lineWidth = 1.5
  // Arco (haste).
  ctx.beginPath()
  ctx.arc(p.x, p.y - 1, 3, Math.PI, 0)
  ctx.stroke()
  // Corpo.
  ctx.fillRect(p.x - 4, p.y - 1, 8, 7)
  ctx.restore()
}

/** Pequenos pontos nas extremidades sugerindo os pontos de conexão. */
function drawTerminals(ctx: CanvasRenderingContext2D, c: CircuitComponent): void {
  ctx.save()
  ctx.fillStyle = colors.stroke
  for (const p of [c.a, c.b]) {
    ctx.beginPath()
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawSelection(ctx: CanvasRenderingContext2D, c: CircuitComponent): void {
  const pad = SYMBOL_AMPLITUDE + 6
  const minX = Math.min(c.a.x, c.b.x) - pad
  const minY = Math.min(c.a.y, c.b.y) - pad
  const maxX = Math.max(c.a.x, c.b.x) + pad
  const maxY = Math.max(c.a.y, c.b.y) + pad

  ctx.save()
  ctx.strokeStyle = colors.selection
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  ctx.strokeRect(minX, minY, maxX - minX, maxY - minY)
  ctx.setLineDash([])

  // Alças de redimensionamento nos terminais.
  for (const p of [c.a, c.b]) {
    ctx.fillStyle = colors.handleFill
    ctx.strokeStyle = colors.handleStroke
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.rect(p.x - HANDLE_SIZE / 2, p.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE)
    ctx.fill()
    ctx.stroke()
  }
  ctx.restore()
}
