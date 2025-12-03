// profile.js - Store everything in Firestore with Base64
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDpasFWwylXGImZ9PefqCY5uec8owlK7Yw",
    authDomain: "mindcare-be32e.firebaseapp.com",
    projectId: "mindcare-be32e",
    storageBucket: "mindcare-be32e.firebasestorage.app", // Keep this, it's for Auth
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
let currentProfile = null;
let currentStream = null;
let capturedPhotoBlob = null;
let profilePhotoFile = null;
let govIdFile = null;
let licenseCertificateFile = null;
let degreeCertificateFiles = [];

// Make functions available globally
window.selectRole = function(role) {
    console.log("🎯 Selected role:", role);
    
    document.querySelectorAll('.role-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.querySelector(`[data-role="${role}"]`).classList.add('selected');
    
    const roleInput = document.getElementById('role');
    if (roleInput) roleInput.value = role;
    
    const patientSection = document.getElementById('patientSection');
    const therapistSection = document.getElementById('therapistSection');
    
    if (role === 'patient') {
        if (patientSection) patientSection.classList.remove('hidden');
        if (therapistSection) therapistSection.classList.add('hidden');
    } else if (role === 'therapist') {
        if (therapistSection) therapistSection.classList.remove('hidden');
        if (patientSection) patientSection.classList.add('hidden');
    }
};

window.logout = async function() {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
};

// File to Base64 conversion
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Image compression function
async function compressImage(file, maxSizeKB = 500) {
    return new Promise((resolve) => {
        if (file.size <= maxSizeKB * 1024) {
            resolve(file);
            return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            let width = img.width;
            let height = img.height;
            const ratio = width / height;
            
            const maxDimension = 800;
            if (width > height && width > maxDimension) {
                width = maxDimension;
                height = width / ratio;
            } else if (height > maxDimension) {
                height = maxDimension;
                width = height * ratio;
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob((blob) => {
                resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            }, 'image/jpeg', 0.7);
        };
        
        img.src = URL.createObjectURL(file);
    });
}

// Camera functionality
window.openCamera = async function() {
    try {
        const cameraModal = document.createElement('div');
        cameraModal.className = 'camera-modal';
        cameraModal.innerHTML = `
            <div class="camera-modal-content">
                <div class="camera-header">
                    <h3><i class="fas fa-camera"></i> Take Profile Picture</h3>
                    <button class="close-camera" onclick="closeCamera()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="camera-preview">
                    <video id="cameraVideo" autoplay playsinline></video>
                    <canvas id="cameraCanvas" style="display: none;"></canvas>
                    <div id="capturedPhoto" class="captured-photo" style="display: none;"></div>
                </div>
                <div class="camera-controls">
                    <button class="camera-btn capture-btn" onclick="capturePhoto()">
                        <i class="fas fa-camera"></i> Capture Photo
                    </button>
                    <button class="camera-btn switch-camera" onclick="switchCamera()">
                        <i class="fas fa-sync-alt"></i> Switch Camera
                    </button>
                    <button class="camera-btn retake-btn" onclick="retakePhoto()" style="display: none;">
                        <i class="fas fa-redo"></i> Retake
                    </button>
                    <button class="camera-btn use-photo-btn" onclick="usePhoto()" style="display: none;">
                        <i class="fas fa-check"></i> Use This Photo
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(cameraModal);
        await initializeCamera();
        
    } catch (error) {
        console.error('Error opening camera:', error);
        showNotification('Error accessing camera: ' + error.message, 'error');
    }
};

window.closeCamera = function() {
    const cameraModal = document.querySelector('.camera-modal');
    if (cameraModal) {
        cameraModal.remove();
    }
    stopCamera();
};

async function initializeCamera() {
    try {
        const constraints = {
            video: {
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        const video = document.getElementById('cameraVideo');
        
        if (currentStream) {
            stopCamera();
        }
        
        currentStream = stream;
        video.srcObject = stream;
        
    } catch (error) {
        console.error('Error initializing camera:', error);
        if (error.name === 'NotAllowedError') {
            throw new Error('Camera access denied. Please allow camera permissions and try again.');
        } else if (error.name === 'NotFoundError') {
            throw new Error('No camera found on your device.');
        } else {
            throw new Error('Cannot access camera: ' + error.message);
        }
    }
}

function stopCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => {
            track.stop();
        });
        currentStream = null;
    }
}

window.capturePhoto = function() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    const capturedPhoto = document.getElementById('capturedPhoto');
    const captureBtn = document.querySelector('.capture-btn');
    const switchBtn = document.querySelector('.switch-camera');
    const retakeBtn = document.querySelector('.retake-btn');
    const usePhotoBtn = document.querySelector('.use-photo-btn');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    stopCamera();

    const dataURL = canvas.toDataURL('image/jpeg', 0.8);
    capturedPhoto.innerHTML = `<img src="${dataURL}" alt="Captured Photo">`;
    capturedPhoto.style.display = 'block';
    video.style.display = 'none';

    capturedPhotoBlob = dataURL;

    captureBtn.style.display = 'none';
    switchBtn.style.display = 'none';
    retakeBtn.style.display = 'inline-block';
    usePhotoBtn.style.display = 'inline-block';
}

window.retakePhoto = function() {
    const video = document.getElementById('cameraVideo');
    const capturedPhoto = document.getElementById('capturedPhoto');
    const captureBtn = document.querySelector('.capture-btn');
    const switchBtn = document.querySelector('.switch-camera');
    const retakeBtn = document.querySelector('.retake-btn');
    const usePhotoBtn = document.querySelector('.use-photo-btn');

    capturedPhoto.style.display = 'none';
    video.style.display = 'block';
    captureBtn.style.display = 'inline-block';
    switchBtn.style.display = 'inline-block';
    retakeBtn.style.display = 'none';
    usePhotoBtn.style.display = 'none';

    capturedPhotoBlob = null;
    initializeCamera();
}

window.switchCamera = function() {
    stopCamera();
    initializeCamera();
}

window.usePhoto = async function() {
    if (!capturedPhotoBlob) {
        showNotification('No photo captured', 'error');
        return;
    }

    try {
        showNotification('Processing photo...', 'info');
        
        // Convert Base64 to Blob
        const response = await fetch(capturedPhotoBlob);
        const blob = await response.blob();
        const file = new File([blob], `profile-photo-${Date.now()}.jpg`, {
            type: 'image/jpeg'
        });

        // Update profile photo preview
        const previewElement = document.getElementById('profilePhotoPreview');
        if (previewElement) {
            previewElement.innerHTML = `<img src="${capturedPhotoBlob}" alt="Profile Preview" style="max-width: 200px; max-height: 200px; border-radius: 8px;">`;
        }

        // Update file input
        const fileNameElement = document.getElementById('profilePhotoName');
        if (fileNameElement) {
            fileNameElement.textContent = 'Photo from camera';
        }

        // Store the file for form submission
        profilePhotoFile = file;

        showNotification('Profile photo captured successfully!', 'success');
        closeCamera();

    } catch (error) {
        console.error('Error using photo:', error);
        showNotification('Error processing photo: ' + error.message, 'error');
    }
}

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    console.log("📄 DOM loaded, initializing profile page...");
    initializeProfilePage();
});

function initializeProfilePage() {
    console.log("🔄 Initializing profile page...");
    
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log("✅ User authenticated:", user.email);
            currentUser = user;
            
            updateNavbar(user);
            
            const emailInput = document.getElementById('email');
            if (emailInput && user.email) {
                emailInput.value = user.email;
            }
            
            await checkExistingProfile();
            setupFormSubmission();
            setupCameraButton();
            setupTherapistFileInputs();
            
        } else {
            console.log("❌ User not authenticated");
            window.location.href = 'signup.html';
            return;
        }
    });
}

function setupCameraButton() {
    const cameraBtn = document.getElementById('cameraBtn');
    if (cameraBtn) {
        cameraBtn.addEventListener('click', function() {
            window.openCamera();
        });
    }
}

function setupTherapistFileInputs() {
    // Profile Photo
    const profilePhotoInput = document.getElementById('profilePhoto');
    if (profilePhotoInput) {
        profilePhotoInput.addEventListener('change', async function(e) {
            profilePhotoFile = e.target.files[0];
            const fileName = profilePhotoFile ? profilePhotoFile.name : 'No file chosen';
            const fileNameElement = document.getElementById('profilePhotoName');
            if (fileNameElement) fileNameElement.textContent = fileName;
            
            if (profilePhotoFile && profilePhotoFile.type.startsWith('image/')) {
                try {
                    const compressedFile = await compressImage(profilePhotoFile);
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const previewElement = document.getElementById('profilePhotoPreview');
                        if (previewElement) {
                            previewElement.innerHTML = `<img src="${e.target.result}" alt="Profile Preview" style="max-width: 200px; max-height: 200px; border-radius: 8px;">`;
                        }
                    };
                    reader.readAsDataURL(compressedFile);
                    
                    console.log("📸 Profile photo file selected:", fileName);
                } catch (error) {
                    console.error("Error processing profile photo:", error);
                }
            }
        });
    }

    // Government ID
    const govIdInput = document.getElementById('govId');
    if (govIdInput) {
        govIdInput.addEventListener('change', async function(e) {
            govIdFile = e.target.files[0];
            const fileName = govIdFile ? govIdFile.name : 'No file chosen';
            const fileNameElement = document.getElementById('govIdName');
            if (fileNameElement) fileNameElement.textContent = fileName;
            console.log("📄 Government ID file selected:", fileName);
        });
    }

    // License Certificate
    const licenseCertInput = document.getElementById('licenseCertificate');
    if (licenseCertInput) {
        licenseCertInput.addEventListener('change', async function(e) {
            licenseCertificateFile = e.target.files[0];
            const fileName = licenseCertificateFile ? licenseCertificateFile.name : 'No file chosen';
            const fileNameElement = document.getElementById('licenseCertificateName');
            if (fileNameElement) fileNameElement.textContent = fileName;
            console.log("📄 License Certificate file selected:", fileName);
        });
    }

    // Degree Certificates
    const degreeCertInput = document.getElementById('degreeCertificates');
    if (degreeCertInput) {
        degreeCertInput.addEventListener('change', function(e) {
            degreeCertificateFiles = Array.from(e.target.files);
            const fileNames = degreeCertificateFiles.map(file => file.name).join(', ');
            const fileNameElement = document.getElementById('degreeCertificatesName');
            if (fileNameElement) fileNameElement.textContent = fileNames || 'No files chosen';
            console.log("📄 Degree Certificate files selected:", degreeCertificateFiles.length);
        });
    }
}

function updateNavbar(user) {
    const authButtons = document.querySelector('.auth-buttons');
    if (authButtons) {
        authButtons.innerHTML = `
            <div class="profile-simple">
                <a href="profile.html" class="profile-icon">
                    <div class="profile-avatar">${user.email ? user.email.charAt(0).toUpperCase() : 'U'}</div>
                    <span>${user.email ? user.email.split('@')[0] : 'User'}</span>
                </a>
                <button class="logout-btn" id="logoutBtn">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                </button>
            </div>
        `;

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                if (confirm('Are you sure you want to logout?')) {
                    logout();
                }
            });
        }
    }
}

async function checkExistingProfile() {
    try {
        console.log("📥 Checking for existing profile...");
        const docRef = doc(db, 'profiles', currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            console.log("✅ Existing profile found");
            currentProfile = docSnap.data();
            
            if (isProfileComplete(currentProfile)) {
                showProfileView(currentProfile);
                updatePageTitle(currentProfile.name);
            } else {
                populateForm(currentProfile);
                showForm();
            }
        } else {
            console.log("ℹ️ No existing profile found");
            showForm();
        }
    } catch (error) {
        console.error('❌ Error checking profile:', error);
        showForm();
    }
}

function updatePageTitle(userName) {
    document.title = `${userName} - MindCare Profile`;
    const headerTitle = document.querySelector('.profile-header h1');
    if (headerTitle) {
        headerTitle.innerHTML = `<i class="fas fa-user-circle"></i> Welcome, ${userName}`;
    }
}

function isProfileComplete(profile) {
    return profile && profile.name && profile.email && profile.contact && profile.gender && profile.age && profile.role;
}

function showForm() {
    const loadingElement = document.getElementById('loading');
    const profileForm = document.getElementById('profileForm');
    const profileView = document.getElementById('profileView');
    
    if (loadingElement) loadingElement.classList.add('hidden');
    if (profileForm) {
        profileForm.classList.remove('hidden');
        const formTitle = profileForm.querySelector('h1');
        if (formTitle) {
            formTitle.textContent = 'Complete Your Profile';
        }
    }
    if (profileView) profileView.classList.add('hidden');
}

function showProfileView(profile) {
    const loadingElement = document.getElementById('loading');
    const profileForm = document.getElementById('profileForm');
    const profileView = document.getElementById('profileView');
    
    if (loadingElement) loadingElement.classList.add('hidden');
    if (profileForm) profileForm.classList.add('hidden');
    if (profileView) profileView.classList.remove('hidden');
    
    console.log("👤 Profile view is now visible");
    renderProfile(profile);
}

function setupFormSubmission() {
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        console.log("📝 Setting up form submission...");
        
        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log("🔄 Form submitted!");
            await handleFormSubmission();
        });
    }
}

async function handleFormSubmission() {
    console.log("🔄 Starting form submission...");
    
    const submitBtn = document.getElementById('submitBtn');
    if (!submitBtn) {
        console.error("❌ Submit button not found!");
        return;
    }

    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;

    try {
        const roleInput = document.getElementById('role');
        if (!roleInput || !roleInput.value) {
            throw new Error('Please select your role (Patient or Therapist)');
        }
        
        const role = roleInput.value;
        console.log("🎯 Role selected:", role);

        const profileData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            contact: document.getElementById('contact').value,
            gender: document.getElementById('gender').value,
            age: parseInt(document.getElementById('age').value),
            role: role,
            userId: currentUser.uid,
            createdAt: currentProfile ? currentProfile.createdAt : new Date(),
            updatedAt: new Date()
        };

        console.log("📊 Basic profile data:", profileData);

        if (!profileData.name || !profileData.email || !profileData.contact || !profileData.gender || !profileData.age) {
            throw new Error('Please fill all required fields');
        }

        // Handle profile photo
        if (profilePhotoFile) {
            console.log("📤 Converting profile photo to Base64...");
            try {
                const compressedFile = await compressImage(profilePhotoFile);
                profileData.profilePhotoBase64 = await fileToBase64(compressedFile);
                profileData.profilePhotoType = compressedFile.type;
                console.log("✅ Profile photo converted to Base64");
            } catch (error) {
                console.error("❌ Profile photo conversion failed:", error);
                throw new Error('Failed to process profile photo: ' + error.message);
            }
        } else if (currentProfile && currentProfile.profilePhotoBase64) {
            profileData.profilePhotoBase64 = currentProfile.profilePhotoBase64;
            profileData.profilePhotoType = currentProfile.profilePhotoType;
        }

        // Add role-specific data
        if (role === 'patient') {
            const problems = getMultiSelectValues('problems');
            const severity = document.getElementById('severity').value;
            const triggers = getMultiSelectValues('triggers');

            if (problems.length === 0) {
                throw new Error('Please select at least one problem area');
            }

            profileData.patientDetails = {
                problems: problems,
                severity: severity,
                triggers: triggers
            };
            
            console.log("👤 Patient details:", profileData.patientDetails);

        } else if (role === 'therapist') {
            const qualification = document.getElementById('qualification').value;
            const experience = parseInt(document.getElementById('experience').value);
            const specialization = getMultiSelectValues('specialization');
            const licenseNumber = document.getElementById('licenseNumber').value;

            if (!qualification) throw new Error('Please enter qualifications');
            if (isNaN(experience)) throw new Error('Please enter years of experience');
            if (specialization.length === 0) throw new Error('Please select specializations');
            if (!licenseNumber) throw new Error('Please enter license number');

            profileData.therapistDetails = {
                qualification: qualification,
                experience: experience,
                specialization: specialization,
                licenseNumber: licenseNumber,
                status: 'pending'
            };

            console.log("📄 Converting documents to Base64...");
            
            // Government ID
            if (govIdFile) {
                console.log("📤 Converting Government ID to Base64...");
                try {
                    profileData.therapistDetails.govIdBase64 = await fileToBase64(govIdFile);
                    profileData.therapistDetails.govIdType = govIdFile.type;
                    profileData.therapistDetails.govIdName = govIdFile.name;
                    console.log("✅ Government ID converted to Base64");
                } catch (error) {
                    console.error("❌ Government ID conversion failed:", error);
                    throw new Error('Failed to process Government ID: ' + error.message);
                }
            } else if (currentProfile && currentProfile.therapistDetails && currentProfile.therapistDetails.govIdBase64) {
                profileData.therapistDetails.govIdBase64 = currentProfile.therapistDetails.govIdBase64;
                profileData.therapistDetails.govIdType = currentProfile.therapistDetails.govIdType;
                profileData.therapistDetails.govIdName = currentProfile.therapistDetails.govIdName;
            } else {
                throw new Error('Please upload your Government ID proof');
            }

            // License Certificate
            if (licenseCertificateFile) {
                console.log("📤 Converting License Certificate to Base64...");
                try {
                    profileData.therapistDetails.licenseCertificateBase64 = await fileToBase64(licenseCertificateFile);
                    profileData.therapistDetails.licenseCertificateType = licenseCertificateFile.type;
                    profileData.therapistDetails.licenseCertificateName = licenseCertificateFile.name;
                    console.log("✅ License Certificate converted to Base64");
                } catch (error) {
                    console.error("❌ License Certificate conversion failed:", error);
                    throw new Error('Failed to process License Certificate: ' + error.message);
                }
            } else if (currentProfile && currentProfile.therapistDetails && currentProfile.therapistDetails.licenseCertificateBase64) {
                profileData.therapistDetails.licenseCertificateBase64 = currentProfile.therapistDetails.licenseCertificateBase64;
                profileData.therapistDetails.licenseCertificateType = currentProfile.therapistDetails.licenseCertificateType;
                profileData.therapistDetails.licenseCertificateName = currentProfile.therapistDetails.licenseCertificateName;
            } else {
                throw new Error('Please upload your License Certificate');
            }

            // Degree Certificates (optional)
            if (degreeCertificateFiles.length > 0) {
                console.log("📤 Converting Degree Certificates to Base64...");
                try {
                    profileData.therapistDetails.degreeCertificates = [];
                    for (let file of degreeCertificateFiles) {
                        const base64Data = await fileToBase64(file);
                        profileData.therapistDetails.degreeCertificates.push({
                            base64: base64Data,
                            type: file.type,
                            name: file.name
                        });
                    }
                    console.log("✅ Degree Certificates converted to Base64");
                } catch (error) {
                    console.error("❌ Degree Certificates conversion failed:", error);
                    console.warn("Degree certificates are optional, continuing without them");
                }
            } else if (currentProfile && currentProfile.therapistDetails && currentProfile.therapistDetails.degreeCertificates) {
                profileData.therapistDetails.degreeCertificates = currentProfile.therapistDetails.degreeCertificates;
            }
            
            console.log("👨‍⚕️ Therapist details with Base64 documents:", profileData.therapistDetails);
        }

        // Save to Firestore
        console.log("💾 Saving to Firestore...");
        try {
            const profileRef = doc(db, 'profiles', currentUser.uid);
            await setDoc(profileRef, profileData);
            console.log("✅ Profile saved successfully to Firestore!");
        } catch (error) {
            console.error("❌ Firestore save failed:", error);
            throw new Error('Failed to save profile: ' + error.message);
        }
        
        currentProfile = profileData;

        updateNavbar(currentUser);
        showNotification('Profile saved successfully!', 'success');
        showProfileView(profileData);
        updatePageTitle(profileData.name);

    } catch (error) {
        console.error('❌ Error saving profile:', error);
        showNotification('Error: ' + error.message, 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function renderProfile(profile) {
    console.log("🎨 Rendering profile...");
    
    const profileView = document.getElementById('profileView');
    if (!profileView) return;

    const profileHTML = `
        <div class="profile-header">
            <div class="profile-cover">
                <div class="profile-avatar">
                    ${profile.profilePhotoBase64 ? 
                        `<img src="${profile.profilePhotoBase64}" alt="${profile.name}" class="profile-img">` : 
                        profile.profilePhotoUrl ?
                        `<img src="${profile.profilePhotoUrl}" alt="${profile.name}" class="profile-img">` :
                        `<div class="avatar-placeholder">
                            <i class="fas fa-user"></i>
                         </div>`
                    }
                    <div class="online-status"></div>
                </div>
                <div class="profile-actions">
                    <button class="share-profile-btn" onclick="shareProfile()">
                        <i class="fas fa-share-alt"></i> Share Profile
                    </button>
                </div>
            </div>
            
            <div class="profile-info">
                <h1>${profile.name}</h1>
                <p class="profile-role">
                    <i class="fas ${profile.role === 'therapist' ? 'fa-user-md' : 'fa-user-injured'}"></i>
                    ${profile.role === 'therapist' ? 'Professional Therapist' : 'MindCare Patient'}
                </p>
                <div class="profile-contact-info">
                    <p class="profile-email"><i class="fas fa-envelope"></i> ${profile.email}</p>
                    <p class="profile-contact"><i class="fas fa-phone"></i> ${profile.contact}</p>
                    <p class="profile-joined"><i class="fas fa-calendar"></i> Joined ${new Date(profile.createdAt).toLocaleDateString()}</p>
                </div>
            </div>
        </div>

        <div class="profile-content">
            <div class="profile-sidebar">
                <div class="profile-card glass-card">
                    <h3><i class="fas fa-user-circle"></i> Personal Info</h3>
                    <div class="about-section">
                        <div class="about-item">
                            <label><i class="fas fa-venus-mars"></i> Gender:</label>
                            <span>${profile.gender}</span>
                        </div>
                        <div class="about-item">
                            <label><i class="fas fa-birthday-cake"></i> Age:</label>
                            <span>${profile.age} years</span>
                        </div>
                        <div class="about-item">
                            <label><i class="fas fa-circle"></i> Status:</label>
                            <span class="status-badge status-active">Active</span>
                        </div>
                        ${profile.role === 'therapist' && profile.therapistDetails ? `
                        <div class="about-item">
                            <label><i class="fas fa-briefcase"></i> Experience:</label>
                            <span>${profile.therapistDetails.experience} years</span>
                        </div>
                        <div class="about-item">
                            <label><i class="fas fa-id-card"></i> License:</label>
                            <span class="license-number">${profile.therapistDetails.licenseNumber}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>

                ${profile.role === 'therapist' && profile.therapistDetails ? `
                <div class="profile-card glass-card">
                    <h3><i class="fas fa-graduation-cap"></i> Qualifications</h3>
                    <div class="qualification-text">
                        ${profile.therapistDetails.qualification}
                    </div>
                </div>

                <div class="profile-card glass-card">
                    <h3><i class="fas fa-file-contract"></i> Documents</h3>
                    <div class="documents-list">
                        ${profile.therapistDetails.govIdBase64 ? `
                        <div class="document-item">
                            <i class="fas fa-id-card text-success"></i>
                            <span>Government ID</span>
                            <a href="${profile.therapistDetails.govIdBase64}" target="_blank" class="document-link">
                                <i class="fas fa-eye"></i> View
                            </a>
                        </div>
                        ` : ''}
                        ${profile.therapistDetails.licenseCertificateBase64 ? `
                        <div class="document-item">
                            <i class="fas fa-file-certificate text-warning"></i>
                            <span>License Certificate</span>
                            <a href="${profile.therapistDetails.licenseCertificateBase64}" target="_blank" class="document-link">
                                <i class="fas fa-eye"></i> View
                            </a>
                        </div>
                        ` : ''}
                        ${profile.therapistDetails.degreeCertificates ? profile.therapistDetails.degreeCertificates.map((cert, index) => `
                        <div class="document-item">
                            <i class="fas fa-graduation-cap text-info"></i>
                            <span>Degree Certificate ${index + 1}</span>
                            <a href="${cert.base64}" target="_blank" class="document-link">
                                <i class="fas fa-eye"></i> View
                            </a>
                        </div>
                        `).join('') : ''}
                    </div>
                </div>
                ` : ''}
            </div>

            <div class="profile-main">
                ${profile.role === 'patient' && profile.patientDetails ? `
                <div class="profile-card glass-card">
                    <h3><i class="fas fa-heartbeat"></i> Health Overview</h3>
                    <div class="health-stats">
                        <div class="stat-item">
                            <label>Main Concerns:</label>
                            <div class="tags">
                                ${profile.patientDetails.problems.map(problem => 
                                    `<span class="tag health-tag">${problem}</span>`
                                ).join('')}
                            </div>
                        </div>
                        <div class="stat-item">
                            <label>Severity Level:</label>
                            <span class="severity-level level-${(profile.patientDetails.severity || 'moderate').toLowerCase()}">
                                <i class="fas fa-thermometer-half"></i>
                                ${profile.patientDetails.severity || 'Moderate'}
                            </span>
                        </div>
                        <div class="stat-item">
                            <label>Common Triggers:</label>
                            <div class="tags">
                                ${profile.patientDetails.triggers.map(trigger => 
                                    `<span class="tag trigger-tag">${trigger}</span>`
                                ).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}

                ${profile.role === 'therapist' && profile.therapistDetails ? `
                <div class="profile-card glass-card">
                    <h3><i class="fas fa-star"></i> Specializations</h3>
                    <div class="specialization-grid">
                        ${profile.therapistDetails.specialization.map(spec => 
                            `<div class="specialization-item">
                                <i class="fas fa-check-circle"></i>
                                <span>${spec}</span>
                            </div>`
                        ).join('')}
                    </div>
                </div>

                <div class="profile-card glass-card verification-card">
                    <h3><i class="fas fa-shield-alt"></i> Verification Status</h3>
                    <div class="verification-status">
                        <div class="verification-icon ${profile.therapistDetails.status === 'approved' ? 'verified' : 'pending'}">
                            <i class="fas ${profile.therapistDetails.status === 'approved' ? 'fa-check-circle' : 'fa-clock'}"></i>
                        </div>
                        <div class="verification-info">
                            <h4>${profile.therapistDetails.status === 'approved' ? 'Verified Professional' : 'Under Review'}</h4>
                            <p>${profile.therapistDetails.status === 'approved' ? 
                                'Your credentials have been verified and approved.' : 
                                'Your application is being reviewed by our team.'}</p>
                        </div>
                        <span class="status-badge status-${profile.therapistDetails.status || 'pending'}">
                            ${(profile.therapistDetails.status || 'pending').toUpperCase()}
                        </span>
                    </div>
                </div>
                ` : ''}

                <div class="profile-card glass-card">
                    <h3><i class="fas fa-chart-line"></i> Activity Summary</h3>
                    <div class="activity-timeline">
                        <div class="timeline-item">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <h4>Profile Created</h4>
                                <p>${new Date(profile.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div class="timeline-item">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <h4>Last Updated</h4>
                                <p>${new Date(profile.updatedAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div class="timeline-item">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <h4>${profile.role === 'therapist' ? 'Therapist Application' : 'Patient Registration'} Completed</h4>
                                <p>Profile is fully set up and active</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    profileView.innerHTML = profileHTML;
}

// Share profile function
window.shareProfile = function() {
    if (navigator.share) {
        navigator.share({
            title: 'My MindCare Profile',
            text: `Check out my MindCare profile - ${currentProfile.name}`,
            url: window.location.href,
        })
        .then(() => console.log('Successful share'))
        .catch((error) => console.log('Error sharing:', error));
    } else {
        showNotification('Web Share API not supported in your browser', 'info');
    }
}

// Helper functions
function getMultiSelectValues(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return [];
    return Array.from(select.selectedOptions).map(option => option.value);
}

function populateForm(profile) {
    console.log("🔄 Populating form with existing data...");
    
    document.getElementById('name').value = profile.name || '';
    document.getElementById('email').value = profile.email || '';
    document.getElementById('contact').value = profile.contact || '';
    document.getElementById('gender').value = profile.gender || '';
    document.getElementById('age').value = profile.age || '';

    if (profile.role) {
        window.selectRole(profile.role);
    }

    if (profile.role === 'patient' && profile.patientDetails) {
        setMultiSelectValues('problems', profile.patientDetails.problems || []);
        document.getElementById('severity').value = profile.patientDetails.severity || '';
        setMultiSelectValues('triggers', profile.patientDetails.triggers || []);
    }

    if (profile.role === 'therapist' && profile.therapistDetails) {
        document.getElementById('qualification').value = profile.therapistDetails.qualification || '';
        document.getElementById('experience').value = profile.therapistDetails.experience || '';
        setMultiSelectValues('specialization', profile.therapistDetails.specialization || []);
        document.getElementById('licenseNumber').value = profile.therapistDetails.licenseNumber || '';
    }

    if (profile.profilePhotoBase64) {
        const previewElement = document.getElementById('profilePhotoPreview');
        if (previewElement) {
            previewElement.innerHTML = `<img src="${profile.profilePhotoBase64}" alt="Profile Preview" style="max-width: 200px; max-height: 200px; border-radius: 8px;">`;
        }
    }

    showForm();
}

function setMultiSelectValues(selectId, values) {
    const select = document.getElementById(selectId);
    if (select) {
        Array.from(select.options).forEach(option => {
            option.selected = values.includes(option.value);
        });
    }
}

function showNotification(message, type = 'success') {
    console.log("📢 Notification:", message);
    
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
        background: ${type === 'success' ? '#5cb85c' : type === 'error' ? '#d9534f' : '#17a2b8'};
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
    
    .documents-list {
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
    }
    
    .document-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.8rem;
        background: #f8fafc;
        border-radius: 8px;
        border-left: 4px solid var(--primary);
    }
    
    .document-link {
        margin-left: auto;
        color: var(--primary);
        text-decoration: none;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .document-link:hover {
        color: var(--secondary);
    }
    
    .text-success { color: #10b981; }
    .text-warning { color: #f59e0b; }
    .text-info { color: #3b82f6; }
`;
document.head.appendChild(style);