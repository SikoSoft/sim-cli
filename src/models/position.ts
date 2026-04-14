export interface Position {
  readonly x: number;
  readonly y: number;
}

export const translate = (pos: Position, dx: number, dy: number): Position => ({
  x: pos.x + dx,
  y: pos.y + dy,
});
