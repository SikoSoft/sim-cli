import { createInterface } from "readline";
import {
  parseCommand,
  parseStartPosition,
  parseTableConfig,
  tokenize,
} from "./parser";
import { defaultBoundaryFactory } from "./table";
import { applyCommand, createInitialState } from "./simulator";
import { InputPhase, OutputFn } from "../models/io";
import {
  SimulationResult,
  SimulationState,
  TableConfig,
} from "../models/simulation";
import { BoundaryChecker, BoundaryFactory } from "../models/boundary";
import { ParseError } from "./error";

/** Formats a SimulationResult as "x y" on success or "-1 -1" on failure. */
const formatResult = (result: SimulationResult): string =>
  result.success ? `${result.position.x} ${result.position.y}` : "-1 -1";

type RunnerState =
  | { readonly phase: InputPhase.AWAITING_TABLE; readonly buffer: string[] }
  | {
      readonly phase: InputPhase.AWAITING_POSITION;
      readonly tableConfig: TableConfig;
      readonly buffer: string[];
    }
  | {
      readonly phase: InputPhase.RUNNING;
      readonly simState: SimulationState;
      readonly boundary: BoundaryChecker;
    }
  | { readonly phase: InputPhase.DONE };

/**
 * Stateful simulation runner that processes stdin as a token stream.
 *
 * Input is tokenised on each feed() call (whitespace and commas are
 * treated as delimiters), so tokens may arrive on the same line or
 * across multiple lines in any combination:
 *
 *   "4 4\n2 2\n1\n0"          ← one token per line
 *   "4,4,2,2,1,0"             ← comma-separated, single line
 *   "4 4 2 2\n1 4 1 3 2 0"    ← multiple tokens per line
 *
 * The header requires exactly 4 tokens (width, height, x, y) before
 * commands are accepted.
 */
export class SimulationRunner {
  private runnerState: RunnerState = {
    phase: InputPhase.AWAITING_TABLE,
    buffer: [],
  };

  constructor(
    private readonly output: OutputFn = console.log,
    private readonly createBoundary: BoundaryFactory = defaultBoundaryFactory
  ) {}

  /** Returns true once the runner has emitted its result and will ignore further input. */
  get isDone(): boolean {
    return this.runnerState.phase === InputPhase.DONE;
  }

  /** Tokenises a raw input line and drives each token through the state machine. */
  feed(rawLine: string): void {
    for (const token of tokenize(rawLine)) {
      if (this.isDone) {
        return;
      }
      this.processToken(token);
    }
  }

  /** Advances the state machine by one token, transitioning phases and emitting output as appropriate. */
  private processToken(token: string): void {
    switch (this.runnerState.phase) {
      case InputPhase.AWAITING_TABLE: {
        this.runnerState.buffer.push(token);
        if (this.runnerState.buffer.length < 2) break;
        const tableConfig = parseTableConfig(this.runnerState.buffer.join(" "));
        this.runnerState = {
          phase: InputPhase.AWAITING_POSITION,
          tableConfig,
          buffer: [],
        };
        break;
      }

      case InputPhase.AWAITING_POSITION: {
        this.runnerState.buffer.push(token);
        if (this.runnerState.buffer.length < 2) break;
        const { tableConfig } = this.runnerState;
        const startPosition = parseStartPosition(
          this.runnerState.buffer.join(" ")
        );
        const boundary = this.createBoundary(tableConfig);
        if (!boundary.isInBounds(startPosition)) {
          this.emit({ success: false });
          return;
        }
        this.runnerState = {
          phase: InputPhase.RUNNING,
          simState: createInitialState(tableConfig, startPosition),
          boundary,
        };
        break;
      }

      case InputPhase.RUNNING: {
        const command = parseCommand(token);
        if (command === null) return;
        const { simState, boundary } = this.runnerState;
        const result = applyCommand(simState, command, boundary);
        if (result.failed) {
          this.emit({ success: false });
          return;
        }
        if (result.done) {
          this.emit({ success: true, position: result.state.position });
          return;
        }
        this.runnerState = {
          phase: InputPhase.RUNNING,
          simState: result.state,
          boundary,
        };
        break;
      }
    }
  }

  /**
   * Called when the input stream closes. Emits the current position as a success result
   * if the simulation was running but never received a QUIT command.
   */
  finalize(): void {
    if (this.runnerState.phase === InputPhase.DONE) return;
    if (this.runnerState.phase !== InputPhase.RUNNING) return;
    this.emit({ success: true, position: this.runnerState.simState.position });
  }

  /** Writes the formatted result to output and transitions the runner to the DONE phase. */
  private emit(result: SimulationResult): void {
    this.output(formatResult(result));
    this.runnerState = { phase: InputPhase.DONE };
  }
}

/**
 * Writes a parse or unexpected error to stderr and exits with code 1.
 * Typed as `never` so callers can use it in positions that require a value.
 */
export const handleFatalError = (err: unknown): never => {
  if (err instanceof ParseError) {
    process.stderr.write(`Parse error: ${err.message}\n`);
    process.exit(1);
  }
  process.stderr.write(`Unexpected error: ${String(err)}\n`);
  process.exit(1);
};

/**
 * Wires a readline interface to a SimulationRunner, feeding lines as they arrive
 * and calling finalize() when the stream closes.
 */
export const runFromStdin = (output: OutputFn = console.log): void => {
  const runner = new SimulationRunner(output);
  const lineReader = createInterface({ input: process.stdin, terminal: false });

  lineReader.on("line", (line) => {
    try {
      runner.feed(line);
    } catch (err) {
      handleFatalError(err);
    }
  });

  lineReader.on("close", () => {
    try {
      runner.finalize();
    } catch (err) {
      handleFatalError(err);
    }
  });
};
