// ABOUTME: Main game logic for the States & Provinces educational game
// ABOUTME: Handles game modes, question generation, and interactive map functionality

class StatesGame {
    constructor() {
        this.currentMode = null; // Must be selected before starting
        this.correctAnswers = 0;
        this.wrongAnswers = 0;
        this.currentQuestion = 0;
        this.questions = [];
        this.svgElement = null;
        this.sounds = new RetroSounds();
        this.voice = new EdgeyVoice();
        this.gameStarted = false;
        this.answeredStates = new Map(); // Track correct/incorrect states
        this.svgLoaded = false; // Track if SVG has loaded
        this.difficulty = 'easy'; // 'easy' or 'hard'
        
        // State/Province data mapping
        this.usStates = {
            'US-AL': 'Alabama', 'US-AK': 'Alaska', 'US-AZ': 'Arizona', 'US-AR': 'Arkansas',
            'US-CA': 'California', 'US-CO': 'Colorado', 'US-CT': 'Connecticut', 'US-DE': 'Delaware',
            'US-DC': 'Washington D.C.', 'US-FL': 'Florida', 'US-GA': 'Georgia', 'US-HI': 'Hawaii',
            'US-ID': 'Idaho', 'US-IL': 'Illinois', 'US-IN': 'Indiana', 'US-IA': 'Iowa',
            'US-KS': 'Kansas', 'US-KY': 'Kentucky', 'US-LA': 'Louisiana', 'US-ME': 'Maine',
            'US-MD': 'Maryland', 'US-MA': 'Massachusetts', 'US-MI': 'Michigan', 'US-MN': 'Minnesota',
            'US-MS': 'Mississippi', 'US-MO': 'Missouri', 'US-MT': 'Montana', 'US-NE': 'Nebraska',
            'US-NV': 'Nevada', 'US-NH': 'New Hampshire', 'US-NJ': 'New Jersey', 'US-NM': 'New Mexico',
            'US-NY': 'New York', 'US-NC': 'North Carolina', 'US-ND': 'North Dakota', 'US-OH': 'Ohio',
            'US-OK': 'Oklahoma', 'US-OR': 'Oregon', 'US-PA': 'Pennsylvania', 'US-RI': 'Rhode Island',
            'US-SC': 'South Carolina', 'US-SD': 'South Dakota', 'US-TN': 'Tennessee', 'US-TX': 'Texas',
            'US-UT': 'Utah', 'US-VT': 'Vermont', 'US-VA': 'Virginia', 'US-WA': 'Washington',
            'US-WV': 'West Virginia', 'US-WI': 'Wisconsin', 'US-WY': 'Wyoming'
        };
        
        this.canadianProvinces = {
            'CA-AB': 'Alberta', 'CA-BC': 'British Columbia', 'CA-MB': 'Manitoba', 
            'CA-NB': 'New Brunswick', 'CA-NL': 'Newfoundland and Labrador', 'CA-NS': 'Nova Scotia',
            'CA-NT': 'Northwest Territories', 'CA-NU': 'Nunavut', 'CA-ON': 'Ontario',
            'CA-PE': 'Prince Edward Island', 'CA-QC': 'Quebec', 'CA-SK': 'Saskatchewan',
            'CA-YT': 'Yukon'
        };
        
        this.init();
    }
    
    init() {
        this.loadSVG();
        this.setupEventListeners();
        this.updateScoreboard();
    }
    
    async loadSVG() {
        const mapWrapper = document.getElementById('map-wrapper');
        
        try {
            mapWrapper.innerHTML = '<div style="text-align: center; padding: 20px;">Loading map...</div>';
            
            const response = await fetch('Usa_and_Canada_with_names_natural.svg');
            
            if (!response.ok) {
                throw new Error(`Failed to load SVG: ${response.status} ${response.statusText}`);
            }
            
            const svgText = await response.text();
            
            if (!svgText || svgText.length < 100) {
                throw new Error('SVG file appears to be empty or corrupted');
            }
            
            mapWrapper.innerHTML = svgText;
            
            this.svgElement = mapWrapper.querySelector('svg');
            if (!this.svgElement) {
                throw new Error('No SVG element found in the loaded content');
            }
            
            // Set SVG properties for proper display
            this.svgElement.style.width = '100%';
            this.svgElement.style.height = '100%';
            this.svgElement.removeAttribute('width');
            this.svgElement.removeAttribute('height');
            this.svgElement.setAttribute('viewBox', this.svgElement.getAttribute('viewBox') || '0 0 2289 1744');
            this.svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            
            this.setupMapInteraction();
            
            // Verify we can find states
            const usStates = this.svgElement.querySelectorAll('[id^="US-"]');
            const caProvinces = this.svgElement.querySelectorAll('[id^="CA-"]');
            
            console.log(`Found ${usStates.length} US states and ${caProvinces.length} Canadian provinces`);
            
            if (usStates.length === 0 && caProvinces.length === 0) {
                throw new Error('No states or provinces found in the SVG');
            }
            
            // Mark SVG as loaded
            this.svgLoaded = true;
            
        } catch (error) {
            console.error('Error loading SVG:', error);
            mapWrapper.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #d63031;">
                    <p><strong>Error loading map:</strong></p>
                    <p>${error.message}</p>
                    <p style="font-size: 0.9em; margin-top: 10px;">
                        Make sure you're running this from a web server (not file://)
                    </p>
                </div>
            `;
        }
    }
    
    setupMapInteraction() {
        // Hide all text labels to prevent cheating
        const allText = this.svgElement.querySelectorAll('text');
        allText.forEach(text => {
            text.style.display = 'none';
        });
        
        // Make all states/provinces unselectable by default
        const allPaths = this.svgElement.querySelectorAll('[id^="US-"], [id^="CA-"]');
        allPaths.forEach(path => {
            path.style.fill = '#e0e0e0';
            path.style.stroke = '#999';
            path.style.strokeWidth = '1';
        });
    }
    
    setupEventListeners() {
        // Helper function to safely add event listener
        const safeAddListener = (id, event, callback) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener(event, callback);
            } else {
                console.warn(`Element with id '${id}' not found`);
            }
        };
        
        // Difficulty selection buttons
        safeAddListener('select-easy', 'click', () => {
            this.sounds.playButtonHover();
            this.selectDifficulty('easy');
        });
        safeAddListener('select-hard', 'click', () => {
            this.sounds.playButtonHover();
            this.selectDifficulty('hard');
        });
        
        // Mode selection buttons
        safeAddListener('select-us', 'click', () => {
            this.sounds.playButtonHover();
            this.selectMode('us');
        });
        safeAddListener('select-canada', 'click', () => {
            this.sounds.playButtonHover();
            this.selectMode('canada');
        });
        safeAddListener('select-both', 'click', () => {
            this.sounds.playButtonHover();
            this.selectMode('both');
        });
        
        // Game controls (start button removed - game starts automatically)
        safeAddListener('next-btn', 'click', () => {
            this.sounds.playNextQuestion();
            this.nextQuestion();
        });
        safeAddListener('play-again-btn', 'click', () => {
            this.sounds.playButtonHover();
            this.resetGame();
        });
        safeAddListener('back-to-menu', 'click', () => {
            this.sounds.playButtonHover();
            this.backToMenu();
        });
        
        // Text input for hard mode
        safeAddListener('submit-answer-btn', 'click', () => {
            this.sounds.playButtonHover();
            this.submitTextAnswer();
        });
        
        // Allow Enter key to submit answer
        safeAddListener('text-answer-input', 'keypress', (event) => {
            if (event.key === 'Enter') {
                this.submitTextAnswer();
            }
        });
        
        // Control buttons (always visible)
        safeAddListener('sound-toggle', 'click', () => {
            const isEnabled = this.sounds.toggleSound();
            const button = document.getElementById('sound-toggle');
            if (button) {
                button.textContent = isEnabled ? '🔊' : '🔇';
                button.classList.toggle('muted', !isEnabled);
                if (isEnabled) this.sounds.playButtonHover();
            }
        });
        
        safeAddListener('voice-toggle', 'click', () => {
            const isEnabled = this.voice.toggle();
            const button = document.getElementById('voice-toggle');
            if (button) {
                button.textContent = isEnabled ? '🗣️' : '🤐';
                button.classList.toggle('muted', !isEnabled);
            }
        });
        
        // Add hover sounds to buttons
        this.addButtonHoverSounds();
    }
    
    addButtonHoverSounds() {
        // Wait a bit to ensure DOM is ready
        setTimeout(() => {
            const buttons = document.querySelectorAll('button');
            buttons.forEach(button => {
                if (button && typeof button.addEventListener === 'function') {
                    button.addEventListener('mouseenter', () => {
                        if (!button.id.includes('toggle')) {
                            this.sounds.playButtonHover();
                        }
                    });
                }
            });
        }, 100);
    }
    
    selectDifficulty(difficulty) {
        this.difficulty = difficulty;
        
        // Update button states
        const easyBtn = document.getElementById('select-easy');
        const hardBtn = document.getElementById('select-hard');
        
        if (easyBtn && hardBtn) {
            if (difficulty === 'easy') {
                easyBtn.classList.add('active');
                hardBtn.classList.remove('active');
            } else {
                hardBtn.classList.add('active');
                easyBtn.classList.remove('active');
            }
        }
    }
    
    // Calculate Levenshtein distance between two strings
    levenshteinDistance(str1, str2) {
        const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
        
        for (let i = 0; i <= str1.length; i++) {
            matrix[0][i] = i;
        }
        
        for (let j = 0; j <= str2.length; j++) {
            matrix[j][0] = j;
        }
        
        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1,
                    matrix[j - 1][i] + 1,
                    matrix[j - 1][i - 1] + indicator
                );
            }
        }
        
        return matrix[str2.length][str1.length];
    }
    
    // Get a funny encouraging phrase for close answers
    getCloseAnswerPhrase() {
        const phrases = [
            "So close you could taste it! 🎯",
            "Almost there, geography wizard! 🧙‍♂️",
            "You're in the right zip code! 📮",
            "Close enough for horseshoes! 🐴",
            "Your spelling teacher would be proud-ish! 📝",
            "Geography: A+, Spelling: needs work! 📚",
            "Right idea, wrong execution! 💡",
            "You were thisclose! 🤏",
            "Almost nailed it! 🔨",
            "So near, yet so far! 🎢"
        ];
        return phrases[Math.floor(Math.random() * phrases.length)];
    }
    
    submitTextAnswer() {
        const input = document.getElementById('text-answer-input');
        if (!input) return;
        
        const userAnswer = input.value.trim();
        if (!userAnswer) return;
        
        const currentQuestion = this.questions[this.currentQuestion];
        const correctAnswer = currentQuestion.correctAnswer;
        
        // Normalize both answers for comparison
        const normalizedUser = userAnswer.toLowerCase();
        const normalizedCorrect = correctAnswer.toLowerCase();
        
        const isCorrect = normalizedUser === normalizedCorrect;
        let feedback = '';
        
        if (isCorrect) {
            feedback = '<span class="correct-feedback">✅ Correct!</span>';
        } else {
            // Check Levenshtein distance for close answers
            const distance = this.levenshteinDistance(normalizedUser, normalizedCorrect);
            const maxLength = Math.max(userAnswer.length, correctAnswer.length);
            const similarity = 1 - (distance / maxLength);
            
            if (similarity >= 0.6) { // If 60% similar or better
                const encouragingPhrase = this.getCloseAnswerPhrase();
                feedback = `<span class="close-feedback">🎯 ${encouragingPhrase}<br>The correct answer is: <strong>${correctAnswer}</strong></span>`;
            } else {
                feedback = `<span class="incorrect-feedback">❌ Incorrect. The correct answer is <strong>${correctAnswer}</strong>.</span>`;
            }
        }
        
        // Process the answer
        this.processAnswer(isCorrect, correctAnswer, feedback);
        
        // Disable input and submit button
        input.disabled = true;
        const submitBtn = document.getElementById('submit-answer-btn');
        if (submitBtn) submitBtn.disabled = true;
    }
    
    selectMode(mode) {
        this.currentMode = mode;
        this.showGameInterface();
        
        // Show loading message while waiting for game to start
        const feedback = document.getElementById('feedback');
        if (feedback) {
            feedback.innerHTML = '<div style="text-align: center; color: #00b894;">🎮 Starting game...</div>';
        }
        
        // Wait for SVG to load, then start the game
        this.waitForSVGAndStartGame();
    }
    
    waitForSVGAndStartGame() {
        // If SVG is already loaded, start immediately
        if (this.svgLoaded) {
            setTimeout(() => {
                this.startGame();
            }, 500);
            return;
        }
        
        // Otherwise, check every 100ms until it's loaded
        const checkInterval = setInterval(() => {
            if (this.svgLoaded) {
                clearInterval(checkInterval);
                setTimeout(() => {
                    this.startGame();
                }, 500);
            }
        }, 100);
        
        // Fallback timeout after 10 seconds
        setTimeout(() => {
            clearInterval(checkInterval);
            if (!this.svgLoaded) {
                console.error('SVG failed to load within timeout');
                // Try to start anyway
                this.startGame();
            }
        }, 10000);
    }
    
    showGameInterface() {
        const modeSelection = document.getElementById('mode-selection');
        const gameInterface = document.getElementById('game-interface');
        const startBtn = document.getElementById('start-btn');
        
        if (modeSelection) modeSelection.classList.add('hidden');
        if (gameInterface) gameInterface.classList.remove('hidden');
        
        // Hide the start button since game will start automatically
        if (startBtn) startBtn.classList.add('hidden');
        
        this.updateScoreboard();
    }
    
    backToMenu() {
        this.gameStarted = false;
        this.currentMode = null;
        this.answeredStates.clear();
        this.resetMapColors();
        this.resetZoom();
        
        // Hide game interface and show mode selection
        const gameInterface = document.getElementById('game-interface');
        const modeSelection = document.getElementById('mode-selection');
        
        if (gameInterface) gameInterface.classList.add('hidden');
        if (modeSelection) modeSelection.classList.remove('hidden');
        
        // Reset game state
        this.correctAnswers = 0;
        this.wrongAnswers = 0;
        this.currentQuestion = 0;
        this.questions = [];
        
        // Reset UI elements safely
        const nextBtn = document.getElementById('next-btn');
        const playAgainBtn = document.getElementById('play-again-btn');
        const feedback = document.getElementById('feedback');
        const options = document.getElementById('options');
        
        // Start button stays hidden - will show automatically when mode selected
        if (nextBtn) nextBtn.classList.add('hidden');
        if (playAgainBtn) playAgainBtn.classList.add('hidden');
        if (feedback) feedback.innerHTML = '';
        if (options) options.innerHTML = '';
    }
    
    updateScoreboard() {
        const remaining = this.questions.length - this.currentQuestion;
        
        // Helper function to safely update text content with animation
        const safeUpdateTextWithAnimation = (id, text) => {
            const element = document.getElementById(id);
            if (element) {
                const oldValue = element.textContent;
                element.textContent = text;
                
                // Add pulse animation if value changed
                if (oldValue !== text) {
                    element.classList.add('updated');
                    setTimeout(() => {
                        element.classList.remove('updated');
                    }, 600);
                }
            }
        };
        
        // Update toolbar scoreboard (always visible) with animations
        safeUpdateTextWithAnimation('correct-display', this.correctAnswers);
        safeUpdateTextWithAnimation('wrong-display', this.wrongAnswers);
        safeUpdateTextWithAnimation('remaining-display', remaining);
    }
    
    
    startGame() {
        if (!this.currentMode) return; // Safety check
        if (!this.svgElement) {
            console.error('Cannot start game: SVG not loaded');
            return;
        }
        
        this.sounds.playGameStart();
        this.gameStarted = true;
        
        this.correctAnswers = 0;
        this.wrongAnswers = 0;
        this.currentQuestion = 0;
        this.generateQuestions();
        
        this.updateScoreboard();
        
        // Hide start button, clear any previous game state
        const startBtn = document.getElementById('start-btn');
        const nextBtn = document.getElementById('next-btn');
        const playAgainBtn = document.getElementById('play-again-btn');
        const feedback = document.getElementById('feedback');
        
        if (startBtn) startBtn.classList.add('hidden');
        if (nextBtn) nextBtn.classList.add('hidden');
        if (playAgainBtn) playAgainBtn.classList.add('hidden');
        if (feedback) feedback.innerHTML = '';
        
        // Reset zoom to show full map initially
        this.resetZoom();
        
        // Delay showing first question to allow zoom reset animation
        setTimeout(() => {
            this.showQuestion();
        }, 500);
    }
    
    generateQuestions() {
        let dataset = {};
        
        switch(this.currentMode) {
            case 'us':
                dataset = this.usStates;
                break;
            case 'canada':
                dataset = this.canadianProvinces;
                break;
            case 'both':
                dataset = {...this.usStates, ...this.canadianProvinces};
                break;
        }
        
        this.questions = Object.keys(dataset).map(id => ({
            id: id,
            correctAnswer: dataset[id]
        }));
        
        // Shuffle questions
        for (let i = this.questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.questions[i], this.questions[j]] = [this.questions[j], this.questions[i]];
        }
    }
    
    showQuestion() {
        if (this.currentQuestion >= this.questions.length) {
            this.endGame();
            return;
        }
        
        const question = this.questions[this.currentQuestion];
        
        // Reset map
        this.resetMapColors();
        
        // Highlight current state/province with yellow and marching ants
        const targetElement = this.svgElement.querySelector(`#${question.id}`);
        if (targetElement) {
            targetElement.style.fill = '#ffeb3b';
            targetElement.style.stroke = '#ff9800';
            targetElement.style.strokeWidth = '3';
            targetElement.style.strokeDasharray = '10,5';
            targetElement.style.animation = 'marchingAnts 1s linear infinite';
            targetElement.classList.add('current-state');
            
            // Zoom to the highlighted state/province with a small delay for visual effect
            setTimeout(() => {
                this.zoomToElement(question.id);
            }, 200);
        }
        
        // Generate answer options
        this.generateOptions(question);
        
        // Update scoreboard
        this.updateScoreboard();
        
        // Hide feedback and next button
        document.getElementById('feedback').innerHTML = '';
        document.getElementById('next-btn').classList.add('hidden');
    }
    
    generateOptions(question) {
        const optionsContainer = document.getElementById('options');
        const textInputContainer = document.getElementById('text-input-container');
        
        if (this.difficulty === 'easy') {
            // Show multiple choice buttons
            optionsContainer.classList.remove('hidden');
            textInputContainer.classList.add('hidden');
            
            optionsContainer.innerHTML = '';
            
            let allAnswers = [];
            switch(this.currentMode) {
                case 'us':
                    allAnswers = Object.values(this.usStates);
                    break;
                case 'canada':
                    allAnswers = Object.values(this.canadianProvinces);
                    break;
                case 'both':
                    allAnswers = [...Object.values(this.usStates), ...Object.values(this.canadianProvinces)];
                    break;
            }
            
            // Create 4 options including the correct answer
            const options = [question.correctAnswer];
            
            // Add 3 random wrong answers
            while (options.length < 4) {
                const randomAnswer = allAnswers[Math.floor(Math.random() * allAnswers.length)];
                if (!options.includes(randomAnswer)) {
                    options.push(randomAnswer);
                }
            }
            
            // Shuffle options
            for (let i = options.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [options[i], options[j]] = [options[j], options[i]];
            }
            
            // Create option buttons
            options.forEach(option => {
                const button = document.createElement('button');
                button.className = 'option-btn';
                button.textContent = option;
                button.addEventListener('click', () => this.selectAnswer(option, question.correctAnswer));
                button.addEventListener('mouseenter', () => this.sounds.playButtonHover());
                optionsContainer.appendChild(button);
            });
        } else {
            // Show text input for hard mode
            optionsContainer.classList.add('hidden');
            textInputContainer.classList.remove('hidden');
            
            const input = document.getElementById('text-answer-input');
            const submitBtn = document.getElementById('submit-answer-btn');
            
            if (input) {
                input.value = '';
                input.disabled = false;
                input.focus();
            }
            if (submitBtn) {
                submitBtn.disabled = false;
            }
        }
    }
    
    processAnswer(isCorrect, correctAnswer, feedbackHTML) {
        const currentQuestion = this.questions[this.currentQuestion];
        
        // Store the answer result
        this.answeredStates.set(currentQuestion.id, isCorrect);
        
        // Update the state color on the map
        const stateElement = this.svgElement.querySelector(`#${currentQuestion.id}`);
        if (stateElement) {
            // Remove current state styling
            stateElement.classList.remove('current-state');
            stateElement.style.animation = 'none';
            stateElement.style.strokeDasharray = 'none';
            
            if (isCorrect) {
                stateElement.style.fill = '#4caf50';
                stateElement.style.stroke = '#388e3c';
                stateElement.style.strokeWidth = '2';
            } else {
                stateElement.style.fill = '#f44336';
                stateElement.style.stroke = '#d32f2f';
                stateElement.style.strokeWidth = '2';
            }
        }
        
        // Track answers and update scoreboard
        if (isCorrect) {
            this.correctAnswers++;
        } else {
            this.wrongAnswers++;
        }
        this.updateScoreboard();
        
        // Show feedback with sound and voice
        const feedback = document.getElementById('feedback');
        if (isCorrect) {
            this.sounds.playCorrect();
            this.voice.speakCorrect(correctAnswer);
        } else {
            this.sounds.playIncorrect();
            this.voice.speakIncorrect(correctAnswer);
        }
        
        feedback.innerHTML = feedbackHTML;
        
        // Show next button
        document.getElementById('next-btn').classList.remove('hidden');
    }
    
    selectAnswer(selectedAnswer, correctAnswer) {
        const isCorrect = selectedAnswer === correctAnswer;
        
        // Disable all option buttons
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.disabled = true;
            if (btn.textContent === correctAnswer) {
                btn.classList.add('correct');
            } else if (btn.textContent === selectedAnswer && !isCorrect) {
                btn.classList.add('incorrect');
            }
        });
        
        // Generate feedback HTML
        let feedbackHTML = '';
        if (isCorrect) {
            feedbackHTML = '<span class="correct-feedback">✅ Correct!</span>';
        } else {
            feedbackHTML = `<span class="incorrect-feedback">❌ Incorrect. The correct answer is ${correctAnswer}.</span>`;
        }
        
        this.processAnswer(isCorrect, correctAnswer, feedbackHTML);
    }
    
    nextQuestion() {
        // Stop any ongoing speech
        this.voice.stop();
        this.currentQuestion++;
        this.showQuestion();
    }
    
    resetMapColors() {
        // Hide all text labels to prevent cheating
        const allText = this.svgElement.querySelectorAll('text');
        allText.forEach(text => {
            text.style.display = 'none';
        });
        
        // Reset state/province colors, but preserve answered states
        const allPaths = this.svgElement.querySelectorAll('[id^="US-"], [id^="CA-"]');
        allPaths.forEach(path => {
            // Remove current state styling
            path.classList.remove('current-state');
            path.style.animation = 'none';
            path.style.strokeDasharray = 'none';
            
            // Check if this state has been answered
            const stateId = path.id;
            if (this.answeredStates.has(stateId)) {
                const wasCorrect = this.answeredStates.get(stateId);
                if (wasCorrect) {
                    path.style.fill = '#4caf50';
                    path.style.stroke = '#388e3c';
                    path.style.strokeWidth = '2';
                } else {
                    path.style.fill = '#f44336';
                    path.style.stroke = '#d32f2f';
                    path.style.strokeWidth = '2';
                }
            } else {
                path.style.fill = '#e0e0e0';
                path.style.stroke = '#999';
                path.style.strokeWidth = '1';
            }
        });
    }
    
    // Zoom and pan to focus on a specific state/province
    zoomToElement(elementId) {
        if (!this.svgElement) return;
        
        let element = this.svgElement.querySelector(`#${elementId}`);
        if (!element) {
            console.warn(`Element ${elementId} not found`);
            return;
        }
        
        try {
            // Special handling for Alaska (US-AK) which might be in a group
            if (elementId === 'US-AK' && element.tagName === 'g') {
                // For Alaska group, get all child paths and calculate combined bbox
                const paths = element.querySelectorAll('path');
                if (paths.length > 0) {
                    // Use the first path for bounding box calculation
                    element = paths[0];
                }
            }
            
            // Get the bounding box of the element
            const bbox = element.getBBox();
            
            // Add more generous padding around the element (80% of the element size, minimum 100 units)
            const basePadding = Math.max(bbox.width, bbox.height) * 0.8;
            const minPadding = 100; // Minimum padding for very small states
            const padding = Math.max(basePadding, minPadding);
            
            const viewX = bbox.x - padding;
            const viewY = bbox.y - padding;
            const viewWidth = bbox.width + (padding * 2);
            const viewHeight = bbox.height + (padding * 2);
            
            // Set larger minimum zoom dimensions for less aggressive zoom
            const minZoomWidth = 400;
            const minZoomHeight = 300;
            const finalViewWidth = Math.max(viewWidth, minZoomWidth);
            const finalViewHeight = Math.max(viewHeight, minZoomHeight);
            
            // Get the SVG dimensions
            const svgRect = this.svgElement.getBoundingClientRect();
            const svgAspectRatio = svgRect.width / svgRect.height;
            const bboxAspectRatio = finalViewWidth / finalViewHeight;
            
            // Adjust dimensions to maintain aspect ratio
            let finalWidth = finalViewWidth;
            let finalHeight = finalViewHeight;
            let finalX = viewX - (finalViewWidth - viewWidth) / 2;
            let finalY = viewY - (finalViewHeight - viewHeight) / 2;
            
            if (bboxAspectRatio > svgAspectRatio) {
                // Element is wider, adjust height
                finalHeight = finalWidth / svgAspectRatio;
                finalY = finalY - (finalHeight - finalViewHeight) / 2;
            } else {
                // Element is taller, adjust width
                finalWidth = finalHeight * svgAspectRatio;
                finalX = finalX - (finalWidth - finalViewWidth) / 2;
            }
            
            // Create the new viewBox string
            const newViewBox = `${finalX} ${finalY} ${finalWidth} ${finalHeight}`;
            
            // Animate the viewBox change
            this.animateViewBox(newViewBox);
            
        } catch (error) {
            console.error('Error zooming to element:', error);
            // Fallback: just highlight without zooming
        }
    }
    
    // Reset zoom to show full map
    resetZoom() {
        if (!this.svgElement) return;
        
        // Reset to original viewBox or calculate full bounds
        const originalViewBox = '0 0 2289 1744'; // From SVG dimensions
        this.animateViewBox(originalViewBox);
    }
    
    // Animate viewBox changes smoothly
    animateViewBox(targetViewBox, duration = 800) {
        if (!this.svgElement) return;
        
        const currentViewBox = this.svgElement.getAttribute('viewBox') || '0 0 2289 1744';
        
        // If viewBox is the same, don't animate
        if (currentViewBox === targetViewBox) return;
        
        // Parse viewBox values
        const parseViewBox = (vb) => vb.split(' ').map(parseFloat);
        const current = parseViewBox(currentViewBox);
        const target = parseViewBox(targetViewBox);
        
        // Animation parameters
        const startTime = performance.now();
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease-in-out function for smooth animation
            const easeInOut = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            const easedProgress = easeInOut(progress);
            
            // Interpolate viewBox values
            const interpolated = current.map((start, i) => {
                return start + (target[i] - start) * easedProgress;
            });
            
            // Apply the interpolated viewBox
            const newViewBox = interpolated.join(' ');
            this.svgElement.setAttribute('viewBox', newViewBox);
            
            // Continue animation if not complete
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    endGame() {
        this.sounds.playGameComplete();
        this.gameStarted = false;
        
        // Calculate percentage
        const percentage = this.questions.length > 0 
            ? Math.round((this.correctAnswers / this.questions.length) * 100) 
            : 0;
        
        // Show completion feedback
        const feedbackElement = document.getElementById('feedback');
        feedbackElement.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <h2 style="color: #00b894; margin-bottom: 15px;">🎉 Game Complete!</h2>
                <p style="font-size: 1.2rem; margin-bottom: 10px;">
                    ${this.correctAnswers} / ${this.questions.length} correct (${percentage}%)
                </p>
            </div>
        `;
        
        // Clear options and show play again button
        const options = document.getElementById('options');
        const nextBtn = document.getElementById('next-btn');
        const playAgainBtn = document.getElementById('play-again-btn');
        
        if (options) options.innerHTML = '';
        if (nextBtn) nextBtn.classList.add('hidden');
        if (playAgainBtn) playAgainBtn.classList.remove('hidden');
        
        // Reset map colors and zoom
        this.resetMapColors();
        this.resetZoom();
    }
    
    resetGame() {
        // Reset game state
        this.correctAnswers = 0;
        this.wrongAnswers = 0;
        this.currentQuestion = 0;
        this.gameStarted = false;
        this.questions = [];
        this.answeredStates.clear();
        
        // Reset UI safely
        const nextBtn = document.getElementById('next-btn');
        const playAgainBtn = document.getElementById('play-again-btn');
        const feedback = document.getElementById('feedback');
        const options = document.getElementById('options');
        
        // Start button stays hidden - game will start automatically
        if (nextBtn) nextBtn.classList.add('hidden');
        if (playAgainBtn) playAgainBtn.classList.add('hidden');
        if (feedback) feedback.innerHTML = '';
        if (options) options.innerHTML = '';
        
        this.updateScoreboard();
        
        // Reset map colors and zoom
        this.resetMapColors();
        this.resetZoom();
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new StatesGame();
});