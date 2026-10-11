// TaskFlow & Timer - Gerenciador de Tarefas com Timer e Subtarefas
// Armazenamento local com sincronização automática e controle por timestamp

const STORAGE_KEY = 'taskflow_data_v2';

// 12 Tarefas Padrão Solicitadas
const INITIAL_DEFAULT_TASKS = [
  {
    id: 'task_artsivo',
    title: 'Artsivo',
    category: 'Geral',
    priority: 'alta',
    description: 'Demandas e acompanhamento estratégico da Artsivo.',
    completed: false,
    createdAt: Date.now() - 110000,
    elapsedSeconds: 0,
    isRunning: false,
    timerStartedAt: null,
    subtasks: []
  },
  {
    id: 'task_transicao',
    title: 'Transição',
    category: 'Gestão',
    priority: 'alta',
    description: 'Processo de transição e alinhamento de fluxos operacionais.',
    completed: false,
    createdAt: Date.now() - 100000,
    elapsedSeconds: 0,
    isRunning: false,
    timerStartedAt: null,
    subtasks: []
  },
  {
    id: 'task_gravacao_tiktok',
    title: 'Gravação tiktok',
    category: 'TikTok',
    priority: 'media',
    description: 'Roteirização, gravação e produção de vídeos para o TikTok.',
    completed: false,
    createdAt: Date.now() - 90000,
    elapsedSeconds: 0,
    isRunning: false,
    timerStartedAt: null,
    subtasks: []
  },
  {
    id: 'task_ingles',
    title: 'Inglês',
    category: 'Desenvolvimento',
    priority: 'media',
    description: 'Estudo diário, conversação e expansão de vocabulário.',
    completed: false,
    createdAt: Date.now() - 80000,
    elapsedSeconds: 0,
    isRunning: false,
    timerStartedAt: null,
    subtasks: []
  },
  {
    id: 'task_estudar_tiktok',
    title: 'Estudar TikTok',
    category: 'TikTok',
    priority: 'media',
    description: 'Análise de tendências, métricas do TikTok Shop e novos formatos.',
    completed: false,
    createdAt: Date.now() - 70000,
    elapsedSeconds: 0,
    isRunning: false,
    timerStartedAt: null,
    subtasks: []
  },
  {
    id: 'task_fias_loja',
    title: 'Fias loja',
    category: 'FIAS',
    priority: 'baixa',
    description: 'Gestão de catálogo, pedidos e estrutura da loja FIAS.',
    completed: false,
    createdAt: Date.now() - 60000,
    elapsedSeconds: 0,
    isRunning: false,
    timerStartedAt: null,
    subtasks: []
  },
  {
    id: 'task_fias_site',
    title: 'Fias site',
    category: 'FIAS',
    priority: 'baixa',
    description: 'Atualizações técnicas, páginas de conversão e melhorias no site.',
    completed: false,
    createdAt: Date.now() - 50000,
    elapsedSeconds: 0,
    isRunning: false,
    timerStartedAt: null,
    subtasks: []
  },
  {
    id: 'task_fias_marketing',
    title: 'Fias Marketing',
    category: 'FIAS',
    priority: 'media',
    description: 'Campanhas de tráfego, anúncios, criativos e estratégias comerciais.',
    completed: false,
    createdAt: Date.now() - 40000,
    elapsedSeconds: 0,
    isRunning: false,
    timerStartedAt: null,
    subtasks: []
  },
  {
    id: 'task_sistema_esolution',
    title: 'Sistema Esolution',
    category: 'Villamor',
    priority: 'media',
    description: 'Rotinas operacionais, relatórios e gestão no sistema Esolution.',
    completed: false,
    createdAt: Date.now() - 30000,
    elapsedSeconds: 0,
    isRunning: false,
    timerStartedAt: null,
    subtasks: []
  },
  {
    id: 'task_alimentacao',
    title: 'Alimentação',
    category: 'Saúde',
    priority: 'alta',
    description: 'Horários de refeições, planejamento alimentar e rotina saudável.',
    completed: false,
    createdAt: Date.now() - 20000,
    elapsedSeconds: 0,
    isRunning: false,
    timerStartedAt: null,
    subtasks: []
  },
  {
    id: 'task_lazer',
    title: 'Lazer',
    category: 'Pessoal',
    priority: 'media',
    description: 'Momentos de descanso, hobbies e recarga de energia.',
    completed: false,
    createdAt: Date.now() - 10000,
    elapsedSeconds: 0,
    isRunning: false,
    timerStartedAt: null,
    subtasks: []
  },
  {
    id: 'task_investimentos',
    title: 'Investimentos',
    category: 'Finanças',
    priority: 'baixa',
    description: 'Acompanhamento de aportes, carteira e planejamento financeiro.',
    completed: false,
    createdAt: Date.now() - 5000,
    elapsedSeconds: 0,
    isRunning: false,
    timerStartedAt: null,
    subtasks: []
  }
];

// Estado da Aplicação
let tasks = [];
let initialSubtasks = [];
let activeFilter = 'all';
let searchQuery = '';

// Elementos DOM
const taskForm = document.getElementById('taskForm');
const taskTitleInput = document.getElementById('taskTitle');
const taskCategoryInput = document.getElementById('taskCategory');
const taskPrioritySelect = document.getElementById('taskPriority');
const taskDescriptionInput = document.getElementById('taskDescription');
const initialSubtaskInput = document.getElementById('initialSubtaskInput');
const btnAddInitialSubtask = document.getElementById('btnAddInitialSubtask');
const initialSubtasksList = document.getElementById('initialSubtasksList');

const tasksContainer = document.getElementById('tasksContainer');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.filter-btn');

const statTotalTasks = document.getElementById('statTotalTasks');
const statPendingTasks = document.getElementById('statPendingTasks');
const statCompletedTasks = document.getElementById('statCompletedTasks');
const statTotalTime = document.getElementById('statTotalTime');

const activeTimerBanner = document.getElementById('activeTimerBanner');
const activeTaskTitle = document.getElementById('activeTaskTitle');
const activeTaskTime = document.getElementById('activeTaskTime');
const btnPauseActiveTimer = document.getElementById('btnPauseActiveTimer');

const btnExport = document.getElementById('btnExport');
const importInput = document.getElementById('importInput');
const btnResetDefaults = document.getElementById('btnResetDefaults');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  loadTasks();
  setupEventListeners();
  render();
  startGlobalTicker();
});

// Carregar e Salvar Dados
function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      tasks = JSON.parse(raw);
    } else {
      // Carrega as 12 tarefas padrão
      tasks = JSON.parse(JSON.stringify(INITIAL_DEFAULT_TASKS));
      saveTasks();
    }
  } catch (e) {
    console.error('Erro ao carregar dados do localStorage:', e);
    tasks = JSON.parse(JSON.stringify(INITIAL_DEFAULT_TASKS));
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Erro ao salvar tarefas:', e);
  }
}

function generateId() {
  return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}

// Configurar Listeners
function setupEventListeners() {
  // Subtarefas no formulário de criação
  btnAddInitialSubtask.addEventListener('click', addInitialSubtask);
  initialSubtaskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addInitialSubtask();
    }
  });

  // Submissão do formulário
  taskForm.addEventListener('submit', handleCreateTask);

  // Filtros
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      renderTasks();
    });
  });

  // Busca
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderTasks();
  });

  // Pausar do banner ativo
  btnPauseActiveTimer.addEventListener('click', () => {
    const runningTask = tasks.find(t => t.isRunning);
    if (runningTask) {
      pauseTimer(runningTask.id);
    }
  });

  // Exportar / Importar / Resetar
  btnExport.addEventListener('click', exportData);
  importInput.addEventListener('change', importData);
  if (btnResetDefaults) {
    btnResetDefaults.addEventListener('click', () => {
      if (confirm('Deseja recarregar as 12 tarefas padrão? Isso substituirá as alterações não salvas em backup.')) {
        tasks = JSON.parse(JSON.stringify(INITIAL_DEFAULT_TASKS));
        saveTasks();
        render();
      }
    });
  }
}

// Manipulação do Formulário
function addInitialSubtask() {
  const text = initialSubtaskInput.value.trim();
  if (!text) return;

  initialSubtasks.push({
    id: generateId(),
    title: text,
    completed: false
  });
  initialSubtaskInput.value = '';
  renderInitialSubtasksChips();
}

function removeInitialSubtask(index) {
  initialSubtasks.splice(index, 1);
  renderInitialSubtasksChips();
}

function renderInitialSubtasksChips() {
  initialSubtasksList.innerHTML = initialSubtasks.map((st, i) => `
    <span class="subtask-chip">
      <span>${escapeHtml(st.title)}</span>
      <button type="button" onclick="removeInitialSubtask(${i})" title="Remover">&times;</button>
    </span>
  `).join('');
}

function handleCreateTask(e) {
  e.preventDefault();
  const title = taskTitleInput.value.trim();
  if (!title) return;

  const newTask = {
    id: generateId(),
    title: title,
    category: taskCategoryInput.value.trim(),
    priority: taskPrioritySelect.value || 'media',
    description: taskDescriptionInput.value.trim(),
    completed: false,
    createdAt: Date.now(),
    elapsedSeconds: 0,
    isRunning: false,
    timerStartedAt: null,
    subtasks: [...initialSubtasks]
  };

  tasks.unshift(newTask);
  saveTasks();

  // Reset form
  taskForm.reset();
  initialSubtasks = [];
  renderInitialSubtasksChips();

  render();
}

// Controle do Timer
function startTimer(taskId) {
  const now = Date.now();
  
  // Pausa qualquer outro timer rodando para manter rastreamento único e preciso
  tasks.forEach(t => {
    if (t.isRunning && t.id !== taskId) {
      const added = Math.floor((now - t.timerStartedAt) / 1000);
      t.elapsedSeconds += Math.max(0, added);
      t.isRunning = false;
      t.timerStartedAt = null;
    }
  });

  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.isRunning = true;
    task.timerStartedAt = now;
  }

  saveTasks();
  render();
}

function pauseTimer(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (task && task.isRunning) {
    const now = Date.now();
    const added = Math.floor((now - task.timerStartedAt) / 1000);
    task.elapsedSeconds += Math.max(0, added);
    task.isRunning = false;
    task.timerStartedAt = null;
    saveTasks();
    render();
  }
}

function resetTimer(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    if (confirm(`Deseja zerar o cronômetro da tarefa "${task.title}"?`)) {
      task.elapsedSeconds = 0;
      task.isRunning = false;
      task.timerStartedAt = null;
      saveTasks();
      render();
    }
  }
}

// Obter tempo total atual de uma tarefa em segundos
function getTaskCurrentSeconds(task) {
  let total = task.elapsedSeconds || 0;
  if (task.isRunning && task.timerStartedAt) {
    total += Math.floor((Date.now() - task.timerStartedAt) / 1000);
  }
  return total;
}

// Formatação de Tempo
function formatTimeHMS(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

function formatReadableTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  return `${hrs}h ${mins}m`;
}

function formatPriorityLabel(p) {
  switch (p) {
    case 'alta': return 'Alta';
    case 'urgente': return 'Urgente';
    case 'baixa': return 'Baixa';
    case 'media':
    default: return 'Média';
  }
}

// Ticker Global (Atualiza displays a cada 1 segundo)
function startGlobalTicker() {
  setInterval(() => {
    const runningTask = tasks.find(t => t.isRunning);
    if (!runningTask) {
      activeTimerBanner.classList.add('hidden');
      return;
    }

    // Atualiza banner ativo
    activeTimerBanner.classList.remove('hidden');
    activeTaskTitle.textContent = runningTask.title;
    const currentSecs = getTaskCurrentSeconds(runningTask);
    activeTaskTime.textContent = formatTimeHMS(currentSecs);

    // Atualiza o display no card da tarefa sem re-renderizar todo o DOM
    const timerDisplayEl = document.getElementById(`timer-display-${runningTask.id}`);
    if (timerDisplayEl) {
      timerDisplayEl.textContent = formatTimeHMS(currentSecs);
    }

    // Atualiza métrica total
    updateMetrics();
  }, 1000);
}

// Operações de Tarefas
function toggleTaskCompletion(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.completed = !task.completed;
    if (task.completed && task.isRunning) {
      pauseTimer(taskId);
    }
    saveTasks();
    render();
  }
}

function deleteTask(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (task && confirm(`Excluir a tarefa "${task.title}" e todas as suas subtarefas?`)) {
    tasks = tasks.filter(t => t.id !== taskId);
    saveTasks();
    render();
  }
}

// Operações de Subtarefas
function toggleSubtask(taskId, subtaskId) {
  const task = tasks.find(t => t.id === taskId);
  if (task && task.subtasks) {
    const subtask = task.subtasks.find(st => st.id === subtaskId);
    if (subtask) {
      subtask.completed = !subtask.completed;
      saveTasks();
      render();
    }
  }
}

function addSubtaskToTask(taskId, inputEl) {
  const title = inputEl.value.trim();
  if (!title) return;

  const task = tasks.find(t => t.id === taskId);
  if (task) {
    if (!task.subtasks) task.subtasks = [];
    task.subtasks.push({
      id: generateId(),
      title: title,
      completed: false
    });
    inputEl.value = '';
    saveTasks();
    render();
  }
}

function removeSubtaskFromTask(taskId, subtaskId) {
  const task = tasks.find(t => t.id === taskId);
  if (task && task.subtasks) {
    task.subtasks = task.subtasks.filter(st => st.id !== subtaskId);
    saveTasks();
    render();
  }
}

// Renderização Geral
function render() {
  updateMetrics();
  renderTasks();
}

function updateMetrics() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;

  let totalSecs = 0;
  tasks.forEach(t => {
    totalSecs += getTaskCurrentSeconds(t);
  });

  statTotalTasks.textContent = total;
  statPendingTasks.textContent = pending;
  statCompletedTasks.textContent = completed;
  statTotalTime.textContent = formatReadableTime(totalSecs);
}

function renderTasks() {
  const filtered = tasks.filter(task => {
    // Filtro por status
    if (activeFilter === 'pending' && task.completed) return false;
    if (activeFilter === 'completed' && !task.completed) return false;

    // Filtro por busca
    if (searchQuery) {
      const matchTitle = task.title.toLowerCase().includes(searchQuery);
      const matchDesc = (task.description || '').toLowerCase().includes(searchQuery);
      const matchCat = (task.category || '').toLowerCase().includes(searchQuery);
      const matchSub = (task.subtasks || []).some(st => st.title.toLowerCase().includes(searchQuery));
      return matchTitle || matchDesc || matchCat || matchSub;
    }

    return true;
  });

  if (filtered.length === 0) {
    tasksContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>Nenhuma tarefa encontrada</h3>
        <p>Crie uma nova tarefa acima ou ajuste seus filtros de busca.</p>
      </div>
    `;
    return;
  }

  tasksContainer.innerHTML = filtered.map(task => {
    const isRunning = task.isRunning;
    const currentSeconds = getTaskCurrentSeconds(task);
    const timeFormatted = formatTimeHMS(currentSeconds);

    const subtasks = task.subtasks || [];
    const totalSub = subtasks.length;
    const completedSub = subtasks.filter(st => st.completed).length;
    const percentSub = totalSub > 0 ? Math.round((completedSub / totalSub) * 100) : 0;
    const priorityKey = task.priority || 'media';

    return `
      <div class="task-card ${task.completed ? 'completed' : ''} ${isRunning ? 'is-running' : ''}" id="task-card-${task.id}">
        <!-- Header da Tarefa -->
        <div class="task-card-header">
          <div class="task-main-info">
            <input 
              type="checkbox" 
              class="task-checkbox" 
              ${task.completed ? 'checked' : ''} 
              onchange="toggleTaskCompletion('${task.id}')"
              title="Marcar como concluída"
            >
            <div class="task-text-group">
              <span class="task-title">${escapeHtml(task.title)}</span>
              ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
              <div class="task-meta-tags">
                ${task.category ? `<span class="badge badge-category">📁 ${escapeHtml(task.category)}</span>` : ''}
                <span class="badge badge-priority-${priorityKey}">${formatPriorityLabel(priorityKey)}</span>
                ${totalSub > 0 ? `<span class="badge" style="background: rgba(148,163,184,0.15); color: #cbd5e1;">📋 ${completedSub}/${totalSub} subtarefas</span>` : ''}
              </div>
            </div>
          </div>

          <!-- Timer Widget -->
          <div class="task-timer-area">
            <span class="timer-digits ${isRunning ? 'running' : ''}" id="timer-display-${task.id}">
              ${timeFormatted}
            </span>
            <div class="timer-btns">
              ${isRunning ? `
                <button class="btn btn-warning btn-sm" onclick="pauseTimer('${task.id}')" title="Pausar Timer">
                  ⏸ Pausar
                </button>
              ` : `
                <button class="btn btn-success btn-sm" onclick="startTimer('${task.id}')" title="Iniciar Timer">
                  ▶ Iniciar
                </button>
              `}
              <button class="btn btn-secondary btn-sm" onclick="resetTimer('${task.id}')" title="Zerar Timer">
                ↺
              </button>
            </div>
            <div class="task-actions">
              <button class="btn-icon" onclick="deleteTask('${task.id}')" title="Excluir Tarefa">
                🗑
              </button>
            </div>
          </div>
        </div>

        <!-- Seção de Subtarefas -->
        <div class="subtasks-progress-wrapper">
          ${totalSub > 0 ? `
            <div class="progress-header">
              <span>Progresso das subtarefas</span>
              <span>${completedSub} de ${totalSub} (${percentSub}%)</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${percentSub}%;"></div>
            </div>
          ` : ''}

          <div class="subtasks-section">
            ${subtasks.map(st => `
              <div class="subtask-item ${st.completed ? 'completed' : ''}">
                <div class="subtask-item-left">
                  <input 
                    type="checkbox" 
                    class="subtask-checkbox" 
                    ${st.completed ? 'checked' : ''} 
                    onchange="toggleSubtask('${task.id}', '${st.id}')"
                  >
                  <span class="subtask-title">${escapeHtml(st.title)}</span>
                </div>
                <button class="btn-remove-subtask" onclick="removeSubtaskFromTask('${task.id}', '${st.id}')" title="Excluir subtarefa">
                  &times;
                </button>
              </div>
            `).join('')}

            <!-- Formulário para adicionar subtarefa inline -->
            <div class="add-subtask-form">
              <input 
                type="text" 
                id="input-new-subtask-${task.id}" 
                placeholder="+ Adicionar subtarefa e pressionar Enter"
                onkeydown="if(event.key==='Enter'){ addSubtaskToTask('${task.id}', this); }"
              >
              <button 
                type="button" 
                class="btn btn-secondary btn-sm" 
                onclick="addSubtaskToTask('${task.id}', document.getElementById('input-new-subtask-${task.id}'))"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Backup & Restauração
function exportData() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `taskflow_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function importData(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const imported = JSON.parse(event.target.result);
      if (Array.isArray(imported)) {
        if (confirm(`Substituir dados atuais por ${imported.length} tarefas importadas?`)) {
          tasks = imported;
          saveTasks();
          render();
          alert('Tarefas importadas com sucesso!');
        }
      } else {
        alert('Formato de arquivo JSON inválido.');
      }
    } catch (err) {
      alert('Erro ao ler o arquivo JSON: ' + err.message);
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

// Utilitários
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
