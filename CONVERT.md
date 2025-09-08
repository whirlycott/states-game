# Vite + TypeScript Conversion Plan

## Current Project Analysis

The States & Provinces Game is currently a vanilla JavaScript project with:
- **Files**: `index.html`, `game.js` (55KB), `sounds.js`, `voice.js`, `styles.css`, `debug.html`
- **Architecture**: ES6 classes, Web Audio API, Speech Synthesis API, SVG manipulation
- **Dependencies**: None (vanilla JS project)
- **Build Process**: None (serves static files via HTTP server)

## Conversion Strategy

### Phase 1: Initialize Vite + TypeScript Environment
1. **Install Vite and TypeScript**
   ```bash
   npm init -y
   npm install --save-dev vite typescript @types/web
   npm install --save-dev @typescript-eslint/eslint-plugin @typescript-eslint/parser
   ```

2. **Create TypeScript Configuration**
   - `tsconfig.json` with strict mode, ES2020 target
   - Include DOM types for Web Audio API and Speech Synthesis

3. **Setup Vite Configuration**
   - `vite.config.ts` with proper asset handling for SVG map
   - Configure dev server to handle the large SVG file efficiently

### Phase 2: File Structure Migration
```
src/
├── main.ts              # Entry point (replaces script tags in HTML)
├── game/
│   ├── StatesGame.ts    # Main game class
│   ├── types.ts         # Game state interfaces and enums  
│   └── data.ts          # State/province mappings and adjacency
├── audio/
│   ├── RetroSounds.ts   # Sound effects system
│   └── EdgeyVoice.ts    # Voice synthesis system
├── styles/
│   └── main.css         # Consolidated styles
└── assets/
    └── Usa_and_Canada_with_names_natural.svg
```

### Phase 3: TypeScript Conversion Priority

**High Priority (Core Game Logic)**
1. **StatesGame.ts**
   - Define interfaces for game state, question data, and mode configuration
   - Add strict typing for the large data structures (usStates, canadianProvinces, adjacencyMap)
   - Type the SVG DOM manipulation and event handlers

2. **types.ts** - Create shared interfaces:
   ```typescript
   interface GameState {
     currentMode: GameMode | null;
     correctAnswers: number;
     wrongAnswers: number;
     questions: Question[];
   }
   
   type GameMode = 'us-easy' | 'us-hard' | 'canada-easy' | 'canada-hard' | 'both-easy' | 'both-hard';
   
   interface Question {
     stateId: string;
     stateName: string;
     region: 'us' | 'canada';
   }
   ```

**Medium Priority (Audio Systems)**
3. **RetroSounds.ts**
   - Type Web Audio API context and nodes
   - Add proper error handling types

4. **EdgeyVoice.ts**
   - Type Speech Synthesis API interfaces
   - Add voice selection and configuration types

### Phase 4: Module System Conversion
1. **Remove Global Classes**: Convert from global class instantiation to ES modules
2. **Import/Export**: Set up proper module imports between game components
3. **Asset Imports**: Convert SVG loading to use Vite's asset handling

### Phase 5: Build Optimization
1. **Bundle Splitting**: Separate audio systems from core game logic
2. **Asset Optimization**: Ensure large SVG map loads efficiently
3. **Development Experience**: 
   - Hot reload for rapid development
   - TypeScript error reporting
   - Source maps for debugging

### Phase 6: Quality Improvements
1. **ESLint Configuration**: Strict TypeScript rules
2. **Type Safety Audit**: Ensure no `any` types remain
3. **Error Handling**: Improve error boundaries with proper typing
4. **Performance**: Type-safe performance monitoring

## Migration Approach

**Incremental Strategy**:
1. Start with Vite setup alongside existing files
2. Convert one class at a time to TypeScript
3. Maintain working game throughout conversion
4. Remove old files only after TypeScript versions are verified

**Risk Mitigation**:
- Keep existing HTML as fallback during development
- Preserve exact game behavior (no feature changes during conversion)
- Test audio systems carefully (Web Audio API can be sensitive to changes)
- Verify SVG map loading works identically to current fetch-based approach

## Benefits After Conversion

1. **Developer Experience**: Better IDE support, autocomplete, refactoring
2. **Code Quality**: Compile-time error catching, better maintainability  
3. **Modern Tooling**: Hot reload, optimized builds, dependency management
4. **Future Extensibility**: Easier to add features with type safety
5. **Performance**: Bundled and optimized assets, tree-shaking

## Estimated Effort

- **Setup Phase**: 2-3 hours (Vite config, project structure)
- **Core Conversion**: 4-6 hours (StatesGame class is the largest component)
- **Audio Systems**: 2-3 hours (Web Audio/Speech APIs have complex typing)
- **Testing & Polish**: 2-3 hours (Ensure identical behavior)

**Total**: 10-15 hours over 2-3 sessions