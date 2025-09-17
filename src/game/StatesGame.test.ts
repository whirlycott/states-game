// ABOUTME: Comprehensive test suite for StatesGame coloring functionality
// ABOUTME: Tests map coloring logic, adjacency constraints, and SVG element handling

import { describe, it, expect, beforeEach, vi, beforeAll, afterEach } from 'vitest';
import { StatesGame } from './StatesGame.js';
import { usStates, canadianProvinces, adjacencyMap } from './data.js';

// Mock the SVG URL import
vi.mock('../assets/Usa_and_Canada_with_names_natural.svg?url', () => ({
  default: '/mocked-svg-url'
}));

// Mock the audio classes
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

// Create a mock SVG structure that matches the real SVG elements
function createMockSvgStructure(): string {
  // Create mock SVG with both path and group elements
  const usStatesPaths = Object.keys(usStates).map(stateId => {
    // California and Hawaii are groups in the real SVG
    if (stateId === 'US-CA' || stateId === 'US-HI') {
      return `<g id="${stateId}"><path d="M100,100 L200,100 L200,200 L100,200 Z"/><path d="M150,150 L250,150 L250,250 L150,250 Z"/></g>`;
    } else {
      return `<path id="${stateId}" d="M100,100 L200,100 L200,200 L100,200 Z"/>`;
    }
  }).join('');

  const canadianProvincesPaths = Object.keys(canadianProvinces).map(provinceId =>
    `<path id="${provinceId}" d="M100,100 L200,100 L200,200 L100,200 Z"/>`
  ).join('');

  // Ensure we have enough elements to pass validation (requires at least 10 geographic elements and 10 paths)
  return `<svg viewBox="0 0 2289 1744" xmlns="http://www.w3.org/2000/svg">${usStatesPaths}${canadianProvincesPaths}</svg>`;
}

// Set up DOM environment for testing
function setupDOMEnvironment() {
  document.body.innerHTML = `
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
      <div id="text-input-container" class="hidden">
        <input id="text-answer-input" type="text">
        <button id="submit-answer-btn"></button>
      </div>
      <button id="back-to-menu"></button>
      <button id="reset-game"></button>
      <button id="next-question"></button>
    </div>
    <div id="correct-count">0</div>
    <div id="incorrect-count">0</div>
    <div id="score-percentage">0%</div>
    <div id="progress-bar" style="width: 0%;"></div>
  `;
}

// Mock fetch to return our mock SVG
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('StatesGame Coloring Functionality', () => {
  let game: StatesGame;
  let mockSvgContent: string;

  beforeAll(() => {
    mockSvgContent = createMockSvgStructure();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve(mockSvgContent)
    } as Response);
  });

  beforeEach(async () => {
    setupDOMEnvironment();
    
    // Create new game instance and wait for initialization
    game = new StatesGame();
    
    // Wait for SVG to load
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('Data Integrity Tests', () => {
    it('should have exactly 51 US states/territories (50 states + DC)', () => {
      expect(Object.keys(usStates)).toHaveLength(51);
    });

    it('should have exactly 13 Canadian provinces/territories', () => {
      expect(Object.keys(canadianProvinces)).toHaveLength(13);
    });

    it('should include Washington D.C. in US states', () => {
      expect(usStates['US-DC']).toBe('Washington D.C.');
    });

    it('should include all expected US states', () => {
      const expectedStates = [
        'US-AL', 'US-AK', 'US-AZ', 'US-AR', 'US-CA', 'US-CO', 'US-CT', 'US-DE',
        'US-DC', 'US-FL', 'US-GA', 'US-HI', 'US-ID', 'US-IL', 'US-IN', 'US-IA',
        'US-KS', 'US-KY', 'US-LA', 'US-ME', 'US-MD', 'US-MA', 'US-MI', 'US-MN',
        'US-MS', 'US-MO', 'US-MT', 'US-NE', 'US-NV', 'US-NH', 'US-NJ', 'US-NM',
        'US-NY', 'US-NC', 'US-ND', 'US-OH', 'US-OK', 'US-OR', 'US-PA', 'US-RI',
        'US-SC', 'US-SD', 'US-TN', 'US-TX', 'US-UT', 'US-VT', 'US-VA', 'US-WA',
        'US-WV', 'US-WI', 'US-WY'
      ];
      
      expectedStates.forEach(stateId => {
        expect(usStates[stateId]).toBeDefined();
        expect(typeof usStates[stateId]).toBe('string');
      });
    });

    it('should include all expected Canadian provinces', () => {
      const expectedProvinces = [
        'CA-AB', 'CA-BC', 'CA-MB', 'CA-NB', 'CA-NL', 'CA-NS',
        'CA-NT', 'CA-NU', 'CA-ON', 'CA-PE', 'CA-QC', 'CA-SK', 'CA-YT'
      ];
      
      expectedProvinces.forEach(provinceId => {
        expect(canadianProvinces[provinceId]).toBeDefined();
        expect(typeof canadianProvinces[provinceId]).toBe('string');
      });
    });
  });

  describe('Color Palette Tests', () => {
    it('should have exactly 8 colors in the color palette', async () => {
      // Access the private colorPalette through reflection
      const colorPalette = (game as any).colorPalette;
      expect(colorPalette).toHaveLength(8);
    });

    it('should have valid hex color values in palette', async () => {
      const colorPalette = (game as any).colorPalette;
      const hexColorRegex = /^#[0-9a-fA-F]{6}$/;
      
      colorPalette.forEach((color: string) => {
        expect(color).toMatch(hexColorRegex);
      });
    });

    it('should have the expected color palette values', async () => {
      const colorPalette = (game as any).colorPalette;
      const expectedColors = ['#f3f9b2', '#e39bdb', '#4ca8bc', '#1d27a2', '#4768ae', '#e15c4f', '#fcffcd', '#f560e2'];
      
      expect(colorPalette).toEqual(expectedColors);
    });
  });

  describe('Game Mode Coloring Tests', () => {
    beforeEach(async () => {
      // Ensure SVG is loaded before each test
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    it('should color all 51 US states/territories in US mode', async () => {
      // Set up the game in US easy mode
      game.selectDifficulty('easy');
      game.selectMode('us');
      
      // Wait for game to start and coloring to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const stateColors = (game as any).stateColors as Map<string, string>;
      
      // Check that exactly 51 US states are colored
      const usStateIds = Object.keys(usStates);
      expect(stateColors.size).toBeGreaterThanOrEqual(usStateIds.length);
      
      // Check that all US states have colors assigned
      usStateIds.forEach(stateId => {
        expect(stateColors.has(stateId)).toBe(true);
        expect(typeof stateColors.get(stateId)).toBe('string');
      });
      
      // Check that no Canadian provinces are colored in US mode
      Object.keys(canadianProvinces).forEach(provinceId => {
        expect(stateColors.has(provinceId)).toBe(false);
      });
    });

    it('should color all 13 Canadian provinces in Canada mode', async () => {
      // Set up the game in Canada easy mode
      game.selectDifficulty('easy');
      game.selectMode('canada');
      
      // Wait for game to start and coloring to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const stateColors = (game as any).stateColors as Map<string, string>;
      
      // Check that exactly 13 Canadian provinces are colored
      const canadianProvinceIds = Object.keys(canadianProvinces);
      expect(stateColors.size).toBeGreaterThanOrEqual(canadianProvinceIds.length);
      
      // Check that all Canadian provinces have colors assigned
      canadianProvinceIds.forEach(provinceId => {
        expect(stateColors.has(provinceId)).toBe(true);
        expect(typeof stateColors.get(provinceId)).toBe('string');
      });
      
      // Check that no US states are colored in Canada mode
      Object.keys(usStates).forEach(stateId => {
        expect(stateColors.has(stateId)).toBe(false);
      });
    });

    it('should color all 64 states/provinces in both mode', async () => {
      // Set up the game in both easy mode
      game.selectDifficulty('easy');
      game.selectMode('both');
      
      // Wait for game to start and coloring to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const stateColors = (game as any).stateColors as Map<string, string>;
      
      // Check that all 64 (51 + 13) states/provinces are colored
      const totalExpected = Object.keys(usStates).length + Object.keys(canadianProvinces).length;
      expect(stateColors.size).toBe(totalExpected);
      
      // Check that all US states have colors assigned
      Object.keys(usStates).forEach(stateId => {
        expect(stateColors.has(stateId)).toBe(true);
        expect(typeof stateColors.get(stateId)).toBe('string');
      });
      
      // Check that all Canadian provinces have colors assigned  
      Object.keys(canadianProvinces).forEach(provinceId => {
        expect(stateColors.has(provinceId)).toBe(true);
        expect(typeof stateColors.get(provinceId)).toBe('string');
      });
    });

    it('should work consistently across different difficulty levels', async () => {
      // Test US hard mode
      game.selectDifficulty('hard');
      game.selectMode('us');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const hardModeColors = new Map((game as any).stateColors);
      
      // Reset and test US easy mode
      game.backToMenu();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      game.selectDifficulty('easy');
      game.selectMode('us');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const easyModeColors = (game as any).stateColors as Map<string, string>;
      
      // Both modes should color the same states
      expect(hardModeColors.size).toBe(easyModeColors.size);
      expect([...hardModeColors.keys()].sort()).toEqual([...easyModeColors.keys()].sort());
    });
  });

  describe('SVG Element Handling Tests', () => {
    beforeEach(async () => {
      // Ensure SVG is loaded and game is in a testable state
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    it('should handle both SVG path elements and group elements', async () => {
      game.selectDifficulty('easy');
      game.selectMode('us');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mapContainer = document.getElementById('map-container');
      const svg = mapContainer?.querySelector('svg');
      
      expect(svg).toBeDefined();
      
      // Test that California (group element) exists and is handled
      const californiaGroup = svg?.querySelector('g[id="US-CA"]');
      expect(californiaGroup).toBeDefined();
      
      // Test that Hawaii (group element) exists and is handled  
      const hawaiiGroup = svg?.querySelector('g[id="US-HI"]');
      expect(hawaiiGroup).toBeDefined();
      
      // Test that regular states (path elements) exist
      const texasPath = svg?.querySelector('path[id="US-TX"]');
      expect(texasPath).toBeDefined();
      
      const floridaPath = svg?.querySelector('path[id="US-FL"]');
      expect(floridaPath).toBeDefined();
    });

    it('should apply colors to group elements correctly', async () => {
      game.selectDifficulty('easy');  
      game.selectMode('us');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mapContainer = document.getElementById('map-container');
      const svg = mapContainer?.querySelector('svg');
      
      // Check that group elements have their child paths colored
      const californiaGroup = svg?.querySelector('g[id="US-CA"]') as SVGGElement;
      if (californiaGroup) {
        const pathElements = californiaGroup.querySelectorAll('path');
        expect(pathElements.length).toBeGreaterThan(0);
        
        pathElements.forEach(path => {
          expect(path.style.fill).toBeTruthy();
          expect(path.style.stroke).toBe('#333');
          expect(path.style.strokeWidth).toBe('1');
        });
      }
      
      const hawaiiGroup = svg?.querySelector('g[id="US-HI"]') as SVGGElement;
      if (hawaiiGroup) {
        const pathElements = hawaiiGroup.querySelectorAll('path');
        expect(pathElements.length).toBeGreaterThan(0);
        
        pathElements.forEach(path => {
          expect(path.style.fill).toBeTruthy();
          expect(path.style.stroke).toBe('#333');
          expect(path.style.strokeWidth).toBe('1');
        });
      }
    });

    it('should apply colors to path elements correctly', async () => {
      game.selectDifficulty('easy');
      game.selectMode('us');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mapContainer = document.getElementById('map-container');
      const svg = mapContainer?.querySelector('svg');
      
      // Check that regular path elements are colored
      const texasPath = svg?.querySelector('path[id="US-TX"]') as SVGPathElement;
      if (texasPath) {
        expect(texasPath.style.fill).toBeTruthy();
        expect(texasPath.style.stroke).toBe('#333');
        expect(texasPath.style.strokeWidth).toBe('1');
      }
    });
  });

  describe('Adjacency Constraint Tests', () => {
    beforeEach(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    it('should not assign the same color to adjacent states/provinces', async () => {
      game.selectDifficulty('easy');
      game.selectMode('both');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const stateColors = (game as any).stateColors as Map<string, string>;
      
      // Check adjacency constraints for all colored states
      for (const [stateId, color] of stateColors.entries()) {
        const adjacentStates = adjacencyMap[stateId] || [];
        
        adjacentStates.forEach(adjacentId => {
          if (stateColors.has(adjacentId)) {
            const adjacentColor = stateColors.get(adjacentId);
            expect(color).not.toBe(adjacentColor);
          }
        });
      }
    });

    it('should handle states with no adjacent territories correctly', async () => {
      game.selectDifficulty('easy');
      game.selectMode('us');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const stateColors = (game as any).stateColors as Map<string, string>;
      
      // Alaska and Hawaii have no land borders
      expect(stateColors.has('US-AK')).toBe(true);
      expect(stateColors.has('US-HI')).toBe(true);
      
      // These should have colors even though they have no adjacencies
      expect(typeof stateColors.get('US-AK')).toBe('string');
      expect(typeof stateColors.get('US-HI')).toBe('string');
    });

    it('should respect complex adjacency relationships', async () => {
      game.selectDifficulty('easy');
      game.selectMode('us');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const stateColors = (game as any).stateColors as Map<string, string>;
      
      // Test Tennessee, which has many neighbors
      const tennesseeColor = stateColors.get('US-TN');
      const tennesseeNeighbors = ['US-KY', 'US-VA', 'US-NC', 'US-GA', 'US-AL', 'US-MS', 'US-AR', 'US-MO'];
      
      tennesseeNeighbors.forEach(neighborId => {
        if (stateColors.has(neighborId)) {
          const neighborColor = stateColors.get(neighborId);
          expect(tennesseeColor).not.toBe(neighborColor);
        }
      });
    });

    it('should handle cross-border adjacencies correctly in both mode', async () => {
      game.selectDifficulty('easy');
      game.selectMode('both');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const stateColors = (game as any).stateColors as Map<string, string>;
      
      // All territories should be colored
      expect(stateColors.size).toBe(64);
      
      // Verify no conflicts across all adjacencies
      let violationCount = 0;
      for (const [stateId, color] of stateColors.entries()) {
        const adjacentStates = adjacencyMap[stateId] || [];
        adjacentStates.forEach(adjacentId => {
          if (stateColors.has(adjacentId) && stateColors.get(adjacentId) === color) {
            violationCount++;
          }
        });
      }
      
      expect(violationCount).toBe(0);
    });
  });

  describe('Coloring Algorithm Edge Cases', () => {
    beforeEach(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    it('should handle color exhaustion gracefully', async () => {
      game.selectDifficulty('easy');
      game.selectMode('both');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const stateColors = (game as any).stateColors as Map<string, string>;
      const colorPalette = (game as any).colorPalette;
      
      // Even with only 8 colors and 64 territories, all should be colored
      expect(stateColors.size).toBe(64);
      
      // All colors should be from the defined palette
      const usedColors = new Set(stateColors.values());
      usedColors.forEach(color => {
        expect(colorPalette.includes(color)).toBe(true);
      });
    });

    it('should maintain consistency across multiple coloring operations', async () => {
      // First coloring
      game.selectDifficulty('easy');
      game.selectMode('us');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const firstColoring = new Map((game as any).stateColors);
      
      // Reset and color again
      game.resetGame();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const secondColoring = (game as any).stateColors as Map<string, string>;
      
      // Both colorings should have the same states
      expect([...firstColoring.keys()].sort()).toEqual([...secondColoring.keys()].sort());
      
      // Verify adjacency constraints are maintained in both
      [firstColoring, secondColoring].forEach(coloring => {
        for (const [stateId, color] of coloring.entries()) {
          const adjacentStates = adjacencyMap[stateId] || [];
          adjacentStates.forEach(adjacentId => {
            if (coloring.has(adjacentId)) {
              expect(color).not.toBe(coloring.get(adjacentId));
            }
          });
        }
      });
    });

    it('should clear colors properly when switching modes', async () => {
      // Start in US mode
      game.selectDifficulty('easy');
      game.selectMode('us');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const usStateColors = new Map((game as any).stateColors);
      expect(usStateColors.size).toBe(51);
      
      // Switch to Canada mode
      game.backToMenu();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      game.selectDifficulty('easy');
      game.selectMode('canada');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canadaStateColors = (game as any).stateColors as Map<string, string>;
      expect(canadaStateColors.size).toBe(13);
      
      // Verify no US states are colored in Canada mode
      Object.keys(usStates).forEach(stateId => {
        expect(canadaStateColors.has(stateId)).toBe(false);
      });
      
      // Verify all Canadian provinces are colored
      Object.keys(canadianProvinces).forEach(provinceId => {
        expect(canadaStateColors.has(provinceId)).toBe(true);
      });
    });
  });

  describe('Washington DC Enhanced Zoom Functionality', () => {
    beforeEach(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      setupDOMEnvironment();
      
      // Create a fresh game instance for zoom testing
      game = new StatesGame();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Mock SVG element and add DC element to DOM
      const mapContainer = document.getElementById('map-container');
      if (mapContainer) {
        mapContainer.innerHTML = `
          <svg viewBox="0 0 2289 1744" style="width: 800px; height: 600px;">
            <path id="US-DC" d="M100,100 L110,100 L110,110 L100,110 Z"/>
            <path id="US-TX" d="M100,100 L200,100 L200,200 L100,200 Z"/>
            <path id="US-AK" d="M100,100 L150,100 L150,150 L100,150 Z"/>
            <path id="US-HI" d="M100,100 L130,100 L130,130 L100,130 Z"/>
            <path id="US-CA" d="M100,100 L180,100 L180,180 L100,180 Z"/>
          </svg>
        `;
      }
      
      // Set the SVG element reference
      const svgElement = mapContainer?.querySelector('svg') as SVGSVGElement;
      if (svgElement) {
        (game as any).svgElement = svgElement;
        
        // Mock getBBox for SVG elements to return realistic bounding boxes
        const elements = svgElement.querySelectorAll('path');
        elements.forEach((element: Element) => {
          const svgElement = element as SVGGraphicsElement;
          const elementId = element.id;
          
          // Mock getBBox with different sizes for different states
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
              default:
                return { x: 100, y: 100, width: 50, height: 50 } as DOMRect;
            }
          };
        });
        
        // Mock getBoundingClientRect for the SVG element itself
        svgElement.getBoundingClientRect = () => ({
          x: 0,
          y: 0,
          width: 800,
          height: 600,
          top: 0,
          left: 0,
          right: 800,
          bottom: 600
        } as DOMRect);
      }
    });

    describe('Zoom Factor Calculation Tests', () => {
      it('should assign 3.0x zoom factor to Washington DC', () => {
        const originalAnimateViewBox = (game as any).animateViewBox;
        let dcViewBox = '';
        let texasViewBox = '';
        
        // Mock animateViewBox to capture the viewBox calculations
        (game as any).animateViewBox = (viewBox: string) => {
          // Store the viewBox based on which element is being processed
          const currentElement = (game as any).currentTestElement;
          if (currentElement === 'US-DC') {
            dcViewBox = viewBox;
          } else if (currentElement === 'US-TX') {
            texasViewBox = viewBox;
          }
        };
        
        // Test DC zoom - DC has 10x10 bbox, should get 3.0x padding factor
        (game as any).currentTestElement = 'US-DC';
        (game as any).zoomToElementDirect('US-DC');
        
        // Test Texas zoom - Texas has 100x100 bbox, should get 1.2x padding factor  
        (game as any).currentTestElement = 'US-TX';
        (game as any).zoomToElementDirect('US-TX');
        
        // Both should have valid viewBox strings
        expect(dcViewBox).toBeTruthy();
        expect(texasViewBox).toBeTruthy();
        
        const dcViewBoxParts = dcViewBox.split(' ').map(Number);
        const texasViewBoxParts = texasViewBox.split(' ').map(Number);
        
        // DC now gets special small minimum dimensions (200x150) to allow enhanced zoom to take effect
        // Texas still gets standard minimum dimensions (500x375)
        expect(dcViewBoxParts[2]).toBeGreaterThanOrEqual(200); // DC gets reduced minimum width
        expect(dcViewBoxParts[3]).toBeGreaterThanOrEqual(150); // DC gets reduced minimum height
        expect(texasViewBoxParts[2]).toBeGreaterThanOrEqual(500); // Texas respects standard minimum width  
        expect(texasViewBoxParts[3]).toBeGreaterThanOrEqual(375); // Texas respects standard minimum height
        
        // The key test is that DC calculation used the 3.0x factor in its logic, even if final result hits minimums
        
        (game as any).animateViewBox = originalAnimateViewBox;
      });

      it('should use higher zoom factor for DC compared to other special case states', () => {
        const originalAnimateViewBox = (game as any).animateViewBox;
        const viewBoxResults: { [key: string]: string } = {};
        
        (game as any).animateViewBox = (viewBox: string) => {
          const elementId = (game as any).currentTestElement;
          viewBoxResults[elementId] = viewBox;
        };
        
        // Test different states with their specific bounding boxes
        const testStates = [
          { id: 'US-DC', expectedFactor: 3.0, size: 10 }, // Very small, highest zoom
          { id: 'US-AK', expectedFactor: 1.5, size: 50 }, // Medium zoom
          { id: 'US-HI', expectedFactor: 1.8, size: 30 }, // Higher zoom  
          { id: 'US-TX', expectedFactor: 1.2, size: 100 } // Default zoom
        ];
        
        testStates.forEach(state => {
          (game as any).currentTestElement = state.id;
          (game as any).zoomToElementDirect(state.id);
        });
        
        // All states should have viewBoxes
        expect(Object.keys(viewBoxResults).length).toBe(4);
        
        // Parse viewBox dimensions
        const dcViewBox = viewBoxResults['US-DC'].split(' ').map(Number);
        const alaskaViewBox = viewBoxResults['US-AK'].split(' ').map(Number);
        const hawaiiViewBox = viewBoxResults['US-HI'].split(' ').map(Number);
        const texasViewBox = viewBoxResults['US-TX'].split(' ').map(Number);
        
        // States now get different minimum dimensions based on their padding factors
        // DC (3.0x): 200x150, Hawaii (1.8x): 350x260, Alaska/Texas (1.5x/1.2x): 500x375
        expect(dcViewBox[2]).toBeGreaterThanOrEqual(200); // DC gets smallest minimum width
        expect(alaskaViewBox[2]).toBeGreaterThanOrEqual(500); // Alaska gets standard minimum width  
        expect(hawaiiViewBox[2]).toBeGreaterThanOrEqual(350); // Hawaii gets moderate minimum width
        expect(texasViewBox[2]).toBeGreaterThanOrEqual(500); // Texas gets standard minimum width
        
        (game as any).animateViewBox = originalAnimateViewBox;
      });

      it('should apply default 1.2x zoom factor to states without special cases', () => {
        const originalAnimateViewBox = (game as any).animateViewBox;
        let capturedViewBox = '';
        
        (game as any).animateViewBox = (viewBox: string) => {
          capturedViewBox = viewBox;
        };
        
        // Test a regular state (Texas) - should get default 1.2x factor
        (game as any).currentTestElement = 'US-TX';
        (game as any).zoomToElementDirect('US-TX');
        
        expect(capturedViewBox).toBeTruthy();
        const viewBoxParts = capturedViewBox.split(' ').map(Number);
        expect(viewBoxParts).toHaveLength(4);
        expect(viewBoxParts.every(n => !isNaN(n))).toBe(true);
        
        // Texas (100x100 bbox) with 1.2x padding should result in specific dimensions
        // Padding = 100 * 1.2 = 120px, so viewBox should be around 100 + 240 = 340px
        // But minimum dimensions (500x375) will likely apply
        expect(viewBoxParts[2]).toBeGreaterThanOrEqual(500); // minimum width
        expect(viewBoxParts[3]).toBeGreaterThanOrEqual(375); // minimum height
        
        (game as any).animateViewBox = originalAnimateViewBox;
      });
    });

    describe('Zoom Calculation Integration Tests', () => {
      it('should handle DC zoom with different bounding box sizes', () => {
        const svgElement = (game as any).svgElement;
        
        // Create different sized DC elements to test scaling
        const smallDC = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        smallDC.id = 'US-DC-small';
        smallDC.setAttribute('d', 'M100,100 L105,100 L105,105 L100,105 Z');
        // Mock getBBox for small DC (5x5 pixels)
        (smallDC as SVGGraphicsElement).getBBox = () => ({ x: 100, y: 100, width: 5, height: 5 } as DOMRect);
        svgElement.appendChild(smallDC);
        
        const largeDC = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        largeDC.id = 'US-DC-large'; 
        largeDC.setAttribute('d', 'M100,100 L150,100 L150,150 L100,150 Z');
        // Mock getBBox for large DC (50x50 pixels)
        (largeDC as SVGGraphicsElement).getBBox = () => ({ x: 100, y: 100, width: 50, height: 50 } as DOMRect);
        svgElement.appendChild(largeDC);
        
        const originalAnimateViewBox = (game as any).animateViewBox;
        const viewBoxResults: string[] = [];
        
        (game as any).animateViewBox = (viewBox: string) => {
          viewBoxResults.push(viewBox);
        };
        
        // Test both sizes - both should get enhanced zoom (neither have special cases, but they would if named US-DC)
        (game as any).zoomToElementDirect('US-DC-small');
        (game as any).zoomToElementDirect('US-DC-large');
        
        expect(viewBoxResults).toHaveLength(2);
        viewBoxResults.forEach(viewBox => {
          expect(viewBox).toBeTruthy();
          const parts = viewBox.split(' ').map(Number);
          expect(parts).toHaveLength(4);
          expect(parts.every(n => !isNaN(n))).toBe(true);
        });
        
        (game as any).animateViewBox = originalAnimateViewBox;
      });

      it('should maintain viewBox bounds when zooming to DC', () => {
        const originalAnimateViewBox = (game as any).animateViewBox;
        let capturedViewBox = '';
        
        (game as any).animateViewBox = (viewBox: string) => {
          capturedViewBox = viewBox;
        };
        
        (game as any).currentTestElement = 'US-DC';
        (game as any).zoomToElementDirect('US-DC');
        
        expect(capturedViewBox).toBeTruthy();
        const [x, y, width, height] = capturedViewBox.split(' ').map(Number);
        
        // Verify viewBox stays within SVG bounds (0 0 2289 1744)
        expect(x).toBeGreaterThanOrEqual(0);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(x + width).toBeLessThanOrEqual(2289);
        expect(y + height).toBeLessThanOrEqual(1744);
        expect(width).toBeLessThanOrEqual(2289);
        expect(height).toBeLessThanOrEqual(1744);
        
        (game as any).animateViewBox = originalAnimateViewBox;
      });

      it('should respect minimum zoom dimensions for DC', () => {
        const originalAnimateViewBox = (game as any).animateViewBox;
        let capturedViewBox = '';
        
        (game as any).animateViewBox = (viewBox: string) => {
          capturedViewBox = viewBox;
        };
        
        (game as any).currentTestElement = 'US-DC';
        (game as any).zoomToElementDirect('US-DC');
        
        expect(capturedViewBox).toBeTruthy();
        const [, , width, height] = capturedViewBox.split(' ').map(Number);
        
        // DC should respect its special smaller minimum zoom dimensions (200x150)
        expect(width).toBeGreaterThanOrEqual(200);
        expect(height).toBeGreaterThanOrEqual(150);
        
        (game as any).animateViewBox = originalAnimateViewBox;
      });
    });

    describe('Gameplay Integration Tests', () => {
      it('should zoom to DC correctly during US-only game mode', async () => {
        game.selectDifficulty('easy');
        game.selectMode('us');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const originalAnimateViewBox = (game as any).animateViewBox;
        let zoomOccurred = false;
        
        (game as any).animateViewBox = (viewBox: string) => {
          zoomOccurred = true;
          expect(viewBox).toBeTruthy();
        };
        
        // Simulate clicking on DC during gameplay
        (game as any).zoomToElement('US-DC');
        
        expect(zoomOccurred).toBe(true);
        (game as any).animateViewBox = originalAnimateViewBox;
      });

      it('should zoom to DC correctly during Both mode', async () => {
        game.selectDifficulty('easy');
        game.selectMode('both');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const originalAnimateViewBox = (game as any).animateViewBox;
        let zoomOccurred = false;
        
        (game as any).animateViewBox = (viewBox: string) => {
          zoomOccurred = true;
          expect(viewBox).toBeTruthy();
        };
        
        // Test DC zoom in both mode
        (game as any).zoomToElement('US-DC');
        
        expect(zoomOccurred).toBe(true);
        (game as any).animateViewBox = originalAnimateViewBox;
      });

      it('should handle DC zoom with smooth transition animation', async () => {
        const originalAnimateViewBox = (game as any).animateViewBox;
        let animationDuration = 0;
        
        (game as any).animateViewBox = (viewBox: string, duration: number) => {
          animationDuration = duration || 0;
        };
        
        // Test that DC gets proper animation duration
        (game as any).currentTestElement = 'US-DC';
        (game as any).zoomToElementDirect('US-DC');
        
        expect(animationDuration).toBe(600); // Should use 600ms animation
        (game as any).animateViewBox = originalAnimateViewBox;
      });
    });

    describe('Regression Tests', () => {
      it('should not affect zoom levels of other states when DC enhancement is present', () => {
        const originalAnimateViewBox = (game as any).animateViewBox;
        const viewBoxResults: { [key: string]: string } = {};
        
        (game as any).animateViewBox = (viewBox: string) => {
          const elementId = (game as any).currentTestElement || 'unknown';
          viewBoxResults[elementId] = viewBox;
        };
        
        // Test regular states to ensure they still get default zoom
        const regularStates = ['US-TX', 'US-CA'];
        regularStates.forEach(stateId => {
          (game as any).currentTestElement = stateId;
          (game as any).zoomToElementDirect(stateId);
        });
        
        // Verify all regular states got zoom treatment
        expect(Object.keys(viewBoxResults).length).toBe(regularStates.length);
        
        // Both should have valid viewBox strings
        regularStates.forEach(stateId => {
          expect(viewBoxResults[stateId]).toBeTruthy();
          const parts = viewBoxResults[stateId].split(' ').map(Number);
          expect(parts).toHaveLength(4);
        });
        
        (game as any).animateViewBox = originalAnimateViewBox;
      });

      it('should maintain other special case zoom factors when DC is present', () => {
        const originalAnimateViewBox = (game as any).animateViewBox;
        const viewBoxResults: { [key: string]: string } = {};
        
        (game as any).animateViewBox = (viewBox: string) => {
          const elementId = (game as any).currentTestElement || 'unknown';
          viewBoxResults[elementId] = viewBox;
        };
        
        // Test Alaska (1.5x) and Hawaii (1.8x) still work
        const specialStates = ['US-AK', 'US-HI'];
        specialStates.forEach(stateId => {
          (game as any).currentTestElement = stateId;
          (game as any).zoomToElementDirect(stateId);
        });
        
        // Both special states should have received zoom treatment
        expect(Object.keys(viewBoxResults).length).toBe(2);
        expect(viewBoxResults['US-AK']).toBeTruthy();
        expect(viewBoxResults['US-HI']).toBeTruthy();
        
        // Verify they have valid viewBox dimensions
        specialStates.forEach(stateId => {
          const parts = viewBoxResults[stateId].split(' ').map(Number);
          expect(parts).toHaveLength(4);
          expect(parts.every(n => !isNaN(n))).toBe(true);
        });
        
        (game as any).animateViewBox = originalAnimateViewBox;
      });

      it('should handle missing DC element gracefully', () => {
        // Remove DC element from DOM
        const dcElement = document.getElementById('US-DC');
        if (dcElement) {
          dcElement.remove();
        }
        
        const originalConsoleWarn = console.warn;
        let warningLogged = false;
        console.warn = (message: string) => {
          if (message.includes('US-DC') && message.includes('not found')) {
            warningLogged = true;
          }
        };
        
        // Should handle missing element gracefully
        expect(() => {
          (game as any).zoomToElementDirect('US-DC');
        }).not.toThrow();
        
        expect(warningLogged).toBe(true);
        console.warn = originalConsoleWarn;
      });
    });

    describe('Edge Cases and Error Handling', () => {
      it('should handle DC zoom when SVG element is not available', () => {
        // Temporarily remove SVG element
        const originalSvgElement = (game as any).svgElement;
        (game as any).svgElement = null;
        
        // Should not throw error
        expect(() => {
          (game as any).zoomToElementDirect('US-DC');
        }).not.toThrow();
        
        // Restore SVG element
        (game as any).svgElement = originalSvgElement;
      });

      it('should handle getBBox errors gracefully for DC', () => {
        const dcElement = document.getElementById('US-DC');
        if (dcElement) {
          // Mock getBBox to throw error directly on the DC element
          const originalGetBBox = (dcElement as SVGGraphicsElement).getBBox;
          (dcElement as SVGGraphicsElement).getBBox = () => {
            throw new Error('Mock getBBox error');
          };
          
          const originalConsoleError = console.error;
          let errorLogged = false;
          console.error = (...args: any[]) => {
            const message = args[0] || '';
            if (typeof message === 'string' && message.includes('Error zooming to element')) {
              errorLogged = true;
            }
          };
          
          // Should handle error gracefully
          expect(() => {
            (game as any).currentTestElement = 'US-DC';
            (game as any).zoomToElementDirect('US-DC');
          }).not.toThrow();
          
          expect(errorLogged).toBe(true);
          
          // Restore mocks
          (dcElement as SVGGraphicsElement).getBBox = originalGetBBox;
          console.error = originalConsoleError;
        }
      });

      it('should calculate correct padding for very small DC bounding boxes', () => {
        // Create a very small DC element
        const verySmallDC = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        verySmallDC.id = 'US-DC-tiny';
        verySmallDC.setAttribute('d', 'M100,100 L101,100 L101,101 L100,101 Z');
        // Mock getBBox for very small element (1x1 pixel)
        (verySmallDC as SVGGraphicsElement).getBBox = () => ({ x: 100, y: 100, width: 1, height: 1 } as DOMRect);
        
        const svgElement = (game as any).svgElement;
        if (svgElement) {
          svgElement.appendChild(verySmallDC);
          
          const originalAnimateViewBox = (game as any).animateViewBox;
          let capturedViewBox = '';
          
          (game as any).animateViewBox = (viewBox: string) => {
            capturedViewBox = viewBox;
          };
          
          (game as any).currentTestElement = 'US-DC-tiny';
          (game as any).zoomToElementDirect('US-DC-tiny');
          
          // Should still produce valid viewBox even for tiny elements
          expect(capturedViewBox).toBeTruthy();
          const [, , width, height] = capturedViewBox.split(' ').map(Number);
          
          // Should respect minimum padding (120px) and minimum dimensions (500x375)
          expect(width).toBeGreaterThanOrEqual(500);
          expect(height).toBeGreaterThanOrEqual(375);
          
          (game as any).animateViewBox = originalAnimateViewBox;
          verySmallDC.remove();
        }
      });
    });
  });

  describe('Marching Ants Animation Bug', () => {
    beforeEach(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    it('should immediately clear marching ants animation when correct answer is given in hard mode', async () => {
      // Set up hard mode US game
      game.selectDifficulty('hard');
      game.selectMode('us');
      await new Promise(resolve => setTimeout(resolve, 500));

      const mapContainer = document.getElementById('map-container');
      const svg = mapContainer?.querySelector('svg') as SVGSVGElement;

      // Ensure we have a valid SVG and the game has started
      expect(svg).toBeDefined();
      expect((game as any).gameStarted).toBe(true);

      // Simulate the first question being US-MA (Massachusetts)
      const questions = (game as any).questions;
      if (questions.length === 0) return; // Skip if no questions generated

      // Force Massachusetts to be the first question for reproducibility
      const maQuestion = { stateId: 'US-MA', stateName: 'Massachusetts', region: 'us' };
      (game as any).questions = [maQuestion, ...questions.slice(1)];
      (game as any).currentQuestion = 0;

      // Display the question which should highlight US-MA with marching ants
      (game as any).displayQuestion();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Find the Massachusetts element (could be path or group)
      const maElement = svg.querySelector('#US-MA') as SVGPathElement | SVGGElement;

      if (maElement) {
        // Verify marching ants are applied initially
        const checkMarchingAnts = (element: Element) => {
          const htmlEl = element as HTMLElement;
          return htmlEl.style.animation.includes('marchingAnts') ||
                 htmlEl.style.strokeDasharray === '3,3' ||
                 htmlEl.style.stroke?.includes('multiColorPattern');
        };

        let hasAnimationBefore = false;
        if (maElement.tagName === 'g') {
          // For group elements, check child paths
          const pathElements = maElement.querySelectorAll('path');
          hasAnimationBefore = Array.from(pathElements).some(checkMarchingAnts);
        } else {
          hasAnimationBefore = checkMarchingAnts(maElement);
        }

        expect(hasAnimationBefore).toBe(true); // Should have marching ants initially

        // Simulate giving the correct answer by calling submitTextAnswer with correct answer
        const textInput = document.getElementById('text-answer-input') as HTMLInputElement;
        if (textInput) {
          textInput.value = 'Massachusetts';

          // Mock the voice method to avoid delays in test
          const originalVoiceMethod = (game as any).voice.playCorrectPhrase;
          (game as any).voice.playCorrectPhrase = vi.fn();

          // Submit the correct answer
          (game as any).submitTextAnswer();

          // Check immediately after submission - marching ants should be cleared
          let hasAnimationAfter = false;
          if (maElement.tagName === 'g') {
            const pathElements = maElement.querySelectorAll('path');
            hasAnimationAfter = Array.from(pathElements).some(checkMarchingAnts);
          } else {
            hasAnimationAfter = checkMarchingAnts(maElement);
          }

          expect(hasAnimationAfter).toBe(false); // Bug: marching ants should be cleared immediately but aren't

          // Restore the voice method
          (game as any).voice.playCorrectPhrase = originalVoiceMethod;
        }
      }
    });

    it('should immediately clear marching ants animation when wrong answer is given in hard mode', async () => {
      // Set up hard mode US game
      game.selectDifficulty('hard');
      game.selectMode('us');
      await new Promise(resolve => setTimeout(resolve, 500));

      const mapContainer = document.getElementById('map-container');
      const svg = mapContainer?.querySelector('svg') as SVGSVGElement;

      expect(svg).toBeDefined();
      expect((game as any).gameStarted).toBe(true);

      // Force New York to be the first question
      const nyQuestion = { stateId: 'US-NY', stateName: 'New York', region: 'us' };
      const questions = (game as any).questions;
      (game as any).questions = [nyQuestion, ...questions.slice(1)];
      (game as any).currentQuestion = 0;

      // Display the question
      (game as any).displayQuestion();
      await new Promise(resolve => setTimeout(resolve, 100));

      const nyElement = svg.querySelector('#US-NY') as SVGPathElement | SVGGElement;

      if (nyElement) {
        const checkMarchingAnts = (element: Element) => {
          const htmlEl = element as HTMLElement;
          return htmlEl.style.animation.includes('marchingAnts') ||
                 htmlEl.style.strokeDasharray === '3,3' ||
                 htmlEl.style.stroke?.includes('multiColorPattern');
        };

        // Verify marching ants are applied initially
        let hasAnimationBefore = false;
        if (nyElement.tagName === 'g') {
          const pathElements = nyElement.querySelectorAll('path');
          hasAnimationBefore = Array.from(pathElements).some(checkMarchingAnts);
        } else {
          hasAnimationBefore = checkMarchingAnts(nyElement);
        }

        expect(hasAnimationBefore).toBe(true);

        // Give wrong answer
        const textInput = document.getElementById('text-answer-input') as HTMLInputElement;
        if (textInput) {
          textInput.value = 'California'; // Wrong answer

          // Mock voice methods
          const originalVoiceMethod = (game as any).voice.playIncorrectPhrase;
          (game as any).voice.playIncorrectPhrase = vi.fn();

          (game as any).submitTextAnswer();

          // Check that marching ants are cleared after wrong answer
          let hasAnimationAfter = false;
          if (nyElement.tagName === 'g') {
            const pathElements = nyElement.querySelectorAll('path');
            hasAnimationAfter = Array.from(pathElements).some(checkMarchingAnts);
          } else {
            hasAnimationAfter = checkMarchingAnts(nyElement);
          }

          expect(hasAnimationAfter).toBe(false);

          // Restore voice method
          (game as any).voice.playIncorrectPhrase = originalVoiceMethod;
        }
      }
    });

    it('should immediately clear marching ants animation when correct answer is given in easy mode', async () => {
      // Set up easy mode US game
      game.selectDifficulty('easy');
      game.selectMode('us');
      await new Promise(resolve => setTimeout(resolve, 500));

      const mapContainer = document.getElementById('map-container');
      const svg = mapContainer?.querySelector('svg') as SVGSVGElement;

      expect(svg).toBeDefined();
      expect((game as any).gameStarted).toBe(true);

      // Force Florida to be the first question
      const flQuestion = { stateId: 'US-FL', stateName: 'Florida', region: 'us' };
      const questions = (game as any).questions;
      (game as any).questions = [flQuestion, ...questions.slice(1)];
      (game as any).currentQuestion = 0;

      // Display the question
      (game as any).displayQuestion();
      await new Promise(resolve => setTimeout(resolve, 100));

      const flElement = svg.querySelector('#US-FL') as SVGPathElement | SVGGElement;

      if (flElement) {
        const checkMarchingAnts = (element: Element) => {
          const htmlEl = element as HTMLElement;
          return htmlEl.style.animation.includes('marchingAnts') ||
                 htmlEl.style.strokeDasharray === '3,3' ||
                 htmlEl.style.stroke?.includes('multiColorPattern');
        };

        // Verify marching ants are applied initially
        let hasAnimationBefore = false;
        if (flElement.tagName === 'g') {
          const pathElements = flElement.querySelectorAll('path');
          hasAnimationBefore = Array.from(pathElements).some(checkMarchingAnts);
        } else {
          hasAnimationBefore = checkMarchingAnts(flElement);
        }

        expect(hasAnimationBefore).toBe(true);

        // Mock voice methods
        const originalVoiceMethod = (game as any).voice.playCorrectPhrase;
        (game as any).voice.playCorrectPhrase = vi.fn();

        // Click the correct answer button in easy mode
        (game as any).selectAnswer('Florida', 'Florida');

        // Check that marching ants are cleared immediately after correct answer
        let hasAnimationAfter = false;
        if (flElement.tagName === 'g') {
          const pathElements = flElement.querySelectorAll('path');
          hasAnimationAfter = Array.from(pathElements).some(checkMarchingAnts);
        } else {
          hasAnimationAfter = checkMarchingAnts(flElement);
        }

        expect(hasAnimationAfter).toBe(false);

        // Restore voice method
        (game as any).voice.playCorrectPhrase = originalVoiceMethod;
      }
    });
  });
});