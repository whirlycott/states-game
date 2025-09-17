// ABOUTME: Main game logic for the States & Provinces educational game
// ABOUTME: Handles game modes, question generation, and interactive map functionality

import type { GameMode, Question, Difficulty, ScoreboardData } from './types.js';
import { usStates, canadianProvinces, adjacencyMap } from './data.js';
import { RetroSounds } from '../audio/RetroSounds.js';
import { EdgeyVoice } from '../audio/EdgeyVoice.js';
import { isCloseMatch, normalizeGeographicName, shouldGetRandomSecondChance } from './utils.js';
import { sanitizeSVG, validateGeographicSVG } from '../security/svgSanitizer.js';
import { validateHardModeInput, InputRateLimiter } from '../security/inputValidator.js';
import mapSvg from '../assets/Usa_and_Canada_with_names_natural.svg?url';

export class StatesGame {
    private currentMode: GameMode | null = null;
    private correctAnswers = 0;
    private wrongAnswers = 0;
    private currentQuestion = 0;
    private questions: Question[] = [];
    private svgElement: SVGSVGElement | null = null;
    private sounds: RetroSounds;
    private voice: EdgeyVoice;
    private gameStarted = false;
    private answeredStates = new Map<string, 'correct' | 'incorrect'>();
    private svgLoaded = false;
    private difficulty: Difficulty = 'easy';
    private hasRetried = false;  // Track if user has already used their retry for this question
    private retryType: 'close' | 'lucky' | null = null;  // Track what type of retry was given
    private inputRateLimiter: InputRateLimiter;  // Rate limiter for text input validation
    
    // Color palette for map coloring
    private readonly colorPalette = ['#f3f9b2', '#e39bdb', '#4ca8bc', '#1d27a2', '#4768ae', '#e15c4f', '#fcffcd', '#f560e2'];
    private stateColors = new Map<string, string>();

    constructor() {
        this.sounds = new RetroSounds();
        this.voice = new EdgeyVoice();
        this.inputRateLimiter = new InputRateLimiter(15, 60000); // Max 15 attempts per minute
        this.init();
    }

    private async init(): Promise<void> {
        this.setupEventListeners();
        await this.loadSVGMap();
        this.updateScoreboard();
        this.initializeDefaultDifficulty();
    }

    private initializeDefaultDifficulty(): void {
        // Set easy mode as default active
        document.getElementById('select-easy')?.classList.add('active');
    }

    private setupEventListeners(): void {
        // Difficulty selection buttons
        document.getElementById('select-easy')?.addEventListener('click', () => this.selectDifficulty('easy'));
        document.getElementById('select-hard')?.addEventListener('click', () => this.selectDifficulty('hard'));

        // Mode selection buttons  
        document.getElementById('select-us')?.addEventListener('click', () => this.selectMode('us'));
        document.getElementById('select-canada')?.addEventListener('click', () => this.selectMode('canada'));
        document.getElementById('select-both')?.addEventListener('click', () => this.selectMode('both'));

        // Control buttons
        document.getElementById('sound-toggle')?.addEventListener('click', () => this.toggleSound());
        document.getElementById('voice-toggle')?.addEventListener('click', () => this.toggleVoice());

        // Back to menu button
        document.getElementById('back-to-menu')?.addEventListener('click', () => this.backToMenu());

        // Reset button
        document.getElementById('reset-game')?.addEventListener('click', () => this.resetGame());

        // Next question button
        document.getElementById('next-question')?.addEventListener('click', () => this.nextQuestion());

        // Text input for hard mode
        document.getElementById('submit-answer-btn')?.addEventListener('click', () => this.submitTextAnswer());

        const textInput = document.getElementById('text-answer-input') as HTMLInputElement;
        if (textInput) {
            // Handle Enter key for submission
            textInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    this.submitTextAnswer();
                }
            });

            // Real-time input validation and sanitization
            textInput.addEventListener('input', (event) => {
                const target = event.target as HTMLInputElement;
                const originalValue = target.value;

                // Allow only safe characters for geographic names
                const filteredValue = originalValue.replace(/[^a-zA-Z\s\-'.]/g, '');

                // Limit length
                const truncatedValue = filteredValue.substring(0, 50);

                // Update input if value was changed
                if (truncatedValue !== originalValue) {
                    target.value = truncatedValue;
                    // Show brief feedback if characters were filtered
                    if (filteredValue !== originalValue) {
                        this.showInputError('Only letters, spaces, hyphens, apostrophes, and periods are allowed');
                    }
                }
            });

            // Clear error messages when user starts typing valid input
            textInput.addEventListener('focus', () => {
                this.clearInputError();
            });
        }
    }

    private async loadSVGMap(): Promise<void> {
        try {
            const mapContainer = document.getElementById('map-container');
            if (!mapContainer) throw new Error('Map container not found');

            const response = await fetch(mapSvg);
            if (!response.ok) {
                throw new Error(`Failed to fetch SVG: ${response.status} ${response.statusText}`);
            }

            const svgText = await response.text();

            // Sanitize the SVG content to prevent XSS attacks
            const sanitizedSvg = sanitizeSVG(svgText);

            // Validate that the sanitized SVG is still a valid geographic map
            if (!validateGeographicSVG(sanitizedSvg)) {
                throw new Error('SVG validation failed - content may be corrupted or invalid');
            }

            mapContainer.innerHTML = sanitizedSvg;
            
            this.svgElement = mapContainer.querySelector('svg');
            if (!this.svgElement) throw new Error('SVG element not found');

            // Set SVG properties for proper display and zoom functionality
            this.svgElement.style.width = '100%';
            this.svgElement.style.height = '100%';
            this.svgElement.removeAttribute('width');
            this.svgElement.removeAttribute('height');
            
            // Ensure proper viewBox is set for zoom functionality
            const currentViewBox = this.svgElement.getAttribute('viewBox');
            if (!currentViewBox) {
                this.svgElement.setAttribute('viewBox', '0 0 2289 1744');
            }

            this.setupMapInteraction();
            this.svgLoaded = true;
            console.log('Map loaded successfully with viewBox:', this.svgElement.getAttribute('viewBox'));
        } catch (error) {
            console.error('Error loading SVG map:', error);
        }
    }

    private setupMapInteraction(): void {
        if (!this.svgElement) return;

        // Add click listeners to all state/province paths and groups
        this.svgElement.querySelectorAll<SVGPathElement>('path[id^="US-"], path[id^="CA-"]').forEach(path => {
            path.style.cursor = 'pointer';
            path.addEventListener('click', (e) => this.handleStateClick(e));
            path.addEventListener('mouseenter', (e) => this.handleStateHover(e));
            path.addEventListener('mouseleave', (e) => this.handleStateLeave(e));
        });
        
        // Also add listeners to group elements (like California and Hawaii)
        this.svgElement.querySelectorAll<SVGGElement>('g[id^="US-"], g[id^="CA-"]').forEach(group => {
            group.style.cursor = 'pointer';
            group.addEventListener('click', (e) => this.handleStateClick(e));
            group.addEventListener('mouseenter', (e) => this.handleStateHover(e));
            group.addEventListener('mouseleave', (e) => this.handleStateLeave(e));
        });
    }

    selectDifficulty(difficulty: Difficulty): void {
        this.difficulty = difficulty;
        
        // Update button states
        const easyBtn = document.getElementById('select-easy') as HTMLButtonElement;
        const hardBtn = document.getElementById('select-hard') as HTMLButtonElement;
        
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

    selectMode(region: 'us' | 'canada' | 'both'): void {
        // Create the combined mode string
        this.currentMode = `${region}-${this.difficulty}` as GameMode;
        
        // Add visual feedback before starting game  
        this.updateModeButtonSelection(region);
        
        // Small delay to show selection feedback before transitioning
        setTimeout(() => {
            this.generateQuestions(region);
            this.startGame();
        }, 300);
    }

    private updateModeButtonSelection(selectedMode: 'us' | 'canada' | 'both'): void {
        // Remove active class from all mode buttons
        document.querySelectorAll('.mode-select-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to selected button
        const selectedBtn = document.getElementById(`select-${selectedMode}`);
        if (selectedBtn) {
            selectedBtn.classList.add('active');
        }
    }

    private generateQuestions(region: 'us' | 'canada' | 'both'): void {
        this.questions = [];
        
        let stateData: { [key: string]: string } = {};
        
        switch (region) {
            case 'us':
                stateData = usStates;
                break;
            case 'canada':
                stateData = canadianProvinces;
                break;
            case 'both':
                stateData = { ...usStates, ...canadianProvinces };
                break;
        }

        // Convert to Question format
        const allQuestions: Question[] = Object.entries(stateData).map(([id, name]) => ({
            stateId: id,
            stateName: name,
            region: id.startsWith('US-') ? 'us' : 'canada'
        }));

        // Shuffle questions
        for (let i = allQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
        }

        this.questions = allQuestions;
    }

    private startGame(): void {
        if (!this.svgLoaded || this.questions.length === 0) return;

        this.gameStarted = true;
        this.currentQuestion = 0;
        this.correctAnswers = 0;
        this.wrongAnswers = 0;
        this.hasRetried = false;  // Reset retry state for new game
        this.retryType = null;  // Reset retry type for new game
        this.resetSubmitButton();  // Reset button text for new game
        this.answeredStates.clear();

        // Hide mode selection and show game
        document.getElementById('mode-selection')!.style.display = 'none';
        document.getElementById('game-container')!.style.display = 'flex';

        this.colorizeMap();
        this.displayQuestion();
        this.updateScoreboard();
        this.sounds.playGameStart();
    }

    private colorizeMap(): void {
        if (!this.svgElement) return;

        this.stateColors.clear();
        const usedColors = new Set<string>();

        // Get all states/provinces for current game mode (not just questions)
        let allStates: string[] = [];
        if (this.currentMode === 'us-easy' || this.currentMode === 'us-hard') {
            allStates = Object.keys(usStates);
        } else if (this.currentMode === 'canada-easy' || this.currentMode === 'canada-hard') {
            allStates = Object.keys(canadianProvinces);
        } else if (this.currentMode === 'both-easy' || this.currentMode === 'both-hard') {
            allStates = [...Object.keys(usStates), ...Object.keys(canadianProvinces)];
        }

        allStates.forEach(stateId => {
            const availableColors = this.colorPalette.filter(color => {
                // Check if any adjacent state uses this color
                const adjacentStates = adjacencyMap[stateId] || [];
                return !adjacentStates.some(adjId => this.stateColors.get(adjId) === color);
            });

            // Pick first available color, or fallback to any unused color
            const color = availableColors.find(c => !usedColors.has(c)) || 
                         availableColors[0] || 
                         this.colorPalette[0];

            this.stateColors.set(stateId, color);
            usedColors.add(color);

            // Apply color to SVG element - look for both direct path elements and groups containing paths
            let element = this.svgElement!.querySelector(`path[id="${stateId}"]`) as SVGPathElement;
            if (!element) {
                // Try to find a group with this ID and color all paths within it
                const groupElement = this.svgElement!.querySelector(`g[id="${stateId}"]`) as SVGGElement;
                if (groupElement) {
                    const pathElements = groupElement.querySelectorAll('path');
                    pathElements.forEach(pathEl => {
                        pathEl.style.fill = color;
                        pathEl.style.stroke = '#333';
                        pathEl.style.strokeWidth = '1';
                    });
                }
            } else {
                element.style.fill = color;
                element.style.stroke = '#333';
                element.style.strokeWidth = '1';
            }
        });
    }

    private displayQuestion(): void {
        if (this.currentQuestion >= this.questions.length) {
            this.endGame();
            return;
        }

        const question = this.questions[this.currentQuestion];
        const questionElement = document.getElementById('current-question');
        const progressElement = document.getElementById('progress');

        if (questionElement) {
            // Set mode-specific question text
            let questionText = '';
            if (this.currentMode) {
                const modeStr = this.currentMode.split('-')[0];
                switch(modeStr) {
                    case 'us':
                        questionText = 'What is the highlighted state?';
                        break;
                    case 'canada':
                        questionText = 'What is the highlighted province?';
                        break;
                    case 'both':
                        questionText = 'What is the highlighted state/province?';
                        break;
                    default:
                        questionText = 'What is the highlighted territory?';
                        break;
                }
            } else {
                questionText = 'What is the highlighted territory?';
            }
            questionElement.textContent = questionText;
            this.highlightState(question.stateId);
        }

        if (progressElement) {
            progressElement.textContent = `Question ${this.currentQuestion + 1} of ${this.questions.length}`;
        }

        // Generate answer options for easy mode or text input for hard mode
        this.generateOptions(question);

        // Zoom to the questioned state/province for both easy and hard modes
        setTimeout(() => {
            this.zoomToElement(question.stateId);
        }, 200);
    }

    private generateOptions(question: Question): void {
        const optionsContainer = document.getElementById('options');
        const textInputContainer = document.getElementById('text-input-container');
        
        if (!optionsContainer || !textInputContainer) return;

        if (this.difficulty === 'easy') {
            // Show multiple choice buttons
            optionsContainer.classList.remove('hidden');
            textInputContainer.classList.add('hidden');
            
            optionsContainer.innerHTML = '';
            
            let allAnswers: string[] = [];
            if (this.currentMode) {
                const modeStr = this.currentMode.split('-')[0];
                switch(modeStr) {
                    case 'us':
                        allAnswers = Object.values(usStates);
                        break;
                    case 'canada':
                        allAnswers = Object.values(canadianProvinces);
                        break;
                    case 'both':
                        allAnswers = [...Object.values(usStates), ...Object.values(canadianProvinces)];
                        break;
                }
            }
            
            // Create 4 options including the correct answer
            const options: string[] = [question.stateName];
            
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
                button.addEventListener('click', () => this.selectAnswer(option, question.stateName));
                optionsContainer.appendChild(button);
            });
        } else {
            // Show text input for hard mode
            optionsContainer.classList.add('hidden');
            textInputContainer.classList.remove('hidden');
            
            const input = document.getElementById('text-answer-input') as HTMLInputElement;
            const submitBtn = document.getElementById('submit-answer-btn');
            
            if (input) {
                input.value = '';
                input.disabled = false;
                
                // Set mode-specific placeholder text
                let placeholderText = '';
                if (this.currentMode) {
                    const modeStr = this.currentMode.split('-')[0];
                    switch(modeStr) {
                        case 'us':
                            placeholderText = 'Type the name of the highlighted state...';
                            break;
                        case 'canada':
                            placeholderText = 'Type the name of the highlighted province...';
                            break;
                        case 'both':
                            placeholderText = 'Type the name of the highlighted state/province...';
                            break;
                        default:
                            placeholderText = 'Type the name of the highlighted territory...';
                            break;
                    }
                } else {
                    placeholderText = 'Type the name of the highlighted territory...';
                }
                input.placeholder = placeholderText;
                
                input.focus();
            }
            
            if (submitBtn) {
                (submitBtn as HTMLButtonElement).disabled = false;
            }
        }
    }

    private selectAnswer(selectedAnswer: string, correctAnswer: string): void {
        const isCorrect = selectedAnswer === correctAnswer;
        
        // Disable all option buttons
        document.querySelectorAll('.option-btn').forEach(btn => {
            (btn as HTMLButtonElement).disabled = true;
            if (btn.textContent === correctAnswer) {
                btn.classList.add('correct');
            } else if (btn.textContent === selectedAnswer && !isCorrect) {
                btn.classList.add('incorrect');
            }
        });
        
        // Process the answer
        if (isCorrect) {
            this.handleCorrectAnswer(this.questions[this.currentQuestion].stateId);
        } else {
            // For easy mode, we need to find which state was clicked (it's the wrong one)
            // Pass the user's selected answer as their guess
            this.handleWrongAnswer(this.questions[this.currentQuestion].stateId, selectedAnswer);
        }
    }

    private submitTextAnswer(): void {
        const input = document.getElementById('text-answer-input') as HTMLInputElement;
        if (!input) return;

        // Check rate limiting to prevent spam/abuse
        if (!this.inputRateLimiter.isAllowed('user-session')) {
            this.showInputError('Too many attempts. Please wait a moment before trying again.');
            return;
        }

        const userAnswer = input.value;

        // Validate and sanitize input
        const validationResult = validateHardModeInput(userAnswer);
        if (!validationResult.isValid) {
            this.showInputError(validationResult.errorMessage || 'Invalid input');
            // Update input with sanitized version if available
            if (validationResult.sanitizedInput !== userAnswer) {
                input.value = validationResult.sanitizedInput;
            }
            return;
        }

        const sanitizedAnswer = validationResult.sanitizedInput;
        if (!sanitizedAnswer) return;

        // Clear any previous input error messages
        this.clearInputError();

        const currentQuestion = this.questions[this.currentQuestion];
        const correctAnswer = currentQuestion.stateName;

        // Normalize both answers for comparison
        const normalizedUser = normalizeGeographicName(sanitizedAnswer);
        const normalizedCorrect = normalizeGeographicName(correctAnswer);

        const isCorrect = normalizedUser === normalizedCorrect;

        if (isCorrect) {
            // Clear any retry indicators
            this.clearRetryIndicator();

            // Disable input and submit button
            input.disabled = true;
            const submitBtn = document.getElementById('submit-answer-btn') as HTMLButtonElement;
            if (submitBtn) submitBtn.disabled = true;

            this.handleCorrectAnswer(currentQuestion.stateId);
        } else if (!this.hasRetried && this.difficulty === 'hard' &&
                  (isCloseMatch(sanitizedAnswer, correctAnswer) || shouldGetRandomSecondChance(sanitizedAnswer, correctAnswer))) {
            // Give the user a second chance if their answer is close OR they get lucky
            this.hasRetried = true;
            this.retryType = isCloseMatch(sanitizedAnswer, correctAnswer) ? 'close' : 'lucky';

            // Show visual indication this is second chance
            this.showSecondChanceIndicator(this.retryType);

            // Keep input as-is for user to modify, just refocus
            input.focus();

            // Audio-only encouragement based on retry type
            this.voice.sayEncouragement(this.retryType);

            // Play a gentle hint sound
            this.sounds.playHint();
        } else {
            // Clear any retry indicators
            this.clearRetryIndicator();

            // Disable input and submit button
            input.disabled = true;
            const submitBtn = document.getElementById('submit-answer-btn') as HTMLButtonElement;
            if (submitBtn) submitBtn.disabled = true;

            this.handleWrongAnswer(currentQuestion.stateId, sanitizedAnswer);
        }
    }

    private showSecondChanceIndicator(retryType: 'close' | 'lucky'): void {
        const feedbackDiv = document.getElementById('feedback');
        const submitBtn = document.getElementById('submit-answer-btn') as HTMLButtonElement;
        
        if (feedbackDiv) {
            if (retryType === 'close') {
                feedbackDiv.textContent = "Second chance!";
            } else {
                feedbackDiv.textContent = "Lucky break! Second chance!";
            }
            feedbackDiv.className = 'feedback-text retry-hint';
            feedbackDiv.style.display = 'block';
        }
        
        if (submitBtn) {
            submitBtn.textContent = 'Try Again';
        }
    }
    
    private resetSubmitButton(): void {
        const submitBtn = document.getElementById('submit-answer-btn') as HTMLButtonElement;
        if (submitBtn) {
            submitBtn.textContent = 'Submit';
        }
    }
    
    private clearRetryIndicator(): void {
        const feedbackDiv = document.getElementById('feedback');
        if (feedbackDiv && (feedbackDiv.textContent === 'Second chance!' || feedbackDiv.textContent === 'Lucky break! Second chance!')) {
            feedbackDiv.textContent = '';
            feedbackDiv.style.display = 'none';
            feedbackDiv.className = 'feedback-text';
        }
    }

    private showInputError(message: string): void {
        const feedbackDiv = document.getElementById('feedback');
        if (feedbackDiv) {
            feedbackDiv.textContent = message;
            feedbackDiv.className = 'feedback-text input-error';
            feedbackDiv.style.display = 'block';
            feedbackDiv.style.color = '#f44336';
        }

        // Auto-clear error message after 3 seconds
        setTimeout(() => {
            this.clearInputError();
        }, 3000);
    }

    private clearInputError(): void {
        const feedbackDiv = document.getElementById('feedback');
        if (feedbackDiv && feedbackDiv.classList.contains('input-error')) {
            feedbackDiv.textContent = '';
            feedbackDiv.style.display = 'none';
            feedbackDiv.className = 'feedback-text';
            feedbackDiv.style.color = '';
        }
    }

    private highlightState(stateId: string): void {
        if (!this.svgElement) return;

        // Remove previous highlights and animations
        this.svgElement.querySelectorAll('.highlighted, .current-state').forEach(el => {
            el.classList.remove('highlighted', 'current-state');
            (el as HTMLElement).style.strokeWidth = '';
            (el as HTMLElement).style.stroke = '';
            (el as HTMLElement).style.strokeDasharray = '';
            (el as HTMLElement).style.animation = '';
        });

        // Add highlight to current state
        const targetElement = this.svgElement.querySelector(`path[id="${stateId}"], g[id="${stateId}"]`);
        if (targetElement) {
            targetElement.classList.add('highlighted', 'current-state');
            
            // Create multi-colored marching ants pattern
            this.createMultiColorPattern();
            
            // Add marching ants animation with multi-colored pattern
            if (targetElement.tagName === 'g') {
                // For group elements (like Alaska), apply to all child path elements
                const pathElements = targetElement.querySelectorAll('path');
                pathElements.forEach(pathEl => {
                    (pathEl as unknown as HTMLElement).style.strokeWidth = '3';
                    (pathEl as unknown as HTMLElement).style.stroke = 'url(#multiColorPattern)';
                    (pathEl as unknown as HTMLElement).style.strokeDasharray = '3,3';
                    (pathEl as unknown as HTMLElement).style.animation = 'marchingAnts 1s linear infinite';
                });
            } else {
                // For individual path elements
                (targetElement as HTMLElement).style.strokeWidth = '3';
                (targetElement as HTMLElement).style.stroke = 'url(#multiColorPattern)';
                (targetElement as HTMLElement).style.strokeDasharray = '3,3';
                (targetElement as HTMLElement).style.animation = 'marchingAnts 1s linear infinite';
            }
        }
    }

    private clearMarchingAnts(): void {
        if (!this.svgElement) return;

        // Remove marching ants animation from all elements
        this.svgElement.querySelectorAll('.highlighted, .current-state').forEach(el => {
            (el as HTMLElement).style.strokeWidth = '';
            (el as HTMLElement).style.stroke = '';
            (el as HTMLElement).style.strokeDasharray = '';
            (el as HTMLElement).style.animation = '';
            el.classList.remove('highlighted', 'current-state');
        });
    }

    private handleStateClick(_event: MouseEvent): void {
        // Disable map clicking in all modes - users should use buttons (easy) or text input (hard)
        return;
    }

    private handleCorrectAnswer(stateId: string): void {
        this.correctAnswers++;
        this.answeredStates.set(stateId, 'correct');
        this.clearMarchingAnts(); // Clear marching ants immediately
        this.sounds.playCorrect();
        this.voice.playCorrectPhrase(this.questions[this.currentQuestion].stateName);
        this.markStateAsAnswered(stateId, true);
        this.updateScoreboard();
        
        // Give the voice time to speak before moving to next question
        setTimeout(() => {
            this.nextQuestion();
        }, 2500); // 2.5 seconds should be enough for most phrases
    }

    private handleWrongAnswer(stateId: string, userGuess?: string): void {
        this.wrongAnswers++;
        this.answeredStates.set(stateId, 'incorrect');
        this.clearMarchingAnts(); // Clear marching ants immediately
        this.sounds.playIncorrect();
        this.voice.playIncorrectPhrase(this.questions[this.currentQuestion].stateName, userGuess);
        this.markStateAsAnswered(stateId, false);
        this.updateScoreboard();
        
        // Give the voice time to speak before moving to next question
        setTimeout(() => {
            this.nextQuestion();
        }, 2500); // 2.5 seconds should be enough for most phrases
    }

    private markStateAsAnswered(stateId: string, correct: boolean): void {
        if (!this.svgElement) return;

        const pathElement = this.svgElement.querySelector(`path[id="${stateId}"]`) as SVGPathElement;
        const groupElement = this.svgElement.querySelector(`g[id="${stateId}"]`) as SVGGElement;
        
        const color = correct ? '#4CAF50' : '#f44336'; // Green for correct, red for incorrect
        const className = correct ? 'correct' : 'incorrect';

        if (pathElement) {
            pathElement.style.fill = color;
            pathElement.classList.add(className);
        } else if (groupElement) {
            const pathElements = groupElement.querySelectorAll('path');
            pathElements.forEach(pathEl => {
                pathEl.style.fill = color;
                pathEl.classList.add(className);
            });
        }
    }

    private handleStateHover(event: MouseEvent): void {
        // Only allow hover effects in hard mode
        if (!this.gameStarted || this.difficulty === 'easy') return;
        
        const target = event.target as SVGPathElement;
        const stateId = target.id;
        
        if (this.answeredStates.has(stateId)) return;
        
        target.style.opacity = '0.8';
    }

    private handleStateLeave(event: MouseEvent): void {
        // Only allow hover effects in hard mode
        if (!this.gameStarted || this.difficulty === 'easy') return;
        
        const target = event.target as SVGPathElement;
        target.style.opacity = '1';
    }

    nextQuestion(): void {
        this.currentQuestion++;
        this.hasRetried = false;  // Reset retry state for next question
        this.retryType = null;  // Reset retry type for next question
        this.resetSubmitButton();  // Reset button text for next question
        
        if (this.currentQuestion >= this.questions.length) {
            this.endGame();
        } else {
            this.displayQuestion();
        }
    }

    private updateScoreboard(): void {
        const data: ScoreboardData = {
            correct: this.correctAnswers,
            incorrect: this.wrongAnswers,
            total: this.correctAnswers + this.wrongAnswers,
            percentage: this.correctAnswers + this.wrongAnswers > 0 ? 
                       Math.round((this.correctAnswers / (this.correctAnswers + this.wrongAnswers)) * 100) : 0
        };

        document.getElementById('correct-count')!.textContent = data.correct.toString();
        document.getElementById('incorrect-count')!.textContent = data.incorrect.toString();
        document.getElementById('score-percentage')!.textContent = `${data.percentage}%`;
        
        // Update progress bar
        const progressBar = document.getElementById('progress-bar') as HTMLElement;
        if (progressBar && this.questions.length > 0) {
            const progress = ((this.currentQuestion + 1) / this.questions.length) * 100;
            progressBar.style.width = `${progress}%`;
        }
    }

    private endGame(): void {
        this.gameStarted = false;
        const percentage = Math.round((this.correctAnswers / this.questions.length) * 100);
        
        this.voice.announceGameEnd(this.correctAnswers, this.questions.length, percentage);
        this.sounds.playGameEnd(percentage);
        
        // Show completion modal instead of in the question area
        this.showCompletionModal(percentage);
    }

    private getPerformanceMessage(percentage: number): string {
        if (percentage >= 90) return "Excellent work! You're a geography master! 🏆";
        if (percentage >= 75) return "Great job! You know your states and provinces! 🌟";
        if (percentage >= 60) return "Good effort! Keep practicing to improve! 👍";
        return "Keep studying! You'll get better with practice! 📚";
    }

    private showCompletionModal(percentage: number): void {
        const modal = document.getElementById('game-completion-modal');
        const scoreElement = document.getElementById('modal-score');
        const messageElement = document.getElementById('modal-message');
        
        if (modal && scoreElement && messageElement) {
            // Update modal content
            scoreElement.textContent = `You scored ${this.correctAnswers} out of ${this.questions.length} (${percentage}%)`;
            messageElement.textContent = this.getPerformanceMessage(percentage);
            
            // Show modal
            modal.classList.remove('hidden');
            
            // Set up event listeners for modal buttons
            this.setupModalEventListeners();
        }
    }

    private setupModalEventListeners(): void {
        const modal = document.getElementById('game-completion-modal');
        const closeBtn = document.getElementById('modal-close');
        const playAgainBtn = document.getElementById('modal-play-again');
        const backToMenuBtn = document.getElementById('modal-back-to-menu');
        const backdrop = modal?.querySelector('.modal-backdrop');

        // Close modal handlers
        const closeModal = () => {
            modal?.classList.add('hidden');
        };

        // Remove any existing listeners to prevent duplicates
        closeBtn?.removeEventListener('click', closeModal);
        backdrop?.removeEventListener('click', closeModal);
        
        // Add listeners
        closeBtn?.addEventListener('click', closeModal);
        backdrop?.addEventListener('click', closeModal);

        // Play Again button
        const handlePlayAgain = () => {
            closeModal();
            this.resetGame();
        };
        playAgainBtn?.removeEventListener('click', handlePlayAgain);
        playAgainBtn?.addEventListener('click', handlePlayAgain);

        // Back to Menu button  
        const handleBackToMenu = () => {
            closeModal();
            this.backToMenu();
        };
        backToMenuBtn?.removeEventListener('click', handleBackToMenu);
        backToMenuBtn?.addEventListener('click', handleBackToMenu);

        // ESC key to close modal
        const handleEscKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscKey);
            }
        };
        document.addEventListener('keydown', handleEscKey);
    }

    resetGame(): void {
        if (!this.currentMode) return;
        
        this.answeredStates.clear();
        this.stateColors.clear();
        
        // Reset SVG styles
        if (this.svgElement) {
            this.svgElement.querySelectorAll('path').forEach(path => {
                path.classList.remove('correct', 'incorrect', 'highlighted');
                path.style.fill = '';
                path.style.opacity = '1';
            });
        }
        
        this.generateQuestions(this.currentMode.split('-')[0] as 'us' | 'canada' | 'both');
        this.startGame();
    }

    backToMenu(): void {
        this.gameStarted = false;
        this.currentMode = null;
        
        // Reset game state
        this.answeredStates.clear();
        this.stateColors.clear();
        
        // Reset SVG styles
        if (this.svgElement) {
            this.svgElement.querySelectorAll('path').forEach(path => {
                path.classList.remove('correct', 'incorrect', 'highlighted');
                path.style.fill = '';
                path.style.opacity = '1';
            });
        }
        
        // Reset button states
        document.querySelectorAll('.difficulty-btn, .mode-select-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Reset to easy mode as default
        this.difficulty = 'easy';
        document.getElementById('select-easy')?.classList.add('active');
        
        // Reset zoom to full map view
        this.resetZoom();
        
        // Show mode selection
        document.getElementById('game-container')!.style.display = 'none';
        document.getElementById('mode-selection')!.style.display = 'flex';
    }

    private toggleSound(): void {
        const soundToggleBtn = document.getElementById('sound-toggle');
        if (!soundToggleBtn) return;

        const isEnabled = this.sounds.isEnabled();
        this.sounds.setEnabled(!isEnabled);
        
        // Update button appearance
        soundToggleBtn.textContent = isEnabled ? '🔇' : '🔊';
        soundToggleBtn.title = isEnabled ? 'Enable Sound' : 'Disable Sound';
    }

    private toggleVoice(): void {
        const voiceToggleBtn = document.getElementById('voice-toggle');
        if (!voiceToggleBtn) return;

        const isEnabled = this.voice.isEnabled();
        this.voice.setEnabled(!isEnabled);
        
        // Update button appearance  
        voiceToggleBtn.textContent = isEnabled ? '🤐' : '🗣️';
        voiceToggleBtn.title = isEnabled ? 'Enable Voice' : 'Disable Voice';
    }

    private createMultiColorPattern(): void {
        if (!this.svgElement) return;
        
        // Check if pattern already exists
        let defs = this.svgElement.querySelector('defs');
        if (!defs) {
            defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            this.svgElement.insertBefore(defs, this.svgElement.firstChild);
        }
        
        // Remove existing pattern if it exists
        const existingPattern = defs.querySelector('#multiColorPattern');
        if (existingPattern) {
            existingPattern.remove();
        }
        
        // Create new pattern
        const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
        pattern.setAttribute('id', 'multiColorPattern');
        pattern.setAttribute('patternUnits', 'userSpaceOnUse');
        pattern.setAttribute('width', '15');
        pattern.setAttribute('height', '3');
        
        // Colors for the pattern
        const colors = ['#04e762', '#f5b700', '#dc0073', '#008bf8', '#89fc00'];
        
        // Create colored rectangles for each segment
        colors.forEach((color, index) => {
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', (index * 3).toString());
            rect.setAttribute('y', '0');
            rect.setAttribute('width', '3');
            rect.setAttribute('height', '3');
            rect.setAttribute('fill', color);
            pattern.appendChild(rect);
        });
        
        defs.appendChild(pattern);
    }

    // Zoom and pan to focus on a specific state/province with smooth transition
    private zoomToElement(elementId: string): void {
        if (!this.svgElement) return;
        
        const element = this.svgElement.querySelector(`#${elementId}`);
        if (!element) {
            console.warn(`Element ${elementId} not found`);
            return;
        }
        
        try {
            // First zoom out more to provide better transition
            const intermediateViewBox = this.calculateIntermediateZoom();
            
            // Animate to intermediate zoom first, then to target
            this.animateViewBox(intermediateViewBox, 400, () => {
                // After zoom out, zoom in to the target element
                this.zoomToElementDirect(elementId);
            });
            
        } catch (error) {
            console.error('Error zooming to element:', error);
            // Fallback: direct zoom without transition
            this.zoomToElementDirect(elementId);
        }
    }

    // Calculate intermediate zoom level for smoother transitions
    private calculateIntermediateZoom(): string {
        // Zoom out to show more of the map for better transitions
        const fullViewBox = '0 0 2289 1744';
        const current = this.svgElement!.getAttribute('viewBox') || fullViewBox;
        const currentValues = current.split(' ').map(parseFloat);
        
        // Create an intermediate viewBox that's 1.5x larger than current
        const scale = 1.5;
        const centerX = currentValues[0] + currentValues[2] / 2;
        const centerY = currentValues[1] + currentValues[3] / 2;
        const newWidth = currentValues[2] * scale;
        const newHeight = currentValues[3] * scale;
        const newX = centerX - newWidth / 2;
        const newY = centerY - newHeight / 2;
        
        // Constrain to map bounds
        const fullValues = fullViewBox.split(' ').map(parseFloat);
        const clampedX = Math.max(fullValues[0], Math.min(newX, fullValues[0] + fullValues[2] - newWidth));
        const clampedY = Math.max(fullValues[1], Math.min(newY, fullValues[1] + fullValues[3] - newHeight));
        const clampedWidth = Math.min(newWidth, fullValues[2]);
        const clampedHeight = Math.min(newHeight, fullValues[3]);
        
        return `${clampedX} ${clampedY} ${clampedWidth} ${clampedHeight}`;
    }

    // Direct zoom to element without transition (used internally)
    private zoomToElementDirect(elementId: string): void {
        if (!this.svgElement) return;
        
        const element = this.svgElement.querySelector(`#${elementId}`);
        if (!element) {
            console.warn(`Element ${elementId} not found`);
            return;
        }
        
        
        try {
            let bbox;
            
            // Special handling for Alaska (US-AK) and other complex shapes
            if (elementId === 'US-AK' && element.tagName === 'g') {
                // For Alaska group, calculate combined bbox of all child elements
                bbox = this.getCombinedBoundingBox(element as SVGGElement);
            } else if (element.tagName === 'g') {
                // For any group, calculate combined bbox
                bbox = this.getCombinedBoundingBox(element as SVGGElement);
            } else {
                // Regular element
                bbox = (element as SVGGraphicsElement).getBBox();
            }
            
            // Enhanced padding calculation for better visibility
            const elementSize = Math.max(bbox.width, bbox.height);
            let paddingFactor = 1.2; // Default 120% padding
            
            // Special cases for specific territories that need more space
            const specialCases: { [key: string]: number } = {
                'US-DC': 3.0, // Washington DC is very small and needs much more zoom
                'US-AK': 1.5, // Alaska needs more padding
                'US-HI': 1.8, // Hawaii islands need more padding
                'CA-NU': 1.6, // Nunavut is complex
                'CA-NT': 1.4  // Northwest Territories
            };
            
            if (specialCases[elementId]) {
                paddingFactor = specialCases[elementId];
            }
            
            
            const padding = elementSize * paddingFactor;
            const minPadding = 120; // Increased minimum padding
            const finalPadding = Math.max(padding, minPadding);
            
            const viewX = bbox.x - finalPadding;
            const viewY = bbox.y - finalPadding;
            const viewWidth = bbox.width + (finalPadding * 2);
            const viewHeight = bbox.height + (finalPadding * 2);
            
            // Larger minimum dimensions to ensure visibility, but allow smaller minimums for high-zoom territories
            let minZoomWidth = 500; // Increased from 400
            let minZoomHeight = 375; // Increased from 300
            
            // For territories with high padding factors (like DC), use smaller minimums to allow the enhanced zoom to take effect
            if (paddingFactor >= 3.0) {
                minZoomWidth = 200; // Much smaller minimum for very high zoom factors
                minZoomHeight = 150;
            } else if (paddingFactor >= 1.8) {
                minZoomWidth = 350; // Moderate reduction for high zoom factors
                minZoomHeight = 260;
            }
            
            const finalViewWidth = Math.max(viewWidth, minZoomWidth);
            const finalViewHeight = Math.max(viewHeight, minZoomHeight);
            
            // Get the SVG dimensions and aspect ratio
            const svgRect = this.svgElement.getBoundingClientRect();
            const svgAspectRatio = svgRect.width / svgRect.height;
            const bboxAspectRatio = finalViewWidth / finalViewHeight;
            
            // Adjust dimensions to maintain aspect ratio and ensure complete visibility
            let finalWidth = finalViewWidth;
            let finalHeight = finalViewHeight;
            let finalX = viewX - (finalViewWidth - viewWidth) / 2;
            let finalY = viewY - (finalViewHeight - viewHeight) / 2;
            
            if (bboxAspectRatio > svgAspectRatio) {
                // Element is wider relative to container, adjust height
                finalHeight = finalWidth / svgAspectRatio;
                finalY = finalY - (finalHeight - finalViewHeight) / 2;
            } else {
                // Element is taller relative to container, adjust width
                finalWidth = finalHeight * svgAspectRatio;
                finalX = finalX - (finalWidth - finalViewWidth) / 2;
            }
            
            // Ensure the viewBox stays within SVG bounds
            finalX = Math.max(0, Math.min(finalX, 2289 - finalWidth));
            finalY = Math.max(0, Math.min(finalY, 1744 - finalHeight));
            finalWidth = Math.min(finalWidth, 2289);
            finalHeight = Math.min(finalHeight, 1744);
            
            // Create the new viewBox string
            const newViewBox = `${finalX} ${finalY} ${finalWidth} ${finalHeight}`;
            
            
            // Animate the viewBox change with slightly longer duration
            this.animateViewBox(newViewBox, 600);
            
        } catch (error) {
            console.error('Error zooming to element:', error);
        }
    }

    // Get combined bounding box for grouped elements (like Alaska)
    private getCombinedBoundingBox(groupElement: SVGGElement): DOMRect {
        const children = groupElement.querySelectorAll('path, polygon, circle, rect');
        if (children.length === 0) {
            return groupElement.getBBox();
        }
        
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        children.forEach(child => {
            try {
                const bbox = (child as SVGGraphicsElement).getBBox();
                minX = Math.min(minX, bbox.x);
                minY = Math.min(minY, bbox.y);
                maxX = Math.max(maxX, bbox.x + bbox.width);
                maxY = Math.max(maxY, bbox.y + bbox.height);
            } catch {
                // Skip elements that can't provide bbox
            }
        });
        
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        } as DOMRect;
    }

    // Reset zoom to full map view
    private resetZoom(): void {
        if (!this.svgElement) return;
        
        // Reset to original viewBox or calculate full bounds
        const originalViewBox = '0 0 2289 1744'; // From SVG dimensions
        this.animateViewBox(originalViewBox);
    }

    // Animate viewBox changes smoothly with optional callback
    private animateViewBox(targetViewBox: string, duration = 800, onComplete?: () => void): void {
        if (!this.svgElement) return;
        
        const currentViewBox = this.svgElement.getAttribute('viewBox') || '0 0 2289 1744';
        
        // If viewBox is the same, don't animate but still call callback
        if (currentViewBox === targetViewBox) {
            if (onComplete) onComplete();
            return;
        }
        
        // Parse viewBox values
        const parseViewBox = (vb: string) => vb.split(' ').map(parseFloat);
        const current = parseViewBox(currentViewBox);
        const target = parseViewBox(targetViewBox);
        
        // Animation parameters
        const startTime = performance.now();
        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Use easeInOutCubic for smooth animation
            const easedProgress = progress < 0.5 
                ? 4 * progress * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            
            // Interpolate viewBox values
            const interpolated = current.map((curr, i) => 
                curr + (target[i] - curr) * easedProgress
            );
            
            // Apply the interpolated viewBox
            this.svgElement!.setAttribute('viewBox', interpolated.join(' '));
            
            // Continue animation or call completion callback
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else if (onComplete) {
                onComplete();
            }
        };
        
        requestAnimationFrame(animate);
    }
}