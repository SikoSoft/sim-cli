import { Position } from "./position";

/**
 * Defines the contract for checking whether a position is within the table boundary.
 *
 * Implement this interface to support non-rectangular table shapes without
 * changing any simulation logic.
 */
export interface BoundaryChecker {
  isInBounds(position: Position): boolean;
}
