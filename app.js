// TaskFlow & Timer - Gerenciador de Tarefas com Timer e Subtarefas
// Armazenamento local com sincronização automática e controle por timestamp

const STORAGE_KEY = 'taskflow_data_v2';
const HISTORY_STORAGE_KEY = 'taskflow_history_v1';
const ACTIVE_DATE_KEY = 'taskflow_active_date_v1';

// Configurações do Supabase
const SUPABASE_URL = 'https://disepmpblhwimmrhzpls.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_kwfjEi7ObItLBvA5A_3OEg_8UgvR1U_';
let supabaseClient = null;
let isSyncing = false;

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
let dailyHistory = {};
let activeDate = '';
let activeTab = 'today';
let openHistoryCards = new Set();
let initialSubtasks = [];
let activeFilter = 'all';
let searchQuery = '';

// Elementos DOM
const currentDayTitle = document.getElementById('currentDayTitle');
const tabToday = document.getElementById('tabToday');
const tabHistory = document.getElementById('tabHistory');
const historyBadge = document.getElementById('historyBadge');
const btnCompleteDay = document.getElementById('btnCompleteDay');

const todayView = document.getElementById('todayView');
const historyView = document.getElementById('historyView');
const historyListContainer = document.getElementById('historyListContainer');
const historyOverallBadge = document.getElementById('historyOverallBadge');

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
  loadData();
  setupEventListeners();
  setupTabSwitching();
  updateDateDisplay();
  render();
  renderHistory();
  startGlobalTicker();
  initSupabase();
});

// Funções de Data
function getTodayDateKey() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateDisplay(dateStr) {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const todayKey = getTodayDateKey();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    const formatted = dateObj.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const capitalized = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    if (dateStr === todayKey) return `Hoje — ${capitalized}`;
    if (dateStr === yKey) return `Ontem — ${capitalized}`;
    return capitalized;
  } catch (e) {
    return dateStr;
  }
}

function updateDateDisplay() {
  if (currentDayTitle) {
    const todayKey = getTodayDateKey();
    currentDayTitle.textContent = formatDateDisplay(todayKey);
  }
}

// Carregar e Salvar Dados
function loadData() {
  // 1. Carrega histórico
  try {
    const rawHist = localStorage.getItem(HISTORY_STORAGE_KEY);
    dailyHistory = rawHist ? JSON.parse(rawHist) : {};
  } catch (e) {
    dailyHistory = {};
  }

  // 2. Carrega tarefas da rotina
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      tasks = JSON.parse(raw);
    } else {
      tasks = JSON.parse(JSON.stringify(INITIAL_DEFAULT_TASKS));
      saveTasks();
    }
  } catch (e) {
    tasks = JSON.parse(JSON.stringify(INITIAL_DEFAULT_TASKS));
  }

  // 3. Verifica virada automática do dia (Rollover à meia-noite)
  const todayKey = getTodayDateKey();
  const storedActiveDate = localStorage.getItem(ACTIVE_DATE_KEY);

  if (storedActiveDate && storedActiveDate !== todayKey) {
    // Arquiva o dia anterior automaticamente
    archiveDay(storedActiveDate, false);
    // Reinicia as tarefas para o novo dia
    resetTasksForNewDay();
    activeDate = todayKey;
    localStorage.setItem(ACTIVE_DATE_KEY, activeDate);
  } else {
    activeDate = storedActiveDate || todayKey;
    localStorage.setItem(ACTIVE_DATE_KEY, activeDate);
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Erro ao salvar tarefas:', e);
  }
}

function saveHistory() {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(dailyHistory));
  } catch (e) {
    console.error('Erro ao salvar histórico:', e);
  }
}

function saveData() {
  saveTasks();
  saveHistory();
  localStorage.setItem(ACTIVE_DATE_KEY, activeDate);
}

function archiveDay(dateKey, isManual = false) {
  if (!tasks || tasks.length === 0) return;

  // Pausa cronômetros ativos
  tasks.forEach(t => {
    if (t.isRunning) {
      pauseTimer(t.id);
    }
  });

  const totalTasks = tasks.length;
  const completedCount = tasks.filter(t => t.completed).length;
  const pendingCount = totalTasks - completedCount;
  const percent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  let totalSeconds = 0;
  tasks.forEach(t => {
    totalSeconds += getTaskCurrentSeconds(t);
  });

  dailyHistory[dateKey] = {
    date: dateKey,
    dateDisplay: formatDateDisplay(dateKey),
    closedAt: Date.now(),
    isManual: isManual,
    totalTasks,
    completedCount,
    pendingCount,
    percent,
    totalSeconds,
    tasks: JSON.parse(JSON.stringify(tasks))
  };

  saveHistory();
  dbUpsertDailyHistory(dailyHistory[dateKey]);
}

function resetTasksForNewDay() {
  tasks = tasks.map(task => ({
    ...task,
    completed: false,
    elapsedSeconds: 0,
    isRunning: false,
    timerStartedAt: null,
    subtasks: (task.subtasks || []).map(st => ({
      ...st,
      completed: false
    }))
  }));
  saveTasks();
  dbSyncAllTasks();
}

function handleCloseDay() {
  const completedCount = tasks.filter(t => t.completed).length;
  const pendingCount = tasks.length - completedCount;

  const msg = `Deseja encerrar o dia de hoje (${formatDateDisplay(activeDate)})?\n\n` +
    `• ${completedCount} tarefas CONCLUÍDAS\n` +
    `• ${pendingCount} tarefas NÃO REALIZADAS / PENDENTES\n\n` +
    `O balanço deste dia será registrado no Histórico. As tarefas da rotina serão desmarcadas e os cronômetros zerados para a próxima rotina.`;

  if (confirm(msg)) {
    archiveDay(activeDate, true);
    resetTasksForNewDay();
    render();
    renderHistory();
    alert('Dia encerrado com sucesso! O relatório completo foi salvo no Histórico.');
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

  // Fechar o dia manualmente
  if (btnCompleteDay) {
    btnCompleteDay.addEventListener('click', handleCloseDay);
  }

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

// Alternância entre Hoje e Histórico
function setupTabSwitching() {
  if (tabToday) {
    tabToday.addEventListener('click', () => {
      activeTab = 'today';
      tabToday.classList.add('active');
      tabHistory.classList.remove('active');
      if (todayView) todayView.classList.remove('hidden');
      if (historyView) historyView.classList.add('hidden');
      render();
    });
  }

  if (tabHistory) {
    tabHistory.addEventListener('click', () => {
      activeTab = 'history';
      tabHistory.classList.add('active');
      tabToday.classList.remove('active');
      if (todayView) todayView.classList.add('hidden');
      if (historyView) historyView.classList.remove('hidden');
      renderHistory();
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
  dbUpsertTask(newTask);
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
      dbUpsertTask(t);
    }
  });

  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.isRunning = true;
    task.timerStartedAt = now;
    dbUpsertTask(task);
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
    dbUpsertTask(task);
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
      dbUpsertTask(task);
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
    dbUpsertTask(task);
  }
}

function deleteTask(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (task && confirm(`Excluir a tarefa "${task.title}" e todas as suas subtarefas?`)) {
    tasks = tasks.filter(t => t.id !== taskId);
    saveTasks();
    render();
    dbDeleteTask(taskId);
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
      dbUpsertTask(task);
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
    dbUpsertTask(task);
  }
}

function removeSubtaskFromTask(taskId, subtaskId) {
  const task = tasks.find(t => t.id === taskId);
  if (task && task.subtasks) {
    task.subtasks = task.subtasks.filter(st => st.id !== subtaskId);
    saveTasks();
    render();
    dbUpsertTask(task);
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
  if (historyBadge) {
    historyBadge.textContent = Object.keys(dailyHistory).length;
  }
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
  const payload = {
    version: '2.1',
    exportedAt: new Date().toISOString(),
    activeDate: activeDate,
    tasks: tasks,
    dailyHistory: dailyHistory
  };
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
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
        // Formato legado v2 (apenas tarefas)
        if (confirm(`Substituir dados atuais por ${imported.length} tarefas importadas?`)) {
          tasks = imported;
          saveTasks();
          render();
          alert('Tarefas importadas com sucesso!');
        }
      } else if (imported && Array.isArray(imported.tasks)) {
        // Formato v2.1 (com histórico)
        if (confirm(`Importar backup com ${imported.tasks.length} tarefas e histórico de dias?`)) {
          tasks = imported.tasks;
          if (imported.dailyHistory) {
            dailyHistory = { ...dailyHistory, ...imported.dailyHistory };
          }
          if (imported.activeDate) {
            activeDate = imported.activeDate;
          }
          saveData();
          render();
          renderHistory();
          alert('Backup com histórico importado com sucesso!');
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

// Renderização do Histórico Diário
function renderHistory() {
  if (!historyListContainer) return;
  const dates = Object.keys(dailyHistory).sort().reverse();
  if (historyBadge) {
    historyBadge.textContent = dates.length;
  }

  if (dates.length === 0) {
    historyListContainer.innerHTML = `
      <div class="history-empty-card">
        <div class="history-empty-icon">📜</div>
        <h3>Nenhum dia arquivado ainda</h3>
        <p>Ao clicar no botão <strong>"Fechar o Dia"</strong> ou automaticamente na virada da meia-noite, o balanço de tarefas realizadas e pendentes de cada dia ficará guardado aqui para seu controle.</p>
      </div>
    `;
    if (historyOverallBadge) {
      historyOverallBadge.innerHTML = `<span class="history-stat-tag">0 dias arquivados</span>`;
    }
    return;
  }

  // Estatísticas gerais
  let allTotal = 0;
  let allCompleted = 0;
  let allSeconds = 0;
  dates.forEach(d => {
    const entry = dailyHistory[d];
    allTotal += entry.totalTasks || 0;
    allCompleted += entry.completedCount || 0;
    allSeconds += entry.totalSeconds || 0;
  });
  const avgRate = allTotal > 0 ? Math.round((allCompleted / allTotal) * 100) : 0;

  if (historyOverallBadge) {
    historyOverallBadge.innerHTML = `
      <span class="history-stat-tag">📅 ${dates.length} ${dates.length === 1 ? 'dia arquivado' : 'dias arquivados'}</span>
      <span class="history-stat-tag">🎯 Média: ${avgRate}% concluído</span>
      <span class="history-stat-tag">⏱️ Tempo total: ${formatReadableTime(allSeconds)}</span>
    `;
  }

  historyListContainer.innerHTML = dates.map(dateKey => {
    const entry = dailyHistory[dateKey];
    const isOpen = openHistoryCards.has(dateKey);
    const entryTasks = entry.tasks || [];
    const completedTasks = entryTasks.filter(t => t.completed);
    const pendingTasks = entryTasks.filter(t => !t.completed);

    return `
      <div class="history-day-card ${isOpen ? 'open' : ''}" id="history-day-${dateKey}">
        <div class="history-day-header" onclick="toggleHistoryCard('${dateKey}')">
          <div class="history-day-main">
            <div class="history-day-date">
              <span>📅 ${escapeHtml(entry.dateDisplay || dateKey)}</span>
            </div>
            <span class="history-day-date-time">${entry.totalTasks} tarefas na rotina</span>
          </div>

          <div class="history-day-badges">
            <span class="badge-day-stat success">✅ ${entry.completedCount} Feitas</span>
            <span class="badge-day-stat pending">❌ ${entry.pendingCount} Pendentes</span>
            <span class="badge-day-stat rate">📊 ${entry.percent}%</span>
            <span class="badge-day-stat time">⏱️ ${formatTimeHMS(entry.totalSeconds)}</span>
            <span class="history-chevron">▾</span>
          </div>
        </div>

        <div class="history-day-progress">
          <div class="history-day-progress-bar" style="width: ${entry.percent}%"></div>
        </div>

        <div class="history-day-body">
          <div class="history-columns">
            <!-- Coluna Concluídas -->
            <div class="history-column">
              <div class="history-col-title done">
                <span>✅ Concluídas no Dia (${completedTasks.length})</span>
              </div>
              <div class="history-task-list">
                ${completedTasks.length === 0 ? '<p style="font-size: 13px; color: var(--text-dim); padding: 8px 0;">Nenhuma tarefa foi concluída neste dia.</p>' : ''}
                ${completedTasks.map(t => renderHistoryTaskItem(t, true)).join('')}
              </div>
            </div>

            <!-- Coluna Não Realizadas -->
            <div class="history-column">
              <div class="history-col-title pending">
                <span>❌ Não Realizadas / Pendentes (${pendingTasks.length})</span>
              </div>
              <div class="history-task-list">
                ${pendingTasks.length === 0 ? '<p style="font-size: 13px; color: var(--success); padding: 8px 0;">Todas as tarefas foram cumpridas! 🚀</p>' : ''}
                ${pendingTasks.map(t => renderHistoryTaskItem(t, false)).join('')}
              </div>
            </div>
          </div>

          <div class="history-day-footer">
            <button type="button" class="btn-delete-history-day" onclick="deleteHistoryDay('${dateKey}', event)">
              🗑️ Excluir este registro de histórico
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderHistoryTaskItem(task, isDone) {
  const subtasks = task.subtasks || [];
  const doneSub = subtasks.filter(s => s.completed).length;
  const timeStr = task.elapsedSeconds > 0 ? formatTimeHMS(task.elapsedSeconds) : '00:00:00';

  return `
    <div class="history-task-mini ${isDone ? 'done' : 'pending'}">
      <div class="history-task-mini-header">
        <div>
          <span class="history-task-mini-title">${escapeHtml(task.title)}</span>
          ${task.category ? `<span class="badge badge-category" style="margin-left: 6px; font-size: 10px; padding: 2px 6px;">📁 ${escapeHtml(task.category)}</span>` : ''}
        </div>
        <span class="history-task-mini-time">⏱️ ${timeStr}</span>
      </div>
      ${task.description ? `<p style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">${escapeHtml(task.description)}</p>` : ''}
      ${subtasks.length > 0 ? `
        <div class="history-task-mini-subtasks">
          <span>Subtarefas (${doneSub}/${subtasks.length} concluídas):</span>
          ${subtasks.map(s => `
            <div>${s.completed ? '✅' : '⏳'} ${escapeHtml(s.title)}</div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

function toggleHistoryCard(dateKey) {
  if (openHistoryCards.has(dateKey)) {
    openHistoryCards.delete(dateKey);
  } else {
    openHistoryCards.add(dateKey);
  }
  const card = document.getElementById(`history-day-${dateKey}`);
  if (card) {
    card.classList.toggle('open');
  }
}

function deleteHistoryDay(dateKey, e) {
  if (e) e.stopPropagation();
  if (confirm(`Tem certeza que deseja excluir o registro do dia ${dateKey}?`)) {
    delete dailyHistory[dateKey];
    openHistoryCards.delete(dateKey);
    saveHistory();
    renderHistory();
    if (historyBadge) {
      historyBadge.textContent = Object.keys(dailyHistory).length;
    }
  }
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

// Exporta funções globais para handlers HTML inline
window.toggleHistoryCard = toggleHistoryCard;
window.deleteHistoryDay = deleteHistoryDay;
window.removeInitialSubtask = removeInitialSubtask;
window.toggleTaskCompletion = toggleTaskCompletion;
window.deleteTask = deleteTask;
window.toggleSubtask = toggleSubtask;
window.addSubtaskToTask = addSubtaskToTask;
window.removeSubtaskFromTask = removeSubtaskFromTask;
window.startTimer = startTimer;
window.pauseTimer = pauseTimer;
window.resetTimer = resetTimer;

// ==========================================
// INTEGRAÇÃO COM SUPABASE (Nuvem em Tempo Real)
// ==========================================

function initSupabase() {
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    try {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      updateSyncStatus('connected', 'Supabase Conectado');
      subscribeToRealtime();
      fetchFromSupabase();
    } catch (err) {
      console.error('Erro ao conectar ao Supabase:', err);
      updateSyncStatus('offline', 'Modo Local');
    }
  } else {
    // Caso o script da CDN demore a inicializar
    setTimeout(() => {
      if (window.supabase && typeof window.supabase.createClient === 'function') {
        initSupabase();
      } else {
        updateSyncStatus('offline', 'Modo Local');
      }
    }, 600);
  }
}

function updateSyncStatus(status, text) {
  const badge = document.getElementById('cloudSyncStatus');
  if (!badge) return;
  badge.className = `sync-badge ${status}`;
  const textEl = badge.querySelector('.sync-text');
  if (textEl) textEl.textContent = text;
}

function mapDbTaskToModel(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category || 'Geral',
    priority: row.priority || 'media',
    description: row.description || '',
    completed: !!row.completed,
    createdAt: row.created_at ? Number(row.created_at) : Date.now(),
    elapsedSeconds: row.elapsed_seconds || 0,
    isRunning: !!row.is_running,
    timerStartedAt: row.timer_started_at ? Number(row.timer_started_at) : null,
    subtasks: Array.isArray(row.subtasks) ? row.subtasks : []
  };
}

function mapModelToDbTask(task) {
  return {
    id: task.id,
    title: task.title,
    category: task.category || 'Geral',
    priority: task.priority || 'media',
    description: task.description || '',
    completed: !!task.completed,
    created_at: task.createdAt || Date.now(),
    elapsed_seconds: task.elapsedSeconds || 0,
    is_running: !!task.isRunning,
    timer_started_at: task.timerStartedAt || null,
    subtasks: task.subtasks || []
  };
}

async function fetchFromSupabase() {
  if (!supabaseClient) return;
  updateSyncStatus('syncing', 'Sincronizando...');
  try {
    const { data, error } = await supabaseClient
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      if (data.length === 0 && tasks.length > 0) {
        // Banco no Supabase está vazio: envia as tarefas da rotina atual
        const rows = tasks.map(mapModelToDbTask);
        await supabaseClient.from('tasks').upsert(rows);
      } else if (data.length > 0) {
        // Atualiza tarefas locais com os dados do Supabase
        tasks = data.map(mapDbTaskToModel);
        saveTasks();
        render();
      }
      updateSyncStatus('connected', 'Sincronizado');
    } else if (error) {
      console.warn('Aviso do Supabase ao carregar tarefas:', error.message);
      updateSyncStatus('connected', 'Salvo localmente');
    }
  } catch (err) {
    console.error('Falha ao conectar com Supabase:', err);
    updateSyncStatus('offline', 'Modo Local');
  }

  // Tenta carregar histórico também se existir
  try {
    const { data: histData, error: histError } = await supabaseClient
      .from('daily_history')
      .select('*');

    if (!histError && histData && histData.length > 0) {
      histData.forEach(row => {
        dailyHistory[row.date] = {
          date: row.date,
          dateDisplay: row.date_display || row.date,
          closedAt: row.closed_at ? Number(row.closed_at) : Date.now(),
          isManual: !!row.is_manual,
          totalTasks: row.total_tasks || 0,
          completedCount: row.completed_count || 0,
          pendingCount: row.pending_count || 0,
          percent: row.percent || 0,
          totalSeconds: row.total_seconds || 0,
          tasks: Array.isArray(row.tasks) ? row.tasks : []
        };
      });
      saveHistory();
      renderHistory();
    }
  } catch (e) {
    // Tabela de histórico ainda não criada no Supabase, continua usando localStorage
  }
}

function subscribeToRealtime() {
  if (!supabaseClient) return;
  try {
    supabaseClient
      .channel('tasks-realtime-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        handleRealtimeChange(payload);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          updateSyncStatus('connected', 'Sincronizado');
        }
      });
  } catch (err) {
    console.error('Erro ao subscrever canais em tempo real:', err);
  }
}

function handleRealtimeChange(payload) {
  if (isSyncing) return; // Evita loop de atualização originado por este mesmo cliente
  const { eventType, new: newRow, old: oldRow } = payload;

  if (eventType === 'INSERT') {
    const idx = tasks.findIndex(t => t.id === newRow.id);
    if (idx === -1) {
      tasks.unshift(mapDbTaskToModel(newRow));
      saveTasks();
      render();
    }
  } else if (eventType === 'UPDATE') {
    const idx = tasks.findIndex(t => t.id === newRow.id);
    if (idx !== -1) {
      tasks[idx] = mapDbTaskToModel(newRow);
      saveTasks();
      render();
    }
  } else if (eventType === 'DELETE') {
    if (oldRow && oldRow.id) {
      tasks = tasks.filter(t => t.id !== oldRow.id);
      saveTasks();
      render();
    }
  }
}

async function dbUpsertTask(task) {
  if (!supabaseClient) return;
  try {
    isSyncing = true;
    updateSyncStatus('syncing', 'Salvando...');
    await supabaseClient.from('tasks').upsert(mapModelToDbTask(task));
    updateSyncStatus('connected', 'Sincronizado');
  } catch (err) {
    console.error('Erro ao sincronizar tarefa com Supabase:', err);
    updateSyncStatus('connected', 'Salvo local');
  } finally {
    setTimeout(() => { isSyncing = false; }, 350);
  }
}

async function dbDeleteTask(taskId) {
  if (!supabaseClient) return;
  try {
    isSyncing = true;
    updateSyncStatus('syncing', 'Excluindo...');
    await supabaseClient.from('tasks').delete().eq('id', taskId);
    updateSyncStatus('connected', 'Sincronizado');
  } catch (err) {
    console.error('Erro ao excluir tarefa no Supabase:', err);
  } finally {
    setTimeout(() => { isSyncing = false; }, 350);
  }
}

async function dbSyncAllTasks() {
  if (!supabaseClient || tasks.length === 0) return;
  try {
    isSyncing = true;
    updateSyncStatus('syncing', 'Sincronizando...');
    const rows = tasks.map(mapModelToDbTask);
    await supabaseClient.from('tasks').upsert(rows);
    updateSyncStatus('connected', 'Sincronizado');
  } catch (err) {
    console.error('Erro ao sincronizar tarefas:', err);
  } finally {
    setTimeout(() => { isSyncing = false; }, 350);
  }
}

async function dbUpsertDailyHistory(entry) {
  if (!supabaseClient) return;
  try {
    await supabaseClient.from('daily_history').upsert({
      date: entry.date,
      date_display: entry.dateDisplay,
      closed_at: entry.closedAt,
      is_manual: entry.isManual,
      total_tasks: entry.totalTasks,
      completed_count: entry.completedCount,
      pending_count: entry.pendingCount,
      percent: entry.percent,
      total_seconds: entry.totalSeconds,
      tasks: entry.tasks
    });
  } catch (err) {
    // Silencia caso a tabela ainda não exista no Supabase
  }
}
