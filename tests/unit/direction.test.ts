import {
  rotateClockwise,
  rotateCounterClockwise,
} from "../../src/lib/simulator";
import { Direction, directionDelta } from "../../src/models/direction";

describe("rotateClockwise", () => {
  it("rotates North → East", () =>
    expect(rotateClockwise(Direction.NORTH)).toBe(Direction.EAST));
  it("rotates East → South", () =>
    expect(rotateClockwise(Direction.EAST)).toBe(Direction.SOUTH));
  it("rotates South → West", () =>
    expect(rotateClockwise(Direction.SOUTH)).toBe(Direction.WEST));
  it("rotates West → North", () =>
    expect(rotateClockwise(Direction.WEST)).toBe(Direction.NORTH));

  it("completes a full 360° cycle", () => {
    let dir = Direction.NORTH;
    for (let i = 0; i < 4; i++) dir = rotateClockwise(dir);
    expect(dir).toBe(Direction.NORTH);
  });
});

describe("rotateCounterClockwise", () => {
  it("rotates North → West", () =>
    expect(rotateCounterClockwise(Direction.NORTH)).toBe(Direction.WEST));
  it("rotates West → South", () =>
    expect(rotateCounterClockwise(Direction.WEST)).toBe(Direction.SOUTH));
  it("rotates South → East", () =>
    expect(rotateCounterClockwise(Direction.SOUTH)).toBe(Direction.EAST));
  it("rotates East → North", () =>
    expect(rotateCounterClockwise(Direction.EAST)).toBe(Direction.NORTH));

  it("is the inverse of rotateClockwise", () => {
    for (const dir of Object.values(Direction)) {
      expect(rotateCounterClockwise(rotateClockwise(dir))).toBe(dir);
      expect(rotateClockwise(rotateCounterClockwise(dir))).toBe(dir);
    }
  });
});

describe("directionDelta", () => {
  it("North decreases y (origin top-left)", () =>
    expect(directionDelta(Direction.NORTH)).toEqual({ x: 0, y: -1 }));
  it("East increases x", () =>
    expect(directionDelta(Direction.EAST)).toEqual({ x: 1, y: 0 }));
  it("South increases y", () =>
    expect(directionDelta(Direction.SOUTH)).toEqual({ x: 0, y: 1 }));
  it("West decreases x", () =>
    expect(directionDelta(Direction.WEST)).toEqual({ x: -1, y: 0 }));
});
