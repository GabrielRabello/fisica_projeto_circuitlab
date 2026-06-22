/**
 * Orquestrador da simulação.
 *
 * Encadeia: derivação da topologia → montagem MNA → solução linear →
 * pós-processamento das grandezas por componente (V, I, P) e da resistência
 * equivalente vista pela fonte.
 */
import { assembleSystem } from './mnaAssembler'
import { solve } from './linearSolver'
import { buildTopology } from '@/model/topology'
import type { CircuitGraph, ComponentId, NodeId } from '@/types/circuit'
import type { ComponentResult, SimulationResult } from '@/types/simulation'

const MIN_RESISTANCE = 1e-9
const CURRENT_EPS = 1e-12

/** Executa a simulação completa do circuito e devolve as grandezas resolvidas. */
export function simulate(graph: CircuitGraph): SimulationResult {
  const topo = buildTopology(graph)
  const system = assembleSystem(graph, topo)
  const x = solve(system)

  // Decodifica as incógnitas: tensões nodais e correntes de fonte.
  const nodeVoltages: Record<NodeId, number> = {}
  for (const id of topo.nodes) nodeVoltages[id] = 0 // terra e default.
  const sourceCurrent: Record<ComponentId, number> = {}
  system.unknowns.forEach((u, i) => {
    if (u.startsWith('V@')) nodeVoltages[u.slice(2)] = x[i]
    else if (u.startsWith('I@')) sourceCurrent[u.slice(2)] = x[i]
  })

  // Grandezas por componente.
  const components: Record<ComponentId, ComponentResult> = {}
  for (const c of Object.values(graph.components)) {
    const { a, b } = topo.terminals[c.id]
    const va = nodeVoltages[a] ?? 0
    const vb = nodeVoltages[b] ?? 0

    let voltage: number
    let current: number
    if (c.kind === 'resistor') {
      voltage = va - vb
      current = voltage / Math.max(c.value, MIN_RESISTANCE)
    } else if (c.kind === 'voltage-source') {
      voltage = c.value
      // A corrente MNA da fonte é negativa quando ela fornece energia;
      // invertemos para reportar a corrente entregue ao circuito.
      current = -(sourceCurrent[c.id] ?? 0)
    } else {
      // Fios e chaves: curtos (V ≈ 0) ou abertos; corrente não resolvida aqui.
      voltage = va - vb
      current = 0
    }

    components[c.id] = { componentId: c.id, voltage, current, power: voltage * current }
  }

  // Resistência equivalente vista pela primeira fonte: Req = V / I.
  let equivalentResistance = Infinity
  const firstSource = Object.values(graph.components).find((c) => c.kind === 'voltage-source')
  if (firstSource) {
    const i = Math.abs(components[firstSource.id].current)
    equivalentResistance = i > CURRENT_EPS ? Math.abs(firstSource.value) / i : Infinity
  }

  return { nodeVoltages, components, equivalentResistance }
}
