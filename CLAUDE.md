# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript/Vite-based educational web game for primary school students to learn US states and Canadian provinces by their shapes. The game uses an interactive SVG map and features multiple game modes, audio feedback, and kid-friendly UI.

## Development Commands

- **Dev server**: `npm run dev` (runs on port 8000)
- **Build**: `npm run build` (TypeScript compile + Vite build)
- **Preview**: `npm run preview` or `npm run serve`
- **Type checking**: `npm run type-check`
- **Linting**: `npm run lint` (check) or `npm run lint:fix` (auto-fix)
- **Testing**: `npm test` (run once) or `npm test:watch` (watch mode)

## Architecture

### Core Structure
- `src/main.ts` - Entry point, initializes StatesGame class
- `src/game/StatesGame.ts` - Main game logic and state management
- `src/game/types.ts` - TypeScript interfaces and type definitions
- `src/game/data.ts` - Game data (states, provinces, adjacency mapping)
- `src/audio/` - Audio system (RetroSounds, EdgeyVoice classes)
- `src/assets/` - Static assets including the interactive SVG map
- `src/styles/` - CSS modules

### Game Architecture
- **StatesGame class** - Central game controller with private methods for:
  - SVG map loading and manipulation
  - Question generation and difficulty modes
  - Score tracking and state management
  - Audio/voice integration
- **Game modes**: Supports US-only, Canada-only, or both regions with easy/hard difficulties
- **Interactive map**: SVG manipulation for highlighting and coloring states/provinces
- **Audio system**: Separate classes for retro sounds and text-to-speech voice feedback

### Key Patterns
- Uses TypeScript strict mode with comprehensive type definitions
- Modular CSS with component-based styling
- Event-driven architecture for user interactions
- Comprehensive test coverage with Vitest
- All source files include ABOUTME comments describing their purpose

## Testing

- Uses **Vitest** as the test runner
- Test files are co-located with source files (`*.test.ts`)
- Comprehensive test coverage for game logic, audio systems, and utilities
- Tests run in jsdom environment for DOM manipulation testing

## Build Configuration

- **Vite** for bundling and dev server
- **TypeScript** with strict compilation settings
- **ESLint** with TypeScript rules for code quality
- SVG assets are included via Vite's asset handling (`?url` imports)
- Production builds exclude test files via separate tsconfig.build.json