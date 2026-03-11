let calendarRoot = null;

export async function mount(container) {
    console.log("[CrabCalendar] Mounting...");

    // 1. Create the plugin's root element
    calendarRoot = document.createElement('div');
    calendarRoot.id = 'crab-calendar-plugin-root';
    calendarRoot.className = 'w-full h-full p-6 bg-[#121212] overflow-auto';

    // 2. Embed the core UI from index.html (Simplified for refactor demo)
    calendarRoot.innerHTML = `
    <div class="calendar-shell flex flex-col gap-6">
        <header class="flex justify-between items-center">
            <h1 class="text-3xl font-bold text-[#ffd700]">Crab Calendar</h1>
            <div class="flex gap-2">
                <button id="prev-month" class="p-2 bg-[#2a2a2a] rounded">Prev</button>
                <button id="next-month" class="p-2 bg-[#2a2a2a] rounded">Next</button>
            </div>
        </header>
        
        <div id="calendar-grid" class="grid grid-cols-7 gap-1 bg-[#222] p-1 rounded-lg">
            <!-- Grid will be populated by app logic -->
        </div>

        <div id="event-list" class="mt-8">
            <h3 class="text-lg font-semibold mb-2">Upcoming Tasks</h3>
            <ul id="tasks-ul" class="space-y-2">
                <li class="p-3 bg-[#1e1e1e] border-l-4 border-yellow-500 rounded">Design Microkernel Architecture</li>
                <li class="p-3 bg-[#1e1e1e] border-l-4 border-gray-600 rounded">Implement Lazy Loading in Shell</li>
            </ul>
        </div>
    </div>
  `;

    container.appendChild(calendarRoot);
    initCalendar();
}

export async function unmount() {
    console.log("[CrabCalendar] Unmounting...");
    if (calendarRoot) {
        calendarRoot.remove();
        calendarRoot = null;
    }
}

function initCalendar() {
    const grid = document.getElementById('calendar-grid');
    if (!grid) return;

    // Generate a mock month
    for (let i = 1; i <= 31; i++) {
        const day = document.createElement('div');
        day.className = "h-24 p-2 bg-[#1a1a1a] flex flex-col hover:bg-[#252525] transition-colors cursor-pointer border border-[#333]";
        day.innerHTML = `<span class="text-xs text-gray-500 font-medium">${i}</span>`;
        if (i === 11) {
            day.classList.add('ring-2', 'ring-yellow-500');
            day.innerHTML += '<div class="mt-auto h-1 w-full bg-yellow-500 rounded-full"></div>';
        }
        grid.appendChild(day);
    }
}
