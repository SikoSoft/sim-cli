import { Command, toCommand } from "../models/command";
import { Position } from "../models/position";
import { TableConfig } from "../models/simulation";

export const tokenize = (line: string): string[] =>
  line.replace(/,/g, " ").trim().split(/\s+/).filter(Boolean);

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

const parseTwoIntegers = (line: string, context: string): [number, number] => {
  const parts = line.trim().split(/\s+/);
  if (parts.length !== 2) {
    throw new ParseError(
      `Expected two integers for ${context}, got "${line.trim()}"`
    );
  }
  const [a, b] = parts.map((p) => parseInt(p, 10));
  if (Number.isNaN(a) || Number.isNaN(b)) {
    throw new ParseError(`Non-integer values for ${context}: "${line.trim()}"`);
  }
  return [a, b];
};

export const parseTableConfig = (line: string): TableConfig => {
  const [width, height] = parseTwoIntegers(line, "table size");
  if (width <= 0 || height <= 0) {
    throw new ParseError(
      `Table dimensions must be positive, got: ${width} ${height}`
    );
  }
  return { width, height };
};

export const parseStartPosition = (line: string): Position => {
  const [x, y] = parseTwoIntegers(line, "start position");
  return { x, y };
};

export const parseCommand = (line: string): Command | null => {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }

  const value = Number(trimmed);
  if (!Number.isInteger(value)) {
    throw new ParseError(`Expected integer command, got "${trimmed}"`);
  }

  return toCommand(value);
};
