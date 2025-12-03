 // Animation on scroll
        document.addEventListener('DOMContentLoaded', function() {
            const animatedElements = document.querySelectorAll('.animate-on-scroll');
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animated');
                    }
                });
            }, { threshold: 0.1 });
            
            animatedElements.forEach(element => {
                observer.observe(element);
            });

            // Header scroll effect
            window.addEventListener('scroll', function() {
                const header = document.querySelector('header');
                if (window.scrollY > 50) {
                    header.style.padding = '0.5rem 0';
                    header.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.1)';
                } else {
                    header.style.padding = '1rem 0';
                    header.style.boxShadow = '0 2px 15px rgba(0, 0, 0, 0.1)';
                }
            });
        });    



// script.js - Global navigation and authentication handling
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// Firebase configuration
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
console.log("🚀 Initializing Firebase...");
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Global variables
let currentUser = null;
let currentUserProfile = null;

// Make functions available globally
window.logout = async function() {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Error logging out: ' + error.message, 'error');
    }
};

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    console.log("📄 DOM loaded, initializing navigation...");
    initializeNavigation();
});

function initializeNavigation() {
    console.log("🔄 Initializing navigation system...");
    
    // Check authentication state
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log("✅ User authenticated:", user.email);
            currentUser = user;
            
            // Load user profile from Firestore
            await loadUserProfile();
            
            // Update navbar for authenticated user
            updateNavbarForAuthenticatedUser();
            
        } else {
            console.log("❌ User not authenticated");
            currentUser = null;
            currentUserProfile = null;
            
            // Update navbar for guest user
            updateNavbarForGuest();
        }
    });
}

async function loadUserProfile() {
    try {
        const docRef = doc(db, 'profiles', currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            currentUserProfile = docSnap.data();
            console.log("✅ User profile loaded:", currentUserProfile);
        } else {
            console.log("ℹ️ No user profile found");
            currentUserProfile = null;
        }
    } catch (error) {
        console.error('❌ Error loading user profile:', error);
        currentUserProfile = null;
    }
}

function updateNavbarForGuest() {
    const navLinks = document.querySelector('.nav-links');
    const authButtons = document.querySelector('.auth-buttons');
    
    if (!navLinks || !authButtons) return;
    
    // Set basic navigation links for guest users
    navLinks.innerHTML = `
        <a href="index.html" class="${isCurrentPage('index.html') ? 'active' : ''}">Home</a>
        <a href="about.html" class="${isCurrentPage('about.html') ? 'active' : ''}">About</a>
        <a href="services.html" class="${isCurrentPage('services.html') ? 'active' : ''}">Services</a>
        <a href="selfhelp.html" class="${isCurrentPage('selfhelp.html') ? 'active' : ''}">Self-Help Tools</a>
        <a href="moodtraker.html" class="${isCurrentPage('moodtraker.html') ? 'active' : ''}">Mood Tracker</a>
        <a href="contact.html" class="${isCurrentPage('contact.html') ? 'active' : ''}">Contact</a>
    `;
    
    // Set signup button for guest users
    authButtons.innerHTML = `
        <a href="signup.html" class="signup-btn">
            <i class="fas fa-user-plus"></i>
            <span>Sign Up</span>
        </a>
    `;
    
    // Add styles for signup button if not already present
    addAuthButtonStyles();
}

function updateNavbarForAuthenticatedUser() {
    const navLinks = document.querySelector('.nav-links');
    const authButtons = document.querySelector('.auth-buttons');
    
    if (!navLinks || !authButtons) return;
    
    // Get user details for display
    const userName = currentUserProfile?.name ? currentUserProfile.name.split(' ')[0] : 'User';
    const userInitial = userName.charAt(0).toUpperCase();
    const userRole = currentUserProfile?.role || 'user';
    
    // Base navigation links for all authenticated users
    let navLinksHTML = `
        <a href="index.html" class="${isCurrentPage('index.html') ? 'active' : ''}">Home</a>
        <a href="about.html" class="${isCurrentPage('about.html') ? 'active' : ''}">About</a>
        <a href="services.html" class="${isCurrentPage('services.html') ? 'active' : ''}">Services</a>
        <a href="selfhelp.html" class="${isCurrentPage('selfhelp.html') ? 'active' : ''}">Self-Help Tools</a>
        <a href="moodtraker.html" class="${isCurrentPage('moodtraker.html') ? 'active' : ''}">Mood Tracker</a>
        <a href="contact.html" class="${isCurrentPage('contact.html') ? 'active' : ''}">Contact</a>
    `;
    
    // Add role-specific navigation links
    if (userRole === 'patient') {
        navLinksHTML += `
            <a href="therapist.html" class="${isCurrentPage('therapist.html') ? 'active' : ''}">Find Therapists</a>
            <a href="sessions.html" class="${isCurrentPage('sessions.html') ? 'active' : ''}">My Sessions</a>
        `;
    } else if (userRole === 'therapist') {
        navLinksHTML += `
            <a href="patient.html" class="${isCurrentPage('patient.html') ? 'active' : ''}">My Patients</a>
        `;
    } else if (userRole === 'admin') {
        navLinksHTML += `
            <a href="admin.html" class="${isCurrentPage('admin.html') ? 'active' : ''}">Admin Panel</a>
        `;
    }
    
    navLinks.innerHTML = navLinksHTML;
    
    // Set profile and logout buttons for authenticated users
    authButtons.innerHTML = `
        <div class="profile-simple">
            <a href="profile.html" class="profile-icon">
                <div class="profile-avatar">${userInitial}</div>
                <span>${userName}</span>
            </a>
            <button class="logout-btn" id="logoutBtn">
                <i class="fas fa-sign-out-alt"></i>
                <span>Logout</span>
            </button>
        </div>
    `;
    
    // Add logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                logout();
            }
        });
    }
    
    // Add styles for authenticated user buttons
    addAuthButtonStyles();
}

function isCurrentPage(pageName) {
    const currentPage = window.location.pathname.split('/').pop();
    return currentPage === pageName;
}

function addAuthButtonStyles() {
    // Check if styles already exist
    if (document.getElementById('auth-button-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'auth-button-styles';
    style.textContent = `
        /* Auth Button Styles */
        .signup-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 20px;
            background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
            color: white;
            border-radius: 25px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
        }
        
        .signup-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(74, 111, 165, 0.4);
        }
        
        /* Profile Styles */
        .profile-simple {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .profile-icon {
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--dark);
            text-decoration: none;
            font-weight: 600;
            padding: 8px 12px;
            border-radius: 20px;
            transition: all 0.3s ease;
        }
        
        .profile-icon:hover {
            background: rgba(74, 111, 165, 0.1);
        }
        
        .profile-avatar {
            width: 35px;
            height: 35px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            font-size: 14px;
            border: 2px solid #fff;
            box-shadow: 0 2px 8px rgba(74, 111, 165, 0.3);
        }
        
        .logout-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            background: transparent;
            border: 2px solid #e74c3c;
            color: #e74c3c;
            border-radius: 20px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
            text-decoration: none;
        }
        
        .logout-btn:hover {
            background: #e74c3c;
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
        }
        
        /* Mobile responsive */
        @media (max-width: 768px) {
            .profile-simple {
                gap: 10px;
            }
            
            .profile-icon span {
                display: none;
            }
            
            .logout-btn span {
                display: none;
            }
            
            .signup-btn span {
                display: none;
            }
        }
        
        /* Navbar active state */
        .nav-links a.active {
            color: var(--primary);
            font-weight: 600;
            position: relative;
        }
        
        .nav-links a.active::after {
            content: '';
            position: absolute;
            bottom: -5px;
            left: 0;
            width: 100%;
            height: 2px;
            background: var(--primary);
            border-radius: 2px;
        }
    `;
    
    document.head.appendChild(style);
}

function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.global-notification');
    existingNotifications.forEach(notification => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    });
    
    const notification = document.createElement('div');
    notification.className = `global-notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#5cb85c' : '#d9534f'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
    
    // Add notification styles if not already present
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .notification-content i {
                font-size: 1.2em;
            }
        `;
        document.head.appendChild(style);
    }
}

// Export functions for use in other modules
window.auth = auth;
window.db = db;
window.currentUser = () => currentUser;
window.currentUserProfile = () => currentUserProfile;
window.showNotification = showNotification;

console.log("✅ Navigation system initialized successfully!");        