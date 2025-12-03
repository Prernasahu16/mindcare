  // Main Mood Tracker JavaScript
        document.addEventListener('DOMContentLoaded', function() {
            // DOM Elements
            const moodSlider = document.getElementById('mood-slider');
            const moodValue = document.getElementById('mood-value');
            const moodEmoji = document.getElementById('mood-emoji');
            const moodCards = document.querySelectorAll('.mood-card');
            const reasonTags = document.getElementById('reason-tags');
            const moodNotes = document.getElementById('mood-notes');
            const submitBtn = document.getElementById('submit-mood');
            const moodSummary = document.getElementById('mood-summary');
            const summaryContent = document.getElementById('summary-content');
            const activityCards = document.getElementById('activity-cards');
            const chartBtns = document.querySelectorAll('.chart-btn');
            const currentStreak = document.getElementById('current-streak');
            const monthEntries = document.getElementById('month-entries');
            const totalEntries = document.getElementById('total-entries');
            const achievementsGrid = document.getElementById('achievements-grid');
            const analysisContent = document.getElementById('analysis-content');

            // Mood data
            let currentMood = 5;
            let selectedReasons = [];
            let moodHistory = [];

            // Emoji mapping
            const emojiMap = {
                1: '😫',
                2: '😞',
                3: '😐',
                4: '🙂',
                5: '😄',
                6: '🤩',
                7: '🤩',
                8: '🤩',
                9: '🤩',
                10: '🤩'
            };

            // Reason tags based on mood
            const lowMoodReasons = [
                'Stress', 'Work', 'Family', 'Health', 'Loneliness', 
                'Studies', 'Financial', 'Relationships', 'Sleep', 'Weather'
            ];

            const highMoodReasons = [
                'Good news', 'Relaxed', 'Productive', 'Social', 'Healthy',
                'Exercise', 'Nature', 'Achievement', 'Creative', 'Rest'
            ];

            // Activity suggestions based on mood
            const lowMoodActivities = [
                {
                    icon: '🧘',
                    title: 'Breathing Exercise',
                    description: 'Try a 2-minute breathing exercise to calm your mind'
                },
                {
                    icon: '🚶',
                    title: 'Short Walk',
                    description: 'Take a 5-minute walk to refresh your mind'
                },
                {
                    icon: '💧',
                    title: 'Hydrate',
                    description: 'Drink a glass of water to refresh your body'
                },
                {
                    icon: '🌿',
                    title: 'Grounding Technique',
                    description: 'Use the 5-4-3-2-1 method to stay present'
                },
                {
                    icon: '💭',
                    title: 'Positive Affirmations',
                    description: 'Repeat positive statements to shift your mindset'
                }
            ];

            const highMoodActivities = [
                {
                    icon: '📝',
                    title: 'Gratitude Journal',
                    description: 'Write down 3 things you\'re grateful for'
                },
                {
                    icon: '🎯',
                    title: 'Set Goals',
                    description: 'Use this positive energy to plan your next steps'
                },
                {
                    icon: '🎨',
                    title: 'Creative Activity',
                    description: 'Express yourself through art, music, or writing'
                },
                {
                    icon: '🤝',
                    title: 'Connect with Others',
                    description: 'Share your positive mood with friends or family'
                },
                {
                    icon: '🏃',
                    title: 'Physical Activity',
                    description: 'Channel your energy into exercise or movement'
                }
            ];

            // Initialize the page
            function init() {
                updateMoodDisplay();
                updateReasonTags();
                updateActivitySuggestions();
                loadMoodHistory();
                setupEventListeners();
            }

            // Set up event listeners
            function setupEventListeners() {
                // Mood slider
                moodSlider.addEventListener('input', function() {
                    currentMood = parseInt(this.value);
                    updateMoodDisplay();
                    updateReasonTags();
                    updateActivitySuggestions();
                });

                // Mood cards
                moodCards.forEach(card => {
                    card.addEventListener('click', function() {
                        const value = parseInt(this.getAttribute('data-value'));
                        currentMood = value;
                        moodSlider.value = value;
                        updateMoodDisplay();
                        updateReasonTags();
                        updateActivitySuggestions();
                        
                        // Update active card
                        moodCards.forEach(c => c.classList.remove('active'));
                        this.classList.add('active');
                    });
                });

                // Submit button
                submitBtn.addEventListener('click', saveMoodEntry);

                // Chart period buttons
                chartBtns.forEach(btn => {
                    btn.addEventListener('click', function() {
                        chartBtns.forEach(b => b.classList.remove('active'));
                        this.classList.add('active');
                        const period = parseInt(this.getAttribute('data-period'));
                        updateMoodChart(period);
                    });
                });
            }

            // Update mood display based on current value
            function updateMoodDisplay() {
                moodValue.textContent = currentMood;
                moodEmoji.textContent = emojiMap[currentMood] || '😐';
                
                // Update active mood card
                moodCards.forEach(card => {
                    const cardValue = parseInt(card.getAttribute('data-value'));
                    if (cardValue === currentMood) {
                        card.classList.add('active');
                    } else {
                        card.classList.remove('active');
                    }
                });
            }

            // Update reason tags based on current mood
            function updateReasonTags() {
                reasonTags.innerHTML = '';
                selectedReasons = []; // Reset selected reasons
                const reasons = currentMood <= 4 ? lowMoodReasons : highMoodReasons;
                
                reasons.forEach(reason => {
                    const tag = document.createElement('div');
                    tag.className = 'reason-tag';
                    tag.textContent = reason;
                    tag.addEventListener('click', function() {
                        this.classList.toggle('active');
                        if (this.classList.contains('active')) {
                            selectedReasons.push(reason);
                        } else {
                            selectedReasons = selectedReasons.filter(r => r !== reason);
                        }
                    });
                    reasonTags.appendChild(tag);
                });
            }

            // Update activity suggestions based on current mood
            function updateActivitySuggestions() {
                activityCards.innerHTML = '';
                const activities = currentMood <= 4 ? lowMoodActivities : highMoodActivities;
                
                activities.forEach(activity => {
                    const card = document.createElement('div');
                    card.className = 'activity-card';
                    card.innerHTML = `
                        <div class="activity-icon">${activity.icon}</div>
                        <div class="activity-title">${activity.title}</div>
                        <div class="activity-desc">${activity.description}</div>
                    `;
                    activityCards.appendChild(card);
                });
            }

            // Save mood entry to localStorage
            function saveMoodEntry() {
                if (selectedReasons.length === 0) {
                    alert('Please select at least one reason for your mood.');
                    return;
                }

                const moodEntry = {
                    value: currentMood,
                    reasons: selectedReasons,
                    notes: moodNotes.value,
                    timestamp: new Date().toISOString(),
                    date: new Date().toLocaleDateString()
                };

                // Get existing entries or initialize empty array
                const existingEntries = JSON.parse(localStorage.getItem('mindcare_moodEntries') || '[]');
                
                // Add new entry at the beginning
                existingEntries.unshift(moodEntry);
                
                // Save back to localStorage
                localStorage.setItem('mindcare_moodEntries', JSON.stringify(existingEntries));
                
                alert('Mood entry saved successfully!');
                showMoodSummary(moodEntry);
                resetForm();
                loadMoodHistory();
            }

            // Show mood summary after submission
            function showMoodSummary(entry) {
                let summaryText = '';
                
                if (entry.value <= 3) {
                    summaryText = `You're feeling low today (${entry.value}/10). It seems you're ${entry.reasons.join(', ').toLowerCase()}. Try some of the suggested activities to lift your mood. Remember, it's okay to not feel okay sometimes.`;
                } else if (entry.value <= 7) {
                    summaryText = `You're feeling neutral today (${entry.value}/10). ${entry.reasons.length > 0 ? `Your mood is influenced by ${entry.reasons.join(', ').toLowerCase()}.` : ''} Consider trying some activities to maintain or improve your mood.`;
                } else {
                    summaryText = `You're feeling great today (${entry.value}/10)! ${entry.reasons.length > 0 ? `Your positive mood is connected to ${entry.reasons.join(', ').toLowerCase()}.` : ''} Keep up the good energy and consider sharing it with others!`;
                }

                summaryContent.textContent = summaryText;
                moodSummary.style.display = 'block';
                
                // Auto-hide summary after 10 seconds
                setTimeout(() => {
                    moodSummary.style.display = 'none';
                }, 10000);
            }

            // Reset form after submission
            function resetForm() {
                selectedReasons = [];
                moodNotes.value = '';
                currentMood = 5;
                moodSlider.value = 5;
                updateMoodDisplay();
                updateReasonTags();
                
                // Reset reason tags
                document.querySelectorAll('.reason-tag').forEach(tag => {
                    tag.classList.remove('active');
                });
            }

            // Load mood history from localStorage
            function loadMoodHistory() {
                const entries = JSON.parse(localStorage.getItem('mindcare_moodEntries') || '[]');
                moodHistory = entries;
                
                updateMoodChart(7);
                updateStreaksAndStats();
                updateAchievements();
                updateWeeklyAnalysis();
                updateMoodCalendar();
                updateMoodHeatmap();
            }

            // Update mood chart
            function updateMoodChart(period) {
                const ctx = document.getElementById('mood-chart').getContext('2d');
                
                // Filter data for selected period
                const filteredData = moodHistory.slice(0, period).reverse();
                
                // If no data, show empty state
                if (filteredData.length === 0) {
                    ctx.font = '16px Arial';
                    ctx.fillStyle = '#666';
                    ctx.textAlign = 'center';
                    ctx.fillText('No mood data yet. Start tracking your mood!', 300, 150);
                    return;
                }
                
                const labels = filteredData.map(entry => {
                    const date = new Date(entry.timestamp);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                });
                
                const data = filteredData.map(entry => entry.value);
                
                // Destroy existing chart if it exists
                if (window.moodChartInstance) {
                    window.moodChartInstance.destroy();
                }
                
                // Create new chart
                window.moodChartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Mood Level',
                            data: data,
                            borderColor: '#4a6fa5',
                            backgroundColor: 'rgba(74, 111, 165, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: 10,
                                ticks: {
                                    stepSize: 1
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: false
                            }
                        }
                    }
                });
            }

            // Update streaks and statistics
            function updateStreaksAndStats() {
                // Calculate current streak
                let streak = 0;
                const today = new Date().toDateString();
                
                for (let i = 0; i < moodHistory.length; i++) {
                    const entryDate = new Date(moodHistory[i].timestamp).toDateString();
                    if (entryDate === today && i === 0) {
                        streak = 1;
                        continue;
                    }
                    
                    if (i === 0) continue;
                    
                    const prevDate = new Date(moodHistory[i-1].timestamp);
                    const currentDate = new Date(moodHistory[i].timestamp);
                    const diffTime = Math.abs(currentDate - prevDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (diffDays === 1) {
                        streak++;
                    } else {
                        break;
                    }
                }
                
                currentStreak.textContent = streak;
                
                // Calculate monthly entries
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();
                const monthEntriesCount = moodHistory.filter(entry => {
                    const entryDate = new Date(entry.timestamp);
                    return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
                }).length;
                
                monthEntries.textContent = monthEntriesCount;
                
                // Total entries
                totalEntries.textContent = moodHistory.length;
            }

            // Update achievements
            function updateAchievements() {
                const achievements = [
                    {
                        id: 'first_entry',
                        title: 'Getting Started',
                        description: 'Log your first mood entry',
                        icon: '🎯',
                        earned: moodHistory.length >= 1
                    },
                    {
                        id: 'weekly_streak',
                        title: 'Consistent Tracker',
                        description: 'Log mood for 7 consecutive days',
                        icon: '🔥',
                        earned: parseInt(currentStreak.textContent) >= 7
                    },
                    {
                        id: 'monthly_tracker',
                        title: 'Monthly Tracker',
                        description: 'Log mood 20 times in a month',
                        icon: '📅',
                        earned: parseInt(monthEntries.textContent) >= 20
                    },
                    {
                        id: 'positive_week',
                        title: 'Positive Week',
                        description: 'Average mood above 7 for a week',
                        icon: '⭐',
                        earned: checkPositiveWeek()
                    }
                ];
                
                achievementsGrid.innerHTML = '';
                
                achievements.forEach(achievement => {
                    const card = document.createElement('div');
                    card.className = `achievement-card ${achievement.earned ? 'earned' : ''}`;
                    card.innerHTML = `
                        <div class="achievement-icon">${achievement.icon}</div>
                        <div class="achievement-title">${achievement.title}</div>
                        <div class="achievement-desc">${achievement.description}</div>
                    `;
                    achievementsGrid.appendChild(card);
                });
            }

            // Check if user had a positive week
            function checkPositiveWeek() {
                if (moodHistory.length < 7) return false;
                
                const lastWeek = moodHistory.slice(0, 7);
                const average = lastWeek.reduce((sum, entry) => sum + entry.value, 0) / 7;
                return average > 7;
            }

            // Update weekly analysis
            function updateWeeklyAnalysis() {
                if (moodHistory.length < 2) {
                    analysisContent.innerHTML = '<div class="analysis-card"><div class="analysis-value">📊</div><div class="analysis-label">Not enough data for analysis yet</div></div>';
                    return;
                }
                
                const lastWeek = moodHistory.slice(0, 7);
                const previousWeek = moodHistory.slice(7, 14);
                
                const currentAvg = lastWeek.reduce((sum, entry) => sum + entry.value, 0) / lastWeek.length;
                const previousAvg = previousWeek.length > 0 ? 
                    previousWeek.reduce((sum, entry) => sum + entry.value, 0) / previousWeek.length : currentAvg;
                
                const moodChange = previousWeek.length > 0 ? 
                    ((currentAvg - previousAvg) / previousAvg * 100).toFixed(1) : 0;
                
                const highMoodDays = lastWeek.filter(entry => entry.value >= 7).length;
                const lowMoodDays = lastWeek.filter(entry => entry.value <= 4).length;
                
                analysisContent.innerHTML = `
                    <div class="analysis-card">
                        <div class="analysis-value">${currentAvg.toFixed(1)}</div>
                        <div class="analysis-label">Average Mood</div>
                    </div>
                    <div class="analysis-card">
                        <div class="analysis-value" style="color: ${moodChange >= 0 ? '#2ecc71' : '#e74c3c'}">${moodChange}%</div>
                        <div class="analysis-label">Weekly Change</div>
                    </div>
                    <div class="analysis-card">
                        <div class="analysis-value">${highMoodDays}</div>
                        <div class="analysis-label">High Mood Days</div>
                    </div>
                    <div class="analysis-card">
                        <div class="analysis-value">${lowMoodDays}</div>
                        <div class="analysis-label">Low Mood Days</div>
                    </div>
                `;
            }

            // Update mood calendar
            function updateMoodCalendar() {
                const calendar = document.getElementById('mood-calendar');
                
                if (moodHistory.length === 0) {
                    calendar.innerHTML = '<p>No mood data yet. Start tracking to see your calendar!</p>';
                    return;
                }
                
                // Simple calendar implementation
                const today = new Date();
                const month = today.getMonth();
                const year = today.getFullYear();
                
                let calendarHTML = `
                    <div class="calendar-header">
                        <button class="calendar-nav">←</button>
                        <h4>${today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h4>
                        <button class="calendar-nav">→</button>
                    </div>
                    <div class="calendar-grid">
                        <div class="calendar-day header">Sun</div>
                        <div class="calendar-day header">Mon</div>
                        <div class="calendar-day header">Tue</div>
                        <div class="calendar-day header">Wed</div>
                        <div class="calendar-day header">Thu</div>
                        <div class="calendar-day header">Fri</div>
                        <div class="calendar-day header">Sat</div>
                `;
                
                // Add some sample mood days for demonstration
                for (let i = 1; i <= 31; i++) {
                    const randomMood = Math.floor(Math.random() * 10) + 1;
                    calendarHTML += `<div class="calendar-day mood-${randomMood}">${i}</div>`;
                }
                
                calendarHTML += '</div>';
                calendar.innerHTML = calendarHTML;
            }

            // Update mood heatmap
            function updateMoodHeatmap() {
                const heatmap = document.getElementById('heatmap-container');
                
                if (moodHistory.length === 0) {
                    heatmap.innerHTML = '<p>No mood data yet. Start tracking to see your heatmap!</p>';
                    return;
                }
                
                // Simple heatmap implementation
                let heatmapHTML = '';
                
                for (let week = 0; week < 4; week++) {
                    heatmapHTML += '<div class="heatmap-week">';
                    for (let day = 0; day < 7; day++) {
                        const randomMood = Math.floor(Math.random() * 10) + 1;
                        heatmapHTML += `<div class="heatmap-day mood-${randomMood}"></div>`;
                    }
                    heatmapHTML += '</div>';
                }
                
                heatmap.innerHTML = heatmapHTML;
            }

            // Initialize the application
            init();
        });