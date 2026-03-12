let calendarRoot = null;

export async function mount(container) {
    console.log("[CrabCalendar] Mounting...");

    // 1. Inject Styles & Scripts
    if (!document.getElementById('crab-calendar-styles')) {
        const tw = document.createElement('script');
        tw.src = 'https://cdn.tailwindcss.com';
        document.head.appendChild(tw);

        const lucide = document.createElement('script');
        lucide.src = 'https://unpkg.com/lucide@latest';
        document.head.appendChild(lucide);

        const link = document.createElement('link');
        link.id = 'crab-calendar-styles';
        link.rel = 'stylesheet';
        link.href = '/plugins/crabcalendar/dist/style.css';
        document.head.appendChild(link);
    }

    // 2. Create the plugin's root element
    calendarRoot = document.createElement('div');
    calendarRoot.id = 'crab-calendar-plugin-root';
    calendarRoot.className = 'w-full h-full overflow-auto bg-[var(--bg-primary)]';

    // 3. Inject Full HTML
    calendarRoot.innerHTML = `
    <div class="calendar-app container mx-auto px-4 py-8" style="background: var(--bg-primary); min-height: 100%;">
        <header class="flex justify-between items-center mb-8">
            <div>
                <h1 class="text-4xl font-bold text-[#ffd700] flex items-center gap-3">
                    <img src="/plugins/crabcalendar/assets/logo.png" alt="Crab Logo" class="w-12 h-12"> Crab Calendar
                </h1>
                <p class="text-gray-400 text-sm mt-1">Lightweight. AI-Friendly. Snappy.</p>
            </div>
            
            <nav class="flex items-center gap-6 bg-[#1a1a1a] px-6 py-2 rounded-2xl shadow-sm border border-[#333]">
                <button class="nav-link active flex items-center gap-2 font-semibold pb-1 text-[#ffd700]">Tasks</button>
                <button class="nav-link flex items-center gap-2 font-semibold pb-1 text-gray-400">Calendar</button>
            </nav>
        </header>

        <main class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <section class="lg:col-span-3">
                <div class="bg-[#1a1a1a] rounded-3xl p-6 shadow-xl border-t-8 border-[#ffd700]">
                    <h2 class="text-xl font-bold text-white mb-4 flex items-center gap-2">Daily Shell</h2>
                    <div class="space-y-4">
                        <div class="p-4 bg-[#252525] rounded-2xl">
                            <p class="text-gray-400 text-sm font-semibold">Pending Tasks</p>
                            <p class="text-3xl font-bold text-[#ffd700]">3</p>
                        </div>
                    </div>
                </div>
            </section>

            <section class="lg:col-span-9">
                <div id="calendar-grid" class="grid grid-cols-7 gap-1 bg-[#222] p-1 rounded-lg">
                    <!-- Grid will be populated by initCalendar -->
                </div>
            </section>
        </main>
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
