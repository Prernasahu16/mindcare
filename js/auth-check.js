// auth-check.js - Handles navigation updates based on authentication state
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDpasFWwylXGImZ9PefqCY5uec8owlK7Yw",
  authDomain: "mindcare-be32e.firebaseapp.com",
  projectId: "mindcare-be32e",
  storageBucket: "mindcare-be32e.firebasestorage.app",
  messagingSenderId: "504418183948",
  appId: "1:504418183948:web:823c58dcbb332758083729",
  measurementId: "G-LD1LHHDJ51"
};

// Initialize Firebase
console.log("Initializing Firebase in auth-check.js...");
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Function to update navigation based on auth state
function updateNavigation(user) {
    const authButtons = document.querySelector('.auth-buttons');
    const userFeatures = document.querySelector('.user-features');
    
    if (user) {
        // User is logged in - Show user features and logout button
        if (authButtons) {
            authButtons.innerHTML = `
                <span class="user-welcome">
                    <i class="fas fa-user"></i> Welcome, ${user.displayName || 'User'}
                </span>
                <button class="btn btn-login" onclick="logout()">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </button>
            `;
        }
        
        // Show user-specific features
        if (userFeatures) {
            userFeatures.style.display = 'flex';
            userFeatures.innerHTML = `
                <a href="profile.html" class="nav-link"><i class="fas fa-user"></i> Profile</a>
                <a href="mood-tracker.html" class="nav-link"><i class="fas fa-chart-line"></i> Mood Tracker</a>
                <a href="self-help.html" class="nav-link"><i class="fas fa-hands-helping"></i> Self-Help</a>
                <a href="dashboard.html" class="nav-link"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
            `;
        }
        
        // Check if user has completed profile (only on specific pages)
        checkUserProfile(user);
        
    } else {
        // User is logged out - Show login/signup buttons
        if (authButtons) {
            authButtons.innerHTML = `
                <button class="btn btn-login" onclick="window.location.href='singup.html'">
                    <i class="fas fa-sign-in-alt"></i> Login
                </button>
                <button class="btn btn-signup" onclick="window.location.href='singup.html'">
                    <i class="fas fa-user-plus"></i> Sign Up
                </button>
            `;
        }
        
        // Hide user-specific features
        if (userFeatures) {
            userFeatures.style.display = 'none';
        }
        
        // Redirect to login if on protected pages (except profile page)
        if (window.location.pathname.includes('dashboard') || 
            window.location.pathname.includes('mood-tracker') ||
            window.location.pathname.includes('self-help')) {
            window.location.href = 'singup.html';
        }
    }
}

// Check if user has completed profile - ONLY redirect from login/signup pages
async function checkUserProfile(user) {
    try {
        const docRef = doc(db, 'profiles', user.uid);
        const docSnap = await getDoc(docRef);
        
        // Only redirect if user doesn't have profile AND is on login/signup page
        if (!docSnap.exists()) {
            if (window.location.pathname.includes('singup.html') || 
                window.location.pathname.includes('index.html')) {
                console.log("User doesn't have profile, redirecting to profile.html");
                window.location.href = 'profile.html';
            }
            // If user is already on profile.html, do nothing - let them create profile
        } else {
            console.log("User has profile:", docSnap.data());
            // If user has profile and is on login page, redirect to home
            if (window.location.pathname.includes('singup.html')) {
                window.location.href = 'index.html';
            }
        }
    } catch (error) {
        console.error("Error checking profile:", error);
    }
}

// Show login success notification
function showLoginNotification() {
    // Check if we've already shown the notification in this session
    if (!sessionStorage.getItem('loginNotificationShown')) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'login-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-check-circle"></i>
                <span>Login successful! Welcome back.</span>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
        `;
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
        
        // Mark as shown in session storage
        sessionStorage.setItem('loginNotificationShown', 'true');
    }
}

// Global logout function
window.logout = function() {
    signOut(auth).then(() => {
        // Clear the login notification flag
        sessionStorage.removeItem('loginNotificationShown');
        
        // Show logout notification
        showLogoutNotification();
        
        // Update navigation immediately
        updateNavigation(null);
        
        // If on a protected page, redirect to home
        if (window.location.pathname.includes('dashboard') || 
            window.location.pathname.includes('mood-tracker') ||
            window.location.pathname.includes('self-help') ||
            window.location.pathname.includes('profile')) {
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    }).catch((error) => {
        console.error('Logout error:', error);
    });
};

// Show logout notification
function showLogoutNotification() {
    const notification = document.createElement('div');
    notification.className = 'logout-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-info-circle"></i>
            <span>Logged out successfully.</span>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--info);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Initialize auth state listener
document.addEventListener('DOMContentLoaded', function() {
    onAuthStateChanged(auth, (user) => {
        console.log("Auth state changed:", user ? "User logged in" : "User logged out");
        updateNavigation(user);
        
        if (user) {
            showLoginNotification();
        }
    });
});

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .notification-content i {
        font-size: 1.2em;
    }
    
    .user-features {
        display: none;
        align-items: center;
        gap: 1rem;
        margin-left: auto;
    }
    
    .user-features .nav-link {
        color: var(--text);
        text-decoration: none;
        padding: 0.5rem 1rem;
        border-radius: 5px;
        transition: all 0.3s ease;
        font-weight: 500;
    }
    
    .user-features .nav-link:hover {
        background: var(--primary-light);
        color: var(--primary);
    }
    
    .user-welcome {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--primary);
        font-weight: 600;
        margin-right: 1rem;
    }
`;
document.head.appendChild(style);