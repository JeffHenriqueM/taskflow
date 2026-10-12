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
const currentDaySubtitle = document.getElementById('currentDaySubtitle');
const tabToday = document.getElementById('tabToday');
const tabHistory = document.getElementById('tabHistory');
const historyBadge = document.getElementById('historyBadge');
const btnCompleteDay = document.getElementById('btnCompleteDay');

const lblTotalTasks = document.getElementById('lblTotalTasks');
const lblPendingTasks = document.getElementById('lblPendingTasks');
const lblCompletedTasks = document.getElementById('lblCompletedTasks');
const lblTotalTime = document.getElementById('lblTotalTime');
const lblTotalPomodoros = document.getElementById('lblTotalPomodoros');

const todayView = document.getElementById('todayView');
const historyView = document.getElementById('historyView');
const historyListContainer = document.getElementById('historyListContainer');
const historyOverallBadge = document.getElementById('historyOverallBadge');

const taskForm = document.getElementById('taskForm');
const taskTitleInput = document.getElementById('taskTitle');
const taskCategoryInput = document.getElementById('taskCategory');
const taskPrioritySelect = document.getElementById('taskPriority');
const taskRecurrenceSelect = document.getElementById('taskRecurrence');
const taskDueDateInput = document.getElementById('taskDueDate');
const taskTimerMinutesInput = document.getElementById('taskTimerMinutes');
const taskDescriptionInput = document.getElementById('taskDescription');
const initialSubtaskInput = document.getElementById('initialSubtaskInput');
const initialSubtaskDueDateInput = document.getElementById('initialSubtaskDueDate');
const btnAddInitialSubtask = document.getElementById('btnAddInitialSubtask');
const initialSubtasksList = document.getElementById('initialSubtasksList');

const tasksContainer = document.getElementById('tasksContainer');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.filter-btn');

const statTotalTasks = document.getElementById('statTotalTasks');
const statPendingTasks = document.getElementById('statPendingTasks');
const statCompletedTasks = document.getElementById('statCompletedTasks');
const statTotalTime = document.getElementById('statTotalTime');
const statTotalPomodoros = document.getElementById('statTotalPomodoros');

const activeTimerBanner = document.getElementById('activeTimerBanner');
const activeTaskTitle = document.getElementById('activeTaskTitle');
const activeTaskTime = document.getElementById('activeTaskTime');
const btnPauseActiveTimer = document.getElementById('btnPauseActiveTimer');

const btnExport = document.getElementById('btnExport');
const importInput = document.getElementById('importInput');
const btnResetDefaults = document.getElementById('btnResetDefaults');

// Modais de Timer e Alerta
const timerFinishedModal = document.getElementById('timerFinishedModal');
const finishedTaskName = document.getElementById('finishedTaskName');
const finishedTaskPomodoroStats = document.getElementById('finishedTaskPomodoroStats');
const btnFinishedNextBlock = document.getElementById('btnFinishedNextBlock');
const btnFinishedAdd5Min = document.getElementById('btnFinishedAdd5Min');
const btnFinishedCompleteTask = document.getElementById('btnFinishedCompleteTask');
const btnFinishedDismiss = document.getElementById('btnFinishedDismiss');

const timerConfigModal = document.getElementById('timerConfigModal');
const timerConfigTaskTitle = document.getElementById('timerConfigTaskTitle');
const customMinutesInput = document.getElementById('customMinutesInput');
const btnSaveCustomMinutes = document.getElementById('btnSaveCustomMinutes');

// Modal e Botão de Escolha Aleatória
const btnPickRandomTask = document.getElementById('btnPickRandomTask');
const randomTaskModal = document.getElementById('randomTaskModal');
const randomModalSubtitle = document.getElementById('randomModalSubtitle');
const randomPickedCard = document.getElementById('randomPickedCard');
const btnStartRandomTask = document.getElementById('btnStartRandomTask');
const btnRerollRandomTask = document.getElementById('btnRerollRandomTask');
const btnCloseRandomModal = document.getElementById('btnCloseRandomModal');

// Modal de Edição de Tarefa Completa
const editTaskModal = document.getElementById('editTaskModal');
const editTaskForm = document.getElementById('editTaskForm');
const editTaskIdInput = document.getElementById('editTaskId');
const editTaskTitleInput = document.getElementById('editTaskTitle');
const editTaskCategoryInput = document.getElementById('editTaskCategory');
const editTaskPrioritySelect = document.getElementById('editTaskPriority');
const editTaskRecurrenceSelect = document.getElementById('editTaskRecurrence');
const editTaskDueDateInput = document.getElementById('editTaskDueDate');
const editTaskTimerMinutesInput = document.getElementById('editTaskTimerMinutes');
const editTaskDescriptionInput = document.getElementById('editTaskDescription');
const editNewSubtaskInput = document.getElementById('editNewSubtaskInput');
const editNewSubtaskDueDateInput = document.getElementById('editNewSubtaskDueDate');
const btnEditAddSubtask = document.getElementById('btnEditAddSubtask');
const editSubtasksList = document.getElementById('editSubtasksList');

// Modal de Edição de Subtarefa
const editSubtaskModal = document.getElementById('editSubtaskModal');
const editSubtaskForm = document.getElementById('editSubtaskForm');
const modalEditSubtaskIdInput = document.getElementById('modalEditSubtaskId');
const modalEditParentTaskIdInput = document.getElementById('modalEditParentTaskId');
const modalEditSubtaskTitleInput = document.getElementById('modalEditSubtaskTitle');
const modalEditSubtaskDueDateInput = document.getElementById('modalEditSubtaskDueDate');

let currentConfiguringTaskId = null;
let currentFinishedTaskId = null;
let currentRandomChosenTaskId = null;
let editTaskTempSubtasks = [];

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
  if (activeTab === 'history') {
    if (currentDayTitle) currentDayTitle.textContent = '📜 Histórico de Desempenho Diário';
    if (currentDaySubtitle) {
      const count = Object.keys(dailyHistory).length;
      currentDaySubtitle.textContent = count === 1 
        ? '1 dia arquivado para consulta' 
        : `${count} dias arquivados para consulta`;
    }
  } else {
    const todayKey = getTodayDateKey();
    if (currentDayTitle) currentDayTitle.textContent = formatDateDisplay(todayKey);
    if (currentDaySubtitle) currentDaySubtitle.textContent = 'Rotina Diária de Tarefas Recorrentes';
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

  // Compatibilidade e inicialização de blocos Pomodoro, recorrência e prazos
  tasks.forEach(t => {
    t.targetSeconds = t.targetSeconds || 1500;
    t.recurrence = t.recurrence || 'diaria';
    t.dueDate = t.dueDate || null;
    if (t.pomodoroCount === undefined) {
      t.pomodoroCount = Math.floor((t.elapsedSeconds || 0) / t.targetSeconds);
    }
    // Se a tarefa não está rodando e o bloco atual estava zerado ou indefinido, reseta para 0
    if (t.blockElapsedSeconds === undefined || (!t.isRunning && t.blockElapsedSeconds >= t.targetSeconds)) {
      t.blockElapsedSeconds = 0;
    }
    if (t.subtasks && Array.isArray(t.subtasks)) {
      t.subtasks.forEach(st => {
        st.dueDate = st.dueDate || null;
      });
    }
  });

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
  let totalPomodoros = 0;
  tasks.forEach(t => {
    totalSeconds += getTaskCurrentSeconds(t);
    totalPomodoros += (t.pomodoroCount || 0);
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
    totalPomodoros,
    tasks: JSON.parse(JSON.stringify(tasks))
  };

  saveHistory();
  dbUpsertDailyHistory(dailyHistory[dateKey]);
}

function resetTasksForNewDay() {
  tasks = tasks.map(task => {
    // Tarefas únicas ('nenhuma' recorrência) que foram concluídas permanecem concluídas
    const isSingleTask = task.recurrence === 'nenhuma';
    const keepCompleted = isSingleTask && task.completed;

    return {
      ...task,
      completed: keepCompleted ? true : false,
      elapsedSeconds: 0,
      blockElapsedSeconds: 0,
      pomodoroCount: 0,
      isRunning: false,
      timerStartedAt: null,
      // As subtarefas mantêm seu progresso intacto (as já concluídas continuam marcadas)
      subtasks: (task.subtasks || []).map(st => ({
        ...st,
        completed: !!st.completed
      }))
    };
  });
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

  // Ações do Modal de Bloco Concluído
  if (btnFinishedNextBlock) {
    btnFinishedNextBlock.addEventListener('click', () => {
      if (currentFinishedTaskId) {
        const id = currentFinishedTaskId;
        closeTimerFinishedModal();
        startTimer(id);
      }
    });
  }

  if (btnFinishedAdd5Min) {
    btnFinishedAdd5Min.addEventListener('click', () => {
      if (currentFinishedTaskId) {
        const task = tasks.find(t => t.id === currentFinishedTaskId);
        if (task) {
          task.targetSeconds = (getTaskTargetSeconds(task)) + 300;
          task.blockElapsedSeconds = Math.max(0, task.targetSeconds - 300);
          startTimer(task.id);
        }
      }
      closeTimerFinishedModal();
    });
  }

  if (btnFinishedCompleteTask) {
    btnFinishedCompleteTask.addEventListener('click', () => {
      if (currentFinishedTaskId) {
        toggleTaskCompletion(currentFinishedTaskId);
      }
      closeTimerFinishedModal();
    });
  }

  if (btnFinishedDismiss) {
    btnFinishedDismiss.addEventListener('click', closeTimerFinishedModal);
  }

  if (btnSaveCustomMinutes) {
    btnSaveCustomMinutes.addEventListener('click', () => {
      if (!currentConfiguringTaskId || !customMinutesInput) return;
      const mins = parseInt(customMinutesInput.value, 10);
      if (mins > 0) {
        setTaskDuration(currentConfiguringTaskId, mins);
        closeTimerConfigModal();
      } else {
        alert('Digite uma quantidade válida de minutos.');
      }
    });
  }

  // Ações do Sorteio Aleatório de Tarefas
  if (btnPickRandomTask) {
    btnPickRandomTask.addEventListener('click', pickRandomTask);
  }

  if (btnStartRandomTask) {
    btnStartRandomTask.addEventListener('click', () => {
      if (currentRandomChosenTaskId) {
        const id = currentRandomChosenTaskId;
        closeRandomTaskModal();
        startTimer(id);
        highlightAndScrollToTask(id);
      }
    });
  }

  if (btnRerollRandomTask) {
    btnRerollRandomTask.addEventListener('click', () => {
      pickRandomTask();
    });
  }

  if (btnCloseRandomModal) {
    btnCloseRandomModal.addEventListener('click', () => {
      const id = currentRandomChosenTaskId;
      closeRandomTaskModal();
      if (id) {
        highlightAndScrollToTask(id);
      }
    });
  }

  // Listeners dos Modais de Edição de Tarefas e Subtarefas
  if (editTaskForm) {
    editTaskForm.addEventListener('submit', handleSaveEditTask);
  }
  if (btnEditAddSubtask) {
    btnEditAddSubtask.addEventListener('click', handleEditAddSubtask);
  }
  if (editNewSubtaskInput) {
    editNewSubtaskInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleEditAddSubtask();
      }
    });
  }
  if (editSubtaskForm) {
    editSubtaskForm.addEventListener('submit', handleSaveEditSubtask);
  }
  if (editTaskModal) {
    editTaskModal.addEventListener('click', (e) => {
      if (e.target === editTaskModal) closeEditTaskModal();
    });
  }
  if (editSubtaskModal) {
    editSubtaskModal.addEventListener('click', (e) => {
      if (e.target === editSubtaskModal) closeEditSubtaskModal();
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
      if (btnCompleteDay) btnCompleteDay.style.display = 'inline-flex';
      updateDateDisplay();
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
      if (btnCompleteDay) btnCompleteDay.style.display = 'none';
      updateDateDisplay();
      updateMetrics();
      renderHistory();
    });
  }
}

// Manipulação do Formulário
function addInitialSubtask() {
  const text = initialSubtaskInput.value.trim();
  if (!text) return;

  const dueDate = initialSubtaskDueDateInput ? initialSubtaskDueDateInput.value : '';

  initialSubtasks.push({
    id: generateId(),
    title: text,
    dueDate: dueDate || null,
    completed: false
  });
  initialSubtaskInput.value = '';
  if (initialSubtaskDueDateInput) initialSubtaskDueDateInput.value = '';
  renderInitialSubtasksChips();
}

function removeInitialSubtask(index) {
  initialSubtasks.splice(index, 1);
  renderInitialSubtasksChips();
}

function renderInitialSubtasksChips() {
  initialSubtasksList.innerHTML = initialSubtasks.map((st, i) => `
    <span class="subtask-chip">
      <span>${escapeHtml(st.title)} ${st.dueDate ? `<small style="opacity: 0.8; font-size: 11px;">(📅 ${formatShortDate(st.dueDate)})</small>` : ''}</span>
      <button type="button" onclick="removeInitialSubtask(${i})" title="Remover">&times;</button>
    </span>
  `).join('');
}

function handleCreateTask(e) {
  e.preventDefault();
  const title = taskTitleInput.value.trim();
  if (!title) return;

  const targetMins = parseInt(taskTimerMinutesInput ? taskTimerMinutesInput.value : '25', 10) || 25;
  const recurrence = taskRecurrenceSelect ? taskRecurrenceSelect.value : 'diaria';
  const dueDate = taskDueDateInput ? taskDueDateInput.value : '';

  const newTask = {
    id: generateId(),
    title: title,
    category: taskCategoryInput.value.trim() || 'Geral',
    priority: taskPrioritySelect.value || 'media',
    recurrence: recurrence || 'diaria',
    dueDate: dueDate || null,
    description: taskDescriptionInput.value.trim(),
    completed: false,
    createdAt: Date.now(),
    targetSeconds: targetMins * 60,
    elapsedSeconds: 0,
    blockElapsedSeconds: 0,
    pomodoroCount: 0,
    isRunning: false,
    timerStartedAt: null,
    subtasks: [...initialSubtasks]
  };

  tasks.unshift(newTask);
  saveTasks();

  // Reset form
  taskForm.reset();
  if (taskTimerMinutesInput) taskTimerMinutesInput.value = '25';
  if (taskRecurrenceSelect) taskRecurrenceSelect.value = 'diaria';
  if (taskDueDateInput) taskDueDateInput.value = '';
  if (initialSubtaskDueDateInput) initialSubtaskDueDateInput.value = '';
  initialSubtasks = [];
  renderInitialSubtasksChips();

  render();
  dbUpsertTask(newTask);
}

// Auxiliares de Datas, Prazos e Badges
function formatShortDate(dateStr) {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    return dateStr;
  } catch (e) {
    return dateStr;
  }
}

function formatFullDateDisplay(dateStr) {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  } catch (e) {
    return dateStr;
  }
}

function getDueDateInfo(dueDateStr, isCompleted) {
  if (!dueDateStr) return null;
  const todayStr = getTodayDateKey();
  
  if (isCompleted) {
    return {
      status: 'done',
      badgeClass: 'badge-due done',
      label: `✓ Entregue (${formatShortDate(dueDateStr)})`,
      title: `Prazo era ${formatFullDateDisplay(dueDateStr)}`
    };
  }

  if (dueDateStr < todayStr) {
    return {
      status: 'overdue',
      badgeClass: 'badge-due overdue',
      label: `⚠️ Atrasada (${formatShortDate(dueDateStr)})`,
      title: `Prazo venceu em ${formatFullDateDisplay(dueDateStr)}!`
    };
  }

  if (dueDateStr === todayStr) {
    return {
      status: 'today',
      badgeClass: 'badge-due today',
      label: `⏳ Vence hoje!`,
      title: `O prazo final desta tarefa é hoje (${formatFullDateDisplay(dueDateStr)})`
    };
  }

  const diffTime = new Date(dueDateStr + 'T00:00:00') - new Date(todayStr + 'T00:00:00');
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    return {
      status: 'tomorrow',
      badgeClass: 'badge-due tomorrow',
      label: `📅 Vence amanhã`,
      title: `Prazo: ${formatFullDateDisplay(dueDateStr)}`
    };
  }

  return {
    status: 'future',
    badgeClass: 'badge-due future',
    label: `📅 Prazo: ${formatShortDate(dueDateStr)}`,
    title: `Prazo de entrega: ${formatFullDateDisplay(dueDateStr)} (em ${diffDays} dias)`
  };
}

function formatDueDateBadge(dueDateStr, isCompleted) {
  const info = getDueDateInfo(dueDateStr, isCompleted);
  if (!info) return '';
  return `<span class="${info.badgeClass}" title="${escapeHtml(info.title)}">${info.label}</span>`;
}

function formatRecurrenceBadge(recurrence) {
  switch (recurrence) {
    case 'semanal':
      return `<span class="badge badge-recurrence weekly" title="Repete semanalmente">🔄 Semanal</span>`;
    case 'mensal':
      return `<span class="badge badge-recurrence monthly" title="Repete mensalmente">🔄 Mensal</span>`;
    case 'nenhuma':
      return `<span class="badge badge-recurrence once" title="Tarefa pontual (não se repete)">📌 Única</span>`;
    case 'diaria':
    default:
      return `<span class="badge badge-recurrence daily" title="Rotina diária (repete todos os dias)">🔄 Diária</span>`;
  }
}

function formatSubtaskDueDateBadge(dueDateStr, isCompleted) {
  if (!dueDateStr) return '';
  const todayStr = getTodayDateKey();
  
  if (isCompleted) {
    return `<span class="subtask-due-badge done" title="Prazo era ${formatFullDateDisplay(dueDateStr)}">✓ ${formatShortDate(dueDateStr)}</span>`;
  }
  if (dueDateStr < todayStr) {
    return `<span class="subtask-due-badge overdue" title="Subtarefa atrasada! Venceu em ${formatFullDateDisplay(dueDateStr)}">⚠️ ${formatShortDate(dueDateStr)}</span>`;
  }
  if (dueDateStr === todayStr) {
    return `<span class="subtask-due-badge today" title="Vence hoje (${formatFullDateDisplay(dueDateStr)})">⏳ Hoje</span>`;
  }
  return `<span class="subtask-due-badge future" title="Prazo: ${formatFullDateDisplay(dueDateStr)}">📅 ${formatShortDate(dueDateStr)}</span>`;
}

// Auxiliares de Contagem Regressiva e Blocos Pomodoro
function getTaskTargetSeconds(task) {
  return task.targetSeconds || 1500; // 25 min padrão (1500s)
}

function getTaskRemainingSeconds(task) {
  const target = getTaskTargetSeconds(task);
  let elapsedInBlock = task.blockElapsedSeconds || 0;
  if (task.isRunning && task.timerStartedAt) {
    elapsedInBlock += Math.floor((Date.now() - task.timerStartedAt) / 1000);
  }
  return Math.max(0, target - elapsedInBlock);
}

// Obter tempo trabalhado total em segundos para métricas e relatórios
function getTaskCurrentSeconds(task) {
  let total = task.elapsedSeconds || 0;
  if (task.isRunning && task.timerStartedAt) {
    total += Math.floor((Date.now() - task.timerStartedAt) / 1000);
  }
  return total;
}

// Controle do Timer (Blocos Pomodoro)
function startTimer(taskId) {
  requestNotificationPermission();
  const now = Date.now();
  
  // Pausa qualquer outro timer rodando para manter rastreamento único e preciso
  tasks.forEach(t => {
    if (t.isRunning && t.id !== taskId) {
      const added = Math.max(0, Math.floor((now - t.timerStartedAt) / 1000));
      t.elapsedSeconds = (t.elapsedSeconds || 0) + added;
      t.blockElapsedSeconds = (t.blockElapsedSeconds || 0) + added;
      t.isRunning = false;
      t.timerStartedAt = null;
      dbUpsertTask(t);
    }
  });

  const task = tasks.find(t => t.id === taskId);
  if (task) {
    // Se o bloco atual já estava em 0, reinicia o bloco do começo
    const remaining = getTaskRemainingSeconds(task);
    if (remaining <= 0) {
      task.blockElapsedSeconds = 0;
    }
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
    const added = Math.max(0, Math.floor((now - task.timerStartedAt) / 1000));
    task.elapsedSeconds = (task.elapsedSeconds || 0) + added;
    task.blockElapsedSeconds = (task.blockElapsedSeconds || 0) + added;
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
    const mins = Math.round(getTaskTargetSeconds(task) / 60);
    const pomodoros = task.pomodoroCount || 0;
    const pomodoroNote = pomodoros > 0 
      ? `\n\n(Seus ${pomodoros} bloco(s) já concluídos hoje e o tempo total trabalhado continuarão salvos).` 
      : '';
    if (confirm(`Deseja reiniciar a contagem do bloco atual da tarefa "${task.title}" para ${mins} minutos?${pomodoroNote}`)) {
      task.blockElapsedSeconds = 0;
      task.isRunning = false;
      task.timerStartedAt = null;
      saveTasks();
      render();
      dbUpsertTask(task);
    }
  }
}

// ==========================================
// Sorteio Aleatório de Tarefas (Menor Tempo de Execução)
// ==========================================

function isTaskUntouchedToday(task) {
  const pomodoros = task.pomodoroCount || 0;
  const currentSeconds = getTaskCurrentSeconds(task);
  const blockElapsed = task.blockElapsedSeconds || 0;
  return pomodoros === 0 && currentSeconds === 0 && blockElapsed === 0 && !task.isRunning;
}

function getTaskExecutionTime(task) {
  // O tempo de execução da tarefa é o tempo restante na contagem regressiva
  // Se ainda não começou, corresponde à duração total configurada (targetSeconds)
  const remaining = getTaskRemainingSeconds(task);
  return remaining > 0 ? remaining : getTaskTargetSeconds(task);
}

function pickRandomTask() {
  const pendingTasks = tasks.filter(t => !t.completed);

  if (pendingTasks.length === 0) {
    alert('🎉 Parabéns! Todas as tarefas da rotina de hoje já foram concluídas!');
    return;
  }

  // Filtra apenas as tarefas pendentes que ainda não tiveram nada feito hoje (sem blocos nem tempo trabalhado)
  const eligibleTasks = pendingTasks.filter(isTaskUntouchedToday);

  if (eligibleTasks.length === 0) {
    alert('✨ Todas as tarefas pendentes de hoje já tiveram blocos ou tempo de foco iniciados!\n\nNenhuma tarefa zerada restante para sortear hoje.');
    return;
  }

  // Se o filtro ativo for 'completed', alterna para 'all' para que a tarefa sorteada fique visível
  if (activeFilter === 'completed') {
    activeFilter = 'all';
    filterBtns.forEach(b => b.classList.toggle('active', b.dataset.filter === 'all'));
    renderTasks();
  }

  // 1. Encontra o menor tempo de execução entre as tarefas elegíveis (em segundos)
  const minTime = Math.min(...eligibleTasks.map(t => getTaskExecutionTime(t)));

  // 2. Filtra todas as tarefas candidatas que empatam com esse menor tempo
  const candidates = eligibleTasks.filter(t => getTaskExecutionTime(t) === minTime);

  // 3. Escolhe aleatoriamente entre as candidatas de menor tempo (evita repetir a mesma consecutivamente se houver opções)
  let pool = candidates;
  if (candidates.length > 1 && currentRandomChosenTaskId) {
    const others = candidates.filter(t => t.id !== currentRandomChosenTaskId);
    if (others.length > 0) pool = others;
  }

  const randomIndex = Math.floor(Math.random() * pool.length);
  const chosenTask = pool[randomIndex];

  currentRandomChosenTaskId = chosenTask.id;
  showRandomTaskModal(chosenTask, minTime, candidates.length);
}

function showRandomTaskModal(task, minSeconds, totalCandidates) {
  if (!randomTaskModal || !randomPickedCard) return;

  const minMinutes = Math.max(1, Math.round(minSeconds / 60));
  const subtasks = task.subtasks || [];
  const completedSubs = subtasks.filter(s => s.completed).length;

  if (randomModalSubtitle) {
    randomModalSubtitle.textContent = 'Selecionada aleatoriamente entre as tarefas sem blocos iniciados hoje';
  }

  randomPickedCard.innerHTML = `
    <div class="random-picked-header">
      <div class="random-picked-title">${escapeHtml(task.title)}</div>
    </div>

    <div class="random-picked-badges">
      <span class="random-time-badge">⏱️ Bloco de ${minMinutes} min</span>
      ${task.category ? `<span class="badge badge-category">📁 ${escapeHtml(task.category)}</span>` : ''}
      <span class="badge badge-priority-${task.priority || 'media'}">${formatPriorityLabel(task.priority || 'media')}</span>
      ${subtasks.length > 0 ? `<span class="badge" style="background: rgba(148,163,184,0.15); color: #cbd5e1; font-size: 11px;">📋 ${completedSubs}/${subtasks.length} subtarefas</span>` : ''}
    </div>

    ${task.description ? `<p class="random-picked-desc">${escapeHtml(task.description)}</p>` : ''}

    <div class="random-info-note">
      ${totalCandidates > 1 
        ? `<span>🎲 Havia <strong>${totalCandidates} tarefas</strong> sem blocos iniciados hoje (${minMinutes}m). "${escapeHtml(task.title)}" foi a sorteada!</span>` 
        : `<span>⭐ Tarefa pendente sem blocos iniciados hoje (${minMinutes}m).</span>`
      }
    </div>
  `;

  randomTaskModal.classList.remove('hidden');
}

function closeRandomTaskModal() {
  if (randomTaskModal) {
    randomTaskModal.classList.add('hidden');
  }
}

function highlightAndScrollToTask(taskId) {
  // Garante que a visualização de Hoje está ativa
  if (activeTab !== 'today' && tabToday) {
    tabToday.click();
  }

  setTimeout(() => {
    const cardEl = document.getElementById(`task-card-${taskId}`);
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      cardEl.classList.remove('highlight-picked');
      void cardEl.offsetWidth; // Força reflow para reiniciar animação
      cardEl.classList.add('highlight-picked');
      setTimeout(() => {
        cardEl.classList.remove('highlight-picked');
      }, 3500);
    }
  }, 120);
}

// Configuração e Alteração da Duração da Tarefa
function openTimerConfig(taskId, e) {
  if (e) e.stopPropagation();
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  currentConfiguringTaskId = taskId;
  const currentMins = Math.round(getTaskTargetSeconds(task) / 60);
  if (timerConfigTaskTitle) {
    timerConfigTaskTitle.textContent = `Tarefa: "${task.title}" (Atual: ${currentMins} min)`;
  }
  if (customMinutesInput) {
    customMinutesInput.value = currentMins;
  }
  if (timerConfigModal) {
    timerConfigModal.classList.remove('hidden');
  }
}

function closeTimerConfigModal() {
  if (timerConfigModal) timerConfigModal.classList.add('hidden');
  currentConfiguringTaskId = null;
}

function applyTimerPreset(minutes) {
  if (!currentConfiguringTaskId) return;
  setTaskDuration(currentConfiguringTaskId, minutes);
  closeTimerConfigModal();
}

function setTaskDuration(taskId, minutes) {
  const mins = parseInt(minutes, 10);
  if (isNaN(mins) || mins <= 0) return;
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.targetSeconds = mins * 60;
    task.blockElapsedSeconds = 0;
    task.isRunning = false;
    task.timerStartedAt = null;
    saveTasks();
    render();
    dbUpsertTask(task);
  }
}

// Notificações e Alarme de Áudio
function playAlarmSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    // Sequência de notas harmônicas agradáveis (C5, E5, G5, C6)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const startTime = ctx.currentTime + i * 0.14;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.35, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.38);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.42);
    });

    // Segunda repetição com tom de sino suave
    setTimeout(() => {
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        
        const startTime = ctx.currentTime + i * 0.14;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.35, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.44);
      });
    }, 650);
  } catch (err) {
    console.error('Erro ao tocar som de alarme:', err);
  }
}

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function sendTimerFinishedNotification(task) {
  playAlarmSound();

  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification('⏱️ Tempo Esgotado! — TaskFlow', {
        body: `A contagem regressiva da tarefa "${task.title}" terminou!`,
        icon: 'favicon.svg'
      });
    } catch (e) {
      console.warn('Erro ao disparar notificação do navegador:', e);
    }
  }

  showTimerFinishedModal(task);
}

function showTimerFinishedModal(task) {
  currentFinishedTaskId = task.id;
  if (finishedTaskName) finishedTaskName.textContent = `"${task.title}"`;
  if (finishedTaskPomodoroStats) {
    const count = task.pomodoroCount || 1;
    const totalTime = formatReadableTime(task.elapsedSeconds || 0);
    finishedTaskPomodoroStats.innerHTML = `
      <div>🍅 <strong>${count}º bloco concluído hoje!</strong></div>
      <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
        Tempo total dedicado a esta tarefa hoje: <strong>${totalTime}</strong>
      </div>
    `;
  }
  if (timerFinishedModal) timerFinishedModal.classList.remove('hidden');
}

function closeTimerFinishedModal() {
  if (timerFinishedModal) timerFinishedModal.classList.add('hidden');
  currentFinishedTaskId = null;
}

function finishCountdown(task) {
  const now = Date.now();
  let added = 0;
  if (task.timerStartedAt) {
    added = Math.max(0, Math.floor((now - task.timerStartedAt) / 1000));
  }
  task.isRunning = false;
  task.timerStartedAt = null;
  task.elapsedSeconds = (task.elapsedSeconds || 0) + added;

  // Incrementa contagem de blocos concluídos
  task.pomodoroCount = (task.pomodoroCount || 0) + 1;
  // Reseta o bloco atual para 0 para que o próximo bloco fique pronto com tempo cheio
  task.blockElapsedSeconds = 0;

  saveTasks();
  render();
  dbUpsertTask(task);
  sendTimerFinishedNotification(task);
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

// Ticker Global (Atualiza contagem regressiva a cada 1 segundo)
function startGlobalTicker() {
  setInterval(() => {
    const runningTask = tasks.find(t => t.isRunning);
    if (!runningTask) {
      activeTimerBanner.classList.add('hidden');
      return;
    }

    const remainingSecs = getTaskRemainingSeconds(runningTask);
    const timeFormatted = formatTimeHMS(remainingSecs);

    if (remainingSecs <= 0) {
      finishCountdown(runningTask);
      return;
    }

    // Atualiza banner ativo
    activeTimerBanner.classList.remove('hidden');
    activeTaskTitle.textContent = runningTask.title;
    activeTaskTime.textContent = timeFormatted;

    // Atualiza o display no card da tarefa sem re-renderizar todo o DOM
    const timerDisplayEl = document.getElementById(`timer-display-${runningTask.id}`);
    if (timerDisplayEl) {
      timerDisplayEl.textContent = timeFormatted;
      if (remainingSecs <= 60) {
        timerDisplayEl.classList.add('warning');
      } else {
        timerDisplayEl.classList.remove('warning');
      }
    }

    // Atualiza métrica total de tempo trabalhado na aba de hoje
    if (activeTab === 'today') {
      updateTodayMetrics();
    }
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
      dueDate: null,
      completed: false
    });
    inputEl.value = '';
    saveTasks();
    render();
    dbUpsertTask(task);
  }
}

function addInlineSubtask(taskId) {
  const textInput = document.getElementById(`input-new-subtask-${taskId}`);
  const dateInput = document.getElementById(`input-new-subtask-date-${taskId}`);
  if (!textInput) return;

  const title = textInput.value.trim();
  if (!title) return;

  const dueDate = dateInput ? dateInput.value : '';

  const task = tasks.find(t => t.id === taskId);
  if (task) {
    if (!task.subtasks) task.subtasks = [];
    task.subtasks.push({
      id: generateId(),
      title: title,
      dueDate: dueDate || null,
      completed: false
    });
    textInput.value = '';
    if (dateInput) dateInput.value = '';
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

// ==========================================
// Edição de Tarefas e Subtarefas (Modais)
// ==========================================

function openEditTaskModal(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  if (editTaskIdInput) editTaskIdInput.value = task.id;
  if (editTaskTitleInput) editTaskTitleInput.value = task.title || '';
  if (editTaskCategoryInput) editTaskCategoryInput.value = task.category || '';
  if (editTaskPrioritySelect) editTaskPrioritySelect.value = task.priority || 'media';
  if (editTaskRecurrenceSelect) editTaskRecurrenceSelect.value = task.recurrence || 'diaria';
  if (editTaskDueDateInput) editTaskDueDateInput.value = task.dueDate || '';
  if (editTaskTimerMinutesInput) editTaskTimerMinutesInput.value = Math.round(getTaskTargetSeconds(task) / 60);
  if (editTaskDescriptionInput) editTaskDescriptionInput.value = task.description || '';

  editTaskTempSubtasks = JSON.parse(JSON.stringify(task.subtasks || []));
  if (editNewSubtaskInput) editNewSubtaskInput.value = '';
  if (editNewSubtaskDueDateInput) editNewSubtaskDueDateInput.value = '';

  renderEditSubtasksList();
  if (editTaskModal) editTaskModal.classList.remove('hidden');
}

function closeEditTaskModal() {
  if (editTaskModal) editTaskModal.classList.add('hidden');
  editTaskTempSubtasks = [];
}

function handleEditAddSubtask() {
  if (!editNewSubtaskInput) return;
  const title = editNewSubtaskInput.value.trim();
  if (!title) return;

  const dueDate = editNewSubtaskDueDateInput ? editNewSubtaskDueDateInput.value : '';
  editTaskTempSubtasks.push({
    id: generateId(),
    title: title,
    dueDate: dueDate || null,
    completed: false
  });

  editNewSubtaskInput.value = '';
  if (editNewSubtaskDueDateInput) editNewSubtaskDueDateInput.value = '';
  renderEditSubtasksList();
}

function removeEditSubtask(index) {
  editTaskTempSubtasks.splice(index, 1);
  renderEditSubtasksList();
}

function renderEditSubtasksList() {
  if (!editSubtasksList) return;
  if (editTaskTempSubtasks.length === 0) {
    editSubtasksList.innerHTML = `<div style="font-size: 12px; color: var(--text-dim); padding: 8px 0;">Nenhuma subtarefa adicionada. Digite no campo acima para adicionar.</div>`;
    return;
  }

  editSubtasksList.innerHTML = editTaskTempSubtasks.map((st, i) => `
    <div class="edit-subtask-row">
      <input 
        type="text" 
        value="${escapeHtml(st.title)}" 
        placeholder="Subtarefa..." 
        onchange="editTaskTempSubtasks[${i}].title = this.value.trim()"
      >
      <input 
        type="date" 
        value="${st.dueDate || ''}" 
        title="Prazo da subtarefa"
        onchange="editTaskTempSubtasks[${i}].dueDate = this.value || null"
      >
      <button type="button" class="btn-remove-edit-subtask" onclick="removeEditSubtask(${i})" title="Remover subtarefa">&times;</button>
    </div>
  `).join('');
}

function handleSaveEditTask(e) {
  e.preventDefault();
  const taskId = editTaskIdInput.value;
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  const newTitle = editTaskTitleInput.value.trim();
  if (!newTitle) return;

  const oldTarget = getTaskTargetSeconds(task);
  const newTargetMins = parseInt(editTaskTimerMinutesInput ? editTaskTimerMinutesInput.value : '25', 10) || 25;
  const newTargetSecs = newTargetMins * 60;

  task.title = newTitle;
  task.category = editTaskCategoryInput.value.trim() || 'Geral';
  task.priority = editTaskPrioritySelect.value || 'media';
  task.recurrence = editTaskRecurrenceSelect.value || 'diaria';
  task.dueDate = editTaskDueDateInput.value || null;
  task.description = editTaskDescriptionInput.value.trim();
  task.subtasks = JSON.parse(JSON.stringify(editTaskTempSubtasks));

  if (oldTarget !== newTargetSecs) {
    task.targetSeconds = newTargetSecs;
    if (!task.isRunning) {
      task.blockElapsedSeconds = 0;
    }
  }

  saveTasks();
  render();
  closeEditTaskModal();
  dbUpsertTask(task);
}

// Edição Individual de Subtarefa
function openEditSubtaskModal(taskId, subtaskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task || !task.subtasks) return;
  const subtask = task.subtasks.find(st => st.id === subtaskId);
  if (!subtask) return;

  if (modalEditParentTaskIdInput) modalEditParentTaskIdInput.value = taskId;
  if (modalEditSubtaskIdInput) modalEditSubtaskIdInput.value = subtaskId;
  if (modalEditSubtaskTitleInput) modalEditSubtaskTitleInput.value = subtask.title || '';
  if (modalEditSubtaskDueDateInput) modalEditSubtaskDueDateInput.value = subtask.dueDate || '';

  if (editSubtaskModal) editSubtaskModal.classList.remove('hidden');
}

function closeEditSubtaskModal() {
  if (editSubtaskModal) editSubtaskModal.classList.add('hidden');
}

function handleSaveEditSubtask(e) {
  e.preventDefault();
  const taskId = modalEditParentTaskIdInput.value;
  const subtaskId = modalEditSubtaskIdInput.value;
  const task = tasks.find(t => t.id === taskId);
  if (!task || !task.subtasks) return;
  const subtask = task.subtasks.find(st => st.id === subtaskId);
  if (!subtask) return;

  const newTitle = modalEditSubtaskTitleInput.value.trim();
  if (!newTitle) return;

  subtask.title = newTitle;
  subtask.dueDate = modalEditSubtaskDueDateInput.value || null;

  saveTasks();
  render();
  closeEditSubtaskModal();
  dbUpsertTask(task);
}

// Renderização Geral
function render() {
  updateMetrics();
  renderTasks();
}

function updateMetrics() {
  if (activeTab === 'history') {
    updateHistoryMetrics();
  } else {
    updateTodayMetrics();
  }
}

function updateTodayMetrics() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;

  let totalSecs = 0;
  let totalPomodoros = 0;
  tasks.forEach(t => {
    totalSecs += getTaskCurrentSeconds(t);
    totalPomodoros += (t.pomodoroCount || 0);
  });

  if (lblTotalTasks) lblTotalTasks.textContent = 'Total de Tarefas';
  if (lblPendingTasks) lblPendingTasks.textContent = 'Pendentes';
  if (lblCompletedTasks) lblCompletedTasks.textContent = 'Concluídas';
  if (lblTotalTime) lblTotalTime.textContent = 'Tempo Registrado Hoje';
  if (lblTotalPomodoros) lblTotalPomodoros.textContent = 'Blocos Concluídos';

  if (statTotalTasks) statTotalTasks.textContent = total;
  if (statPendingTasks) statPendingTasks.textContent = pending;
  if (statCompletedTasks) statCompletedTasks.textContent = completed;
  if (statTotalTime) statTotalTime.textContent = formatReadableTime(totalSecs);
  if (statTotalPomodoros) statTotalPomodoros.textContent = totalPomodoros;

  if (historyBadge) {
    historyBadge.textContent = Object.keys(dailyHistory).length;
  }
}

function updateHistoryMetrics() {
  const dates = Object.keys(dailyHistory);
  let histTotalTasks = 0;
  let histPendingTasks = 0;
  let histCompletedTasks = 0;
  let histTotalSeconds = 0;
  let histTotalPomodoros = 0;

  dates.forEach(d => {
    const entry = dailyHistory[d];
    histTotalTasks += entry.totalTasks || 0;
    histPendingTasks += entry.pendingCount || 0;
    histCompletedTasks += entry.completedCount || 0;
    histTotalSeconds += entry.totalSeconds || 0;
    if (entry.totalPomodoros !== undefined && entry.totalPomodoros > 0) {
      histTotalPomodoros += entry.totalPomodoros;
    } else if (entry.tasks && Array.isArray(entry.tasks)) {
      entry.tasks.forEach(t => {
        histTotalPomodoros += (t.pomodoroCount || 0);
      });
    }
  });

  if (lblTotalTasks) lblTotalTasks.textContent = 'Tarefas no Histórico';
  if (lblPendingTasks) lblPendingTasks.textContent = 'Pendentes no Histórico';
  if (lblCompletedTasks) lblCompletedTasks.textContent = 'Concluídas no Histórico';
  if (lblTotalTime) lblTotalTime.textContent = 'Tempo Total no Histórico';
  if (lblTotalPomodoros) lblTotalPomodoros.textContent = 'Blocos no Histórico';

  if (statTotalTasks) statTotalTasks.textContent = histTotalTasks;
  if (statPendingTasks) statPendingTasks.textContent = histPendingTasks;
  if (statCompletedTasks) statCompletedTasks.textContent = histCompletedTasks;
  if (statTotalTime) statTotalTime.textContent = formatReadableTime(histTotalSeconds);
  if (statTotalPomodoros) statTotalPomodoros.textContent = histTotalPomodoros;

  if (historyBadge) {
    historyBadge.textContent = dates.length;
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
    const remainingSecs = getTaskRemainingSeconds(task);
    const timeFormatted = formatTimeHMS(remainingSecs);
    const targetMins = Math.round(getTaskTargetSeconds(task) / 60);
    const pomodoroCount = task.pomodoroCount || 0;
    const isFinished = isRunning && remainingSecs === 0;

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
                ${formatRecurrenceBadge(task.recurrence || 'diaria')}
                ${formatDueDateBadge(task.dueDate, task.completed)}
                ${totalSub > 0 ? `<span class="badge" style="background: rgba(148,163,184,0.15); color: #cbd5e1;">📋 ${completedSub}/${totalSub} subtarefas</span>` : ''}
                ${pomodoroCount > 0 ? `
                  <span class="badge badge-pomodoro" title="${pomodoroCount} bloco(s) de foco concluído(s) hoje • Total trabalhado: ${formatReadableTime(task.elapsedSeconds)}">
                    🍅 ${pomodoroCount} ${pomodoroCount === 1 ? 'bloco' : 'blocos'} (${formatReadableTime(task.elapsedSeconds)})
                  </span>
                ` : ''}
              </div>
            </div>
          </div>

          <!-- Timer Widget (Contagem Regressiva do Bloco) -->
          <div class="task-timer-area">
            <div class="timer-display-group">
              <span class="timer-digits countdown ${isRunning ? 'running' : ''} ${isFinished ? 'finished' : ''}" id="timer-display-${task.id}">
                ${timeFormatted}
              </span>
              <button 
                type="button" 
                class="btn-timer-config" 
                onclick="openTimerConfig('${task.id}', event)" 
                title="Alterar duração do bloco Pomodoro (atual: ${targetMins} min)"
              >
                ⏱️ ${targetMins}m
              </button>
            </div>
            <div class="timer-btns">
              ${isRunning ? `
                <button class="btn btn-warning btn-sm" onclick="pauseTimer('${task.id}')" title="Pausar Contagem">
                  ⏸ Pausar
                </button>
              ` : `
                <button class="btn btn-success btn-sm" onclick="startTimer('${task.id}')" title="Iniciar Contagem">
                  ▶ Iniciar
                </button>
              `}
              <button class="btn btn-secondary btn-sm" onclick="resetTimer('${task.id}')" title="Reiniciar Contagem">
                ↺
              </button>
            </div>
            <div class="task-actions">
              <button class="btn-icon" onclick="openEditTaskModal('${task.id}')" title="Editar Tarefa">
                ✏️
              </button>
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
                  ${formatSubtaskDueDateBadge(st.dueDate, st.completed)}
                </div>
                <div class="subtask-item-actions">
                  <button class="btn-edit-subtask" onclick="openEditSubtaskModal('${task.id}', '${st.id}')" title="Editar subtarefa">
                    ✏️
                  </button>
                  <button class="btn-remove-subtask" onclick="removeSubtaskFromTask('${task.id}', '${st.id}')" title="Excluir subtarefa">
                    &times;
                  </button>
                </div>
              </div>
            `).join('')}

            <!-- Formulário para adicionar subtarefa inline -->
            <div class="add-subtask-form">
              <input 
                type="text" 
                id="input-new-subtask-${task.id}" 
                class="inline-subtask-text"
                placeholder="+ Nova subtarefa..."
                onkeydown="if(event.key==='Enter'){ addInlineSubtask('${task.id}'); }"
              >
              <input 
                type="date" 
                id="input-new-subtask-date-${task.id}" 
                class="inline-subtask-date"
                title="Prazo da subtarefa (opcional)"
              >
              <button 
                type="button" 
                class="btn btn-secondary btn-sm" 
                onclick="addInlineSubtask('${task.id}')"
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
  let allPomodoros = 0;
  dates.forEach(d => {
    const entry = dailyHistory[d];
    allTotal += entry.totalTasks || 0;
    allCompleted += entry.completedCount || 0;
    allSeconds += entry.totalSeconds || 0;
    if (entry.totalPomodoros !== undefined && entry.totalPomodoros > 0) {
      allPomodoros += entry.totalPomodoros;
    } else if (entry.tasks && Array.isArray(entry.tasks)) {
      entry.tasks.forEach(t => {
        allPomodoros += (t.pomodoroCount || 0);
      });
    }
  });
  const avgRate = allTotal > 0 ? Math.round((allCompleted / allTotal) * 100) : 0;

  if (historyOverallBadge) {
    historyOverallBadge.innerHTML = `
      <span class="history-stat-tag">📅 ${dates.length} ${dates.length === 1 ? 'dia arquivado' : 'dias arquivados'}</span>
      <span class="history-stat-tag">🎯 Média: ${avgRate}% concluído</span>
      <span class="history-stat-tag">⏱️ Tempo total: ${formatReadableTime(allSeconds)}</span>
      ${allPomodoros > 0 ? `<span class="history-stat-tag">🍅 ${allPomodoros} ${allPomodoros === 1 ? 'bloco' : 'blocos'}</span>` : ''}
    `;
  }

  historyListContainer.innerHTML = dates.map(dateKey => {
    const entry = dailyHistory[dateKey];
    const isOpen = openHistoryCards.has(dateKey);
    const entryTasks = entry.tasks || [];
    const completedTasks = entryTasks.filter(t => t.completed);
    const pendingTasks = entryTasks.filter(t => !t.completed);

    let dayPomodoros = entry.totalPomodoros || 0;
    if (!dayPomodoros && entryTasks.length > 0) {
      entryTasks.forEach(t => {
        dayPomodoros += (t.pomodoroCount || 0);
      });
    }

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
            ${dayPomodoros > 0 ? `<span class="badge-day-stat pomodoro" style="background: rgba(239, 68, 68, 0.18); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.35); font-weight: 600; padding: 4px 10px; border-radius: 999px; font-size: 12px;">🍅 ${dayPomodoros} ${dayPomodoros === 1 ? 'bloco' : 'blocos'}</span>` : ''}
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
window.openTimerConfig = openTimerConfig;
window.closeTimerConfigModal = closeTimerConfigModal;
window.applyTimerPreset = applyTimerPreset;
window.closeTimerFinishedModal = closeTimerFinishedModal;
window.pickRandomTask = pickRandomTask;
window.closeRandomTaskModal = closeRandomTaskModal;

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
  const target = row.target_seconds ? Number(row.target_seconds) : 1500;
  const elapsed = row.elapsed_seconds ? Number(row.elapsed_seconds) : 0;
  const pomodoros = row.pomodoro_count !== undefined 
    ? Number(row.pomodoro_count) 
    : Math.floor(elapsed / target);

  return {
    id: row.id,
    title: row.title,
    category: row.category || 'Geral',
    priority: row.priority || 'media',
    recurrence: row.recurrence || 'diaria',
    dueDate: row.due_date || null,
    description: row.description || '',
    completed: !!row.completed,
    createdAt: row.created_at ? Number(row.created_at) : Date.now(),
    targetSeconds: target,
    elapsedSeconds: elapsed,
    blockElapsedSeconds: 0,
    pomodoroCount: pomodoros,
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
    recurrence: task.recurrence || 'diaria',
    due_date: task.dueDate || null,
    description: task.description || '',
    completed: !!task.completed,
    created_at: task.createdAt || Date.now(),
    target_seconds: task.targetSeconds || 1500,
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
        const { error: upsertErr } = await supabaseClient.from('tasks').upsert(rows);
        if (upsertErr && (upsertErr.code === '42703' || (upsertErr.message && (upsertErr.message.includes('recurrence') || upsertErr.message.includes('due_date'))))) {
          const fallbackRows = rows.map(r => {
            const copy = { ...r };
            delete copy.recurrence;
            delete copy.due_date;
            return copy;
          });
          await supabaseClient.from('tasks').upsert(fallbackRows);
        }
      } else if (data.length > 0) {
        // Atualiza tarefas locais com os dados do Supabase
        const localTasksMap = new Map(tasks.map(t => [t.id, t]));
        tasks = data.map(row => {
          const mapped = mapDbTaskToModel(row);
          const existing = localTasksMap.get(mapped.id);
          if (existing) {
            if (existing.targetSeconds && !row.target_seconds) {
              mapped.targetSeconds = existing.targetSeconds;
            }
            if (existing.blockElapsedSeconds !== undefined) {
              mapped.blockElapsedSeconds = existing.blockElapsedSeconds;
            }
            if (existing.pomodoroCount !== undefined && mapped.pomodoroCount === 0) {
              mapped.pomodoroCount = existing.pomodoroCount;
            }
            if (!mapped.recurrence && existing.recurrence) {
              mapped.recurrence = existing.recurrence;
            }
            if (!mapped.dueDate && existing.dueDate) {
              mapped.dueDate = existing.dueDate;
            }
          }
          return mapped;
        });
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
      const existing = tasks[idx];
      const updated = mapDbTaskToModel(newRow);
      if (existing && existing.targetSeconds && !newRow.target_seconds) {
        updated.targetSeconds = existing.targetSeconds;
      }
      if (existing && existing.blockElapsedSeconds !== undefined) {
        updated.blockElapsedSeconds = existing.blockElapsedSeconds;
      }
      if (existing && existing.pomodoroCount !== undefined) {
        updated.pomodoroCount = Math.max(existing.pomodoroCount, updated.pomodoroCount);
      }
      if (!updated.recurrence && existing && existing.recurrence) {
        updated.recurrence = existing.recurrence;
      }
      if (!updated.dueDate && existing && existing.dueDate) {
        updated.dueDate = existing.dueDate;
      }
      tasks[idx] = updated;
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
    const row = mapModelToDbTask(task);
    const { error } = await supabaseClient.from('tasks').upsert(row);
    if (error) {
      if (error.code === '42703' || (error.message && (error.message.includes('recurrence') || error.message.includes('due_date')))) {
        // Fallback caso a tabela ainda não tenha as colunas recurrence ou due_date criadas
        const fallbackRow = { ...row };
        delete fallbackRow.recurrence;
        delete fallbackRow.due_date;
        await supabaseClient.from('tasks').upsert(fallbackRow);
      } else {
        console.warn('Aviso ao sincronizar tarefa com Supabase:', error.message);
      }
    }
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
    const { error } = await supabaseClient.from('tasks').upsert(rows);
    if (error && (error.code === '42703' || (error.message && (error.message.includes('recurrence') || error.message.includes('due_date'))))) {
      const fallbackRows = rows.map(r => {
        const copy = { ...r };
        delete copy.recurrence;
        delete copy.due_date;
        return copy;
      });
      await supabaseClient.from('tasks').upsert(fallbackRows);
    }
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

// Exposição global para chamadas inline (HTML onclick / onchange)
window.toggleTaskCompletion = toggleTaskCompletion;
window.deleteTask = deleteTask;
window.toggleSubtask = toggleSubtask;
window.addSubtaskToTask = addSubtaskToTask;
window.addInlineSubtask = addInlineSubtask;
window.removeSubtaskFromTask = removeSubtaskFromTask;
window.startTimer = startTimer;
window.pauseTimer = pauseTimer;
window.resetTimer = resetTimer;
window.openTimerConfig = openTimerConfig;
window.closeTimerConfigModal = closeTimerConfigModal;
window.applyTimerPreset = applyTimerPreset;
window.openEditTaskModal = openEditTaskModal;
window.closeEditTaskModal = closeEditTaskModal;
window.removeEditSubtask = removeEditSubtask;
window.openEditSubtaskModal = openEditSubtaskModal;
window.closeEditSubtaskModal = closeEditSubtaskModal;
window.removeInitialSubtask = removeInitialSubtask;
window.toggleHistoryCard = toggleHistoryCard;
window.deleteHistoryDay = deleteHistoryDay;
