// ABOUTME: 1980s-style video game sound effects using Web Audio API
// ABOUTME: Creates retro beeps, bloops, and arcade-style audio feedback

class RetroSounds {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.init();
    }
    
    init() {
        try {
            // Initialize AudioContext on first user interaction
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
            this.enabled = false;
        }
    }
    
    // Ensure AudioContext is running (required after user interaction)
    async ensureAudioContext() {
        if (!this.audioContext || !this.enabled) return false;
        
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
        return true;
    }
    
    // Create oscillator with specific waveform and frequency
    createOscillator(frequency, waveType = 'square') {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = waveType;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        return { oscillator, gainNode };
    }
    
    // Classic 1980s correct answer sound - ascending chiptune
    async playCorrect() {
        if (!await this.ensureAudioContext()) return;
        
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        
        notes.forEach((frequency, index) => {
            const { oscillator, gainNode } = this.createOscillator(frequency, 'square');
            
            const startTime = this.audioContext.currentTime + (index * 0.1);
            const endTime = startTime + 0.15;
            
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);
            
            oscillator.start(startTime);
            oscillator.stop(endTime);
        });
    }
    
    // Classic wrong answer sound - descending buzz
    async playIncorrect() {
        if (!await this.ensureAudioContext()) return;
        
        const { oscillator, gainNode } = this.createOscillator(220, 'sawtooth');
        
        const startTime = this.audioContext.currentTime;
        const endTime = startTime + 0.5;
        
        // Descending frequency
        oscillator.frequency.setValueAtTime(220, startTime);
        oscillator.frequency.linearRampToValueAtTime(110, endTime);
        
        // Buzzy envelope
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);
        
        oscillator.start(startTime);
        oscillator.stop(endTime);
    }
    
    // Game start sound - classic arcade power-up
    async playGameStart() {
        if (!await this.ensureAudioContext()) return;
        
        const frequencies = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        
        frequencies.forEach((frequency, index) => {
            const { oscillator, gainNode } = this.createOscillator(frequency, 'triangle');
            
            const startTime = this.audioContext.currentTime + (index * 0.08);
            const endTime = startTime + 0.2;
            
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);
            
            oscillator.start(startTime);
            oscillator.stop(endTime);
        });
    }
    
    // Game complete sound - victory fanfare
    async playGameComplete() {
        if (!await this.ensureAudioContext()) return;
        
        // Main melody
        const melody = [
            { freq: 523.25, time: 0 },      // C5
            { freq: 659.25, time: 0.15 },  // E5
            { freq: 783.99, time: 0.3 },   // G5
            { freq: 1046.50, time: 0.45 }, // C6
            { freq: 783.99, time: 0.6 },   // G5
            { freq: 1046.50, time: 0.75 }, // C6
        ];
        
        melody.forEach(({ freq, time }) => {
            const { oscillator, gainNode } = this.createOscillator(freq, 'square');
            
            const startTime = this.audioContext.currentTime + time;
            const endTime = startTime + 0.2;
            
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);
            
            oscillator.start(startTime);
            oscillator.stop(endTime);
        });
        
        // Add bass harmony
        const bassNotes = [261.63, 329.63, 392.00]; // C4, E4, G4
        bassNotes.forEach((frequency, index) => {
            const { oscillator, gainNode } = this.createOscillator(frequency, 'triangle');
            
            const startTime = this.audioContext.currentTime + (index * 0.25);
            const endTime = startTime + 0.4;
            
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);
            
            oscillator.start(startTime);
            oscillator.stop(endTime);
        });
    }
    
    // Button hover/click sound
    async playButtonHover() {
        if (!await this.ensureAudioContext()) return;
        
        const { oscillator, gainNode } = this.createOscillator(800, 'square');
        
        const startTime = this.audioContext.currentTime;
        const endTime = startTime + 0.1;
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);
        
        oscillator.start(startTime);
        oscillator.stop(endTime);
    }
    
    // Next question transition sound
    async playNextQuestion() {
        if (!await this.ensureAudioContext()) return;
        
        const { oscillator, gainNode } = this.createOscillator(440, 'triangle');
        
        const startTime = this.audioContext.currentTime;
        const endTime = startTime + 0.15;
        
        oscillator.frequency.setValueAtTime(440, startTime);
        oscillator.frequency.linearRampToValueAtTime(880, endTime);
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);
        
        oscillator.start(startTime);
        oscillator.stop(endTime);
    }
    
    // Toggle sound on/off
    toggleSound() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}