import { Command, CommandHandler } from "../models/command";
import { directionDelta, Direction } from "../models/direction";
import { translate, Position } from "../models/position";
import {
  SimulationResult,
  SimulationState,
  StepResult,
  TableConfig,
} from "../models/simulation";
import { BoundaryChecker } from "../models/boundary";
import { RectangularTable } from "./table";

const CLOCKWISE_ORDER: readonly Direction[] = [
  Direction.NORTH,
  Direction.EAST,
  Direction.SOUTH,
  Direction.WEST,
];

export const rotateClockwise = (dir: Direction): Direction => {
  const idx = CLOCKWISE_ORDER.indexOf(dir);
  return CLOCKWISE_ORDER[(idx + 1) % 4];
};

export const rotateCounterClockwise = (dir: Direction): Direction => {
  const idx = CLOCKWISE_ORDER.indexOf(dir);
  return CLOCKWISE_ORDER[(idx + 3) % 4];
};

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

  const newState = handler(state, boundary);
  const failed = !boundary.isInBounds(newState.position);
  return { state: newState, done: false, failed };
};

export const createInitialState = (
  tableConfig: TableConfig,
  startPosition: Position
): SimulationState => ({
  position: startPosition,
  direction: Direction.NORTH,
  tableConfig,
});

export const runSimulation = (
  tableConfig: TableConfig,
  startPosition: Position,
  commands: readonly Command[]
): SimulationResult => {
  const boundary = new RectangularTable(tableConfig);

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
