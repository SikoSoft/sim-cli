/**
 * Processing phases for the SimulationRunner state machine.
 */
export enum InputPhase {
  AWAITING_TABLE = "awaiting_table",
  AWAITING_POSITION = "awaiting_position",
  RUNNING = "running",
  DONE = "done",
}

/** Function signature for writing a single line of simulation output. */
export type OutputFn = (line: string) => void;
