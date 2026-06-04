<script setup lang="ts">
// Painel de resultados — exibe V, I, R, P por componente em tempo real,
// além do relatório de validação do circuito.
// TODO: ler do circuitStore e renderizar as grandezas resolvidas.
</script>

<template>
  <aside class="results-panel">
    <h2 class="results-panel__title">Resultados</h2>
    <!-- TODO: tabela de grandezas por componente + avisos de validação -->
  </aside>
</template>

<style scoped>
.results-panel {
  border-left: 1px solid #ddd;
  padding: 0.5rem;
  min-width: 16rem;
}
</style>
