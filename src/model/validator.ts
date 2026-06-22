/**
 * Validador de circuito.
 *
 * Inspeciona o grafo elétrico em busca de condições inválidas antes da
 * simulação: ausência de fonte, curto sobre a fonte, circuito aberto (sem
 * caminho de retorno) e componentes soltos. Reaproveita a topologia derivada
 * (terminais → nós) para raciocinar sobre conectividade.
 */
import { buildTopology } from './topology'
import type { CircuitComponent, CircuitGraph, NodeId } from '@/types/circuit'
import type { ValidationIssue, ValidationReport } from '@/types/validation'

/** Conduz corrente em regime estacionário (entra na conectividade elétrica). */
function conducts(c: CircuitComponent): boolean {
  return (
    c.kind === 'resistor' ||
    c.kind === 'wire' ||
    (c.kind === 'switch' && (c.closed ?? false))
  )
}

/**
 * Valida o circuito e retorna um relatório com os problemas encontrados.
 * `valid` é verdadeiro quando não há problemas de severidade `error`.
 */
export function validate(graph: CircuitGraph): ValidationReport {
  const components = Object.values(graph.components)
  const issues: ValidationIssue[] = []

  const sources = components.filter((c) => c.kind === 'voltage-source')
  if (sources.length === 0) {
    issues.push({
      code: 'no-source',
      severity: 'error',
      message: 'O circuito não possui fonte de tensão.',
    })
  }

  const topo = buildTopology(graph)

  // Grau de cada nó considerando apenas dispositivos (exclui fios, que já
  // foram absorvidos como nós). Um nó tocado por um único terminal é um beco
  // sem saída → componente solto.
  const degree = new Map<NodeId, number>()
  const bump = (n: NodeId) => degree.set(n, (degree.get(n) ?? 0) + 1)
  for (const c of components) {
    if (c.kind === 'wire') continue
    const t = topo.terminals[c.id]
    bump(t.a)
    bump(t.b)
  }
  for (const c of components) {
    if (c.kind === 'wire') continue
    const t = topo.terminals[c.id]
    if ((degree.get(t.a) ?? 0) < 2 || (degree.get(t.b) ?? 0) < 2) {
      issues.push({
        code: 'floating-component',
        severity: 'warning',
        message: `Componente "${c.label ?? c.kind}" tem um terminal sem conexão.`,
        components: [c.id],
      })
    }
  }

  // Caminho de retorno da fonte: nós conectados pelas pontes que conduzem
  // (resistores, fios já fundidos, chaves fechadas) e pelas *demais* fontes —
  // a própria fonte sob teste é excluída para não fechar o laço trivialmente.
  const connected = (from: NodeId, to: NodeId, exceptSourceId: string): boolean => {
    if (from === to) return true
    const adjacency = new Map<NodeId, Set<NodeId>>()
    const link = (x: NodeId, y: NodeId) => {
      if (x === y) return
      if (!adjacency.has(x)) adjacency.set(x, new Set())
      if (!adjacency.has(y)) adjacency.set(y, new Set())
      adjacency.get(x)!.add(y)
      adjacency.get(y)!.add(x)
    }
    for (const c of components) {
      const bridges = conducts(c) || (c.kind === 'voltage-source' && c.id !== exceptSourceId)
      if (!bridges) continue
      const t = topo.terminals[c.id]
      link(t.a, t.b)
    }

    const seen = new Set<NodeId>([from])
    const stack = [from]
    while (stack.length) {
      const cur = stack.pop()!
      for (const next of adjacency.get(cur) ?? []) {
        if (next === to) return true
        if (!seen.has(next)) {
          seen.add(next)
          stack.push(next)
        }
      }
    }
    return false
  }

  // Por fonte: curto (mesmos nós) ou circuito aberto (sem retorno externo).
  for (const s of sources) {
    const t = topo.terminals[s.id]
    if (t.a === t.b) {
      issues.push({
        code: 'short-circuit',
        severity: 'error',
        message: `A fonte "${s.label ?? 'de tensão'}" está em curto-circuito.`,
        components: [s.id],
      })
    } else if (!connected(t.a, t.b, s.id)) {
      issues.push({
        code: 'open-circuit',
        severity: 'error',
        message: 'Circuito aberto: não há caminho de retorno para a fonte.',
        components: [s.id],
      })
    }
  }

  const valid = !issues.some((i) => i.severity === 'error')
  return { valid, issues }
}
