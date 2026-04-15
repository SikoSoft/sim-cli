# sim-cli

A CLI tool that simulates an object moving on a table (currently, a rectangle is supported). The object starts facing North. Commands are read from stdin and the final position is written to stdout. If any move would push the object off the table, the simulation fails immediately.

---

## Running

### Prerequisites

Install dependencies and build the Javascript.

```bash
npm install
npm run build
```

### Pipe from a file or echo

```bash
# One value per line
echo -e "4 4\n2 2\n1\n4\n1\n3\n2\n3\n2\n4\n1\n0" | node dist/index.js
# → 0 1

# Comma-separated on one line
echo "4,4,2,2,1,4,1,3,2,3,2,4,1,0" | node dist/index.js
# → 0 1

# From a file
node dist/index.js < input.txt
# → 0 0
```

### Interactive (manual stdin)

```bash
node dist/index.js
4 4       # table width height
2 2       # start x y
1         # move forward
0         # quit
^D        # EOF if no quit command was sent
```

### Build + run in one step

```bash
npm run cli
```

---

## Input protocol

Input is a flat token stream. Tokens are separated by any combination of whitespace and commas, and may be spread across lines in any way:

```
<width> <height>    ← table dimensions (two positive integers)
<x> <y>             ← starting position (two integers)
<cmd> <cmd> ...     ← zero or more command integers, terminated by 0
```

All of the following are equivalent:

```
4 4          4,4,2,2,1,0         4 4 2 2 1 0
2 2
1
0
```

### Commands

| Integer | Action                        |
| ------- | ----------------------------- |
| `0`     | Quit — output result and stop |
| `1`     | Move forward one step         |
| `2`     | Move backward one step        |
| `3`     | Rotate clockwise 90°          |
| `4`     | Rotate counter-clockwise 90°  |

Unrecognised integers (anything outside 0–4) are silently ignored.

See Extending section below for more information on adding additional commands.

---

## Output protocol

| Outcome        | Output                                  |
| -------------- | --------------------------------------- |
| Success        | `x y` — final position, space-separated |
| Fell off table | `-1 -1`                                 |

Only one line is written to stdout. Nothing else.

---

## Coordinate system

Origin `(0, 0)` is at teh **top-left**. `x` increases rightward, `y` increases downward.

```
(0,0) ──── (3,0)
  │           │
(0,3) ──── (3,3)
```

The object always starts facing **North** (negative-y direction). A forward step from `[2, 4]` lands at `[2, 3]`.

### Rotation reference

| From  | Clockwise (3) | Counter-clockwise (4) |
| ----- | ------------- | --------------------- |
| North | East          | West                  |
| East  | South         | North                 |
| South | West          | East                  |
| West  | North         | South                 |

---

## Testing

```bash
npm test                 # run all tests
npm run test:coverage    # run with coverage report
```

## Code structure

```
src/
  models/           Pure types and value functions — zero side effects, zero I/O
    command.ts      Command enum (QUIT=0 … ROTATE_COUNTER_CLOCKWISE=4) + toCommand()
    direction.ts    Direction enum, rotateClockwise/CCW, directionDelta
    position.ts     Position interface + translate()
    simulation.ts   TableConfig, SimulationState, SimulationResult types
  lib/
    table.ts        BoundaryChecker interface + RectangularTable
    simulator.ts    applyCommand(), createInitialState(), runSimulation()
    parser.ts       tokenize(), parseTableConfig(), parseStartPosition(), parseCommand()
    reader.ts       SimulationRunner class (streaming) + runFromStdin() (CLI wiring)
  index.ts          One-line entry point
tests/
  unit/             One file per source module
  integration/      Full end-to-end test of the spec example
```

### Key decisions

Generally speaking, a functional approach was taken because an emphasis was placed on testability and code coverage. The main exception to this is the SimulationRunner, which acts as the stateful representation of the lifecycle of the simulation.

**`BoundaryChecker` interface (`lib/table.ts`)**
The boundary check is defined on an interface level that tables should implement. Supporting a different table shape (circular, triangular, etc.) means implementing `BoundaryChecker`, and the simulation logic should take care of the rest.

**`COMMAND_HANDLERS` map (`lib/simulator.ts`)**
Each command is a pure handler function registered in a map keyed by `Command` enum value. Adding a new command requires two steps: registering the integer in the `Command` enum, then adding a handler to this map.

**`SimulationRunner` class (`lib/reader.ts`)**
Processes input as a token stream, one token at a time, via a private `processToken()` method. This means it handles arbitrary token layouts (one per line, comma-separated, mixed) without buffering the full input. The injectable `output` function (defaults to `console.log`) makes it fully testable without spawning a subprocess.

**`InputPhase` enum (`lib/reader.ts`)**
The runner's internal state machine uses a named enum rather than string literals, making valid transitions explicit and making it straightforward to add new phases (e.g., reading a secondary config block) in the future.

**`parser.ts` isolation**
All text-to-domain parsing lives in one file. Switching the integer protocol for JSON requires changes only in `parser.ts` and `SimulationRunner.processToken()`.

**Pure simulation core**
`applyCommand` and `runSimulation` are pure functions — no I/O, no mutation, no global state. They are independently testable and reusable from any context (HTTP handler, WebSocket, browser, etc.).

---

## Extending

### Adding a new command

Two files need to change, and TypeScript will keep them in sync:

**Step 1 — register the integer** in `src/models/command.ts`:

```typescript
export enum Command {
  // ...existing values...
  ROTATE_TABLE_CLOCKWISE = 5,
}
```

**Step 2 — register the handler** in `src/lib/simulator.ts`:

```typescript
export const COMMAND_HANDLERS: Partial<Record<Command, CommandHandler>> = {
  // ...existing handlers...
  [Command.ROTATE_TABLE_CLOCKWISE]: (state) => ({
    ...state,
    tableConfig: rotateTableConfig(state.tableConfig),
  }),
};
```

Handlers receive the current `SimulationState` and return the next one. Bounds checking after a move is handled automatically by `applyCommand` — handlers do not need to validate positions.

> **Known limitation:** because `COMMAND_HANDLERS` is typed as `Partial<Record<...>>`, TypeScript will not error if step 2 is skipped — the command will silently no-op at runtime. See the architecture notes above for the proposed fix (`Record<Exclude<Command, Command.QUIT>, CommandHandler>`).

### Supporting a non-rectangular table shape

Implement the `BoundaryChecker` interface in `src/lib/table.ts` and pass an instance to `runSimulation` or `SimulationRunner`. No simulation logic needs to change.

```typescript
export class CircularTable implements BoundaryChecker {
  constructor(private readonly radius: number) {}
  isInBounds({ x, y }: Position): boolean {
    return x * x + y * y <= this.radius * this.radius;
  }
}
```

### Changing the input protocol

All parsing lives in `src/lib/parser.ts`. Switching from the integer token protocol to JSON (or any other format) means changing `parseTableConfig`, `parseStartPosition`, and `parseCommand` — no simulation or I/O code changes.

---

## Assumptions

| #   | Assumption                                                                                   |
| --- | -------------------------------------------------------------------------------------------- |
| 1   | Tokens are separated by whitespace and/or commas in any combination.                         |
| 2   | Output format is `x y` (space-separated).                                                    |
| 3   | Unrecognized command integers are silently skipped.                                          |
| 4   | If stdin closes without a `0` command, the current position is returned as a success result. |
| 5   | A starting position outside the table bounds is treated as an immediate failure (`-1 -1`).   |
| 6   | Rotation commands do not move the object — only its facing direction changes.                |
