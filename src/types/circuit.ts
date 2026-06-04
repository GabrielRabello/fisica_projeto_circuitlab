/**
 * Modelo de domínio do circuito.
 *
 * O circuito é representado como um grafo elétrico: nós (pontos de conexão)
 * ligados por componentes (arestas com propriedades elétricas).
 */

/** Tipos de componente suportados pelo simulador. */
export type ComponentKind =
  | 'voltage-source' // Fonte de tensão (bateria DC)
  | 'resistor' // Resistor (valor configurável)
  | 'wire' // Fio condutor / nó de conexão
  | 'switch' // Chave (liga/desliga)

export type NodeId = string
export type ComponentId = string

/** Posição em coordenadas do canvas. */
export interface Point {
  x: number
  y: number
}

/** Nó elétrico — ponto de junção entre componentes. */
export interface CircuitNode {
  id: NodeId
  position: Point
  /** Marca o nó de referência (terra, 0 V). */
  isGround: boolean
}

/**
 * Componente do circuito — definido geometricamente por seus dois terminais.
 *
 * Os terminais `a` e `b` são coordenadas no espaço do canvas: definem ao mesmo
 * tempo a posição (mover = transladar ambos) e o tamanho/orientação
 * (redimensionar = arrastar um terminal). A associação terminal → nó elétrico
 * (`NodeId`), necessária para o MNA, será derivada posteriormente ao
 * coincidir/snapar terminais — ainda não implementada.
 */
export interface CircuitComponent {
  id: ComponentId
  kind: ComponentKind
  /** Terminal A, em coordenadas de mundo (canvas). */
  a: Point
  /** Terminal B, em coordenadas de mundo (canvas). */
  b: Point
  /** Parâmetro elétrico principal (resistência em Ω, tensão em V, etc.). */
  value: number
  /** Estado da chave, quando aplicável. */
  closed?: boolean
  /** Travado: bloqueia qualquer operação além do destravamento. */
  locked?: boolean
  /** Rótulo central do componente (ex.: "R_1" num resistor). */
  label?: string
  /** Oculta o rótulo central (título) sem apagá-lo. */
  titleHidden?: boolean
  /** Oculta os rótulos dos terminais sem apagá-los. */
  labelsHidden?: boolean
  /** Rótulo do terminal A (até 3 caracteres). Aplicável a fio/resistor. */
  labelA?: string
  /** Rótulo do terminal B (até 3 caracteres). Aplicável a fio/resistor. */
  labelB?: string
}

/** Grafo elétrico completo. */
export interface CircuitGraph {
  nodes: Record<NodeId, CircuitNode>
  components: Record<ComponentId, CircuitComponent>
}
