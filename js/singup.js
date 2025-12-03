// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { 
    getAuth, 
    setPersistence, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    sendPasswordResetEmail, 
    signOut, 
    inMemoryPersistence, 
    browserLocalPersistence, 
    onAuthStateChanged,
    sendEmailVerification,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDpasFWwylXGImZ9PefqCY5uec8owlK7Yw",
  authDomain: "mindcare-be32e.firebaseapp.com",
  databaseURL: "https://mindcare-be32e-default-rtdb.firebaseio.com",
  projectId: "mindcare-be32e",
  storageBucket: "mindcare-be32e.firebasestorage.app",
  messagingSenderId: "504418183948",
  appId: "1:504418183948:web:823c58dcbb332758083729",
  measurementId: "G-LD1LHHDJ51"
};

// Initialize Firebase
console.log("Initializing Firebase...");
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app); // Realtime Database

// Global toggle functions for HTML onclick events
function showLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    if (loginForm && signupForm) {
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
        clearAlerts();
    }
}

function showSignupForm() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    if (loginForm && signupForm) {
        loginForm.classList.remove('active');
        signupForm.classList.add('active');
        clearAlerts();
    }
}

// Global clearAlerts function
function clearAlerts() {
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        alert.style.display = 'none';
    });
}

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, setting up authentication...");

    // Check if user is already logged in
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log('User is logged in:', user.email);
            updateNavigationForLoggedInUser(user);
            showAlert('loginSuccessAlert', `Welcome back, ${user.displayName || user.email}! You are already logged in.`);
        } else {
            console.log('No user logged in');
            updateNavigationForLoggedOutUser();
        }
    });

    // Form toggle functionality
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const showSignupBtn = document.getElementById('showSignup');
    const showLoginBtn = document.getElementById('showLogin');

    if (showSignupBtn) {
        showSignupBtn.addEventListener('click', function(e) {
            e.preventDefault();
            loginForm.classList.remove('active');
            signupForm.classList.add('active');
            clearAlerts();
        });
    }

    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            signupForm.classList.remove('active');
            loginForm.classList.add('active');
            clearAlerts();
        });
    }

    // Password visibility toggle
    const toggleButtons = document.querySelectorAll('.toggle-password');
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const passwordInput = document.getElementById(targetId);
            const icon = this.querySelector('i');
            
            if (passwordInput && icon) {
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    passwordInput.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            }
        });
    });

    // Password strength checker
    const passwordInput = document.getElementById('signupPassword');
    const strengthBar = document.getElementById('strengthBar');

    if (passwordInput && strengthBar) {
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            let strength = 0;

            if (password.length >= 8) strength++;
            if (/\d/.test(password)) strength++;
            if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

            strengthBar.className = 'strength-bar';
            if (strength === 1) {
                strengthBar.classList.add('strength-weak');
            } else if (strength === 2) {
                strengthBar.classList.add('strength-medium');
            } else if (strength === 3) {
                strengthBar.classList.add('strength-strong');
            }
        });
    }

    // Password confirmation check
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordMatch = document.getElementById('passwordMatch');

    if (confirmPasswordInput && passwordMatch) {
        confirmPasswordInput.addEventListener('input', function() {
            const password = passwordInput ? passwordInput.value : '';
            const confirmPassword = this.value;

            if (confirmPassword === '') {
                passwordMatch.textContent = '';
                passwordMatch.style.color = '';
            } else if (password === confirmPassword) {
                passwordMatch.textContent = '✓ Passwords match';
                passwordMatch.style.color = 'var(--success)';
            } else {
                passwordMatch.textContent = '✗ Passwords do not match';
                passwordMatch.style.color = 'var(--error)';
            }
        });
    }

    // Forgot password modal
    const forgotPasswordBtn = document.getElementById('forgotPassword');
    const forgotPasswordModal = document.getElementById('forgotPasswordModal');
    const closeModalBtn = document.getElementById('closeModal');

    if (forgotPasswordBtn && forgotPasswordModal) {
        forgotPasswordBtn.addEventListener('click', function(e) {
            e.preventDefault();
            forgotPasswordModal.style.display = 'flex';
            clearAlerts();
        });
    }

    if (closeModalBtn && forgotPasswordModal) {
        closeModalBtn.addEventListener('click', function() {
            forgotPasswordModal.style.display = 'none';
            clearAlerts();
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('forgotPasswordModal');
        if (e.target === modal) {
            modal.style.display = 'none';
            clearAlerts();
        }
    });

    // Form submissions with Firebase Authentication
    const loginAuthForm = document.getElementById('loginAuthForm');
    const signupAuthForm = document.getElementById('signupAuthForm');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');

    // Login Form Submission
    if (loginAuthForm) {
        loginAuthForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const submitBtn = this.querySelector('.submit-btn');
            const originalText = submitBtn.innerHTML;
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const rememberMe = document.getElementById('rememberMe').checked;

            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
            submitBtn.disabled = true;
            clearAlerts();

            console.log("Attempting login for:", email);

            try {
                // Set persistence
                await setPersistence(auth, rememberMe ? browserLocalPersistence : inMemoryPersistence);
                
                // Sign in user
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                
                console.log("✅ Login successful:", user.email);
                
                // Update last login in Realtime Database
                try {
                    await set(ref(database, 'users/' + user.uid + '/lastLogin'), Date.now());
                    console.log("✅ Last login updated in Realtime Database");
                } catch (dbError) {
                    console.warn("⚠️ Could not update last login (but login succeeded):", dbError);
                }
                
                showAlert('loginSuccessAlert', `Welcome back, ${user.displayName || user.email}! Redirecting...`);
                
                // Redirect to index.html
                setTimeout(() => {
                    window.location.href = 'profile.html';
                }, 2000);
                
            } catch (error) {
                console.error("❌ Login error:", error);
                const errorMessage = getFirebaseErrorMessage(error.code);
                showAlert('loginErrorAlert', errorMessage);
                
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Signup Form Submission with Realtime Database
    if (signupAuthForm) {
        signupAuthForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('.submit-btn');
            const originalText = submitBtn.innerHTML;
            
            const password = passwordInput ? passwordInput.value : '';
            const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';
            const fullName = document.getElementById('fullName').value;
            const email = document.getElementById('signupEmail').value;
            
            // Validation
            if (password !== confirmPassword) {
                showAlert('signupErrorAlert', 'Passwords do not match. Please check your password confirmation.');
                return;
            }

            if (password.length < 6) {
                showAlert('signupErrorAlert', 'Password should be at least 6 characters.');
                return;
            }

            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
            submitBtn.disabled = true;
            clearAlerts();

            console.log("Attempting signup for:", email);

            try {
                // Create user account
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                
                console.log("✅ User created successfully:", user.uid);
                
                // Update profile with display name
                await updateProfile(user, {
                    displayName: fullName
                });
                console.log("✅ Profile updated with display name");
                
                // Send email verification
                await sendEmailVerification(user);
                console.log("✅ Verification email sent");
                
                // Store user data in Realtime Database
                try {
                    await set(ref(database, 'users/' + user.uid), {
                        email: user.email,
                        name: fullName,
                        createdAt: Date.now(),
                        emailVerified: false,
                        role: 'user',
                        lastLogin: Date.now()
                    });
                    console.log("✅ User data stored in Realtime Database");
                } catch (dbError) {
                    console.warn("⚠️ Could not save to database (but account was created):", dbError);
                }
                
                // SUCCESS - Show success message
                showAlert('signupSuccessAlert', `Account created successfully! Welcome ${fullName}. Please check your email for verification. You can now login.`);
                
                // Clear form
                signupAuthForm.reset();
                if (strengthBar) strengthBar.className = 'strength-bar';
                if (passwordMatch) passwordMatch.textContent = '';
                
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;

                // Switch to login form after 3 seconds
                setTimeout(() => {
                    showLoginForm();
                }, 3000);
                
            } catch (error) {
                console.error("❌ Signup error:", error);
                const errorMessage = getFirebaseErrorMessage(error.code);
                showAlert('signupErrorAlert', errorMessage);
                
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Forgot Password Form Submission
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const submitBtn = this.querySelector('.submit-btn');
            const originalText = submitBtn.innerHTML;
            const email = document.getElementById('resetEmail').value;

            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;
            clearAlerts();

            try {
                await sendPasswordResetEmail(auth, email);
                showAlert('resetSuccessAlert', 'Password reset email sent! Check your inbox.');
                forgotPasswordForm.reset();
                
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;

                setTimeout(() => {
                    const modal = document.getElementById('forgotPasswordModal');
                    if (modal) modal.style.display = 'none';
                }, 3000);
                
            } catch (error) {
                console.error("Password reset error:", error);
                const errorMessage = getFirebaseErrorMessage(error.code);
                showAlert('resetErrorAlert', errorMessage);
                
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Helper functions
    function showAlert(alertId, message) {
        const alert = document.getElementById(alertId);
        if (alert) {
            alert.textContent = message;
            alert.style.display = 'block';
            
            setTimeout(() => {
                alert.style.display = 'none';
            }, 5000);
        }
    }

    function getFirebaseErrorMessage(errorCode) {
        const errorMessages = {
            'auth/invalid-email': 'Invalid email address format.',
            'auth/user-disabled': 'This account has been disabled.',
            'auth/user-not-found': 'No account found with this email.',
            'auth/wrong-password': 'Incorrect password.',
            'auth/email-already-in-use': 'An account with this email already exists.',
            'auth/weak-password': 'Password should be at least 6 characters.',
            'auth/network-request-failed': 'Network error. Please check your connection.',
            'auth/too-many-requests': 'Too many attempts. Please try again later.',
            'auth/operation-not-allowed': 'Email/password accounts are not enabled. Please check Firebase Console.',
            'auth/invalid-credential': 'Invalid login credentials.',
            'auth/missing-password': 'Please enter a password.',
            'auth/invalid-display-name': 'Please enter a valid name.'
        };
        
        return errorMessages[errorCode] || `An error occurred: ${errorCode}. Please try again.`;
    }

    function updateNavigationForLoggedInUser(user) {
        const authButtons = document.querySelector('.auth-buttons');
        if (authButtons) {
            authButtons.innerHTML = `
                <span style="color: var(--primary); font-weight: 600; margin-right: 1rem;">
                    <i class="fas fa-user"></i> ${user.displayName || 'User'}
                </span>
                <button class="btn btn-login" onclick="logout()">Logout</button>
            `;
        }
    }

    function updateNavigationForLoggedOutUser() {
        const authButtons = document.querySelector('.auth-buttons');
        if (authButtons) {
            authButtons.innerHTML = `
                <button class="btn btn-login" onclick="showLoginForm()">Login</button>
                <button class="btn btn-signup" onclick="showSignupForm()">Sign Up</button>
            `;
        }
    }

    // Global logout function
    window.logout = function() {
        signOut(auth).then(() => {
            showAlert('loginSuccessAlert', 'Logged out successfully!');
            updateNavigationForLoggedOutUser();
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }).catch((error) => {
            console.error('Logout error:', error);
        });
    };

    // Header hide/show on scroll
    let lastScrollY = window.scrollY;
    const header = document.getElementById('header');

    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > lastScrollY && window.scrollY > 100) {
                header.classList.add('hidden');
            } else {
                header.classList.remove('hidden');
            }
            lastScrollY = window.scrollY;
        });
    }
});

// Make functions globally available
window.showLoginForm = showLoginForm;
window.showSignupForm = showSignupForm;