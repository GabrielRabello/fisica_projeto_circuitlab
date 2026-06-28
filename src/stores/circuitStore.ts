/**
 * Store central do circuito (Pinia).
 *
 * Fonte única de verdade compartilhada entre a barra de ferramentas, o editor
 * em canvas e o painel de resultados. Mantém:
 *   - o grafo elétrico (documento),
 *   - o estado de edição (ferramenta ativa, seleção),
 *   - resultado da simulação e validação (ainda não calculados).
 */
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

import {
  addComponent as addToGraph,
  createEmptyGraph,
  removeComponent as removeFromGraph,
} from '@/model/circuitGraph'
import { validate } from '@/model/validator'
import { simulate } from '@/engine/simulator'
import type { CircuitComponent, CircuitGraph, ComponentId } from '@/types/circuit'
import type { Tool } from '@/types/editor'
import type { SimulationResult } from '@/types/simulation'
import type { ValidationReport } from '@/types/validation'

export const useCircuitStore = defineStore('circuit', () => {
  // --- Documento ---
  const graph = ref<CircuitGraph>(createEmptyGraph())

  // --- Estado de edição ---
  const activeTool = ref<Tool>('select')
  const selectedId = ref<ComponentId | null>(null)

  // --- Saídas (preenchidas pela simulação, ainda não implementada) ---
  const result = ref<SimulationResult | null>(null)
  const validation = ref<ValidationReport | null>(null)

  // --- Ações de edição ---
  function setTool(tool: Tool): void {
    activeTool.value = tool
    if (tool !== 'select') selectedId.value = null
  }

  function select(id: ComponentId | null): void {
    selectedId.value = id
  }

  function addComponent(component: CircuitComponent): void {
    addToGraph(graph.value, component)
  }

  /** Atualiza campos de um componente existente (geometria, valor, estado). */
  function updateComponent(id: ComponentId, patch: Partial<CircuitComponent>): void {
    const component = graph.value.components[id]
    if (component) Object.assign(component, patch)
  }

  function removeComponent(id: ComponentId): void {
    removeFromGraph(graph.value, id)
    if (selectedId.value === id) selectedId.value = null
  }

  // --- Simulação ---
  /**
   * Valida e, se válido, resolve o circuito. Nunca lança: falhas viram
   * relatório de validação. Chamada automaticamente a cada mudança no grafo.
   */
  function runSimulation(): void {
    const report = validate(graph.value)
    validation.value = report
    if (!report.valid) {
      result.value = null
      return
    }
    try {
      result.value = simulate(graph.value)
    } catch (e) {
      result.value = null
      validation.value = {
        valid: false,
        issues: [
          {
            code: 'open-circuit',
            severity: 'error',
            message: e instanceof Error ? e.message : 'Falha ao resolver o circuito.',
          },
        ],
      }
    }
  }

  // Recalcula em tempo real a cada mudança no documento.
  watch(graph, runSimulation, { deep: true })

  function reset(): void {
    graph.value = createEmptyGraph()
    selectedId.value = null
    result.value = null
    validation.value = null
  }

  return {
    graph,
    activeTool,
    selectedId,
    result,
    validation,
    setTool,
    select,
    addComponent,
    updateComponent,
    removeComponent,
    runSimulation,
    reset,
  }
})
