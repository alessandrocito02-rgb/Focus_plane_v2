// app.js - Motore principale Focus on Plane

let map, depMarker, arrMarker, planeMarker, routeLine;
let animationFrameId;
let flightTotalMs = 0, flightStartTime = 0, elapsedMsAtPause = 0;
let isRunning = false, isPaused = false;
let currentDep = null, currentArr = null;
let isDrawerOpen = true;

// RECUPERO BIGLIETTI SALVATI (I TUOI VOLI SONO AL SICURO QUI)
let myWallet = JSON.parse(localStorage.getItem('flightFocusTickets')) || [];
let savedCity = localStorage.getItem('flightFocusCurrentCity') || "Ancona AOI";

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function calculateBearing(startLat, startLng, destLat, destLng) {
    const y = Math.sin((destLng - startLng) * Math.PI / 180) * Math.cos(destLat * Math.PI / 180);
    const x = Math.cos(startLat * Math.PI / 180) * Math.sin(destLat * Math.PI / 180) - Math.sin(startLat * Math.PI / 180) * Math.cos(destLat * Math.PI / 180) * Math.cos((destLng - startLng) * Math.PI / 180);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

function populateDropdown(selectElement, airportList, selectedValue) {
    selectElement.innerHTML = '';
    const grouped = {};
    if (typeof zoneOrder !== 'undefined') {
        zoneOrder.forEach(z => grouped[z] = []);
        airportList.forEach(a => { if (grouped[a.zone]) grouped[a.zone].push(a); });
        
        zoneOrder.forEach(zone => {
            if (grouped[zone] && grouped[zone].length > 0) {
                grouped[zone].sort((a, b) => a.name.localeCompare(b.name));
                const optgroup = document.createElement('optgroup');
                optgroup.label = zone;
                grouped[zone].forEach(a => {
                    const opt = document.createElement('option');
                    opt.value = a.name; opt.innerText = a.name;
                    if (a.name === selectedValue) opt.selected = true;
                    optgroup.appendChild(opt);
                });
                selectElement.appendChild(optgroup);
            }
        });
    }
}

function toggleDrawer() {
    isDrawerOpen = !isDrawerOpen;
    const drawer = document.getElementById('drawer');
    const miniBar = document.getElementById('mini-bar');
    
    if (isDrawerOpen) {
        if (drawer) drawer.classList.remove('translate-y-full', 'md:-translate-x-[120%]');
        if (miniBar) miniBar.classList.add('translate-y-32');
    } else {
        if (drawer) drawer.classList.add('translate-y-full', 'md:-translate-x-[120%]');
        if (miniBar) miniBar.classList.remove('translate-y-32');
    }
}

function initMap() {
    populateDropdown(document.getElementById('departure'), airports, savedCity);
    
    map = L.map('map', { zoomControl: false }).setView([40.0, 10.0], 4);
    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    updateDestinations();
    renderWalletList();
}

function updateDestinations() {
    if(isRunning) return;
    const depName = document.getElementById('departure').value;
    const mins = parseInt(document.getElementById('duration').value);
    currentDep = airports.find(a => a.name === depName);

    localStorage.setItem('flightFocusCurrentCity', currentDep.name);

    let minKm = 0, maxKm = 99999;
    if(mins <= 1) { minKm = 0; maxKm = 99999; } 
    else if(mins <= 15) { minKm = 50; maxKm = 400; }
    else if(mins <= 25) { minKm = 300; maxKm = 900; }
    else if(mins <= 40) { minKm = 600; maxKm = 1500; } 
    else if(mins <= 45) { minKm = 1000; maxKm = 2500; }
    else if(mins <= 60) { minKm = 1500; maxKm = 4000; }
    else if(mins <= 90) { minKm = 3000; maxKm = 8000; } 
    else { minKm = 5000; maxKm = 20000; } 

    let validDestinations = airports.filter(a => {
        if (a.name === depName) return false;
        let dist = calculateDistance(currentDep.lat, currentDep.lng, a.lat, a.lng);
        return dist >= minKm && dist <= maxKm;
    });

    if(validDestinations.length === 0) validDestinations = airports.filter(a => a.name !== depName);
    populateDropdown(document.getElementById('arrival'), validDestinations, null);
    if (validDestinations.length > 0) document.getElementById('arrival').selectedIndex = 0;
    
    selectDestination();
}

function selectDestination() {
    if(isRunning) return;
    currentArr = airports.find(a => a.name === document.getElementById('arrival').value);
    if(!currentArr) return;

    const lblDep = document.getElementById('label-dep');
    const lblArr = document.getElementById('label-arr');
    const miniRoute = document.getElementById('mini-route');

    if(lblDep) lblDep.innerText = currentDep.name;
    if(lblArr) lblArr.innerText = currentArr.name;
    if(miniRoute) miniRoute.innerText = currentDep.name + " ➔ " + currentArr.name;
    
    flightTotalMs = parseInt(document.getElementById('duration').value) * 60 * 1000;
    elapsedMsAtPause = 0;
    
    updateDisplayState(0, flightTotalMs);
    drawRoute();
}

function drawRoute() {
    if (depMarker) map.removeLayer(depMarker);
    if (arrMarker) map.removeLayer(arrMarker);
    if (planeMarker) map.removeLayer(planeMarker);
    if (routeLine) map.removeLayer(routeLine);

    depMarker = L.circleMarker([currentDep.lat, currentDep.lng], {color: '#2563eb', fillColor: '#2563eb', fillOpacity: 1, radius: 6}).addTo(map);
    arrMarker = L.circleMarker([currentArr.lat, currentArr.lng], {color: '#059669', fillColor: '#059669', fillOpacity: 1, radius: 6}).addTo(map);
    routeLine = L.polyline([[currentDep.lat, currentDep.lng], [currentArr.lat, currentArr.lng]], {color: '#3b82f6', weight: 3, dashArray: '6, 12', opacity: 0.8}).addTo(map);

    const iconRotation = calculateBearing(currentDep.lat, currentDep.lng, currentArr.lat, currentArr.lng) - 45; 
    planeMarker = L.marker([currentDep.lat, currentDep.lng], {
        icon: L.divIcon({ html: `<div class="plane-icon" style="transform: rotate(${iconRotation}deg);">✈️</div>`, className: '', iconSize: [28, 28], iconAnchor: [14, 14] })
    }).addTo(map);
    
    map.fitBounds(routeLine.getBounds(), { padding: [60, 60], maxZoom: 5 });
}

function formatTime(ms) {
    let totalSecs = Math.ceil(ms / 1000); 
    const m = Math.floor(totalSecs / 60);
    return `${String(m).padStart(2, '0')}:${String(totalSecs % 60).padStart(2, '0')}`;
}

function updateDisplayState(elapsed, total) {
    let remainingMs = Math.max(0, total - elapsed);
    const timeString = formatTime(remainingMs);
    
    const tDisplay = document.getElementById('timer-display');
    const mTimer = document.getElementById('mini-timer');
    const pBar = document.getElementById('progress-bar');
    const mPBar = document.getElementById('mini-progress-bar');
    const fStatus = document.getElementById('flight-status');

    if (tDisplay) tDisplay.innerText = timeString;
    if (mTimer) mTimer.innerText = timeString;
    
    let percent = total > 0 ? Math.min(100, Math.max(0, (elapsed / total) * 100)) : 0;
    if (pBar) pBar.style.width = `${percent}%`;
    if (mPBar) mPBar.style.width = `${percent}%`;

    if (currentDep && currentArr) {
        const totalKm = calculateDistance(currentDep.lat, currentDep.lng, currentArr.lat, currentArr.lng);
        const remainingKm = Math.max(0, Math.round(totalKm * (1 - percent / 100)));
        
        const distDisplay = document.getElementById('distance-display');
        const miniDist = document.getElementById('mini-distance');
        
        if (distDisplay) distDisplay.innerText = `${remainingKm.toLocaleString('it-IT')} km`;
        if (miniDist) miniDist.innerText = `${remainingKm.toLocaleString('it-IT')} km`;
    }

    if (planeMarker && currentDep && currentArr) {
        const lat = currentDep.lat + (currentArr.lat - currentDep.lat) * (percent / 100);
        const lng = currentDep.lng + (currentArr.lng - currentDep.lng) * (percent / 100);
        planeMarker.setLatLng([lat, lng]);
    }

    let phase = "A terra";
    if (isRunning) {
        if (percent < 10) phase = "Decollo";
        else if (percent > 90) phase = "Atterraggio";
        else phase = "In crociera";
    }
    if (fStatus) fStatus.innerText = phase;
}

function startFlight() {
    if (isRunning) return;
    
    if (typeof startTurbulenceTracking === "function") startTurbulenceTracking();

    isRunning = true;
    isPaused = false;
    
    document.getElementById('btn-start').classList.add('hidden');
    document.getElementById('btn-pause').classList.remove('hidden');
    document.getElementById('btn-resume').classList.add('hidden');
    document.getElementById('btn-reset').classList.remove('hidden');
    document.getElementById('btn-reset').classList.add('col-span-1');
    ['departure', 'duration', 'arrival'].forEach(id => document.getElementById(id).disabled = true);

    if(isDrawerOpen) toggleDrawer();

    if (elapsedMsAtPause === 0) flightTotalMs = parseInt(document.getElementById('duration').value) * 60 * 1000;
    flightStartTime = Date.now() - elapsedMsAtPause;

    if (typeof scheduleLandingNotification === "function") {
        scheduleLandingNotification(flightTotalMs, currentDep.name, currentArr.name);
    }

    function step() {
        if (!isRunning || isPaused) return; 
        let now = Date.now();
        let elapsed = now - flightStartTime;
        
        if (elapsed >= flightTotalMs) {
            updateDisplayState(flightTotalMs, flightTotalMs);
            completeFlight();
            return;
        }
        updateDisplayState(elapsed, flightTotalMs);
        animationFrameId = requestAnimationFrame(step);
    }
    animationFrameId = requestAnimationFrame(step);
}

function pauseFlight() {
    if (!isRunning) return;
    isRunning = false; 
    isPaused = true;
    cancelAnimationFrame(animationFrameId);
    elapsedMsAtPause = Date.now() - flightStartTime;
    
    document.getElementById('btn-pause').classList.add('hidden');
    document.getElementById('btn-resume').classList.remove('hidden');
    document.getElementById('flight-status').innerText = "In pausa";
}

function resumeFlight() { startFlight(); }

function resetFlight() {
    if (typeof stopTurbulenceTracking === "function") stopTurbulenceTracking();

    isRunning = false;
    isPaused = false;
    cancelAnimationFrame(animationFrameId);
    elapsedMsAtPause = 0;
    
    document.getElementById('btn-start').classList.remove('hidden');
    document.getElementById('btn-pause').classList.add('hidden');
    document.getElementById('btn-resume').classList.add('hidden');
    document.getElementById('btn-reset').classList.add('hidden');
    document.getElementById('flight-status').innerText = "A terra";
    ['departure', 'duration', 'arrival'].forEach(id => document.getElementById(id).disabled = false);
    
    if(!isDrawerOpen) toggleDrawer();
    updateDestinations();
}

async function completeFlight() {
    isRunning = false;
    isPaused = false;
    cancelAnimationFrame(animationFrameId);
    elapsedMsAtPause = 0;
    
    let turbulenceReport = { text: "🌤️ Nessuna analisi", colorClass: "text-slate-300" };
    if (typeof stopTurbulenceTracking === "function") {
        turbulenceReport = stopTurbulenceTracking();
    }
    
    const today = new Date().toLocaleDateString('it-IT');
    const flightNum = "FP-" + Math.floor(Math.random() * 9000 + 1000);
    const durationTxt = document.getElementById('duration').options[document.getElementById('duration').selectedIndex].text;
    
    const weatherElem = document.getElementById('modal-weather');
    if (weatherElem) weatherElem.innerText = "Scansione... 📡";

    let weatherString = "Meteo non disponibile";
    if (typeof getDestinationWeather === "function") {
        weatherString = await getDestinationWeather(currentArr.lat, currentArr.lng);
    }

    if (weatherElem) weatherElem.innerText = weatherString;

    const newTicket = { 
        date: today, 
        flightNum: flightNum, 
        dep: currentDep.name, 
        arr: currentArr.name, 
        duration: durationTxt, 
        weather: weatherString,
        turbulence: turbulenceReport.text 
    };

    myWallet.push(newTicket);
    localStorage.setItem('flightFocusTickets', JSON.stringify(myWallet));
    localStorage.setItem('flightFocusCurrentCity', currentArr.name);
    document.getElementById('departure').value = currentArr.name;

    document.getElementById('modal-flight-num').innerText = newTicket.flightNum;
    document.getElementById('modal-dep').innerText = newTicket.dep.substring(0, 15);
    document.getElementById('modal-arr').innerText = newTicket.arr.substring(0, 15);
    document.getElementById('modal-date').innerText = newTicket.date;
    document.getElementById('modal-duration').innerText = newTicket.duration;

    const turbElement = document.getElementById('modal-turbulence');
    if (turbElement) {
        turbElement.innerText = turbulenceReport.text;
        turbElement.className = `font-bold text-sm ${turbulenceReport.colorClass}`;
    }

    document.getElementById('ticket-modal').classList.remove('hidden');
    setTimeout(() => document.getElementById('ticket-content').classList.replace('scale-95', 'scale-100'), 10);
    
    renderWalletList();
}

function closeTicketAndSave() {
    document.getElementById('ticket-content').classList.replace('scale-100', 'scale-95');
    setTimeout(() => {
        document.getElementById('ticket-modal').classList.add('hidden');
        resetFlight();
    }, 300);
}

function toggleWallet() {
    const modal = document.getElementById('wallet-modal');
    if (modal) modal.classList.toggle('hidden');
}

// NUOVO: LOGICA CAMBIO SCHEDE PASSAPORTO A 3 TAB
function switchPassportTab(tab) {
    const tabs = ['profile', 'tickets', 'achievements'];
    
    tabs.forEach(t => {
        const btn = document.getElementById(`tab-btn-${t}`);
        const content = document.getElementById(`tab-content-${t}`);
        if (!btn || !content) return;
        
        if (t === tab) {
            btn.className = "flex-1 py-3 text-[10px] sm:text-xs font-black uppercase tracking-wider border-b-2 text-blue-600 border-blue-600";
            if(t === 'achievements') btn.className = btn.className.replace('text-blue-600', 'text-amber-500').replace('border-blue-600', 'border-amber-500');
            content.classList.remove('hidden');
        } else {
            btn.className = "flex-1 py-3 text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400 border-b-2 border-transparent hover:text-slate-600";
            content.classList.add('hidden');
        }
    });
}

// AGGIORNATO: ORA RENDERIZZA I BIGLIETTI NELLA SCHEDA GIUSTA E CARICA GLI OBIETTIVI
function renderWalletList() {
    // Aggiorna gli obiettivi in background
    if (typeof renderAchievementsList === "function") {
        renderAchievementsList(myWallet);
    }

    // Aggiorna la lista dei biglietti
    const list = document.getElementById('tab-content-tickets');
    if (!list) return;

    if (myWallet.length === 0) {
        list.innerHTML = '<div class="text-center text-slate-500 py-8 font-bold">Nessun volo registrato. Inizia la tua prima sessione!</div>';
        return;
    }
    
    list.innerHTML = '';
    [...myWallet].reverse().forEach(ticket => {
        list.innerHTML += `
            <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-3">
                <div class="flex items-center gap-4">
                    <div class="bg-blue-100 text-blue-600 p-3 rounded-xl font-bold font-mono">${ticket.flightNum}</div>
                    <div>
                        <p class="font-black text-slate-800">${ticket.dep} ➔ ${ticket.arr}</p>
                        <p class="text-xs font-bold text-slate-400">${ticket.date} • Durata: ${ticket.duration} • ${ticket.weather || ''}</p>
                    </div>
                </div>
                <div class="text-emerald-500 bg-emerald-50 px-4 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-black border border-emerald-200">
                    Completato
                </div>
            </div>
        `;
    });
}

window.onload = initMap;
