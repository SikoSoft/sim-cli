import { Command, toCommand } from "../../src/models/command";

describe("toCommand", () => {
  it("maps 0 → Quit", () => expect(toCommand(0)).toBe(Command.QUIT));
  it("maps 1 → MoveForward", () =>
    expect(toCommand(1)).toBe(Command.MOVE_FORWARD));
  it("maps 2 → MoveBackward", () =>
    expect(toCommand(2)).toBe(Command.MOVE_BACKWARD));
  it("maps 3 → RotateClockwise", () =>
    expect(toCommand(3)).toBe(Command.ROTATE_CLOCKWISE));
  it("maps 4 → RotateCounterClockwise", () =>
    expect(toCommand(4)).toBe(Command.ROTATE_COUNTER_CLOCKWISE));

  it("returns null for unrecognized integers", () => {
    expect(toCommand(5)).toBeNull();
    expect(toCommand(-1)).toBeNull();
    expect(toCommand(99)).toBeNull();
  });
});
