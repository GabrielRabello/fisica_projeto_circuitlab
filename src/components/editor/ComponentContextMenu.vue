<script setup lang="ts">
// Menu de contexto (clique direito) de um componente. As opções disponíveis
// dependem do estado do componente; um componente travado só oferece destravar.
import { computed } from 'vue'

import type { ContextAction } from '@/composables/useCanvasEditor'
import type { CircuitComponent } from '@/types/circuit'

const props = defineProps<{
  x: number
  y: number
  component: CircuitComponent
}>()

const emit = defineEmits<{
  (e: 'action', action: ContextAction): void
}>()

interface MenuItem {
  action: ContextAction
  label: string
}

const items = computed<MenuItem[]>(() => {
  const c = props.component

  // Travado: apenas destravar.
  if (c.locked) {
    return [{ action: 'unlock', label: 'Destravar' }]
  }

  const result: MenuItem[] = [
    { action: 'lock', label: 'Travar' },
    { action: 'duplicate', label: 'Duplicar' },
  ]

  // Título central (ex.: rótulo do resistor).
  if (c.label != null) {
    result.push(
      c.titleHidden
        ? { action: 'show-title', label: 'Exibir título' }
        : { action: 'hide-title', label: 'Ocultar título' },
    )
  }

  // Rótulos dos terminais (fio / resistor).
  if (c.kind === 'wire' || c.kind === 'resistor') {
    result.push(
      c.labelsHidden
        ? { action: 'show-labels', label: 'Exibir rótulos' }
        : { action: 'hide-labels', label: 'Ocultar rótulos' },
    )
  }

  return result
})

const style = computed(() => ({ left: `${props.x}px`, top: `${props.y}px` }))
</script>

<template>
  <div class="context-menu" :style="style" role="menu">
    <button
      v-for="item in items"
      :key="item.action"
      class="context-menu__item"
      role="menuitem"
      @click="emit('action', item.action)"
    >
      {{ item.label }}
    </button>
  </div>
</template>

<style scoped>
.context-menu {
  position: absolute;
  z-index: 20;
  min-width: 150px;
  padding: 4px;
  background: #fff;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.16);
}

.context-menu__item {
  display: block;
  width: 100%;
  padding: 7px 10px;
  border: none;
  border-radius: 5px;
  background: transparent;
  color: #1e1e1e;
  font-size: 0.85rem;
  text-align: left;
  cursor: pointer;
}

.context-menu__item:hover {
  background: #f1f0ff;
  color: #4a42c9;
}
</style>
