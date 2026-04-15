import { Direction } from './direction';
import { Position } from './position';

export interface TableConfig {
  readonly width: number;
  readonly height: number;
}

export interface SimulationState {
  readonly position: Position;
  readonly direction: Direction;
  readonly tableConfig: TableConfig;
}

export type SimulationResult =
  | { readonly success: true;  readonly position: Position }
  | { readonly success: false };

export interface StepResult {
  readonly state: SimulationState;
  readonly done: boolean;
  readonly failed: boolean;
}
