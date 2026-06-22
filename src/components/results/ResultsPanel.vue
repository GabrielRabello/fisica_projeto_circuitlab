<script setup lang="ts">
// Painel de resultados — exibe, em tempo real, o relatório de validação e as
// grandezas (V, I, P) por componente, além da resistência equivalente.
// A simulação é disparada reativamente pelo store a cada mudança no circuito.
import { computed } from 'vue'

import { useCircuitStore } from '@/stores/circuitStore'
import { formatQuantity as fmt } from '@/utils/units'
import type { ComponentKind } from '@/types/circuit'

const store = useCircuitStore()

const KIND_NAMES: Record<ComponentKind, string> = {
  'voltage-source': 'Fonte',
  resistor: 'Resistor',
  wire: 'Fio',
  switch: 'Chave',
}

interface Row {
  id: string
  base: string
  sub: string
  kind: ComponentKind
  voltage: number
  current: number
  power: number
}

// Divide um rótulo no primeiro `_` para renderizar o subscrito com <sub>.
function splitLabel(text: string): { base: string; sub: string } {
  const i = text.indexOf('_')
  return i === -1 ? { base: text, sub: '' } : { base: text.slice(0, i), sub: text.slice(i + 1) }
}

// Linhas exibidas: resistores e fontes (fios/chaves não carregam grandezas úteis).
const rows = computed<Row[]>(() => {
  const result = store.result
  if (!result) return []
  const out: Row[] = []
  for (const c of Object.values(store.graph.components)) {
    if (c.kind !== 'resistor' && c.kind !== 'voltage-source') continue
    const r = result.components[c.id]
    if (!r) continue
    const { base, sub } = splitLabel(c.label ?? KIND_NAMES[c.kind])
    out.push({ id: c.id, base, sub, kind: c.kind, voltage: r.voltage, current: r.current, power: r.power })
  }
  return out
})

const issues = computed(() => store.validation?.issues ?? [])
const equivalentResistance = computed(() => store.result?.equivalentResistance ?? null)
const isEmpty = computed(() => Object.keys(store.graph.components).length === 0)
</script>

<template>
  <aside class="results-panel">
    <h2 class="results-panel__title">Resultados</h2>

    <p v-if="isEmpty" class="results-panel__hint">
      Desenhe um circuito com uma fonte e ao menos um resistor.
    </p>

    <ul v-if="issues.length" class="issues">
      <li v-for="(issue, i) in issues" :key="i" :class="['issue', `issue--${issue.severity}`]">
        {{ issue.message }}
      </li>
    </ul>

    <template v-if="rows.length">
      <table class="results-table">
        <thead>
          <tr>
            <th>Comp.</th>
            <th>V</th>
            <th>I</th>
            <th>P</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id">
            <td class="results-table__name">
              {{ row.base }}<sub v-if="row.sub">{{ row.sub }}</sub>
            </td>
            <td>{{ fmt(row.voltage, 'V') }}</td>
            <td>{{ fmt(row.current, 'A') }}</td>
            <td>{{ fmt(row.power, 'W') }}</td>
          </tr>
        </tbody>
      </table>

      <p v-if="equivalentResistance !== null" class="results-panel__req">
        R<sub>eq</sub> = {{ fmt(equivalentResistance, 'Ω') }}
      </p>
    </template>
  </aside>
</template>

<style scoped>
.results-panel {
  width: 17rem;
  padding: 12px 14px;
  background: #fff;
  border: 1px solid #e6e6e6;
  border-radius: 12px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
}

.results-panel__title {
  margin: 0 0 8px;
  font-size: 0.95rem;
}

.results-panel__hint {
  margin: 0;
  font-size: 0.8rem;
  color: #888;
}

.issues {
  margin: 0 0 10px;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.issue {
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 0.78rem;
  line-height: 1.3;
}

.issue--error {
  background: #fdecec;
  color: #b42318;
}

.issue--warning {
  background: #fff6e5;
  color: #92600a;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
}

.results-table th {
  text-align: right;
  font-weight: 600;
  color: #666;
  padding: 2px 4px;
  border-bottom: 1px solid #ededed;
}

.results-table th:first-child {
  text-align: left;
}

.results-table td {
  text-align: right;
  padding: 3px 4px;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.results-table__name {
  text-align: left !important;
  font-weight: 600;
  color: #4a42c9;
}

.results-panel__req {
  margin: 10px 0 0;
  font-size: 0.85rem;
  font-weight: 600;
}
</style>
