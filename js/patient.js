// patient.js - Therapist's patient management page
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
console.log("🚀 Initializing Firebase for patients page...");
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Global variables
let currentUser = null;
let currentUserProfile = null;
let patientSessions = [];
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
    console.log("🎯 Starting session with patient:", sessionId);
    // Redirect to start session page
    window.location.href = `startsession.html?sessionId=${sessionId}`;
};

window.completeSession = async function(sessionId) {
    const session = patientSessions.find(s => s.sessionId === sessionId);
    if (!session) return;

    if (!confirm(`Mark session with ${session.patientName} as completed?`)) {
        return;
    }

    try {
        const sessionRef = doc(db, 'sessions', sessionId);
        await updateDoc(sessionRef, {
            status: 'completed',
            updatedAt: new Date(),
            completedAt: new Date()
        });

        showNotification('Session marked as completed.', 'success');
        await loadPatientSessions(); // Reload sessions
    } catch (error) {
        console.error('Error completing session:', error);
        showNotification('Error completing session: ' + error.message, 'error');
    }
};

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    console.log("📄 DOM loaded, initializing patients page...");
    initializePatientsPage();
});

function initializePatientsPage() {
    console.log("🔄 Initializing patients page...");
    
    // Check authentication
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log("✅ User authenticated:", user.email);
            currentUser = user;
            
            // Load therapist profile first
            await loadTherapistProfile();
            
            // Update navbar with profile data
            updateNavbar(user);
            
            // Load patient sessions
            await loadPatientSessions();
            
            // Setup event listeners
            setupEventListeners();
            
        } else {
            console.log("❌ User not authenticated");
            window.location.href = 'signup.html';
            return;
        }
    });
}

async function loadTherapistProfile() {
    try {
        const docRef = doc(db, 'profiles', currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            currentUserProfile = docSnap.data();
            console.log("✅ Therapist profile loaded:", currentUserProfile);
            
            // Check if user is actually a therapist
            if (currentUserProfile.role !== 'therapist') {
                showNotification('Access denied. This page is for therapists only.', 'error');
                window.location.href = 'dashboard.html';
                return;
            }
        } else {
            console.log("ℹ️ No therapist profile found");
            showNotification('Please complete your therapist profile.', 'warning');
        }
    } catch (error) {
        console.error('❌ Error loading therapist profile:', error);
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

async function loadPatientSessions() {
    try {
        console.log("📥 Loading patient sessions...");
        showLoadingState(true);
        
        // Query sessions where this therapist is the assigned therapist
        const sessionsQuery = query(
            collection(db, 'sessions'),
            where('therapistId', '==', currentUser.uid)
        );
        
        const querySnapshot = await getDocs(sessionsQuery);
        patientSessions = [];
        
        querySnapshot.forEach((doc) => {
            const sessionData = doc.data();
            
            console.log("📋 Patient session data:", sessionData);
            
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
            
            patientSessions.push({
                sessionId: doc.id,
                ...sessionData,
                sessionDateTime: sessionDateTime,
                createdAt: sessionData.createdAt?.toDate() || new Date(),
                updatedAt: sessionData.updatedAt?.toDate() || new Date()
            });
        });
        
        // Sort sessions by date (newest first)
        patientSessions.sort((a, b) => b.createdAt - a.createdAt);
        
        console.log(`✅ Found ${patientSessions.length} patient sessions`);
        console.log("📊 All patient sessions:", patientSessions);
        
        // Update statistics
        updatePatientStats();
        
        // Display patients
        displayPatients();
        
    } catch (error) {
        console.error('❌ Error loading patient sessions:', error);
        showNotification('Error loading patient data: ' + error.message, 'error');
    } finally {
        showLoadingState(false);
    }
}

function updatePatientStats() {
    const now = new Date();
    
    // Get unique patients
    const uniquePatients = [...new Set(patientSessions.map(session => session.patientId))].length;
    
    const upcomingSessions = patientSessions.filter(session => {
        const isConfirmed = session.status === 'confirmed' || session.status === 'approved' || !session.status;
        const hasFutureDate = session.sessionDateTime && session.sessionDateTime > now;
        return isConfirmed && hasFutureDate;
    }).length;
    
    const completedSessions = patientSessions.filter(session => 
        session.status === 'completed'
    ).length;
    
    document.getElementById('totalPatients').textContent = uniquePatients;
    document.getElementById('upcomingSessions').textContent = upcomingSessions;
    document.getElementById('completedSessions').textContent = completedSessions;
}

function displayPatients() {
    const patientsList = document.getElementById('patientsList');
    const noPatients = document.getElementById('noPatients');
    
    if (patientSessions.length === 0) {
        patientsList.classList.add('hidden');
        noPatients.classList.remove('hidden');
        return;
    }
    
    noPatients.classList.add('hidden');
    patientsList.classList.remove('hidden');
    
    // Filter sessions based on current filter
    const filteredSessions = filterSessions(patientSessions, currentFilter);
    
    if (filteredSessions.length === 0) {
        patientsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-filter"></i>
                <h3>No patients match your filter</h3>
                <p>Try changing the filter to see different patients</p>
            </div>
        `;
        return;
    }
    
    const patientsHTML = filteredSessions.map(session => generatePatientCardHTML(session)).join('');
    patientsList.innerHTML = patientsHTML;
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
        default:
            return sessions;
    }
}

function generatePatientCardHTML(session) {
    const sessionDate = session.sessionDateTime;
    const now = new Date();
    
    const isUpcoming = sessionDate && sessionDate > now && (session.status === 'confirmed' || !session.status);
    const isPending = session.status === 'pending';
    const isCompleted = session.status === 'completed';
    
    const patientInitial = session.patientName ? session.patientName.charAt(0).toUpperCase() : 'P';
    
    return `
        <div class="patient-card ${isUpcoming ? 'upcoming' : isCompleted ? 'completed' : 'pending'}">
            <div class="patient-header">
                <div class="patient-info">
                    <div class="patient-avatar">
                        ${patientInitial}
                    </div>
                    <div class="patient-details">
                        <h4>${session.patientName || 'Patient'}</h4>
                        <p><i class="fas fa-envelope"></i> ${session.patientEmail || 'No email provided'}</p>
                        <p><i class="fas fa-phone"></i> ${session.patientContact || 'No contact provided'}</p>
                    </div>
                </div>
                <div class="session-status ${isUpcoming ? 'upcoming' : isCompleted ? 'completed' : 'pending'}">
                    <i class="fas ${getStatusIcon(session.status)}"></i>
                    ${(session.status?.charAt(0).toUpperCase() + session.status?.slice(1)) || 'Upcoming'}
                </div>
            </div>
            
            <div class="patient-content">
                <div class="session-details">
                    <h4 class="section-title"><i class="fas fa-calendar-alt"></i> Session Details</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label"><i class="fas fa-calendar"></i> Date & Time</span>
                            <span class="detail-value">${sessionDate ? formatDateTime(sessionDate) : (session.sessionDate ? `${session.sessionDate} at ${session.sessionTime}` : 'Not scheduled')}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label"><i class="fas fa-video"></i> Session Type</span>
                            <span class="detail-value">${session.sessionType === 'video' ? 'Video Call' : (session.sessionType === 'online' ? 'Online' : 'In-Person')}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label"><i class="fas fa-hourglass-half"></i> Duration</span>
                            <span class="detail-value">${session.sessionDuration || 60} minutes</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label"><i class="fas fa-tag"></i> Price</span>
                            <span class="detail-value">₹${session.sessionPrice || calculateSessionPrice(session.sessionDuration || 60)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="patient-medical">
                    <h4 class="section-title"><i class="fas fa-heartbeat"></i> Patient Information</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label"><i class="fas fa-heartbeat"></i> Urgency</span>
                            <span class="detail-value">${session.urgency || 'Not specified'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label"><i class="fas fa-history"></i> Previous Therapy</span>
                            <span class="detail-value">${session.previousTherapy || 'Not specified'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label"><i class="fas fa-calendar-plus"></i> Booked On</span>
                            <span class="detail-value">${formatDate(session.createdAt)}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            ${session.concerns ? `
            <div class="concerns-box">
                <h5><i class="fas fa-comment-medical"></i> Patient Concerns</h5>
                <p>${session.concerns}</p>
            </div>
            ` : ''}
            
            <div class="patient-actions">
                <!-- Start Session Button - Show for upcoming and pending sessions -->
                ${(isUpcoming || isPending) ? `
                    <button class="btn-primary" onclick="startSession('${session.sessionId}')">
                        <i class="fas fa-play-circle"></i> Start Session
                    </button>
                ` : ''}
                
                <!-- Complete Session Button - Show for upcoming sessions -->
                ${isUpcoming ? `
                    <button class="btn-secondary" onclick="completeSession('${session.sessionId}')">
                        <i class="fas fa-check-circle"></i> Mark Complete
                    </button>
                ` : ''}
                
                ${isCompleted ? `
                    <button class="btn-secondary" onclick="showNotification('This session has been completed.', 'info')">
                        <i class="fas fa-check-double"></i> Session Completed
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
            displayPatients();
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
            return 'fa-calendar-check';
    }
}

function formatDate(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function formatDateTime(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) return 'Not scheduled';
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
    const loadingElement = document.getElementById('loadingPatients');
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