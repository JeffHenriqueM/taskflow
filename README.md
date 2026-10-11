# TaskFlow & Timer — Gerenciador de Tarefas com Cronômetro e Subtarefas

Aplicação web moderna, leve e intuitiva para gerenciamento de tarefas, monitoramento de tempo por tarefa e controle de subtarefas.

## 🚀 Acesso Online
Acesse diretamente no GitHub Pages:
👉 **[https://jeffhenriquem.github.io/taskflow/](https://jeffhenriquem.github.io/taskflow/)**

Ou execute localmente abrindo o arquivo `index.html` no seu navegador.

---

## ⚡ Principais Recursos

1. **Rotina Diária Recorrente & Histórico**:
   - As tarefas se repetem todos os dias como rotina/hábitos.
   - **Histórico dos Dias Anteriores**: armazena o que foi concluído (✅) e o que ficou pendente/não realizado (❌) em cada dia.
   - **Virada do Dia Automática & Manual**: detecta a mudança de data à meia-noite e disponibiliza o botão **"Fechar o Dia"** para arquivar o dia e reiniciar a rotina para o próximo.
   - Estatísticas analíticas por dia (% de conclusão, tempo total trabalhado e detalhamento de tarefas).

2. **Gestão Completa de Tarefas**:
   - Criação de tarefas com título, descrição, categoria (ex.: *FIAS*, *TikTok*, *Villamor*, etc.) e prioridade (*Baixa*, *Média*, *Alta*, *Urgente*).
   - Checkbox para marcar tarefas como concluídas ou reabri-las.
   - Filtros rápidos: *Todas*, *Pendentes* e *Concluídas*.
   - Barra de busca instantânea por título, descrição, categoria ou subtarefa.

3. **Cronômetro / Timer Integrado por Tarefa**:
   - Botões de **Iniciar (▶)**, **Pausar (⏸)** e **Zerar (↺)** dedicados para cada tarefa.
   - Cálculo preciso baseado em *timestamps*: não perde a contagem se você recarregar a página ou fechar o navegador.
   - Banner de destaque no topo mostrando a tarefa ativa no momento e o tempo corrido.
   - Resumo do tempo total acumulado em todas as tarefas.

4. **Subtarefas e Progresso**:
   - Adicione subtarefas já no momento da criação ou diretamente no card da tarefa.
   - Marque subtarefas concluídas individualmente.
   - Barra de progresso dinâmica com percentual de conclusão das subtarefas.

5. **Armazenamento e Backup**:
   - Salvamento automático contínuo no `localStorage`.
   - Botões para **Exportar** e **Importar** backups completos em formato `.json` (com tarefas e histórico).
