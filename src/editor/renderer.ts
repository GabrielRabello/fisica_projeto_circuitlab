/**
 * Renderização da cena no Canvas 2D.
 *
 * Função pura `renderScene`: limpa o canvas, desenha a grade, todos os
 * componentes e a sobreposição de seleção (caixa tracejada + alças). Não lê
 * estado global — recebe tudo via `Scene`, o que mantém o render testável e
 * desacoplado do Vue/store.
 */
import type { CircuitComponent, ComponentId, Point } from '@/types/circuit'
import { colors, GRID_SIZE, HANDLE_SIZE, STROKE_WIDTH, SYMBOL_AMPLITUDE } from './constants'
import { drawResistor, drawSource, drawSwitch, drawWire } from './symbols'

export interface Scene {
  /** Largura/altura em px de mundo (CSS). */
  width: number
  height: number
  components: CircuitComponent[]
  selectedId: ComponentId | null
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
    if (c.labelA) drawLabel(ctx, c.a, c.labelA)
    if (c.labelB) drawLabel(ctx, c.b, c.labelB)
  }

  const selected = scene.selectedId
    ? scene.components.find((c) => c.id === scene.selectedId)
    : undefined
  if (selected) drawSelection(ctx, selected)
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

/** Rótulo curto junto a um terminal, com halo branco para legibilidade. */
function drawLabel(ctx: CanvasRenderingContext2D, p: Point, text: string): void {
  ctx.save()
  ctx.font = '600 11px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  const x = p.x
  const y = p.y - 7
  ctx.lineWidth = 3
  ctx.strokeStyle = colors.background
  ctx.strokeText(text, x, y)
  ctx.fillStyle = colors.label
  ctx.fillText(text, x, y)
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
