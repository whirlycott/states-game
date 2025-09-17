// ABOUTME: Input validation utilities for secure handling of user text input
// ABOUTME: Prevents XSS attacks and injection attempts in the educational game's text input fields

/**
 * Maximum allowed length for geographic name inputs
 * Longest US state/province name is around 20 characters
 */
const MAX_INPUT_LENGTH = 50;

/**
 * Pattern for allowed characters in geographic names
 * Allows letters, spaces, hyphens, apostrophes, and periods (for abbreviations)
 */
const ALLOWED_CHARS_PATTERN = /^[a-zA-Z\s\-'.]+$/;

/**
 * Dangerous patterns that indicate potential script injection attempts
 */
const DANGEROUS_PATTERNS = [
    /<script/i,
    /<\/script>/i,
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<link/i,
    /<meta/i,
    /<style/i,
    /expression\s*\(/i,
    /url\s*\(/i,
    /import\s*\(/i,
    /eval\s*\(/i,
    /setTimeout|setInterval/i
];

/**
 * HTML entities and their safe replacements
 */
const HTML_ENTITIES: { [key: string]: string } = {
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '&': '&amp;',
    '/': '&#x2F;'
};

/**
 * Validates and sanitizes user input for geographic names
 * @param input - Raw user input string
 * @returns Object containing validation result and sanitized input
 */
export function validateGeographicInput(input: string): {
    isValid: boolean;
    sanitizedInput: string;
    errorMessage?: string;
} {
    // Check for null or undefined input
    if (!input || typeof input !== 'string') {
        return {
            isValid: false,
            sanitizedInput: '',
            errorMessage: 'Input is required'
        };
    }

    // Trim whitespace
    const trimmedInput = input.trim();

    // Check length constraints
    if (trimmedInput.length === 0) {
        return {
            isValid: false,
            sanitizedInput: '',
            errorMessage: 'Input cannot be empty'
        };
    }

    if (trimmedInput.length > MAX_INPUT_LENGTH) {
        return {
            isValid: false,
            sanitizedInput: trimmedInput.substring(0, MAX_INPUT_LENGTH),
            errorMessage: `Input too long (maximum ${MAX_INPUT_LENGTH} characters)`
        };
    }

    // Check for dangerous patterns
    for (const pattern of DANGEROUS_PATTERNS) {
        if (pattern.test(trimmedInput)) {
            console.warn('Dangerous pattern detected in input:', trimmedInput);
            return {
                isValid: false,
                sanitizedInput: '',
                errorMessage: 'Invalid characters detected'
            };
        }
    }

    // Check for allowed character pattern
    if (!ALLOWED_CHARS_PATTERN.test(trimmedInput)) {
        const sanitizedInput = sanitizeString(trimmedInput);
        return {
            isValid: false,
            sanitizedInput,
            errorMessage: 'Only letters, spaces, hyphens, apostrophes, and periods are allowed'
        };
    }

    // Additional check for excessive special characters
    const specialCharCount = (trimmedInput.match(/[-'.]/g) || []).length;
    if (specialCharCount > trimmedInput.length / 3) {
        return {
            isValid: false,
            sanitizedInput: sanitizeString(trimmedInput),
            errorMessage: 'Too many special characters'
        };
    }

    return {
        isValid: true,
        sanitizedInput: sanitizeString(trimmedInput)
    };
}

/**
 * Sanitizes a string by escaping HTML entities and removing dangerous content
 * @param input - Input string to sanitize
 * @returns Sanitized string safe for DOM insertion
 */
export function sanitizeString(input: string): string {
    if (!input || typeof input !== 'string') return '';

    // Replace HTML entities
    let sanitized = input.replace(/[<>"'&/]/g, (match) => HTML_ENTITIES[match] || match);

    // Remove any remaining control characters
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

    // Limit consecutive spaces
    sanitized = sanitized.replace(/\s{2,}/g, ' ');

    return sanitized.trim();
}

/**
 * Validates input specifically for the hard mode text input
 * Includes additional checks for geographic name format
 * @param input - User input for geographic name
 * @returns Validation result with geographic-specific checks
 */
export function validateHardModeInput(input: string): {
    isValid: boolean;
    sanitizedInput: string;
    errorMessage?: string;
} {
    const baseValidation = validateGeographicInput(input);

    if (!baseValidation.isValid) {
        return baseValidation;
    }

    const sanitizedInput = baseValidation.sanitizedInput;

    // Additional checks for geographic names

    // Check for reasonable word count (most state/province names are 1-4 words)
    const wordCount = sanitizedInput.split(/\s+/).length;
    if (wordCount > 4) {
        return {
            isValid: false,
            sanitizedInput,
            errorMessage: 'Geographic names should not exceed 4 words'
        };
    }

    // Check for minimum meaningful length
    if (sanitizedInput.length < 2) {
        return {
            isValid: false,
            sanitizedInput,
            errorMessage: 'Input too short for a geographic name'
        };
    }

    // Check for valid starting character (should be a letter)
    if (!/^[a-zA-Z]/.test(sanitizedInput)) {
        return {
            isValid: false,
            sanitizedInput,
            errorMessage: 'Geographic names must start with a letter'
        };
    }

    return {
        isValid: true,
        sanitizedInput
    };
}

/**
 * Rate limiting utility to prevent input flooding
 */
export class InputRateLimiter {
    private attemptCounts: Map<string, { count: number; firstAttempt: number }> = new Map();
    private readonly maxAttempts: number;
    private readonly timeWindowMs: number;

    constructor(maxAttempts: number = 10, timeWindowMs: number = 60000) {
        this.maxAttempts = maxAttempts;
        this.timeWindowMs = timeWindowMs;
    }

    /**
     * Checks if the input attempt is within rate limits
     * @param identifier - Unique identifier for the input source (e.g., user session)
     * @returns true if attempt is allowed, false if rate limited
     */
    isAllowed(identifier: string = 'default'): boolean {
        const now = Date.now();
        const attemptData = this.attemptCounts.get(identifier);

        if (!attemptData) {
            // First attempt
            this.attemptCounts.set(identifier, { count: 1, firstAttempt: now });
            return true;
        }

        // Check if time window has expired
        if (now - attemptData.firstAttempt > this.timeWindowMs) {
            // Reset counter
            this.attemptCounts.set(identifier, { count: 1, firstAttempt: now });
            return true;
        }

        // Check if within limits
        if (attemptData.count < this.maxAttempts) {
            attemptData.count++;
            return true;
        }

        // Rate limited
        return false;
    }

    /**
     * Clears rate limit data for an identifier
     * @param identifier - Identifier to clear
     */
    clear(identifier: string): void {
        this.attemptCounts.delete(identifier);
    }
}