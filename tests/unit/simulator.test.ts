import {
  applyCommand,
  createInitialState,
  runSimulation,
} from "../../src/lib/simulator";
import { RectangularTable } from "../../src/lib/table";
import { Command } from "../../src/models/command";
import { Direction } from "../../src/models/direction";

const config = { width: 4, height: 4 };
const boundary = new RectangularTable(config);

describe("createInitialState", () => {
  it("places object at the given position facing North", () => {
    const state = createInitialState(config, { x: 2, y: 2 });
    expect(state.position).toEqual({ x: 2, y: 2 });
    expect(state.direction).toBe(Direction.NORTH);
    expect(state.tableConfig).toEqual(config);
  });
});

describe("applyCommand — MoveForward", () => {
  it("North decreases y", () => {
    const state = createInitialState(config, { x: 2, y: 2 });
    const { state: next } = applyCommand(state, Command.MOVE_FORWARD, boundary);
    expect(next.position).toEqual({ x: 2, y: 1 });
  });

  it("East increases x", () => {
    const state = {
      ...createInitialState(config, { x: 1, y: 1 }),
      direction: Direction.EAST,
    };
    const { state: next } = applyCommand(state, Command.MOVE_FORWARD, boundary);
    expect(next.position).toEqual({ x: 2, y: 1 });
  });

  it("South increases y", () => {
    const state = {
      ...createInitialState(config, { x: 1, y: 1 }),
      direction: Direction.SOUTH,
    };
    const { state: next } = applyCommand(state, Command.MOVE_FORWARD, boundary);
    expect(next.position).toEqual({ x: 1, y: 2 });
  });

  it("West decreases x", () => {
    const state = {
      ...createInitialState(config, { x: 2, y: 2 }),
      direction: Direction.WEST,
    };
    const { state: next } = applyCommand(state, Command.MOVE_FORWARD, boundary);
    expect(next.position).toEqual({ x: 1, y: 2 });
  });
});

describe("applyCommand — MoveBackward", () => {
  it("moves in the opposite direction to facing", () => {
    const state = createInitialState(config, { x: 2, y: 2 });
    const { state: next } = applyCommand(
      state,
      Command.MOVE_BACKWARD,
      boundary
    );
    expect(next.position).toEqual({ x: 2, y: 3 });
  });
});

describe("applyCommand — RotateClockwise", () => {
  it("changes direction without changing position", () => {
    const state = createInitialState(config, { x: 2, y: 2 });
    const { state: next } = applyCommand(
      state,
      Command.ROTATE_CLOCKWISE,
      boundary
    );
    expect(next.direction).toBe(Direction.EAST);
    expect(next.position).toEqual({ x: 2, y: 2 });
  });
});

describe("applyCommand — RotateCounterClockwise", () => {
  it("changes direction without changing position", () => {
    const state = createInitialState(config, { x: 2, y: 2 });
    const { state: next } = applyCommand(
      state,
      Command.ROTATE_COUNTER_CLOCKWISE,
      boundary
    );
    expect(next.direction).toBe(Direction.WEST);
    expect(next.position).toEqual({ x: 2, y: 2 });
  });
});

describe("applyCommand — Quit", () => {
  it("sets done=true and does not alter position", () => {
    const state = createInitialState(config, { x: 1, y: 1 });
    const result = applyCommand(state, Command.QUIT, boundary);
    expect(result.done).toBe(true);
    expect(result.failed).toBe(false);
    expect(result.state.position).toEqual({ x: 1, y: 1 });
  });
});

describe("applyCommand — out-of-bounds", () => {
  it("sets failed=true when object moves off the top edge", () => {
    const state = createInitialState(config, { x: 0, y: 0 }); // North
    const result = applyCommand(state, Command.MOVE_FORWARD, boundary);
    expect(result.failed).toBe(true);
    expect(result.done).toBe(false);
  });

  it("sets failed=true when object moves off the left edge", () => {
    const state = {
      ...createInitialState(config, { x: 0, y: 2 }),
      direction: Direction.WEST,
    };
    const result = applyCommand(state, Command.MOVE_FORWARD, boundary);
    expect(result.failed).toBe(true);
  });
});

describe("runSimulation", () => {
  it("fails immediately when start position is outside the table", () => {
    expect(runSimulation(config, { x: -1, y: 0 }, [])).toEqual({
      success: false,
    });
    expect(runSimulation(config, { x: 4, y: 0 }, [])).toEqual({
      success: false,
    });
  });

  it("returns the start position when quit is the first command", () => {
    const result = runSimulation(config, { x: 2, y: 2 }, [Command.QUIT]);
    expect(result).toEqual({ success: true, position: { x: 2, y: 2 } });
  });

  it("returns failure when object falls off the table", () => {
    const result = runSimulation(config, { x: 0, y: 0 }, [
      Command.MOVE_FORWARD,
    ]);
    expect(result).toEqual({ success: false });
  });

  it("returns current position when input ends without Quit", () => {
    const result = runSimulation(config, { x: 2, y: 2 }, [
      Command.MOVE_FORWARD,
    ]);
    expect(result).toEqual({ success: true, position: { x: 2, y: 1 } });
  });

  it("chains multiple commands correctly", () => {
    const result = runSimulation(config, { x: 1, y: 1 }, [
      Command.ROTATE_CLOCKWISE,
      Command.MOVE_FORWARD,
      Command.MOVE_FORWARD,
      Command.QUIT,
    ]);
    expect(result).toEqual({ success: true, position: { x: 3, y: 1 } });
  });
});
