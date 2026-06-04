<script setup lang="ts">
// Layout raiz da aplicação.
// Compõe a paleta de componentes, o editor em canvas e o painel de resultados.
import ComponentPalette from './components/editor/ComponentPalette.vue'
import CanvasEditor from './components/editor/CanvasEditor.vue'
import ResultsPanel from './components/results/ResultsPanel.vue'
</script>

<template>
  <div class="app-shell">
    <header class="app-shell__header">
      <h1>CircuitLab</h1>
    </header>

    <main class="app-shell__body">
      <ComponentPalette class="app-shell__palette" />
      <CanvasEditor class="app-shell__canvas" />
      <ResultsPanel class="app-shell__results" />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.app-shell__body {
  display: grid;
  grid-template-columns: auto 1fr auto;
  flex: 1;
  min-height: 0;
}
</style>
