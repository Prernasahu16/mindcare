// startsession.js - Therapy session page functionality
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, addDoc, onSnapshot, query, orderBy, updateDoc, setDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Global variables
let currentUser = null;
let currentUserProfile = null;
let sessionData = null;
let sessionId = null;
let chatSubscription = null;
let sessionTimer = null;
let startTime = null;

// WebRTC Globals
let peerConnection = null;
let localStream = null;
const servers = {
    iceServers: [
        { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }
    ]
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM Loaded. Setting up listeners immediately...");
    
    // 1. Setup Buttons IMMEDIATELY (so they are clickable)
    setupEventListeners();

    // 2. Start Logic
    initializeSessionPage();
});

function setupEventListeners() {
    try {
        // Navigation
        const backBtn = document.getElementById('backBtn');
        if(backBtn) backBtn.addEventListener('click', window.goBack);
        
        // Chat
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendBtn');
        
        if(chatInput) {
            chatInput.addEventListener('input', function() {
                if(sendBtn) sendBtn.disabled = !this.value.trim();
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight) + 'px';
            });
            
            chatInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (sendBtn && !sendBtn.disabled) sendMessage();
                }
            });
        }
        
        if(sendBtn) sendBtn.addEventListener('click', sendMessage);
        
        // Video Call
        const videoBtn = document.getElementById('videoCallBtn');
        if(videoBtn) videoBtn.addEventListener('click', toggleVideoCall);

        const toggleVideo = document.getElementById('toggleVideo');
        if(toggleVideo) toggleVideo.addEventListener('click', toggleVideoContainer);
        
        const endCallBtn = document.getElementById('endCallBtn');
        if(endCallBtn) endCallBtn.addEventListener('click', endVideoCall);
        
        const muteBtn = document.getElementById('muteBtn');
        if(muteBtn) muteBtn.addEventListener('click', toggleMute);
        
        const vidToggle = document.getElementById('videoToggleBtn');
        if(vidToggle) vidToggle.addEventListener('click', toggleCamera);
        
        console.log("✅ Event Listeners Attached Successfully");
    } catch (e) {
        console.error("Error attaching event listeners:", e);
    }
}

function initializeSessionPage() {
    const urlParams = new URLSearchParams(window.location.search);
    sessionId = urlParams.get('sessionId');
    
    if (!sessionId) {
        alert('Error: No Session ID found in URL.');
        return;
    }
    
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            console.log("User authenticated:", user.email);
            
            try {
                // Load data
                await loadSessionData();
                await loadUserProfile();
                startSessionTimer();
                subscribeToChat();
            } catch (err) {
                console.error("Initialization Error:", err);
                alert("Error loading session data: " + err.message);
            }
        } else {
            console.log("User not logged in");
            // Optional: Redirect if needed
            // window.location.href = 'signup.html';
        }
    });
}

// --- DATA LOADING ---
async function loadSessionData() {
    console.log("Loading session data for:", sessionId);
    const sessionRef = doc(db, 'sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);
    
    if (sessionSnap.exists()) {
        sessionData = sessionSnap.data();
        
        const otherUserName = currentUser.uid === sessionData.patientId ? sessionData.therapistName : sessionData.patientName;
        const otherUserRole = currentUser.uid === sessionData.patientId ? 'Therapist' : 'Patient';
        
        const nameEl = document.getElementById('userName');
        const roleEl = document.getElementById('userRole');
        const avatarEl = document.getElementById('userAvatar');

        if(nameEl) nameEl.textContent = otherUserName;
        if(roleEl) roleEl.textContent = `${otherUserRole} - Therapy Session`;
        if(avatarEl) avatarEl.textContent = otherUserName.charAt(0).toUpperCase();
        
        document.title = `${otherUserName} - Therapy Session | MindCare`;
    } else {
        console.error("Session document does not exist!");
        alert("Session not found in database. Check the ID.");
    }
}

async function loadUserProfile() {
    // Safe check for external script dependency
    if (window.currentUserProfile && typeof window.currentUserProfile === 'function') {
        currentUserProfile = window.currentUserProfile();
    }
}

// --- VIDEO LOGIC ---
async function toggleVideoCall() {
    const videoCallBtn = document.getElementById('videoCallBtn');
    const isVideoActive = videoCallBtn.classList.contains('active');
    
    if (isVideoActive) {
        endVideoCall();
    } else {
        await startVideoCall();
    }
}

async function startVideoCall() {
    const videoCallBtn = document.getElementById('videoCallBtn');
    videoCallBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
    
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        
        const localVideo = document.getElementById('localVideo');
        if(localVideo) {
            localVideo.srcObject = localStream;
            localVideo.muted = true;
        }

        videoCallBtn.innerHTML = '<i class="fas fa-phone-slash"></i> End Video Call';
        videoCallBtn.classList.add('active');
        videoCallBtn.style.background = 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
        
        const container = document.getElementById('videoContainer');
        if(container) container.classList.add('pulse');
        
        const placeholder = document.getElementById('videoPlaceholder');
        if(placeholder) placeholder.style.display = 'none';

        await initializeWebRTC();

    } catch (error) {
        console.error("Media Error:", error);
        alert("Camera Error: " + error.message + "\n\nPlease click 'Allow' on the camera permission popup.");
        videoCallBtn.innerHTML = '<i class="fas fa-video"></i> Start Video Call';
    }
}

async function initializeWebRTC() {
    peerConnection = new RTCPeerConnection(servers);

    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = (event) => {
        const remoteVideo = document.getElementById('remoteVideo');
        if(remoteVideo) remoteVideo.srcObject = event.streams[0];
        
        const placeholder = document.getElementById('videoPlaceholder');
        if(placeholder) placeholder.style.display = 'none';
    };

    const callDocRef = doc(db, 'sessions', sessionId, 'call', 'connection');
    const offerCandidates = collection(db, 'sessions', sessionId, 'call', 'connection', 'offerCandidates');
    const answerCandidates = collection(db, 'sessions', sessionId, 'call', 'connection', 'answerCandidates');

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            // We need to know our role to save candidates correctly
            // This logic assumes we established role via the offer check below
        }
    };

    const callSnap = await getDoc(callDocRef);

    if (callSnap.exists() && callSnap.data().offer) {
        // Answerer
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) addDoc(answerCandidates, event.candidate.toJSON());
        };

        await peerConnection.setRemoteDescription(new RTCSessionDescription(callSnap.data().offer));
        const answerDescription = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answerDescription);

        await updateDoc(callDocRef, { answer: { type: answerDescription.type, sdp: answerDescription.sdp } });

        onSnapshot(offerCandidates, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    peerConnection.addIceCandidate(new RTCIceCandidate(change.doc.data()));
                }
            });
        });

    } else {
        // Caller
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) addDoc(offerCandidates, event.candidate.toJSON());
        };

        const offerDescription = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offerDescription);

        await setDoc(callDocRef, { offer: { type: offerDescription.type, sdp: offerDescription.sdp } });

        onSnapshot(callDocRef, (snapshot) => {
            const data = snapshot.data();
            if (!peerConnection.currentRemoteDescription && data?.answer) {
                peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
            }
        });

        onSnapshot(answerCandidates, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    peerConnection.addIceCandidate(new RTCIceCandidate(change.doc.data()));
                }
            });
        });
    }
}

function endVideoCall() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    
    const localVideo = document.getElementById('localVideo');
    const remoteVideo = document.getElementById('remoteVideo');
    const placeholder = document.getElementById('videoPlaceholder');
    const videoCallBtn = document.getElementById('videoCallBtn');
    const container = document.getElementById('videoContainer');

    if(localVideo) localVideo.srcObject = null;
    if(remoteVideo) remoteVideo.srcObject = null;
    if(placeholder) placeholder.style.display = 'block';
    
    if(videoCallBtn) {
        videoCallBtn.innerHTML = '<i class="fas fa-video"></i> Start Video Call';
        videoCallBtn.classList.remove('active');
        videoCallBtn.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
    }
    if(container) container.classList.remove('pulse');
}

// --- UTILS ---
function toggleMute() {
    if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            const muteBtn = document.getElementById('muteBtn');
            if(muteBtn) {
                muteBtn.classList.toggle('active');
                muteBtn.innerHTML = audioTrack.enabled ? '<i class="fas fa-microphone"></i>' : '<i class="fas fa-microphone-slash"></i>';
            }
        }
    }
}

function toggleCamera() {
    if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            const videoToggleBtn = document.getElementById('videoToggleBtn');
            if(videoToggleBtn) {
                videoToggleBtn.classList.toggle('active');
                videoToggleBtn.innerHTML = videoTrack.enabled ? '<i class="fas fa-video"></i>' : '<i class="fas fa-video-slash"></i>';
            }
        }
    }
}

function toggleVideoContainer() {
    const videoContainer = document.getElementById('videoContainer');
    const toggleBtn = document.getElementById('toggleVideo');
    if(videoContainer) videoContainer.classList.toggle('collapsed');
    if(toggleBtn) toggleBtn.innerHTML = videoContainer.classList.contains('collapsed') ? '<i class="fas fa-expand"></i>' : '<i class="fas fa-minus"></i>';
}

function startSessionTimer() {
    startTime = new Date();
    sessionTimer = setInterval(() => {
        const now = new Date();
        const diff = now - startTime;
        const hours = Math.floor(diff / 3600000).toString().padStart(2, '0');
        const minutes = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
        const seconds = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
        const timerEl = document.getElementById('timer');
        if(timerEl) timerEl.textContent = `${hours}:${minutes}:${seconds}`;
    }, 1000);
}

// Chat functions
async function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    if (!message) return;
    
    try {
        await addDoc(collection(db, 'sessions', sessionId, 'messages'), {
            senderId: currentUser.uid,
            senderName: currentUser.email, // fallback
            content: message,
            timestamp: new Date(),
            type: 'text'
        });
        chatInput.value = '';
        const sendBtn = document.getElementById('sendBtn');
        if(sendBtn) sendBtn.disabled = true;
    } catch (e) { console.error(e); }
}

function subscribeToChat() {
    const messagesQuery = query(collection(db, 'sessions', sessionId, 'messages'), orderBy('timestamp', 'asc'));
    chatSubscription = onSnapshot(messagesQuery, (snapshot) => {
        const messagesContainer = document.getElementById('messagesContainer');
        if(!messagesContainer) return;
        messagesContainer.innerHTML = '';
        snapshot.forEach((doc) => {
            const msg = doc.data();
            const div = document.createElement('div');
            div.className = `message ${msg.senderId === currentUser.uid ? 'sent' : 'received'}`;
            div.innerHTML = `<p class="message-content">${msg.content}</p>`;
            messagesContainer.appendChild(div);
        });
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
}

// Global Exports
window.goBack = function() { window.history.back(); };
window.openNotesModal = function() { document.getElementById('notesModal').classList.remove('hidden'); };
window.openResourcesModal = function() { document.getElementById('resourcesModal').classList.remove('hidden'); };
window.openEmergencyModal = function() { document.getElementById('emergencyModal').classList.remove('hidden'); };