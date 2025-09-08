// ABOUTME: Type definitions for the States & Provinces game
// ABOUTME: Interfaces and enums for game state, questions, and configuration

export type GameMode = 'us-easy' | 'us-hard' | 'canada-easy' | 'canada-hard' | 'both-easy' | 'both-hard';
export type Region = 'us' | 'canada' | 'both';
export type Difficulty = 'easy' | 'hard';

export interface Question {
  stateId: string;
  stateName: string;
  region: 'us' | 'canada';
}

export interface GameState {
  currentMode: GameMode | null;
  correctAnswers: number;
  wrongAnswers: number;
  currentQuestion: number;
  questions: Question[];
  gameStarted: boolean;
  difficulty: Difficulty;
}

export interface StateData {
  [key: string]: string;
}

export interface ColorState {
  stateColors: Map<string, string>;
  colorPalette: string[];
}

export interface AnswerState {
  answeredStates: Map<string, 'correct' | 'incorrect'>;
}

export interface SVGState {
  svgElement: SVGSVGElement | null;
  svgLoaded: boolean;
}

export interface ScoreboardData {
  correct: number;
  incorrect: number;
  total: number;
  percentage: number;
}