<script setup lang="ts">
// Editor visual — canvas interativo.
// Responsável por: drag-and-drop, paleta, snap-to-grid e desenho do circuito.
// TODO: implementar render no <canvas> e interações de edição.
</script>

<template>
  <section class="canvas-editor">
    <canvas ref="canvasRef" class="canvas-editor__surface" />
  </section>
</template>

<style scoped>
.canvas-editor {
  position: relative;
  overflow: hidden;
}

.canvas-editor__surface {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
