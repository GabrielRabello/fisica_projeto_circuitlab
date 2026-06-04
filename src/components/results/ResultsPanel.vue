<script setup lang="ts">
// Painel de resultados — exibirá V, I, R, P por componente em tempo real,
// além do relatório de validação. Os cálculos ainda não foram implementados.
// TODO: ler result/validation do circuitStore e renderizar as grandezas.
</script>

<template>
  <aside class="results-panel">
    <h2 class="results-panel__title">Resultados</h2>
    <p class="results-panel__hint">Os cálculos do circuito ainda não foram implementados.</p>
  </aside>
</template>

<style scoped>
.results-panel {
  width: 15rem;
  padding: 12px 14px;
  background: #fff;
  border: 1px solid #e6e6e6;
  border-radius: 12px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
}

.results-panel__title {
  margin: 0 0 6px;
  font-size: 0.95rem;
}

.results-panel__hint {
  margin: 0;
  font-size: 0.8rem;
  color: #888;
}
</style>
