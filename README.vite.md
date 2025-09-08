# States & Provinces Educational Game (Vite + TypeScript)

A web-based educational game for primary school students to learn US states and Canadian provinces by their shapes. Now built with modern Vite + TypeScript tooling.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:8000 (or another port if 8000 is busy)
```

## Available Scripts

- `npm run dev` - Start Vite development server with hot reload
- `npm run build` - Build for production (TypeScript compilation + Vite bundling)
- `npm run preview` - Preview production build locally
- `npm run type-check` - Run TypeScript type checking without emitting files
- `npm run lint` - Run ESLint code quality checks
- `npm run lint:fix` - Auto-fix ESLint issues where possible

## Project Structure

```
src/
├── main.ts              # Entry point
├── game/
│   ├── StatesGame.ts    # Main game logic
│   ├── types.ts         # TypeScript interfaces and types
│   └── data.ts          # State/province data and adjacency map
├── audio/
│   ├── RetroSounds.ts   # Web Audio API sound effects
│   └── EdgeyVoice.ts    # Speech synthesis voice feedback
├── styles/
│   └── main.css         # Game styling
└── assets/
    └── Usa_and_Canada_with_names_natural.svg
```

## Technology Stack

- **Vite** - Fast build tool and development server
- **TypeScript** - Type-safe JavaScript with modern features
- **Web Audio API** - Retro-style sound effects
- **Speech Synthesis API** - Voice feedback system
- **SVG** - Interactive map visualization
- **ESLint** - Code quality and consistency

## Development Features

- ⚡ Hot module replacement during development
- 🎯 Full TypeScript type checking
- 📦 Optimized production builds with tree shaking
- 🔍 ESLint integration for code quality
- 📱 Responsive design for various screen sizes

## Game Features

- Multiple difficulty modes (Easy/Hard)
- US States, Canadian Provinces, or Combined gameplay
- Interactive SVG map with visual feedback
- Retro-style audio effects and voice announcements
- Real-time scoring and progress tracking
- Colorized map regions with adjacency-aware coloring

## Build Output

Production build generates:
- Optimized JavaScript bundle (~18KB gzipped)
- Minified CSS (~3KB gzipped) 
- Compressed SVG assets (~98KB gzipped)
- Static HTML with proper asset references