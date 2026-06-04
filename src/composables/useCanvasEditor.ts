/**
 * Lógica de interação do editor em canvas (estilo Excalidraw).
 *
 * Liga um elemento <canvas> ao store e implementa uma pequena máquina de
 * estados de ponteiro:
 *   - ferramenta de desenho: arrasta para criar um componente (terminal a→b);
 *   - ferramenta de seleção: clica no corpo para selecionar/mover, ou numa
 *     alça de terminal para redimensionar; clica no vazio para desmarcar.
 *
 * Mantém o estado persistente (componentes, seleção, ferramenta) no store e o
 * estado transitório do arraste localmente. Trata HiDPI e redesenha via rAF.
 */
import { onMounted, onUnmounted, ref, watch } from 'vue'

import {
  CLICK_THRESHOLD,
  DEFAULT_LENGTH,
  DEFAULT_VALUE,
  HANDLE_SIZE,
  HIT_TOLERANCE,
  SNAP,
  SYMBOL_AMPLITUDE,
} from '@/editor/constants'
import { renderScene } from '@/editor/renderer'
import { add, dist, distToSegment, snap, sub } from '@/geometry/vector'
import { useCircuitStore } from '@/stores/circuitStore'
import type { CircuitComponent, ComponentKind, Point } from '@/types/circuit'
import type { HandleId } from '@/types/editor'

type Drag =
  | { mode: 'idle' }
  | { mode: 'creating'; id: string }
  | { mode: 'moving'; id: string; start: Point; origA: Point; origB: Point }
  | { mode: 'resizing'; id: string; handle: HandleId; start: Point; orig: Point }

/** Estado do pequeno diálogo de edição de rótulo de terminal. */
export interface LabelEditorState {
  id: string
  handle: HandleId
  /** Posição (px de mundo = px do canvas) do terminal a rotular. */
  x: number
  y: number
  /** Valor inicial do campo. */
  value: string
}

export function useCanvasEditor() {
  const store = useCircuitStore()
  const canvasRef = ref<HTMLCanvasElement | null>(null)

  let ctx: CanvasRenderingContext2D | null = null
  let width = 0
  let height = 0
  let frame = 0
  let drag: Drag = { mode: 'idle' }
  let resizeObserver: ResizeObserver | null = null

  /** Diálogo de rótulo aberto (null = fechado). Consumido pelo CanvasEditor. */
  const labelEditor = ref<LabelEditorState | null>(null)

  const snapP = (p: Point): Point => snap(p, SNAP)

  // --- Render ---
  function draw(): void {
    if (!ctx) return
    renderScene(ctx, {
      width,
      height,
      components: Object.values(store.graph.components),
      selectedId: store.selectedId,
    })
  }

  /** Agenda um redesenho coalescido no próximo quadro. */
  function requestRender(): void {
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      draw()
    })
  }

  function resize(): void {
    const canvas = canvasRef.value
    if (!canvas || !ctx) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    width = rect.width
    height = rect.height
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    draw()
  }

  // --- Coordenadas ---
  function toWorld(e: PointerEvent): Point {
    const rect = canvasRef.value!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  // --- Hit testing ---
  function handleAt(c: CircuitComponent, p: Point): HandleId | null {
    if (dist(p, c.b) <= HANDLE_SIZE) return 'b'
    if (dist(p, c.a) <= HANDLE_SIZE) return 'a'
    return null
  }

  function hitsBody(c: CircuitComponent, p: Point): boolean {
    const tol = c.kind === 'wire' ? HIT_TOLERANCE : SYMBOL_AMPLITUDE + 4
    return distToSegment(p, c.a, c.b) <= tol
  }

  /** Componente mais ao topo (último desenhado) sob o ponto. */
  function topmostAt(p: Point): CircuitComponent | null {
    const list = Object.values(store.graph.components)
    for (let i = list.length - 1; i >= 0; i--) {
      if (hitsBody(list[i], p)) return list[i]
    }
    return null
  }

  // --- Cursor ---
  function applyCursor(p?: Point): void {
    const canvas = canvasRef.value
    if (!canvas) return
    if (store.activeTool !== 'select') {
      canvas.style.cursor = 'crosshair'
      return
    }
    if (p) {
      const selected = store.selectedId ? store.graph.components[store.selectedId] : undefined
      if (selected && handleAt(selected, p)) {
        canvas.style.cursor = 'nwse-resize'
        return
      }
      if (topmostAt(p)) {
        canvas.style.cursor = 'move'
        return
      }
    }
    canvas.style.cursor = 'default'
  }

  // --- Pointer handlers ---
  function onPointerDown(e: PointerEvent): void {
    const canvas = canvasRef.value!
    canvas.setPointerCapture(e.pointerId)
    const p = toWorld(e)
    const tool = store.activeTool

    if (tool !== 'select') {
      // Ferramenta de desenho: cria um novo componente colapsado em `p`.
      const kind = tool as ComponentKind
      const start = snapP(p)
      const id = crypto.randomUUID()
      const component: CircuitComponent = {
        id,
        kind,
        a: { ...start },
        b: { ...start },
        value: DEFAULT_VALUE[kind],
      }
      // Chave nasce aberta (circuito interrompido).
      if (kind === 'switch') component.closed = false
      store.addComponent(component)
      store.select(id)
      drag = { mode: 'creating', id }
      requestRender()
      return
    }

    // Ferramenta de seleção: alça do selecionado tem prioridade.
    const selectedId = store.selectedId
    if (selectedId) {
      const selected = store.graph.components[selectedId]
      const handle = selected ? handleAt(selected, p) : null
      if (handle && selected) {
        const orig = { ...(handle === 'a' ? selected.a : selected.b) }
        drag = { mode: 'resizing', id: selectedId, handle, start: p, orig }
        return
      }
    }

    const hit = topmostAt(p)
    if (hit) {
      store.select(hit.id)
      drag = { mode: 'moving', id: hit.id, start: p, origA: { ...hit.a }, origB: { ...hit.b } }
    } else {
      store.select(null)
      drag = { mode: 'idle' }
    }
    requestRender()
  }

  function onPointerMove(e: PointerEvent): void {
    const p = toWorld(e)
    switch (drag.mode) {
      case 'creating':
        store.updateComponent(drag.id, { b: snapP(p) })
        requestRender()
        break
      case 'resizing': {
        const point = snapP(p)
        store.updateComponent(drag.id, drag.handle === 'a' ? { a: point } : { b: point })
        requestRender()
        break
      }
      case 'moving': {
        const delta = snapP(sub(p, drag.start))
        store.updateComponent(drag.id, {
          a: add(drag.origA, delta),
          b: add(drag.origB, delta),
        })
        requestRender()
        break
      }
      default:
        applyCursor(p)
    }
  }

  function onPointerUp(e: PointerEvent): void {
    canvasRef.value?.releasePointerCapture(e.pointerId)

    if (drag.mode === 'creating') {
      const c = store.graph.components[drag.id]
      if (c && dist(c.a, c.b) < CLICK_THRESHOLD) {
        // Clique simples (sem arraste): dá um tamanho padrão horizontal.
        store.updateComponent(drag.id, { b: snapP(add(c.a, { x: DEFAULT_LENGTH, y: 0 })) })
      }
      // Após desenhar, volta para a seleção com o novo componente ativo.
      const id = drag.id
      store.setTool('select')
      store.select(id)
    } else if (drag.mode === 'resizing') {
      // Clique na alça (sem arraste) edita o rótulo; arraste redimensiona.
      if (dist(toWorld(e), drag.start) < CLICK_THRESHOLD) {
        const restore = drag.handle === 'a' ? { a: drag.orig } : { b: drag.orig }
        store.updateComponent(drag.id, restore)
        const c = store.graph.components[drag.id]
        if (c && (c.kind === 'wire' || c.kind === 'resistor')) {
          openLabelEditor(drag.id, drag.handle)
        }
      }
    }

    drag = { mode: 'idle' }
    requestRender()
  }

  // --- Edição de rótulo ---
  function openLabelEditor(id: string, handle: HandleId): void {
    const c = store.graph.components[id]
    if (!c) return
    const point = handle === 'a' ? c.a : c.b
    labelEditor.value = {
      id,
      handle,
      x: point.x,
      y: point.y,
      value: (handle === 'a' ? c.labelA : c.labelB) ?? '',
    }
  }

  function commitLabel(text: string): void {
    const editor = labelEditor.value
    if (!editor) return
    const value = text.trim().slice(0, 3)
    const patch = editor.handle === 'a' ? { labelA: value || undefined } : { labelB: value || undefined }
    store.updateComponent(editor.id, patch)
    labelEditor.value = null
    requestRender()
  }

  function cancelLabel(): void {
    labelEditor.value = null
  }

  /** Duplo-clique numa chave alterna entre aberta e fechada. */
  function onDoubleClick(e: MouseEvent): void {
    const rect = canvasRef.value!.getBoundingClientRect()
    const p: Point = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    const hit = topmostAt(p)
    if (hit && hit.kind === 'switch') {
      store.updateComponent(hit.id, { closed: !(hit.closed ?? false) })
      store.select(hit.id)
      requestRender()
    }
  }

  // --- Teclado ---
  function onKeyDown(e: KeyboardEvent): void {
    // Ignora atalhos enquanto se digita num campo (ex.: o diálogo de rótulo).
    const target = e.target as HTMLElement | null
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return

    switch (e.key) {
      case 'Delete':
      case 'Backspace':
        if (store.selectedId) {
          store.removeComponent(store.selectedId)
          requestRender()
          e.preventDefault()
        }
        break
      case 'Escape':
        store.setTool('select')
        store.select(null)
        requestRender()
        break
      case 'v':
      case 'V':
        store.setTool('select')
        break
      case 'w':
      case 'W':
        store.setTool('wire')
        break
      case 'r':
      case 'R':
        store.setTool('resistor')
        break
      case 'b':
      case 'B':
        store.setTool('voltage-source')
        break
      case 's':
      case 'S':
        store.setTool('switch')
        break
    }
  }

  // --- Ciclo de vida ---
  onMounted(() => {
    const canvas = canvasRef.value!
    ctx = canvas.getContext('2d')
    resize()

    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('dblclick', onDoubleClick)
    window.addEventListener('keydown', onKeyDown)
  })

  onUnmounted(() => {
    const canvas = canvasRef.value
    resizeObserver?.disconnect()
    canvas?.removeEventListener('pointerdown', onPointerDown)
    canvas?.removeEventListener('pointermove', onPointerMove)
    canvas?.removeEventListener('pointerup', onPointerUp)
    canvas?.removeEventListener('dblclick', onDoubleClick)
    window.removeEventListener('keydown', onKeyDown)
    if (frame) cancelAnimationFrame(frame)
  })

  // Redesenha quando o documento/seleção mudam por outras vias (toolbar, etc.).
  watch(() => store.graph, requestRender, { deep: true })
  watch(() => store.selectedId, requestRender)
  watch(
    () => store.activeTool,
    () => {
      applyCursor()
      requestRender()
    },
  )

  return { canvasRef, labelEditor, commitLabel, cancelLabel }
}
