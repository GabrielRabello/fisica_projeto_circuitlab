/**
 * Formatação e leitura de grandezas elétricas com prefixos SI.
 *
 * Compartilhado entre o painel de resultados, o painel de propriedades e o
 * renderer do canvas — mantém uma única convenção de exibição (µ, m, k, M).
 */

/** Prefixos SI suportados, do maior para o menor. */
const PREFIXES: [number, string][] = [
  [1e6, 'M'],
  [1e3, 'k'],
  [1, ''],
  [1e-3, 'm'],
  [1e-6, 'µ'],
]

/** Fatores de prefixo aceitos na entrada (parse). */
const PARSE_FACTORS: Record<string, number> = {
  M: 1e6,
  k: 1e3,
  K: 1e3,
  '': 1,
  m: 1e-3,
  u: 1e-6,
  µ: 1e-6,
}

/**
 * Formata um valor com o prefixo SI adequado e a unidade dada.
 * Ex.: `formatQuantity(2200, 'Ω')` → `"2.20 kΩ"`; `Infinity` → `"∞ Ω"`.
 */
export function formatQuantity(value: number, unit: string): string {
  if (!Number.isFinite(value)) return `∞ ${unit}`
  const abs = Math.abs(value)
  if (abs === 0) return `0 ${unit}`
  for (const [scale, prefix] of PREFIXES) {
    if (abs >= scale) {
      const v = value / scale
      const text = Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(2)
      return `${text} ${prefix}${unit}`
    }
  }
  return `${value.toExponential(2)} ${unit}`
}

/**
 * Lê um número com prefixo SI opcional. Aceita `"1000"`, `"2.2k"`, `"1M"`,
 * `"100m"`, vírgula ou ponto decimal e espaço antes do prefixo.
 * Retorna `null` se a entrada não for um número válido.
 */
export function parseQuantity(text: string): number | null {
  const trimmed = text.trim().replace(',', '.')
  if (trimmed === '') return null
  const match = /^([+-]?\d*\.?\d+)\s*([a-zA-Zµ]?)$/.exec(trimmed)
  if (!match) return null
  const factor = PARSE_FACTORS[match[2]]
  if (factor === undefined) return null
  const n = Number(match[1])
  if (!Number.isFinite(n)) return null
  return n * factor
}
