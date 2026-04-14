import { Position } from "../models/position";
import { TableConfig } from "../models/simulation";

export interface BoundaryChecker {
  isInBounds(position: Position): boolean;
}

export class RectangularTable implements BoundaryChecker {
  constructor(private readonly config: TableConfig) {}

  isInBounds({ x, y }: Position): boolean {
    return x >= 0 && x < this.config.width && y >= 0 && y < this.config.height;
  }
}
