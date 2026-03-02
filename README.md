# States & Provinces Educational Game

A web-based educational game for primary school students to learn US states and Canadian provinces by their shapes.

## Development

```bash
npm install
npm run dev        # dev server at http://localhost:8000
npm run build      # production build
npm run preview    # preview production build
npm test           # run test suite
npm run type-check # TypeScript type checking
npm run lint       # lint check
```

## Game Features

- **Three Modes**: US States only, Canadian Provinces only, or Both
- **Two Difficulty Modes**: Easy (multiple choice) and Hard (type the answer)
- **Interactive Map**: States/provinces are highlighted for each question
- **Audio Feedback**: Retro sound effects and voice feedback
- **Kid-Friendly**: Bright colors, emojis, and simple interface
- **Responsive**: Works on desktop and mobile

## Project Structure

```
src/
  main.ts              - Entry point
  game/StatesGame.ts   - Game logic
  game/data.ts         - State/province data
  audio/               - Sound and voice feedback
  styles/              - CSS
index.html             - Game interface
```

## Troubleshooting

If the map doesn't display:
1. Make sure you're using a web server — run `npm run dev` rather than opening the HTML file directly
2. Check browser console for errors
