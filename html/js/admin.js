import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
        import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
        import { getFirestore, collection, getDocs, updateDoc, doc, query, where } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

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

        let therapists = [];
        let currentFilter = 'all';
        let currentDocument = null;

        // Make functions available globally
        window.logout = async function() {
            try {
                await signOut(auth);
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Logout error:', error);
            }
        };

        // Load all therapists
        async function loadTherapists() {
            try {
                showLoading(true);
                
                const querySnapshot = await getDocs(collection(db, 'profiles'));
                therapists = [];
                
                querySnapshot.forEach((doc) => {
                    const profile = doc.data();
                    if (profile.role === 'therapist') {
                        therapists.push({
                            id: doc.id,
                            ...profile,
                            approvalStatus: profile.therapistDetails?.status || 'pending',
                            submittedAt: profile.createdAt || new Date()
                        });
                    }
                });

                console.log(`Loaded ${therapists.length} therapists:`, therapists);
                updateStats();
                displayTherapists();
                
            } catch (error) {
                console.error('Error loading therapists:', error);
                showNotification('Error loading therapist data: ' + error.message, 'error');
            } finally {
                showLoading(false);
            }
        }

        // Update statistics
        function updateStats() {
            const pending = therapists.filter(t => t.approvalStatus === 'pending').length;
            const approved = therapists.filter(t => t.approvalStatus === 'approved').length;
            const rejected = therapists.filter(t => t.approvalStatus === 'rejected').length;
            const total = therapists.length;

            document.getElementById('pendingCount').textContent = pending;
            document.getElementById('approvedCount').textContent = approved;
            document.getElementById('rejectedCount').textContent = rejected;
            document.getElementById('totalCount').textContent = total;
        }

        // Display therapists based on filter
        function displayTherapists() {
            const therapistsList = document.getElementById('therapistsList');
            const emptyState = document.getElementById('emptyState');

            const filteredTherapists = filterTherapists(therapists, currentFilter);

            if (filteredTherapists.length === 0) {
                therapistsList.classList.add('hidden');
                emptyState.classList.remove('hidden');
                return;
            }

            emptyState.classList.add('hidden');
            therapistsList.classList.remove('hidden');

            therapistsList.innerHTML = filteredTherapists.map(therapist => `
                <div class="therapist-card ${therapist.approvalStatus}">
                    <div class="status-badge ${therapist.approvalStatus}">
                        ${therapist.approvalStatus.charAt(0).toUpperCase() + therapist.approvalStatus.slice(1)}
                    </div>
                    
                    <div class="therapist-header">
                        <div class="therapist-avatar">
                            ${therapist.profilePhotoBase64 ? 
                                `<img src="${therapist.profilePhotoBase64}" alt="${therapist.name}" />` : 
                                therapist.name ? therapist.name.charAt(0).toUpperCase() : 'T'
                            }
                        </div>
                        <div class="therapist-info">
                            <h2 class="therapist-name">${therapist.name || 'Therapist Name'}</h2>
                            <div class="therapist-email">
                                <i class="fas fa-envelope"></i>
                                ${therapist.email || 'No email provided'}
                            </div>
                            <div class="therapist-specialization">
                                ${(therapist.therapistDetails?.specialization || []).map(spec => 
                                    `<span class="specialty-tag">${spec}</span>`
                                ).join('')}
                            </div>
                        </div>
                    </div>

                    <div class="therapist-details">
                        <div class="detail-group">
                            <h4><i class="fas fa-graduation-cap"></i> Qualifications</h4>
                            <div class="detail-content">
                                ${therapist.therapistDetails?.qualification || 'No qualifications provided'}
                            </div>
                        </div>
                        <div class="detail-group">
                            <h4><i class="fas fa-briefcase"></i> Experience</h4>
                            <div class="detail-content">
                                ${therapist.therapistDetails?.experience ? `${therapist.therapistDetails.experience} years` : 'Not specified'}
                            </div>
                        </div>
                        <div class="detail-group">
                            <h4><i class="fas fa-phone"></i> Contact</h4>
                            <div class="detail-content">
                                ${therapist.contact || 'No phone provided'}
                            </div>
                        </div>
                        <div class="detail-group">
                            <h4><i class="fas fa-id-card"></i> License Number</h4>
                            <div class="detail-content">
                                ${therapist.therapistDetails?.licenseNumber || 'Not provided'}
                            </div>
                        </div>
                    </div>

                    ${therapist.therapistDetails ? `
                    <div class="documents-section">
                        <h4><i class="fas fa-file-contract"></i> Verification Documents</h4>
                        <div class="document-list">
                            ${therapist.therapistDetails.govIdBase64 ? `
                            <div class="document-item" onclick="viewDocument('${therapist.id}', 'govId')">
                                <div class="document-icon">
                                    <i class="fas fa-id-card"></i>
                                </div>
                                <div class="document-name">Government ID</div>
                                <div class="document-actions">
                                    <button class="action-btn view" onclick="event.stopPropagation(); viewDocument('${therapist.id}', 'govId')">
                                        <i class="fas fa-eye"></i> View
                                    </button>
                                    <button class="action-btn download" onclick="event.stopPropagation(); downloadDocument('${therapist.id}', 'govId', '${therapist.therapistDetails.govIdName || 'government_id'}')">
                                        <i class="fas fa-download"></i> Download
                                    </button>
                                </div>
                            </div>
                            ` : ''}
                            
                            ${therapist.therapistDetails.licenseCertificateBase64 ? `
                            <div class="document-item" onclick="viewDocument('${therapist.id}', 'licenseCertificate')">
                                <div class="document-icon">
                                    <i class="fas fa-file-certificate"></i>
                                </div>
                                <div class="document-name">License Certificate</div>
                                <div class="document-actions">
                                    <button class="action-btn view" onclick="event.stopPropagation(); viewDocument('${therapist.id}', 'licenseCertificate')">
                                        <i class="fas fa-eye"></i> View
                                    </button>
                                    <button class="action-btn download" onclick="event.stopPropagation(); downloadDocument('${therapist.id}', 'licenseCertificate', '${therapist.therapistDetails.licenseCertificateName || 'license_certificate'}')">
                                        <i class="fas fa-download"></i> Download
                                    </button>
                                </div>
                            </div>
                            ` : ''}
                            
                            ${therapist.therapistDetails.degreeCertificates ? therapist.therapistDetails.degreeCertificates.map((cert, index) => `
                            <div class="document-item" onclick="viewDocument('${therapist.id}', 'degreeCertificate', ${index})">
                                <div class="document-icon">
                                    <i class="fas fa-graduation-cap"></i>
                                </div>
                                <div class="document-name">Degree Certificate ${index + 1}</div>
                                <div class="document-actions">
                                    <button class="action-btn view" onclick="event.stopPropagation(); viewDocument('${therapist.id}', 'degreeCertificate', ${index})">
                                        <i class="fas fa-eye"></i> View
                                    </button>
                                    <button class="action-btn download" onclick="event.stopPropagation(); downloadDocument('${therapist.id}', 'degreeCertificate', '${cert.name || `degree_certificate_${index + 1}`}', ${index})">
                                        <i class="fas fa-download"></i> Download
                                    </button>
                                </div>
                            </div>
                            `).join('') : ''}
                        </div>
                    </div>
                    ` : ''}

                    <div class="action-buttons">
                        ${therapist.approvalStatus === 'pending' ? `
                            <button class="btn btn-approve" onclick="approveTherapist('${therapist.id}')">
                                <i class="fas fa-check"></i> Approve
                            </button>
                            <button class="btn btn-reject" onclick="rejectTherapist('${therapist.id}')">
                                <i class="fas fa-times"></i> Reject
                            </button>
                        ` : ''}
                        
                        ${therapist.approvalStatus === 'approved' ? `
                            <button class="btn btn-reject" onclick="rejectTherapist('${therapist.id}')">
                                <i class="fas fa-times"></i> Revoke Approval
                            </button>
                        ` : ''}
                        
                        ${therapist.approvalStatus === 'rejected' ? `
                            <button class="btn btn-approve" onclick="approveTherapist('${therapist.id}')">
                                <i class="fas fa-check"></i> Re-approve
                            </button>
                        ` : ''}
                    </div>
                </div>
            `).join('');
        }

        // Filter therapists
        function filterTherapists(therapists, filter) {
            switch (filter) {
                case 'pending':
                    return therapists.filter(t => t.approvalStatus === 'pending');
                case 'approved':
                    return therapists.filter(t => t.approvalStatus === 'approved');
                case 'rejected':
                    return therapists.filter(t => t.approvalStatus === 'rejected');
                default:
                    return therapists;
            }
        }

        // Approve therapist
        window.approveTherapist = async function(therapistId) {
            if (!confirm('Are you sure you want to approve this therapist? They will be able to accept sessions.')) {
                return;
            }

            try {
                const therapistRef = doc(db, 'profiles', therapistId);
                await updateDoc(therapistRef, {
                    'therapistDetails.status': 'approved',
                    'therapistDetails.approvedAt': new Date(),
                    updatedAt: new Date()
                });

                showNotification('Therapist approved successfully!', 'success');
                await loadTherapists(); // Reload data
            } catch (error) {
                console.error('Error approving therapist:', error);
                showNotification('Error approving therapist: ' + error.message, 'error');
            }
        }

        // Reject therapist
        window.rejectTherapist = async function(therapistId) {
            const reason = prompt('Please provide a reason for rejection:');
            if (reason === null) return; // User cancelled

            if (!reason.trim()) {
                showNotification('Please provide a reason for rejection.', 'warning');
                return;
            }

            try {
                const therapistRef = doc(db, 'profiles', therapistId);
                await updateDoc(therapistRef, {
                    'therapistDetails.status': 'rejected',
                    'therapistDetails.rejectionReason': reason,
                    'therapistDetails.rejectedAt': new Date(),
                    updatedAt: new Date()
                });

                showNotification('Therapist rejected successfully!', 'success');
                await loadTherapists(); // Reload data
            } catch (error) {
                console.error('Error rejecting therapist:', error);
                showNotification('Error rejecting therapist: ' + error.message, 'error');
            }
        }

        // View document
        window.viewDocument = function(therapistId, docType, index = null) {
            const therapist = therapists.find(t => t.id === therapistId);
            if (!therapist || !therapist.therapistDetails) return;

            let base64Data = '';
            let fileName = '';

            switch (docType) {
                case 'govId':
                    base64Data = therapist.therapistDetails.govIdBase64;
                    fileName = therapist.therapistDetails.govIdName || 'government_id';
                    break;
                case 'licenseCertificate':
                    base64Data = therapist.therapistDetails.licenseCertificateBase64;
                    fileName = therapist.therapistDetails.licenseCertificateName || 'license_certificate';
                    break;
                case 'degreeCertificate':
                    if (therapist.therapistDetails.degreeCertificates && therapist.therapistDetails.degreeCertificates[index]) {
                        base64Data = therapist.therapistDetails.degreeCertificates[index].base64;
                        fileName = therapist.therapistDetails.degreeCertificates[index].name || `degree_certificate_${index + 1}`;
                    }
                    break;
            }

            if (!base64Data) {
                showNotification('Document not found', 'error');
                return;
            }

            currentDocument = { base64Data, fileName };
            openDocumentModal(base64Data);
        }

        // Open document modal
        function openDocumentModal(base64Data) {
            const modal = document.getElementById('documentModal');
            const preview = document.getElementById('documentPreview');
            
            // Check if it's an image or PDF
            if (base64Data.includes('data:image/')) {
                preview.innerHTML = `<img src="${base64Data}" alt="Document Preview" />`;
            } else if (base64Data.includes('data:application/pdf')) {
                preview.innerHTML = `<iframe src="${base64Data}"></iframe>`;
            } else {
                preview.innerHTML = `<p>Preview not available for this file type. Please download the document.</p>`;
            }
            
            modal.classList.remove('hidden');
        }

        // Close document modal
        window.closeDocumentModal = function() {
            const modal = document.getElementById('documentModal');
            modal.classList.add('hidden');
            currentDocument = null;
        }

        // Download current document
        window.downloadCurrentDocument = function() {
            if (!currentDocument) return;
            downloadBase64File(currentDocument.base64Data, currentDocument.fileName);
        }

        // Download document
        window.downloadDocument = function(therapistId, docType, fileName, index = null) {
            const therapist = therapists.find(t => t.id === therapistId);
            if (!therapist || !therapist.therapistDetails) return;

            let base64Data = '';

            switch (docType) {
                case 'govId':
                    base64Data = therapist.therapistDetails.govIdBase64;
                    break;
                case 'licenseCertificate':
                    base64Data = therapist.therapistDetails.licenseCertificateBase64;
                    break;
                case 'degreeCertificate':
                    if (therapist.therapistDetails.degreeCertificates && therapist.therapistDetails.degreeCertificates[index]) {
                        base64Data = therapist.therapistDetails.degreeCertificates[index].base64;
                    }
                    break;
            }

            if (!base64Data) {
                showNotification('Document not found', 'error');
                return;
            }

            downloadBase64File(base64Data, fileName);
        }

        // Download base64 file
        function downloadBase64File(base64Data, fileName) {
            try {
                const link = document.createElement('a');
                link.href = base64Data;
                
                // Get file extension from base64 data
                const match = base64Data.match(/^data:(.*?);base64,/);
                let extension = '';
                if (match && match[1]) {
                    if (match[1].includes('pdf')) {
                        extension = '.pdf';
                    } else if (match[1].includes('jpeg') || match[1].includes('jpg')) {
                        extension = '.jpg';
                    } else if (match[1].includes('png')) {
                        extension = '.png';
                    }
                }
                
                link.download = fileName + extension;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showNotification('Document downloaded successfully!', 'success');
            } catch (error) {
                console.error('Error downloading document:', error);
                showNotification('Error downloading document: ' + error.message, 'error');
            }
        }

        // Show/hide loading state
        function showLoading(show) {
            const loadingState = document.getElementById('loadingState');
            if (show) {
                loadingState.classList.remove('hidden');
            } else {
                loadingState.classList.add('hidden');
            }
        }

        // Show notification
        function showNotification(message, type = 'success') {
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.innerHTML = `
                <div class="notification-content">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'exclamation-triangle'} notification-icon"></i>
                    <span>${message}</span>
                </div>
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideInRight 0.3s ease-in reverse';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, 4000);
        }

        // Update navbar with user info
        function updateNavbar(user) {
            const authButtons = document.querySelector('.auth-buttons');
            if (authButtons) {
                const userName = user.email ? user.email.split('@')[0] : 'Admin';
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

                const logoutBtn = document.getElementById('logoutBtn');
                logoutBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    if (confirm('Are you sure you want to logout?')) {
                        logout();
                    }
                });
            }
        }

        // Setup event listeners
        function setupEventListeners() {
            // Filter tabs
            document.querySelectorAll('.filter-tabs .tab').forEach(tab => {
                tab.addEventListener('click', function() {
                    document.querySelectorAll('.filter-tabs .tab').forEach(t => t.classList.remove('active'));
                    this.classList.add('active');
                    currentFilter = this.getAttribute('data-filter');
                    displayTherapists();
                });
            });

            // Close modal on backdrop click
            document.getElementById('documentModal').addEventListener('click', function(e) {
                if (e.target === this) {
                    closeDocumentModal();
                }
            });
        }

        // Initialize the page
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🚀 Initializing admin panel...');
            
            // Check authentication
            onAuthStateChanged(auth, async (user) => {
                if (user) {
                    console.log("✅ User authenticated:", user.email);
                    updateNavbar(user);
                    setupEventListeners();
                    await loadTherapists();
                } else {
                    console.log("❌ User not authenticated");
                    window.location.href = 'signup.html';
                    return;
                }
            });
        });