import { BoundaryChecker } from "./boundary";
import { SimulationState } from "./simulation";

/**
 * Integer commands accepted on stdin.
 *
 * To add a new command:
 *   1. Add a value here (the integer a user will type).
 *   2. Register a handler in COMMAND_HANDLERS in lib/simulator.ts.
 *      TypeScript will produce a compile error until both steps are done.
 */
export enum Command {
  QUIT = 0,
  MOVE_FORWARD = 1,
  MOVE_BACKWARD = 2,
  ROTATE_CLOCKWISE = 3,
  ROTATE_COUNTER_CLOCKWISE = 4,
}

export type CommandHandler = (
  state: SimulationState,
  boundary: BoundaryChecker
) => SimulationState;
