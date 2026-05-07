import { Command } from "../models/command";
import { Position } from "../models/position";
import { TableConfig } from "../models/simulation";
import { ParseError } from "./error";

/** Splits a raw input line into tokens, treating commas and whitespace interchangeably as delimiters. */
export const tokenize = (line: string): string[] =>
  line.replace(/,/g, " ").trim().split(/\s+/).filter(Boolean);

const VALID_COMMAND_VALUES = new Set<number>(
  (Object.values(Command) as Array<string | number>).filter(
    (v): v is number => typeof v === "number"
  )
);

/** Maps a numeric value to its Command enum member, returning null if the value is not a recognised command. */
export const toCommand = (value: number): Command | null =>
  VALID_COMMAND_VALUES.has(value) ? (value as Command) : null;

/**
 * Parses exactly two whitespace-separated integers from a line.
 * @throws {ParseError} If the line does not contain exactly two integer values.
 */
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

/**
 * Parses a "width height" token pair into a TableConfig.
 * @throws {ParseError} If dimensions are missing, non-integer, or not positive.
 */
export const parseTableConfig = (line: string): TableConfig => {
  const [width, height] = parseTwoIntegers(line, "table size");
  if (width <= 0 || height <= 0) {
    throw new ParseError(
      `Table dimensions must be positive, got: ${width} ${height}`
    );
  }
  return { width, height };
};

/**
 * Parses an "x y" token pair into a starting Position.
 * @throws {ParseError} If the values are missing or non-integer.
 */
export const parseStartPosition = (line: string): Position => {
  const [x, y] = parseTwoIntegers(line, "start position");
  return { x, y };
};

/**
 * Parses a single command token. Returns null for empty input or an unrecognised integer.
 * @throws {ParseError} If the token is non-empty but not an integer.
 */
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
