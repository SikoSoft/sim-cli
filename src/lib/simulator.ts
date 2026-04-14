import { Command } from "../models/command";
import {
  directionDelta,
  Direction,
  rotateClockwise,
  rotateCounterClockwise,
} from "../models/direction";
import { translate } from "../models/position";
import {
  SimulationResult,
  SimulationState,
  TableConfig,
} from "../models/simulation";
import { BoundaryChecker, RectangularTable } from "./table";
import { Position } from "../models/position";

type CommandHandler = (
  state: SimulationState,
  boundary: BoundaryChecker
) => SimulationState;

const moveBy =
  (steps: number): CommandHandler =>
  (state) => {
    const { x, y } = directionDelta(state.direction);
    return {
      ...state,
      position: translate(state.position, x * steps, y * steps),
    };
  };

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

export interface StepResult {
  readonly state: SimulationState;
  readonly done: boolean;
  readonly failed: boolean;
}

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
