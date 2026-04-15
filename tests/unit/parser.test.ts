import {
  parseTableConfig,
  parseStartPosition,
  parseCommand,
  tokenize,
} from "../../src/lib/parser";
import { Command } from "../../src/models/command";
import { ParseError } from "../../src/lib/error";

describe("parseTableConfig", () => {
  it("parses space-separated integers", () => {
    expect(parseTableConfig("4 4")).toEqual({ width: 4, height: 4 });
    expect(parseTableConfig("10 3")).toEqual({ width: 10, height: 3 });
    expect(parseTableConfig("1 1")).toEqual({ width: 1, height: 1 });
  });

  it("handles extra whitespace", () => {
    expect(parseTableConfig("  4  4  ")).toEqual({ width: 4, height: 4 });
  });

  it("throws for zero dimensions", () => {
    expect(() => parseTableConfig("0 4")).toThrow(ParseError);
    expect(() => parseTableConfig("4 0")).toThrow(ParseError);
  });

  it("throws for negative dimensions", () => {
    expect(() => parseTableConfig("-1 4")).toThrow(ParseError);
  });

  it("throws when only one value is provided", () => {
    expect(() => parseTableConfig("4")).toThrow(ParseError);
  });

  it("throws when more than two values are provided", () => {
    expect(() => parseTableConfig("4 4 4")).toThrow(ParseError);
  });

  it("throws for non-integer input", () => {
    expect(() => parseTableConfig("a b")).toThrow(ParseError);
  });
});

describe("parseStartPosition", () => {
  it("parses valid positions", () => {
    expect(parseStartPosition("2 2")).toEqual({ x: 2, y: 2 });
    expect(parseStartPosition("0 0")).toEqual({ x: 0, y: 0 });
  });

  it("accepts out-of-bounds values (boundary check is the simulator's job)", () => {
    expect(parseStartPosition("-1 -1")).toEqual({ x: -1, y: -1 });
    expect(parseStartPosition("99 99")).toEqual({ x: 99, y: 99 });
  });
});

describe("parseCommand", () => {
  it("maps integer strings to Command values", () => {
    expect(parseCommand("0")).toBe(Command.QUIT);
    expect(parseCommand("1")).toBe(Command.MOVE_FORWARD);
    expect(parseCommand("2")).toBe(Command.MOVE_BACKWARD);
    expect(parseCommand("3")).toBe(Command.ROTATE_CLOCKWISE);
    expect(parseCommand("4")).toBe(Command.ROTATE_COUNTER_CLOCKWISE);
  });

  it("returns null for unrecognized command integers", () => {
    expect(parseCommand("5")).toBeNull();
    expect(parseCommand("99")).toBeNull();
    expect(parseCommand("-1")).toBeNull();
  });

  it("returns null for empty and whitespace-only lines", () => {
    expect(parseCommand("")).toBeNull();
    expect(parseCommand("   ")).toBeNull();
  });

  it("throws ParseError for non-integer input", () => {
    expect(() => parseCommand("abc")).toThrow(ParseError);
    expect(() => parseCommand("1.5")).toThrow(ParseError);
  });
});

// ---------------------------------------------------------------------------
// tokenize
// ---------------------------------------------------------------------------

describe("tokenize", () => {
  it("splits on whitespace", () => {
    expect(tokenize("4 4")).toEqual(["4", "4"]);
    expect(tokenize("1 2 3")).toEqual(["1", "2", "3"]);
  });

  it("treats commas as delimiters", () => {
    expect(tokenize("4,4,2,2")).toEqual(["4", "4", "2", "2"]);
  });

  it("handles mixed commas and spaces", () => {
    expect(tokenize("4, 4, 2 ,2")).toEqual(["4", "4", "2", "2"]);
  });

  it("collapses multiple delimiters", () => {
    expect(tokenize("4  ,  4")).toEqual(["4", "4"]);
  });

  it("returns an empty array for blank lines", () => {
    expect(tokenize("")).toEqual([]);
    expect(tokenize("   ")).toEqual([]);
    expect(tokenize(",,")).toEqual([]);
  });
});
