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
