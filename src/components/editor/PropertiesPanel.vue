<script setup lang="ts">
// Painel de propriedades — inspector flutuante do componente selecionado.
// Permite editar o valor elétrico: tensão (V) da fonte ou resistência (Ω) do
// resistor. A simulação recalcula sozinha (watch profundo no store) ao commitar.
import { computed, ref, watch } from 'vue'

import { useCircuitStore } from '@/stores/circuitStore'
import { formatQuantity, parseQuantity } from '@/utils/units'
import type { ComponentKind } from '@/types/circuit'

const store = useCircuitStore()

// Apenas estes tipos têm valor elétrico editável (e sua unidade).
const EDITABLE: Partial<Record<ComponentKind, { unit: string; name: string }>> = {
  resistor: { unit: 'Ω', name: 'Resistor' },
  'voltage-source': { unit: 'V', name: 'Fonte de tensão' },
}

const selected = computed(() => {
  const id = store.selectedId
  if (!id) return null
  const c = store.graph.components[id]
  if (!c || !EDITABLE[c.kind]) return null
  return c
})

const meta = computed(() => (selected.value ? EDITABLE[selected.value.kind]! : null))

// Divide um rótulo no primeiro `_` para renderizar o subscrito com <sub>.
const labelParts = computed(() => {
  const c = selected.value
  if (!c) return null
  const text = c.label ?? meta.value!.name
  const i = text.indexOf('_')
  return i === -1 ? { base: text, sub: '' } : { base: text.slice(0, i), sub: text.slice(i + 1) }
})

// Campo de edição: string local semeada com o valor formatado em unidade base.
const draft = ref('')
watch(
  selected,
  (c) => {
    if (c) draft.value = String(c.value)
  },
  { immediate: true },
)

function commit(): void {
  const c = selected.value
  if (!c) return
  const parsed = parseQuantity(draft.value)
  // Resistência precisa ser positiva (o solver usa g = 1/R); tensão é livre.
  const valid = parsed !== null && (c.kind !== 'resistor' || parsed > 0)
  if (valid) {
    store.updateComponent(c.id, { value: parsed })
  }
  // Re-sincroniza o campo (reverte entradas inválidas).
  draft.value = String(selected.value?.value ?? '')
}
</script>

<template>
  <aside v-if="selected && meta && labelParts" class="props-panel">
    <h2 class="props-panel__title">
      {{ labelParts.base }}<sub v-if="labelParts.sub">{{ labelParts.sub }}</sub>
    </h2>

    <label class="props-panel__field">
      <span class="props-panel__label">{{ meta.unit === 'Ω' ? 'Resistência' : 'Tensão' }}</span>
      <span class="props-panel__input-wrap">
        <input
          v-model="draft"
          class="props-panel__input"
          type="text"
          inputmode="decimal"
          :aria-label="`Valor em ${meta.unit}`"
          @keydown.enter.prevent="commit"
          @blur="commit"
        />
        <span class="props-panel__unit">{{ meta.unit }}</span>
      </span>
    </label>

    <p class="props-panel__hint">Aceita prefixos: 2.2k, 1M, 100m</p>
    <p class="props-panel__current">= {{ formatQuantity(selected.value, meta.unit) }}</p>
  </aside>
</template>

<style scoped>
.props-panel {
  width: 13rem;
  padding: 12px 14px;
  background: #fff;
  border: 1px solid #e6e6e6;
  border-radius: 12px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
}

.props-panel__title {
  margin: 0 0 10px;
  font-size: 0.95rem;
  color: #4a42c9;
}

.props-panel__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.props-panel__label {
  font-size: 0.78rem;
  color: #666;
}

.props-panel__input-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.props-panel__input {
  flex: 1;
  min-width: 0;
  padding: 5px 7px;
  border: 1px solid #d6d4ff;
  border-radius: 6px;
  font: 600 13px system-ui, sans-serif;
  color: #1e1e1e;
  outline: none;
}

.props-panel__input:focus {
  border-color: #6965db;
}

.props-panel__unit {
  font-size: 0.85rem;
  font-weight: 600;
  color: #666;
}

.props-panel__hint {
  margin: 6px 0 0;
  font-size: 0.72rem;
  color: #aaa;
}

.props-panel__current {
  margin: 2px 0 0;
  font-size: 0.78rem;
  font-weight: 600;
  color: #888;
}
</style>
