// auth.js - Gestione Cloud Firebase, Login e Passaporto Sfocato

// Configurazione Firebase dal tuo progetto
const firebaseConfig = {
    apiKey: "AIzaSyCVznKpkC6aub72EfaAkKGr4G6a099Lu-Q",
    authDomain: "focus-plane-ef044.firebaseapp.com",
    projectId: "focus-plane-ef044",
    storageBucket: "focus-plane-ef044.firebasestorage.app",
    messagingSenderId: "408825981588",
    appId: "1:408825981588:web:de537d8ddd9c87cde42281"
};

// Inizializzazione Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

window.isRegisterMode = false;
const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2364748b'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

// Passa dalla modalità Login a Registrazione
window.toggleAuthMode = function() {
    window.isRegisterMode = !window.isRegisterMode;
    const title = document.getElementById('auth-title');
    const btn = document.getElementById('auth-submit-btn');
    const switchText = document.getElementById('auth-switch-text');
    const registerFields = document.getElementById('auth-register-fields');

    if (!title || !btn || !switchText || !registerFields) return;

    if (window.isRegisterMode) {
        title.innerText = "Registrazione Cloud";
        btn.innerText = "Crea Passaporto Cloud";
        switchText.innerText = "Hai già un passaporto? Accedi";
        registerFields.classList.remove('hidden');
    } else {
        title.innerText = "Verifica Identità";
        btn.innerText = "Accedi al Passaporto";
        switchText.innerText = "Richiedi un Passaporto (Registrati)";
        registerFields.classList.add('hidden');
    }
};

// Gestisce il Login o la Registrazione reale su Firebase
window.handleAuthSubmit = async function() {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value.trim();
    const btn = document.getElementById('auth-submit-btn');

    if (!email || !password) {
        alert("Inserisci email e password.");
        return;
    }

    btn.innerText = "Connessione ai server...";

    try {
        if (window.isRegisterMode) {
            const name = document.getElementById('auth-name').value.trim();
            const surname = document.getElementById('auth-surname').value.trim();
            
            if (!name || !surname) {
                alert("Inserisci nome e cognome.");
                btn.innerText = "Crea Passaporto Cloud";
                return;
            }

            // 1. Crea l'utente su Firebase Auth
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const uid = userCredential.user.uid;

            // 2. Salva i dati anagrafici nel Database Firestore
            const userData = { name, surname, email, avatar: DEFAULT_AVATAR };
            await db.collection("users").doc(uid).set(userData);

            unlockPassport(userData);
        } else {
            // 1. Effettua il Login su Firebase Auth
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const uid = userCredential.user.uid;

            // 2. Recupera i dati da Firestore
            const doc = await db.collection("users").doc(uid).get();
            if (doc.exists) {
                unlockPassport(doc.data());
            } else {
                unlockPassport({ email, name: "Capitano", surname: "Focus", avatar: DEFAULT_AVATAR });
            }
        }
    } catch (error) {
        alert("Errore doganale: " + error.message);
        btn.innerText = window.isRegisterMode ? "Crea Passaporto Cloud" : "Accedi al Passaporto";
    }
};

// Ascolta i cambiamenti di stato dell'utente in tempo reale
auth.onAuthStateChanged(async (user) => {
    if (user) {
        const doc = await db.collection("users").doc(user.uid).get();
        if (doc.exists) {
            unlockPassport(doc.data());
        }
    } else {
        lockPassport();
    }
});

// Sblocca il passaporto visivamente
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
    
    const avatarSrc = user.avatar || DEFAULT_AVATAR;
    if(avatarImg) avatarImg.src = avatarSrc;
    if(headerImg) headerImg.src = avatarSrc;
    
    document.getElementById('profile-name-display').readOnly = false;
    document.getElementById('profile-surname-display').readOnly = false;

    if (typeof updateProfileStats === 'function') updateProfileStats();
}

// Blocca il passaporto
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

// Logout da Firebase
window.logout = async function() {
    await auth.signOut();
    document.getElementById('auth-email').value = "";
    document.getElementById('auth-password').value = "";
    lockPassport();
};

// Aggiorna nome/cognome su Firestore in tempo reale
window.updateUserData = async function() {
    const user = auth.currentUser;
    if (!user) return;
    
    const name = document.getElementById('profile-name-display').value;
    const surname = document.getElementById('profile-surname-display').value;
    
    await db.collection("users").doc(user.uid).update({ name, surname });
};

// Carica e aggiorna l'avatar sul Cloud
window.loadAvatar = async function(event) {
    const file = event.target.files[0];
    const user = auth.currentUser;
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        const imageData = e.target.result;
        
        document.getElementById('profile-avatar').src = imageData;
        const headerAvatar = document.getElementById('header-avatar');
        if (headerAvatar) headerAvatar.src = imageData;
        
        // Salva l'immagine su Firestore
        await db.collection("users").doc(user.uid).update({ avatar: imageData });
    };
    reader.readAsDataURL(file);
};

function updateProfileStats() {
    if (typeof myWallet !== 'undefined') {
        document.getElementById('stat-flights').innerText = myWallet.length;
        if (typeof checkAchievements === 'function') {
            const unlocked = checkAchievements(myWallet);
            document.getElementById('stat-achievements').innerText = unlocked.size;
        }
    }
}
