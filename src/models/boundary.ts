import { Position } from "./position";
import { TableConfig } from "./simulation";

/**
 * Defines the contract for checking whether a position is within the table boundary.
 *
 * Implement this interface to support non-rectangular table shapes without
 * changing any simulation logic.
 */
export interface BoundaryChecker {
  isInBounds(position: Position): boolean;
}

export type BoundaryFactory = (config: TableConfig) => BoundaryChecker;
