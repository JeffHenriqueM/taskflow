# TaskFlow & Timer — Gerenciador de Tarefas com Cronômetro e Subtarefas

Aplicação web moderna, leve e intuitiva para gerenciamento de tarefas, monitoramento de tempo por tarefa e controle de subtarefas.

## 🚀 Como Executar

Basta abrir o arquivo `index.html` em qualquer navegador (Safari, Google Chrome, etc.):

- **Caminho do arquivo**: `file:///Users/jeffersonhenrique/Documents/Gemini/gerenciador-tarefas/index.html`
- **Ou dê dois cliques no arquivo `index.html` no Finder**.

---

## ⚡ Principais Recursos

1. **Gestão Completa de Tarefas**:
   - Criação de tarefas com título, descrição, categoria (ex.: *FIAS*, *Villamor*, etc.) e prioridade (*Normal*, *Alta*, *Urgente*).
   - Checkbox para marcar tarefas como concluídas ou reabri-las.
   - Filtros rápidos: *Todas*, *Pendentes* e *Concluídas*.
   - Barra de busca instantânea por título, descrição, categoria ou subtarefa.

2. **Cronômetro / Timer Integrado por Tarefa**:
   - Botões de **Iniciar (▶)**, **Pausar (⏸)** e **Zerar (↺)** dedicados para cada tarefa.
   - Cálculo preciso baseado em *timestamps*: não perde a contagem se você recarregar a página ou fechar o navegador.
   - Banner de destaque no topo mostrando a tarefa ativa no momento e o tempo corrido.
   - Resumo do tempo total acumulado em todas as tarefas.

3. **Subtarefas e Progresso**:
   - Adicione subtarefas já no momento da criação ou diretamente no card da tarefa.
   - Marque subtarefas concluídas individualmente.
   - Barra de progresso dinâmica com percentual de conclusão das subtarefas.

4. **Armazenamento e Backup**:
   - Salvamento automático contínuo no `localStorage`.
   - Botões para **Exportar** e **Importar** backups em formato `.json`.
