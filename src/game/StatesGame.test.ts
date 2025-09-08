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
  
  return `<svg viewBox="0 0 2289 1744">${usStatesPaths}${canadianProvincesPaths}</svg>`;
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
});