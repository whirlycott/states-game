// ABOUTME: Tests for utility functions used in the States & Provinces game
// ABOUTME: Validates Levenshtein distance calculations and string similarity matching

import { describe, it, expect } from 'vitest';
import { levenshteinDistance, isCloseMatch, normalizeGeographicName } from './utils.js';

describe('levenshteinDistance', () => {
    it('should return 0 for identical strings', () => {
        expect(levenshteinDistance('hello', 'hello')).toBe(0);
        expect(levenshteinDistance('', '')).toBe(0);
    });

    it('should return the length of string when other is empty', () => {
        expect(levenshteinDistance('hello', '')).toBe(5);
        expect(levenshteinDistance('', 'world')).toBe(5);
    });

    it('should calculate distance for single character differences', () => {
        expect(levenshteinDistance('cat', 'bat')).toBe(1); // substitution
        expect(levenshteinDistance('cat', 'cats')).toBe(1); // insertion
        expect(levenshteinDistance('cats', 'cat')).toBe(1); // deletion
    });

    it('should calculate distance for multiple differences', () => {
        expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
        expect(levenshteinDistance('saturday', 'sunday')).toBe(3);
    });

    it('should be case sensitive', () => {
        expect(levenshteinDistance('Hello', 'hello')).toBe(1);
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