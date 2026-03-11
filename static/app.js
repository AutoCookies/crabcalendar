let tasks = [];
let currentTheme = localStorage.getItem('theme') || 'light';
let currentTab = 'tasks';
let calendarDate = new Date();
let selectedDayTasks = [];
let selectedDayDate = null;
let selectedTaskId = null;

// DOM Elements
const taskList = document.getElementById('taskList');
const taskModal = document.getElementById('taskModal');
const settingsModal = document.getElementById('settingsModal');
const dayDetailsModal = document.getElementById('dayDetailsModal');
const taskForm = document.getElementById('taskForm');
const addTaskBtn = document.getElementById('addTaskBtn');
const settingsBtn = document.getElementById('settingsBtn');
const closeModal = document.getElementById('closeModal');
const closeSettings = document.getElementById('closeSettings');
const closeDetails = document.getElementById('closeDetails');
const addDayTaskBtn = document.getElementById('addDayTaskBtn');
const pendingCount = document.getElementById('pendingCount');

// Tabs
const navLinks = document.querySelectorAll('.nav-link');
const tabContents = document.querySelectorAll('.tab-content');

// Calendar Elements
const calendarMonthLabel = document.getElementById('calendarMonth');
const calendarDaysGrid = document.getElementById('calendarDays');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const detailsDateLabel = document.getElementById('detailsDateLabel');
const dayTasksList = document.getElementById('dayTasksList');

// Filter & Sort State
let taskSearchQuery = '';
let priorityFilterValue = 'all';
let prioritySortOrder = 'desc'; // 'desc' or 'asc'

// Init
document.addEventListener('DOMContentLoaded', () => {
    setTheme(currentTheme);
    fetchTasks();
    lucide.createIcons();
    TaskDetails.render(null); 

    // Filter Listeners
    document.getElementById('taskSearch').addEventListener('input', (e) => {
        taskSearchQuery = e.target.value.toLowerCase();
        renderTasks();
    });
    document.getElementById('priorityFilter').addEventListener('change', (e) => {
        priorityFilterValue = e.target.value;
        renderTasks();
    });
    document.getElementById('sortPriorityBtn').addEventListener('click', () => {
        prioritySortOrder = prioritySortOrder === 'desc' ? 'asc' : 'desc';
        renderTasks();
    });
});

addTaskBtn.addEventListener('click', () => openModal());
settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
closeModal.addEventListener('click', hideModal);
closeSettings.addEventListener('click', () => settingsModal.classList.add('hidden'));
closeDetails.addEventListener('click', () => dayDetailsModal.classList.add('hidden'));
addDayTaskBtn.addEventListener('click', () => {
    dayDetailsModal.classList.add('hidden');
    openModal(null, selectedDayDate);
});
taskForm.addEventListener('submit', handleTaskSubmit);

prevMonthBtn.addEventListener('click', () => {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    renderCalendar();
});

// Tab logic
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        const tabId = link.getAttribute('data-tab');
        switchTab(tabId);
    });
});

function switchTab(tabId) {
    currentTab = tabId;
    navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('data-tab') === tabId);
    });
    tabContents.forEach(content => {
        content.classList.toggle('hidden', content.id !== `${tabId}Tab`);
        content.classList.toggle('active', content.id === `${tabId}Tab`);
    });
    if (tabId === 'calendar') renderCalendar();
    if (tabId === 'stats') renderStats();
    renderTasks();
}

// Theme logic
document.querySelectorAll('[data-theme-set]').forEach(btn => {
    btn.addEventListener('click', () => {
        const theme = btn.getAttribute('data-theme-set');
        setTheme(theme);
    });
});

function setTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    document.querySelectorAll('[data-theme-set]').forEach(btn => {
        const isActive = btn.getAttribute('data-theme-set') === theme;
        btn.classList.toggle('active', isActive);
        const check = btn.querySelector('.check-icon');
        if (check) check.classList.toggle('hidden', !isActive);
    });
}

async function fetchTasks() {
    try {
        const response = await fetch('/api/tasks');
        tasks = await response.json() || [];
        renderTasks();
        updateSummary();
        renderCalendar();
        renderStats();
    } catch (error) {
        console.error('Failed to fetch tasks:', error);
    }
}

function renderTasks() {
    if (!taskList) return;
    taskList.innerHTML = '';
    
    let filtered = [...tasks];

    // Filter by TODAY if in tasks tab
    if (currentTab === 'tasks') {
        const today = new Date().toDateString();
        filtered = filtered.filter(t => new Date(t.due_date).toDateString() === today);
    }

    // Search filter
    if (taskSearchQuery) {
        filtered = filtered.filter(t => 
            t.title.toLowerCase().includes(taskSearchQuery) || 
            t.description.toLowerCase().includes(taskSearchQuery)
        );
    }

    // Priority filter
    if (priorityFilterValue !== 'all') {
        filtered = filtered.filter(t => t.priority == priorityFilterValue);
    }

    // Sort by Priority
    filtered.sort((a, b) => {
        if (prioritySortOrder === 'desc') {
            return b.priority - a.priority;
        } else {
            return a.priority - b.priority;
        }
    });

    if (filtered.length === 0) {
        taskList.innerHTML = `
            <div class="p-12 text-center text-[var(--text-muted)] opacity-50 bg-[var(--card-bg)] rounded-3xl border border-dashed border-[var(--border-color)]">
                <i data-lucide="clipboard-list" class="w-12 h-12 mx-auto mb-4"></i>
                <p>No tasks found for the current filters.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    filtered.forEach((task, index) => {
        const card = document.createElement('div');
        const isSelected = selectedTaskId === task.id;
        card.className = `task-card p-6 rounded-3xl shadow-md border-r-2 border-b-2 flex justify-between items-center animate-fade-in priority-${task.priority} ${task.status === 'Done' ? 'opacity-50' : ''} ${isSelected ? 'selected' : ''}`;
        card.style.animationDelay = `${index * 0.05}s`;
        card.onclick = (e) => {
            if (e.target.closest('button')) return;
            selectTask(task);
        };

        const dueDate = new Date(task.due_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
        
        card.innerHTML = `
            <div class="flex-1">
                <div class="flex items-center gap-3">
                    <h3 class="text-xl font-bold ${task.status === 'Done' ? 'line-through opacity-50' : ''}">${task.title}</h3>
                    <span class="px-2 py-0.5 rounded-full text-xs font-bold ${getPriorityClass(task.priority)} uppercase">
                        ${getPriorityLabel(task.priority)}
                    </span>
                </div>
                <p class="text-[var(--text-muted)] mt-1 text-sm">${task.description || 'No description'}</p>
                <div class="flex items-center gap-4 mt-3 text-xs font-medium opacity-70">
                    <span class="flex items-center gap-1"><i data-lucide="calendar" class="w-3 h-3"></i> ${dueDate}</span>
                    <span class="flex items-center gap-1"><i data-lucide="${task.status === 'Pending' ? 'clock' : 'check-circle'}" class="w-3 h-3"></i> ${task.status}</span>
                </div>
            </div>
            <div class="flex gap-2">
                <button onclick="toggleStatus(${task.id})" class="p-2 hover:bg-[var(--secondary-bg)] rounded-full transition-colors">
                    <i data-lucide="${task.status === 'Pending' ? 'check' : 'rotate-ccw'}"></i>
                </button>
                <button onclick="editTask(${task.id})" class="p-2 hover:bg-[var(--secondary-bg)] rounded-full transition-colors">
                    <i data-lucide="edit-3"></i>
                </button>
                <button onclick="deleteTask(${task.id})" class="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        `;
        taskList.appendChild(card);
    });
    lucide.createIcons();
}

function selectTask(task) {
    selectedTaskId = task.id;
    renderTasks();
    TaskDetails.render(task, () => {
        fetchTasks();
    });
}

function renderCalendar() {
    if (!calendarDaysGrid) return;
    calendarDaysGrid.innerHTML = '';
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    
    calendarMonthLabel.innerText = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(calendarDate);
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let i = 0; i < firstDay; i++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-day other-month';
        calendarDaysGrid.appendChild(cell);
    }
    
    const today = new Date();
    
    for (let d = 1; d <= daysInMonth; d++) {
        const cell = document.createElement('div');
        const isToday = today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
        cell.className = `calendar-day ${isToday ? 'today' : ''} flex flex-col`;
        cell.innerHTML = `<span class="text-sm font-bold opacity-30">${d}</span>`;
        
        const dayTasks = tasks.filter(t => {
            const taskDate = new Date(t.due_date);
            return taskDate.getDate() === d && taskDate.getMonth() === month && taskDate.getFullYear() === year;
        });

        const maxVisible = 3;
        dayTasks.slice(0, maxVisible).forEach(task => {
            const event = document.createElement('div');
            event.className = `calendar-event ${task.status === 'Done' ? 'opacity-50' : ''}`;
            event.title = task.title;
            event.innerText = task.title;
            cell.appendChild(event);
        });

        if (dayTasks.length > maxVisible) {
            const more = document.createElement('div');
            more.className = 'more-indicator';
            more.innerText = `+${dayTasks.length - maxVisible} more`;
            cell.appendChild(more);
        }

        cell.addEventListener('click', () => {
            showDayDetails(new Date(year, month, d), dayTasks);
        });
        
        calendarDaysGrid.appendChild(cell);
    }
}

function showDayDetails(date, dayTasks) {
    selectedDayDate = date;
    selectedDayTasks = dayTasks;
    
    detailsDateLabel.innerText = new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(date);
    dayTasksList.innerHTML = '';
    
    if (dayTasks.length === 0) {
        dayTasksList.innerHTML = '<p class="text-[var(--text-muted)] text-center py-8">No tasks for this day.</p>';
    } else {
        dayTasks.forEach(task => {
            const item = document.createElement('div');
            item.className = 'day-details-item flex justify-between items-center';
            item.innerHTML = `
                <div>
                    <h4 class="font-bold text-[var(--text-main)] ${task.status === 'Done' ? 'line-through opacity-50' : ''}">${task.title}</h4>
                    <p class="text-xs text-[var(--text-muted)]">${task.status} • Priority ${task.priority}</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="toggleStatus(${task.id})" class="p-2 hover:bg-[var(--card-bg)] rounded-full transition-colors"><i data-lucide="check" class="w-4 h-4"></i></button>
                    <button onclick="editTask(${task.id})" class="p-2 hover:bg-[var(--card-bg)] rounded-full transition-colors"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
                </div>
            `;
            dayTasksList.appendChild(item);
        });
    }
    
    dayDetailsModal.classList.remove('hidden');
    lucide.createIcons();
}

function renderStats() {
    const chart = document.getElementById('statsChart');
    const labels = document.getElementById('statsLabels');
    if (!chart || !labels) return;

    chart.innerHTML = '';
    labels.innerHTML = '';

    const daysCount = 14;
    const data = [];
    const now = new Date();
    
    // Group tasks by date string
    const taskCounts = {};
    const pendingCounts = {};
    
    tasks.forEach(t => {
        const d = new Date(t.due_date).toDateString();
        taskCounts[d] = (taskCounts[d] || 0) + 1;
        if (t.status === 'Pending') {
            pendingCounts[d] = (pendingCounts[d] || 0) + 1;
        }
    });

    for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const ds = d.toDateString();
        data.push({
            label: d.getDate(),
            total: taskCounts[ds] || 0,
            pending: pendingCounts[ds] || 0,
            fullDate: d.toLocaleDateString()
        });
    }

    const maxTasks = Math.max(...data.map(d => d.total), 5); // At least 5 for scale

    data.forEach(day => {
        // Bar
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        const heightPercent = (day.total / maxTasks) * 100;
        bar.style.height = `${Math.max(heightPercent, 2)}%`; // Min height for visibility
        
        // Tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'chart-tooltip';
        tooltip.innerHTML = `
            <strong>${day.fullDate}</strong><br>
            Total Tasks: ${day.total}<br>
            <span class="text-orange-400">Pending: ${day.pending}</span>
        `;
        bar.appendChild(tooltip);
        chart.appendChild(bar);

        // Label
        const label = document.createElement('div');
        label.className = 'flex-1 text-center';
        label.innerText = day.label;
        labels.appendChild(label);
    });
}

function updateSummary() {
    const pending = tasks.filter(t => t.status === 'Pending').length;
    pendingCount.innerText = pending;
    const today = new Date().toDateString();
    const todayTasksCount = tasks.filter(t => new Date(t.due_date).toDateString() === today && t.status === 'Pending').length;
    document.getElementById('todayTasks').innerText = todayTasksCount > 0 
        ? `${todayTasksCount} task${todayTasksCount > 1 ? 's' : ''} left for today`
        : 'No tasks left for today';
}

function getPriorityClass(p) {
    if (p == 3) return 'bg-red-100 text-red-600';
    if (p == 2) return 'bg-orange-100 text-orange-600';
    return 'bg-blue-100 text-blue-600';
}

function getPriorityLabel(p) {
    if (p == 3) return 'High';
    if (p == 2) return 'Medium';
    return 'Low';
}

function openModal(task = null, prefillDate = null) {
    document.getElementById('modalTitle').innerText = task ? 'Edit Task' : 'Add Task';
    document.getElementById('taskId').value = task ? task.id : '';
    document.getElementById('title').value = task ? task.title : '';
    document.getElementById('description').value = task ? task.description : '';
    document.getElementById('priority').value = task ? task.priority : '2';
    
    const dateInput = document.getElementById('dueDate');
    if (task) {
        const d = new Date(task.due_date);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        dateInput.value = d.toISOString().slice(0, 16);
    } else if (prefillDate) {
        const d = new Date(prefillDate);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        dateInput.value = d.toISOString().slice(0, 16);
    } else {
        dateInput.value = '';
    }
    taskModal.classList.remove('hidden');
}

function hideModal() {
    taskModal.classList.add('hidden');
    taskForm.reset();
}

async function handleTaskSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('taskId').value;
    const taskData = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        priority: parseInt(document.getElementById('priority').value),
        due_date: new Date(document.getElementById('dueDate').value).toISOString(),
    };
    try {
        if (id) {
            const existing = tasks.find(t => t.id == id);
            taskData.status = existing.status;
            await fetch(`/api/tasks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            });
        } else {
            await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            });
        }
        hideModal();
        fetchTasks();
    } catch (error) {
        console.error('Action failed:', error);
    }
}

async function toggleStatus(id) {
    const task = tasks.find(t => t.id == id);
    const newStatus = task.status === 'Pending' ? 'Done' : 'Pending';
    try {
        await fetch(`/api/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...task, status: newStatus })
        });
        fetchTasks();
        if (!dayDetailsModal.classList.contains('hidden')) {
            // Update the modal content if it's open
            const updatedTask = tasks.find(t => t.id == id);
            showDayDetails(selectedDayDate, tasks.filter(t => {
                const taskDate = new Date(t.due_date);
                return taskDate.toDateString() === selectedDayDate.toDateString();
            }));
        }
    } catch (error) {
        console.error('Failed to toggle status:', error);
    }
}

async function deleteTask(id) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
        await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
        fetchTasks();
        if (!dayDetailsModal.classList.contains('hidden')) {
            dayDetailsModal.classList.add('hidden');
        }
    } catch (error) {
        console.error('Failed to delete task:', error);
    }
}

function editTask(id) {
    const task = tasks.find(t => t.id == id);
    dayDetailsModal.classList.add('hidden');
    openModal(task);
}
