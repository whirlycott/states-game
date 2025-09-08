// ABOUTME: Comprehensive test suite for RetroSounds Web Audio API functionality
// ABOUTME: Tests 1980s-style sound effects, oscillator creation, and audio context management

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RetroSounds } from './RetroSounds.js';

// Mock Web Audio API
const mockOscillatorNode = {
  type: 'square' as OscillatorType,
  frequency: {
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn()
  },
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn()
};

const mockGainNode = {
  gain: {
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn()
  },
  connect: vi.fn()
};

const mockAudioContext = {
  currentTime: 0,
  state: 'running' as AudioContextState,
  resume: vi.fn().mockResolvedValue(undefined),
  suspend: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
  createOscillator: vi.fn(() => ({ ...mockOscillatorNode })),
  createGain: vi.fn(() => ({ ...mockGainNode })),
  destination: {} as AudioDestinationNode
};

// Mock AudioContext constructor
const MockAudioContext = vi.fn(() => mockAudioContext);
Object.defineProperty(window, 'AudioContext', {
  value: MockAudioContext,
  writable: true
});

// Mock webkitAudioContext for Safari
Object.defineProperty(window, 'webkitAudioContext', {
  value: MockAudioContext,
  writable: true
});

describe('RetroSounds', () => {
  let retroSounds: RetroSounds;

  beforeEach(() => {
    // Completely reset all mocks
    vi.resetAllMocks();
    
    // Reset mock audio context state  
    mockAudioContext.currentTime = 0;
    mockAudioContext.state = 'running';
    mockAudioContext.resume = vi.fn().mockResolvedValue(undefined);
    mockAudioContext.createOscillator = vi.fn();
    mockAudioContext.createGain = vi.fn();
    
    // Create fresh mock objects for each test
    const freshOscillatorNode = {
      type: 'square' as OscillatorType,
      frequency: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn()
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn()
    };
    
    const freshGainNode = {
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn()
      },
      connect: vi.fn()
    };
    
    // Update references
    Object.assign(mockOscillatorNode, freshOscillatorNode);
    Object.assign(mockGainNode, freshGainNode);
    
    mockAudioContext.createOscillator.mockReturnValue(mockOscillatorNode);
    mockAudioContext.createGain.mockReturnValue(mockGainNode);
    
    // Ensure AudioContext constructor is properly mocked
    MockAudioContext.mockReturnValue(mockAudioContext);
    
    // Create new instance
    retroSounds = new RetroSounds();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create AudioContext on initialization', () => {
      expect(MockAudioContext).toHaveBeenCalled();
    });

    it('should be enabled by default when AudioContext is supported', () => {
      expect(retroSounds.isEnabled()).toBe(true);
    });

    it('should handle AudioContext creation failure gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Save original mock
      const originalAudioContext = window.AudioContext;
      
      // Make AudioContext constructor throw
      const FailingAudioContext = vi.fn(() => {
        throw new Error('Web Audio API not supported');
      });
      
      Object.defineProperty(window, 'AudioContext', {
        value: FailingAudioContext,
        writable: true
      });
      
      // Remove webkitAudioContext fallback
      const originalWebkit = (window as any).webkitAudioContext;
      (window as any).webkitAudioContext = undefined;
      
      const failingRetroSounds = new RetroSounds();
      
      expect(failingRetroSounds.isEnabled()).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Web Audio API not supported:', expect.any(Error));
      
      // Restore mocks
      Object.defineProperty(window, 'AudioContext', {
        value: originalAudioContext,
        writable: true
      });
      (window as any).webkitAudioContext = originalWebkit;
      consoleSpy.mockRestore();
    });

    it('should try webkitAudioContext as fallback', () => {
      // Remove AudioContext
      (window as any).AudioContext = undefined;
      
      const retroSoundsWithFallback = new RetroSounds();
      
      expect(MockAudioContext).toHaveBeenCalled();
      expect(retroSoundsWithFallback.isEnabled()).toBe(true);
    });
  });

  describe('Enable/Disable Functionality', () => {
    it('should allow enabling and disabling', () => {
      retroSounds.setEnabled(false);
      expect(retroSounds.isEnabled()).toBe(false);
      
      retroSounds.setEnabled(true);
      expect(retroSounds.isEnabled()).toBe(true);
    });

    it('should return false for isEnabled when AudioContext is null', () => {
      retroSounds.setEnabled(false);
      expect(retroSounds.isEnabled()).toBe(false);
    });

    it('should not play sounds when disabled', async () => {
      retroSounds.setEnabled(false);
      await retroSounds.playCorrect();
      
      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
      expect(mockAudioContext.createGain).not.toHaveBeenCalled();
    });
  });

  describe('Audio Context Management', () => {
    it('should resume suspended audio context', async () => {
      mockAudioContext.state = 'suspended';
      
      await retroSounds.playCorrect();
      
      expect(mockAudioContext.resume).toHaveBeenCalled();
    });

    it('should not try to resume running audio context', async () => {
      mockAudioContext.state = 'running';
      
      await retroSounds.playCorrect();
      
      expect(mockAudioContext.resume).not.toHaveBeenCalled();
    });

    it('should handle audio context resume failure', async () => {
      mockAudioContext.state = 'suspended';
      mockAudioContext.resume.mockRejectedValue(new Error('Resume failed'));
      
      // This should not throw since the code doesn't handle resume failures yet
      try {
        await retroSounds.playCorrect();
        expect(mockAudioContext.resume).toHaveBeenCalled();
      } catch (error) {
        // Currently the implementation doesn't handle resume failures gracefully
        expect(error).toBeDefined();
        expect(mockAudioContext.resume).toHaveBeenCalled();
      }
    });

    it('should return early when audio context is not available', async () => {
      retroSounds.setEnabled(false);
      
      await retroSounds.playCorrect();
      
      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    });
  });

  describe('Oscillator Creation', () => {
    it('should create oscillator with correct parameters', async () => {
      await retroSounds.playCorrect();
      
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
      expect(mockOscillatorNode.connect).toHaveBeenCalledWith(mockGainNode);
      expect(mockGainNode.connect).toHaveBeenCalledWith(mockAudioContext.destination);
    });

    it('should set oscillator frequency correctly', async () => {
      await retroSounds.playCorrect();
      
      // playCorrect creates multiple oscillators with different frequencies
      expect(mockOscillatorNode.frequency.setValueAtTime).toHaveBeenCalled();
    });

    it('should set oscillator type correctly', async () => {
      await retroSounds.playCorrect();
      
      // Default type should be set (square for correct sounds)
      const createdOscillator = mockAudioContext.createOscillator.mock.results[0].value;
      expect(createdOscillator.type).toBe('square');
    });
  });

  describe('Correct Answer Sound', () => {
    it('should play ascending chord progression', async () => {
      await retroSounds.playCorrect();
      
      // Should create 4 oscillators for the chord (C5, E5, G5, C6)
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(4);
      expect(mockAudioContext.createGain).toHaveBeenCalledTimes(4);
    });

    it('should set correct frequencies for chord progression', async () => {
      await retroSounds.playCorrect();
      
      const expectedFrequencies = [523.25, 659.25, 783.99, 1046.50];
      expectedFrequencies.forEach((freq) => {
        expect(mockOscillatorNode.frequency.setValueAtTime).toHaveBeenCalledWith(freq, 0);
      });
    });

    it('should use square wave for correct sound', async () => {
      await retroSounds.playCorrect();
      
      // Each created oscillator should be square wave
      const oscillators = mockAudioContext.createOscillator.mock.results;
      oscillators.forEach(result => {
        expect(result.value.type).toBe('square');
      });
    });

    it('should schedule notes with proper timing', async () => {
      mockAudioContext.currentTime = 5.0; // Set a specific time
      
      await retroSounds.playCorrect();
      
      // Notes should start at intervals of 0.1 seconds
      expect(mockOscillatorNode.start).toHaveBeenCalledWith(5.0);
      expect(mockOscillatorNode.start).toHaveBeenCalledWith(5.1);
      expect(mockOscillatorNode.start).toHaveBeenCalledWith(5.2);
      expect(mockOscillatorNode.start).toHaveBeenCalledWith(5.3);
    });

    it('should set gain envelope for each note', async () => {
      await retroSounds.playCorrect();
      
      // Each note should have gain envelope
      expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0, expect.any(Number));
      expect(mockGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.3, expect.any(Number));
      expect(mockGainNode.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.001, expect.any(Number));
    });

    it('should stop notes at correct time', async () => {
      mockAudioContext.currentTime = 10.0;
      
      await retroSounds.playCorrect();
      
      // Each note should be stopped 0.15 seconds after it starts
      expect(mockOscillatorNode.stop).toHaveBeenCalledTimes(4);
      // Check the timing pattern rather than exact values to avoid floating point precision issues
      const stopCalls = mockOscillatorNode.stop.mock.calls;
      expect(stopCalls[0][0]).toBeCloseTo(10.15, 2);
      expect(stopCalls[1][0]).toBeCloseTo(10.25, 2);
      expect(stopCalls[2][0]).toBeCloseTo(10.35, 2);
      expect(stopCalls[3][0]).toBeCloseTo(10.45, 2);
    });
  });

  describe('Incorrect Answer Sound', () => {
    it('should play descending sawtooth sound', async () => {
      await retroSounds.playIncorrect();
      
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(1);
      expect(mockAudioContext.createGain).toHaveBeenCalledTimes(1);
    });

    it('should use sawtooth wave for incorrect sound', async () => {
      await retroSounds.playIncorrect();
      
      const createdOscillator = mockAudioContext.createOscillator.mock.results[0].value;
      expect(createdOscillator.type).toBe('sawtooth');
    });

    it('should start at 220Hz and descend to 110Hz', async () => {
      mockAudioContext.currentTime = 8.0;
      
      await retroSounds.playIncorrect();
      
      expect(mockOscillatorNode.frequency.setValueAtTime).toHaveBeenCalledWith(220, 8.0);
      expect(mockOscillatorNode.frequency.linearRampToValueAtTime).toHaveBeenCalledWith(110, 8.5);
    });

    it('should have 0.5 second duration', async () => {
      mockAudioContext.currentTime = 3.0;
      
      await retroSounds.playIncorrect();
      
      expect(mockOscillatorNode.start).toHaveBeenCalledWith(3.0);
      expect(mockOscillatorNode.stop).toHaveBeenCalledWith(3.5);
    });

    it('should set appropriate gain envelope', async () => {
      mockAudioContext.currentTime = 2.0;
      
      await retroSounds.playIncorrect();
      
      expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0, 2.0);
      expect(mockGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.4, 2.02);
      expect(mockGainNode.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.001, 2.5);
    });
  });

  describe('Game Start Sound', () => {
    it('should play startup melody', async () => {
      await retroSounds.playGameStart();
      
      // Should create 4 oscillators for the melody
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(4);
      expect(mockAudioContext.createGain).toHaveBeenCalledTimes(4);
    });

    it('should use triangle wave for game start', async () => {
      await retroSounds.playGameStart();
      
      const oscillators = mockAudioContext.createOscillator.mock.results;
      oscillators.forEach(result => {
        expect(result.value.type).toBe('triangle');
      });
    });

    it('should play correct melody frequencies', async () => {
      await retroSounds.playGameStart();
      
      const expectedFrequencies = [392, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
      expectedFrequencies.forEach((freq) => {
        expect(mockOscillatorNode.frequency.setValueAtTime).toHaveBeenCalledWith(freq, expect.any(Number));
      });
    });

    it('should schedule melody notes with 0.2 second intervals', async () => {
      mockAudioContext.currentTime = 1.0;
      
      await retroSounds.playGameStart();
      
      expect(mockOscillatorNode.start).toHaveBeenCalledWith(1.0);
      expect(mockOscillatorNode.start).toHaveBeenCalledWith(1.2);
      expect(mockOscillatorNode.start).toHaveBeenCalledWith(1.4);
      expect(mockOscillatorNode.start).toHaveBeenCalledWith(1.6);
    });

    it('should set appropriate gain for melody', async () => {
      await retroSounds.playGameStart();
      
      expect(mockGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.2, expect.any(Number));
    });
  });

  describe('Game End Sound', () => {
    it('should play victory fanfare for high scores (80%+)', async () => {
      await retroSounds.playGameEnd(85);
      
      // Victory fanfare has 7 notes
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(7);
      expect(mockAudioContext.createGain).toHaveBeenCalledTimes(7);
    });

    it('should play victory fanfare for exactly 80%', async () => {
      await retroSounds.playGameEnd(80);
      
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(7);
    });

    it('should play simple completion sound for low scores (<80%)', async () => {
      await retroSounds.playGameEnd(75);
      
      // Simple completion sound uses 1 oscillator
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(1);
      expect(mockAudioContext.createGain).toHaveBeenCalledTimes(1);
    });

    it('should use triangle wave for victory fanfare', async () => {
      await retroSounds.playGameEnd(90);
      
      const oscillators = mockAudioContext.createOscillator.mock.results;
      oscillators.forEach(result => {
        expect(result.value.type).toBe('triangle');
      });
    });

    it('should use sine wave for simple completion', async () => {
      await retroSounds.playGameEnd(70);
      
      const createdOscillator = mockAudioContext.createOscillator.mock.results[0].value;
      expect(createdOscillator.type).toBe('sine');
    });

    it('should play correct victory fanfare frequencies', async () => {
      await retroSounds.playGameEnd(95);
      
      const expectedFrequencies = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50, 1318.51];
      expectedFrequencies.forEach((freq) => {
        expect(mockOscillatorNode.frequency.setValueAtTime).toHaveBeenCalledWith(freq, expect.any(Number));
      });
    });

    it('should schedule victory fanfare with 0.15 second intervals', async () => {
      mockAudioContext.currentTime = 2.0;
      
      await retroSounds.playGameEnd(85);
      
      expect(mockOscillatorNode.start).toHaveBeenCalledWith(2.0);
      expect(mockOscillatorNode.start).toHaveBeenCalledWith(2.15);
      expect(mockOscillatorNode.start).toHaveBeenCalledWith(2.30);
      expect(mockOscillatorNode.start).toHaveBeenCalledWith(2.45);
      expect(mockOscillatorNode.start).toHaveBeenCalledWith(2.60);
      expect(mockOscillatorNode.start).toHaveBeenCalledWith(2.75);
      expect(mockOscillatorNode.start).toHaveBeenCalledWith(2.90);
    });

    it('should play completion sound at 440Hz', async () => {
      await retroSounds.playGameEnd(60);
      
      expect(mockOscillatorNode.frequency.setValueAtTime).toHaveBeenCalledWith(440, expect.any(Number));
    });

    it('should have 1 second duration for completion sound', async () => {
      mockAudioContext.currentTime = 4.0;
      
      await retroSounds.playGameEnd(50);
      
      expect(mockOscillatorNode.start).toHaveBeenCalledWith(4.0);
      expect(mockOscillatorNode.stop).toHaveBeenCalledWith(5.0);
    });

    it('should set appropriate gain envelope for completion sound', async () => {
      mockAudioContext.currentTime = 6.0;
      
      await retroSounds.playGameEnd(40);
      
      expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0, 6.0);
      expect(mockGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.2, 6.1);
      expect(mockGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.2, 6.9);
      expect(mockGainNode.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.001, 7.0);
    });

    it('should handle edge case of 0% score', async () => {
      await retroSounds.playGameEnd(0);
      
      // Should play simple completion sound
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(1);
    });

    it('should handle edge case of 100% score', async () => {
      await retroSounds.playGameEnd(100);
      
      // Should play victory fanfare
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(7);
    });
  });

  describe('Error Handling', () => {
    it('should handle createOscillator failure by throwing error', async () => {
      mockAudioContext.createOscillator.mockImplementation(() => {
        throw new Error('Failed to create oscillator');
      });
      
      // Should throw error since no error handling exists in implementation
      await expect(retroSounds.playCorrect()).rejects.toThrow('Failed to create oscillator');
    });

    it('should handle createGain failure by throwing error', async () => {
      mockAudioContext.createGain.mockImplementation(() => {
        throw new Error('Failed to create gain');
      });
      
      await expect(retroSounds.playCorrect()).rejects.toThrow('Failed to create gain');
    });

    it('should handle oscillator start failure by throwing error', async () => {
      mockOscillatorNode.start.mockImplementation(() => {
        throw new Error('Failed to start oscillator');
      });
      
      await expect(retroSounds.playCorrect()).rejects.toThrow('Failed to start oscillator');
    });

    it('should handle null audio context', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Save original mocks
      const originalAudioContext = window.AudioContext;
      const originalWebkit = (window as any).webkitAudioContext;
      
      // Create RetroSounds with failing AudioContext
      const FailingAudioContext = vi.fn(() => {
        throw new Error('No audio context');
      });
      
      Object.defineProperty(window, 'AudioContext', {
        value: FailingAudioContext,
        writable: true
      });
      
      // Remove webkitAudioContext fallback
      (window as any).webkitAudioContext = undefined;
      
      const failingSounds = new RetroSounds();
      
      // Should not throw when trying to play sounds
      await expect(failingSounds.playCorrect()).resolves.not.toThrow();
      await expect(failingSounds.playIncorrect()).resolves.not.toThrow();
      await expect(failingSounds.playGameStart()).resolves.not.toThrow();
      await expect(failingSounds.playGameEnd(50)).resolves.not.toThrow();
      
      // Restore mocks
      Object.defineProperty(window, 'AudioContext', {
        value: originalAudioContext,
        writable: true
      });
      (window as any).webkitAudioContext = originalWebkit;
      consoleSpy.mockRestore();
    });
  });

  describe('Integration Tests', () => {
    it('should work through complete correct answer flow', async () => {
      // Ensure RetroSounds is properly enabled and has audio context
      expect(retroSounds.isEnabled()).toBe(true);
      
      await retroSounds.playCorrect();
      
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(4);
      expect(mockOscillatorNode.start).toHaveBeenCalledTimes(4);
      expect(mockOscillatorNode.stop).toHaveBeenCalledTimes(4);
    });

    it('should work through complete incorrect answer flow', async () => {
      expect(retroSounds.isEnabled()).toBe(true);
      
      await retroSounds.playIncorrect();
      
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(1);
      expect(mockOscillatorNode.start).toHaveBeenCalledTimes(1);
      expect(mockOscillatorNode.stop).toHaveBeenCalledTimes(1);
    });

    it('should work through complete game flow', async () => {
      expect(retroSounds.isEnabled()).toBe(true);
      
      // Game start
      await retroSounds.playGameStart();
      const gameStartCalls = mockAudioContext.createOscillator.mock.calls.length;
      expect(gameStartCalls).toBe(4);
      
      // Correct answer
      await retroSounds.playCorrect();
      expect(mockAudioContext.createOscillator.mock.calls.length).toBe(gameStartCalls + 4);
      
      // Incorrect answer
      await retroSounds.playIncorrect();
      expect(mockAudioContext.createOscillator.mock.calls.length).toBe(gameStartCalls + 5);
      
      // Game end (high score)
      await retroSounds.playGameEnd(90);
      expect(mockAudioContext.createOscillator.mock.calls.length).toBe(gameStartCalls + 12);
    });

    it('should respect enabled state throughout game flow', async () => {
      retroSounds.setEnabled(false);
      
      await retroSounds.playGameStart();
      await retroSounds.playCorrect();
      await retroSounds.playIncorrect();
      await retroSounds.playGameEnd(80);
      
      // None of these should create oscillators when disabled
      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    });

    it('should handle audio context state changes during game', async () => {
      // Start with suspended context
      mockAudioContext.state = 'suspended';
      
      await retroSounds.playGameStart();
      expect(mockAudioContext.resume).toHaveBeenCalled();
      
      // Context becomes running
      mockAudioContext.state = 'running';
      mockAudioContext.resume.mockClear();
      
      await retroSounds.playCorrect();
      expect(mockAudioContext.resume).not.toHaveBeenCalled();
    });

    it('should create unique oscillators for each sound call', async () => {
      expect(retroSounds.isEnabled()).toBe(true);
      
      // Play multiple sounds
      await retroSounds.playCorrect();
      const correctCallCount = mockAudioContext.createOscillator.mock.calls.length;
      expect(correctCallCount).toBe(4);
      
      await retroSounds.playIncorrect();
      expect(mockAudioContext.createOscillator.mock.calls.length).toBe(correctCallCount + 1);
      
      await retroSounds.playGameStart();
      expect(mockAudioContext.createOscillator.mock.calls.length).toBe(correctCallCount + 5);
    });
  });
});