/**
 * Constantes visuais e de interação do editor.
 */
import type { ComponentKind } from '@/types/circuit'

/** Espaçamento da grade de fundo, em px de mundo. */
export const GRID_SIZE = 20

/** Passo de alinhamento (snap) aplicado aos terminais. */
export const SNAP = 20

/** Lado das alças de redimensionamento (quadradinhos), em px. */
export const HANDLE_SIZE = 9

/** Tolerância de clique sobre um fio (corpo fino), em px. */
export const HIT_TOLERANCE = 8

/** Distância máxima entre os terminais para tratar como clique (sem arraste). */
export const CLICK_THRESHOLD = 6

/** Comprimento padrão atribuído a um componente criado por clique simples. */
export const DEFAULT_LENGTH = 80

/** Meia-altura dos símbolos (amplitude do zigue-zague, placas, etc.), em px. */
export const SYMBOL_AMPLITUDE = 14

/** Espessura padrão do traço dos componentes. */
export const STROKE_WIDTH = 2

/** Paleta de cores (estética inspirada no Excalidraw). */
export const colors = {
  background: '#ffffff',
  grid: '#ededed',
  stroke: '#1e1e1e',
  selection: '#6965db',
  handleFill: '#ffffff',
  handleStroke: '#6965db',
  label: '#4a42c9',
  value: '#6b6b6b',
  lock: '#8a8a8a',
} as const

/** Valor elétrico inicial de cada tipo de componente. */
export const DEFAULT_VALUE: Record<ComponentKind, number> = {
  'voltage-source': 9, // V
  resistor: 1000, // Ω
  wire: 0,
  switch: 0,
}
