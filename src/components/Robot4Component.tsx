import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RobotProps, RobotResult, Position, Grid } from '../types/robotModels';
import { getColorWithOpacity } from '../utils/colors';

const MOVE_DELAY = 250; // Delay between moves in milliseconds

// Helper: Get all valid neighbors
function getNeighbors(pos: Position, grid: Grid): Position[] {
  const [x, y] = pos;
  const directions: [number, number][] = [
    [0, 1], // right
    [1, 0], // down
    [0, -1], // left
    [-1, 0], // up
  ];

  return directions
    .map(([dx, dy]) => [x + dx, y + dy] as Position)
    .filter(
      ([nx, ny]) =>
        nx >= 0 && nx < grid.length && ny >= 0 && ny < grid[0].length && grid[nx][ny] !== -1
    );
}

// Improved DFS implementation to find the next move
function findNextMove(
  grid: Grid,
  visitCount: Grid,
  start: Position,
  visited: Set<string> = new Set()
): Position[] | null {
  const [startX, startY] = start;
  visited.add(`${startX},${startY}`);

  // If this cell is unvisited, this is our target
  if (visitCount[startX][startY] === 0) {
    return [start];
  }

  // Get unvisited neighbors, sorted by visit count (prefer less visited)
  const neighbors = getNeighbors([startX, startY], grid)
    .filter(([x, y]) => !visited.has(`${x},${y}`))
    .sort((a, b) => {
      const [ax, ay] = a;
      const [bx, by] = b;
      return visitCount[ax][ay] - visitCount[bx][by];
    });

  // Try each neighbor
  for (const [nx, ny] of neighbors) {
    const path = findNextMove(
      grid,
      visitCount,
      [nx, ny],
      new Set(visited) // Pass a new set to avoid mutation
    );
    
    if (path) {
      // If we found a path to an unvisited cell, prepend current position
      return [[startX, startY], ...path];
    }
  }

  
  // If no path found through neighbors, return null
  return null;
}

const Robot4Component: React.FC<RobotProps> = ({ 
  grid, 
  gridSize, 
  maxMoves, 
  onFinish, 
  stopSignal,
  robotConfig
}: RobotProps) => {
  const { name: robotName, emoji: robotEmoji, color: robotColor, description: robotDescription } = robotConfig;
  // Robot state
  const [robotPos, setRobotPos] = useState<Position>([0, 0]);
  const [moves, setMoves] = useState(1);
  const [isCleaningComplete, setIsCleaningComplete] = useState(false);
  const [blockedCells, setBlockedCells] = useState<Position[]>([]);
  const [totalCleanableCells, setTotalCleanableCells] = useState(0);
  
  // Visit tracking
  const [visitCount, setVisitCount] = useState<number[][]>(() => 
    Array(gridSize).fill(0).map(() => Array(gridSize).fill(0))
  );
  const visitCountRef = useRef<number[][]>([]);
  
  // Pathfinding
  const [currentPath, setCurrentPath] = useState<Position[]>([]);

  // Calculate cleanable cells
  const calculateCleanableCells = useCallback((grid: Grid) => {
    return grid.flat().filter(cell => cell !== -1).length;
  }, []);

  // Initialize component
  useEffect(() => {
    const cleanable = calculateCleanableCells(grid);
    setTotalCleanableCells(cleanable);
    
    // Initialize visit count with all zeros
    const initialVisitCount = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));
    initialVisitCount[0][0] = 1; // Mark start position as visited once
    setVisitCount(initialVisitCount);
    visitCountRef.current = initialVisitCount.map(row => [...row]);
    
    // Reset robot state
    setRobotPos([0, 0]);
    setMoves(1);
    setIsCleaningComplete(false);
    setBlockedCells([]);
    setCurrentPath([]);
  }, [grid, gridSize, calculateCleanableCells]);

  // Main movement logic
  useEffect(() => {
    if (isCleaningComplete || stopSignal) return;

    // Check if we've reached max moves
    if (moves >= maxMoves) {
      setIsCleaningComplete(true);
      return;
    }

    // Check if all non-blocked cells have been visited at least once
    let allVisited = true;
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        // If cell is not blocked and hasn't been visited
        if (grid[i][j] !== -1 && visitCountRef.current[i][j] === 0) {
          allVisited = false;
          break;
        }
      }
      if (!allVisited) break;
    }
    
    if (allVisited) {
      setIsCleaningComplete(true);
      return;
    }

    // If we have a current path, follow it
    if (currentPath.length > 0) {
      const [nextX, nextY] = currentPath[0];
      const newPath = currentPath.slice(1);
      
      const timer = setTimeout(() => {
        // Update visit count for the new position
        const newVisitCount = visitCountRef.current.map(row => [...row]);
        newVisitCount[nextX][nextY] += 1;
        setVisitCount(newVisitCount);
        visitCountRef.current = newVisitCount;
        
        // Move the robot
        setRobotPos([nextX, nextY]);
        setMoves(prev => prev + 1);
        setCurrentPath(newPath);
      }, MOVE_DELAY);
      
      return () => clearTimeout(timer);
    }
    
    // If we don't have a path, find a new one using DFS
    const path = findNextMove(
      grid, 
      visitCountRef.current, 
      robotPos
    );

    if (!path || path.length < 2) {
      // No path found to unvisited cell, check if we're done
      let allVisited = true;
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          if (grid[i][j] !== -1 && visitCountRef.current[i][j] === 0) {
            allVisited = false;
            break;
          }
        }
        if (!allVisited) break;
      }
      
      if (allVisited) {
        // All cells have been visited
        setIsCleaningComplete(true);
      } else {
        // Find all blocked cells around the robot
        const [x, y] = robotPos;
        const blocked = [
          [-1, 0], [1, 0], [0, -1], [0, 1]
        ]
          .map(([dx, dy]) => [x + dx, y + dy] as Position)
          .filter(([nx, ny]) => 
            nx >= 0 && nx < grid.length && 
            ny >= 0 && ny < grid[0].length && 
            grid[nx][ny] === -1
          );
        setBlockedCells(blocked);
        setIsCleaningComplete(true);
      }
      return;
    }
    
    // Remove the first position (current position) and set the rest as the path
    setCurrentPath(path.slice(1));
  }, [robotPos, currentPath, isCleaningComplete, totalCleanableCells, grid, maxMoves, stopSignal, moves]);

  // Report results when cleaning is complete
  useEffect(() => {
    if (isCleaningComplete) {
      // Double-check that all non-blocked cells were actually visited
      let allVisited = true;
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          if (grid[i][j] !== -1 && visitCount[i][j] === 0) {
            allVisited = false;
            break;
          }
        }
        if (!allVisited) break;
      }
      
      const result: RobotResult = {
        cellsVisited: visitCount.flat().filter((count: number) => count > 0).length,
        totalCleanableCells,
        isCleaningComplete: allVisited, // Only true if all non-blocked cells were visited
        moves: moves - 1, // Subtract 1 because we start at move 1
      };
      
      onFinish(result);
    }
  }, [isCleaningComplete, visitCount, totalCleanableCells, moves, onFinish, grid, gridSize, robotName]);
  
  // Handle stop signal
  useEffect(() => {
    if (stopSignal) {
      const cellsVisited = visitCount.flat().filter((count: number) => count > 0).length;
      onFinish({
        cellsVisited,
        totalCleanableCells,
        isCleaningComplete: false,
        moves: moves - 1
      });
    }
  }, [stopSignal, visitCount, totalCleanableCells, moves, onFinish]);

  // Using shared getColorWithOpacity from utils/colors

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold" style={{ color: robotColor }}>
          {robotEmoji} {robotName}
        </h3>
        <div className="text-base font-medium">
          Moves: {moves}/{maxMoves}
          <span className={`ml-2 ${isCleaningComplete ? 'text-green-600' : 'text-blue-600'}`}>
            • {isCleaningComplete ? 'Completed' : 'In Progress'}
          </span>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">{robotDescription}</p>
      {blockedCells.length > 0 && !isCleaningComplete && (
        <div className="text-sm text-red-600 mb-2">
          Blocked at: {blockedCells.map(([x, y]) => `(${x},${y})`).join(', ')}
        </div>
      )}
      
      <div id="grid" className="grid gap-1 bg-gray-100 p-2 rounded-md" 
           style={{
             gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
             maxWidth: '100%',
             margin: '0 auto',
             display: 'grid'
           }}>
        {grid.map((row, i) =>
          row.map((cell, j) => (
            <div
              key={`${i}-${j}`}
              className="w-full aspect-square flex items-center justify-center text-xl font-medium
                border border-gray-200 rounded"
              style={{
                backgroundColor: cell === -1 
                  ? '#e5e7eb' 
                  : visitCount[i][j] > 0 
                    ? getColorWithOpacity(robotColor, 0.3)
                    : 'white'
              }}
            >
              {i === robotPos[0] && j === robotPos[1] ? (
                <span className="text-2xl">{robotEmoji}</span>
              ) : cell === -1 ? (
                <span className="text-2xl">🧱</span>
              ) : (
                <span className="text-gray-800 font-bold">
                  {visitCount[i][j] || 0}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Robot4Component;
