# Robot Race Puzzle with React 19

A React application that visualizes a robot cleaning a room using various algorithms.

## Project Name: Robot Race Puzzle
* Use React 19 with Tailwind V4 with Vite and Typescript
* Use Framer Motion for animations

### Instruction Rules
* The Robot should start at (0,0) position.
* The Robot should move to the least visited cell that is not Blocked. (UP, DOWN, LEFT, RIGHT) every 250 milliseconds
* Update the counter for that CELL only if the ROBOT PASSED THERE NOW otherwise stay at previous value!
* The Robot should try to visit all the possible cells in a GRID of size X that will be provided by the user.
* If the Robot was not able to visit all cells after MAX_MOVES moves, the robot should stop.
* If the Robot fails and stops, he should print on screen the coordinates of what cells he was blocked in a list to verify if it was impossible path!
* There should be a STOP button to stop the RACE PUZZLE at any time!
* The default value for Grid Size is 8 and Max Moves is 200 and Obstacle Chance is 0.2
* The user should be able to change the Grid Size, Max Moves and Obstacle Chance
* The max allowed grid size is 12 and lowest is 5 and max allowed moves is 500

* Extra: Create Robots with the same rules and let them race each other to see who visits more cells! (State of the visits should be separated by Robot)
* The UI should show both robots inside of their own GRID competing with each other! They could even have different colors and algorithms!
* The Winner or Winners are the Robots with less moves to visit ALL possible cells! (No other winner rules must be applied there is just this TIE for winner)

## Features

- Built with React 19
- TypeScript support
- Tailwind CSS v4 for styling
- Vite for fast development and building
- Framer Motion for animations

## Prerequisites

- Node.js 20+ (LTS recommended)
- pnpm 8+

## Getting Started

1. **Install pnpm** (if you haven't already):
   ```bash
   npm install -g pnpm
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Start the development server**:
   ```bash
   pnpm dev
   ```
   The app will be available at `http://localhost:3000`

4. **Build for production**:
   ```bash
   pnpm build
   pnpm preview
   ```

## Project Structure

- `/src` - Source files
  - `/components` - React components
  - `/styles` - Global styles
  - `main.tsx` - Application entry point
  - `App.tsx` - Root component
- `/public` - Static assets
- `vite.config.ts` - Vite configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration

## Technologies Used

- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)

## License

MIT
