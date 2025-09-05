// ABOUTME: Web Speech Synthesis for edgy movie character voice feedback
// ABOUTME: Deep voice with quirky personality that comments on correct/wrong answers

class EdgeyVoice {
    constructor() {
        this.synth = window.speechSynthesis;
        this.voice = null;
        this.enabled = true;
        this.rate = 0.8;
        this.pitch = 0.3; // Lower pitch for deeper voice
        this.volume = 0.8;
        
        this.initVoice();
        
        // Edgy correct answer phrases
        this.correctPhrases = [
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
        
        // Edgy incorrect answer phrases
        this.incorrectPhrases = [
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
    }
    
    async initVoice() {
        // Wait for voices to load
        if (this.synth.getVoices().length === 0) {
            await new Promise(resolve => {
                this.synth.addEventListener('voiceschanged', resolve, { once: true });
            });
        }
        
        this.selectBestVoice();
    }
    
    selectBestVoice() {
        const voices = this.synth.getVoices();
        
        // Prefer male voices with lower pitch for edgy character
        const preferredVoices = [
            'Microsoft David - English (United States)',
            'Alex',
            'Google US English Male',
            'Daniel',
            'Microsoft Mark - English (United States)',
            'Fred',
            'Ralph'
        ];
        
        // Try to find a preferred voice
        for (const prefName of preferredVoices) {
            const found = voices.find(voice => 
                voice.name.includes(prefName.split(' ')[0]) || 
                voice.name === prefName
            );
            if (found) {
                this.voice = found;
                console.log(`Selected voice: ${found.name}`);
                return;
            }
        }
        
        // Fallback to any male voice
        const maleVoice = voices.find(voice => 
            voice.name.toLowerCase().includes('male') ||
            voice.name.toLowerCase().includes('david') ||
            voice.name.toLowerCase().includes('alex') ||
            voice.name.toLowerCase().includes('daniel')
        );
        
        if (maleVoice) {
            this.voice = maleVoice;
            console.log(`Selected fallback male voice: ${maleVoice.name}`);
            return;
        }
        
        // Last resort - any English voice
        const englishVoice = voices.find(voice => 
            voice.lang.startsWith('en')
        );
        
        this.voice = englishVoice || voices[0];
        if (this.voice) {
            console.log(`Selected voice: ${this.voice.name}`);
        }
    }
    
    speak(text) {
        if (!this.enabled || !this.synth || !text) return;
        
        // Cancel any ongoing speech
        this.synth.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        if (this.voice) {
            utterance.voice = this.voice;
        }
        
        utterance.rate = this.rate;
        utterance.pitch = this.pitch;
        utterance.volume = this.volume;
        
        // Add some attitude to the speech
        utterance.addEventListener('start', () => {
            console.log('Edgy voice speaking:', text);
        });
        
        utterance.addEventListener('error', (event) => {
            console.error('Speech synthesis error:', event);
        });
        
        this.synth.speak(utterance);
    }
    
    speakCorrect(stateName) {
        if (!this.enabled) return;
        
        const phrase = this.getRandomPhrase(this.correctPhrases);
        const text = phrase.replace('{state}', stateName);
        this.speak(text);
    }
    
    speakIncorrect(stateName) {
        if (!this.enabled) return;
        
        const phrase = this.getRandomPhrase(this.incorrectPhrases);
        const text = phrase.replace('{state}', stateName);
        this.speak(text);
    }
    
    getRandomPhrase(phrases) {
        return phrases[Math.floor(Math.random() * phrases.length)];
    }
    
    toggle() {
        this.enabled = !this.enabled;
        
        if (!this.enabled) {
            // Cancel any ongoing speech when disabled
            this.synth.cancel();
        } else {
            // Test voice when enabled
            this.speak("Voice is back online, baby!");
        }
        
        return this.enabled;
    }
    
    // Adjust voice settings
    setDeepness(level) {
        // level: 0 (normal) to 1 (deepest)
        this.pitch = Math.max(0.1, 1 - level);
        this.rate = Math.max(0.5, 1 - (level * 0.3));
    }
    
    // Stop any current speech
    stop() {
        if (this.synth) {
            this.synth.cancel();
        }
    }
}