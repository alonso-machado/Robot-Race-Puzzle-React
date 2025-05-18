import { RobotConfig } from './robotModels';

export const ROBOT_CONFIG: Record<string, RobotConfig> = {
  ROBOT1: {
    name: 'Robot Red (Greedy)',
    emoji: '🤖', // Standard robot
    color: 'red',
    description: 'Greedy algorithm picks the least-visited adjacent cell'
  },
  ROBOT2: {
    name: 'Robot Green (BFS)',
    emoji: '🚗', // Car (BFS explores widely like a car on roads)
    color: 'green',
    description: 'Breadth-First Search explores all neighbors at the current depth'
  },
  ROBOT3: {
    name: 'Robot Blue (A*)',
    emoji: '🚓', // Police car (A* is efficient like emergency response)
    color: 'blue',
    description: 'A* algorithm finds the shortest path using heuristics'
  },
  ROBOT4: {
    name: 'Robot Purple (DFS)',
    emoji: '🏎️', // Racing car (DFS goes deep quickly like a race car)
    color: 'purple',
    description: 'DFS explores as far as possible along each branch before backtracking'
  }
};
