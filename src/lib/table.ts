import { BoundaryChecker, BoundaryFactory } from "../models/boundary";
import { Position } from "../models/position";
import { TableConfig } from "../models/simulation";

/** BoundaryChecker implementation for an axis-aligned rectangular table with origin at (0, 0). */
export class RectangularTable implements BoundaryChecker {
  constructor(private readonly config: TableConfig) {}

  /** Returns true if the position falls within [0, width) × [0, height). */
  isInBounds({ x, y }: Position): boolean {
    return x >= 0 && x < this.config.width && y >= 0 && y < this.config.height;
  }
}

/** Default factory that constructs a RectangularTable from a given TableConfig. */
export const defaultBoundaryFactory: BoundaryFactory = config => new RectangularTable(config);
