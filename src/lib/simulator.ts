import { Command, CommandHandler } from "../models/command";
import { directionDelta, Direction } from "../models/direction";
import { translate, Position } from "../models/position";
import {
  SimulationResult,
  SimulationState,
  StepResult,
  TableConfig,
} from "../models/simulation";
import { BoundaryChecker, BoundaryFactory } from "../models/boundary";
import { defaultBoundaryFactory } from "./table";

const CLOCKWISE_ORDER: readonly Direction[] = [
  Direction.NORTH,
  Direction.EAST,
  Direction.SOUTH,
  Direction.WEST,
];

/** Returns the direction 90° clockwise from the given direction. */
export const rotateClockwise = (dir: Direction): Direction => {
  const idx = CLOCKWISE_ORDER.indexOf(dir);
  return CLOCKWISE_ORDER[(idx + 1) % 4];
};

/** Returns the direction 90° counter-clockwise from the given direction. */
export const rotateCounterClockwise = (dir: Direction): Direction => {
  const idx = CLOCKWISE_ORDER.indexOf(dir);
  return CLOCKWISE_ORDER[(idx + 3) % 4];
};

/** Returns a CommandHandler that moves the object `steps` cells in its current facing direction. */
const moveBy =
  (steps: number): CommandHandler =>
  (state) => {
    const { x, y } = directionDelta(state.direction);
    return {
      ...state,
      position: translate(state.position, x * steps, y * steps),
    };
  };

/**
 * Maps every non-quit Command to a pure handler function.
 *
 * Step 2 of adding a new command (step 1 is the Command enum in models/command.ts).
 * Each handler receives the current SimulationState and returns the next one.
 * The bounds check after each move is handled by applyCommand — handlers do not
 * need to validate positions themselves.
 *
 * Note: this map is Partial because QUIT is handled separately in applyCommand.
 * All other Command values must have an entry here or applyCommand silently no-ops.
 */
export const COMMAND_HANDLERS: Partial<Record<Command, CommandHandler>> = {
  [Command.MOVE_FORWARD]: moveBy(1),
  [Command.MOVE_BACKWARD]: moveBy(-1),
  [Command.ROTATE_CLOCKWISE]: (state) => ({
    ...state,
    direction: rotateClockwise(state.direction),
  }),
  [Command.ROTATE_COUNTER_CLOCKWISE]: (state) => ({
    ...state,
    direction: rotateCounterClockwise(state.direction),
  }),
};

/**
 * Applies a single command to the current simulation state.
 * Returns a StepResult indicating whether the run is done, has failed (out of bounds), or continues.
 */
export const applyCommand = (
  state: SimulationState,
  command: Command,
  boundary: BoundaryChecker
): StepResult => {
  if (command === Command.QUIT) {
    return { state, done: true, failed: false };
  }

  const handler = COMMAND_HANDLERS[command];
  if (!handler) {
    return { state, done: false, failed: false };
  }

  const newState = handler(state);
  const failed = !boundary.isInBounds(newState.position);
  return { state: newState, done: false, failed };
};

/** Creates the initial SimulationState for a run, with direction set to NORTH. */
export const createInitialState = (
  tableConfig: TableConfig,
  startPosition: Position
): SimulationState => ({
  position: startPosition,
  direction: Direction.NORTH,
  tableConfig,
});

/**
 * Runs a complete simulation from start position through all commands.
 * Returns success with the final position, or failure if the start position is out of bounds
 * or any move leaves the table.
 */
export const runSimulation = (
  tableConfig: TableConfig,
  startPosition: Position,
  commands: readonly Command[],
  createBoundary: BoundaryFactory = defaultBoundaryFactory
): SimulationResult => {
  const boundary = createBoundary(tableConfig);

  if (!boundary.isInBounds(startPosition)) {
    return { success: false };
  }

  let state = createInitialState(tableConfig, startPosition);

  for (const command of commands) {
    const result = applyCommand(state, command, boundary);
    if (result.failed) {
      return { success: false };
    }
    if (result.done) {
      return { success: true, position: result.state.position };
    }
    state = result.state;
  }

  return { success: true, position: state.position };
};
