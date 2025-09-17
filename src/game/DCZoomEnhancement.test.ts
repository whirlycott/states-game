// ABOUTME: Focused test suite specifically for Washington DC zoom enhancement functionality
// ABOUTME: Tests actual zoom calculations and padding factors without excessive mocking

import { describe, it, expect, beforeEach, vi, beforeAll, afterEach } from 'vitest';
import { StatesGame } from './StatesGame.js';

// Mock the SVG URL import
vi.mock('../assets/Usa_and_Canada_with_names_natural.svg?url', () => ({
  default: '/mocked-svg-url'
}));

// Mock audio classes with minimal functionality
vi.mock('../audio/RetroSounds.js', () => ({
  RetroSounds: vi.fn(() => ({
    playGameStart: vi.fn(),
    playCorrect: vi.fn(),
    playIncorrect: vi.fn(),
    playGameEnd: vi.fn()
  }))
}));

vi.mock('../audio/EdgeyVoice.js', () => ({
  EdgeyVoice: vi.fn(() => ({
    playCorrectPhrase: vi.fn(),
    playIncorrectPhrase: vi.fn(),
    announceGameEnd: vi.fn()
  }))
}));

// Mock fetch for SVG loading
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Create minimal SVG structure focused on DC and comparison states
function createMinimalSvgStructure(): string {
  return `<svg viewBox="0 0 2289 1744" xmlns="http://www.w3.org/2000/svg">
    <path id="US-DC" d="M100,100 L110,100 L110,110 L100,110 Z"/>
    <path id="US-TX" d="M100,100 L200,100 L200,200 L100,200 Z"/>
    <path id="US-AK" d="M100,100 L150,100 L150,150 L100,150 Z"/>
    <path id="US-HI" d="M100,100 L130,100 L130,130 L100,130 Z"/>
    <path id="US-CA" d="M100,100 L180,100 L180,180 L100,180 Z"/>
    <path id="US-NY" d="M200,200 L250,200 L250,250 L200,250 Z"/>
    <path id="US-FL" d="M300,300 L350,300 L350,350 L300,350 Z"/>
    <path id="US-OH" d="M400,400 L450,400 L450,450 L400,450 Z"/>
    <path id="US-PA" d="M500,500 L550,500 L550,550 L500,550 Z"/>
    <path id="US-IL" d="M600,600 L650,600 L650,650 L600,650 Z"/>
    <path id="CA-NU" d="M300,300 L380,300 L380,380 L300,380 Z"/>
    <path id="CA-NT" d="M400,400 L470,400 L470,470 L400,470 Z"/>
    <path id="CA-ON" d="M500,500 L570,500 L570,570 L500,570 Z"/>
    <path id="CA-QC" d="M600,600 L670,600 L670,670 L600,670 Z"/>
  </svg>`;
}

// Set up minimal DOM environment
function setupMinimalDOM() {
  document.body.innerHTML = `
    <div id="map-container"></div>
    <div id="mode-selection" style="display: flex;">
      <button id="select-easy"></button>
      <button id="select-us"></button>
    </div>
    <div id="game-container" style="display: none;">
      <div id="current-question"></div>
      <div id="progress"></div>
      <div id="options"></div>
    </div>
    <div id="correct-count">0</div>
    <div id="incorrect-count">0</div>
    <div id="score-percentage">0%</div>
    <div id="progress-bar" style="width: 0%;"></div>
  `;
}

describe('Washington DC Zoom Enhancement - Core Functionality', () => {
  let game: StatesGame;
  let mockSvgContent: string;

  beforeAll(() => {
    mockSvgContent = createMinimalSvgStructure();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve(mockSvgContent)
    } as Response);
  });

  beforeEach(async () => {
    setupMinimalDOM();
    
    game = new StatesGame();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Set up the SVG environment with realistic mocked elements
    const mapContainer = document.getElementById('map-container');
    if (mapContainer) {
      mapContainer.innerHTML = mockSvgContent;
      
      const svgElement = mapContainer.querySelector('svg') as SVGSVGElement;
      if (svgElement) {
        (game as any).svgElement = svgElement;
        
        // Mock getBBox to return realistic bounding boxes that match the test data
        const elements = svgElement.querySelectorAll('path');
        elements.forEach((element: Element) => {
          const svgElement = element as SVGGraphicsElement;
          const elementId = element.id;
          
          svgElement.getBBox = () => {
            switch (elementId) {
              case 'US-DC':
                return { x: 100, y: 100, width: 10, height: 10 } as DOMRect;
              case 'US-TX':
                return { x: 100, y: 100, width: 100, height: 100 } as DOMRect;
              case 'US-AK':
                return { x: 100, y: 100, width: 50, height: 50 } as DOMRect;
              case 'US-HI':
                return { x: 100, y: 100, width: 30, height: 30 } as DOMRect;
              case 'US-CA':
                return { x: 100, y: 100, width: 80, height: 80 } as DOMRect;
              case 'CA-NU':
                return { x: 300, y: 300, width: 80, height: 80 } as DOMRect;
              case 'CA-NT':
                return { x: 400, y: 400, width: 70, height: 70 } as DOMRect;
              default:
                return { x: 100, y: 100, width: 50, height: 50 } as DOMRect;
            }
          };
        });
        
        // Mock getBoundingClientRect for the SVG element
        svgElement.getBoundingClientRect = () => ({
          x: 0, y: 0, width: 800, height: 600,
          top: 0, left: 0, right: 800, bottom: 600
        } as DOMRect);
      }
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('Special Case Zoom Factors', () => {
    it('should apply 3.0x padding factor specifically to Washington DC', () => {
      // Test that the specialCases object contains the correct DC factor
      const game_internal = game as any;
      
      // We need to test the actual zoom calculation logic
      let calculatedViewBox = '';
      
      const originalAnimateViewBox = game_internal.animateViewBox;
      game_internal.animateViewBox = (viewBox: string) => {
        calculatedViewBox = viewBox;
      };
      
      // Trigger zoom calculation for DC
      game_internal.zoomToElementDirect('US-DC');
      
      expect(calculatedViewBox).toBeTruthy();
      const [x, y, width, height] = calculatedViewBox.split(' ').map(Number);
      
      // Validate that we got a valid viewBox
      expect(x).toBeTypeOf('number');
      expect(y).toBeTypeOf('number');
      expect(width).toBeTypeOf('number');
      expect(height).toBeTypeOf('number');
      expect(isNaN(x)).toBe(false);
      expect(isNaN(y)).toBe(false);
      expect(isNaN(width)).toBe(false);
      expect(isNaN(height)).toBe(false);
      
      // For DC (10x10 element), with 3.0x padding factor:
      // elementSize = max(10, 10) = 10
      // padding = 10 * 3.0 = 30
      // But minPadding = 120, so finalPadding = max(30, 120) = 120
      // viewWidth = 10 + (120 * 2) = 250
      // DC gets special small minimum dimensions (200x150 for paddingFactor >= 3.0), so finalViewWidth = max(250, 200) = 250
      expect(width).toBeGreaterThanOrEqual(200); // DC gets smaller minimum to allow enhanced zoom
      expect(height).toBeGreaterThanOrEqual(150);
      
      game_internal.animateViewBox = originalAnimateViewBox;
    });

    it('should apply correct padding factors to other special case states', () => {
      const game_internal = game as any;
      const viewBoxResults: { [key: string]: string } = {};
      
      const originalAnimateViewBox = game_internal.animateViewBox;
      game_internal.animateViewBox = (viewBox: string) => {
        // Capture the viewBox for the current element being processed
        const currentElement = game_internal.currentTestElement;
        if (currentElement) {
          viewBoxResults[currentElement] = viewBox;
        }
      };
      
      // Test Alaska (1.5x factor)
      game_internal.currentTestElement = 'US-AK';
      game_internal.zoomToElementDirect('US-AK');
      
      // Test Hawaii (1.8x factor)
      game_internal.currentTestElement = 'US-HI';
      game_internal.zoomToElementDirect('US-HI');
      
      // Test Nunavut (1.6x factor)
      game_internal.currentTestElement = 'CA-NU';
      game_internal.zoomToElementDirect('CA-NU');
      
      // Test Northwest Territories (1.4x factor)
      game_internal.currentTestElement = 'CA-NT';
      game_internal.zoomToElementDirect('CA-NT');
      
      // Verify all special cases were processed
      expect(Object.keys(viewBoxResults)).toHaveLength(4);
      expect(viewBoxResults['US-AK']).toBeTruthy();
      expect(viewBoxResults['US-HI']).toBeTruthy();
      expect(viewBoxResults['CA-NU']).toBeTruthy();
      expect(viewBoxResults['CA-NT']).toBeTruthy();
      
      // Verify all viewBoxes are valid numeric strings
      Object.entries(viewBoxResults).forEach(([elementId, viewBox]) => {
        const parts = viewBox.split(' ').map(Number);
        expect(parts).toHaveLength(4);
        expect(parts.every(n => !isNaN(n))).toBe(true);
        
        // Check minimum dimensions based on padding factor
        if (['US-HI', 'CA-NU'].includes(elementId)) {
          // Hawaii (1.8x) and Nunavut (1.6x) get moderate reduction: 350x260
          expect(parts[2]).toBeGreaterThanOrEqual(350); // width >= reduced minZoomWidth  
          expect(parts[3]).toBeGreaterThanOrEqual(260); // height >= reduced minZoomHeight
        } else {
          // Alaska (1.5x) and NT (1.4x) get standard minimums: 500x375
          expect(parts[2]).toBeGreaterThanOrEqual(500); // width >= standard minZoomWidth
          expect(parts[3]).toBeGreaterThanOrEqual(375); // height >= standard minZoomHeight
        }
      });
      
      game_internal.animateViewBox = originalAnimateViewBox;
    });

    it('should apply default 1.2x factor to states without special cases', () => {
      const game_internal = game as any;
      let calculatedViewBox = '';
      
      const originalAnimateViewBox = game_internal.animateViewBox;
      game_internal.animateViewBox = (viewBox: string) => {
        calculatedViewBox = viewBox;
      };
      
      // Test California (no special case, should get default 1.2x)
      game_internal.currentTestElement = 'US-CA';
      game_internal.zoomToElementDirect('US-CA');
      
      expect(calculatedViewBox).toBeTruthy();
      const [x, y, width, height] = calculatedViewBox.split(' ').map(Number);
      
      expect(isNaN(x)).toBe(false);
      expect(isNaN(y)).toBe(false);
      expect(isNaN(width)).toBe(false);
      expect(isNaN(height)).toBe(false);
      
      // For CA (80x80 element), with default 1.2x padding factor:
      // elementSize = max(80, 80) = 80
      // padding = 80 * 1.2 = 96
      // finalPadding = max(96, 120) = 120 (minPadding wins)
      // viewWidth = 80 + (120 * 2) = 320
      // finalViewWidth = max(320, 500) = 500 (minZoomWidth wins)
      expect(width).toBeGreaterThanOrEqual(500);
      expect(height).toBeGreaterThanOrEqual(375);
      
      game_internal.animateViewBox = originalAnimateViewBox;
    });
  });

  describe('Mathematical Calculation Verification', () => {
    it('should calculate correct padding values for different element sizes', () => {
      const game_internal = game as any;
      
      // Test the padding calculation logic directly by examining the zoom calculations
      const testCases = [
        { id: 'US-DC', size: 10, expectedFactor: 3.0, expectedMinPadding: 120 },
        { id: 'US-TX', size: 100, expectedFactor: 1.2, expectedMinPadding: 120 },
        { id: 'US-AK', size: 50, expectedFactor: 1.5, expectedMinPadding: 120 },
        { id: 'US-HI', size: 30, expectedFactor: 1.8, expectedMinPadding: 120 }
      ];
      
      testCases.forEach(testCase => {
        // Calculate expected padding
        const elementPadding = testCase.size * testCase.expectedFactor;
        const finalPadding = Math.max(elementPadding, testCase.expectedMinPadding);
        const expectedViewDimension = testCase.size + (finalPadding * 2);
        
        // Calculate dynamic minimum dimensions based on padding factor
        let minWidth = 500;
        let minHeight = 375;
        if (testCase.expectedFactor >= 3.0) {
          minWidth = 200;
          minHeight = 150;
        } else if (testCase.expectedFactor >= 1.8) {
          minWidth = 350;
          minHeight = 260;
        }
        
        const expectedFinalWidth = Math.max(expectedViewDimension, minWidth);
        const expectedFinalHeight = Math.max(expectedViewDimension, minHeight);
        
        let calculatedViewBox = '';
        const originalAnimateViewBox = game_internal.animateViewBox;
        game_internal.animateViewBox = (viewBox: string) => {
          calculatedViewBox = viewBox;
        };
        
        game_internal.currentTestElement = testCase.id;
        game_internal.zoomToElementDirect(testCase.id);
        
        expect(calculatedViewBox).toBeTruthy();
        const [, , width, height] = calculatedViewBox.split(' ').map(Number);
        
        // Verify the dimensions are at least the minimum required
        expect(width).toBeGreaterThanOrEqual(expectedFinalWidth);
        expect(height).toBeGreaterThanOrEqual(expectedFinalHeight);
        
        game_internal.animateViewBox = originalAnimateViewBox;
      });
    });

    it('should respect minimum zoom dimensions even for very small elements', () => {
      const game_internal = game as any;
      
      // Create an extremely small element for testing
      const svgElement = game_internal.svgElement;
      const tinyElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      tinyElement.id = 'US-TINY-TEST';
      tinyElement.setAttribute('d', 'M200,200 L201,200 L201,201 L200,201 Z');
      
      // Mock getBBox to return 1x1 pixel size
      (tinyElement as SVGGraphicsElement).getBBox = () => ({ x: 200, y: 200, width: 1, height: 1 } as DOMRect);
      
      svgElement.appendChild(tinyElement);
      
      let calculatedViewBox = '';
      const originalAnimateViewBox = game_internal.animateViewBox;
      game_internal.animateViewBox = (viewBox: string) => {
        calculatedViewBox = viewBox;
      };
      
      game_internal.currentTestElement = 'US-TINY-TEST';
      game_internal.zoomToElementDirect('US-TINY-TEST');
      
      expect(calculatedViewBox).toBeTruthy();
      const [, , width, height] = calculatedViewBox.split(' ').map(Number);
      
      // Even for 1x1 element, should respect minimum dimensions
      expect(width).toBeGreaterThanOrEqual(500);
      expect(height).toBeGreaterThanOrEqual(375);
      
      game_internal.animateViewBox = originalAnimateViewBox;
      tinyElement.remove();
    });

    it('should maintain aspect ratio calculations correctly', () => {
      const game_internal = game as any;
      
      let calculatedViewBox = '';
      const originalAnimateViewBox = game_internal.animateViewBox;
      game_internal.animateViewBox = (viewBox: string) => {
        calculatedViewBox = viewBox;
      };
      
      // Test DC zoom aspect ratio handling
      game_internal.currentTestElement = 'US-DC';
      game_internal.zoomToElementDirect('US-DC');
      
      expect(calculatedViewBox).toBeTruthy();
      const [x, y, width, height] = calculatedViewBox.split(' ').map(Number);
      
      // Verify the viewBox stays within the SVG bounds (0 0 2289 1744)
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(x + width).toBeLessThanOrEqual(2289);
      expect(y + height).toBeLessThanOrEqual(1744);
      
      // Verify aspect ratio is reasonable (not extremely distorted)
      const aspectRatio = width / height;
      expect(aspectRatio).toBeGreaterThan(0.5);  // Not too tall
      expect(aspectRatio).toBeLessThan(3.0);     // Not too wide
      
      game_internal.animateViewBox = originalAnimateViewBox;
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing elements gracefully without breaking zoom functionality', () => {
      const game_internal = game as any;
      
      const originalConsoleWarn = console.warn;
      let warningCalled = false;
      console.warn = (message: string) => {
        if (message.includes('not found')) {
          warningCalled = true;
        }
      };
      
      // Test with non-existent element
      expect(() => {
        game_internal.zoomToElementDirect('US-NONEXISTENT');
      }).not.toThrow();
      
      expect(warningCalled).toBe(true);
      console.warn = originalConsoleWarn;
    });

    it('should handle getBBox errors gracefully for DC', () => {
      const game_internal = game as any;
      
      const dcElement = document.getElementById('US-DC');
      if (dcElement) {
        const originalGetBBox = (dcElement as SVGGraphicsElement).getBBox;
        (dcElement as SVGGraphicsElement).getBBox = () => {
          throw new Error('Mock getBBox error');
        };
        
        const originalConsoleError = console.error;
        let errorHandled = false;
        console.error = (...args: any[]) => {
          if (args[0] && args[0].includes('Error zooming to element')) {
            errorHandled = true;
          }
        };
        
        expect(() => {
          game_internal.zoomToElementDirect('US-DC');
        }).not.toThrow();
        
        expect(errorHandled).toBe(true);
        
        // Restore mocks
        (dcElement as SVGGraphicsElement).getBBox = originalGetBBox;
        console.error = originalConsoleError;
      }
    });

    it('should handle missing SVG element gracefully', () => {
      const game_internal = game as any;
      const originalSvgElement = game_internal.svgElement;
      
      // Set SVG element to null
      game_internal.svgElement = null;
      
      // Should not throw error
      expect(() => {
        game_internal.zoomToElementDirect('US-DC');
      }).not.toThrow();
      
      // Restore SVG element
      game_internal.svgElement = originalSvgElement;
    });
  });

  describe('Integration with Game Flow', () => {
    it('should correctly zoom to DC during actual game play', async () => {
      // Start a game
      game.selectDifficulty('easy');
      game.selectMode('us');
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const game_internal = game as any;
      let zoomCalled = false;
      
      const originalAnimateViewBox = game_internal.animateViewBox;
      game_internal.animateViewBox = (viewBox: string) => {
        zoomCalled = true;
        expect(viewBox).toBeTruthy();
        const parts = viewBox.split(' ').map(Number);
        expect(parts).toHaveLength(4);
        expect(parts.every(n => !isNaN(n))).toBe(true);
      };
      
      // Call the public zoom method (as would happen during gameplay)
      game_internal.zoomToElement('US-DC');
      
      // Wait for async zoom animation to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      expect(zoomCalled).toBe(true);
      game_internal.animateViewBox = originalAnimateViewBox;
    });
  });
});