// auth.js - Gestione Identità e Login Cloud

// Carica i dati salvati all'apertura
function loadProfile() {
    const savedName = localStorage.getItem('fp_userName');
    const savedSurname = localStorage.getItem('fp_userSurname');
    const savedAvatar = localStorage.getItem('fp_userAvatar');

    if (savedName) document.getElementById('profile-name').value = savedName;
    if (savedSurname) document.getElementById('profile-surname').value = savedSurname;
    if (savedAvatar) document.getElementById('profile-avatar').src = savedAvatar;
    
    updateProfileStats();
}

// Salva i dati testuali quando scrivi
function saveProfile() {
    const name = document.getElementById('profile-name').value;
    const surname = document.getElementById('profile-surname').value;
    
    localStorage.setItem('fp_userName', name);
    localStorage.setItem('fp_userSurname', surname);
}

// Converte l'immagine in Base64 per salvarla nel Passaporto
function loadAvatar(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageData = e.target.result;
            document.getElementById('profile-avatar').src = imageData;
            localStorage.setItem('fp_userAvatar', imageData);
        };
        reader.readAsDataURL(file);
    }
}

// Aggiorna dinamicamente i contatori dei voli e dei trofei
function updateProfileStats() {
    if (typeof myWallet !== 'undefined') {
        document.getElementById('stat-flights').innerText = myWallet.length;
        
        if (typeof checkAchievements === 'function') {
            const unlocked = checkAchievements(myWallet);
            document.getElementById('stat-achievements').innerText = unlocked.size;
        }
    }
}

// Simulazione pulsante Cloud per il prossimo step
function initCloudAuth() {
    const btn = document.getElementById('btn-cloud-sync');
    btn.innerHTML = "🔄 Connessione ai server...";
    btn.classList.replace('bg-slate-800', 'bg-blue-600');
    
    setTimeout(() => {
        alert("Modulo server pronto! Nel prossimo step collegheremo un database reale per sincronizzare i tuoi biglietti e la tua foto su tutti i tuoi dispositivi.");
        btn.innerHTML = "✅ Sincronizzato";
        btn.classList.replace('bg-blue-600', 'bg-emerald-500');
    }, 1500);
}

// Avvia il caricamento quando la finestra è pronta
window.addEventListener('load', loadProfile);
