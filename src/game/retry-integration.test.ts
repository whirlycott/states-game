// ABOUTME: Integration tests for the retry functionality in hard mode
// ABOUTME: Tests the complete flow of close answer detection and retry prompting

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { StatesGame } from './StatesGame.js';

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
    { name: 'Alex', lang: 'en-US', default: false, localService: true, voiceURI: 'Alex' }
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

describe('Retry Integration Tests', () => {
    let dom: JSDOM;
    let game: StatesGame;

    beforeEach(async () => {
        // Setup DOM environment FIRST
        dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <div id="map-container"></div>
                <div id="mode-selection" style="display: flex;">
                    <button id="select-easy"></button>
                    <button id="select-hard"></button>
                    <button id="select-us"></button>
                    <button id="select-canada"></button>
                    <button id="select-both"></button>
                </div>
                <div id="game-container" style="display: none;">
                    <div id="current-question"></div>
                    <div id="progress"></div>
                    <div id="options"></div>
                    <div id="feedback" class="feedback-text"></div>
                    <div id="text-input-container" class="hidden">
                        <input id="text-answer-input" type="text">
                        <button id="submit-answer-btn">Submit</button>
                    </div>
                    <button id="back-to-menu"></button>
                    <button id="reset-game"></button>
                    <button id="next-question"></button>
                </div>
                <div id="correct-count">0</div>
                <div id="incorrect-count">0</div>
                <div id="score-percentage">0%</div>
                <div id="progress-bar" style="width: 0%;"></div>
            </body>
            </html>
        `);
        
        // @ts-ignore - Setting up global for testing
        global.document = dom.window.document;
        // @ts-ignore
        global.window = dom.window;
        // @ts-ignore
        global.Element = dom.window.Element;
        // @ts-ignore
        global.HTMLElement = dom.window.HTMLElement;
        // @ts-ignore
        global.HTMLInputElement = dom.window.HTMLInputElement;
        // @ts-ignore
        global.HTMLButtonElement = dom.window.HTMLButtonElement;
        
        // NOW set up audio API mocks on the window object
        // @ts-ignore
        dom.window.AudioContext = MockAudioContext;
        // @ts-ignore
        dom.window.webkitAudioContext = MockAudioContext;
        // @ts-ignore  
        dom.window.speechSynthesis = mockSpeechSynthesis;
        // @ts-ignore
        dom.window.SpeechSynthesisUtterance = global.SpeechSynthesisUtterance;
        
        // Reset all mocks
        vi.clearAllMocks();
        
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
        
        // Reset speech synthesis mocks
        mockSpeechSynthesis.speak.mockClear();
        mockSpeechSynthesis.cancel.mockClear();
        mockSpeechSynthesis.getVoices.mockReturnValue(mockVoices);
        (global.SpeechSynthesisUtterance as any).mockReturnValue({ ...mockUtterance });
        
        // Mock fetch for SVG loading
        // @ts-ignore
        global.fetch = vi.fn().mockResolvedValue({
            text: () => Promise.resolve('<svg viewBox="0 0 2289 1744"><path id="TX" d="M1,1 L2,2 Z"/></svg>')
        });

        // Create game instance and wait for initialization
        game = new StatesGame();
        await new Promise(resolve => setTimeout(resolve, 100)); // Allow async initialization
    });

    it('should show retry prompt for close answers in hard mode', async () => {
        // Set up hard mode manually
        // @ts-ignore - Accessing private property for testing
        game.difficulty = 'hard';
        // @ts-ignore
        game.questions = [{ stateId: 'TX', stateName: 'Texas', region: 'us' as const }];
        // @ts-ignore
        game.currentQuestion = 0;
        // @ts-ignore
        game.hasRetried = false;
        
        const input = document.getElementById('text-answer-input') as HTMLInputElement;
        const feedbackDiv = document.getElementById('feedback');
        
        expect(input).toBeTruthy();
        expect(feedbackDiv).toBeTruthy();
        
        // Simulate user typing a close but incorrect answer
        input.value = 'Texa'; // Close to 'Texas' with distance 1
        
        // Simulate submit button click
        // @ts-ignore - Accessing private method for testing
        game.submitTextAnswer();
        
        // Check that second chance indicator is shown
        expect(feedbackDiv?.textContent).toBe('Second chance!');
        expect(feedbackDiv?.classList.contains('retry-hint')).toBe(true);
        
        // Input should keep original value and remain enabled
        expect(input.value).toBe('Texa');
        expect(input.disabled).toBe(false);
        
        // Submit button should change text
        const submitBtn = document.getElementById('submit-answer-btn');
        expect(submitBtn?.textContent).toBe('Try Again');
    });

    it('should not show retry prompt for exact matches', async () => {
        // @ts-ignore
        game.difficulty = 'hard';
        // @ts-ignore
        game.questions = [{ stateId: 'TX', stateName: 'Texas', region: 'us' as const }];
        // @ts-ignore
        game.currentQuestion = 0;
        // @ts-ignore
        game.hasRetried = false;
        
        const input = document.getElementById('text-answer-input') as HTMLInputElement;
        const feedbackDiv = document.getElementById('feedback');
        
        // Simulate user typing the correct answer
        input.value = 'Texas';
        
        // @ts-ignore
        game.submitTextAnswer();
        
        // Should not show second chance indicator for correct answer
        expect(feedbackDiv?.textContent).not.toBe('Second chance!');
        expect(input.disabled).toBe(true); // Should be disabled for correct answer
    });

    it('should not show retry prompt in easy mode', async () => {
        // @ts-ignore
        game.difficulty = 'easy';
        // @ts-ignore
        game.questions = [{ stateId: 'TX', stateName: 'Texas', region: 'us' as const }];
        // @ts-ignore
        game.currentQuestion = 0;
        // @ts-ignore
        game.hasRetried = false;
        
        const input = document.getElementById('text-answer-input') as HTMLInputElement;
        const feedbackDiv = document.getElementById('feedback');
        
        // Simulate user typing a close but incorrect answer
        input.value = 'Texa';
        
        // @ts-ignore
        game.submitTextAnswer();
        
        // Should not show second chance indicator in easy mode
        expect(feedbackDiv?.textContent).not.toBe('Second chance!');
        expect(input.disabled).toBe(true); // Should be disabled (marked wrong)
    });

    it('should only allow one retry per question', async () => {
        // @ts-ignore
        game.difficulty = 'hard';
        // @ts-ignore
        game.questions = [{ stateId: 'TX', stateName: 'Texas', region: 'us' as const }];
        // @ts-ignore
        game.currentQuestion = 0;
        // @ts-ignore
        game.hasRetried = true; // Already retried
        
        const input = document.getElementById('text-answer-input') as HTMLInputElement;
        const feedbackDiv = document.getElementById('feedback');
        
        // Simulate user typing a close but incorrect answer
        input.value = 'Texa';
        
        // @ts-ignore
        game.submitTextAnswer();
        
        // Should not show second chance indicator since already retried
        expect(feedbackDiv?.textContent).not.toBe('Second chance!');
        expect(input.disabled).toBe(true); // Should be disabled (marked wrong)
    });
});