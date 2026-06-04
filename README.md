# CircuitLab — Simulador em Canvas de Circuitos Elétricos

Aplicação web interativa para montar circuitos elétricos em um canvas e
visualizar os cálculos (tensão, corrente, resistência e potência) em tempo
real. Projeto da disciplina **Física para Computação** (UFPA).

## Stack

- **Vue 3** (Composition API, `<script setup>`)
- **Vite** + **TypeScript**
- **Pinia** para gerência de estado
- Sem backend — roda inteiramente no navegador

## Algoritmo central

A simulação resolve o sistema linear `Ax = b` via **Modified Nodal Analysis
(MNA)**, permitindo circuitos arbitrários (não apenas série/paralelo puros):

- `A` = matriz de condutâncias
- `x` = vetor de tensões nodais e correntes de fontes
- `b` = vetor de excitações

## Estrutura do projeto

```
src/
├── assets/styles/      # Estilos globais
├── components/
│   ├── editor/         # Editor Visual (canvas + paleta)
│   └── results/        # Painel de resultados
├── engine/             # Motor de Simulação (MNA assembler, solver, simulator)
├── model/              # Modelo de Circuito (grafo elétrico, validador)
├── stores/             # Estado compartilhado (Pinia)
├── types/              # Definições de tipos do domínio
├── App.vue
└── main.ts
```

As camadas seguem a arquitetura descrita no documento do projeto:

| Camada              | Responsabilidade                                  |
| ------------------- | ------------------------------------------------- |
| Editor Visual       | Drag-and-drop, paleta, snap-to-grid, resultados   |
| Motor de Simulação  | Monta a matriz `Ax = b` e resolve o sistema       |
| Modelo de Circuito  | Grafo elétrico e validação topológica             |

## Como rodar

```bash
npm install
npm run dev          # servidor de desenvolvimento
npm run build        # build de produção (type-check + bundle)
npm run type-check   # checagem de tipos
```

> **Status:** scaffolding inicial. A lógica de simulação, edição em canvas e
> validação ainda não foi implementada (ver `TODO` no código).
