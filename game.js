// ABOUTME: Main game logic for the States & Provinces educational game
// ABOUTME: Handles game modes, question generation, and interactive map functionality

class StatesGame {
    constructor() {
        this.currentMode = 'us';
        this.correctAnswers = 0;
        this.wrongAnswers = 0;
        this.currentQuestion = 0;
        this.questions = [];
        this.svgElement = null;
        this.sounds = new RetroSounds();
        this.voice = new EdgeyVoice();
        
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
        // Mode selection with sound
        document.getElementById('us-mode').addEventListener('click', () => {
            this.sounds.playButtonHover();
            this.setMode('us');
        });
        document.getElementById('canada-mode').addEventListener('click', () => {
            this.sounds.playButtonHover();
            this.setMode('canada');
        });
        document.getElementById('both-mode').addEventListener('click', () => {
            this.sounds.playButtonHover();
            this.setMode('both');
        });
        
        // Game controls with sound
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('next-btn').addEventListener('click', () => {
            this.sounds.playNextQuestion();
            this.nextQuestion();
        });
        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.sounds.playButtonHover();
            this.resetGame();
        });
        
        // Sound toggle
        document.getElementById('sound-toggle').addEventListener('click', () => {
            const isEnabled = this.sounds.toggleSound();
            const button = document.getElementById('sound-toggle');
            button.textContent = isEnabled ? '🔊' : '🔇';
            button.classList.toggle('muted', !isEnabled);
            if (isEnabled) this.sounds.playButtonHover();
        });
        
        // Voice toggle
        document.getElementById('voice-toggle').addEventListener('click', () => {
            const isEnabled = this.voice.toggle();
            const button = document.getElementById('voice-toggle');
            button.textContent = isEnabled ? '🗣️' : '🤐';
            button.classList.toggle('muted', !isEnabled);
        });
        
        // Add hover sounds to buttons
        this.addButtonHoverSounds();
    }
    
    addButtonHoverSounds() {
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                if (button.id !== 'sound-toggle') {
                    this.sounds.playButtonHover();
                }
            });
        });
    }
    
    updateScoreboard() {
        const remaining = this.questions.length - this.currentQuestion;
        
        // Update main scoreboard (pre-game screen)
        document.getElementById('correct-count').textContent = this.correctAnswers;
        document.getElementById('wrong-count').textContent = this.wrongAnswers;
        document.getElementById('remaining-count').textContent = remaining;
        
        // Update mini scoreboard (in-game)
        document.getElementById('correct-mini').textContent = this.correctAnswers;
        document.getElementById('wrong-mini').textContent = this.wrongAnswers;
        document.getElementById('remaining-mini').textContent = remaining;
    }
    
    setMode(mode) {
        this.currentMode = mode;
        
        // Update UI
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${mode}-mode`).classList.add('active');
    }
    
    startGame() {
        this.sounds.playGameStart();
        
        this.correctAnswers = 0;
        this.wrongAnswers = 0;
        this.currentQuestion = 0;
        this.generateQuestions();
        
        this.updateScoreboard();
        
        document.querySelector('.game-info').classList.add('hidden');
        document.getElementById('game-area').classList.remove('hidden');
        
        this.showQuestion();
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
        
        // Highlight current state/province
        const targetElement = this.svgElement.querySelector(`#${question.id}`);
        if (targetElement) {
            targetElement.style.fill = '#ff6b6b';
            targetElement.style.stroke = '#d63031';
            targetElement.style.strokeWidth = '2';
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
            feedback.innerHTML = '<span class="correct-feedback">✅ Correct!</span>';
        } else {
            this.sounds.playIncorrect();
            this.voice.speakIncorrect(correctAnswer);
            feedback.innerHTML = `<span class="incorrect-feedback">❌ Incorrect. The correct answer is ${correctAnswer}.</span>`;
        }
        
        // Show next button
        document.getElementById('next-btn').classList.remove('hidden');
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
        
        // Reset state/province colors
        const allPaths = this.svgElement.querySelectorAll('[id^="US-"], [id^="CA-"]');
        allPaths.forEach(path => {
            path.style.fill = '#e0e0e0';
            path.style.stroke = '#999';
            path.style.strokeWidth = '1';
        });
    }
    
    endGame() {
        this.sounds.playGameComplete();
        
        // Calculate percentage
        const percentage = this.questions.length > 0 
            ? Math.round((this.correctAnswers / this.questions.length) * 100) 
            : 0;
        
        // Update final scoreboard
        document.getElementById('final-correct').textContent = this.correctAnswers;
        document.getElementById('final-wrong').textContent = this.wrongAnswers;
        document.getElementById('final-total').textContent = this.questions.length;
        document.getElementById('final-percentage').textContent = percentage;
        
        document.getElementById('game-area').classList.add('hidden');
        document.getElementById('game-complete').classList.remove('hidden');
        
        this.resetMapColors();
    }
    
    resetGame() {
        document.getElementById('game-complete').classList.add('hidden');
        document.querySelector('.game-info').classList.remove('hidden');
        document.getElementById('start-btn').textContent = 'Play Again';
        
        // Reset scoreboard for next game
        this.correctAnswers = 0;
        this.wrongAnswers = 0;
        this.currentQuestion = 0;
        this.updateScoreboard();
        
        this.resetMapColors();
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new StatesGame();
});