import { createInterface } from "readline";
import {
  parseCommand,
  parseStartPosition,
  parseTableConfig,
  ParseError,
  tokenize,
} from "./parser";
import { RectangularTable } from "./table";
import { applyCommand, createInitialState } from "./simulator";
import {
  SimulationResult,
  SimulationState,
  TableConfig,
} from "../models/simulation";

export type OutputFn = (line: string) => void;

const formatResult = (result: SimulationResult): string =>
  result.success ? `${result.position.x} ${result.position.y}` : "-1 -1";

export enum InputPhase {
  AWAITING_TABLE = "awaiting_table",
  AWAITING_POSITION = "awaiting_position",
  RUNNING = "running",
  DONE = "done",
}

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
  private phase: InputPhase = InputPhase.AWAITING_TABLE;
  private headerBuffer: string[] = [];
  private tableConfig?: TableConfig;
  private state?: SimulationState;
  private boundary?: RectangularTable;

  constructor(private readonly output: OutputFn = console.log) {}

  get isDone(): boolean {
    return this.phase === InputPhase.DONE;
  }

  feed(rawLine: string): void {
    for (const token of tokenize(rawLine)) {
      if (this.isDone) {
        return;
      }
      this.processToken(token);
    }
  }

  private processToken(token: string): void {
    switch (this.phase) {
      case InputPhase.AWAITING_TABLE:
        this.headerBuffer.push(token);
        if (this.headerBuffer.length < 2) {
          break;
        }
        this.tableConfig = parseTableConfig(this.headerBuffer.join(" "));
        this.headerBuffer = [];
        this.phase = InputPhase.AWAITING_POSITION;
        break;

      case InputPhase.AWAITING_POSITION: {
        this.headerBuffer.push(token);
        if (this.headerBuffer.length < 2) {
          break;
        }
        const startPosition = parseStartPosition(this.headerBuffer.join(" "));
        this.headerBuffer = [];
        this.boundary = new RectangularTable(this.tableConfig!);
        if (!this.boundary.isInBounds(startPosition)) {
          this.emit({ success: false });
          return;
        }
        this.state = createInitialState(this.tableConfig!, startPosition);
        this.phase = InputPhase.RUNNING;
        break;
      }

      case InputPhase.RUNNING: {
        const command = parseCommand(token);
        if (command === null) {
          return;
        }

        const result = applyCommand(this.state!, command, this.boundary!);

        if (result.failed) {
          this.emit({ success: false });
          return;
        }
        if (result.done) {
          this.emit({ success: true, position: result.state.position });
          return;
        }

        this.state = result.state;
        break;
      }
    }
  }

  finalize(): void {
    if (this.phase === InputPhase.DONE) {
      return;
    }
    if (!this.state) {
      return;
    }
    this.emit({ success: true, position: this.state.position });
  }

  private emit(result: SimulationResult): void {
    this.output(formatResult(result));
    this.phase = InputPhase.DONE;
  }
}

export const handleFatalError = (err: unknown): never => {
  if (err instanceof ParseError) {
    process.stderr.write(`Parse error: ${err.message}\n`);
    process.exit(1);
  }
  process.stderr.write(`Unexpected error: ${String(err)}\n`);
  process.exit(1);
};

export const runFromStdin = (output: OutputFn = console.log): void => {
  const runner = new SimulationRunner(output);
  const rl = createInterface({ input: process.stdin, terminal: false });

  rl.on("line", (line) => {
    try {
      runner.feed(line);
    } catch (err) {
      handleFatalError(err);
    }
  });

  rl.on("close", () => {
    try {
      runner.finalize();
    } catch (err) {
      handleFatalError(err);
    }
  });
};
