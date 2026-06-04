<script setup lang="ts">
// Paleta de componentes — fonte de origem do drag-and-drop.
// Lista os tipos de componente disponíveis (fonte, resistor, fio, chave).
// TODO: renderizar itens arrastáveis e iniciar o drag para o canvas.
</script>

<template>
  <aside class="component-palette">
    <h2 class="component-palette__title">Componentes</h2>
    <ul class="component-palette__list">
      <!-- TODO: itens arrastáveis por ComponentKind -->
    </ul>
  </aside>
</template>

<style scoped>
.component-palette {
  border-right: 1px solid #ddd;
  padding: 0.5rem;
}
</style>
