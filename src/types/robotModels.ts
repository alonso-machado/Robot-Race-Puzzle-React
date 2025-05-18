export interface RobotConfig {
  name: string;
  emoji: string;
  color: 'red' | 'green' | 'blue' | 'purple';
  description: string;
}

export interface RobotResult {
  cellsVisited: number;
  totalCleanableCells: number;
  isCleaningComplete: boolean;
  moves: number;
}

export interface RobotProps {
  grid: number[][];
  gridSize: number;
  maxMoves: number;
  onFinish: (result: RobotResult) => void;
  stopSignal: boolean;
  robotConfig: RobotConfig;
}

export type Position = [number, number];
export type Grid = number[][];
