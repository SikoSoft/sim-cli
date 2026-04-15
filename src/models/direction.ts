export enum Direction {
  NORTH = "NORTH",
  EAST = "EAST",
  SOUTH = "SOUTH",
  WEST = "WEST",
}

export interface Delta {
  readonly x: number;
  readonly y: number;
}

const DIRECTION_DELTAS: Record<Direction, Delta> = {
  [Direction.NORTH]: { x: 0, y: -1 },
  [Direction.EAST]: { x: 1, y: 0 },
  [Direction.SOUTH]: { x: 0, y: 1 },
  [Direction.WEST]: { x: -1, y: 0 },
};

export const directionDelta = (dir: Direction): Delta => DIRECTION_DELTAS[dir];
