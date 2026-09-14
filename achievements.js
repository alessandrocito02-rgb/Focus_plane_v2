// achievements.js - Gestore dei 30 Obiettivi e Badge di Focus on Plane

const ACHIEVEMENTS_LIST = [
    // 🗺️ Esploratore Geografico
    { id: 'first_flight', name: 'Battesimo dell\'Aria', desc: 'Completa il tuo primissimo volo.', icon: '🛫', category: 'geo' },
    { id: 'italy_explorer', name: 'Giro d\'Italia', desc: 'Completa almeno 5 voli tra aeroporti italiani.', icon: '🇮🇹', category: 'geo' },
    { id: 'euro_trip', name: 'EuroTrip', desc: 'Atterra in 5 paesi europei differenti.', icon: '🇪🇺', category: 'geo' },
    { id: 'us_dream', name: 'Sogno Americano', desc: 'Completa 3 voli verso o nel Nord America.', icon: '🗽', category: 'geo' },
    { id: 'samba_rhythm', name: 'Rhythm & Samba', desc: 'Atterra a Rio de Janeiro o Buenos Aires.', icon: '💃', category: 'geo' },
    { id: 'silk_road', name: 'Via della Seta', desc: 'Atterra in Asia Orientale (Tokyo, Seul, Pechino, Hong Kong).', icon: '⛩️', category: 'geo' },
    { id: 'safari_focus', name: 'Safari Focus', desc: 'Atterra in almeno 2 aeroporti africani.', icon: '🦁', category: 'geo' },
    { id: 'down_under', name: 'Down Under', desc: 'Atterra in Australia o Nuova Zelanda.', icon: '🦘', category: 'geo' },
    { id: 'globe_trotter', name: 'Trofeo dei Continenti', desc: 'Atterra in tutte le 7 zone geografiche.', icon: '🌍', category: 'geo' },
    { id: 'bolzano_stop', name: 'Scalo a Bolzano', desc: 'Completa un volo con partenza o arrivo a Bolzano BZO.', icon: '🏔️', category: 'geo' },
    { id: 'world_tour', name: 'Giro del Mondo', desc: 'Completa 10 voli totali verso destinazioni diverse.', icon: '🌐', category: 'geo' },
    { id: 'desert_island', name: 'Isola Deserta', desc: 'Atterra a Lampedusa, Santorini, Mykonos o Maldive.', icon: '🏝️', category: 'geo' },

    // ⏱️ Tempo & Ore Accumulate
    { id: 'short_flight', name: 'Volo Breve', desc: 'Accumula 15 minuti totali di focus.', icon: '⏱️', category: 'time' },
    { id: 'pomodoro_master', name: 'Pomodoro Master', desc: 'Completa 10 voli da 25 minuti.', icon: '🍅', category: 'time' },
    { id: 'captain_5h', name: 'Capitano di Crociera', desc: 'Accumula 5 ore totali di volo.', icon: '👨‍✈️', category: 'time' },
    { id: 'officer_24h', name: 'Ufficiale di Rotta', desc: 'Accumula 24 ore totali di focus.', icon: '🎖️', category: 'time' },
    { id: 'veteran_100h', name: 'Veteran Pilot', desc: 'Accumula 100 ore totali di volo.', icon: '👑', category: 'time' },
    { id: 'long_haul_60', name: 'Lungo Raggio', desc: 'Completa una singola sessione da 60 minuti.', icon: '✈️', category: 'time' },
    { id: 'transatlantic', name: 'Transoceanico', desc: 'Completa una singola sessione da 90 o 120 minuti.', icon: '🌊', category: 'time' },
    { id: 'sky_marathon', name: 'Maratona nei Cieli', desc: 'Accumula 3 ore di focus nello stesso giorno.', icon: '🏃‍♂️', category: 'time' },

    // 🎯 Disciplina & Turbolenze
    { id: 'clear_sky', name: 'Cielo Sereno', desc: 'Completa un volo con zero turbolenze (zero uscite).', icon: '☀️', category: 'focus' },
    { id: 'test_pilot', name: 'Pilota Collaudatore', desc: 'Completa 5 voli con esito Volo Perfetto.', icon: '🛡️', category: 'focus' },
    { id: 'iron_pilot', name: 'Pilota d\'Acciaio', desc: 'Completa un volo da 60+ min con zero distrazioni.', icon: '💎', category: 'focus' },
    { id: 'overcome_turb', name: 'Supera la Turbolenza', desc: 'Completa una sessione registrando almeno 1 distrazione.', icon: '🌩️', category: 'focus' },

    // 🛂 Passport & Routine
    { id: 'ticket_collector', name: 'Collezionista', desc: 'Conserva 10 carte d\'imbarco nel Passaporto.', icon: '🎫', category: 'passport' },
    { id: 'passport_full', name: 'Passaporto Pieno', desc: 'Conserva 50 carte d\'imbarco nel Passaporto.', icon: '📕', category: 'passport' },
    { id: 'frequent_3d', name: 'Frequent Flyer', desc: 'Effettua almeno un volo al giorno per 3 giorni di fila.', icon: '🔥', category: 'passport' },
    { id: 'routine_7d', name: 'Routine di Volo', desc: 'Effettua almeno un volo al giorno per 7 giorni di fila.', icon: '⚡', category: 'passport' },
    { id: 'night_flight', name: 'Volo Notturno', desc: 'Completa un volo tra le 22:00 e le 05:00.', icon: '🌙', category: 'passport' },
    { id: 'dawn_flight', name: 'Volare all\'Alba', desc: 'Completa un volo tra le 05:00 e le 08:00.', icon: '🌅', category: 'passport' }
];

// Valuta quali obiettivi sono stati sbloccati
function checkAchievements(wallet) {
    const unlockedIds = new Set();
    if (!wallet || wallet.length === 0) return unlockedIds;

    const totalFlights = wallet.length;
    if (totalFlights >= 1) unlockedIds.add('first_flight');
    if (totalFlights >= 10) unlockedIds.add('ticket_collector');
    if (totalFlights >= 50) unlockedIds.add('passport_full');

    let totalMinutes = 0;
    let perfectCount = 0;
    let pomodoroCount = 0;
    const visitedZones = new Set();
    const visitedCountries = new Set();
    const italyFlights = [];

    wallet.forEach(t => {
        const mins = parseInt(t.duration) || 0;
        totalMinutes += mins;

        if (mins === 25) pomodoroCount++;
        if (mins >= 60) unlockedIds.add('long_haul_60');
        if (mins >= 90) unlockedIds.add('transatlantic');

        if (t.turbulence && t.turbulence.includes('Volo Perfetto')) {
            perfectCount++;
            if (mins >= 60) unlockedIds.add('iron_pilot');
        }
        if (t.turbulence && (t.turbulence.includes('Lieve') || t.turbulence.includes('Turbolento'))) {
            unlockedIds.add('overcome_turb');
        }

        if (t.dep && t.dep.includes('Bolzano') || t.arr && t.arr.includes('Bolzano')) {
            unlockedIds.add('bolzano_stop');
        }

        const islandCities = ['Lampedusa LMP', 'Santorini JTR', 'Mykonos JMK', 'Maldive MLE'];
        if (islandCities.some(c => t.arr && t.arr.includes(c))) unlockedIds.add('desert_island');

        if (t.arr && (t.arr.includes('Rio de Janeiro') || t.arr.includes('Buenos Aires'))) {
            unlockedIds.add('samba_rhythm');
        }

        if (t.arr && (t.arr.includes('Tokyo') || t.arr.includes('Seul') || t.arr.includes('Pechino') || t.arr.includes('Hong Kong'))) {
            unlockedIds.add('silk_road');
        }
    });

    if (totalMinutes >= 15) unlockedIds.add('short_flight');
    if (pomodoroCount >= 10) unlockedIds.add('pomodoro_master');
    if (totalMinutes >= 300) unlockedIds.add('captain_5h');
    if (totalMinutes >= 1440) unlockedIds.add('officer_24h');
    if (totalMinutes >= 6000) unlockedIds.add('veteran_100h');

    if (perfectCount >= 1) unlockedIds.add('clear_sky');
    if (perfectCount >= 5) unlockedIds.add('test_pilot');

    return unlockedIds;
}

// Renderizza la griglia degli obiettivi nella modale Passaporto
function renderAchievementsList(wallet) {
    const container = document.getElementById('achievements-grid');
    if (!container) return;

    const unlocked = checkAchievements(wallet);
    const unlockedCount = unlocked.size;

    document.getElementById('achievements-progress-text').innerText = `${unlockedCount} / 30 Sbloccati`;
    document.getElementById('achievements-progress-bar').style.width = `${(unlockedCount / 30) * 100}%`;

    container.innerHTML = '';
    ACHIEVEMENTS_LIST.forEach(ach => {
        const isUnlocked = unlocked.has(ach.id);
        container.innerHTML += `
            <div class="p-3 rounded-2xl border ${isUnlocked ? 'bg-amber-50/60 border-amber-200' : 'bg-slate-50 border-slate-200 opacity-60'} flex items-center gap-3 transition">
                <div class="text-3xl p-2 rounded-xl ${isUnlocked ? 'bg-amber-100' : 'bg-slate-200 grayscale'}">${ach.icon}</div>
                <div class="flex-1 min-w-0">
                    <p class="font-black text-xs ${isUnlocked ? 'text-amber-900' : 'text-slate-700'} truncate">${ach.name}</p>
                    <p class="text-[10px] text-slate-500 font-medium leading-tight">${ach.desc}</p>
                </div>
                <div class="text-xs font-bold ${isUnlocked ? 'text-amber-600' : 'text-slate-400'}">
                    ${isUnlocked ? '🔓' : '🔒'}
                </div>
            </div>
        `;
    });
}
