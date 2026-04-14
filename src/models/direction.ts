export enum Direction {
  NORTH = "NORTH",
  EAST = "EAST",
  SOUTH = "SOUTH",
  WEST = "WEST",
}

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
