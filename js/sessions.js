// sessions.js - Sessions management page (Debug Version)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, orderBy, updateDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

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
console.log("🚀 Initializing Firebase for sessions...");
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Global variables
let currentUser = null;
let currentUserProfile = null;
let userSessions = [];
let currentFilter = 'all';

// Make functions available globally
window.logout = async function() {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
};

window.startSession = function(sessionId) {
    console.log("🎯 Starting session:", sessionId);
    // Redirect to start session page
    window.location.href = `startsession.html?sessionId=${sessionId}`;
};

window.cancelSession = async function(sessionId) {
    const session = userSessions.find(s => s.sessionId === sessionId);
    if (!session) return;

    if (!confirm(`Are you sure you want to cancel your session with ${session.therapistName}? This action cannot be undone.`)) {
        return;
    }

    try {
        const sessionRef = doc(db, 'sessions', sessionId);
        await updateDoc(sessionRef, {
            status: 'cancelled',
            updatedAt: new Date(),
            cancelledAt: new Date(),
            cancelledBy: currentUser.uid,
            cancellationReason: 'Cancelled by patient'
        });

        showNotification('Session cancelled successfully.', 'success');
        await loadUserSessions(); // Reload sessions
    } catch (error) {
        console.error('Error cancelling session:', error);
        showNotification('Error cancelling session: ' + error.message, 'error');
    }
};

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    console.log("📄 DOM loaded, initializing sessions page...");
    initializeSessionsPage();
});

function initializeSessionsPage() {
    console.log("🔄 Initializing sessions page...");
    
    // Check authentication
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log("✅ User authenticated:", user.email);
            currentUser = user;
            
            // Load user profile first
            await loadUserProfile();
            
            // Update navbar with profile data
            updateNavbar(user);
            
            // Load user sessions
            await loadUserSessions();
            
            // Setup event listeners
            setupEventListeners();
            
        } else {
            console.log("❌ User not authenticated");
            window.location.href = 'signup.html';
            return;
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
        }
    } catch (error) {
        console.error('❌ Error loading user profile:', error);
    }
}

function updateNavbar(user) {
    const authButtons = document.querySelector('.auth-buttons');
    if (authButtons) {
        // Get user's first name for display
        const userName = currentUserProfile?.name ? currentUserProfile.name.split(' ')[0] : user.email.split('@')[0];
        const userInitial = userName.charAt(0).toUpperCase();
        
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
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                logout();
            }
        });
    }
}

async function loadUserSessions() {
    try {
        console.log("📥 Loading user sessions...");
        showLoadingState(true);
        
        const sessionsQuery = query(
            collection(db, 'sessions'),
            where('patientId', '==', currentUser.uid)
        );
        
        const querySnapshot = await getDocs(sessionsQuery);
        userSessions = [];
        
        querySnapshot.forEach((doc) => {
            const sessionData = doc.data();
            
            console.log("📋 RAW Session data:", {
                id: doc.id,
                data: sessionData,
                status: sessionData.status,
                therapistName: sessionData.therapistName
            });
            
            // Create session date object
            let sessionDateTime = null;
            if (sessionData.sessionDate && sessionData.sessionTime) {
                try {
                    sessionDateTime = new Date(sessionData.sessionDate + 'T' + sessionData.sessionTime);
                    if (isNaN(sessionDateTime.getTime())) {
                        sessionDateTime = new Date(sessionData.sessionDate);
                    }
                } catch (e) {
                    console.error('Error parsing session date:', e);
                }
            }
            
            userSessions.push({
                sessionId: doc.id,
                ...sessionData,
                sessionDateTime: sessionDateTime,
                createdAt: sessionData.createdAt?.toDate() || new Date(),
                updatedAt: sessionData.updatedAt?.toDate() || new Date()
            });
        });
        
        // Sort sessions manually by creation date (newest first)
        userSessions.sort((a, b) => b.createdAt - a.createdAt);
        
        console.log(`✅ Found ${userSessions.length} sessions`);
        console.log("📊 ALL SESSIONS:", userSessions);
        
        // Log session statuses for debugging
        userSessions.forEach(session => {
            console.log(`🔍 Session ${session.sessionId}:`, {
                status: session.status,
                therapistName: session.therapistName,
                sessionDate: session.sessionDate,
                sessionTime: session.sessionTime
            });
        });
        
        // Update statistics
        updateSessionStats();
        
        // Display sessions
        displaySessions();
        
    } catch (error) {
        console.error('❌ Error loading sessions:', error);
        showNotification('Error loading sessions: ' + error.message, 'error');
    } finally {
        showLoadingState(false);
    }
}

function updateSessionStats() {
    const now = new Date();
    
    const upcoming = userSessions.filter(session => {
        const isConfirmed = session.status === 'confirmed' || session.status === 'approved' || !session.status;
        const hasFutureDate = session.sessionDateTime && session.sessionDateTime > now;
        return isConfirmed && hasFutureDate;
    }).length;
    
    const completed = userSessions.filter(session => 
        session.status === 'completed'
    ).length;
    
    const total = userSessions.length;
    
    document.getElementById('upcomingCount').textContent = upcoming;
    document.getElementById('completedCount').textContent = completed;
    document.getElementById('totalCount').textContent = total;
}

function displaySessions() {
    const sessionsList = document.getElementById('sessionsList');
    const noSessions = document.getElementById('noSessions');
    
    if (userSessions.length === 0) {
        sessionsList.classList.add('hidden');
        noSessions.classList.remove('hidden');
        return;
    }
    
    noSessions.classList.add('hidden');
    sessionsList.classList.remove('hidden');
    
    // Filter sessions based on current filter
    const filteredSessions = filterSessions(userSessions, currentFilter);
    
    if (filteredSessions.length === 0) {
        sessionsList.innerHTML = `
            <div class="empty-filter-state">
                <i class="fas fa-filter"></i>
                <h3>No sessions match your filter</h3>
                <p>Try changing the filter to see different sessions</p>
            </div>
        `;
        return;
    }
    
    const sessionsHTML = filteredSessions.map(session => generateSessionCardHTML(session)).join('');
    sessionsList.innerHTML = sessionsHTML;
}

function filterSessions(sessions, filter) {
    const now = new Date();
    
    switch (filter) {
        case 'upcoming':
            return sessions.filter(session => {
                const isConfirmed = session.status === 'confirmed' || session.status === 'approved' || !session.status;
                const hasFutureDate = session.sessionDateTime && session.sessionDateTime > now;
                return isConfirmed && hasFutureDate;
            });
        case 'completed':
            return sessions.filter(session => session.status === 'completed');
        case 'pending':
            return sessions.filter(session => session.status === 'pending');
        case 'cancelled':
            return sessions.filter(session => session.status === 'cancelled');
        default:
            return sessions;
    }
}

function generateSessionCardHTML(session) {
    const sessionDate = session.sessionDateTime;
    const now = new Date();
    
    // EXTREMELY FLEXIBLE status checking - show Start Session for ALL sessions
    const isConfirmed = session.status === 'confirmed' || session.status === 'approved' || !session.status || session.status === 'pending';
    const isUpcoming = sessionDate && sessionDate > now;
    const isPending = session.status === 'pending';
    const isCompleted = session.status === 'completed';
    const isCancelled = session.status === 'cancelled';
    
    console.log(`🎯 RENDERING Session ${session.sessionId}:`, {
        status: session.status,
        isConfirmed: isConfirmed,
        isUpcoming: isUpcoming,
        isPending: isPending,
        sessionDate: sessionDate
    });
    
    return `
        <div class="session-card ${session.status || 'pending'}">
            <div class="session-header">
                <div class="session-therapist">
                    <div class="therapist-avatar">
                        <i class="fas fa-user-md"></i>
                    </div>
                    <div class="therapist-info">
                        <h4>${session.therapistName || 'Therapist'}</h4>
                        <p>${session.therapistSpecialization?.slice(0, 2).join(', ') || 'Mental Health Professional'}</p>
                    </div>
                </div>
                <div class="session-status ${session.status || 'pending'}">
                    <i class="fas ${getStatusIcon(session.status)}"></i>
                    ${(session.status?.charAt(0).toUpperCase() + session.status?.slice(1)) || 'Pending'}
                </div>
            </div>
            
            <div class="session-details">
                <div class="detail-row">
                    <div class="detail-item">
                        <i class="fas fa-calendar"></i>
                        <span>${sessionDate ? formatDate(sessionDate) : (session.sessionDate || 'Not scheduled')}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-clock"></i>
                        <span>${sessionDate ? formatTime(sessionDate) : (session.sessionTime || 'No time set')}</span>
                    </div>
                </div>
                <div class="detail-row">
                    <div class="detail-item">
                        <i class="fas fa-video"></i>
                        <span>${session.sessionType === 'video' ? 'Video Call' : (session.sessionType === 'online' ? 'Online' : 'In-Person')}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-hourglass-half"></i>
                        <span>${session.sessionDuration || 60} minutes</span>
                    </div>
                </div>
                ${session.concerns ? `
                <div class="concerns-preview">
                    <i class="fas fa-comment-medical"></i>
                    <span>${session.concerns.length > 100 ? session.concerns.substring(0, 100) + '...' : session.concerns}</span>
                </div>
                ` : ''}
            </div>
            
            <div class="session-actions">
                <!-- START SESSION BUTTON - SHOW FOR ALL SESSIONS -->
                <button class="btn-primary" onclick="startSession('${session.sessionId}')">
                    <i class="fas fa-play-circle"></i> Start Session
                </button>
                
                <!-- Cancel Session Button - Show for upcoming and pending sessions -->
                ${(isUpcoming || isPending) ? `
                    <button class="btn-danger" onclick="cancelSession('${session.sessionId}')">
                        <i class="fas fa-times-circle"></i> Cancel Session
                    </button>
                ` : ''}
                
                ${isCompleted ? `
                    <button class="btn-secondary" onclick="showNotification('This session has been completed.', 'info')">
                        <i class="fas fa-check-circle"></i> Completed
                    </button>
                ` : ''}
                
                ${isCancelled ? `
                    <button class="btn-secondary" onclick="showNotification('This session was cancelled.', 'info')">
                        <i class="fas fa-ban"></i> Cancelled
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

function setupEventListeners() {
    // Filter tabs
    document.querySelectorAll('.filter-tabs .tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.filter-tabs .tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.getAttribute('data-filter');
            displaySessions();
        });
    });
}

function getStatusIcon(status) {
    switch (status) {
        case 'confirmed':
        case 'approved':
            return 'fa-check-circle';
        case 'pending': 
            return 'fa-clock';
        case 'completed': 
            return 'fa-check-double';
        case 'cancelled': 
            return 'fa-times-circle';
        default: 
            return 'fa-question-circle';
    }
}

function formatDate(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) return 'Not scheduled';
    return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function formatTime(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) return 'No time set';
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function formatDateTime(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function calculateSessionPrice(duration) {
    const basePrice = 500;
    const pricePerMinute = 10;
    return basePrice + (duration * pricePerMinute);
}

function showLoadingState(show) {
    const loadingElement = document.getElementById('loadingSessions');
    if (show) {
        loadingElement.classList.remove('hidden');
    } else {
        loadingElement.classList.add('hidden');
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#5cb85c' : type === 'error' ? '#d9534f' : '#f0ad4e'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
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
}

// Add notification styles
const style = document.createElement('style');
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