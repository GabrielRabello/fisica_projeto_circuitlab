<script setup lang="ts">
// Layout raiz: canvas em tela cheia com a barra de ferramentas e o painel de
// resultados flutuando por cima (estética inspirada no Excalidraw).
import CanvasEditor from './components/editor/CanvasEditor.vue'
import ComponentPalette from './components/editor/ComponentPalette.vue'
import ResultsPanel from './components/results/ResultsPanel.vue'
</script>

<template>
  <div class="app">
    <CanvasEditor />
    <ComponentPalette class="app__toolbar" />
    <ResultsPanel class="app__results" />
  </div>
</template>

<style scoped>
.app {
  position: fixed;
  inset: 0;
  overflow: hidden;
}

.app__toolbar {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.app__results {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
}
</style>
