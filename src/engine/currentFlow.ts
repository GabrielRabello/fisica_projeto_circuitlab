/**
 * Reconstrução do fluxo de corrente por componente, para a animação do caminho.
 *
 * O motor MNA resolve corrente (com sentido) apenas para resistores e fontes;
 * fios e chaves fechadas são absorvidos como curtos e reportam corrente 0. Para
 * animar a malha inteira é preciso recuperar a corrente de ramo, com sentido,
 * também nesses curtos.
 *
 * Estratégia (pura, sem Vue/DOM):
 *   1. Junções = posições de terminais coincidentes (sem fundir curtos), de modo
 *      que cada curto continua sendo uma aresta entre duas junções distintas.
 *   2. Resistores e fontes têm corrente conhecida no sentido a→b; ela é tratada
 *      como injeção nas junções (sai de `a`, entra em `b`).
 *   3. Sobre o subgrafo dos curtos resolve-se a corrente por LKC: numa árvore
 *      geradora, a corrente de cada aresta da árvore é a soma das injeções da
 *      subárvore que ela sustenta. Arestas redundantes (fios em paralelo) ficam
 *      com corrente 0 — uma divisão consistente, suficiente para a animação.
 */
import type { CircuitComponent, CircuitGraph, ComponentId, Point } from '@/types/circuit'
import type { SimulationResult } from '@/types/simulation'

/** Sentido e intensidade da corrente convencional num componente que conduz. */
export interface ComponentFlow {
  /** +1: corrente flui de `a`→`b`; -1: de `b`→`a`. */
  direction: 1 | -1
  /** Módulo da corrente (A). */
  current: number
}

const EPS = 1e-9

/** Chave de junção (terminais alinhados ao grid coincidem exatamente). */
function posKey(p: Point): string {
  return `${Math.round(p.x)}:${Math.round(p.y)}`
}

/** Curto-circuito: liga eletricamente as duas pontas (fio ou chave fechada). */
function isShort(c: CircuitComponent): boolean {
  return c.kind === 'wire' || (c.kind === 'switch' && (c.closed ?? false))
}

/**
 * Devolve, por componente que conduz, o sentido (a→b ou b→a) e o módulo da
 * corrente. Componentes sem corrente (chave aberta, ramo solto, fio redundante)
 * ficam ausentes do mapa.
 */
export function computeCurrentFlow(
  graph: CircuitGraph,
  result: SimulationResult,
): Record<ComponentId, ComponentFlow> {
  const components = Object.values(graph.components)
  const flow: Record<ComponentId, ComponentFlow> = {}

  // Injeção líquida conhecida que SAI de cada junção (resistores e fontes).
  const inj = new Map<string, number>()
  const addInj = (k: string, v: number): void => {
    inj.set(k, (inj.get(k) ?? 0) + v)
  }

  const shortEdges: { id: ComponentId; ja: string; jb: string }[] = []

  for (const c of components) {
    const ja = posKey(c.a)
    const jb = posKey(c.b)
    if (ja === jb) continue // componente degenerado (pontas coincidentes)

    if (isShort(c)) {
      shortEdges.push({ id: c.id, ja, jb })
      continue
    }

    // Corrente conhecida no sentido a→b através do ramo.
    let iab = 0
    if (c.kind === 'resistor') {
      // result.current já vem com o sinal a→b (i = (Va−Vb)/R).
      iab = result.components[c.id]?.current ?? 0
    } else if (c.kind === 'voltage-source') {
      // result.current é a corrente ENTREGUE (sai do terminal +, que é `a`);
      // pelo ramo a→b a corrente interna é o oposto (flui de − para +).
      iab = -(result.components[c.id]?.current ?? 0)
    } else {
      continue // chave aberta: não conduz.
    }

    addInj(ja, iab)
    addInj(jb, -iab)
    if (Math.abs(iab) > EPS) {
      flow[c.id] = { direction: iab > 0 ? 1 : -1, current: Math.abs(iab) }
    }
  }

  resolveShortFlow(shortEdges, inj, flow)
  return flow
}

/**
 * Resolve a corrente nos curtos por árvore geradora: a corrente que sobe de um
 * filho para o pai é a soma de `t` (injeção a escoar pelos curtos) da subárvore.
 */
function resolveShortFlow(
  shortEdges: { id: ComponentId; ja: string; jb: string }[],
  inj: Map<string, number>,
  flow: Record<ComponentId, ComponentFlow>,
): void {
  if (shortEdges.length === 0) return

  // Adjacência do subgrafo de curtos.
  const adj = new Map<string, { id: ComponentId; to: string }[]>()
  const touch = (k: string): void => {
    if (!adj.has(k)) adj.set(k, [])
  }
  const geom = new Map<ComponentId, { ja: string; jb: string }>()
  for (const e of shortEdges) {
    touch(e.ja)
    touch(e.jb)
    adj.get(e.ja)!.push({ id: e.id, to: e.jb })
    adj.get(e.jb)!.push({ id: e.id, to: e.ja })
    geom.set(e.id, { ja: e.ja, jb: e.jb })
  }

  // `t[j]`: corrente que precisa escoar de `j` para os curtos = −injeção(j).
  const t = (k: string): number => -(inj.get(k) ?? 0)

  const visited = new Set<string>()
  const usedEdge = new Set<ComponentId>()

  // Pós-ordem iterativa: devolve a soma de `t` na subárvore enraizada em cada nó.
  const subtreeSum = new Map<string, number>()

  function visit(root: string): void {
    // Pilha de [nó, índice da aresta-pai usada]; processa em pós-ordem.
    const stack: { node: string; parentEdge: ComponentId | null }[] = [
      { node: root, parentEdge: null },
    ]
    const order: { node: string; parentEdge: ComponentId | null }[] = []
    visited.add(root)
    while (stack.length) {
      const cur = stack.pop()!
      order.push(cur)
      for (const { id, to } of adj.get(cur.node) ?? []) {
        if (usedEdge.has(id) || visited.has(to)) continue
        usedEdge.add(id)
        visited.add(to)
        stack.push({ node: to, parentEdge: id })
      }
    }
    // Acumula da folha para a raiz.
    for (let i = order.length - 1; i >= 0; i--) {
      const { node, parentEdge } = order[i]
      const sum = (subtreeSum.get(node) ?? 0) + t(node)
      subtreeSum.set(node, sum)
      if (parentEdge === null) continue
      // Corrente que sobe deste nó para o pai através da aresta.
      const g = geom.get(parentEdge)!
      // `node` é o filho. Sentido a→b do componente:
      const iab = g.ja === node ? sum : -sum
      if (Math.abs(iab) > EPS) {
        flow[parentEdge] = { direction: iab > 0 ? 1 : -1, current: Math.abs(iab) }
      }
      // Propaga a soma para o pai.
      const parentNode = g.ja === node ? g.jb : g.ja
      subtreeSum.set(parentNode, (subtreeSum.get(parentNode) ?? 0) + sum)
    }
  }

  for (const k of adj.keys()) if (!visited.has(k)) visit(k)
}
