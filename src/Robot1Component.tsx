import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RobotProps, Position } from './types/robot';

const MOVE_DELAY = 250;

const Robot1Component: React.FC<RobotProps> = ({ 
  grid, 
  gridSize, 
  maxMoves, 
  onFinish, 
  stopSignal,
  robotName,
  robotEmoji,
  robotColor,
  robotDescription
}: RobotProps) => {
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
    const cleanable = grid.flat().filter((cell: number) => cell !== -1).length;
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

  // Movement effect
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
    const directions = [
      [-1, 0], // up
      [1, 0],  // down
      [0, -1], // left
      [0, 1]   // right
    ];

    // Find all valid neighbors (not blocked and within grid)
    const validNeighbors = directions
      .map(([dx, dy]) => ({
        x: x + dx,
        y: y + dy,
        valid: x + dx >= 0 && x + dx < gridSize && 
               y + dy >= 0 && y + dy < gridSize && 
               grid[x + dx][y + dy] !== -1
      }))
      .filter(n => n.valid)
      .map(n => ({
        ...n,
        visits: visitCountRef.current[n.x][n.y] || 0
      }))
      .sort((a, b) => a.visits - b.visits);

    // If no valid moves, we're blocked
    if (validNeighbors.length === 0) {
      const blocked = directions
        .map(([dx, dy]) => [x + dx, y + dy] as Position)
        .filter(([nx, ny]) => 
          nx >= 0 && nx < gridSize && 
          ny >= 0 && ny < gridSize && 
          grid[nx][ny] === -1
        );
      setBlockedCells(blocked);
      setIsCleaningComplete(true);
      return;
    }

    // Move to the least visited valid neighbor
    const next = validNeighbors[0];
    
    const timer = setTimeout(() => {
      moveRobot(next);
    }, MOVE_DELAY);

    return () => clearTimeout(timer);
  }, [robotPos, moves, isCleaningComplete, totalCleanableCells, grid, gridSize]);

  const moveRobot = (next: { x: number; y: number }) => {
    // Update visit count for the new position
    const newVisitCount = visitCountRef.current.map(row => [...row]);
    newVisitCount[next.x][next.y]++;
    setVisitCount(newVisitCount);
    visitCountRef.current = newVisitCount;
    
    // Move robot
    setRobotPos([next.x, next.y]);
    setMoves(prev => prev + 1);
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
  }, [isCleaningComplete, visitCount, totalCleanableCells, moves, onFinish, grid, gridSize]);

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
        }}
      >
        <AnimatePresence>
          {grid.map((row, i) =>
            row.map((cell, j) => (
              <motion.div
                key={`${i}-${j}`}
                className="w-full aspect-square flex items-center justify-center text-xl font-medium
                  border border-gray-200 rounded relative"
                style={{
                  backgroundColor: cell === -1 
                    ? '#e5e7eb' 
                    : visitCount[i][j] > 0 
                      ? getColorWithOpacity(robotColor, 0.3)
                      : 'white'
                }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {i === robotPos[0] && j === robotPos[1] ? (
                  <motion.span
                    key="robot"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="text-2xl"
                  >
                    {robotEmoji}
                  </motion.span>
                ) : cell === -1 ? (
                  <span className="text-2xl">🧱</span>
                ) : (
                  <motion.span
                    key={`count-${i}-${j}`}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    className="text-gray-800 font-bold"
                  >
                    {visitCount[i][j] || 0}
                  </motion.span>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Robot1Component;
