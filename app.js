// TaskFlow & Timer - Gerenciador de Tarefas com Timer e Subtarefas
// Armazenamento local com sincronização automática e controle por timestamp

const STORAGE_KEY = 'taskflow_data_v2';
const HISTORY_STORAGE_KEY = 'taskflow_history_v1';
const ACTIVE_DATE_KEY = 'taskflow_active_date_v1';
const LAST_RESET_DATE_KEY = 'taskflow_last_reset_date_v1';

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
    category: 'ArtsIvo',
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
    category: 'Empreendedorismo',
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
    category: 'Empreendedorismo',
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
    category: 'Pessoal',
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
    category: 'Empreendedorismo',
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
    category: 'Empreendedorismo',
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
    category: 'Empreendedorismo',
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
    category: 'Empreendedorismo',
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
    category: 'Pessoal',
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
    category: 'Pessoal',
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
let analysisCategoryFilter = 'all';
let analysisSeverityFilter = 'all';
let analysisSort = 'neglect-desc';

// Elementos DOM
const currentDayTitle = document.getElementById('currentDayTitle');
const currentDaySubtitle = document.getElementById('currentDaySubtitle');
const tabToday = document.getElementById('tabToday');
const tabHistory = document.getElementById('tabHistory');
const tabAnalysis = document.getElementById('tabAnalysis');
const historyBadge = document.getElementById('historyBadge');
const analysisBadge = document.getElementById('analysisBadge');
const btnCompleteDay = document.getElementById('btnCompleteDay');

const lblTotalTasks = document.getElementById('lblTotalTasks');
const lblPendingTasks = document.getElementById('lblPendingTasks');
const lblCompletedTasks = document.getElementById('lblCompletedTasks');
const lblTotalTime = document.getElementById('lblTotalTime');
const lblTotalPomodoros = document.getElementById('lblTotalPomodoros');

const todayView = document.getElementById('todayView');
const historyView = document.getElementById('historyView');
const analysisView = document.getElementById('analysisView');
const historyListContainer = document.getElementById('historyListContainer');
const historyOverallBadge = document.getElementById('historyOverallBadge');

// Elementos da Aba de Análise
const btnToggleAnalysisConfig = document.getElementById('btnToggleAnalysisConfig');
const btnToggleAnalysisConfigText = document.getElementById('btnToggleAnalysisConfigText');
const analysisConfigPanel = document.getElementById('analysisConfigPanel');
const analysisTasksCheckboxList = document.getElementById('analysisTasksCheckboxList');
const analysisKpiGrid = document.getElementById('analysisKpiGrid');
const analysisCardsContainer = document.getElementById('analysisCardsContainer');
const analysisCategorySelect = document.getElementById('analysisCategorySelect');
const analysisSeveritySelect = document.getElementById('analysisSeveritySelect');
const analysisSortSelect = document.getElementById('analysisSortSelect');

const taskFormCard = document.getElementById('taskFormCard');
const taskFormHeader = document.getElementById('taskFormHeader');
const btnToggleTaskForm = document.getElementById('btnToggleTaskForm');
const taskFormToggleText = document.getElementById('taskFormToggleText');
const taskForm = document.getElementById('taskForm');
const taskTitleInput = document.getElementById('taskTitle');
const taskCategoryInput = document.getElementById('taskCategory');
const taskCategoryCustomInput = document.getElementById('taskCategoryCustom');
const taskPrioritySelect = document.getElementById('taskPriority');
const taskRecurrenceSelect = document.getElementById('taskRecurrence');
const taskDueDateInput = document.getElementById('taskDueDate');
const taskTimerMinutesInput = document.getElementById('taskTimerMinutes');
const taskIncludeInAnalysisCheckbox = document.getElementById('taskIncludeInAnalysis');
const taskDescriptionInput = document.getElementById('taskDescription');
const initialSubtaskInput = document.getElementById('initialSubtaskInput');
const initialSubtaskRecurrenceSelect = document.getElementById('initialSubtaskRecurrence');
const initialSubtaskDueDateInput = document.getElementById('initialSubtaskDueDate');
const btnAddInitialSubtask = document.getElementById('btnAddInitialSubtask');
const initialSubtasksList = document.getElementById('initialSubtasksList');

function setTaskFormMinimized(isMinimized) {
  if (!taskFormCard) return;
  taskFormCard.classList.toggle('collapsed', isMinimized);
  if (taskFormToggleText) {
    taskFormToggleText.textContent = isMinimized ? 'Expandir' : 'Minimizar';
  }
  localStorage.setItem('taskflow_form_minimized', isMinimized ? 'true' : 'false');
}

function toggleTaskForm() {
  if (!taskFormCard) return;
  const willBeMinimized = !taskFormCard.classList.contains('collapsed');
  setTaskFormMinimized(willBeMinimized);
}

function initTaskFormState() {
  const savedState = localStorage.getItem('taskflow_form_minimized');
  // Por padrão começa minimizado conforme solicitado
  const isMinimized = savedState !== 'false';
  setTaskFormMinimized(isMinimized);

  if (taskFormHeader) {
    taskFormHeader.addEventListener('click', toggleTaskForm);
    taskFormHeader.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleTaskForm();
      }
    });
  }

  if (btnToggleTaskForm) {
    btnToggleTaskForm.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleTaskForm();
    });
  }
}

const tasksContainer = document.getElementById('tasksContainer');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.filter-btn');
const sortSelect = document.getElementById('sortSelect');
let currentSort = localStorage.getItem('taskflow_sort') || 'default';

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
const randomCategorySelect = document.getElementById('randomCategorySelect');
const modalRandomCategorySelect = document.getElementById('modalRandomCategorySelect');
const randomTaskModal = document.getElementById('randomTaskModal');
const randomModalSubtitle = document.getElementById('randomModalSubtitle');
const randomPickedCard = document.getElementById('randomPickedCard');
const btnStartRandomTask = document.getElementById('btnStartRandomTask');
const btnRerollRandomTask = document.getElementById('btnRerollRandomTask');
const btnCloseRandomModal = document.getElementById('btnCloseRandomModal');
let selectedRandomCategory = 'all';

// Modal de Edição de Tarefa Completa
const editTaskModal = document.getElementById('editTaskModal');
const editTaskForm = document.getElementById('editTaskForm');
const editTaskIdInput = document.getElementById('editTaskId');
const editTaskTitleInput = document.getElementById('editTaskTitle');
const editTaskCategoryInput = document.getElementById('editTaskCategory');
const editTaskCategoryCustomInput = document.getElementById('editTaskCategoryCustom');
const editTaskPrioritySelect = document.getElementById('editTaskPriority');
const editTaskRecurrenceSelect = document.getElementById('editTaskRecurrence');
const editTaskDueDateInput = document.getElementById('editTaskDueDate');
const editTaskTimerMinutesInput = document.getElementById('editTaskTimerMinutes');
const editTaskElapsedMinutesInput = document.getElementById('editTaskElapsedMinutes');
const editTaskDescriptionInput = document.getElementById('editTaskDescription');
const editTaskIncludeInAnalysisCheckbox = document.getElementById('editTaskIncludeInAnalysis');
const editNewSubtaskInput = document.getElementById('editNewSubtaskInput');
const editNewSubtaskRecurrenceSelect = document.getElementById('editNewSubtaskRecurrence');
const editNewSubtaskDueDateInput = document.getElementById('editNewSubtaskDueDate');
const btnEditAddSubtask = document.getElementById('btnEditAddSubtask');
const editSubtasksList = document.getElementById('editSubtasksList');

// Modal de Edição de Subtarefa
const editSubtaskModal = document.getElementById('editSubtaskModal');
const editSubtaskForm = document.getElementById('editSubtaskForm');
const modalEditSubtaskIdInput = document.getElementById('modalEditSubtaskId');
const modalEditParentTaskIdInput = document.getElementById('modalEditParentTaskId');
const modalEditSubtaskTitleInput = document.getElementById('modalEditSubtaskTitle');
const modalEditSubtaskRecurrenceSelect = document.getElementById('modalEditSubtaskRecurrence');
const modalEditSubtaskDueDateInput = document.getElementById('modalEditSubtaskDueDate');

// Modal de Registro Manual de Tempo
const logTimeModal = document.getElementById('logTimeModal');
const logTimeTaskSubtitle = document.getElementById('logTimeTaskSubtitle');
const logTimeCurrentElapsed = document.getElementById('logTimeCurrentElapsed');
const logTimeCurrentBlocks = document.getElementById('logTimeCurrentBlocks');
const logTimeHoursInput = document.getElementById('logTimeHours');
const logTimeMinutesInput = document.getElementById('logTimeMinutes');
const logTimePreviewTotal = document.getElementById('logTimePreviewTotal');
const logTimePreviewBlocks = document.getElementById('logTimePreviewBlocks');
const logTimeMarkCompleted = document.getElementById('logTimeMarkCompleted');
const logTimeForm = document.getElementById('logTimeForm');

let currentConfiguringTaskId = null;
let currentFinishedTaskId = null;
let currentRandomChosenTaskId = null;
let currentLoggingTaskId = null;
let editTaskTempSubtasks = [];

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setupEventListeners();
  setupTabSwitching();
  updateDateDisplay();
  updateRandomCategoryOptions();
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

function getYesterdayDateKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateKeyFromTimestamp(dateStrOrTs) {
  if (!dateStrOrTs) return null;
  const d = new Date(dateStrOrTs);
  if (isNaN(d.getTime())) return null;
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
    const yKey = getYesterdayDateKey();

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
  } else if (activeTab === 'analysis') {
    if (currentDayTitle) currentDayTitle.textContent = '📊 Análise de Tarefas Deixadas de Lado';
    if (currentDaySubtitle) {
      const monitored = tasks.filter(t => !!t.includeInAnalysis);
      currentDaySubtitle.textContent = `${monitored.length} de ${tasks.length} tarefas selecionadas para monitoramento`;
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
    t.includeInAnalysis = t.includeInAnalysis !== undefined ? !!t.includeInAnalysis : false;
    if (t.category) {
      const catLower = t.category.toLowerCase().trim();
      if (catLower === 'villamor') t.category = 'Villamor';
      else if (catLower === 'artsivo') t.category = 'ArtsIvo';
      else if (catLower === 'pessoal') t.category = 'Pessoal';
      else if (catLower === 'empreendedorismo') t.category = 'Empreendedorismo';
      else if (t.id === 'task_artsivo' && (t.category === 'Geral' || !t.category)) t.category = 'ArtsIvo';
    } else {
      t.category = 'Geral';
    }
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
        st.recurrence = st.recurrence || getSubtaskRecurrence(st);
      });
    }
  });

  // 3. Verifica virada automática do dia (Rollover à meia-noite)
  checkDayRollover();
}

function checkDayRollover() {
  const todayKey = getTodayDateKey();
  const lastResetDate = localStorage.getItem(LAST_RESET_DATE_KEY);
  const storedActiveDate = localStorage.getItem(ACTIVE_DATE_KEY);

  const isDifferentActiveDate = storedActiveDate && storedActiveDate !== todayKey;
  const notResetToday = lastResetDate !== todayKey;

  if (isDifferentActiveDate || notResetToday) {
    const prevDate = isDifferentActiveDate ? storedActiveDate : (lastResetDate || getYesterdayDateKey());

    // Se o dia anterior ainda não foi arquivado e possui tarefas com progresso, arquiva
    const hasProgress = tasks && tasks.some(t => t.completed || (t.pomodoroCount || 0) > 0 || (t.elapsedSeconds || 0) > 0);
    if (prevDate && !dailyHistory[prevDate] && hasProgress) {
      archiveDay(prevDate, false);
    }

    resetTasksForNewDay();
    activeDate = todayKey;
    localStorage.setItem(LAST_RESET_DATE_KEY, todayKey);
    localStorage.setItem(ACTIVE_DATE_KEY, todayKey);
    updateDateDisplay();
    render();
    renderHistory();
    return true;
  } else {
    activeDate = storedActiveDate || todayKey;
  }
  return false;
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
  if (!tasks || tasks.length === 0 || !dateKey) return;

  const completedCount = tasks.filter(t => t.completed).length;

  // Se já existe um histórico para esta data e não é encerramento manual,
  // evita sobrescrever histórico preenchido com tarefas já zeradas
  if (dailyHistory[dateKey] && !isManual && (dailyHistory[dateKey].completedCount || 0) > completedCount) {
    return;
  }

  // Pausa cronômetros ativos
  tasks.forEach(t => {
    if (t.isRunning) {
      pauseTimer(t.id);
    }
  });

  const totalTasks = tasks.length;
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
      // Subtarefas diárias renovam (desmarcam), enquanto únicas e semanais mantêm status
      subtasks: (task.subtasks || []).map(st => {
        const rec = st.recurrence || getSubtaskRecurrence(st);
        const isDaily = rec === 'diaria';
        return {
          ...st,
          recurrence: rec,
          completed: isDaily ? false : !!st.completed
        };
      })
    };
  });
  saveTasks();
  if (supabaseClient) {
    dbSyncAllTasks();
  }
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
    const todayKey = getTodayDateKey();
    activeDate = todayKey;
    localStorage.setItem(LAST_RESET_DATE_KEY, todayKey);
    localStorage.setItem(ACTIVE_DATE_KEY, todayKey);
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
  // Controle de formulário colapsável
  initTaskFormState();

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

  // Ordenação de Tarefas
  if (sortSelect) {
    sortSelect.value = currentSort;
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      localStorage.setItem('taskflow_sort', currentSort);
      renderTasks();
    });
  }

  // Controle de Categoria Personalizada
  if (taskCategoryInput && taskCategoryCustomInput) {
    taskCategoryInput.addEventListener('change', () => {
      if (taskCategoryInput.value === '__custom__') {
        taskCategoryCustomInput.classList.remove('hidden');
        taskCategoryCustomInput.focus();
      } else {
        taskCategoryCustomInput.classList.add('hidden');
        taskCategoryCustomInput.value = '';
      }
    });
  }

  if (editTaskCategoryInput && editTaskCategoryCustomInput) {
    editTaskCategoryInput.addEventListener('change', () => {
      if (editTaskCategoryInput.value === '__custom__') {
        editTaskCategoryCustomInput.classList.remove('hidden');
        editTaskCategoryCustomInput.focus();
      } else {
        editTaskCategoryCustomInput.classList.add('hidden');
        editTaskCategoryCustomInput.value = '';
      }
    });
  }

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
  if (randomCategorySelect) {
    randomCategorySelect.addEventListener('change', (e) => {
      selectedRandomCategory = e.target.value;
      if (modalRandomCategorySelect) {
        modalRandomCategorySelect.value = selectedRandomCategory;
      }
    });
  }

  if (modalRandomCategorySelect) {
    modalRandomCategorySelect.addEventListener('change', (e) => {
      selectedRandomCategory = e.target.value;
      if (randomCategorySelect) {
        randomCategorySelect.value = selectedRandomCategory;
      }
      pickRandomTask(true);
    });
  }

  if (btnPickRandomTask) {
    btnPickRandomTask.addEventListener('click', () => {
      pickRandomTask(false);
    });
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
      pickRandomTask(true);
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
  if (logTimeModal) {
    logTimeModal.addEventListener('click', (e) => {
      if (e.target === logTimeModal) closeLogTimeModal();
    });
  }

  // Listeners da Aba de Análise
  if (btnToggleAnalysisConfig) {
    btnToggleAnalysisConfig.addEventListener('click', toggleAnalysisConfig);
  }
  if (analysisCategorySelect) {
    analysisCategorySelect.addEventListener('change', (e) => {
      analysisCategoryFilter = e.target.value;
      renderAnalysis();
    });
  }
  if (analysisSeveritySelect) {
    analysisSeveritySelect.addEventListener('change', (e) => {
      analysisSeverityFilter = e.target.value;
      renderAnalysis();
    });
  }
  if (analysisSortSelect) {
    analysisSortSelect.addEventListener('change', (e) => {
      analysisSort = e.target.value;
      renderAnalysis();
    });
  }
}

// Alternância entre Hoje, Histórico e Análise
function setupTabSwitching() {
  if (tabToday) {
    tabToday.addEventListener('click', () => {
      activeTab = 'today';
      tabToday.classList.add('active');
      tabHistory.classList.remove('active');
      if (tabAnalysis) tabAnalysis.classList.remove('active');
      if (todayView) todayView.classList.remove('hidden');
      if (historyView) historyView.classList.add('hidden');
      if (analysisView) analysisView.classList.add('hidden');
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
      if (tabAnalysis) tabAnalysis.classList.remove('active');
      if (todayView) todayView.classList.add('hidden');
      if (historyView) historyView.classList.remove('hidden');
      if (analysisView) analysisView.classList.add('hidden');
      if (btnCompleteDay) btnCompleteDay.style.display = 'none';
      updateDateDisplay();
      updateMetrics();
      renderHistory();
    });
  }

  if (tabAnalysis) {
    tabAnalysis.addEventListener('click', () => {
      activeTab = 'analysis';
      tabAnalysis.classList.add('active');
      tabToday.classList.remove('active');
      tabHistory.classList.remove('active');
      if (todayView) todayView.classList.add('hidden');
      if (historyView) historyView.classList.add('hidden');
      if (analysisView) analysisView.classList.remove('hidden');
      if (btnCompleteDay) btnCompleteDay.style.display = 'none';
      updateDateDisplay();
      updateMetrics();
      renderAnalysis();
    });
  }
}

// Manipulação do Formulário
function addInitialSubtask() {
  const text = initialSubtaskInput.value.trim();
  if (!text) return;

  const recurrence = initialSubtaskRecurrenceSelect ? initialSubtaskRecurrenceSelect.value : 'diaria';
  const dueDate = initialSubtaskDueDateInput ? initialSubtaskDueDateInput.value : '';

  initialSubtasks.push({
    id: generateId(),
    title: text,
    recurrence: recurrence,
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
  initialSubtasksList.innerHTML = initialSubtasks.map((st, i) => {
    const rec = st.recurrence || 'diaria';
    const recLabel = rec === 'diaria' ? '🔄 Diária' : (rec === 'semanal' ? '🔄 Semanal' : '📌 Única');
    return `
      <span class="subtask-chip">
        <span>${escapeHtml(st.title)} <small class="chip-rec-badge">${recLabel}</small> ${st.dueDate ? `<small style="opacity: 0.8; font-size: 11px;">(📅 ${formatShortDate(st.dueDate)})</small>` : ''}</span>
        <button type="button" onclick="removeInitialSubtask(${i})" title="Remover">&times;</button>
      </span>
    `;
  }).join('');
}

function getSelectedCategory(selectEl, customInputEl) {
  if (!selectEl) return 'Geral';
  if (selectEl.value === '__custom__') {
    return (customInputEl && customInputEl.value.trim()) ? customInputEl.value.trim() : 'Geral';
  }
  return selectEl.value.trim() || 'Geral';
}

function formatCategoryBadge(category) {
  if (!category) return '';
  const cat = category.trim();
  const lower = cat.toLowerCase();

  let className = 'badge-category-default';
  let icon = '📁';

  if (lower === 'villamor') {
    className = 'badge-category-villamor';
    icon = '🏢';
  } else if (lower === 'artsivo') {
    className = 'badge-category-artsivo';
    icon = '🎨';
  } else if (lower === 'pessoal') {
    className = 'badge-category-pessoal';
    icon = '👤';
  } else if (lower === 'empreendedorismo') {
    className = 'badge-category-empreendedorismo';
    icon = '🚀';
  }

  return `<span class="badge badge-category ${className}" onclick="filterByCategory('${escapeHtml(cat)}')" title="Filtrar tarefas por ${escapeHtml(cat)}">${icon} ${escapeHtml(cat)}</span>`;
}

function filterByCategory(cat) {
  if (searchInput) {
    if (searchInput.value === cat) {
      searchInput.value = '';
      searchQuery = '';
    } else {
      searchInput.value = cat;
      searchQuery = cat.toLowerCase();
    }
    renderTasks();
  }
}
window.filterByCategory = filterByCategory;

function handleCreateTask(e) {
  e.preventDefault();
  const title = taskTitleInput.value.trim();
  if (!title) return;

  const targetMins = parseInt(taskTimerMinutesInput ? taskTimerMinutesInput.value : '25', 10) || 25;
  const recurrence = taskRecurrenceSelect ? taskRecurrenceSelect.value : 'diaria';
  const dueDate = taskDueDateInput ? taskDueDateInput.value : '';
  const category = getSelectedCategory(taskCategoryInput, taskCategoryCustomInput);
  const includeInAnalysis = taskIncludeInAnalysisCheckbox ? !!taskIncludeInAnalysisCheckbox.checked : false;

  const newTask = {
    id: generateId(),
    title: title,
    category: category,
    priority: taskPrioritySelect.value || 'media',
    recurrence: recurrence || 'diaria',
    dueDate: dueDate || null,
    includeInAnalysis: includeInAnalysis,
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
  if (taskIncludeInAnalysisCheckbox) taskIncludeInAnalysisCheckbox.checked = false;
  if (taskTimerMinutesInput) taskTimerMinutesInput.value = '25';
  if (taskRecurrenceSelect) taskRecurrenceSelect.value = 'diaria';
  if (taskCategoryInput) taskCategoryInput.value = 'Villamor';
  if (taskCategoryCustomInput) {
    taskCategoryCustomInput.value = '';
    taskCategoryCustomInput.classList.add('hidden');
  }
  if (taskDueDateInput) taskDueDateInput.value = '';
  if (initialSubtaskDueDateInput) initialSubtaskDueDateInput.value = '';
  initialSubtasks = [];
  renderInitialSubtasksChips();

  render();
  setTaskFormMinimized(true);
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

function getSubtaskRecurrence(st) {
  if (st && st.recurrence) return st.recurrence;
  const titleLower = ((st && st.title) || '').toLowerCase();
  if (
    titleLower.includes('diário') || titleLower.includes('diario') ||
    titleLower.includes('diária') || titleLower.includes('diaria') ||
    titleLower.includes('café') || titleLower.includes('cafe') ||
    titleLower.includes('almoço') || titleLower.includes('almoco') ||
    titleLower.includes('janta') || titleLower.includes('jantar')
  ) {
    return 'diaria';
  }
  if (titleLower.includes('semanal')) {
    return 'semanal';
  }
  return 'nenhuma';
}

function formatSubtaskRecurrenceBadge(recurrence, taskId, subtaskId) {
  const rec = recurrence || 'nenhuma';
  let badgeClass = 'once';
  let label = '📌 Única';
  let title = 'Subtarefa única (não repete). Clique para alternar para Diária.';

  if (rec === 'diaria') {
    badgeClass = 'daily';
    label = '🔄 Diária';
    title = 'Subtarefa diária (renova a cada dia). Clique para alternar para Semanal.';
  } else if (rec === 'semanal') {
    badgeClass = 'weekly';
    label = '🔄 Semanal';
    title = 'Subtarefa semanal. Clique para alternar para Única.';
  }

  return `<button type="button" class="subtask-recurrence-badge ${badgeClass}" onclick="toggleSubtaskRecurrence('${taskId}', '${subtaskId}', event)" title="${title}">${label}</button>`;
}

function toggleSubtaskRecurrence(taskId, subtaskId, e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  const task = tasks.find(t => t.id === taskId);
  if (!task || !task.subtasks) return;
  const st = task.subtasks.find(s => s.id === subtaskId);
  if (!st) return;

  const currentRec = st.recurrence || getSubtaskRecurrence(st);
  if (currentRec === 'diaria') {
    st.recurrence = 'semanal';
  } else if (currentRec === 'semanal') {
    st.recurrence = 'nenhuma';
  } else {
    st.recurrence = 'diaria';
  }

  saveTasks();
  render();
  dbUpsertTask(task);
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
// ==========================================
// Sorteio Aleatório de Tarefas com Filtro de Categoria
// ==========================================

function getAvailableCategories() {
  const baseCategories = ['Villamor', 'ArtsIvo', 'Pessoal', 'Empreendedorismo', 'Geral'];
  const cats = new Set(baseCategories);
  (tasks || []).forEach(t => {
    if (t.category && typeof t.category === 'string') {
      const trimmed = t.category.trim();
      if (trimmed) cats.add(trimmed);
    }
  });
  return Array.from(cats);
}

function updateRandomCategoryOptions() {
  const categories = getAvailableCategories();
  const getCatIcon = (cat) => {
    const l = cat.toLowerCase();
    if (l === 'villamor') return '🏢';
    if (l === 'artsivo') return '🎨';
    if (l === 'pessoal') return '👤';
    if (l === 'empreendedorismo') return '🚀';
    if (l === 'geral') return '📁';
    return '🏷️';
  };

  const optionsHtml = `
    <option value="all">🎲 Todas as Categorias</option>
    ${categories.map(c => `<option value="${escapeHtml(c)}">${getCatIcon(c)} ${escapeHtml(c)}</option>`).join('')}
  `;

  if (randomCategorySelect) {
    const prev = randomCategorySelect.value || selectedRandomCategory || 'all';
    randomCategorySelect.innerHTML = optionsHtml;
    randomCategorySelect.value = (prev === 'all' || categories.includes(prev)) ? prev : 'all';
  }

  if (modalRandomCategorySelect) {
    const prev = modalRandomCategorySelect.value || selectedRandomCategory || 'all';
    modalRandomCategorySelect.innerHTML = optionsHtml;
    modalRandomCategorySelect.value = (prev === 'all' || categories.includes(prev)) ? prev : 'all';
  }
}

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

function pickRandomTask(isReroll = false) {
  const pendingTasks = tasks.filter(t => !t.completed);

  if (pendingTasks.length === 0) {
    alert('🎉 Parabéns! Todas as tarefas da rotina de hoje já foram concluídas!');
    return;
  }

  // Filtra apenas as tarefas pendentes que ainda não tiveram nada feito hoje (sem blocos nem tempo trabalhado)
  const allEligibleTasks = pendingTasks.filter(isTaskUntouchedToday);

  if (allEligibleTasks.length === 0) {
    alert('✨ Todas as tarefas pendentes de hoje já tiveram blocos ou tempo de foco iniciados!\n\nNenhuma tarefa zerada restante para sortear hoje.');
    return;
  }

  // Se o filtro ativo for 'completed', alterna para 'all' para que a tarefa sorteada fique visível
  if (activeFilter === 'completed') {
    activeFilter = 'all';
    filterBtns.forEach(b => b.classList.toggle('active', b.dataset.filter === 'all'));
    renderTasks();
  }

  const activeCat = selectedRandomCategory || 'all';
  let eligibleTasks = allEligibleTasks;

  if (activeCat !== 'all') {
    eligibleTasks = allEligibleTasks.filter(t => {
      const tCat = (t.category || 'Geral').toLowerCase().trim();
      return tCat === activeCat.toLowerCase().trim();
    });
  }

  // Sincroniza selects de categoria
  if (randomCategorySelect && randomCategorySelect.value !== activeCat) {
    randomCategorySelect.value = activeCat;
  }
  if (modalRandomCategorySelect && modalRandomCategorySelect.value !== activeCat) {
    modalRandomCategorySelect.value = activeCat;
  }

  // Se não há tarefas elegíveis na categoria selecionada
  if (eligibleTasks.length === 0) {
    showEmptyRandomCategoryModal(activeCat, allEligibleTasks.length);
    if (isReroll) {
      triggerRerollAnimation(true);
    }
    return;
  }

  // Caso exista apenas 1 tarefa elegível nesta categoria
  if (eligibleTasks.length === 1) {
    const singleTask = eligibleTasks[0];
    currentRandomChosenTaskId = singleTask.id;
    showRandomTaskModal(singleTask, getTaskExecutionTime(singleTask), 1, activeCat);
    if (isReroll) {
      triggerRerollAnimation(true);
    }
    return;
  }

  // Sorteia entre todas as tarefas elegíveis da categoria hoje, garantindo escolher uma DIFERENTE da atual
  let pool = eligibleTasks;
  if (currentRandomChosenTaskId) {
    const others = eligibleTasks.filter(t => t.id !== currentRandomChosenTaskId);
    if (others.length > 0) {
      pool = others;
    }
  }

  const randomIndex = Math.floor(Math.random() * pool.length);
  const chosenTask = pool[randomIndex];

  currentRandomChosenTaskId = chosenTask.id;
  showRandomTaskModal(chosenTask, getTaskExecutionTime(chosenTask), eligibleTasks.length, activeCat);

  if (isReroll) {
    triggerRerollAnimation(false);
  }
}

function showEmptyRandomCategoryModal(category, totalAllUntouched) {
  if (!randomTaskModal || !randomPickedCard) return;

  currentRandomChosenTaskId = null;
  if (randomModalSubtitle) {
    randomModalSubtitle.textContent = `Categoria "${category}" sem tarefas disponíveis hoje`;
  }

  randomPickedCard.innerHTML = `
    <div style="text-align: center; padding: 20px 12px;">
      <div style="font-size: 34px; margin-bottom: 8px;">ℹ️</div>
      <div style="font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 8px;">
        Nenhuma tarefa pendente sem blocos em "${escapeHtml(category)}" hoje
      </div>
      <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px; line-height: 1.45;">
        Todas as tarefas desta categoria já foram concluídas ou já tiveram foco realizado hoje.
      </p>
      <button type="button" class="btn btn-secondary btn-sm" onclick="resetRandomCategoryToAll()" style="display: inline-flex; align-items: center; gap: 6px; font-weight: 600;">
        🎲 Sortear em Todas as Categorias (${totalAllUntouched} disponíveis)
      </button>
    </div>
  `;

  if (btnStartRandomTask) btnStartRandomTask.disabled = true;
  if (btnRerollRandomTask) btnRerollRandomTask.disabled = true;

  randomTaskModal.classList.remove('hidden');
}

function resetRandomCategoryToAll() {
  selectedRandomCategory = 'all';
  if (randomCategorySelect) randomCategorySelect.value = 'all';
  if (modalRandomCategorySelect) modalRandomCategorySelect.value = 'all';
  pickRandomTask(true);
}
window.resetRandomCategoryToAll = resetRandomCategoryToAll;

function triggerRerollAnimation(isOnlyOne = false) {
  const icon = document.querySelector('.random-modal-icon');
  if (icon) {
    icon.classList.remove('rolling');
    void icon.offsetWidth; // Força reflow para reiniciar animação
    icon.classList.add('rolling');
  }

  if (randomPickedCard) {
    if (isOnlyOne) {
      randomPickedCard.classList.remove('shake-card');
      void randomPickedCard.offsetWidth;
      randomPickedCard.classList.add('shake-card');

      const infoNote = randomPickedCard.querySelector('.random-info-note');
      if (infoNote) {
        infoNote.innerHTML = `<span style="color: #f59e0b; font-weight: 600;">⚠️ Esta é a única tarefa pendente sem blocos hoje nesta categoria. Não há outra para sortear!</span>`;
      }
    } else {
      randomPickedCard.classList.remove('card-reroll');
      void randomPickedCard.offsetWidth;
      randomPickedCard.classList.add('card-reroll');
    }
  }
}

function showRandomTaskModal(task, executionSeconds, totalCandidates, category = 'all') {
  if (!randomTaskModal || !randomPickedCard) return;

  if (btnStartRandomTask) btnStartRandomTask.disabled = false;
  if (btnRerollRandomTask) btnRerollRandomTask.disabled = false;

  const taskMinutes = Math.max(1, Math.round(executionSeconds / 60));
  const subtasks = task.subtasks || [];
  const completedSubs = subtasks.filter(s => s.completed).length;

  if (randomModalSubtitle) {
    randomModalSubtitle.textContent = category === 'all'
      ? 'Selecionada aleatoriamente entre todas as categorias sem blocos iniciados hoje'
      : `Selecionada aleatoriamente na categoria "${category}" sem blocos hoje`;
  }

  randomPickedCard.innerHTML = `
    <div class="random-picked-header">
      <div class="random-picked-title">${escapeHtml(task.title)}</div>
    </div>

    <div class="random-picked-badges">
      <span class="random-time-badge">⏱️ Bloco de ${taskMinutes} min</span>
      ${formatCategoryBadge(task.category)}
      <span class="badge badge-priority-${task.priority || 'media'}">${formatPriorityLabel(task.priority || 'media')}</span>
      ${subtasks.length > 0 ? `<span class="badge" style="background: rgba(148,163,184,0.15); color: #cbd5e1; font-size: 11px;">📋 ${completedSubs}/${subtasks.length} subtarefas</span>` : ''}
    </div>

    ${task.description ? `<p class="random-picked-desc">${escapeHtml(task.description)}</p>` : ''}

    <div class="random-info-note">
      ${totalCandidates > 1 
        ? `<span>🎲 Sorteada entre <strong>${totalCandidates} tarefas</strong> ${category === 'all' ? 'de todas as categorias' : `da categoria <strong>${escapeHtml(category)}</strong>`} sem blocos hoje (${taskMinutes}m).</span>` 
        : `<span>⭐ Esta é a <strong>única tarefa</strong> ${category === 'all' ? '' : `da categoria <strong>${escapeHtml(category)}</strong> `}sem blocos hoje (${taskMinutes}m).</span>`
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

// ==========================================
// Registro Manual de Tempo Executado
// ==========================================

function openLogTimeModal(taskId, e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  currentLoggingTaskId = taskId;
  if (logTimeTaskSubtitle) {
    logTimeTaskSubtitle.textContent = `Tarefa: "${task.title}"`;
  }

  const currentSecs = getTaskCurrentSeconds(task);
  const target = getTaskTargetSeconds(task) || 1500;
  const currentBlocks = task.pomodoroCount !== undefined ? task.pomodoroCount : Math.floor(currentSecs / target);

  if (logTimeCurrentElapsed) {
    logTimeCurrentElapsed.textContent = formatReadableTime(currentSecs);
  }
  if (logTimeCurrentBlocks) {
    logTimeCurrentBlocks.textContent = `${currentBlocks} ${currentBlocks === 1 ? 'bloco' : 'blocos'}`;
  }

  // Modo padrão: Adicionar ao tempo atual
  const addRadio = document.querySelector('input[name="logTimeMode"][value="add"]');
  if (addRadio) addRadio.checked = true;

  // Sugestão inicial: duração do bloco Pomodoro ou 25 min
  const defaultMins = Math.round(target / 60) || 25;
  if (logTimeHoursInput) logTimeHoursInput.value = 0;
  if (logTimeMinutesInput) logTimeMinutesInput.value = defaultMins;

  if (logTimeMarkCompleted) {
    logTimeMarkCompleted.checked = !!task.completed;
  }

  updateLogTimePreview();

  if (logTimeModal) {
    logTimeModal.classList.remove('hidden');
  }
  if (logTimeMinutesInput) {
    setTimeout(() => logTimeMinutesInput.select(), 50);
  }
}

function closeLogTimeModal() {
  if (logTimeModal) {
    logTimeModal.classList.add('hidden');
  }
  currentLoggingTaskId = null;
}

function quickAddLogTime(minutes) {
  const addRadio = document.querySelector('input[name="logTimeMode"][value="add"]');
  if (addRadio) addRadio.checked = true;

  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (logTimeHoursInput) logTimeHoursInput.value = hrs;
  if (logTimeMinutesInput) logTimeMinutesInput.value = mins;

  updateLogTimePreview();
}

function updateLogTimePreview() {
  if (!currentLoggingTaskId) return;
  const task = tasks.find(t => t.id === currentLoggingTaskId);
  if (!task) return;

  const modeRadio = document.querySelector('input[name="logTimeMode"]:checked');
  const mode = modeRadio ? modeRadio.value : 'add';

  const hrs = Math.max(0, parseInt(logTimeHoursInput ? logTimeHoursInput.value : '0', 10) || 0);
  const mins = Math.max(0, parseInt(logTimeMinutesInput ? logTimeMinutesInput.value : '0', 10) || 0);
  const inputSecs = (hrs * 3600) + (mins * 60);

  const currentSecs = getTaskCurrentSeconds(task);
  const targetSecs = getTaskTargetSeconds(task) || 1500;

  let resultingSecs = 0;
  if (mode === 'add') {
    resultingSecs = currentSecs + inputSecs;
  } else {
    resultingSecs = inputSecs;
  }

  const resultingBlocks = Math.floor(resultingSecs / targetSecs);

  if (logTimePreviewTotal) {
    logTimePreviewTotal.textContent = formatReadableTime(resultingSecs);
  }
  if (logTimePreviewBlocks) {
    logTimePreviewBlocks.textContent = resultingBlocks === 1 
      ? 'Equivalente a 1 bloco de foco' 
      : `Equivalente a ${resultingBlocks} blocos de foco`;
  }
}

function handleSaveLogTime(e) {
  if (e) e.preventDefault();
  if (!currentLoggingTaskId) return;
  const task = tasks.find(t => t.id === currentLoggingTaskId);
  if (!task) return;

  // Se o timer estiver rodando nesta tarefa, pausa antes de registrar
  if (task.isRunning) {
    pauseTimer(task.id);
  }

  const modeRadio = document.querySelector('input[name="logTimeMode"]:checked');
  const mode = modeRadio ? modeRadio.value : 'add';

  const hrs = Math.max(0, parseInt(logTimeHoursInput ? logTimeHoursInput.value : '0', 10) || 0);
  const mins = Math.max(0, parseInt(logTimeMinutesInput ? logTimeMinutesInput.value : '0', 10) || 0);
  const inputSecs = (hrs * 3600) + (mins * 60);

  const currentSecs = task.elapsedSeconds || 0;
  const target = getTaskTargetSeconds(task) || 1500;

  let finalSecs = 0;
  if (mode === 'add') {
    finalSecs = currentSecs + inputSecs;
  } else {
    finalSecs = inputSecs;
  }

  task.elapsedSeconds = Math.max(0, finalSecs);
  task.pomodoroCount = Math.floor(task.elapsedSeconds / target);
  task.blockElapsedSeconds = 0;
  task.isRunning = false;
  task.timerStartedAt = null;

  if (logTimeMarkCompleted && logTimeMarkCompleted.checked) {
    task.completed = true;
  }

  saveTasks();
  render();
  closeLogTimeModal();
  dbUpsertTask(task);
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
    // 1. Verifica virada de dia em tempo real (mesmo com a aba aberta à meia-noite)
    checkDayRollover();

    // 2. Banner e contagem regressiva da tarefa em andamento
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
  const recInput = document.getElementById(`input-new-subtask-rec-${taskId}`);
  const dateInput = document.getElementById(`input-new-subtask-date-${taskId}`);
  if (!textInput) return;

  const title = textInput.value.trim();
  if (!title) return;

  const recurrence = recInput ? recInput.value : 'diaria';
  const dueDate = dateInput ? dateInput.value : '';

  const task = tasks.find(t => t.id === taskId);
  if (task) {
    if (!task.subtasks) task.subtasks = [];
    task.subtasks.push({
      id: generateId(),
      title: title,
      recurrence: recurrence,
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
  if (editTaskCategoryInput) {
    const knownValues = ['Villamor', 'ArtsIvo', 'Pessoal', 'Empreendedorismo', 'Geral'];
    const currentCat = (task.category || 'Geral').trim();
    const match = knownValues.find(v => v.toLowerCase() === currentCat.toLowerCase());
    if (match) {
      editTaskCategoryInput.value = match;
      if (editTaskCategoryCustomInput) {
        editTaskCategoryCustomInput.classList.add('hidden');
        editTaskCategoryCustomInput.value = '';
      }
    } else {
      editTaskCategoryInput.value = '__custom__';
      if (editTaskCategoryCustomInput) {
        editTaskCategoryCustomInput.classList.remove('hidden');
        editTaskCategoryCustomInput.value = currentCat;
      }
    }
  }
  if (editTaskPrioritySelect) editTaskPrioritySelect.value = task.priority || 'media';
  if (editTaskRecurrenceSelect) editTaskRecurrenceSelect.value = task.recurrence || 'diaria';
  if (editTaskDueDateInput) editTaskDueDateInput.value = task.dueDate || '';
  if (editTaskTimerMinutesInput) editTaskTimerMinutesInput.value = Math.round(getTaskTargetSeconds(task) / 60);
  if (editTaskElapsedMinutesInput) editTaskElapsedMinutesInput.value = Math.round((task.elapsedSeconds || 0) / 60);
  if (editTaskDescriptionInput) editTaskDescriptionInput.value = task.description || '';
  if (editTaskIncludeInAnalysisCheckbox) {
    editTaskIncludeInAnalysisCheckbox.checked = !!task.includeInAnalysis;
  }

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

  const recurrence = editNewSubtaskRecurrenceSelect ? editNewSubtaskRecurrenceSelect.value : 'diaria';
  const dueDate = editNewSubtaskDueDateInput ? editNewSubtaskDueDateInput.value : '';
  editTaskTempSubtasks.push({
    id: generateId(),
    title: title,
    recurrence: recurrence,
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

  editSubtasksList.innerHTML = editTaskTempSubtasks.map((st, i) => {
    const rec = st.recurrence || getSubtaskRecurrence(st);
    return `
      <div class="edit-subtask-row">
        <input 
          type="text" 
          value="${escapeHtml(st.title)}" 
          placeholder="Subtarefa..." 
          onchange="editTaskTempSubtasks[${i}].title = this.value.trim()"
        >
        <select 
          class="edit-subtask-select-rec" 
          title="Recorrência da subtarefa"
          onchange="editTaskTempSubtasks[${i}].recurrence = this.value"
        >
          <option value="diaria" ${rec === 'diaria' ? 'selected' : ''}>🔄 Diária</option>
          <option value="nenhuma" ${rec === 'nenhuma' ? 'selected' : ''}>📌 Única</option>
          <option value="semanal" ${rec === 'semanal' ? 'selected' : ''}>🔄 Semanal</option>
        </select>
        <input 
          type="date" 
          value="${st.dueDate || ''}" 
          title="Prazo da subtarefa"
          onchange="editTaskTempSubtasks[${i}].dueDate = this.value || null"
        >
        <button type="button" class="btn-remove-edit-subtask" onclick="removeEditSubtask(${i})" title="Remover subtarefa">&times;</button>
      </div>
    `;
  }).join('');
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
  task.category = getSelectedCategory(editTaskCategoryInput, editTaskCategoryCustomInput);
  task.priority = editTaskPrioritySelect.value || 'media';
  task.recurrence = editTaskRecurrenceSelect.value || 'diaria';
  task.dueDate = editTaskDueDateInput.value || null;
  task.description = editTaskDescriptionInput.value.trim();
  if (editTaskIncludeInAnalysisCheckbox) {
    task.includeInAnalysis = !!editTaskIncludeInAnalysisCheckbox.checked;
  }
  task.subtasks = JSON.parse(JSON.stringify(editTaskTempSubtasks));

  if (oldTarget !== newTargetSecs) {
    task.targetSeconds = newTargetSecs;
    if (!task.isRunning) {
      task.blockElapsedSeconds = 0;
    }
  }

  if (editTaskElapsedMinutesInput) {
    const newElapsedMins = Math.max(0, parseInt(editTaskElapsedMinutesInput.value, 10) || 0);
    task.elapsedSeconds = newElapsedMins * 60;
    task.pomodoroCount = Math.floor(task.elapsedSeconds / (newTargetSecs || 1500));
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
  if (modalEditSubtaskRecurrenceSelect) modalEditSubtaskRecurrenceSelect.value = subtask.recurrence || getSubtaskRecurrence(subtask);
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
  if (modalEditSubtaskRecurrenceSelect) {
    subtask.recurrence = modalEditSubtaskRecurrenceSelect.value;
  }
  subtask.dueDate = modalEditSubtaskDueDateInput.value || null;

  saveTasks();
  render();
  closeEditSubtaskModal();
  dbUpsertTask(task);
}

// Renderização Geral
function render() {
  updateMetrics();
  updateAnalysisBadge();
  updateRandomCategoryOptions();
  renderTasks();
  if (activeTab === 'analysis') {
    renderAnalysis();
  }
}

function updateAnalysisBadge() {
  if (!analysisBadge) return;
  const monitoredTasks = tasks.filter(t => !!t.includeInAnalysis);
  const criticalCount = monitoredTasks.filter(t => calculateTaskNeglect(t).severity === 'critical').length;
  if (criticalCount > 0) {
    analysisBadge.textContent = criticalCount;
    analysisBadge.classList.remove('hidden');
    analysisBadge.style.background = 'var(--danger)';
  } else {
    analysisBadge.classList.add('hidden');
  }
}

function updateMetrics() {
  if (activeTab === 'history') {
    updateHistoryMetrics();
  } else if (activeTab === 'analysis') {
    updateAnalysisMetrics();
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

  // Ordenação das tarefas
  const sorted = [...filtered].sort((a, b) => {
    switch (currentSort) {
      case 'pending-first': {
        // Não concluídas (pendentes) primeiro
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        return 0;
      }
      case 'completed-first': {
        // Concluídas primeiro
        if (a.completed !== b.completed) {
          return a.completed ? -1 : 1;
        }
        return 0;
      }
      case 'time-desc': {
        // Mais tempo dedicado hoje (decrescente)
        const timeA = getTaskCurrentSeconds(a);
        const timeB = getTaskCurrentSeconds(b);
        if (timeB !== timeA) return timeB - timeA;
        return (b.pomodoroCount || 0) - (a.pomodoroCount || 0);
      }
      case 'time-asc': {
        // Menos tempo dedicado hoje (crescente)
        const timeA = getTaskCurrentSeconds(a);
        const timeB = getTaskCurrentSeconds(b);
        if (timeA !== timeB) return timeA - timeB;
        return (a.pomodoroCount || 0) - (b.pomodoroCount || 0);
      }
      case 'priority-desc': {
        // Maior prioridade primeiro
        const priorityWeight = { urgente: 4, alta: 3, media: 2, baixa: 1 };
        const weightA = priorityWeight[a.priority] || 2;
        const weightB = priorityWeight[b.priority] || 2;
        return weightB - weightA;
      }
      case 'category': {
        // Agrupar por categoria
        const catA = (a.category || 'Geral').toLowerCase();
        const catB = (b.category || 'Geral').toLowerCase();
        if (catA !== catB) return catA.localeCompare(catB);
        return 0;
      }
      case 'due-date': {
        // Prazo mais próximo primeiro (sem prazo vai para o final)
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }
      case 'default':
      default:
        return 0;
    }
  });

  if (sorted.length === 0) {
    tasksContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>Nenhuma tarefa encontrada</h3>
        <p>Crie uma nova tarefa acima ou ajuste seus filtros de busca.</p>
      </div>
    `;
    return;
  }

  let hasInsertedDivider = false;
  const completedCount = sorted.filter(t => t.completed).length;
  const pendingCount = sorted.filter(t => !t.completed).length;

  tasksContainer.innerHTML = sorted.map(task => {
    let sectionDividerHtml = '';
    if (currentSort === 'pending-first' && task.completed && !hasInsertedDivider && pendingCount > 0) {
      hasInsertedDivider = true;
      sectionDividerHtml = `
        <div class="tasks-section-divider">
          <span>✅ Concluídas (${completedCount})</span>
        </div>
      `;
    } else if (currentSort === 'completed-first' && !task.completed && !hasInsertedDivider && completedCount > 0) {
      hasInsertedDivider = true;
      sectionDividerHtml = `
        <div class="tasks-section-divider">
          <span>⏳ Pendentes (${pendingCount})</span>
        </div>
      `;
    }

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
    const dedicatedSeconds = getTaskCurrentSeconds(task);

    return `
      ${sectionDividerHtml}
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
                ${formatCategoryBadge(task.category)}
                <span class="badge badge-priority-${priorityKey}">${formatPriorityLabel(priorityKey)}</span>
                ${formatRecurrenceBadge(task.recurrence || 'diaria')}
                ${formatDueDateBadge(task.dueDate, task.completed)}
                ${task.includeInAnalysis ? `
                  <span 
                    class="badge badge-analysis-active clickable" 
                    onclick="toggleTaskAnalysis('${task.id}', event)" 
                    title="Esta tarefa participa da análise de tarefas deixadas de lado (clique para remover da análise)"
                  >
                    📊 Na Análise
                  </span>
                ` : ''}
                ${totalSub > 0 ? `<span class="badge" style="background: rgba(148,163,184,0.15); color: #cbd5e1;">📋 ${completedSub}/${totalSub} subtarefas</span>` : ''}
                ${(pomodoroCount > 0 || dedicatedSeconds > 0) ? `
                  <span 
                    class="badge badge-pomodoro clickable" 
                    onclick="openLogTimeModal('${task.id}', event)" 
                    title="${pomodoroCount} bloco(s) de foco hoje • Total dedicado: ${formatReadableTime(dedicatedSeconds)} (Clique para registrar ou ajustar tempo)"
                  >
                    🍅 ${pomodoroCount > 0 ? `${pomodoroCount} ${pomodoroCount === 1 ? 'bloco' : 'blocos'} • ` : ''}${formatReadableTime(dedicatedSeconds)} ✏️
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
              <button type="button" class="btn btn-secondary btn-sm btn-log-time" onclick="openLogTimeModal('${task.id}', event)" title="Registrar tempo executado manualmente (sem iniciar o cronômetro)">
                ⏱️ + Tempo
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
                  ${formatSubtaskRecurrenceBadge(st.recurrence || getSubtaskRecurrence(st), task.id, st.id)}
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
              <select id="input-new-subtask-rec-${task.id}" class="inline-subtask-recurrence" title="Recorrência da subtarefa">
                <option value="diaria" selected>🔄 Diária</option>
                <option value="nenhuma">📌 Única</option>
                <option value="semanal">🔄 Semanal</option>
              </select>
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
          ${formatCategoryBadge(task.category)}
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

// ==========================================
// Módulo de Análise de Tarefas Deixadas de Lado
// ==========================================

function calculateTaskNeglect(task) {
  const dates = Object.keys(dailyHistory || {}).sort();
  const todayKey = getTodayDateKey();
  
  let daysRecordedCount = 1; // Hoje conta como 1
  let completedDaysCount = task.completed ? 1 : 0;
  let pendingDaysCount = task.completed ? 0 : 1;
  let totalTimeSpent = getTaskCurrentSeconds(task);
  let lastCompletedDate = task.completed ? todayKey : null;
  let lastCompletedDisplay = task.completed ? 'Hoje' : null;
  
  // Analisar histórico dos dias arquivados
  dates.forEach(dateKey => {
    const entry = dailyHistory[dateKey];
    if (!entry || !Array.isArray(entry.tasks)) return;
    
    const histTask = entry.tasks.find(t => t.id === task.id || (t.title && task.title && t.title.trim().toLowerCase() === task.title.trim().toLowerCase()));
    if (histTask) {
      daysRecordedCount++;
      const isDone = !!histTask.completed;
      if (isDone) {
        completedDaysCount++;
        if (!lastCompletedDate || dateKey > lastCompletedDate) {
          lastCompletedDate = dateKey;
          lastCompletedDisplay = formatDateDisplay(dateKey);
        }
      } else {
        pendingDaysCount++;
      }
      totalTimeSpent += (histTask.elapsedSeconds || 0);
    }
  });

  // Cálculo da sequência de dias consecutivos sem conclusão (streak)
  let consecutivePendingStreak = 0;
  if (!task.completed) {
    consecutivePendingStreak = 1;
    const descDates = [...dates].reverse();
    for (const dKey of descDates) {
      const entry = dailyHistory[dKey];
      if (!entry || !Array.isArray(entry.tasks)) break;
      const histTask = entry.tasks.find(t => t.id === task.id || (t.title && task.title && t.title.trim().toLowerCase() === task.title.trim().toLowerCase()));
      if (histTask) {
        if (!histTask.completed) {
          consecutivePendingStreak++;
        } else {
          break;
        }
      } else {
        break;
      }
    }
  }

  // Taxa de negligência (% dos dias registrados em que ficou pendente)
  const neglectPercent = daysRecordedCount > 0 
    ? Math.round((pendingDaysCount / daysRecordedCount) * 100) 
    : 0;

  // Verificação de prazo
  let dueDateAlert = null;
  if (task.dueDate && !task.completed) {
    if (task.dueDate < todayKey) {
      dueDateAlert = 'overdue';
    } else if (task.dueDate === todayKey) {
      dueDateAlert = 'today';
    } else {
      const diffDays = Math.ceil((new Date(task.dueDate + 'T23:59:59') - new Date()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 2) dueDateAlert = 'soon';
    }
  }

  // Grau de Severidade
  let severity = 'good';
  let statusMessage = '';

  if (task.completed) {
    severity = 'good';
    statusMessage = 'Concluída hoje! 🎉';
  } else if (consecutivePendingStreak >= 3 || dueDateAlert === 'overdue' || (daysRecordedCount >= 3 && neglectPercent >= 75)) {
    severity = 'critical';
    if (dueDateAlert === 'overdue') {
      statusMessage = `Prazo Vencido (${formatShortDate(task.dueDate)})`;
    } else if (consecutivePendingStreak >= 3) {
      statusMessage = `Sem conclusão há ${consecutivePendingStreak} dias seguidos`;
    } else {
      statusMessage = `Pendente em ${neglectPercent}% dos dias arquivados`;
    }
  } else if (consecutivePendingStreak >= 1 || dueDateAlert === 'today' || (daysRecordedCount >= 2 && neglectPercent >= 50)) {
    severity = 'warning';
    if (dueDateAlert === 'today') {
      statusMessage = 'Prazo vence hoje e ainda não foi feita';
    } else if (consecutivePendingStreak === 2) {
      statusMessage = 'Pendente ontem e hoje (2 dias)';
    } else {
      statusMessage = 'Pendente na rotina de hoje';
    }
  } else {
    severity = 'good';
    statusMessage = 'Em dia com a rotina';
  }

  return {
    daysRecordedCount,
    completedDaysCount,
    pendingDaysCount,
    neglectPercent,
    consecutivePendingStreak,
    totalTimeSpent,
    lastCompletedDate,
    lastCompletedDisplay: lastCompletedDisplay || 'Nunca concluída nos registros',
    dueDateAlert,
    severity,
    statusMessage
  };
}

function updateAnalysisMetrics() {
  const monitored = tasks.filter(t => !!t.includeInAnalysis);
  const critical = monitored.filter(t => calculateTaskNeglect(t).severity === 'critical');
  const healthy = monitored.filter(t => t.completed || calculateTaskNeglect(t).severity === 'good');
  let totalSecs = 0;
  let totalPomodoros = 0;
  monitored.forEach(t => {
    totalSecs += getTaskCurrentSeconds(t);
    totalPomodoros += (t.pomodoroCount || 0);
  });

  if (lblTotalTasks) lblTotalTasks.textContent = 'Tarefas Monitoradas';
  if (lblPendingTasks) lblPendingTasks.textContent = 'Críticas / Deixadas de Lado';
  if (lblCompletedTasks) lblCompletedTasks.textContent = 'Em Dia / Concluídas';
  if (lblTotalTime) lblTotalTime.textContent = 'Tempo Hoje (Monitoradas)';
  if (lblTotalPomodoros) lblTotalPomodoros.textContent = 'Blocos Pomodoro';

  if (statTotalTasks) statTotalTasks.textContent = `${monitored.length}/${tasks.length}`;
  if (statPendingTasks) statPendingTasks.textContent = critical.length;
  if (statCompletedTasks) statCompletedTasks.textContent = healthy.length;
  if (statTotalTime) statTotalTime.textContent = formatReadableTime(totalSecs);
  if (statTotalPomodoros) statTotalPomodoros.textContent = totalPomodoros;
}

function renderAnalysis() {
  if (!analysisCardsContainer) return;

  const monitoredTasks = tasks.filter(t => !!t.includeInAnalysis);
  const taskStatsMap = new Map();
  tasks.forEach(t => {
    taskStatsMap.set(t.id, calculateTaskNeglect(t));
  });

  // Atualiza badge de alerta de tarefas críticas na aba
  const criticalCount = monitoredTasks.filter(t => taskStatsMap.get(t.id).severity === 'critical').length;
  if (analysisBadge) {
    if (criticalCount > 0) {
      analysisBadge.textContent = criticalCount;
      analysisBadge.classList.remove('hidden');
      analysisBadge.style.background = 'var(--danger)';
    } else {
      analysisBadge.classList.add('hidden');
    }
  }

  // Renderiza drawer de configuração rápida (lista de checkboxes de todas as tarefas)
  if (analysisTasksCheckboxList) {
    if (tasks.length === 0) {
      analysisTasksCheckboxList.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); padding: 8px;">Nenhuma tarefa cadastrada.</div>`;
    } else {
      analysisTasksCheckboxList.innerHTML = tasks.map(t => {
        const isChecked = !!t.includeInAnalysis;
        return `
          <div class="analysis-checkbox-item ${isChecked ? 'checked' : ''}" onclick="toggleTaskAnalysis('${t.id}', event)">
            <div class="analysis-checkbox-item-left">
              <input 
                type="checkbox" 
                ${isChecked ? 'checked' : ''} 
                onclick="event.stopPropagation(); toggleTaskAnalysis('${t.id}', event)"
              >
              <span class="analysis-checkbox-item-title">${escapeHtml(t.title)}</span>
            </div>
            ${formatCategoryBadge(t.category)}
          </div>
        `;
      }).join('');
    }
  }

  // KPI Cards
  if (analysisKpiGrid) {
    let totalTimeMonitored = 0;
    let sumNeglectPercent = 0;
    monitoredTasks.forEach(t => {
      const st = taskStatsMap.get(t.id);
      totalTimeMonitored += st.totalTimeSpent;
      sumNeglectPercent += st.neglectPercent;
    });
    const avgNeglect = monitoredTasks.length > 0 
      ? Math.round(sumNeglectPercent / monitoredTasks.length) 
      : 0;

    analysisKpiGrid.innerHTML = `
      <div class="analysis-kpi-card">
        <div class="analysis-kpi-icon purple">🎯</div>
        <div class="analysis-kpi-info">
          <span class="analysis-kpi-label">Tarefas Monitoradas</span>
          <span class="analysis-kpi-value">${monitoredTasks.length} de ${tasks.length}</span>
          <span class="analysis-kpi-sub">${tasks.length - monitoredTasks.length} ignoradas na análise</span>
        </div>
      </div>
      <div class="analysis-kpi-card">
        <div class="analysis-kpi-icon red">🚨</div>
        <div class="analysis-kpi-info">
          <span class="analysis-kpi-label">Em Estado Crítico</span>
          <span class="analysis-kpi-value">${criticalCount}</span>
          <span class="analysis-kpi-sub">acumulando vários dias sem foco</span>
        </div>
      </div>
      <div class="analysis-kpi-card">
        <div class="analysis-kpi-icon yellow">📉</div>
        <div class="analysis-kpi-info">
          <span class="analysis-kpi-label">Taxa Média de Negligência</span>
          <span class="analysis-kpi-value">${avgNeglect}%</span>
          <span class="analysis-kpi-sub">tempo médio em pendência</span>
        </div>
      </div>
      <div class="analysis-kpi-card">
        <div class="analysis-kpi-icon green">⏱️</div>
        <div class="analysis-kpi-info">
          <span class="analysis-kpi-label">Tempo Acumulado</span>
          <span class="analysis-kpi-value">${formatReadableTime(totalTimeMonitored)}</span>
          <span class="analysis-kpi-sub">dedicado nas tarefas monitoradas</span>
        </div>
      </div>
    `;
  }

  // Se nenhuma tarefa participa da análise, exibe banner inicial
  if (monitoredTasks.length === 0) {
    analysisCardsContainer.innerHTML = `
      <div class="analysis-empty-banner">
        <div class="analysis-empty-icon">📊</div>
        <h3>Nenhuma tarefa selecionada para a análise ainda</h3>
        <p>
          Para que você tenha controle total e analise apenas o que importa, cada tarefa possui um campo que define se ela deve ou não participar da análise de pendências.
        </p>
        <button type="button" class="btn btn-primary" onclick="toggleAnalysisConfig()">
          ⚙️ Escolher Tarefas que Participam da Análise
        </button>
      </div>
    `;
    return;
  }

  // Filtragem
  let filtered = monitoredTasks.filter(task => {
    // Filtro por Categoria
    if (analysisCategoryFilter !== 'all') {
      const cat = (task.category || 'Geral').toLowerCase();
      if (cat !== analysisCategoryFilter.toLowerCase()) return false;
    }

    // Filtro por Severidade
    if (analysisSeverityFilter !== 'all') {
      const stats = taskStatsMap.get(task.id);
      if (stats.severity !== analysisSeverityFilter) return false;
    }

    return true;
  });

  // Ordenação
  filtered.sort((a, b) => {
    const statsA = taskStatsMap.get(a.id);
    const statsB = taskStatsMap.get(b.id);

    switch (analysisSort) {
      case 'streak-desc':
        return statsB.consecutivePendingStreak - statsA.consecutivePendingStreak;
      case 'time-asc':
        return statsA.totalTimeSpent - statsB.totalTimeSpent;
      case 'due-date':
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      case 'title-asc':
        return a.title.localeCompare(b.title);
      case 'neglect-desc':
      default:
        if (statsB.neglectPercent !== statsA.neglectPercent) {
          return statsB.neglectPercent - statsA.neglectPercent;
        }
        return statsB.consecutivePendingStreak - statsA.consecutivePendingStreak;
    }
  });

  if (filtered.length === 0) {
    analysisCardsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>Nenhuma tarefa encontrada com os filtros selecionados</h3>
        <p>Ajuste os filtros de categoria ou status acima para ver mais tarefas.</p>
      </div>
    `;
    return;
  }

  // Renderizar cards de tarefas analisadas
  analysisCardsContainer.innerHTML = filtered.map(task => {
    const stats = taskStatsMap.get(task.id);
    const priorityKey = task.priority || 'media';
    const subtasks = task.subtasks || [];
    const totalSub = subtasks.length;
    const completedSub = subtasks.filter(st => st.completed).length;

    let severityLabel = '';
    if (stats.severity === 'critical') {
      severityLabel = `🔴 Crítica • ${stats.statusMessage}`;
    } else if (stats.severity === 'warning') {
      severityLabel = `🟡 Atenção • ${stats.statusMessage}`;
    } else {
      severityLabel = `🟢 Em dia • ${stats.statusMessage}`;
    }

    const donePercent = Math.max(0, 100 - stats.neglectPercent);
    const pendingPercent = stats.neglectPercent;

    return `
      <div class="analysis-task-card severity-${stats.severity}" id="analysis-card-${task.id}">
        <!-- Topo: Título, Metas e Grau de Alerta -->
        <div class="analysis-card-top">
          <div class="analysis-card-title-group">
            <div class="analysis-card-title">
              <span>${escapeHtml(task.title)}</span>
            </div>
            <div class="analysis-card-meta">
              ${formatCategoryBadge(task.category)}
              <span class="badge badge-priority-${priorityKey}">${formatPriorityLabel(priorityKey)}</span>
              ${formatRecurrenceBadge(task.recurrence || 'diaria')}
              ${formatDueDateBadge(task.dueDate, task.completed)}
              ${totalSub > 0 ? `<span class="badge" style="background: rgba(148,163,184,0.15); color: #cbd5e1;">📋 ${completedSub}/${totalSub} subtarefas</span>` : ''}
            </div>
          </div>
          <span class="analysis-severity-pill ${stats.severity}">
            ${severityLabel}
          </span>
        </div>

        <!-- Linha de Estatísticas de Negligência -->
        <div class="analysis-stats-row">
          <div class="analysis-stat-box">
            <span class="analysis-stat-box-label">Sequência sem concluir</span>
            <span class="analysis-stat-box-val ${stats.consecutivePendingStreak >= 3 ? 'highlight-danger' : (stats.consecutivePendingStreak >= 1 ? 'highlight-warning' : 'highlight-success')}">
              ${stats.consecutivePendingStreak === 0 ? 'Concluída hoje' : `${stats.consecutivePendingStreak} ${stats.consecutivePendingStreak === 1 ? 'dia' : 'dias seguidos'}`}
            </span>
          </div>
          <div class="analysis-stat-box">
            <span class="analysis-stat-box-label">Frequência Registrada</span>
            <span class="analysis-stat-box-val">
              ${stats.pendingDaysCount} de ${stats.daysRecordedCount} dias pendente (${stats.neglectPercent}%)
            </span>
          </div>
          <div class="analysis-stat-box">
            <span class="analysis-stat-box-label">Tempo Dedicado</span>
            <span class="analysis-stat-box-val">
              Total: ${formatReadableTime(stats.totalTimeSpent)}
            </span>
          </div>
          <div class="analysis-stat-box">
            <span class="analysis-stat-box-label">Última Conclusão</span>
            <span class="analysis-stat-box-val">
              ${stats.lastCompletedDisplay}
            </span>
          </div>
        </div>

        <!-- Barra de Progresso de Frequência -->
        <div class="analysis-progress-wrapper">
          <div class="analysis-progress-labels">
            <span>Frequência no Histórico</span>
            <span>✅ Concluída em ${stats.completedDaysCount} dias (${donePercent}%) • ❌ Pendente em ${stats.pendingDaysCount} dias (${pendingPercent}%)</span>
          </div>
          <div class="analysis-progress-bar-bg" title="Verde: Dias cumprida | Vermelho: Dias deixada de lado">
            <div class="analysis-progress-bar-done" style="width: ${donePercent}%;"></div>
            <div class="analysis-progress-bar-pending" style="width: ${pendingPercent}%;"></div>
          </div>
        </div>

        <!-- Rodapé do Card: Ações Rápidas -->
        <div class="analysis-card-footer">
          <div class="analysis-card-actions-left">
            <button type="button" class="btn-action-focus" onclick="focusTaskFromAnalysis('${task.id}')" title="Ir para a rotina de Hoje e focar nesta tarefa">
              ▶ Focar Nesta Tarefa Agora
            </button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="openLogTimeModal('${task.id}', event)" title="Registrar tempo dedicado manualmente">
              ⏱️ + Tempo
            </button>
            <button type="button" class="btn ${task.completed ? 'btn-secondary' : 'btn-success'} btn-sm" onclick="toggleCompleteFromAnalysis('${task.id}')">
              ${task.completed ? '↺ Desmarcar Conclusão' : '✅ Concluir Hoje'}
            </button>
          </div>
          <button type="button" class="btn-action-remove-analysis" onclick="toggleTaskAnalysis('${task.id}', event)" title="Excluir esta tarefa da análise">
            ✕ Remover da Análise
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function toggleTaskAnalysis(taskId, event) {
  if (event) event.stopPropagation();
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  task.includeInAnalysis = !task.includeInAnalysis;
  saveTasks();
  render();
  if (activeTab === 'analysis') {
    renderAnalysis();
    updateDateDisplay();
  }
  dbUpsertTask(task);
}

function selectAllTasksForAnalysis(include) {
  tasks.forEach(t => {
    t.includeInAnalysis = include;
  });
  saveTasks();
  render();
  renderAnalysis();
  updateDateDisplay();
  dbSyncAllTasks();
}

function toggleAnalysisConfig() {
  if (!analysisConfigPanel) return;
  const isHidden = analysisConfigPanel.classList.contains('hidden');
  if (isHidden) {
    analysisConfigPanel.classList.remove('hidden');
    if (btnToggleAnalysisConfigText) btnToggleAnalysisConfigText.textContent = 'Fechar Configuração';
  } else {
    analysisConfigPanel.classList.add('hidden');
    if (btnToggleAnalysisConfigText) btnToggleAnalysisConfigText.textContent = 'Gerenciar Monitoramento';
  }
}

function focusTaskFromAnalysis(taskId) {
  if (tabToday) {
    tabToday.click();
  }
  setTimeout(() => {
    highlightAndScrollToTask(taskId);
  }, 100);
}

function toggleCompleteFromAnalysis(taskId) {
  toggleTaskCompletion(taskId);
  renderAnalysis();
}

window.calculateTaskNeglect = calculateTaskNeglect;
window.updateAnalysisMetrics = updateAnalysisMetrics;
window.renderAnalysis = renderAnalysis;
window.toggleTaskAnalysis = toggleTaskAnalysis;
window.selectAllTasksForAnalysis = selectAllTasksForAnalysis;
window.toggleAnalysisConfig = toggleAnalysisConfig;
window.focusTaskFromAnalysis = focusTaskFromAnalysis;
window.toggleCompleteFromAnalysis = toggleCompleteFromAnalysis;

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
window.toggleSubtaskRecurrence = toggleSubtaskRecurrence;
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
window.openLogTimeModal = openLogTimeModal;
window.closeLogTimeModal = closeLogTimeModal;
window.quickAddLogTime = quickAddLogTime;
window.updateLogTimePreview = updateLogTimePreview;
window.handleSaveLogTime = handleSaveLogTime;

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
    includeInAnalysis: row.include_in_analysis !== undefined ? !!row.include_in_analysis : false,
    description: row.description || '',
    completed: !!row.completed,
    createdAt: row.created_at ? Number(row.created_at) : Date.now(),
    targetSeconds: target,
    elapsedSeconds: elapsed,
    blockElapsedSeconds: 0,
    pomodoroCount: pomodoros,
    isRunning: !!row.is_running,
    timerStartedAt: row.timer_started_at ? Number(row.timer_started_at) : null,
    subtasks: Array.isArray(row.subtasks) ? row.subtasks.map(st => ({
      ...st,
      recurrence: st.recurrence || getSubtaskRecurrence(st)
    })) : [],
    updatedAt: row.updated_at || null
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
    include_in_analysis: !!task.includeInAnalysis,
    description: task.description || '',
    completed: !!task.completed,
    created_at: task.createdAt || Date.now(),
    target_seconds: task.targetSeconds || 1500,
    elapsed_seconds: task.elapsedSeconds || 0,
    is_running: !!task.isRunning,
    timer_started_at: task.timerStartedAt || null,
    subtasks: task.subtasks || [],
    updated_at: new Date().toISOString()
  };
}

async function fetchFromSupabase() {
  if (!supabaseClient) return;
  updateSyncStatus('syncing', 'Sincronizando...');
  try {
    const todayKey = getTodayDateKey();
    const lastResetDate = localStorage.getItem(LAST_RESET_DATE_KEY);

    const { data, error } = await supabaseClient
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      if (data.length === 0 && tasks.length > 0) {
        // Banco no Supabase está vazio: envia as tarefas da rotina atual
        const rows = tasks.map(mapModelToDbTask);
        const { error: upsertErr } = await supabaseClient.from('tasks').upsert(rows);
        if (upsertErr && (upsertErr.code === '42703' || (upsertErr.message && (upsertErr.message.includes('recurrence') || upsertErr.message.includes('due_date') || upsertErr.message.includes('include_in_analysis'))))) {
          const fallbackRows = rows.map(r => {
            const copy = { ...r };
            delete copy.recurrence;
            delete copy.due_date;
            delete copy.include_in_analysis;
            return copy;
          });
          await supabaseClient.from('tasks').upsert(fallbackRows);
        }
      } else if (data.length > 0) {
        // Atualiza tarefas locais com os dados do Supabase
        const localTasksMap = new Map(tasks.map(t => [t.id, t]));
        let needsDbSyncBack = false;

        tasks = data.map(row => {
          const mapped = mapDbTaskToModel(row);
          const existing = localTasksMap.get(mapped.id);

          // Verifica se a linha do Supabase foi atualizada hoje
          const rowDate = getDateKeyFromTimestamp(row.updated_at);
          const isRowFromToday = (rowDate === todayKey);

          // Se a linha do Supabase não foi atualizada hoje (é de ontem ou data anterior)
          if (!isRowFromToday) {
            const isSingleTask = mapped.recurrence === 'nenhuma';
            if (!isSingleTask) {
              mapped.completed = false;
            }
            mapped.elapsedSeconds = 0;
            mapped.blockElapsedSeconds = 0;
            mapped.pomodoroCount = 0;
            mapped.isRunning = false;
            mapped.timerStartedAt = null;
            if (mapped.subtasks && Array.isArray(mapped.subtasks)) {
              mapped.subtasks = mapped.subtasks.map(st => {
                const rec = st.recurrence || getSubtaskRecurrence(st);
                const isDaily = rec === 'diaria';
                return {
                  ...st,
                  recurrence: rec,
                  completed: isDaily ? false : !!st.completed
                };
              });
            }
            needsDbSyncBack = true;
          }

          // Se já temos estado local válido de hoje e Supabase não é de hoje:
          if (existing && lastResetDate === todayKey && !isRowFromToday) {
            mapped.completed = existing.completed;
            mapped.elapsedSeconds = existing.elapsedSeconds;
            mapped.blockElapsedSeconds = existing.blockElapsedSeconds;
            mapped.pomodoroCount = existing.pomodoroCount;
            mapped.isRunning = existing.isRunning;
            mapped.timerStartedAt = existing.timerStartedAt;
          }

          if (existing) {
            if (existing.targetSeconds && !row.target_seconds) {
              mapped.targetSeconds = existing.targetSeconds;
            }
            if (existing.blockElapsedSeconds !== undefined && isRowFromToday) {
              mapped.blockElapsedSeconds = existing.blockElapsedSeconds;
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

        if (needsDbSyncBack) {
          dbSyncAllTasks();
        }
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
        // Se já temos esse dia no dailyHistory local e o local tem mais tarefas, preserva
        if (dailyHistory[row.date] && (dailyHistory[row.date].tasks || []).length > (row.tasks || []).length) {
          return;
        }
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
  const todayKey = getTodayDateKey();

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

      const rowDate = getDateKeyFromTimestamp(newRow.updated_at);
      const isRowFromToday = (rowDate === todayKey);

      if (!isRowFromToday) {
        if (updated.recurrence !== 'nenhuma') {
          updated.completed = false;
        }
        updated.elapsedSeconds = 0;
        updated.blockElapsedSeconds = 0;
        updated.pomodoroCount = 0;
        if (updated.subtasks && Array.isArray(updated.subtasks)) {
          updated.subtasks = updated.subtasks.map(st => {
            const rec = st.recurrence || getSubtaskRecurrence(st);
            const isDaily = rec === 'diaria';
            return {
              ...st,
              recurrence: rec,
              completed: isDaily ? false : !!st.completed
            };
          });
        }
      }

      if (existing && existing.targetSeconds && !newRow.target_seconds) {
        updated.targetSeconds = existing.targetSeconds;
      }
      if (existing && existing.blockElapsedSeconds !== undefined && isRowFromToday) {
        updated.blockElapsedSeconds = existing.blockElapsedSeconds;
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
      if (error.code === '42703' || (error.message && (error.message.includes('recurrence') || error.message.includes('due_date') || error.message.includes('include_in_analysis')))) {
        // Fallback caso a tabela ainda não tenha as colunas recurrence, due_date ou include_in_analysis criadas
        const fallbackRow = { ...row };
        delete fallbackRow.recurrence;
        delete fallbackRow.due_date;
        delete fallbackRow.include_in_analysis;
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
    if (error && (error.code === '42703' || (error.message && (error.message.includes('recurrence') || error.message.includes('due_date') || error.message.includes('include_in_analysis'))))) {
      const fallbackRows = rows.map(r => {
        const copy = { ...r };
        delete copy.recurrence;
        delete copy.due_date;
        delete copy.include_in_analysis;
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
window.toggleSubtaskRecurrence = toggleSubtaskRecurrence;
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
window.openLogTimeModal = openLogTimeModal;
window.closeLogTimeModal = closeLogTimeModal;
window.quickAddLogTime = quickAddLogTime;
window.updateLogTimePreview = updateLogTimePreview;
window.handleSaveLogTime = handleSaveLogTime;
