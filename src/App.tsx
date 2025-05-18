import { useState } from 'react';
import Robot1Component from './Robot1Component';
import Robot2Component from './Robot2Component';
import Robot3Component from './Robot3Component';
import Robot4Component from './Robot4Component';
import { RobotResult, RobotConfig } from './types/robot';

type Grid = number[][];

// Robot configurations
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

// Game constants
const defaultGridSize = 8;
const defaultMaxMoves = 200;
const maxAllowedGridSize = 20;
const maxAllowedMoves = 1000;
const MIN_OBSTACLE_CHANCE = 0.1; // 10%
const MAX_OBSTACLE_CHANCE = 0.3; // 30%
const DEFAULT_OBSTACLE_CHANCE = 0.15; // 15%

// Generates a grid with random obstacles, always ensures center is open
// DO NOT CHANGE this generateGrid algorithm it was the only part written by the creator
const generateGrid = (gridSizeLocal: number, obstacleProbability: number): Grid => {
  console.log(
    `Generating new grid with size: ${gridSizeLocal}, obstacle chance: ${obstacleProbability * 100}%`
  );
  const newGrid = Array(gridSizeLocal)
    .fill(0)
    .map(() => Array(gridSizeLocal).fill(0));
  for (let i = 0; i < gridSizeLocal; i++) {
    for (let j = 0; j < gridSizeLocal; j++) {
      if (i === 0 && j === 0) continue;
      if (Math.random() < obstacleProbability) {
        newGrid[i][j] = -1;
      }
    }
  }
  console.table(newGrid.map((row) => row.map((cell) => (cell === -1 ? '🧱' : '-'))));
  return newGrid;
};



const App: React.FC = () => {
  const [gridSize, setGridSize] = useState(defaultGridSize);
  const [maxMoves, setMaxMoves] = useState(defaultMaxMoves);
  const [obstacleChance, setObstacleChance] = useState(DEFAULT_OBSTACLE_CHANCE);
  const [grid, setGrid] = useState<Grid | null>(null);
  const [raceStarted, setRaceStarted] = useState(false);
  const [robot1Result, setRobot1Result] = useState<RobotResult | null>(null);
  const [robot2Result, setRobot2Result] = useState<RobotResult | null>(null);
  const [robot3Result, setRobot3Result] = useState<RobotResult | null>(null);
  const [robot4Result, setRobot4Result] = useState<RobotResult | null>(null);

  const startRace = () => {
    console.log(
      'Starting race with grid size:',
      gridSize,
      'max moves:',
      maxMoves,
      'obstacle chance:',
      obstacleChance
    );
    const newGrid = generateGrid(gridSize, obstacleChance);
    setGrid(newGrid);
    setRaceStarted(true);
    setRobot1Result(null);
    setRobot2Result(null);
    setRobot3Result(null);
    setRobot4Result(null);
  };

  let winner = '';
  if (robot1Result && robot2Result && robot3Result && robot4Result) {
    // Define all robots with their results and emojis
    const robots = [
      { name: ROBOT_CONFIG.ROBOT1.name, emoji: ROBOT_CONFIG.ROBOT1.emoji, result: robot1Result },
      { name: ROBOT_CONFIG.ROBOT2.name, emoji: ROBOT_CONFIG.ROBOT2.emoji, result: robot2Result },
      { name: ROBOT_CONFIG.ROBOT3.name, emoji: ROBOT_CONFIG.ROBOT3.emoji, result: robot3Result },
      { name: ROBOT_CONFIG.ROBOT4.name, emoji: ROBOT_CONFIG.ROBOT4.emoji, result: robot4Result },
    ];
    
    // Filter robots that completed the race (visited all possible cells)
    const completedRobots = robots.filter(r => r.result?.isCleaningComplete);
    
    if (completedRobots.length > 0) {
      // Sort completed robots by number of moves (ascending)
      const sortedByMoves = [...completedRobots].sort(
        (a, b) => (a.result?.moves || 0) - (b.result?.moves || 0)
      );
      
      // Get the best score (lowest number of moves)
      const bestScore = sortedByMoves[0].result.moves;
      // Find all robots with the best score
      const winners = sortedByMoves.filter(r => r.result.moves === bestScore);
      
      // Format the winner(s) message
      if (winners.length === 1) {
        winner = `${winners[0].name} wins with ${bestScore} moves! 🏆`;
      } else {
        const winnerNames = winners.map(w => w.name).join(', ');
        const lastComma = winnerNames.lastIndexOf(',');
        const formattedNames = lastComma !== -1 
          ? winnerNames.substring(0, lastComma) + ' and' + winnerNames.substring(lastComma + 1)
          : winnerNames;
        winner = `It's a tie between ${formattedNames} with ${bestScore} moves each! 🏆`;
      }
    } else {
      // No robots completed the race (didn't visit all cells)
      const robotsWithMoves = robots.filter(r => r.result && r.result.moves > 0);
      
      if (robotsWithMoves.length > 0) {
        // Some robots moved but didn't complete
        const allRobots = robotsWithMoves.map(r => r.name).join(', ');
        const lastComma = allRobots.lastIndexOf(',');
        const formattedNames = lastComma !== -1 
          ? allRobots.substring(0, lastComma) + ' and' + allRobots.substring(lastComma + 1)
          : allRobots;
        winner = `No winner - ${formattedNames} did not visit all cells!`;
      } else {
        // No robots moved at all
        winner = `No winner - no robots made any moves!`;
      }
    }
  }

  return (
    <div className="w-100 h-100 flex bg-gray-100 p-4 display-flex flex-col items-center">
      {/* Header Section */}
      <header className="mb-8 w-full max-w-6xl">
        <div className="flex flex-row items-center justify-between gap-6">
          <h1 className="text-3xl font-bold whitespace-nowrap">🤖 Robot Race!</h1>

          <div className="flex-1 flex flex-row items-center justify-center gap-4">
            {raceStarted && (
              <>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700 transition-colors whitespace-nowrap"
                  onClick={() => setRaceStarted(false)}
                >
                  Stop Race
                </button>
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 transition-colors whitespace-nowrap"
                  onClick={() => {
                    setRaceStarted(false);
                    setGrid(null);
                    setRobot1Result(null);
                    setRobot2Result(null);
                    setRobot3Result(null);
                    setRobot4Result(null);
                  }}
                >
                  New Race
                </button>
              </>
            )}
          </div>

          <div className="min-w-[200px] text-right">
            {winner && (
              <div className="text-2xl font-bold text-green-700 whitespace-nowrap">
                🏆 {winner} 🏆
              </div>
            )}
          </div>
        </div>
        <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center flex-wrap">
            <label className="flex flex-col font-semibold">
              Grid Size
              <input
                type="number"
                min={4}
                max={maxAllowedGridSize}
                value={gridSize}
                onChange={(e) =>
                  setGridSize(Math.max(4, Math.min(maxAllowedGridSize, Number(e.target.value))))
                }
                className="mt-1 border px-2 py-1 rounded w-24 text-center"
                disabled={raceStarted}
              />
            </label>
            <label className="flex flex-col font-semibold">
              Max Moves
              <input
                type="number"
                min={10}
                max={maxAllowedMoves}
                value={maxMoves}
                onChange={(e) =>
                  setMaxMoves(Math.max(10, Math.min(maxAllowedMoves, Number(e.target.value))))
                }
                className="mt-1 border px-2 py-1 rounded w-24 text-center"
                disabled={raceStarted}
              />
            </label>
            <label className="flex flex-col font-semibold w-48">
              Obstacle Chance: {Math.round(obstacleChance * 100)}%
              <input
                type="range"
                min={MIN_OBSTACLE_CHANCE * 100}
                max={MAX_OBSTACLE_CHANCE * 100}
                step={5}
                value={obstacleChance * 100}
                onChange={(e) => setObstacleChance(Number(e.target.value) / 100)}
                className="mt-1 w-full"
                disabled={raceStarted}
              />
            </label>
            <button
              className="mt-4 sm:mt-0 px-4 py-2 bg-blue-600 text-white rounded font-bold"
              onClick={startRace}
              disabled={raceStarted}
            >
              START RACE
            </button>
          </div>
        </div>
      </header>

      {raceStarted && grid && grid.length > 0 && grid[0].length > 0 && (
        <div id="race-container" className="flex flex-1 flex-col w-full p-4">
          {/* Robot 1 */}
            <Robot1Component
              grid={grid}
              gridSize={gridSize}
              maxMoves={maxMoves}
              onFinish={setRobot1Result}
              stopSignal={!raceStarted}
              robotName={ROBOT_CONFIG.ROBOT1.name}
              robotEmoji={ROBOT_CONFIG.ROBOT1.emoji}
              robotColor={ROBOT_CONFIG.ROBOT1.color}
              robotDescription={ROBOT_CONFIG.ROBOT1.description}
            />
            <Robot2Component
              grid={grid}
              gridSize={gridSize}
              maxMoves={maxMoves}
              onFinish={setRobot2Result}
              stopSignal={!raceStarted}
              robotName={ROBOT_CONFIG.ROBOT2.name}
              robotEmoji={ROBOT_CONFIG.ROBOT2.emoji}
              robotColor={ROBOT_CONFIG.ROBOT2.color}
              robotDescription={ROBOT_CONFIG.ROBOT2.description}
            />
            <Robot3Component
              grid={grid}
              gridSize={gridSize}
              maxMoves={maxMoves}
              onFinish={setRobot3Result}
              stopSignal={!raceStarted}
              robotName={ROBOT_CONFIG.ROBOT3.name}
              robotEmoji={ROBOT_CONFIG.ROBOT3.emoji}
              robotColor={ROBOT_CONFIG.ROBOT3.color}
              robotDescription={ROBOT_CONFIG.ROBOT3.description}
            />
            <Robot4Component
              grid={grid}
              gridSize={gridSize}
              maxMoves={maxMoves}
              onFinish={setRobot4Result}
              stopSignal={!raceStarted}
              robotName={ROBOT_CONFIG.ROBOT4.name}
              robotEmoji={ROBOT_CONFIG.ROBOT4.emoji}
              robotColor={ROBOT_CONFIG.ROBOT4.color}
              robotDescription={ROBOT_CONFIG.ROBOT4.description}
            />
        </div>
      )}
    </div>
  );
};

export default App;
