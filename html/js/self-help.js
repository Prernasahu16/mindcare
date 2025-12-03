// Modal functionality
        document.addEventListener('DOMContentLoaded', function() {
            // Get all modal elements
            const breathingModal = document.getElementById('breathing-modal');
            const groundingModal = document.getElementById('grounding-modal');
            const thoughtsModal = document.getElementById('thoughts-modal');
            const gratitudeModal = document.getElementById('gratitude-modal');
            const moodModal = document.getElementById('mood-modal');
            const relaxationModal = document.getElementById('relaxation-modal');
            
            // Get all close buttons
            const closeButtons = document.querySelectorAll('.close-btn');
            
            // Get all start buttons
            const startButtons = document.querySelectorAll('.start-btn');
            
            // Close modal when clicking on close button
            closeButtons.forEach(button => {
                button.addEventListener('click', function() {
                    breathingModal.style.display = 'none';
                    groundingModal.style.display = 'none';
                    thoughtsModal.style.display = 'none';
                    gratitudeModal.style.display = 'none';
                    moodModal.style.display = 'none';
                    relaxationModal.style.display = 'none';
                    resetBreathingExercise();
                    resetRelaxationExercise();
                });
            });
            
            // Close modal when clicking outside of it
            window.addEventListener('click', function(event) {
                if (event.target === breathingModal) {
                    breathingModal.style.display = 'none';
                    resetBreathingExercise();
                }
                if (event.target === groundingModal) {
                    groundingModal.style.display = 'none';
                }
                if (event.target === thoughtsModal) {
                    thoughtsModal.style.display = 'none';
                }
                if (event.target === gratitudeModal) {
                    gratitudeModal.style.display = 'none';
                }
                if (event.target === moodModal) {
                    moodModal.style.display = 'none';
                }
                if (event.target === relaxationModal) {
                    relaxationModal.style.display = 'none';
                    resetRelaxationExercise();
                }
            });
            
            // Open modal when clicking on tool card
            startButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const toolCard = this.closest('.tool-card');
                    const toolType = toolCard.getAttribute('data-tool');
                    
                    if (toolType === 'breathing') {
                        breathingModal.style.display = 'flex';
                        initializeBreathingExercise();
                    } else if (toolType === 'grounding') {
                        groundingModal.style.display = 'flex';
                        initializeGroundingExercise();
                    } else if (toolType === 'thoughts') {
                        thoughtsModal.style.display = 'flex';
                        initializeThoughtReframing();
                    } else if (toolType === 'gratitude') {
                        gratitudeModal.style.display = 'flex';
                        initializeGratitudeJournal();
                    } else if (toolType === 'mood') {
                        moodModal.style.display = 'flex';
                        initializeMoodTracker();
                    } else if (toolType === 'relaxation') {
                        relaxationModal.style.display = 'flex';
                        initializeRelaxationExercise();
                    }
                });
            });
            
            // Initialize grounding exercise
            function initializeGroundingExercise() {
                const steps = document.querySelectorAll('.grounding-step');
                steps.forEach(step => step.classList.remove('active'));
                document.getElementById('step-1').classList.add('active');
                
                const prevBtn = document.getElementById('prev-btn');
                const nextBtn = document.getElementById('next-btn');
                const finishBtn = document.getElementById('finish-btn');
                
                prevBtn.style.display = 'inline-block';
                nextBtn.style.display = 'inline-block';
                finishBtn.style.display = 'none';
                
                let currentStep = 1;
                
                nextBtn.addEventListener('click', function() {
                    if (currentStep < 5) {
                        document.getElementById(`step-${currentStep}`).classList.remove('active');
                        currentStep++;
                        document.getElementById(`step-${currentStep}`).classList.add('active');
                        
                        if (currentStep === 5) {
                            nextBtn.style.display = 'none';
                            finishBtn.style.display = 'inline-block';
                        }
                        
                        if (currentStep > 1) {
                            prevBtn.style.display = 'inline-block';
                        }
                    }
                });
                
                prevBtn.addEventListener('click', function() {
                    if (currentStep > 1) {
                        document.getElementById(`step-${currentStep}`).classList.remove('active');
                        currentStep--;
                        document.getElementById(`step-${currentStep}`).classList.add('active');
                        
                        if (currentStep === 1) {
                            prevBtn.style.display = 'inline-block';
                        }
                        
                        if (currentStep < 5) {
                            nextBtn.style.display = 'inline-block';
                            finishBtn.style.display = 'none';
                        }
                    }
                });
                
                finishBtn.addEventListener('click', function() {
                    alert('Great job completing the grounding exercise!');
                    groundingModal.style.display = 'none';
                });
            }
            
            // Breathing exercise variables
            let breathingInterval;
            let isBreathing = false;
            let currentPhase = 'ready'; // ready, inhale, hold, exhale
            let cycleCount = 0;
            const maxCycles = 4;
            let phaseTimeLeft;
            let currentPhaseDuration;

            // Initialize breathing exercise
            function initializeBreathingExercise() {
                const startBtn = document.getElementById('start-breathing');
                const pauseBtn = document.getElementById('pause-breathing');
                const resetBtn = document.getElementById('reset-breathing');
                
                startBtn.addEventListener('click', startBreathing);
                pauseBtn.addEventListener('click', pauseBreathing);
                resetBtn.addEventListener('click', resetBreathingExercise);
                
                resetBreathingExercise();
            }

            function startBreathing() {
                if (isBreathing) return;
                
                isBreathing = true;
                const breathingText = document.getElementById('breathing-text');
                const breathingTimer = document.getElementById('breathing-timer');
                const instruction = document.getElementById('breathing-instruction');
                const cycleDisplay = document.getElementById('cycle-count');
                const breathingCircle = document.querySelector('.breathing-circle');
                
                // Start with first cycle if not already started
                if (cycleCount === 0) {
                    cycleCount = 1;
                    cycleDisplay.textContent = cycleCount;
                    setBreathingPhase('inhale');
                }
                
                breathingInterval = setInterval(() => {
                    if (!isBreathing) return;
                    
                    phaseTimeLeft--;
                    breathingTimer.textContent = phaseTimeLeft;
                    
                    // Update breathing animation based on phase
                    if (currentPhase === 'inhale') {
                        const progress = 1 - (phaseTimeLeft / currentPhaseDuration);
                        breathingCircle.style.transform = `scale(${1 + progress * 0.2})`;
                    } else if (currentPhase === 'exhale') {
                        const progress = 1 - (phaseTimeLeft / currentPhaseDuration);
                        breathingCircle.style.transform = `scale(${1.2 - progress * 0.2})`;
                    }
                    
                    // Check if phase is complete
                    if (phaseTimeLeft <= 0) {
                        switch(currentPhase) {
                            case 'inhale':
                                setBreathingPhase('hold');
                                break;
                            case 'hold':
                                setBreathingPhase('exhale');
                                break;
                            case 'exhale':
                                // Cycle completed
                                cycleCount++;
                                cycleDisplay.textContent = cycleCount;
                                
                                if (cycleCount > maxCycles) {
                                    // Exercise completed
                                    resetBreathingExercise();
                                    breathingText.textContent = 'Complete!';
                                    breathingTimer.textContent = '';
                                    instruction.textContent = 'Breathing exercise completed. Well done!';
                                    setTimeout(() => {
                                        breathingModal.style.display = 'none';
                                    }, 3000);
                                    return;
                                } else {
                                    // Start next cycle
                                    setBreathingPhase('inhale');
                                }
                                break;
                        }
                    }
                }, 1000); // Update every second
            }

            function setBreathingPhase(phase) {
                currentPhase = phase;
                const breathingText = document.getElementById('breathing-text');
                const breathingTimer = document.getElementById('breathing-timer');
                const instruction = document.getElementById('breathing-instruction');
                const breathingCircle = document.querySelector('.breathing-circle');
                
                switch(phase) {
                    case 'inhale':
                        phaseTimeLeft = 4;
                        currentPhaseDuration = 4;
                        breathingText.textContent = 'Breathe In';
                        breathingTimer.textContent = phaseTimeLeft;
                        instruction.textContent = 'Inhale through your nose for 4 seconds';
                        breathingCircle.style.transform = 'scale(1)';
                        break;
                    case 'hold':
                        phaseTimeLeft = 7;
                        currentPhaseDuration = 7;
                        breathingText.textContent = 'Hold';
                        breathingTimer.textContent = phaseTimeLeft;
                        instruction.textContent = 'Hold your breath for 7 seconds';
                        break;
                    case 'exhale':
                        phaseTimeLeft = 8;
                        currentPhaseDuration = 8;
                        breathingText.textContent = 'Breathe Out';
                        breathingTimer.textContent = phaseTimeLeft;
                        instruction.textContent = 'Exhale slowly through your mouth for 8 seconds';
                        breathingCircle.style.transform = 'scale(1.2)';
                        break;
                }
            }

            function pauseBreathing() {
                isBreathing = false;
                clearInterval(breathingInterval);
            }

            function resetBreathingExercise() {
                pauseBreathing();
                currentPhase = 'ready';
                cycleCount = 0;
                document.getElementById('cycle-count').textContent = cycleCount;
                document.querySelector('.breathing-circle').style.transform = 'scale(1)';
                document.getElementById('breathing-text').textContent = 'Ready';
                document.getElementById('breathing-timer').textContent = '0';
                document.getElementById('breathing-instruction').textContent = 'Click Start to begin';
            }
            
            // Thought Reframing functionality
            function initializeThoughtReframing() {
                const steps = document.querySelectorAll('.thought-step');
                steps.forEach(step => step.classList.remove('active'));
                document.getElementById('thought-step-1').classList.add('active');
                
                const prevBtn = document.getElementById('thought-prev');
                const nextBtn = document.getElementById('thought-next');
                const finishBtn = document.getElementById('thought-finish');
                
                prevBtn.style.display = 'none';
                nextBtn.style.display = 'inline-block';
                finishBtn.style.display = 'none';
                
                let currentStep = 1;
                
                nextBtn.addEventListener('click', function() {
                    if (currentStep < 4) {
                        // Validate current step
                        if (currentStep === 1 && !document.getElementById('negative-thought').value.trim()) {
                            alert('Please write down your negative thought before continuing.');
                            return;
                        }
                        if (currentStep === 2 && !document.getElementById('challenge-thought').value.trim()) {
                            alert('Please challenge your negative thought before continuing.');
                            return;
                        }
                        if (currentStep === 3 && !document.getElementById('balanced-thought').value.trim()) {
                            alert('Please write a balanced thought before continuing.');
                            return;
                        }
                        
                        document.getElementById(`thought-step-${currentStep}`).classList.remove('active');
                        currentStep++;
                        document.getElementById(`thought-step-${currentStep}`).classList.add('active');
                        
                        if (currentStep === 4) {
                            // Update the review step with the collected thoughts
                            document.getElementById('original-display').textContent = document.getElementById('negative-thought').value;
                            document.getElementById('reframed-display').textContent = document.getElementById('balanced-thought').value;
                            
                            nextBtn.style.display = 'none';
                            finishBtn.style.display = 'inline-block';
                        }
                        
                        if (currentStep > 1) {
                            prevBtn.style.display = 'inline-block';
                        }
                    }
                });
                
                prevBtn.addEventListener('click', function() {
                    if (currentStep > 1) {
                        document.getElementById(`thought-step-${currentStep}`).classList.remove('active');
                        currentStep--;
                        document.getElementById(`thought-step-${currentStep}`).classList.add('active');
                        
                        if (currentStep === 1) {
                            prevBtn.style.display = 'none';
                        }
                        
                        if (currentStep < 4) {
                            nextBtn.style.display = 'inline-block';
                            finishBtn.style.display = 'none';
                        }
                    }
                });
                
                finishBtn.addEventListener('click', function() {
                    alert('Great job reframing your thought! Remember this technique when negative thoughts arise.');
                    thoughtsModal.style.display = 'none';
                });
            }
            
            // Gratitude Journal functionality
            function initializeGratitudeJournal() {
                const saveBtn = document.getElementById('save-gratitude');
                const clearBtn = document.getElementById('clear-gratitude');
                const viewHistoryBtn = document.getElementById('view-history');
                const gratitudeText = document.getElementById('gratitude-text');
                const categories = document.querySelectorAll('.category');
                
                // Load previous entries and streak from localStorage
                loadEntries();
                updateStreak();
                
                categories.forEach(category => {
                    category.addEventListener('click', function() {
                        categories.forEach(cat => cat.classList.remove('active'));
                        this.classList.add('active');
                    });
                });
                
                saveBtn.addEventListener('click', function() {
                    const text = gratitudeText.value.trim();
                    const category = document.querySelector('.category.active').getAttribute('data-category');
                    
                    if (text) {
                        saveEntry(text, category);
                        gratitudeText.value = '';
                        loadEntries();
                        updateStreak();
                    } else {
                        alert('Please write something you are grateful for.');
                    }
                });
                
                clearBtn.addEventListener('click', function() {
                    gratitudeText.value = '';
                });
                
                viewHistoryBtn.addEventListener('click', function() {
                    alert('In a full implementation, this would show a complete history of your gratitude entries.');
                });
            }
            
            function saveEntry(text, category) {
                const entries = JSON.parse(localStorage.getItem('gratitudeEntries') || '[]');
                const newEntry = {
                    date: new Date().toLocaleDateString(),
                    content: text,
                    category: category,
                    timestamp: new Date().getTime()
                };
                entries.unshift(newEntry);
                
                // Keep only last 30 entries
                if (entries.length > 30) {
                    entries.pop();
                }
                
                localStorage.setItem('gratitudeEntries', JSON.stringify(entries));
                
                // Update last entry date for streak calculation
                localStorage.setItem('lastGratitudeDate', new Date().toDateString());
            }
            
            function loadEntries() {
                const entries = JSON.parse(localStorage.getItem('gratitudeEntries') || '[]');
                const entriesList = document.getElementById('entries-list');
                
                if (entries.length === 0) {
                    entriesList.innerHTML = '<p>No previous entries yet. Start by writing something you\'re grateful for!</p>';
                    return;
                }
                
                entriesList.innerHTML = '';
                const recentEntries = entries.slice(0, 5); // Show only 5 most recent
                
                recentEntries.forEach(entry => {
                    const entryElement = document.createElement('div');
                    entryElement.className = 'entry-item';
                    entryElement.innerHTML = `
                        <div class="entry-date">${entry.date} • ${entry.category}</div>
                        <div class="entry-content">${entry.content}</div>
                    `;
                    entriesList.appendChild(entryElement);
                });
            }
            
            function updateStreak() {
                const lastDateStr = localStorage.getItem('lastGratitudeDate');
                const streakCount = document.getElementById('streak-count');
                
                if (!lastDateStr) {
                    streakCount.textContent = '0';
                    return;
                }
                
                const lastDate = new Date(lastDateStr);
                const today = new Date();
                const diffTime = Math.abs(today - lastDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                // If last entry was yesterday or today, continue streak
                if (diffDays <= 1) {
                    const currentStreak = parseInt(localStorage.getItem('gratitudeStreak') || '0');
                    // If last entry was today and we already logged today, don't increment
                    if (lastDate.toDateString() !== today.toDateString()) {
                        localStorage.setItem('gratitudeStreak', currentStreak + 1);
                        streakCount.textContent = (currentStreak + 1).toString();
                    } else {
                        streakCount.textContent = currentStreak.toString();
                    }
                } else {
                    // Streak broken
                    localStorage.setItem('gratitudeStreak', '1');
                    streakCount.textContent = '1';
                }
            }
            
            // Mood Tracker functionality
            function initializeMoodTracker() {
                const moodOptions = document.querySelectorAll('.mood-option');
                const intensitySlider = document.getElementById('mood-intensity');
                const intensityValue = document.getElementById('intensity-value');
                const saveMoodBtn = document.getElementById('save-mood');
                const moodNotes = document.getElementById('mood-notes');
                
                let selectedMood = null;
                
                moodOptions.forEach(option => {
                    option.addEventListener('click', function() {
                        moodOptions.forEach(opt => opt.classList.remove('active'));
                        this.classList.add('active');
                        selectedMood = this.getAttribute('data-mood');
                    });
                });
                
                intensitySlider.addEventListener('input', function() {
                    intensityValue.textContent = this.value;
                });
                
                saveMoodBtn.addEventListener('click', function() {
                    if (!selectedMood) {
                        alert('Please select a mood first.');
                        return;
                    }
                    
                    const moodEntry = {
                        mood: selectedMood,
                        intensity: parseInt(intensitySlider.value),
                        notes: moodNotes.value,
                        date: new Date().toLocaleDateString(),
                        time: new Date().toLocaleTimeString(),
                        timestamp: new Date().getTime()
                    };
                    
                    saveMoodEntry(moodEntry);
                    moodNotes.value = '';
                    updateMoodChart();
                    alert('Mood entry saved!');
                });
                
                updateMoodChart();
            }
            
            function saveMoodEntry(entry) {
                const entries = JSON.parse(localStorage.getItem('moodEntries') || '[]');
                entries.unshift(entry);
                
                // Keep only last 50 entries
                if (entries.length > 50) {
                    entries.pop();
                }
                
                localStorage.setItem('moodEntries', JSON.stringify(entries));
            }
            
            function updateMoodChart() {
                const entries = JSON.parse(localStorage.getItem('moodEntries') || '[]');
                const moodChart = document.getElementById('mood-chart');
                const historyList = document.getElementById('mood-history-list');
                
                // Clear previous content
                moodChart.innerHTML = '';
                historyList.innerHTML = '';
                
                if (entries.length === 0) {
                    moodChart.innerHTML = '<p>No mood data yet. Start tracking your mood!</p>';
                    historyList.innerHTML = '<p>No mood history yet.</p>';
                    return;
                }
                
                // Get last 7 days of entries for the chart
                const lastWeekEntries = entries.slice(0, 7).reverse();
                
                // Create mood bars for the chart
                lastWeekEntries.forEach(entry => {
                    const bar = document.createElement('div');
                    bar.className = 'mood-bar';
                    bar.style.height = `${entry.intensity * 15}px`;
                    
                    const label = document.createElement('div');
                    label.className = 'mood-bar-label';
                    label.textContent = entry.date.split('/').slice(0, 2).join('/');
                    
                    bar.appendChild(label);
                    moodChart.appendChild(bar);
                });
                
                // Show recent entries in history list
                const recentEntries = entries.slice(0, 5);
                recentEntries.forEach(entry => {
                    const entryElement = document.createElement('div');
                    entryElement.className = 'entry-item';
                    entryElement.innerHTML = `
                        <div class="entry-date">${entry.date} at ${entry.time}</div>
                        <div class="entry-content">
                            <strong>${entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}</strong> 
                            (Intensity: ${entry.intensity}/10)
                            ${entry.notes ? `<br>Notes: ${entry.notes}` : ''}
                        </div>
                    `;
                    historyList.appendChild(entryElement);
                });
            }
            
            // Progressive Relaxation functionality
            let relaxationInterval;
            let isRelaxing = false;
            let currentBodyPart = 0;
            const bodyParts = ['feet', 'calves', 'thighs', 'glutes', 'abdomen', 'chest', 'hands', 'arms', 'shoulders', 'neck', 'face'];
            let tenseTimeLeft = 5;
            
            function initializeRelaxationExercise() {
                const startBtn = document.getElementById('start-relaxation');
                const pauseBtn = document.getElementById('pause-relaxation');
                const resetBtn = document.getElementById('reset-relaxation');
                
                startBtn.addEventListener('click', startRelaxation);
                pauseBtn.addEventListener('click', pauseRelaxation);
                resetBtn.addEventListener('click', resetRelaxationExercise);
                
                resetRelaxationExercise();
            }
            
            function startRelaxation() {
                if (isRelaxing) return;
                
                isRelaxing = true;
                updateBodyPartDisplay();
                
                relaxationInterval = setInterval(() => {
                    if (!isRelaxing) return;
                    
                    tenseTimeLeft--;
                    document.getElementById('tense-timer').textContent = tenseTimeLeft;
                    
                    // Update progress bar
                    const progress = (5 - tenseTimeLeft) / 5 * 100;
                    document.getElementById('timer-progress').style.width = `${progress}%`;
                    
                    if (tenseTimeLeft <= 0) {
                        // Move to next body part
                        document.getElementById(bodyParts[currentBodyPart]).classList.remove('active');
                        currentBodyPart++;
                        
                        if (currentBodyPart >= bodyParts.length) {
                            // Exercise completed
                            resetRelaxationExercise();
                            document.getElementById('current-part').textContent = 'Exercise Complete!';
                            document.getElementById('relax-instruction').textContent = 'Take a moment to enjoy the feeling of relaxation throughout your body.';
                            document.getElementById('tense-timer').textContent = '';
                            document.getElementById('timer-progress').style.width = '0%';
                            
                            setTimeout(() => {
                                relaxationModal.style.display = 'none';
                            }, 5000);
                            return;
                        }
                        
                        // Reset timer for next body part
                        tenseTimeLeft = 5;
                        updateBodyPartDisplay();
                    }
                }, 1000);
            }
            
            function updateBodyPartDisplay() {
                const currentPartElement = document.getElementById(bodyParts[currentBodyPart]);
                currentPartElement.classList.add('active');
                
                document.getElementById('current-part').textContent = `Tensing: ${capitalizeFirstLetter(bodyParts[currentBodyPart])}`;
                document.getElementById('relax-instruction').textContent = `Tense your ${bodyParts[currentBodyPart]} muscles for 5 seconds, then release`;
                document.getElementById('tense-timer').textContent = tenseTimeLeft;
                document.getElementById('timer-progress').style.width = '0%';
            }
            
            function capitalizeFirstLetter(string) {
                return string.charAt(0).toUpperCase() + string.slice(1);
            }
            
            function pauseRelaxation() {
                isRelaxing = false;
                clearInterval(relaxationInterval);
            }
            
            function resetRelaxationExercise() {
                pauseRelaxation();
                currentBodyPart = 0;
                tenseTimeLeft = 5;
                
                // Reset all body parts
                bodyParts.forEach(part => {
                    document.getElementById(part).classList.remove('active');
                });
                
                document.getElementById('feet').classList.add('active');
                document.getElementById('current-part').textContent = 'Starting with feet';
                document.getElementById('relax-instruction').textContent = 'Tense your feet muscles for 5 seconds, then release';
                document.getElementById('tense-timer').textContent = '5';
                document.getElementById('timer-progress').style.width = '0%';
            }

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