// ABOUTME: Entry point for the States & Provinces educational game
// ABOUTME: Initializes the game and sets up global instance

import { StatesGame } from './game/StatesGame.js';
import './styles/main.css';

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new StatesGame();
    
    // Make game available globally for debugging (optional)
    (window as typeof window & { statesGame: StatesGame }).statesGame = game;
});