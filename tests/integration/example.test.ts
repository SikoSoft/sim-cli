import { SimulationRunner } from "../../src/lib/reader";
import { runSimulation } from "../../src/lib/simulator";
import { Command } from "../../src/models/command";

/**
 * End-to-end reproduction of the exact example from the spec:
 *
 *   Table: 4×4
 *   Start: [2, 2], direction North
 *   Commands: 1, 4, 1, 3, 2, 3, 2, 4, 1, 0
 *   Expected output: [0, 1]
 *
 * Trace:
 *   [2,2] N  →(1 fwd)→  [2,1] N
 *   [2,1] N  →(4 ccw)→  [2,1] W
 *   [2,1] W  →(1 fwd)→  [1,1] W
 *   [1,1] W  →(3 cw)→   [1,1] N
 *   [1,1] N  →(2 bwd)→  [1,2] N
 *   [1,2] N  →(3 cw)→   [1,2] E
 *   [1,2] E  →(2 bwd)→  [0,2] E
 *   [0,2] E  →(4 ccw)→  [0,2] N
 *   [0,2] N  →(1 fwd)→  [0,1] N
 *   (0 quit) → output [0, 1]
 */

const SPEC_COMMANDS = [
  Command.MOVE_FORWARD,
  Command.ROTATE_COUNTER_CLOCKWISE,
  Command.MOVE_FORWARD,
  Command.ROTATE_CLOCKWISE,
  Command.MOVE_BACKWARD,
  Command.ROTATE_CLOCKWISE,
  Command.MOVE_BACKWARD,
  Command.ROTATE_COUNTER_CLOCKWISE,
  Command.MOVE_FORWARD,
  Command.QUIT,
];

describe("Spec example", () => {
  it("produces [0, 1] via runSimulation", () => {
    const result = runSimulation(
      { width: 4, height: 4 },
      { x: 2, y: 2 },
      SPEC_COMMANDS
    );
    expect(result).toEqual({ success: true, position: { x: 0, y: 1 } });
  });

  it('produces "0 1" via SimulationRunner (line-by-line stdin simulation)', () => {
    let output: string | null = null;
    const runner = new SimulationRunner((line) => {
      output = line;
    });

    for (const line of [
      "4 4",
      "2 2",
      "1",
      "4",
      "1",
      "3",
      "2",
      "3",
      "2",
      "4",
      "1",
      "0",
    ]) {
      runner.feed(line);
    }
    runner.finalize();

    expect(output).toBe("0 1");
  });

  it('produces "0 1" from a single comma-separated line (spec notation)', () => {
    let output: string | null = null;
    const runner = new SimulationRunner((line) => {
      output = line;
    });
    runner.feed("4,4,2,2,1,4,1,3,2,3,2,4,1,0");
    runner.finalize();
    expect(output).toBe("0 1");
  });
});
