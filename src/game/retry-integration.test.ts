// ABOUTME: Integration tests for the retry functionality in hard mode
// ABOUTME: Tests the complete flow of close answer detection and retry prompting

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { StatesGame } from './StatesGame.js';

describe('Retry Integration Tests', () => {
    let dom: JSDOM;
    let game: StatesGame;

    beforeEach(async () => {
        // Setup DOM environment
        dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <div id="mode-selection" class="hidden"></div>
                <div id="game-container">
                    <div id="feedback" class="feedback-text"></div>
                    <div id="text-input-container">
                        <input id="text-answer-input" type="text" />
                        <button id="submit-answer-btn">Submit</button>
                    </div>
                </div>
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