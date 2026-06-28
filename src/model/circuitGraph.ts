/**
 * Operações sobre o grafo elétrico (modelo interno do circuito).
 *
 * Funções utilitárias para criar e manipular nós e componentes, sem
 * acoplamento com a UI. As mutações são feitas in-place sobre o grafo passado.
 */
import type {
  CircuitComponent,
  CircuitGraph,
  CircuitNode,
  ComponentId,
  NodeId,
} from '@/types/circuit'

/** Cria um grafo vazio. */
export function createEmptyGraph(): CircuitGraph {
  return { nodes: {}, components: {} }
}

/** Adiciona um nó ao grafo. */
export function addNode(graph: CircuitGraph, node: CircuitNode): void {
  graph.nodes[node.id] = node
}

/** Adiciona um componente ao grafo. */
export function addComponent(graph: CircuitGraph, component: CircuitComponent): void {
  graph.components[component.id] = component
}

/** Remove um componente do grafo. */
export function removeComponent(graph: CircuitGraph, id: ComponentId): void {
  delete graph.components[id]
}

/**
 * Retorna os componentes conectados a um nó.
 *
 * TODO: depende da derivação terminal → nó (camada MNA), ainda não implementada.
 */
export function componentsAtNode(
  _graph: CircuitGraph,
  _nodeId: NodeId,
): CircuitComponent[] {
  throw new Error('componentsAtNode: não implementado')
}
