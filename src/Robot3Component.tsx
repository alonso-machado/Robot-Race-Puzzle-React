import { useState, useEffect, useRef, useCallback } from 'react';
import { RobotProps, RobotResult, Position, Grid } from './types/robot';

const MOVE_DELAY = 250; // Delay between moves in milliseconds

// Heuristic function for A* (Manhattan distance)
const calculateHeuristic = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
};

// A* algorithm to find the shortest path to the nearest unvisited cell
const findPathToNearestUnvisited = (
  grid: Grid,
  visitCount: number[][],
  start: Position
): Position[] => {
  const [startX, startY] = start;
  
  // Priority queue (min-heap) based on fScore
  const openSet: { pos: Position; fScore: number }[] = [];
  const cameFrom: Record<string, Position> = {};
  
  // gScore[node] = cost of the cheapest path from start to node
  const gScore: Record<string, number> = {};
  
  // fScore[node] = gScore[node] + h(node)
  const fScore: Record<string, number> = {};
  
  // Initialize scores
  const startKey = `${startX},${startY}`;
  gScore[startKey] = 0;
  fScore[startKey] = calculateHeuristic(startX, startY, 0, 0);
  openSet.push({ pos: [startX, startY], fScore: fScore[startKey] });
  
  // Track visited nodes
  const visited = new Set<string>();
  
  // Directions: up, down, left, right
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  
  // First, try to find any unvisited cell
  while (openSet.length > 0) {
    // Get node with lowest fScore
    openSet.sort((a, b) => a.fScore - b.fScore);
    const current = openSet.shift()!;
    const [currentX, currentY] = current.pos;
    const currentKey = `${currentX},${currentY}`;
    
    // If we found an unvisited cell, reconstruct and return the path
    if (visitCount[currentX][currentY] === 0) {
      const path: Position[] = [];
      let currentPos: Position = [currentX, currentY];
      
      while (cameFrom[`${currentPos[0]},${currentPos[1]}`]) {
        path.unshift(currentPos);
        currentPos = cameFrom[`${currentPos[0]},${currentPos[1]}`];
      }
      
      return path;
    }
    
    // Mark as visited
    visited.add(currentKey);
    
    // Explore neighbors
    for (const [dx, dy] of directions) {
      const nx = currentX + dx;
      const ny = currentY + dy;
      const neighborKey = `${nx},${ny}`;
      
      // Check if neighbor is valid and not blocked
      if (
        nx < 0 ||
        nx >= grid.length ||
        ny < 0 ||
        ny >= grid[0].length ||
        grid[nx][ny] === -1 ||
        visited.has(neighborKey)
      ) {
        continue;
      }
      
      // Calculate tentative gScore (lower is better)
      // We add a small penalty for visited cells to encourage exploration
      const visitPenalty = visitCount[nx][ny] * 0.1; // Small penalty for visited cells
      const tentativeGScore = (gScore[currentKey] || 0) + 1 + visitPenalty;
      
      // If this path to neighbor is better than any previous one
      if (gScore[neighborKey] === undefined || tentativeGScore < gScore[neighborKey]) {
        // Record the best path
        cameFrom[neighborKey] = [currentX, currentY];
        gScore[neighborKey] = tentativeGScore;
        
        // Calculate fScore = gScore + h(n)
        fScore[neighborKey] = gScore[neighborKey] + calculateHeuristic(nx, ny, 0, 0);
        
        // Add to open set if not already there
        if (!openSet.some((item) => item.pos[0] === nx && item.pos[1] === ny)) {
          openSet.push({ pos: [nx, ny], fScore: fScore[neighborKey] });
        }
      }
    }
  }
  
  // No unvisited cell found, return empty path
  return [];
};

const Robot3Component: React.FC<RobotProps> = ({
  grid,
  gridSize,
  maxMoves,
  onFinish,
  stopSignal,
  robotName,
  robotEmoji,
  robotColor,
  robotDescription
}) => {
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

  // Calculate total cleanable cells
  useEffect(() => {
    const cleanable = grid.flat().filter((cell) => cell !== -1).length;
    setTotalCleanableCells(cleanable);
  }, [grid]);

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
    
    // If we don't have a path, find a new one using A*
    const path = findPathToNearestUnvisited(grid, visitCountRef.current, robotPos);

    if (path.length === 0) {
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
      return;
    }
    
    // Set the new path (excluding the first step which is the current position)
    setCurrentPath(path);
  }, [robotPos, currentPath, isCleaningComplete, totalCleanableCells, grid, maxMoves, stopSignal, moves]);
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
        cellsVisited: visitCount.flat().filter(count => count > 0).length,
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

  // Helper function to get color with opacity
  const getColorWithOpacity = (color: string, opacity: number) => {
    const colors: Record<string, string> = {
      red: `rgba(252, 165, 165, ${opacity})`,
      green: `rgba(134, 239, 172, ${opacity})`,
      blue: `rgba(147, 197, 253, ${opacity})`,
      purple: `rgba(216, 180, 254, ${opacity})`
    };
    return colors[color] || color;
  };

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
      
      <div className="grid gap-1 bg-gray-100 p-2 rounded-md" 
           style={{
             gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
             maxWidth: '100%',
             margin: '0 auto'
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

export default Robot3Component;
