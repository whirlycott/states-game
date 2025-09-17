// ABOUTME: SVG sanitization utility for secure map loading
// ABOUTME: Prevents XSS attacks through malicious SVG content by filtering dangerous elements and attributes

/**
 * List of allowed SVG elements for the educational game map
 * Only includes elements necessary for displaying geographic shapes
 */
const ALLOWED_ELEMENTS = new Set([
    'svg', 'g', 'path', 'polygon', 'circle', 'rect', 'ellipse', 'line', 'polyline',
    'text', 'tspan', 'defs', 'pattern', 'title', 'desc', 'metadata'
]);

/**
 * List of allowed attributes for SVG elements
 * Excludes event handlers and potentially dangerous attributes
 */
const ALLOWED_ATTRIBUTES = new Set([
    'id', 'class', 'd', 'points', 'x', 'y', 'width', 'height', 'r', 'rx', 'ry',
    'cx', 'cy', 'x1', 'y1', 'x2', 'y2', 'fill', 'stroke', 'stroke-width',
    'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'opacity',
    'transform', 'viewbox', 'preserveaspectratio', 'xmlns', 'xmlns:xlink',
    'version', 'patternunits', 'patterntransform'
]);

/**
 * Dangerous attributes that should always be removed
 * Includes event handlers and script-related attributes
 */
const DANGEROUS_ATTRIBUTES = new Set([
    'onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout', 'onmousemove',
    'onfocus', 'onblur', 'onchange', 'onsubmit', 'onreset', 'onselect',
    'onkeydown', 'onkeyup', 'onkeypress', 'href', 'xlink:href'
]);

/**
 * Sanitizes SVG content to prevent XSS attacks
 * Removes dangerous elements, attributes, and content while preserving map functionality
 * @param svgContent - Raw SVG content string
 * @returns Sanitized SVG content safe for innerHTML insertion
 */
export function sanitizeSVG(svgContent: string): string {
    try {
        // Create a DOM parser to parse the SVG
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgContent, 'image/svg+xml');

        // Check for parser errors
        const parserError = doc.querySelector('parsererror');
        if (parserError) {
            console.error('SVG parsing error:', parserError.textContent);
            throw new Error('Invalid SVG content');
        }

        // Get the SVG root element
        const svgElement = doc.documentElement;

        if (svgElement.tagName.toLowerCase() !== 'svg') {
            throw new Error('Content is not a valid SVG');
        }

        // Recursively sanitize all elements
        sanitizeElement(svgElement);

        // Serialize back to string
        const serializer = new XMLSerializer();
        return serializer.serializeToString(svgElement);

    } catch (error) {
        console.error('SVG sanitization failed:', error);
        throw new Error('Failed to sanitize SVG content');
    }
}

/**
 * Recursively sanitizes an SVG element and its children
 * @param element - Element to sanitize
 */
function sanitizeElement(element: Element): void {
    // Remove disallowed elements
    if (!ALLOWED_ELEMENTS.has(element.tagName.toLowerCase())) {
        element.remove();
        return;
    }

    // Remove dangerous attributes
    const attributesToRemove: string[] = [];

    for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        const attrName = attr.name.toLowerCase();

        // Remove if dangerous or not in allowed list
        if (DANGEROUS_ATTRIBUTES.has(attrName) || !ALLOWED_ATTRIBUTES.has(attrName)) {
            attributesToRemove.push(attr.name);
        }

        // Additional check for javascript: URLs in any attribute
        if (attr.value && attr.value.toLowerCase().includes('javascript:')) {
            attributesToRemove.push(attr.name);
        }
    }

    // Remove identified attributes
    attributesToRemove.forEach(attrName => {
        element.removeAttribute(attrName);
    });

    // Sanitize text content to prevent script injection
    if (element.tagName.toLowerCase() === 'text' || element.tagName.toLowerCase() === 'tspan') {
        // For text elements, escape any potential script content
        const textContent = element.textContent || '';
        if (textContent.includes('<') || textContent.includes('>')) {
            element.textContent = textContent.replace(/[<>]/g, '');
        }
    }

    // Recursively sanitize child elements
    const children = Array.from(element.children);
    children.forEach(child => {
        sanitizeElement(child);
    });
}

/**
 * Validates that the sanitized SVG contains expected geographic elements
 * @param svgContent - Sanitized SVG content
 * @returns true if SVG appears to be a valid geographic map
 */
export function validateGeographicSVG(svgContent: string): boolean {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgContent, 'image/svg+xml');

        // Check for elements with geographic identifiers (US- or CA- prefixed IDs)
        const geoElements = doc.querySelectorAll('[id^="US-"], [id^="CA-"]');

        // Should have at least some geographic elements
        if (geoElements.length < 10) {
            console.warn('SVG appears to have insufficient geographic elements');
            return false;
        }

        // Check for path elements (most states/provinces are paths)
        const pathElements = doc.querySelectorAll('path');
        if (pathElements.length < 10) {
            console.warn('SVG appears to have insufficient path elements');
            return false;
        }

        return true;
    } catch (error) {
        console.error('SVG validation failed:', error);
        return false;
    }
}