// ABOUTME: Utility functions for the States & Provinces game
// ABOUTME: Contains string similarity calculations and helper functions

/**
 * Calculate the Levenshtein distance between two strings
 * Returns the minimum number of single-character edits required to transform one string into another
 */
export function levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    
    // Create a matrix of size (len1+1) x (len2+1)
    const matrix: number[][] = Array(len1 + 1)
        .fill(null)
        .map(() => Array(len2 + 1).fill(0));
    
    // Initialize first row and column
    for (let i = 0; i <= len1; i++) {
        matrix[i][0] = i;
    }
    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }
    
    // Fill the matrix
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,      // deletion
                matrix[i][j - 1] + 1,      // insertion
                matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }
    
    return matrix[len1][len2];
}

/**
 * Check if two strings are "close enough" based on Levenshtein distance
 * For geographic names, we consider it close if:
 * - Distance is 1-2 for short names (≤6 chars)
 * - Distance is 1-3 for medium names (7-12 chars)
 * - Distance is 1-4 for long names (>12 chars)
 */
export function isCloseMatch(userInput: string, correctAnswer: string): boolean {
    const distance = levenshteinDistance(userInput.toLowerCase(), correctAnswer.toLowerCase());
    const length = correctAnswer.length;
    
    if (length <= 6) {
        return distance >= 1 && distance <= 2;
    } else if (length <= 12) {
        return distance >= 1 && distance <= 3;
    } else {
        return distance >= 1 && distance <= 4;
    }
}

/**
 * Check if an answer with high Levenshtein distance should get a random second chance
 * Returns true 30% of the time for answers that are far off but not completely wrong
 */
export function shouldGetRandomSecondChance(userInput: string, correctAnswer: string): boolean {
    const distance = levenshteinDistance(userInput.toLowerCase(), correctAnswer.toLowerCase());
    const length = correctAnswer.length;
    
    // Only consider for random chance if distance is high (not close match)
    let isHighDistance = false;
    if (length <= 6) {
        isHighDistance = distance > 2; // More than 2 chars off for short names
    } else if (length <= 12) {
        isHighDistance = distance > 3; // More than 3 chars off for medium names
    } else {
        isHighDistance = distance > 4; // More than 4 chars off for long names
    }
    
    // Only give random chance if it's high distance but not completely unrelated
    // (e.g., don't give second chance if distance is more than 60% of the word length)
    const maxReasonableDistance = Math.floor(length * 0.6);
    const isReasonable = distance <= maxReasonableDistance;
    
    if (isHighDistance && isReasonable) {
        // 30% chance of getting a second try
        return Math.random() < 0.3;
    }
    
    return false;
}

/**
 * Normalize geographic names for comparison
 * Handles common variations and abbreviations
 */
export function normalizeGeographicName(name: string): string {
    return name
        .toLowerCase()
        .trim()
        // Remove common geographic suffixes for comparison
        .replace(/\s+(state|province|territory)$/i, '')
        // Handle common abbreviations with periods
        .replace(/\bst\./g, 'saint')
        .replace(/\bmt\./g, 'mount')
        // Handle common abbreviations without periods
        .replace(/\bst\b/g, 'saint')
        .replace(/\bmt\b/g, 'mount')
        .replace(/\bn\b/g, 'north')
        .replace(/\bs\b/g, 'south')
        .replace(/\be\b/g, 'east')
        .replace(/\bw\b/g, 'west');
}