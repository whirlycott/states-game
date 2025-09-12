// ABOUTME: 1980s-style video game sound effects using Web Audio API
// ABOUTME: Creates retro beeps, bloops, and arcade-style audio feedback

export class RetroSounds {
    private audioContext: AudioContext | null = null;
    private enabled = true;

    constructor() {
        this.init();
    }
    
    private init(): void {
        try {
            this.audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
            this.enabled = false;
        }
    }
    
    private async ensureAudioContext(): Promise<boolean> {
        if (!this.audioContext || !this.enabled) return false;
        
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
        return true;
    }
    
    private createOscillator(frequency: number, waveType: OscillatorType = 'square'): {
        oscillator: OscillatorNode;
        gainNode: GainNode;
    } {
        if (!this.audioContext) {
            throw new Error('AudioContext not available');
        }

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = waveType;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        return { oscillator, gainNode };
    }
    
    async playCorrect(): Promise<void> {
        if (!await this.ensureAudioContext() || !this.audioContext) return;
        
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        
        notes.forEach((frequency, index) => {
            const { oscillator, gainNode } = this.createOscillator(frequency, 'square');
            
            const startTime = this.audioContext!.currentTime + (index * 0.1);
            const endTime = startTime + 0.15;
            
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);
            
            oscillator.start(startTime);
            oscillator.stop(endTime);
        });
    }
    
    async playIncorrect(): Promise<void> {
        if (!await this.ensureAudioContext() || !this.audioContext) return;
        
        const { oscillator, gainNode } = this.createOscillator(220, 'sawtooth');
        
        const startTime = this.audioContext.currentTime;
        const endTime = startTime + 0.5;
        
        oscillator.frequency.setValueAtTime(220, startTime);
        oscillator.frequency.linearRampToValueAtTime(110, endTime);
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);
        
        oscillator.start(startTime);
        oscillator.stop(endTime);
    }
    
    async playGameStart(): Promise<void> {
        if (!await this.ensureAudioContext() || !this.audioContext) return;
        
        const melody = [
            { freq: 392, time: 0 },     // G4
            { freq: 523.25, time: 0.2 }, // C5
            { freq: 659.25, time: 0.4 }, // E5
            { freq: 783.99, time: 0.6 }, // G5
        ];
        
        melody.forEach(({ freq, time }) => {
            const { oscillator, gainNode } = this.createOscillator(freq, 'triangle');
            
            const startTime = this.audioContext!.currentTime + time;
            const endTime = startTime + 0.3;
            
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);
            
            oscillator.start(startTime);
            oscillator.stop(endTime);
        });
    }
    
    async playGameEnd(percentage: number): Promise<void> {
        if (!await this.ensureAudioContext() || !this.audioContext) return;
        
        if (percentage >= 80) {
            // Victory fanfare
            const victoryNotes = [
                523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50, 1318.51
            ];
            
            victoryNotes.forEach((frequency, index) => {
                const { oscillator, gainNode } = this.createOscillator(frequency, 'triangle');
                
                const startTime = this.audioContext!.currentTime + (index * 0.15);
                const endTime = startTime + 0.2;
                
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
                gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);
                
                oscillator.start(startTime);
                oscillator.stop(endTime);
            });
        } else {
            // Simple completion sound
            const { oscillator, gainNode } = this.createOscillator(440, 'sine');
            
            const startTime = this.audioContext.currentTime;
            const endTime = startTime + 1.0;
            
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.1);
            gainNode.gain.linearRampToValueAtTime(0.2, endTime - 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);
            
            oscillator.start(startTime);
            oscillator.stop(endTime);
        }
    }
    
    async playHint(): Promise<void> {
        if (!await this.ensureAudioContext() || !this.audioContext) return;
        
        // Gentle ascending arpeggio to indicate "try again"
        const notes = [440, 554.37, 659.25]; // A4, C#5, E5
        
        notes.forEach((frequency, index) => {
            const { oscillator, gainNode } = this.createOscillator(frequency, 'sine');
            
            const startTime = this.audioContext!.currentTime + (index * 0.15);
            const endTime = startTime + 0.2;
            
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);
            
            oscillator.start(startTime);
            oscillator.stop(endTime);
        });
    }
    
    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }
    
    isEnabled(): boolean {
        return this.enabled && this.audioContext !== null;
    }
}