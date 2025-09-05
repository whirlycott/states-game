# States & Provinces Educational Game

A web-based educational game for primary school students to learn US states and Canadian provinces by their shapes.

## How to Run

**Important**: This game must be run from a web server (not by double-clicking the HTML file) because it loads the SVG map via JavaScript fetch.

### Option 1: Python HTTP Server (Recommended)
```bash
cd states-game
python3 -m http.server 8000
```
Then open: http://localhost:8000

### Option 2: Any other local web server
- Use Live Server extension in VS Code
- Use `npx serve .` if you have Node.js
- Use any other local web server

## Game Features

- **Three Modes**: US States only, Canadian Provinces only, or Both
- **Interactive Map**: States/provinces are highlighted in red
- **Multiple Choice**: 4 answer choices per question
- **Kid-Friendly**: Bright colors, emojis, and simple interface
- **Responsive**: Works on desktop and mobile

## Files

- `index.html` - Main game interface
- `game.js` - Game logic and functionality
- `styles.css` - Visual styling
- `Usa_and_Canada_with_names_natural.svg` - Interactive map
- `debug.html` - Debug page for troubleshooting

## Troubleshooting

If the map doesn't display:
1. Make sure you're using a web server (not file://)
2. Check browser console for errors
3. Open `debug.html` to see detailed loading information