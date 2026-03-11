window.TaskDetails = {
    render: function(task, onAction) {
        const container = document.getElementById('taskDetailsContainer');
        if (!task) {
            container.innerHTML = `
                <div class="h-full flex flex-col items-center justify-center text-[var(--text-muted)] opacity-50 p-8 text-center">
                    <i data-lucide="info" class="w-12 h-12 mb-4"></i>
                    <p>Select a task to view details and scheduling options</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        const date = new Date(task.due_date).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' });

        container.innerHTML = `
            <div class="animate-fade-in p-6 h-full flex flex-col">
                <div class="mb-6">
                    <div class="flex justify-between items-start mb-2">
                        <span class="px-2 py-1 rounded-full text-xs font-bold bg-[var(--secondary-bg)] text-[var(--accent)] uppercase tracking-wider">
                            Priority ${task.priority}
                        </span>
                        <span class="text-xs font-medium text-[var(--text-muted)]">${task.status}</span>
                    </div>
                    <h2 class="text-2xl font-bold text-[var(--text-main)] mb-2">${task.title}</h2>
                    <p class="text-[var(--text-muted)] text-sm mb-4 flex items-center gap-2">
                        <i data-lucide="calendar" class="w-4 h-4"></i> ${date}
                    </p>
                    <div class="p-4 bg-[var(--secondary-bg)] rounded-2xl text-sm leading-relaxed min-h-[100px]">
                        ${task.description || 'No description provided.'}
                    </div>
                </div>

                <div class="mt-auto border-t border-[var(--border-color)] pt-6">
                    <h3 class="font-bold text-[var(--text-main)] mb-4 flex items-center gap-2">
                        <i data-lucide="repeat" class="w-4 h-4 text-[var(--accent)]"></i> Recurring Schedule
                    </h3>
                    <div class="grid grid-cols-1 gap-3">
                        <button id="applyEveryday" class="flex items-center gap-3 w-full p-4 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl text-sm font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all">
                            <i data-lucide="calendar-check" class="w-5 h-5"></i> Apply Everyday (Next 7 days)
                        </button>
                        <button id="applyWeekly" class="flex items-center gap-3 w-full p-4 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl text-sm font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all">
                            <i data-lucide="calendar-days" class="w-5 h-5"></i> Apply this day per week (Next 4 weeks)
                        </button>
                        <div class="space-y-2">
                            <p class="text-xs font-bold text-[var(--text-muted)] uppercase px-2">Custom Range</p>
                            <div class="flex gap-2">
                                <input type="date" id="rangeEnd" class="flex-1 p-3 bg-[var(--secondary-bg)] border-none rounded-xl text-sm focus:ring-2 focus:ring-[var(--accent)] outline-none">
                                <button id="applyRange" class="whitespace-nowrap px-4 bg-[var(--accent)] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
                                    Apply Range
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        lucide.createIcons();

        // Event Listeners
        document.getElementById('applyEveryday').onclick = () => this.handleRecurring(task, 'everyday', onAction);
        document.getElementById('applyWeekly').onclick = () => this.handleRecurring(task, 'weekly', onAction);
        document.getElementById('applyRange').onclick = () => {
            const endDate = document.getElementById('rangeEnd').value;
            if (!endDate) {
                alert('Please select an end date');
                return;
            }
            this.handleRecurring(task, 'range', onAction, new Date(endDate));
        };
    },

    handleRecurring: async function(task, type, onAction, endDate = null) {
        const tasksToCreate = [];
        const baseDate = new Date(task.due_date);
        
        let count = 0;
        let interval = 1;
        
        if (type === 'everyday') {
            count = 7;
            interval = 1;
        } else if (type === 'weekly') {
            count = 4;
            interval = 7;
        } else if (type === 'range') {
            const diffTime = Math.abs(endDate - baseDate);
            count = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            interval = 1;
        }

        for (let i = 1; i <= count; i++) {
            const newDate = new Date(baseDate);
            newDate.setDate(baseDate.getDate() + (i * interval));
            tasksToCreate.push({
                title: task.title,
                description: task.description,
                priority: task.priority,
                due_date: newDate.toISOString()
            });
        }

        try {
            const response = await fetch('/api/tasks/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tasks: tasksToCreate })
            });

            if (response.ok) {
                alert(`Successfully created ${tasksToCreate.length} recurring tasks!`);
                onAction();
            } else {
                throw new Error('Failed to create recurring tasks');
            }
        } catch (error) {
            console.error(error);
            alert('Error creating recurring tasks');
        }
    }
};
