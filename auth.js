// auth.js - Gestione Identità, Login e Passaporto Sfocato

window.isRegisterMode = false;
const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2364748b'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

// Passa dalla modalità "Login" a "Registrazione" (Forzata globalmente)
window.toggleAuthMode = function() {
    window.isRegisterMode = !window.isRegisterMode;
    const title = document.getElementById('auth-title');
    const btn = document.getElementById('auth-submit-btn');
    const switchText = document.getElementById('auth-switch-text');
    const registerFields = document.getElementById('auth-register-fields');

    if (!title || !btn || !switchText || !registerFields) return;

    if (window.isRegisterMode) {
        title.innerText = "Registrazione";
        btn.innerText = "Emetti Passaporto";
        switchText.innerText = "Hai già un passaporto? Accedi";
        registerFields.classList.remove('hidden');
    } else {
        title.innerText = "Verifica Identità";
        btn.innerText = "Accedi al Passaporto";
        switchText.innerText = "Richiedi un Passaporto (Registrati)";
        registerFields.classList.add('hidden');
    }
};

// Controlla se c'è un utente loggato all'apertura dell'app
function checkAuthStatus() {
    const userJson = localStorage.getItem('fp_currentUser');
    if (userJson) {
        const user = JSON.parse(userJson);
        unlockPassport(user);
    } else {
        lockPassport();
    }
    if (typeof updateProfileStats === 'function') updateProfileStats();
}

// Gestisce il click sul pulsante Accedi/Registrati
window.handleAuthSubmit = function() {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value.trim();

    if (!email || !password) {
        alert("Email e Password sono obbligatori per accedere alla dogana.");
        return;
    }

    if (window.isRegisterMode) {
        const name = document.getElementById('auth-name').value.trim();
        const surname = document.getElementById('auth-surname').value.trim();
        
        if (!name || !surname) {
            alert("Nome e Cognome sono richiesti per emettere il passaporto.");
            return;
        }

        const newUser = { email, password, name, surname, avatar: DEFAULT_AVATAR };
        
        // Salvataggio locale in attesa del cloud
        localStorage.setItem(`fp_user_${email}`, JSON.stringify(newUser));
        localStorage.setItem('fp_currentUser', JSON.stringify(newUser));
        unlockPassport(newUser);

    } else {
        // Logica di Login
        const savedUserJson = localStorage.getItem(`fp_user_${email}`);
        if (savedUserJson) {
            const savedUser = JSON.parse(savedUserJson);
            if (savedUser.password === password) {
                localStorage.setItem('fp_currentUser', JSON.stringify(savedUser));
                unlockPassport(savedUser);
            } else {
                alert("Password errata. Riprova.");
            }
        } else {
            alert("Nessun passaporto trovato con questa email. Registrati.");
        }
    }
};

// Sblocca il passaporto, rimuove la sfocatura e popola i dati
function unlockPassport(user) {
    const overlay = document.getElementById('auth-overlay');
    if(overlay) overlay.classList.add('hidden');

    const passportData = document.getElementById('passport-data-container');
    if(passportData) {
        passportData.classList.remove('blur-md', 'pointer-events-none', 'opacity-40');
        passportData.classList.add('opacity-100');
    }

    document.getElementById('profile-name-display').value = user.name || "";
    document.getElementById('profile-surname-display').value = user.surname || "";
    
    const avatarImg = document.getElementById('profile-avatar');
    const headerImg = document.getElementById('header-avatar');
    
    if (user.avatar) {
        if(avatarImg) avatarImg.src = user.avatar;
        if(headerImg) headerImg.src = user.avatar;
    } else {
        if(avatarImg) avatarImg.src = DEFAULT_AVATAR;
        if(headerImg) headerImg.src = DEFAULT_AVATAR;
    }
    
    document.getElementById('profile-name-display').readOnly = false;
    document.getElementById('profile-surname-display').readOnly = false;
}

// Blocca il passaporto e mostra il login
function lockPassport() {
    const overlay = document.getElementById('auth-overlay');
    if(overlay) overlay.classList.remove('hidden');

    const passportData = document.getElementById('passport-data-container');
    if(passportData) {
        passportData.classList.add('blur-md', 'pointer-events-none', 'opacity-40');
        passportData.classList.remove('opacity-100');
    }
    
    const headerImg = document.getElementById('header-avatar');
    if (headerImg) headerImg.src = DEFAULT_AVATAR;
}

// Esce dall'account
window.logout = function() {
    localStorage.removeItem('fp_currentUser');
    document.getElementById('auth-email').value = "";
    document.getElementById('auth-password').value = "";
    lockPassport();
};

// Modifica nome/cognome nel passaporto
window.updateUserData = function() {
    const userJson = localStorage.getItem('fp_currentUser');
    if (!userJson) return;
    
    const user = JSON.parse(userJson);
    user.name = document.getElementById('profile-name-display').value;
    user.surname = document.getElementById('profile-surname-display').value;
    
    localStorage.setItem('fp_currentUser', JSON.stringify(user));
    localStorage.setItem(`fp_user_${user.email}`, JSON.stringify(user));
};

// Carica la foto
window.loadAvatar = function(event) {
    const file = event.target.files[0];
    const userJson = localStorage.getItem('fp_currentUser');
    if (!file || !userJson) return;

    const user = JSON.parse(userJson);
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const imageData = e.target.result;
        user.avatar = imageData;
        
        document.getElementById('profile-avatar').src = imageData;
        const headerAvatar = document.getElementById('header-avatar');
        if (headerAvatar) headerAvatar.src = imageData;
        
        localStorage.setItem('fp_currentUser', JSON.stringify(user));
        localStorage.setItem(`fp_user_${user.email}`, JSON.stringify(user));
    };
    reader.readAsDataURL(file);
};

window.addEventListener('load', checkAuthStatus);
