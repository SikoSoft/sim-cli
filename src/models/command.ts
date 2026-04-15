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

const VALID_COMMAND_VALUES = new Set<number>(
  (Object.values(Command) as Array<string | number>).filter(
    (v): v is number => typeof v === "number"
  )
);

export const toCommand = (value: number): Command | null =>
  VALID_COMMAND_VALUES.has(value) ? (value as Command) : null;
