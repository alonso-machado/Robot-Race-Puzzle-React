import React, { useState, useEffect, useRef } from 'react';
import { RobotProps, Position, Grid } from '../types/robotModels';
import { getColorWithOpacity } from '../utils/colors';

const MOVE_DELAY = 250;

const Robot2Component: React.FC<RobotProps> = ({ 
  grid, 
  gridSize, 
  maxMoves, 
  onFinish, 
  stopSignal,
  robotConfig
}) => {
  const { name: robotName, emoji: robotEmoji, color: robotColor, description: robotDescription } = robotConfig;
  const [robotPos, setRobotPos] = useState<Position>([0, 0]);
  // Separate visit count matrix (0 = unvisited, >0 = number of visits)
  const [visitCount, setVisitCount] = useState<number[][]>(() => 
    Array(gridSize).fill(0).map(() => Array(gridSize).fill(0))
  );
  const [moves, setMoves] = useState(1);
  const [isCleaningComplete, setIsCleaningComplete] = useState(false);
  const [blockedCells, setBlockedCells] = useState<Position[]>([]);
  const [totalCleanableCells, setTotalCleanableCells] = useState(0);
  const visitCountRef = useRef<number[][]>([]);

  // Initialize visit count and cleanable cells
  useEffect(() => {
    // Calculate total cleanable cells (non-blocked cells)
    const cleanable = grid.flat().filter(cell => cell !== -1).length;
    setTotalCleanableCells(cleanable);
    
    // Initialize visit count with all zeros
    const initialVisitCount = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));
    initialVisitCount[0][0] = 1; // Mark start position as visited once
    setVisitCount(initialVisitCount);
    visitCountRef.current = initialVisitCount.map(row => [...row]);
    
    // Reset robot position and moves
    setRobotPos([0, 0]);
    setMoves(1);
    setIsCleaningComplete(false);
    setBlockedCells([]);
  }, [grid, gridSize]);

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

    const [x, y] = robotPos;
    
    // Find path to nearest unvisited cell using BFS
    const path = findPathToNearestUnvisited(grid, visitCountRef.current, [x, y]);
    
    if (path.length === 0) {
      // Find all blocked cells around the robot
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
      return;
    }

    // Move to the next cell in the path
    const [nextX, nextY] = path[0];
    
    const timer = setTimeout(() => {
      // Update visit count for the new position
      const newVisitCount = visitCountRef.current.map(row => [...row]);
      newVisitCount[nextX][nextY] += 1;
      setVisitCount(newVisitCount);
      visitCountRef.current = newVisitCount;
      
      // Move the robot
      setRobotPos([nextX, nextY]);
      setMoves(prevMoves => prevMoves + 1);
    }, MOVE_DELAY);
    
    return () => clearTimeout(timer);
  }, [robotPos, moves, isCleaningComplete, totalCleanableCells, grid, maxMoves, stopSignal]);
  
  // Helper function to find the nearest unvisited cell using BFS
  const findPathToNearestUnvisited = (
    grid: Grid,
    visitCount: number[][],
    start: Position
  ): Position[] => {
    const [startX, startY] = start;
    const queue: { pos: Position; path: Position[] }[] = [
      { pos: [startX, startY], path: [[startX, startY]] },
    ];
    const visited = new Set<string>([`${startX},${startY}`]);
    const directions = [
      [-1, 0], // up
      [1, 0],  // down
      [0, -1], // left
      [0, 1],  // right
    ];

    while (queue.length > 0) {
      const { pos, path } = queue.shift()!;
      const [x, y] = pos;

      // If we found an unvisited cell, return the path
      if (visitCount[x][y] === 0) {
        return path.slice(1); // Exclude the starting position
      }

      // Explore neighbors
      for (const [dx, dy] of directions) {
        const nx = x + dx;
        const ny = y + dy;
        const key = `${nx},${ny}`;

        // Check if the neighbor is valid and not visited in BFS
        if (
          nx >= 0 &&
          nx < grid.length &&
          ny >= 0 &&
          ny < grid[0].length &&
          grid[nx][ny] !== -1 &&
          !visited.has(key)
        ) {
          visited.add(key);
          queue.push({
            pos: [nx, ny],
            path: [...path, [nx, ny]],
          });
        }
      }
    }
    return [];
  };

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
      
      const result = {
        cellsVisited: visitCount.flat().filter(count => count > 0).length,
        totalCleanableCells,
        isCleaningComplete: allVisited, // Only true if all non-blocked cells were visited
        moves: moves - 1, // Subtract 1 because we start at move 1
      };
      
      onFinish(result);
    }
  }, [isCleaningComplete, visitCount, totalCleanableCells, moves, onFinish, grid, gridSize, robotName]);

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

export default Robot2Component;
