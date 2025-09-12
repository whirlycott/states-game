// ABOUTME: Web Speech Synthesis for edgy movie character voice feedback
// ABOUTME: Deep voice with quirky personality that comments on correct/wrong answers

import type { Difficulty } from '../game/types.js';

export class EdgeyVoice {
    private synth: SpeechSynthesis;
    private voice: SpeechSynthesisVoice | null = null;
    private enabled = true;
    private rate = 0.8;
    private pitch = 0.3; // Lower pitch for deeper voice
    private volume = 0.8;
    
    // Track recently used phrases to avoid repetition
    private recentCorrectPhrases: string[] = [];
    private recentIncorrectPhrases: string[] = [];
    
    private readonly correctPhrases = [
        "Oh yeah, {state}! You nailed it like a boss!",
        "Boom! {state} is correct, you magnificent genius!",
        "Damn right it's {state}! You're on fire, my friend!",
        "Bingo! {state} - you just schooled that map!",
        "Hell yeah! {state} - that's how legends are made!",
        "Sweet! {state} - you're crushing it like a champion!",
        "Bullseye! {state} - your geography game is strong!",
        "Excellent! {state} - you're a walking atlas, baby!",
        "Touchdown! {state} - geography ain't got nothing on you!",
        "Ka-pow! {state} - you just owned that question!",
        "Righteous! {state} - you're sharper than a tack!",
        "Wicked! {state} - your brain is a steel trap!",
        "Solid! {state} - you're making this look easy!",
        "Spectacular! {state} - geography wizard in the house!",
        "Outstanding! {state} - you're demolishing this quiz!"
    ];
    
    private readonly incorrectPhrases = [
        "Ouch! That's not {state}, but hey... everyone has off days!",
        "Nah, that's not {state}... but I still believe in you, champ!",
        "Wrong answer! It's {state}, not that... but don't sweat it!",
        "Swing and a miss! The answer is {state} - shake it off!",
        "Not quite! It's {state} - but you're still awesome in my book!",
        "Nope! {state} is the one - but hey, nobody's perfect!",
        "That's a no-go! It's {state} - but you'll get the next one!",
        "Close, but no cigar! The answer is {state} - keep fighting!",
        "Not today! It's {state} - but tomorrow you'll crush it!",
        "Strike out! {state} is correct - but champions bounce back!",
        "Missed it! It's {state} - but losers quit, winners learn!",
        "Off target! The answer is {state} - but you're still in this!",
        "No dice! It's {state} - but failure is just success in progress!",
        "Wrong turn! It's {state} - but every master was once a disaster!",
        "Not this time! {state} is right - but you're getting warmer!"
    ];

    constructor() {
        this.synth = window.speechSynthesis;
        this.initVoice();
    }
    
    private initVoice(): void {
        // Wait for voices to load
        const setVoice = (): void => {
            const voices = this.synth.getVoices();
            
            // Prefer English voices with deeper characteristics
            const preferredVoices = [
                'Microsoft David - English (United States)',
                'Alex', // macOS
                'Google UK English Male',
                'en-US-Male',
                'en-GB-Male'
            ];
            
            for (const preferred of preferredVoices) {
                const found = voices.find(v => v.name.includes(preferred) || v.name === preferred);
                if (found) {
                    this.voice = found;
                    return;
                }
            }
            
            // Fallback: find any male English voice
            this.voice = voices.find(v => 
                v.lang.startsWith('en') && 
                (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david'))
            ) || voices.find(v => v.lang.startsWith('en')) || voices[0] || null;
        };
        
        if (this.synth.getVoices().length > 0) {
            setVoice();
        } else {
            this.synth.addEventListener('voiceschanged', setVoice);
        }
    }
    
    private speak(text: string): void {
        if (!this.enabled || !text.trim()) return;
        
        // Cancel any ongoing speech
        this.synth.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        if (this.voice) {
            utterance.voice = this.voice;
        }
        
        utterance.rate = this.rate;
        utterance.pitch = this.pitch;
        utterance.volume = this.volume;
        
        // Error handling
        utterance.onerror = (event) => {
            console.warn('Speech synthesis error:', event.error);
        };
        
        this.synth.speak(utterance);
    }
    
    announceQuestion(_stateName: string, _difficulty: Difficulty, gameMode?: string): void {
        // Create mode-specific question text
        let questionText = '';
        if (gameMode) {
            const modeStr = gameMode.split('-')[0];
            switch(modeStr) {
                case 'us':
                    questionText = 'What is the highlighted state?';
                    break;
                case 'canada':
                    questionText = 'What is the highlighted province?';
                    break;
                case 'both':
                    questionText = 'What is the highlighted state or province?';
                    break;
                default:
                    questionText = 'What is the highlighted territory?';
                    break;
            }
        } else {
            questionText = 'What is the highlighted territory?';
        }
        this.speak(questionText);
    }
    
    playCorrectPhrase(stateName: string): void {
        const phrase = this.getRandomPhrase(this.correctPhrases, this.recentCorrectPhrases);
        const text = phrase.replace('{state}', stateName);
        this.speak(text);
        
        // Track this phrase to avoid repetition
        this.recentCorrectPhrases.push(phrase);
        if (this.recentCorrectPhrases.length > 3) {
            this.recentCorrectPhrases.shift();
        }
    }
    
    playIncorrectPhrase(correctStateName?: string): void {
        const phrase = this.getRandomPhrase(this.incorrectPhrases, this.recentIncorrectPhrases);
        const text = correctStateName ? phrase.replace('{state}', correctStateName) : phrase;
        this.speak(text);
        
        // Track this phrase to avoid repetition
        this.recentIncorrectPhrases.push(phrase);
        if (this.recentIncorrectPhrases.length > 3) {
            this.recentIncorrectPhrases.shift();
        }
    }
    
    announceGameEnd(correct: number, total: number, percentage: number): void {
        let message: string;
        
        if (percentage >= 90) {
            message = `Outstanding! You got ${correct} out of ${total} correct! That's ${percentage} percent! You're a geography master!`;
        } else if (percentage >= 75) {
            message = `Great job! You scored ${correct} out of ${total}! That's ${percentage} percent! You know your stuff!`;
        } else if (percentage >= 60) {
            message = `Good effort! You got ${correct} out of ${total} right! That's ${percentage} percent! Keep practicing!`;
        } else {
            message = `You scored ${correct} out of ${total}! That's ${percentage} percent! Don't worry, you'll get better with practice!`;
        }
        
        this.speak(message);
    }
    
    private getRandomPhrase(phrases: readonly string[], recentPhrases?: string[]): string {
        if (!recentPhrases || recentPhrases.length === 0) {
            return phrases[Math.floor(Math.random() * phrases.length)];
        }
        
        // Filter out recently used phrases
        const availablePhrases = phrases.filter(phrase => !recentPhrases.includes(phrase));
        
        // If all phrases have been used recently, use any phrase (shouldn't happen with 15+ phrases and 3-phrase memory)
        if (availablePhrases.length === 0) {
            return phrases[Math.floor(Math.random() * phrases.length)];
        }
        
        return availablePhrases[Math.floor(Math.random() * availablePhrases.length)];
    }
    
    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        if (!enabled) {
            this.synth.cancel();
        }
    }
    
    isEnabled(): boolean {
        return this.enabled;
    }
    
    setRate(rate: number): void {
        this.rate = Math.max(0.1, Math.min(2.0, rate));
    }
    
    setPitch(pitch: number): void {
        this.pitch = Math.max(0, Math.min(2.0, pitch));
    }
    
    setVolume(volume: number): void {
        this.volume = Math.max(0, Math.min(1.0, volume));
    }
    
    sayEncouragement(): void {
        const encouragements = [
            "Ooh, so close! Try again, you're almost there!",
            "Almost got it! Give it another shot, champ!",
            "You're so close I can taste it! Try once more!",
            "Nearly there! One more try and you'll nail it!",
            "Close call! Your next guess is gonna be perfect!",
            "You're on the right track! Try again, superstar!"
        ];
        
        const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
        this.speak(randomEncouragement);
    }
    
    stop(): void {
        this.synth.cancel();
    }
}