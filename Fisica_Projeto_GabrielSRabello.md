# CircuitLab — Simulador em Canvas de Circuitos Elétricos

**Discente:** Gabriel Shimada Rabello  
**Docente:** Leandro Oliveira do Nascimento  
**Disciplina:** Física para Computação  
**Data:** 27/05/2026

---

## 1. Identificação

- **Título:** CircuitLab — Simulador em Canvas de Circuitos Elétricos
- **Objetivo geral:** Desenvolver uma aplicação web interativa que permita ao usuário montar circuitos elétricos dinamicamente e visualizar os cálculos em tempo real.
- **Funcionamento:** Interação em um canvas, que só precisa de um navegador para funcionar. Circuitos serão montados pelo usuário a partir dos componentes fornecidos e, a partir disso, cálculos em tempo real serão feitos e exibidos em tela.

## 2. Escopo Funcional

### Elementos suportados

- Fonte de tensão (bateria DC)
- Resistores (valor configurável)
- Fio condutor / nó de conexão
- Chave (liga/desliga)

### Topologias

- Circuito em série
- Circuito paralelo
- Circuitos mistos (série + paralelo aninhados)

### Cálculos em tempo real

| Grandeza | Base teórica |
| --- | --- |
| Tensão por elemento | Lei de Ohm / divisor de tensão |
| Corrente por ramo | Lei de Ohm / divisor de corrente |
| Resistência equivalente | Redução série/paralelo |
| Potência dissipada | P = V·I |
| Outros…? | |

## 3. Elementos Propostos

| Camada | Componente | Responsabilidade |
| --- | --- | --- |
| Editor Visual | Canvas interativo | Drag-and-drop, paleta, snap-to-grid |
| | Painel de resultados | Exibe V, I, R, P por componente |
| Motor de Simulação | Montador MNA | Monta a matriz Ax = b por nó |
| | Solver linear | Resolve o sistema, emite V/I nodais |
| Modelo de Circuito | Grafo elétrico | Nós e arestas com propriedades |
| | Validador | Curto, aberto, componente solto |

**Stack planejada:**

- **UI:** HTML5 + TypeScript + Vue.js
- **Motor de simulação:** TypeScript
- **Sem backend** (aplicação no navegador é suficiente para o escopo)

**Algoritmo central — Modified Nodal Analysis (MNA)**

A simulação resolve o sistema linear `Ax = b` onde:

- `A` = matriz de condutâncias
- `x` = vetor de tensões nodais e correntes de fontes
- `b` = vetor de excitações

Isso garante que circuitos arbitrários (não apenas série/paralelo puros) sejam resolvidos corretamente.

## 4. Módulos do Sistema

- **Editor visual** — canvas interativo com paleta de componentes, drag-and-drop, snap-to-grid
- **Grafo elétrico** — representação interna como grafo dirigido (nós + arestas com propriedades)
- **Motor MNA** — monta e resolve o sistema linear a cada mudança no circuito
- **Painel de resultados** — exibe V, I, R, P por componente em tempo real
- **Validação** — detecta circuito aberto, curto-circuito, componentes desconectados

## 5. Diferenciais Didáticos Extras

Estes pontos extras tentarei entregar em ordem, a depender do avanço dos pontos essenciais do projeto:

- Highlighting do caminho da corrente (animação de fluxo)
- Modo passo a passo: exibe a resolução da equação nodal
- Tooltip explicativo sobre cada cálculo ("por que essa tensão?")
- Suporte a capacitores (complica os cálculos)
- Preset de exemplos clássicos (divisor de tensão, ponte de Wheatstone)
