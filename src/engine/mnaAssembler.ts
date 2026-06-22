/**
 * Montador MNA (Modified Nodal Analysis).
 *
 * Constrói o sistema linear Ax = b a partir do grafo elétrico e da topologia
 * (terminais → nós) já derivada:
 *   - resistores entram como estampas de condutância (g = 1/R);
 *   - fontes de tensão acrescentam uma incógnita de corrente e ligam seus nós;
 *   - fios e chaves já foram absorvidos como nós (curtos) ou ignorados (abertos).
 *
 * Um nó é escolhido como referência (terra, 0 V) e fica de fora das incógnitas.
 * As incógnitas são codificadas em `unknowns`:
 *   - `V@<nodeId>` → tensão nodal;
 *   - `I@<componentId>` → corrente da fonte.
 */
import type { CircuitGraph, NodeId } from '@/types/circuit'
import type { LinearSystem } from '@/types/simulation'
import type { Topology } from '@/model/topology'

/** Condutância mínima usada como salvaguarda contra R ≤ 0. */
const MIN_RESISTANCE = 1e-9

/**
 * Escolhe o nó de referência (terra). Prefere o terminal negativo (b) da
 * primeira fonte; na ausência de fontes, usa o primeiro nó.
 */
function chooseGround(graph: CircuitGraph, topo: Topology): NodeId | null {
  for (const c of Object.values(graph.components)) {
    if (c.kind === 'voltage-source') return topo.terminals[c.id].b
  }
  return topo.nodes[0] ?? null
}

/** Monta o sistema linear da análise nodal modificada para o circuito dado. */
export function assembleSystem(graph: CircuitGraph, topo: Topology): LinearSystem {
  const components = Object.values(graph.components)
  const sources = components.filter((c) => c.kind === 'voltage-source')
  const ground = chooseGround(graph, topo)

  // Índice de cada tensão nodal incógnita (o terra fica de fora).
  const nonGround = topo.nodes.filter((id) => id !== ground)
  const vIndex = new Map<NodeId, number>()
  const unknowns: string[] = []
  nonGround.forEach((id) => {
    vIndex.set(id, unknowns.length)
    unknowns.push(`V@${id}`)
  })

  // Cada fonte de tensão acrescenta uma incógnita de corrente.
  const iIndex = new Map<string, number>()
  for (const s of sources) {
    iIndex.set(s.id, unknowns.length)
    unknowns.push(`I@${s.id}`)
  }

  const n = unknowns.length
  const A: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0))
  const b = new Array<number>(n).fill(0)

  // Índice de linha/coluna de um nó (-1 = terra, sem equação própria).
  const idx = (node: NodeId): number => vIndex.get(node) ?? -1

  // Estampa de condutância dos resistores.
  for (const c of components) {
    if (c.kind !== 'resistor') continue
    const g = 1 / Math.max(c.value, MIN_RESISTANCE)
    const p = idx(topo.terminals[c.id].a)
    const q = idx(topo.terminals[c.id].b)
    if (p >= 0) A[p][p] += g
    if (q >= 0) A[q][q] += g
    if (p >= 0 && q >= 0) {
      A[p][q] -= g
      A[q][p] -= g
    }
  }

  // Estampa das fontes de tensão (terminal a = +, terminal b = -).
  for (const s of sources) {
    const m = iIndex.get(s.id)!
    const p = idx(topo.terminals[s.id].a)
    const q = idx(topo.terminals[s.id].b)
    if (p >= 0) {
      A[p][m] += 1
      A[m][p] += 1
    }
    if (q >= 0) {
      A[q][m] -= 1
      A[m][q] -= 1
    }
    b[m] += s.value
  }

  return { A, b, unknowns }
}
