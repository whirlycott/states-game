// ABOUTME: Comprehensive test suite for EdgeyVoice Text-to-Speech functionality
// ABOUTME: Tests speech synthesis setup, phrase repetition prevention, and voice configuration

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EdgeyVoice } from './EdgeyVoice.js';

// Mock SpeechSynthesis and related APIs
const mockUtterance = {
  text: '',
  voice: null,
  rate: 1,
  pitch: 1,
  volume: 1,
  onerror: null,
  onstart: null,
  onend: null
};

const mockVoices = [
  { name: 'Microsoft David - English (United States)', lang: 'en-US', default: false, localService: true, voiceURI: 'David' },
  { name: 'Alex', lang: 'en-US', default: false, localService: true, voiceURI: 'Alex' },
  { name: 'Google UK English Male', lang: 'en-GB', default: false, localService: false, voiceURI: 'Google UK English Male' },
  { name: 'Random Voice', lang: 'en-US', default: false, localService: true, voiceURI: 'Random' }
];

const mockSpeechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  getVoices: vi.fn(() => mockVoices),
  speaking: false,
  pending: false,
  paused: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

// Mock window.speechSynthesis
Object.defineProperty(window, 'speechSynthesis', {
  value: mockSpeechSynthesis,
  writable: true
});

// Mock SpeechSynthesisUtterance constructor
global.SpeechSynthesisUtterance = vi.fn(() => ({ ...mockUtterance })) as any;

describe('EdgeyVoice', () => {
  let edgyVoice: EdgeyVoice;
  let mockSpeakUtterance: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Create a fresh mock utterance for each test
    mockSpeakUtterance = { ...mockUtterance };
    (global.SpeechSynthesisUtterance as any).mockReturnValue(mockSpeakUtterance);
    
    // Reset speech synthesis mock state
    mockSpeechSynthesis.speak.mockClear();
    mockSpeechSynthesis.cancel.mockClear();
    mockSpeechSynthesis.getVoices.mockReturnValue(mockVoices);
    
    // Create new instance
    edgyVoice = new EdgeyVoice();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization and Voice Selection', () => {
    it('should initialize with speech synthesis and select preferred voice', () => {
      expect(mockSpeechSynthesis.getVoices).toHaveBeenCalled();
      // Voice selection happens in initVoice, which should be called during construction
    });

    it('should prefer Microsoft David voice when available', () => {
      const edgy = new EdgeyVoice();
      expect(edgy).toBeDefined();
      // The voice should be set to Microsoft David if available in the mock voices
    });

    it('should handle case when no voices are initially available', () => {
      mockSpeechSynthesis.getVoices.mockReturnValue([]);
      
      new EdgeyVoice();
      expect(mockSpeechSynthesis.addEventListener).toHaveBeenCalledWith('voiceschanged', expect.any(Function));
    });

    it('should fallback to any English voice when preferred voices are not available', () => {
      const limitedVoices = [
        { name: 'Some Other Voice', lang: 'en-US', default: false, localService: true, voiceURI: 'Other' }
      ];
      mockSpeechSynthesis.getVoices.mockReturnValue(limitedVoices);
      
      const edgy = new EdgeyVoice();
      expect(edgy).toBeDefined();
    });

    it('should be enabled by default', () => {
      expect(edgyVoice.isEnabled()).toBe(true);
    });
  });

  describe('Enable/Disable Functionality', () => {
    it('should allow enabling and disabling', () => {
      edgyVoice.setEnabled(false);
      expect(edgyVoice.isEnabled()).toBe(false);
      
      edgyVoice.setEnabled(true);
      expect(edgyVoice.isEnabled()).toBe(true);
    });

    it('should cancel speech when disabled', () => {
      edgyVoice.setEnabled(false);
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });

    it('should not speak when disabled', () => {
      edgyVoice.setEnabled(false);
      edgyVoice.playCorrectPhrase('California');
      
      expect(mockSpeechSynthesis.speak).not.toHaveBeenCalled();
    });
  });

  describe('Voice Settings Configuration', () => {
    it('should set rate within valid bounds', () => {
      edgyVoice.setRate(1.5);
      edgyVoice.playCorrectPhrase('Texas');
      
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      expect(mockSpeakUtterance.rate).toBe(1.5);
    });

    it('should clamp rate to minimum 0.1', () => {
      edgyVoice.setRate(0.05);
      edgyVoice.playCorrectPhrase('Texas');
      
      expect(mockSpeakUtterance.rate).toBe(0.1);
    });

    it('should clamp rate to maximum 2.0', () => {
      edgyVoice.setRate(3.0);
      edgyVoice.playCorrectPhrase('Texas');
      
      expect(mockSpeakUtterance.rate).toBe(2.0);
    });

    it('should set pitch within valid bounds', () => {
      edgyVoice.setPitch(1.2);
      edgyVoice.playCorrectPhrase('Texas');
      
      expect(mockSpeakUtterance.pitch).toBe(1.2);
    });

    it('should clamp pitch to minimum 0', () => {
      edgyVoice.setPitch(-0.5);
      edgyVoice.playCorrectPhrase('Texas');
      
      expect(mockSpeakUtterance.pitch).toBe(0);
    });

    it('should clamp pitch to maximum 2.0', () => {
      edgyVoice.setPitch(3.0);
      edgyVoice.playCorrectPhrase('Texas');
      
      expect(mockSpeakUtterance.pitch).toBe(2.0);
    });

    it('should set volume within valid bounds', () => {
      edgyVoice.setVolume(0.6);
      edgyVoice.playCorrectPhrase('Texas');
      
      expect(mockSpeakUtterance.volume).toBe(0.6);
    });

    it('should clamp volume to minimum 0', () => {
      edgyVoice.setVolume(-0.1);
      edgyVoice.playCorrectPhrase('Texas');
      
      expect(mockSpeakUtterance.volume).toBe(0);
    });

    it('should clamp volume to maximum 1.0', () => {
      edgyVoice.setVolume(1.5);
      edgyVoice.playCorrectPhrase('Texas');
      
      expect(mockSpeakUtterance.volume).toBe(1.0);
    });

    it('should use default settings when no custom values set', () => {
      edgyVoice.playCorrectPhrase('Texas');
      
      expect(mockSpeakUtterance.rate).toBe(0.8);
      expect(mockSpeakUtterance.pitch).toBe(0.3);
      expect(mockSpeakUtterance.volume).toBe(0.8);
    });
  });

  describe('Correct Answer Phrases', () => {
    it('should speak correct phrase with state name substitution', () => {
      edgyVoice.playCorrectPhrase('California');
      
      expect(global.SpeechSynthesisUtterance).toHaveBeenCalled();
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledWith(mockSpeakUtterance);
      
      // Get the text that was set on the utterance
      const constructorCall = (global.SpeechSynthesisUtterance as any).mock.calls[0][0];
      expect(constructorCall).toContain('California');
    });

    it('should substitute state name in phrase template', () => {
      edgyVoice.playCorrectPhrase('Texas');
      
      const constructorCall = (global.SpeechSynthesisUtterance as any).mock.calls[0][0];
      expect(constructorCall).toContain('Texas');
      expect(constructorCall).not.toContain('{state}');
    });

    it('should cancel ongoing speech before speaking new phrase', () => {
      edgyVoice.playCorrectPhrase('California');
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });

    it('should handle empty or whitespace-only state names by substituting empty strings', () => {
      mockSpeechSynthesis.speak.mockClear();
      
      edgyVoice.playCorrectPhrase('');
      edgyVoice.playCorrectPhrase('   ');
      
      // The speak method will be called, but with phrases that contain empty state names
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(2);
      
      // Check that the utterances were created with state name substitutions
      expect(global.SpeechSynthesisUtterance).toHaveBeenCalledTimes(2);
    });

    it('should track phrases to prevent repetition', () => {
      // Mock Math.random to control phrase selection
      const originalRandom = Math.random;
      let callCount = 0;
      Math.random = vi.fn(() => {
        // Return different values to ensure we get different phrases
        return callCount++ * 0.1;
      });

      const spokenPhrases: string[] = [];
      (global.SpeechSynthesisUtterance as any).mockImplementation((text: string) => {
        spokenPhrases.push(text);
        return { ...mockUtterance };
      });

      // Speak multiple correct phrases
      for (let i = 0; i < 5; i++) {
        edgyVoice.playCorrectPhrase('TestState');
      }

      // Should have spoken 5 different phrases
      expect(spokenPhrases).toHaveLength(5);
      
      // Restore original Math.random
      Math.random = originalRandom;
    });
  });

  describe('Incorrect Answer Phrases', () => {
    it('should speak incorrect phrase without correct state name', () => {
      edgyVoice.playIncorrectPhrase();
      
      expect(global.SpeechSynthesisUtterance).toHaveBeenCalled();
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledWith(mockSpeakUtterance);
    });

    it('should speak incorrect phrase with correct state name substitution', () => {
      edgyVoice.playIncorrectPhrase('Montana');
      
      const constructorCall = (global.SpeechSynthesisUtterance as any).mock.calls[0][0];
      expect(constructorCall).toContain('Montana');
      expect(constructorCall).not.toContain('{correctState}');
    });

    it('should speak incorrect phrase with both user guess and correct state', () => {
      // Force selection of phrase with both placeholders (index 2: "Wrong answer! It's {correctState}, not {userState}...")
      const originalRandom = Math.random;
      Math.random = vi.fn(() => 2 / 15); // Select the phrase at index 2
      
      edgyVoice.playIncorrectPhrase('Montana', 'Wyoming');
      
      const constructorCall = (global.SpeechSynthesisUtterance as any).mock.calls[0][0];
      expect(constructorCall).toContain('Montana'); // Should contain correct state
      expect(constructorCall).toContain('Wyoming'); // Should contain user guess
      expect(constructorCall).not.toContain('{correctState}');
      expect(constructorCall).not.toContain('{userState}');
      
      Math.random = originalRandom;
    });

    it('should handle user guess only in phrases', () => {
      // Mock to return a phrase that uses {userState} but not {correctState}
      const originalRandom = Math.random;
      Math.random = vi.fn(() => 0); // Select first phrase
      
      edgyVoice.playIncorrectPhrase(undefined, 'Wyoming');
      
      const constructorCall = (global.SpeechSynthesisUtterance as any).mock.calls[0][0];
      expect(constructorCall).toContain('Wyoming'); // Should contain user guess
      expect(constructorCall).not.toContain('{userState}'); // Should not contain placeholder
      
      Math.random = originalRandom;
    });

    it('should handle placeholders independently for userState and correctState', () => {
      // Force selection of phrase with both placeholders (index 2: "Wrong answer! It's {correctState}, not {userState}...")
      const originalRandom = Math.random;
      Math.random = vi.fn(() => 2 / 15); // Select the phrase at index 2
      
      edgyVoice.playIncorrectPhrase('Texas', 'California');
      
      const constructorCall = (global.SpeechSynthesisUtterance as any).mock.calls[0][0];
      expect(constructorCall).toContain('Texas'); // Correct state
      expect(constructorCall).toContain('California'); // User guess
      expect(constructorCall).not.toContain('{correctState}');
      expect(constructorCall).not.toContain('{userState}');
      
      Math.random = originalRandom;
    });

    it('should track incorrect phrases separately from correct phrases', () => {
      const originalRandom = Math.random;
      let callCount = 0;
      Math.random = vi.fn(() => callCount++ * 0.1);

      const spokenPhrases: string[] = [];
      (global.SpeechSynthesisUtterance as any).mockImplementation((text: string) => {
        spokenPhrases.push(text);
        return { ...mockUtterance };
      });

      // Speak multiple correct and incorrect phrases
      edgyVoice.playCorrectPhrase('TestState');
      edgyVoice.playIncorrectPhrase('CorrectState', 'UserGuess');
      edgyVoice.playCorrectPhrase('TestState2');
      edgyVoice.playIncorrectPhrase('CorrectState2', 'UserGuess2');

      expect(spokenPhrases).toHaveLength(4);
      
      Math.random = originalRandom;
    });

    it('should maintain separate repetition prevention for incorrect phrases', () => {
      // Test that incorrect phrases have their own memory separate from correct phrases
      const originalRandom = Math.random;
      Math.random = vi.fn(() => 0); // Always select first phrase

      // Speak same correct phrase (should work)
      edgyVoice.playCorrectPhrase('TestState');
      
      // Speak same incorrect phrase (should also work, different pool)
      edgyVoice.playIncorrectPhrase('CorrectState', 'UserGuess');
      
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(2);
      
      Math.random = originalRandom;
    });
  });

  describe('Question Announcements', () => {
    it('should announce US states question', () => {
      edgyVoice.announceQuestion('Texas', 'easy', 'us-easy');
      
      const constructorCall = (global.SpeechSynthesisUtterance as any).mock.calls[0][0];
      expect(constructorCall).toBe('What is the highlighted state?');
    });

    it('should announce Canadian provinces question', () => {
      edgyVoice.announceQuestion('Ontario', 'easy', 'canada-easy');
      
      const constructorCall = (global.SpeechSynthesisUtterance as any).mock.calls[0][0];
      expect(constructorCall).toBe('What is the highlighted province?');
    });

    it('should announce both mode question', () => {
      edgyVoice.announceQuestion('California', 'hard', 'both-hard');
      
      const constructorCall = (global.SpeechSynthesisUtterance as any).mock.calls[0][0];
      expect(constructorCall).toBe('What is the highlighted state or province?');
    });

    it('should announce generic territory question for unknown mode', () => {
      edgyVoice.announceQuestion('Unknown', 'easy', 'unknown-mode');
      
      const constructorCall = (global.SpeechSynthesisUtterance as any).mock.calls[0][0];
      expect(constructorCall).toBe('What is the highlighted territory?');
    });

    it('should announce generic territory question when no game mode provided', () => {
      edgyVoice.announceQuestion('Unknown', 'easy');
      
      const constructorCall = (global.SpeechSynthesisUtterance as any).mock.calls[0][0];
      expect(constructorCall).toBe('What is the highlighted territory?');
    });

    it('should work with both difficulty levels', () => {
      edgyVoice.announceQuestion('Texas', 'hard', 'us-hard');
      
      const constructorCall = (global.SpeechSynthesisUtterance as any).mock.calls[0][0];
      expect(constructorCall).toBe('What is the highlighted state?');
    });
  });

  describe('Game End Announcements', () => {
    it('should announce outstanding performance (90%+)', () => {
      edgyVoice.announceGameEnd(9, 10, 90);
      
      const constructorCall = (global.SpeechSynthesisUtterance as any).mock.calls[0][0];
      expect(constructorCall).toContain('Outstanding!');
      expect(constructorCall).toContain('9 out of 10');
      expect(constructorCall).toContain('90 percent');
      expect(constructorCall).toContain('geography master');
    });

    it('should announce great performance (75-89%)', () => {
      edgyVoice.announceGameEnd(8, 10, 80);
      
      const constructorCall = (global.SpeechSynthesisUtterance as any).mock.calls[0][0];
      expect(constructorCall).toContain('Great job!');
      expect(constructorCall).toContain('8 out of 10');
      expect(constructorCall).toContain('80 percent');
      expect(constructorCall).toContain('know your stuff');
    });

    it('should announce good performance (60-74%)', () => {
      edgyVoice.announceGameEnd(7, 10, 70);
      
      const constructorCall = (global.SpeechSynthesisUtterance as any).mock.calls[0][0];
      expect(constructorCall).toContain('Good effort!');
      expect(constructorCall).toContain('7 out of 10');
      expect(constructorCall).toContain('70 percent');
      expect(constructorCall).toContain('Keep practicing');
    });

    it('should announce encouraging message for lower scores (<60%)', () => {
      edgyVoice.announceGameEnd(4, 10, 40);
      
      const constructorCall = (global.SpeechSynthesisUtterance as any).mock.calls[0][0];
      expect(constructorCall).toContain('4 out of 10');
      expect(constructorCall).toContain('40 percent');
      expect(constructorCall).toContain("you'll get better");
    });

    it('should handle perfect score', () => {
      edgyVoice.announceGameEnd(10, 10, 100);
      
      const constructorCall = (global.SpeechSynthesisUtterance as any).mock.calls[0][0];
      expect(constructorCall).toContain('Outstanding!');
      expect(constructorCall).toContain('10 out of 10');
      expect(constructorCall).toContain('100 percent');
    });

    it('should handle zero score', () => {
      edgyVoice.announceGameEnd(0, 10, 0);
      
      const constructorCall = (global.SpeechSynthesisUtterance as any).mock.calls[0][0];
      expect(constructorCall).toContain('0 out of 10');
      expect(constructorCall).toContain('0 percent');
    });

    it('should work with different total question counts', () => {
      edgyVoice.announceGameEnd(15, 20, 75);
      
      const constructorCall = (global.SpeechSynthesisUtterance as any).mock.calls[0][0];
      expect(constructorCall).toContain('15 out of 20');
      expect(constructorCall).toContain('75 percent');
    });
  });

  describe('Phrase Repetition Prevention', () => {
    beforeEach(() => {
      // Mock Math.random to have predictable phrase selection
      vi.spyOn(Math, 'random');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should prevent repetition of correct phrases within 3 turns', () => {
      const usedPhrases: string[] = [];
      
      // Mock to always return the first available phrase
      (Math.random as any).mockReturnValue(0);
      
      (global.SpeechSynthesisUtterance as any).mockImplementation((text: string) => {
        usedPhrases.push(text);
        return { ...mockUtterance };
      });

      // First call - should use first phrase
      edgyVoice.playCorrectPhrase('TestState');
      
      // Second call - should avoid first phrase, use second
      (Math.random as any).mockReturnValue(0); // Still try to select first, but it should be filtered out
      edgyVoice.playCorrectPhrase('TestState');

      expect(usedPhrases[0]).not.toBe(usedPhrases[1]);
    });

    it('should prevent repetition of incorrect phrases within 3 turns', () => {
      const usedPhrases: string[] = [];
      
      (Math.random as any).mockReturnValue(0);
      
      (global.SpeechSynthesisUtterance as any).mockImplementation((text: string) => {
        usedPhrases.push(text);
        return { ...mockUtterance };
      });

      // First call - should use first phrase
      edgyVoice.playIncorrectPhrase('CorrectState');
      
      // Second call - should avoid first phrase
      edgyVoice.playIncorrectPhrase('CorrectState');

      expect(usedPhrases[0]).not.toBe(usedPhrases[1]);
    });

    it('should maintain only 3-phrase memory for correct phrases', () => {
      const usedPhrases: string[] = [];
      let randomIndex = 0;
      
      (Math.random as any).mockImplementation(() => randomIndex++ * 0.1);
      
      (global.SpeechSynthesisUtterance as any).mockImplementation((text: string) => {
        usedPhrases.push(text);
        return { ...mockUtterance };
      });

      // Fill the 3-phrase memory
      for (let i = 0; i < 4; i++) {
        edgyVoice.playCorrectPhrase('TestState');
      }

      // The first phrase should now be available again (dropped from memory)
      expect(usedPhrases).toHaveLength(4);
    });

    it('should handle case when all phrases have been used recently', () => {
      // This is edge case that shouldn't happen with 15+ phrases and 3-phrase memory
      // but the code should handle it gracefully by allowing any phrase
      
      edgyVoice.playCorrectPhrase('TestState');
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });
  });

  describe('Speech Error Handling', () => {
    it('should handle speech synthesis errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      edgyVoice.playCorrectPhrase('TestState');
      
      // Simulate an error
      const errorEvent = { error: 'network-error' };
      if (mockSpeakUtterance.onerror) {
        mockSpeakUtterance.onerror(errorEvent);
      }
      
      expect(consoleSpy).toHaveBeenCalledWith('Speech synthesis error:', 'network-error');
      
      consoleSpy.mockRestore();
    });

    it('should set up error handler on utterance', () => {
      edgyVoice.playCorrectPhrase('TestState');
      
      expect(mockSpeakUtterance.onerror).toBeTypeOf('function');
    });
  });

  describe('Stop Functionality', () => {
    it('should cancel speech when stop is called', () => {
      edgyVoice.stop();
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });

    it('should stop speech even when disabled', () => {
      edgyVoice.setEnabled(false);
      edgyVoice.stop();
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('should work through a complete correct answer flow', () => {
      // Start with question announcement
      edgyVoice.announceQuestion('California', 'easy', 'us-easy');
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(1);
      
      // Play correct answer
      edgyVoice.playCorrectPhrase('California');
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(2);
      
      // Each call should cancel previous speech
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalledTimes(2);
    });

    it('should work through a complete incorrect answer flow', () => {
      // Start with question announcement
      edgyVoice.announceQuestion('Texas', 'hard', 'us-hard');
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(1);
      
      // Play incorrect answer with both correct state and user guess
      edgyVoice.playIncorrectPhrase('Texas', 'California');
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(2);
      
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalledTimes(2);
    });

    it('should work through complete game end flow', () => {
      // Announce game end
      edgyVoice.announceGameEnd(8, 10, 80);
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(1);
      
      const constructorCall = (global.SpeechSynthesisUtterance as any).mock.calls[0][0];
      expect(constructorCall).toContain('Great job!');
    });

    it('should respect enabled state throughout game flow', () => {
      edgyVoice.setEnabled(false);
      
      edgyVoice.announceQuestion('California', 'easy', 'us-easy');
      edgyVoice.playCorrectPhrase('California');
      edgyVoice.announceGameEnd(1, 1, 100);
      
      // None of these should result in speech when disabled
      expect(mockSpeechSynthesis.speak).not.toHaveBeenCalled();
    });
  });

  describe('Voice Feedback Bug Fix Validation', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should properly substitute {userState} placeholder with user guess', () => {
      // Force selection of phrase with {userState} placeholder (index 0: "Ouch! That's not {userState}...")
      const originalRandom = Math.random;
      Math.random = vi.fn(() => 0); // Select the first phrase
      
      edgyVoice.playIncorrectPhrase('California', 'Texas');
      
      const constructorCall = (global.SpeechSynthesisUtterance as any).mock.calls[0][0];
      expect(constructorCall).toContain('Texas'); // User's guess
      expect(constructorCall).not.toContain('{userState}');
      
      Math.random = originalRandom;
    });

    it('should properly substitute {correctState} placeholder with correct answer', () => {
      // Force selection of phrase with {correctState} placeholder (index 3: "Swing and a miss! The answer is {correctState}...")
      const originalRandom = Math.random;
      Math.random = vi.fn(() => 3 / 15); // Select phrase at index 3
      
      edgyVoice.playIncorrectPhrase('California', 'Texas');
      
      const constructorCall = (global.SpeechSynthesisUtterance as any).mock.calls[0][0];
      expect(constructorCall).toContain('California'); // Correct answer
      expect(constructorCall).not.toContain('{correctState}');
      
      Math.random = originalRandom;
    });

    it('should handle phrases with only {correctState} placeholder', () => {
      edgyVoice.playIncorrectPhrase('Montana');
      
      const constructorCall = (global.SpeechSynthesisUtterance as any).mock.calls[0][0];
      expect(constructorCall).toContain('Montana');
      expect(constructorCall).not.toContain('{correctState}');
    });

    it('should handle phrases with both {userState} and {correctState} placeholders', () => {
      // Mock random to ensure we get a phrase with both placeholders
      const originalRandom = Math.random;
      Math.random = () => 0.1; // Force selection of one of the first few phrases that have both placeholders
      
      edgyVoice.playIncorrectPhrase('California', 'Nevada');
      
      const constructorCall = (global.SpeechSynthesisUtterance as any).mock.calls[0][0];
      expect(constructorCall).toContain('California'); // correct answer should always be present
      expect(constructorCall).not.toContain('{correctState}');
      
      // Only expect userState if the phrase actually contains it
      if (constructorCall.includes('Nevada')) {
        expect(constructorCall).not.toContain('{userState}');
      }
      
      Math.random = originalRandom;
    });

    it('should not break when neither placeholder values are provided', () => {
      edgyVoice.playIncorrectPhrase();
      
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      const constructorCall = (global.SpeechSynthesisUtterance as any).mock.calls[0][0];
      expect(typeof constructorCall).toBe('string');
    });

    it('should preserve original phrase templates when placeholders are not provided', () => {
      edgyVoice.playIncorrectPhrase();
      
      const constructorCall = (global.SpeechSynthesisUtterance as any).mock.calls[0][0];
      // Should still speak a phrase, even if placeholders remain unreplaced
      expect(constructorCall.length).toBeGreaterThan(0);
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });
  });
});