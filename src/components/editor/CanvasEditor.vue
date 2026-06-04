<script setup lang="ts">
// Editor visual — superfície de desenho. Toda a interação (criar, mover,
// redimensionar) e a renderização vivem no composable useCanvasEditor.
import { useCanvasEditor } from '@/composables/useCanvasEditor'

const { canvasRef } = useCanvasEditor()
</script>

<template>
  <div class="canvas-editor">
    <canvas ref="canvasRef" class="canvas-editor__surface" />
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
</style>
