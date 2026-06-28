<script setup lang="ts">
// Barra de ferramentas flutuante (estilo Excalidraw): seleção + componentes.
// Apenas escolhe a ferramenta ativa no store; o desenho é tratado no canvas.
import { useCircuitStore } from '@/stores/circuitStore'
import type { Tool } from '@/types/editor'

const store = useCircuitStore()

interface ToolDef {
  id: Tool
  label: string
  shortcut: string
}

const tools: ToolDef[] = [
  { id: 'select', label: 'Selecionar', shortcut: 'V' },
  { id: 'wire', label: 'Fio / corrente', shortcut: 'W' },
  { id: 'resistor', label: 'Resistor', shortcut: 'R' },
  { id: 'voltage-source', label: 'Fonte de tensão', shortcut: 'B' },
  { id: 'switch', label: 'Chave (duplo-clique abre/fecha)', shortcut: 'S' },
]
</script>

<template>
  <div class="palette" role="toolbar" aria-label="Ferramentas">
    <button
      v-for="tool in tools"
      :key="tool.id"
      class="palette__tool"
      :class="{ 'palette__tool--active': store.activeTool === tool.id }"
      :title="`${tool.label} — ${tool.shortcut}`"
      :aria-pressed="store.activeTool === tool.id"
      @click="store.setTool(tool.id)"
    >
      <!-- Selecionar -->
      <svg v-if="tool.id === 'select'" viewBox="0 0 24 24" class="palette__icon">
        <path d="M5 3l6 16 2.2-6.2L19 11z" fill="currentColor" stroke="none" />
      </svg>
      <!-- Fio -->
      <svg v-else-if="tool.id === 'wire'" viewBox="0 0 24 24" class="palette__icon">
        <line x1="5" y1="19" x2="19" y2="5" />
        <circle cx="5" cy="19" r="1.8" fill="currentColor" stroke="none" />
        <circle cx="19" cy="5" r="1.8" fill="currentColor" stroke="none" />
      </svg>
      <!-- Resistor -->
      <svg v-else-if="tool.id === 'resistor'" viewBox="0 0 24 24" class="palette__icon">
        <path d="M2 12h3l2-5 3 10 3-10 3 10 2-5h3" />
      </svg>
      <!-- Fonte -->
      <svg v-else-if="tool.id === 'voltage-source'" viewBox="0 0 24 24" class="palette__icon">
        <line x1="3" y1="12" x2="9" y2="12" />
        <line x1="9" y1="4" x2="9" y2="20" />
        <line x1="14" y1="8" x2="14" y2="16" stroke-width="3" />
        <line x1="14" y1="12" x2="21" y2="12" />
      </svg>
      <!-- Chave (aberta) -->
      <svg v-else viewBox="0 0 24 24" class="palette__icon">
        <line x1="3" y1="16" x2="8" y2="16" />
        <line x1="8" y1="16" x2="16" y2="8" />
        <line x1="16" y1="16" x2="21" y2="16" />
        <circle cx="8" cy="16" r="1.6" fill="currentColor" stroke="none" />
        <circle cx="16" cy="16" r="1.6" fill="currentColor" stroke="none" />
      </svg>
      <span class="palette__shortcut">{{ tool.shortcut }}</span>
    </button>
  </div>
</template>

<style scoped>
.palette {
  display: flex;
  gap: 4px;
  padding: 6px;
  background: #fff;
  border: 1px solid #e6e6e6;
  border-radius: 12px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
}

.palette__tool {
  position: relative;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: #1e1e1e;
  cursor: pointer;
}

.palette__tool:hover {
  background: #f1f0ff;
}

.palette__tool--active {
  background: #e0dfff;
  color: #4a42c9;
}

.palette__icon {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.palette__shortcut {
  position: absolute;
  right: 3px;
  bottom: 1px;
  font-size: 9px;
  line-height: 1;
  color: #9a9a9a;
}
</style>
