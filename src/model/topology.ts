/**
 * Derivação da topologia elétrica a partir da geometria.
 *
 * Os componentes são definidos por dois terminais em coordenadas de canvas; não
 * há conectividade elétrica explícita. Aqui ela é inferida:
 *   - terminais que coincidem na mesma posição pertencem ao mesmo nó elétrico;
 *   - fios e chaves fechadas são curtos: fundem os nós das suas duas pontas;
 *   - chaves abertas não conduzem (não fundem nada).
 *
 * A fusão é feita com union-find sobre as posições dos terminais, devolvendo um
 * mapa terminal → nó usado tanto pela validação quanto pela montagem MNA.
 */
import type { CircuitComponent, CircuitGraph, ComponentId, NodeId, Point } from '@/types/circuit'

/** Chave de posição (terminais alinhados ao grid coincidem exatamente). */
function posKey(p: Point): string {
  return `${Math.round(p.x)}:${Math.round(p.y)}`
}

/** Union-find (conjuntos disjuntos) indexado por string. */
class UnionFind {
  private parent = new Map<string, string>()

  add(k: string): void {
    if (!this.parent.has(k)) this.parent.set(k, k)
  }

  find(k: string): string {
    let root = k
    while (this.parent.get(root) !== root) root = this.parent.get(root)!
    // Compressão de caminho.
    let cur = k
    while (cur !== root) {
      const next = this.parent.get(cur)!
      this.parent.set(cur, root)
      cur = next
    }
    return root
  }

  union(a: string, b: string): void {
    this.parent.set(this.find(a), this.find(b))
  }
}

/** Curto-circuito: o componente liga eletricamente suas duas pontas. */
function isShort(c: CircuitComponent): boolean {
  return c.kind === 'wire' || (c.kind === 'switch' && (c.closed ?? false))
}

export interface Topology {
  /** Nó elétrico de cada terminal de cada componente. */
  terminals: Record<ComponentId, { a: NodeId; b: NodeId }>
  /** Todos os nós elétricos distintos. */
  nodes: NodeId[]
}

/** Constrói a topologia elétrica (terminais → nós) do grafo. */
export function buildTopology(graph: CircuitGraph): Topology {
  const components = Object.values(graph.components)
  const uf = new UnionFind()

  // Registra cada posição como um nó candidato (coincidências já se fundem).
  for (const c of components) {
    uf.add(posKey(c.a))
    uf.add(posKey(c.b))
  }
  // Funde curtos (fios e chaves fechadas).
  for (const c of components) {
    if (isShort(c)) uf.union(posKey(c.a), posKey(c.b))
  }

  // Mapeia cada raiz union-find para um identificador de nó estável.
  const rootToNode = new Map<string, NodeId>()
  let counter = 0
  const nodeFor = (p: Point): NodeId => {
    const root = uf.find(posKey(p))
    let id = rootToNode.get(root)
    if (id === undefined) {
      id = `n${counter++}`
      rootToNode.set(root, id)
    }
    return id
  }

  const terminals: Record<ComponentId, { a: NodeId; b: NodeId }> = {}
  for (const c of components) {
    terminals[c.id] = { a: nodeFor(c.a), b: nodeFor(c.b) }
  }

  return { terminals, nodes: [...rootToNode.values()] }
}
