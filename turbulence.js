// turbulence.js - Modulo Anti-Distrazione

let turbulenceCount = 0;
let isTrackingActive = false;

function handleVisibilityChange() {
    if (isTrackingActive && document.hidden) {
        turbulenceCount++;
    }
}

function startTurbulenceTracking() {
    turbulenceCount = 0;
    isTrackingActive = true;
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
}

function stopTurbulenceTracking() {
    isTrackingActive = false;
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    return getTurbulenceReport();
}

function getTurbulenceReport() {
    if (turbulenceCount === 0) {
        return { text: "🌤️ Volo Perfetto", colorClass: "text-emerald-300" };
    } else if (turbulenceCount <= 2) {
        return { text: `🌬️ Lieve Turbolenza (${turbulenceCount})`, colorClass: "text-amber-300" };
    } else {
        return { text: `🌩️ Molto Turbolento (${turbulenceCount})`, colorClass: "text-rose-300" };
    }
}