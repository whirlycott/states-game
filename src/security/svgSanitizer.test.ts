// ABOUTME: Tests for SVG sanitization utility functions
// ABOUTME: Ensures SVG security measures work correctly without breaking legitimate content

import { describe, it, expect } from 'vitest';
import { sanitizeSVG, validateGeographicSVG } from './svgSanitizer.js';

describe('SVG Sanitizer', () => {
    describe('sanitizeSVG', () => {
        it('should allow valid SVG elements', () => {
            const validSvg = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                    <path id="US-CA" d="M10,10 L90,90" fill="blue"/>
                    <g id="US-AK">
                        <path d="M20,20 L80,80" fill="red"/>
                    </g>
                </svg>
            `;

            const result = sanitizeSVG(validSvg);
            expect(result).toContain('<svg');
            expect(result).toContain('<path');
            expect(result).toContain('<g');
            expect(result).toContain('id="US-CA"');
            expect(result).toContain('id="US-AK"');
        });

        it('should remove dangerous script elements', () => {
            const maliciousSvg = `
                <svg xmlns="http://www.w3.org/2000/svg">
                    <script>alert('XSS')</script>
                    <path id="US-CA" d="M10,10 L90,90" fill="blue"/>
                </svg>
            `;

            const result = sanitizeSVG(maliciousSvg);
            expect(result).not.toContain('<script>');
            expect(result).not.toContain('alert');
            expect(result).toContain('<path');
        });

        it('should remove dangerous event handlers', () => {
            const maliciousSvg = `
                <svg xmlns="http://www.w3.org/2000/svg">
                    <path id="US-CA" d="M10,10 L90,90" onclick="alert('XSS')" onload="malicious()"/>
                </svg>
            `;

            const result = sanitizeSVG(maliciousSvg);
            expect(result).not.toContain('onclick');
            expect(result).not.toContain('onload');
            expect(result).not.toContain('alert');
            expect(result).toContain('<path');
            expect(result).toContain('id="US-CA"');
        });

        it('should remove javascript: URLs', () => {
            const maliciousSvg = `
                <svg xmlns="http://www.w3.org/2000/svg">
                    <path id="US-CA" d="M10,10 L90,90" href="javascript:alert('XSS')"/>
                </svg>
            `;

            const result = sanitizeSVG(maliciousSvg);
            expect(result).not.toContain('javascript:');
            expect(result).not.toContain('href');
            expect(result).toContain('<path');
        });

        it('should remove foreign object elements', () => {
            const maliciousSvg = `
                <svg xmlns="http://www.w3.org/2000/svg">
                    <foreignObject>
                        <iframe src="malicious.html"></iframe>
                    </foreignObject>
                    <path id="US-CA" d="M10,10 L90,90"/>
                </svg>
            `;

            const result = sanitizeSVG(maliciousSvg);
            expect(result).not.toContain('<foreignObject>');
            expect(result).not.toContain('<iframe>');
            expect(result).toContain('<path');
        });

        it('should preserve essential SVG attributes', () => {
            const validSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path id="US-CA" d="M10,10 L90,90" fill="blue" stroke="red" stroke-width="2"/></svg>`;

            const result = sanitizeSVG(validSvg);
            // viewBox might be normalized to lowercase by the parser
            expect(result.toLowerCase()).toContain('viewbox="0 0 100 100"');
            expect(result).toContain('fill="blue"');
            expect(result).toContain('stroke="red"');
            expect(result).toContain('stroke-width="2"');
        });

        it('should handle invalid SVG gracefully', () => {
            const invalidSvg = 'not an svg';
            expect(() => sanitizeSVG(invalidSvg)).toThrow('Failed to sanitize SVG content');
        });

        it('should handle malformed XML gracefully', () => {
            const malformedSvg = '<svg><path></svg>';
            expect(() => sanitizeSVG(malformedSvg)).toThrow();
        });
    });

    describe('validateGeographicSVG', () => {
        it('should validate SVG with sufficient geographic elements', () => {
            const validSvg = `
                <svg xmlns="http://www.w3.org/2000/svg">
                    ${Array.from({ length: 15 }, (_, i) =>
                        `<path id="US-${i.toString().padStart(2, '0')}" d="M${i*5},${i*5} L${(i+1)*5},${(i+1)*5}"/>`
                    ).join('')}
                </svg>
            `;

            expect(validateGeographicSVG(validSvg)).toBe(true);
        });

        it('should reject SVG with insufficient geographic elements', () => {
            const invalidSvg = `
                <svg xmlns="http://www.w3.org/2000/svg">
                    <path id="US-01" d="M10,10 L20,20"/>
                    <path id="random" d="M30,30 L40,40"/>
                </svg>
            `;

            expect(validateGeographicSVG(invalidSvg)).toBe(false);
        });

        it('should validate with both US and Canadian elements', () => {
            const validSvg = `
                <svg xmlns="http://www.w3.org/2000/svg">
                    ${Array.from({ length: 10 }, (_, i) =>
                        `<path id="US-${i.toString().padStart(2, '0')}" d="M${i*5},${i*5} L${(i+1)*5},${(i+1)*5}"/>`
                    ).join('')}
                    ${Array.from({ length: 10 }, (_, i) =>
                        `<path id="CA-${i.toString().padStart(2, '0')}" d="M${i*5+50},${i*5+50} L${(i+1)*5+50},${(i+1)*5+50}"/>`
                    ).join('')}
                </svg>
            `;

            expect(validateGeographicSVG(validSvg)).toBe(true);
        });

        it('should handle validation errors gracefully', () => {
            const invalidSvg = 'not valid xml';
            expect(validateGeographicSVG(invalidSvg)).toBe(false);
        });
    });
});