// ABOUTME: Tests for utility functions used in the States & Provinces game
// ABOUTME: Validates Levenshtein distance calculations and string similarity matching

import { describe, it, expect, afterEach } from 'vitest';
import { levenshteinDistance, isCloseMatch, normalizeGeographicName, shouldGetRandomSecondChance } from './utils.js';

describe('levenshteinDistance', () => {
    it('should return 0 for identical strings', () => {
        expect(levenshteinDistance('hello', 'hello')).toBe(0);
        expect(levenshteinDistance('', '')).toBe(0);
        expect(levenshteinDistance('a', 'a')).toBe(0);
        expect(levenshteinDistance('Texas', 'Texas')).toBe(0);
        expect(levenshteinDistance('Massachusetts', 'Massachusetts')).toBe(0);
    });

    it('should return the length of string when other is empty', () => {
        expect(levenshteinDistance('hello', '')).toBe(5);
        expect(levenshteinDistance('', 'world')).toBe(5);
        expect(levenshteinDistance('a', '')).toBe(1);
        expect(levenshteinDistance('', 'a')).toBe(1);
        expect(levenshteinDistance('Texas', '')).toBe(5);
        expect(levenshteinDistance('', 'California')).toBe(10);
    });

    it('should calculate distance for single character differences', () => {
        expect(levenshteinDistance('cat', 'bat')).toBe(1); // substitution
        expect(levenshteinDistance('cat', 'cats')).toBe(1); // insertion
        expect(levenshteinDistance('cats', 'cat')).toBe(1); // deletion
        expect(levenshteinDistance('a', 'b')).toBe(1); // single char substitution
        expect(levenshteinDistance('Texas', 'Texa')).toBe(1); // deletion
        expect(levenshteinDistance('Utah', 'Utha')).toBe(2); // insertion + substitution
    });

    it('should calculate distance for multiple differences', () => {
        expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
        expect(levenshteinDistance('saturday', 'sunday')).toBe(3);
        expect(levenshteinDistance('Florida', 'California')).toBe(6);
        expect(levenshteinDistance('Texas', 'Maine')).toBe(5);
    });

    it('should be case sensitive', () => {
        expect(levenshteinDistance('Hello', 'hello')).toBe(1);
        expect(levenshteinDistance('TEXAS', 'texas')).toBe(5);
        expect(levenshteinDistance('Florida', 'FLORIDA')).toBe(6);
    });

    it('should handle real geographic name examples', () => {
        // Real-world state name examples
        expect(levenshteinDistance('massachusetts', 'massachusets')).toBe(1); // missing 't'
        expect(levenshteinDistance('pennsylvania', 'pensylvania')).toBe(1); // missing 'n'
        expect(levenshteinDistance('north carolina', 'north carolins')).toBe(1); // 'a' -> 's'
        expect(levenshteinDistance('new hampshire', 'newhampshire')).toBe(1); // missing space
        expect(levenshteinDistance('rhode island', 'rhodeisland')).toBe(1); // missing space
    });

    it('should handle complex transformations', () => {
        // Test more complex transformation sequences
        expect(levenshteinDistance('abc', 'xyz')).toBe(3); // all substitutions
        expect(levenshteinDistance('abcd', 'efgh')).toBe(4); // all substitutions
        expect(levenshteinDistance('abcdef', 'ace')).toBe(3); // deletions
        expect(levenshteinDistance('ace', 'abcdef')).toBe(3); // insertions
    });

    it('should handle strings with repeating characters', () => {
        expect(levenshteinDistance('aaa', 'aaaa')).toBe(1);
        expect(levenshteinDistance('aaaa', 'aaa')).toBe(1);
        expect(levenshteinDistance('aaa', 'bbb')).toBe(3);
        expect(levenshteinDistance('ababab', 'bababa')).toBe(2);
    });

    it('should handle very long strings efficiently', () => {
        const long1 = 'a'.repeat(100);
        const long2 = 'b'.repeat(100);
        expect(levenshteinDistance(long1, long2)).toBe(100);
        
        const long3 = 'a'.repeat(100);
        const long4 = 'a'.repeat(99) + 'b';
        expect(levenshteinDistance(long3, long4)).toBe(1);
    });

    it('should be symmetric (distance(a,b) === distance(b,a))', () => {
        const testPairs = [
            ['hello', 'world'],
            ['Texas', 'California'],
            ['cat', 'dog'],
            ['', 'test'],
            ['Massachusetts', 'Connecticut']
        ];

        testPairs.forEach(([str1, str2]) => {
            expect(levenshteinDistance(str1, str2)).toBe(levenshteinDistance(str2, str1));
        });
    });

    it('should satisfy triangle inequality property', () => {
        // For any three strings a, b, c: distance(a,c) ≤ distance(a,b) + distance(b,c)
        const testTriples = [
            ['cat', 'bat', 'hat'],
            ['Texas', 'Texa', 'Te'],
            ['hello', 'world', 'sword']
        ];

        testTriples.forEach(([a, b, c]) => {
            const distAC = levenshteinDistance(a, c);
            const distAB = levenshteinDistance(a, b);
            const distBC = levenshteinDistance(b, c);
            expect(distAC).toBeLessThanOrEqual(distAB + distBC);
        });
    });

    it('should handle unicode characters correctly', () => {
        expect(levenshteinDistance('café', 'cafe')).toBe(1); // é vs e
        expect(levenshteinDistance('naïve', 'naive')).toBe(1); // ï vs i
        expect(levenshteinDistance('🏠', '🏡')).toBe(1); // different house emojis
    });
});

describe('isCloseMatch', () => {
    it('should return true for close matches on short names', () => {
        expect(isCloseMatch('Texas', 'Texa')).toBe(true);     // distance 1
        expect(isCloseMatch('Utah', 'Utsh')).toBe(true);      // distance 2
        expect(isCloseMatch('Maine', 'Miane')).toBe(true);    // distance 2
    });

    it('should return true for close matches on medium names', () => {
        expect(isCloseMatch('Florida', 'Floreda')).toBe(true);      // distance 1
        expect(isCloseMatch('Georgia', 'Georgai')).toBe(true);      // distance 1
        expect(isCloseMatch('Alabama', 'Alabbama')).toBe(true);     // distance 1
        expect(isCloseMatch('Colorado', 'Coloredo')).toBe(true);    // distance 1
    });

    it('should return true for close matches on long names', () => {
        expect(isCloseMatch('Pennsylvania', 'Pensylvania')).toBe(true);     // distance 2
        expect(isCloseMatch('Massachusetts', 'Massachusets')).toBe(true);   // distance 2
        expect(isCloseMatch('North Carolina', 'North Carolins')).toBe(true); // distance 2
    });

    it('should return false for exact matches', () => {
        expect(isCloseMatch('Texas', 'Texas')).toBe(false);
        expect(isCloseMatch('Florida', 'Florida')).toBe(false);
    });

    it('should return false for matches that are too far off', () => {
        expect(isCloseMatch('Texas', 'Florida')).toBe(false);    // distance too large
        expect(isCloseMatch('Utah', 'Maine')).toBe(false);       // distance too large
        expect(isCloseMatch('California', 'New York')).toBe(false); // completely different
    });

    it('should handle case insensitive comparison', () => {
        expect(isCloseMatch('TEXAS', 'texa')).toBe(true);
        expect(isCloseMatch('Florida', 'FLOREDA')).toBe(true);
    });
});

describe('normalizeGeographicName', () => {
    it('should convert to lowercase and trim', () => {
        expect(normalizeGeographicName('  TEXAS  ')).toBe('texas');
        expect(normalizeGeographicName('Florida')).toBe('florida');
    });

    it('should remove common geographic suffixes', () => {
        expect(normalizeGeographicName('Texas State')).toBe('texas');
        expect(normalizeGeographicName('Ontario Province')).toBe('ontario');
        expect(normalizeGeographicName('Yukon Territory')).toBe('yukon');
    });

    it('should expand common abbreviations', () => {
        expect(normalizeGeographicName('St. Louis')).toBe('saint louis');
        expect(normalizeGeographicName('Mt. Rushmore')).toBe('mount rushmore');
        expect(normalizeGeographicName('N Dakota')).toBe('north dakota');
        expect(normalizeGeographicName('S Carolina')).toBe('south carolina');
        expect(normalizeGeographicName('E Tennessee')).toBe('east tennessee');
        expect(normalizeGeographicName('W Virginia')).toBe('west virginia');
    });

    it('should handle complex names with multiple normalizations', () => {
        expect(normalizeGeographicName('  St. Mary Province  ')).toBe('saint mary');
        expect(normalizeGeographicName('N Mt. Territory')).toBe('north mount');
    });
});

describe('shouldGetRandomSecondChance', () => {
    // Mock Math.random to control the 30% chance
    const originalRandom = Math.random;
    
    afterEach(() => {
        Math.random = originalRandom;
    });

    it('should return false for close matches (handled by isCloseMatch)', () => {
        Math.random = () => 0.2; // Force 30% chance to trigger
        
        // These should be handled by isCloseMatch, not random chance
        expect(shouldGetRandomSecondChance('Texa', 'Texas')).toBe(false);  // distance 1
        expect(shouldGetRandomSecondChance('Floreda', 'Florida')).toBe(false);  // distance 1
    });

    it('should return true 30% of the time for high distance but reasonable answers', () => {
        Math.random = () => 0.2; // Force 30% chance to trigger (0.2 < 0.3)
        
        // High distance but still reasonable attempts  
        expect(shouldGetRandomSecondChance('Tex', 'Texas')).toBe(false);   // distance 2 (not high)
        expect(shouldGetRandomSecondChance('Aebys', 'Texas')).toBe(true);   // distance 3, length 5 (>2), max=3
        expect(shouldGetRandomSecondChance('Flxxxa', 'Florida')).toBe(true); // distance 4, length 7 (>3), max=4
    });

    it('should return false 70% of the time for high distance answers', () => {
        Math.random = () => 0.8; // Force 70% chance NOT to trigger (0.8 > 0.3)
        
        expect(shouldGetRandomSecondChance('Aebys', 'Texas')).toBe(false);
        expect(shouldGetRandomSecondChance('Flxxxa', 'Florida')).toBe(false);
    });

    it('should return false for completely unrelated answers', () => {
        Math.random = () => 0.1; // Force chance to trigger, but should still reject
        
        // Completely unrelated - distance > 60% of word length
        expect(shouldGetRandomSecondChance('Maine', 'California')).toBe(false); // distance 7, length 10, max=6
        expect(shouldGetRandomSecondChance('Alaska', 'Florida')).toBe(false);   // distance 7, length 7, max=4
        expect(shouldGetRandomSecondChance('xyz', 'Texas')).toBe(false);        // distance 5, length 5, max=3
    });

    it('should return false for exact matches', () => {
        Math.random = () => 0.1; // Force chance to trigger
        
        expect(shouldGetRandomSecondChance('Texas', 'Texas')).toBe(false);
        expect(shouldGetRandomSecondChance('Florida', 'Florida')).toBe(false);
    });

    it('should handle different name lengths correctly', () => {
        Math.random = () => 0.2; // Force 30% chance to trigger
        
        // Short names (≤6 chars): high distance is >2
        expect(shouldGetRandomSecondChance('Aebys', 'Texas')).toBe(true);    // distance 3 > 2
        expect(shouldGetRandomSecondChance('Tex', 'Texas')).toBe(false);     // distance 2 ≤ 2
        
        // Medium names (7-12 chars): high distance is >3  
        expect(shouldGetRandomSecondChance('Flxxxa', 'Florida')).toBe(true);  // distance 4 > 3
        expect(shouldGetRandomSecondChance('Flor', 'Florida')).toBe(false);   // distance 3 ≤ 3
        
        // Long names (>12 chars): high distance is >4
        expect(shouldGetRandomSecondChance('Massxxxxts', 'Massachusetts')).toBe(true); // distance 7 = max of 7
    });

    it('should validate 30% probability distribution over multiple calls', () => {
        // Test multiple random values at the 30% boundary
        const testCases = [
            { random: 0.0, expected: true },   // 0% - should trigger
            { random: 0.1, expected: true },   // 10% - should trigger
            { random: 0.29, expected: true },  // 29% - should trigger
            { random: 0.3, expected: false },  // 30% - should not trigger
            { random: 0.5, expected: false },  // 50% - should not trigger
            { random: 0.99, expected: false }, // 99% - should not trigger
        ];

        testCases.forEach(({ random, expected }) => {
            Math.random = () => random;
            expect(shouldGetRandomSecondChance('Aebys', 'Texas')).toBe(expected);
        });
    });

    it('should handle boundary case at exactly 60% of word length', () => {
        Math.random = () => 0.1; // Force chance to trigger
        
        // Test at exactly 60% boundary
        expect(shouldGetRandomSecondChance('Tex', 'Texas')).toBe(false);    // distance 2, max 3 (60% of 5)
        expect(shouldGetRandomSecondChance('Flor', 'Florida')).toBe(false); // distance 3, max 4 (60% of 7) 
        expect(shouldGetRandomSecondChance('Mass', 'Massachusetts')).toBe(false); // distance 9, max 7 (60% of 13)
    });

    it('should handle empty strings', () => {
        Math.random = () => 0.1; // Force chance to trigger
        
        expect(shouldGetRandomSecondChance('', 'Texas')).toBe(false);  // distance 5, max 3
        expect(shouldGetRandomSecondChance('Texas', '')).toBe(false);  // distance 5, max 0
        expect(shouldGetRandomSecondChance('', '')).toBe(false);       // distance 0
    });

    it('should handle single character strings', () => {
        Math.random = () => 0.1; // Force chance to trigger
        
        expect(shouldGetRandomSecondChance('A', 'B')).toBe(false);     // distance 1, max 0
        expect(shouldGetRandomSecondChance('X', 'Texas')).toBe(false); // distance 4, max 3
    });
});