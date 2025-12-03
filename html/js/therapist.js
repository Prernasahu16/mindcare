// therapist.js - Fixed version for Base64 image support
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

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
let allTherapists = [];
let selectedTherapist = null;

// Make functions available globally
window.logout = async function() {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
};

window.openBookingModal = function(therapistId) {
    selectedTherapist = allTherapists.find(t => t.userId === therapistId);
    if (!selectedTherapist) return;

    // Populate therapist info in modal
    const therapistBookingInfo = document.getElementById('therapistBookingInfo');
    therapistBookingInfo.innerHTML = `
        <div class="therapist-booking-avatar">
            ${selectedTherapist.profilePhotoBase64 ? 
                `<img src="${selectedTherapist.profilePhotoBase64}" alt="${selectedTherapist.name}">` : 
                selectedTherapist.profilePhotoUrl ?
                `<img src="${selectedTherapist.profilePhotoUrl}" alt="${selectedTherapist.name}">` :
                `<div class="avatar-placeholder">
                    <i class="fas fa-user-md"></i>
                 </div>`
            }
        </div>
        <div>
            <h4 style="margin: 0 0 5px 0;">${selectedTherapist.name}</h4>
            <p style="margin: 0; color: #64748b;">
                ${selectedTherapist.therapistDetails.specialization.slice(0, 2).join(', ')}
                ${selectedTherapist.therapistDetails.specialization.length > 2 ? '...' : ''}
            </p>
        </div>
    `;

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('sessionDate').min = today;

    // Show modal
    document.getElementById('bookingModal').classList.remove('hidden');
};

window.closeBookingModal = function() {
    document.getElementById('bookingModal').classList.add('hidden');
    selectedTherapist = null;
};

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    console.log("📄 DOM loaded, initializing therapists page...");
    initializeTherapistsPage();
});

function initializeTherapistsPage() {
    console.log("🔄 Initializing therapists page...");
    
    // Check authentication
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log("✅ User authenticated:", user.email);
            currentUser = user;
            
            // Update navbar
            updateNavbar(user);
            
            // Load user profile to get patient details for matching
            await loadUserProfile();
            
            // Load therapists
            await loadTherapists();
            
            // Setup event listeners
            setupEventListeners();
            
        } else {
            console.log("❌ User not authenticated");
            window.location.href = 'signup.html';
            return;
        }
    });
}

function updateNavbar(user) {
    const authButtons = document.querySelector('.auth-buttons');
    if (authButtons) {
        // Get user's first name for display
        const userName = currentUserProfile?.name ? currentUserProfile.name.split(' ')[0] : 'User';
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

async function loadUserProfile() {
    try {
        const docRef = doc(db, 'profiles', currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            currentUserProfile = docSnap.data();
            console.log("✅ User profile loaded:", currentUserProfile);
            
            // Update navbar again with the loaded profile data
            updateNavbar(currentUser);
        } else {
            console.log("ℹ️ No user profile found");
        }
    } catch (error) {
        console.error('❌ Error loading user profile:', error);
    }
}

async function loadTherapists() {
    try {
        console.log("📥 Loading therapists...");
        const querySnapshot = await getDocs(collection(db, 'profiles'));
        const therapists = [];
        
        querySnapshot.forEach((doc) => {
            const profile = doc.data();
            // Check if profile is a therapist and has therapistDetails
            if (profile.role === 'therapist' && profile.therapistDetails) {
                // Include both approved and pending therapists for now
                // You can filter by status later: profile.therapistDetails.status === 'approved'
                therapists.push({
                    ...profile,
                    userId: doc.id
                });
            }
        });
        
        allTherapists = therapists;
        console.log(`✅ Found ${therapists.length} therapists`);
        
        // Create specialization filters
        createSpecializationFilters(therapists);
        
        // Display therapists
        displayTherapists(therapists);
        
    } catch (error) {
        console.error('❌ Error loading therapists:', error);
        showNotification('Error loading therapists: ' + error.message, 'error');
    }
}

function createSpecializationFilters(therapists) {
    const filtersContainer = document.getElementById('specializationFilters');
    const specializations = new Set();
    
    // Collect all unique specializations
    therapists.forEach(therapist => {
        if (therapist.therapistDetails && therapist.therapistDetails.specialization) {
            therapist.therapistDetails.specialization.forEach(spec => {
                specializations.add(spec);
            });
        }
    });
    
    // Create filter tags
    const filtersHTML = Array.from(specializations).map(spec => 
        `<div class="filter-tag" data-specialization="${spec}">${spec}</div>`
    ).join('');
    
    filtersContainer.innerHTML = filtersHTML + `<div class="filter-tag active" data-specialization="all">All Therapists</div>`;
    
    // Add click event listeners to filters
    filtersContainer.querySelectorAll('.filter-tag').forEach(tag => {
        tag.addEventListener('click', function() {
            // Update active state
            filtersContainer.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Filter therapists
            const specialization = this.getAttribute('data-specialization');
            filterTherapists(specialization);
        });
    });
}

function filterTherapists(specialization) {
    let filteredTherapists = allTherapists;
    
    if (specialization !== 'all') {
        filteredTherapists = allTherapists.filter(therapist => 
            therapist.therapistDetails && 
            therapist.therapistDetails.specialization && 
            therapist.therapistDetails.specialization.includes(specialization)
        );
    }
    
    displayTherapists(filteredTherapists);
}

function displayTherapists(therapists) {
    const therapistsGrid = document.getElementById('therapistsGrid');
    const noTherapists = document.getElementById('noTherapists');
    
    if (therapists.length === 0) {
        therapistsGrid.classList.add('hidden');
        noTherapists.classList.remove('hidden');
        return;
    }
    
    noTherapists.classList.add('hidden');
    therapistsGrid.classList.remove('hidden');
    
    // Sort therapists by match score (if user is a patient)
    const sortedTherapists = sortTherapistsByMatch(therapists);
    
    const therapistsHTML = sortedTherapists.map(therapist => {
        const matchScore = calculateMatchScore(therapist);
        const matchPercentage = Math.round(matchScore * 100);
        
        return `
            <div class="therapist-card">
                <div class="therapist-header">
                    <div class="verified-badge">
                        <i class="fas fa-check-circle"></i> 
                        ${therapist.therapistDetails.status === 'approved' ? 'Verified' : 'Under Review'}
                    </div>
                    <div class="therapist-avatar">
                        ${therapist.profilePhotoBase64 ? 
                            `<img src="${therapist.profilePhotoBase64}" alt="${therapist.name}">` : 
                            therapist.profilePhotoUrl ?
                            `<img src="${therapist.profilePhotoUrl}" alt="${therapist.name}">` :
                            `<div class="avatar-placeholder">
                                <i class="fas fa-user-md"></i>
                             </div>`
                        }
                    </div>
                    <div class="therapist-info">
                        <h3>${therapist.name}</h3>
                        <p class="therapist-specialty">
                            <i class="fas fa-graduation-cap"></i>
                            ${therapist.therapistDetails.qualification ? 
                                therapist.therapistDetails.qualification.split('\n')[0].substring(0, 50) + 
                                (therapist.therapistDetails.qualification.split('\n')[0].length > 50 ? '...' : '') : 
                                'Certified Therapist'}
                        </p>
                    </div>
                </div>
                
                <div class="therapist-body">
                    ${matchScore > 0.3 && currentUserProfile?.role === 'patient' ? `
                    <div class="match-indicator">
                        <i class="fas fa-heart"></i>
                        ${matchPercentage}% Match with Your Needs
                    </div>
                    ` : ''}
                    
                    <div class="therapist-stats">
                        <div class="stat-item">
                            <div class="stat-value">${therapist.therapistDetails.experience || '0'}+</div>
                            <div class="stat-label">Years Experience</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${therapist.therapistDetails.specialization ? therapist.therapistDetails.specialization.length : '0'}</div>
                            <div class="stat-label">Specializations</div>
                        </div>
                    </div>
                    
                    ${therapist.therapistDetails.specialization ? `
                    <div class="specialization-tags">
                        ${therapist.therapistDetails.specialization.slice(0, 4).map(spec => 
                            `<span class="specialization-tag">${spec}</span>`
                        ).join('')}
                        ${therapist.therapistDetails.specialization.length > 4 ? 
                            `<span class="specialization-tag">+${therapist.therapistDetails.specialization.length - 4} more</span>` : 
                            ''}
                    </div>
                    ` : ''}
                    
                    <p class="therapist-description">
                        ${therapist.therapistDetails.qualification ? 
                         (therapist.therapistDetails.qualification.length > 150 ? 
                          therapist.therapistDetails.qualification.substring(0, 150) + '...' : 
                          therapist.therapistDetails.qualification) : 
                         'Professional therapist with expertise in mental health and wellness.'}
                    </p>
                    
                    <button class="book-session-btn" onclick="openBookingModal('${therapist.userId}')">
                        <i class="fas fa-calendar-plus"></i> Book Session
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    therapistsGrid.innerHTML = therapistsHTML;
}

function calculateMatchScore(therapist) {
    if (!currentUserProfile || currentUserProfile.role !== 'patient' || !currentUserProfile.patientDetails) {
        return 0;
    }
    
    let matchScore = 0;
    const patientProblems = currentUserProfile.patientDetails.problems || [];
    const therapistSpecializations = therapist.therapistDetails.specialization || [];
    
    // Calculate overlap between patient problems and therapist specializations
    const overlap = patientProblems.filter(problem => 
        therapistSpecializations.some(spec => 
            spec.toLowerCase().includes(problem.toLowerCase()) || 
            problem.toLowerCase().includes(spec.toLowerCase())
        )
    ).length;
    
    if (patientProblems.length > 0) {
        matchScore = overlap / patientProblems.length;
    }
    
    // Bonus for experience
    if (therapist.therapistDetails.experience > 5) {
        matchScore += 0.1;
    }
    
    // Bonus for verified status
    if (therapist.therapistDetails.status === 'approved') {
        matchScore += 0.2;
    }
    
    return Math.min(matchScore, 1);
}

function sortTherapistsByMatch(therapists) {
    if (!currentUserProfile || currentUserProfile.role !== 'patient') {
        // For non-patients or users without profile, sort by verification status and experience
        return therapists.sort((a, b) => {
            // Approved therapists first
            if (a.therapistDetails.status === 'approved' && b.therapistDetails.status !== 'approved') return -1;
            if (a.therapistDetails.status !== 'approved' && b.therapistDetails.status === 'approved') return 1;
            
            // Then by experience
            return (b.therapistDetails.experience || 0) - (a.therapistDetails.experience || 0);
        });
    }
    
    // For patients, sort by match score
    return therapists.sort((a, b) => {
        const matchA = calculateMatchScore(a);
        const matchB = calculateMatchScore(b);
        
        if (matchB !== matchA) {
            return matchB - matchA;
        }
        
        // If match score is same, sort by verification status and experience
        if (a.therapistDetails.status === 'approved' && b.therapistDetails.status !== 'approved') return -1;
        if (a.therapistDetails.status !== 'approved' && b.therapistDetails.status === 'approved') return 1;
        
        return (b.therapistDetails.experience || 0) - (a.therapistDetails.experience || 0);
    });
}

function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchTherapists');
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        filterTherapistsBySearch(searchTerm);
    });
    
    // Booking form submission
    const bookingForm = document.getElementById('bookingForm');
    bookingForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        await handleBookingSubmission();
    });
    
    // Close modal when clicking outside
    document.getElementById('bookingModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeBookingModal();
        }
    });
}

function filterTherapistsBySearch(searchTerm) {
    if (!searchTerm) {
        displayTherapists(allTherapists);
        return;
    }
    
    const filteredTherapists = allTherapists.filter(therapist => 
        therapist.name.toLowerCase().includes(searchTerm) ||
        (therapist.therapistDetails.qualification && therapist.therapistDetails.qualification.toLowerCase().includes(searchTerm)) ||
        (therapist.therapistDetails.specialization && therapist.therapistDetails.specialization.some(spec => 
            spec.toLowerCase().includes(searchTerm)
        ))
    );
    
    displayTherapists(filteredTherapists);
}

async function handleBookingSubmission() {
    if (!selectedTherapist) return;
    
    const submitBtn = bookingForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Booking...';
        submitBtn.disabled = true;
        
        // Collect booking data
        const bookingData = {
            patientId: currentUser.uid,
            patientName: currentUserProfile?.name || currentUser.email,
            patientEmail: currentUser.email,
            therapistId: selectedTherapist.userId,
            therapistName: selectedTherapist.name,
            therapistEmail: selectedTherapist.email,
            sessionDate: document.getElementById('sessionDate').value,
            sessionTime: document.getElementById('sessionTime').value,
            sessionType: document.querySelector('input[name="sessionType"]:checked').value,
            sessionDuration: parseInt(document.getElementById('sessionDuration').value),
            concerns: document.getElementById('concerns').value,
            urgency: document.getElementById('urgency').value,
            previousTherapy: document.getElementById('previousTherapy').value,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
            // Additional fields for better tracking
            patientContact: currentUserProfile?.contact || 'Not provided',
            therapistSpecialization: selectedTherapist.therapistDetails.specialization || [],
            sessionPrice: calculateSessionPrice(parseInt(document.getElementById('sessionDuration').value)),
            paymentStatus: 'pending'
        };
        
        // Validate required fields
        if (!bookingData.sessionDate || !bookingData.sessionTime || !bookingData.sessionDuration) {
            throw new Error('Please fill all required fields');
        }
        
        // Validate future date
        const selectedDate = new Date(bookingData.sessionDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            throw new Error('Please select a future date for the session');
        }
        
        // Save to Firestore
        const sessionId = `session_${currentUser.uid}_${Date.now()}`;
        const sessionRef = doc(db, 'sessions', sessionId);
        await setDoc(sessionRef, bookingData);
        
        console.log("✅ Session booked successfully:", bookingData);
        
        // Show success message
        showNotification('Session booked successfully! The therapist will contact you within 24 hours.', 'success');
        
        // Close modal and reset form
        closeBookingModal();
        bookingForm.reset();
        
    } catch (error) {
        console.error('❌ Error booking session:', error);
        showNotification('Error booking session: ' + error.message, 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function calculateSessionPrice(duration) {
    // Simple pricing model - you can customize this
    const basePrice = 500; // Base price in rupees
    const pricePerMinute = 10;
    return basePrice + (duration * pricePerMinute);
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
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