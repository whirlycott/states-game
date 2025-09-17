// ABOUTME: Tests for input validation utility functions
// ABOUTME: Ensures user input security measures work correctly for the educational game

import { describe, it, expect, beforeEach } from 'vitest';
import { validateGeographicInput, validateHardModeInput, sanitizeString, InputRateLimiter } from './inputValidator.js';

describe('Input Validator', () => {
    describe('validateGeographicInput', () => {
        it('should accept valid geographic names', () => {
            const testCases = [
                { input: 'California', expected: 'California' },
                { input: 'New York', expected: 'New York' },
                { input: 'North Dakota', expected: 'North Dakota' },
                { input: 'Prince Edward Island', expected: 'Prince Edward Island' },
                { input: "O'ahu", expected: "O&#x27;ahu" },  // Apostrophe gets escaped
                { input: 'Washington D.C.', expected: 'Washington D.C.' },
                { input: 'St. Louis', expected: 'St. Louis' }
            ];

            testCases.forEach(({ input, expected }) => {
                const result = validateGeographicInput(input);
                expect(result.isValid).toBe(true);
                expect(result.sanitizedInput).toBe(expected);
            });
        });

        it('should reject dangerous script patterns', () => {
            const maliciousInputs = [
                '<script>alert("xss")</script>',
                'javascript:alert(1)',
                'vbscript:msgbox(1)',
                'onclick=alert(1)',
                'data:text/html,<script>alert(1)</script>',
                'expression(alert(1))'
            ];

            maliciousInputs.forEach(input => {
                const result = validateGeographicInput(input);
                expect(result.isValid).toBe(false);
                expect(result.errorMessage).toBe('Invalid characters detected');
            });
        });

        it('should reject inputs with invalid characters', () => {
            const invalidInputs = [
                'California123',
                'New@York',
                'Texas$',
                'Florida#',
                'Nevada%',
                'Oregon&'
            ];

            invalidInputs.forEach(input => {
                const result = validateGeographicInput(input);
                expect(result.isValid).toBe(false);
                expect(result.errorMessage).toContain('Only letters, spaces, hyphens, apostrophes, and periods are allowed');
            });
        });

        it('should handle empty or null inputs', () => {
            expect(validateGeographicInput('').isValid).toBe(false);
            expect(validateGeographicInput('   ').isValid).toBe(false);
            expect(validateGeographicInput(null as any).isValid).toBe(false);
            expect(validateGeographicInput(undefined as any).isValid).toBe(false);
        });

        it('should trim whitespace from valid inputs', () => {
            const result = validateGeographicInput('  California  ');
            expect(result.isValid).toBe(true);
            expect(result.sanitizedInput).toBe('California');
        });

        it('should reject overly long inputs', () => {
            const longInput = 'A'.repeat(60);
            const result = validateGeographicInput(longInput);
            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain('Input too long');
        });

        it('should reject inputs with excessive special characters', () => {
            const result = validateGeographicInput("''--..''--");
            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toBe('Too many special characters');
        });
    });

    describe('validateHardModeInput', () => {
        it('should accept valid state names for hard mode', () => {
            const validInputs = [
                'Alaska',
                'Hawaii',
                'Rhode Island',
                'New Hampshire'
            ];

            validInputs.forEach(input => {
                const result = validateHardModeInput(input);
                expect(result.isValid).toBe(true);
                expect(result.sanitizedInput).toBe(input);
            });
        });

        it('should reject inputs that are too short', () => {
            const result = validateHardModeInput('A');
            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toBe('Input too short for a geographic name');
        });

        it('should reject inputs with too many words', () => {
            const result = validateHardModeInput('This Is Way Too Many Words For A State');
            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toBe('Geographic names should not exceed 4 words');
        });

        it('should reject inputs that do not start with a letter', () => {
            const result = validateHardModeInput('-California');
            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toBe('Geographic names must start with a letter');
        });

        it('should pass through base validation errors', () => {
            const result = validateHardModeInput('<script>alert(1)</script>');
            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toBe('Invalid characters detected');
        });
    });

    describe('sanitizeString', () => {
        it('should escape HTML entities', () => {
            const testCases = [
                { input: '<script>', expected: '&lt;script&gt;' },
                { input: 'AT&T', expected: 'AT&amp;T' },
                { input: '"quoted"', expected: '&quot;quoted&quot;' },
                { input: "'single'", expected: '&#x27;single&#x27;' },
                { input: 'a/b', expected: 'a&#x2F;b' }
            ];

            testCases.forEach(({ input, expected }) => {
                expect(sanitizeString(input)).toBe(expected);
            });
        });

        it('should remove control characters', () => {
            const inputWithControlChars = 'Hello\x00World\x1F';
            const result = sanitizeString(inputWithControlChars);
            expect(result).toBe('HelloWorld');
        });

        it('should normalize whitespace', () => {
            const inputWithExtraSpaces = 'New    York     State';
            const result = sanitizeString(inputWithExtraSpaces);
            expect(result).toBe('New York State');
        });

        it('should handle null and undefined inputs', () => {
            expect(sanitizeString(null as any)).toBe('');
            expect(sanitizeString(undefined as any)).toBe('');
        });
    });

    describe('InputRateLimiter', () => {
        let rateLimiter: InputRateLimiter;

        beforeEach(() => {
            rateLimiter = new InputRateLimiter(3, 1000); // 3 attempts per second for testing
        });

        it('should allow initial attempts', () => {
            expect(rateLimiter.isAllowed('user1')).toBe(true);
            expect(rateLimiter.isAllowed('user1')).toBe(true);
            expect(rateLimiter.isAllowed('user1')).toBe(true);
        });

        it('should rate limit after max attempts', () => {
            // Use up the allowed attempts
            rateLimiter.isAllowed('user1');
            rateLimiter.isAllowed('user1');
            rateLimiter.isAllowed('user1');

            // Next attempt should be blocked
            expect(rateLimiter.isAllowed('user1')).toBe(false);
        });

        it('should track different users separately', () => {
            // Use up attempts for user1
            rateLimiter.isAllowed('user1');
            rateLimiter.isAllowed('user1');
            rateLimiter.isAllowed('user1');
            expect(rateLimiter.isAllowed('user1')).toBe(false);

            // user2 should still be allowed
            expect(rateLimiter.isAllowed('user2')).toBe(true);
        });

        it('should reset after time window expires', async () => {
            // Use up attempts
            rateLimiter.isAllowed('user1');
            rateLimiter.isAllowed('user1');
            rateLimiter.isAllowed('user1');
            expect(rateLimiter.isAllowed('user1')).toBe(false);

            // Wait for time window to pass (simulate with shorter window for testing)
            await new Promise(resolve => setTimeout(resolve, 1100));

            // Should be allowed again
            expect(rateLimiter.isAllowed('user1')).toBe(true);
        });

        it('should clear rate limit data for specific user', () => {
            // Use up attempts
            rateLimiter.isAllowed('user1');
            rateLimiter.isAllowed('user1');
            rateLimiter.isAllowed('user1');
            expect(rateLimiter.isAllowed('user1')).toBe(false);

            // Clear and try again
            rateLimiter.clear('user1');
            expect(rateLimiter.isAllowed('user1')).toBe(true);
        });
    });
});