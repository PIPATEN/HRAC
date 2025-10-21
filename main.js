// main.js - Secure Single-Page Application (SPA) Authentication Handler

// 1. YOUR FIREBASE CONFIGURATION (Using the provided config)
const firebaseConfig = {
    apiKey: "AIzaSyCTySJ47HQAQJLk-2jbxld_7Yx4YeSTrJQ",
    authDomain: "questionbank-8edee.firebaseapp.com",
    projectId: "questionbank-8edee",
    storageBucket: "questionbank-8edee.firebasestorage.app",
    messagingSenderId: "916266107755",
    appId: "1:916266107755:web:8697df896deb8479e6422e",
    measurementId: "G-DRFYPLC7GX"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth(); 

const db = firebase.firestore();

// 💥 Initialize Google Provider 💥
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({
    // Forces account selection, useful for multi-user/shared devices
    'prompt': 'select_account' 
}); 

// 2. Get DOM elements for state management
const loadingState = document.getElementById('loading-state');
const signInState = document.getElementById('sign-in-state');
const appContent = document.getElementById('app-content');
const userDisplayName = document.getElementById('user-display-name');

const errorMessage = document.getElementById('error-message');
const googleLoginBtn = document.getElementById('google-login-btn'); 
const logoutBtn = document.getElementById('logout-btn');
// 💥 NEW: Get the anonymous login button
const anonymousLoginBtn = document.getElementById('anonymous-login-btn'); 

// Check if DOM elements exist before adding listeners (important for robustness)
if (!loadingState || !signInState || !appContent || !googleLoginBtn || !logoutBtn || !anonymousLoginBtn) {
    console.error("Missing required DOM elements. Ensure HTML structure is correct.");
}


// Helper function to show errors
const displayError = (message) => {
    if (errorMessage) {
        errorMessage.textContent = message;
    }
};

// 💥 --- Function to handle Google Sign-In with Popup --- 💥 
const handleGoogleLogin = () => {   
displayError('');   
// Uses the signInWithPopup method  
auth.signInWithPopup(googleProvider)    
.then((result) => { 
// Authentication successful, onAuthStateChanged handles the rest   
console.log("Google Sign-In successful via popup.");    
})  
.catch((error) => { 
// This handles all errors, including popup being closed    
if (error.code !== 'auth/popup-closed-by-user') {   
displayError("Google Sign-In Failed: " + error.message);    
}   
console.error("Google Sign-In Error:", error);  
}); 
};

// 💥 --- NEW: Function to handle Anonymous Sign-In --- 💥
const handleAnonymousLogin = () => {
    displayError(''); 

    // Disable button to prevent multiple clicks
    if (anonymousLoginBtn) {
        anonymousLoginBtn.disabled = true;
        anonymousLoginBtn.textContent = 'Signing in...';
    }

    auth.signInAnonymously()
        .then(() => {
            // Sign-in successful, onAuthStateChanged handles the rest
        })
        .catch((error) => {
            displayError("Anonymous Sign-In Failed: " + error.message);
            console.error("Anonymous Sign-In Error:", error);
            
            // Re-enable button on failure
            if (anonymousLoginBtn) {
                anonymousLoginBtn.disabled = false;
                anonymousLoginBtn.textContent = 'Continue as Guest';
            }
        });
};



// 💥 --- Event Listener for Google Button (Sign In) --- 💥
if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleGoogleLogin();
    });
}

// 💥 --- NEW: Event Listener for Anonymous Button --- 💥
if (anonymousLoginBtn) {
    anonymousLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleAnonymousLogin();
    });
}


// 💥 --- Event Listener for Logout Button --- 💥
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Clear the user session
        auth.signOut().catch(error => {
            console.error("Logout failed:", error);
        });
    });
}


// 💥 --- CORE AUTHENTICATION CHECK (Runs on load and state change) --- 💥
auth.onAuthStateChanged((user) => {
    // 1. Hide the initial loading state once the authentication status is known
    if (loadingState) {
        loadingState.classList.add('hidden');
    }

    if (user) {
        // --- USER IS LOGGED IN (PROTECTED ACCESS GRANTED) ---
        console.log(`User state changed: ${user.email || 'Anonymous'} is logged in. Anonymous: ${user.isAnonymous}`);

        // Show protected content and hide the sign-in prompt
        if (appContent && signInState) {
            appContent.classList.remove('hidden');
            signInState.classList.add('hidden');
        }
        
        // Display user name, using 'Guest User' if anonymous
        if (userDisplayName) {
            userDisplayName.textContent = user.isAnonymous ? 'Guest User' : (user.displayName || user.email);
        }



    } else {
        // --- USER IS LOGGED OUT (REQUIRES SIGN IN) ---
        console.log("User state changed: No user is logged in.");

        // Show sign-in prompt and hide protected content
        if (appContent && signInState) {
            appContent.classList.add('hidden');
            signInState.classList.remove('hidden');
        }
        
        // Reset anonymous button state on logout
        if (anonymousLoginBtn) {
            anonymousLoginBtn.disabled = false;
            anonymousLoginBtn.textContent = 'Continue as Guest';
        }
    }
});