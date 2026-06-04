<script setup lang="ts">
// Editor visual — superfície de desenho. Toda a interação (criar, mover,
// redimensionar) e a renderização vivem no composable useCanvasEditor. Aqui
// também é montado o pequeno diálogo de rótulo de terminal.
import { computed, nextTick, ref, watch } from 'vue'

import { useCanvasEditor } from '@/composables/useCanvasEditor'

const { canvasRef, labelEditor, commitLabel, cancelLabel } = useCanvasEditor()

const inputRef = ref<HTMLInputElement | null>(null)
const labelText = ref('')

// Ao abrir o diálogo, semeia o campo e foca/seleciona o texto.
watch(labelEditor, async (editor) => {
  if (!editor) return
  labelText.value = editor.value
  await nextTick()
  inputRef.value?.focus()
  inputRef.value?.select()
})

const dialogStyle = computed(() =>
  labelEditor.value
    ? { left: `${labelEditor.value.x}px`, top: `${labelEditor.value.y}px` }
    : undefined,
)

function onCommit(): void {
  commitLabel(labelText.value)
}
</script>

<template>
  <div class="canvas-editor">
    <canvas ref="canvasRef" class="canvas-editor__surface" />

    <div v-if="labelEditor" class="label-dialog" :style="dialogStyle">
      <input
        ref="inputRef"
        v-model="labelText"
        class="label-dialog__input"
        type="text"
        maxlength="3"
        placeholder="A1"
        aria-label="Rótulo do terminal"
        @keydown.enter.prevent="onCommit"
        @keydown.esc.prevent="cancelLabel"
        @blur="onCommit"
      />
    </div>
  </div>
</template>

<style scoped>
.canvas-editor {
  position: absolute;
  inset: 0;
}

.canvas-editor__surface {
  display: block;
  width: 100%;
  height: 100%;
  background: #fff;
  /* Garante que o arraste no canvas não role/zoome a página. */
  touch-action: none;
}

.label-dialog {
  position: absolute;
  /* Aparece logo acima da ponta, centralizado nela. */
  transform: translate(-50%, calc(-100% - 12px));
  padding: 4px;
  background: #fff;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
}

.label-dialog__input {
  width: 48px;
  padding: 4px 6px;
  border: 1px solid #d6d4ff;
  border-radius: 5px;
  font: 600 13px system-ui, sans-serif;
  color: #1e1e1e;
  text-align: center;
  outline: none;
}

.label-dialog__input:focus {
  border-color: #6965db;
}
</style>
