import { SimulationRunner, handleFatalError } from "../../src/lib/reader";
import { ParseError } from "../../src/lib/parser";

const runLines = (lines: string[]): string | null => {
  let output: string | null = null;
  const runner = new SimulationRunner((line) => {
    output = line;
  });
  for (const line of lines) runner.feed(line);
  runner.finalize();
  return output;
};

describe("SimulationRunner", () => {
  describe("normal flow", () => {
    it("emits final position on Quit", () => {
      expect(runLines(["4 4", "2 2", "1", "0"])).toBe("2 1");
    });

    it("emits position when stream ends without Quit", () => {
      expect(runLines(["4 4", "2 2"])).toBe("2 2");
    });

    it("emits position after a series of moves", () => {
      expect(runLines(["4 4", "2 2", "3", "1", "0"])).toBe("3 2");
    });
  });

  describe("failure cases", () => {
    it("emits -1 -1 when object falls off the top edge", () => {
      expect(runLines(["4 4", "0 0", "1"])).toBe("-1 -1");
    });

    it("emits -1 -1 when object falls off the left edge", () => {
      expect(runLines(["4 4", "0 2", "4", "1"])).toBe("-1 -1");
    });

    it("emits -1 -1 for an out-of-bounds start position", () => {
      expect(runLines(["4 4", "5 5", "0"])).toBe("-1 -1");
      expect(runLines(["4 4", "-1 0", "0"])).toBe("-1 -1");
    });
  });

  describe("token formats", () => {
    it("accepts all tokens on a single comma-separated line", () => {
      expect(runLines(["4,4,2,2,1,0"])).toBe("2 1");
    });

    it("accepts commas mixed with spaces", () => {
      expect(runLines(["4, 4, 2, 2", "1, 0"])).toBe("2 1");
    });

    it("accepts multiple tokens per line", () => {
      expect(runLines(["4 4 2 2", "1 4 1 3 2 3 2 4 1 0"])).toBe("0 1");
    });

    it("header tokens may span lines in any split", () => {
      // width on one line, height + x + y on next
      expect(runLines(["4", "4 2 2", "0"])).toBe("2 2");
    });
  });

  describe("edge cases", () => {
    it("ignores blank lines anywhere in input", () => {
      expect(runLines(["", "4 4", "", "2 2", "", "1", "", "0"])).toBe("2 1");
    });

    it("ignores comma-only lines", () => {
      expect(runLines(["4 4", "2 2", ",,,", "0"])).toBe("2 2");
    });

    it("ignores unrecognized command integers (5, 99)", () => {
      expect(runLines(["4 4", "2 2", "5", "99", "0"])).toBe("2 2");
    });

    it("does not emit after already done", () => {
      let count = 0;
      const runner = new SimulationRunner(() => {
        count++;
      });
      runner.feed("4 4");
      runner.feed("2 2");
      runner.feed("0"); // emits here
      runner.feed("1"); // ignored
      runner.finalize(); // ignored
      expect(count).toBe(1);
    });

    it("isDone returns true after emitting", () => {
      const runner = new SimulationRunner(() => {});
      runner.feed("4 4");
      runner.feed("2 2");
      runner.feed("0");
      expect(runner.isDone).toBe(true);
    });

    it("isDone returns false before result is emitted", () => {
      const runner = new SimulationRunner(() => {});
      runner.feed("4 4");
      runner.feed("2 2");
      expect(runner.isDone).toBe(false);
    });

    it("emits nothing when stream closes before position is provided", () => {
      expect(runLines(["4 4"])).toBeNull();
    });
  });

  describe("handleFatalError", () => {
    let stderrSpy: jest.SpyInstance;
    let exitSpy: jest.SpyInstance;

    beforeEach(() => {
      stderrSpy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
      exitSpy = jest.spyOn(process, "exit").mockImplementation((() => {
        throw new Error("process.exit called");
      }) as () => never);
    });

    afterEach(() => {
      stderrSpy.mockRestore();
      exitSpy.mockRestore();
    });

    it("writes a parse error message to stderr and exits with code 1", () => {
      expect(() => handleFatalError(new ParseError("bad input"))).toThrow("process.exit called");
      expect(stderrSpy).toHaveBeenCalledWith("Parse error: bad input\n");
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it("writes an unexpected error message to stderr and exits with code 1", () => {
      expect(() => handleFatalError(new Error("something went wrong"))).toThrow("process.exit called");
      expect(stderrSpy).toHaveBeenCalledWith("Unexpected error: Error: something went wrong\n");
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe("invalid input — ParseError propagation", () => {
    it("throws ParseError for non-integer table dimensions", () => {
      const runner = new SimulationRunner(() => {});
      expect(() => runner.feed("abc 4")).toThrow(ParseError);
    });

    it("throws ParseError for non-positive table dimensions", () => {
      const runner = new SimulationRunner(() => {});
      expect(() => runner.feed("0 4")).toThrow(ParseError);
    });

    it("throws ParseError for non-integer start position", () => {
      const runner = new SimulationRunner(() => {});
      runner.feed("4 4");
      expect(() => runner.feed("x y")).toThrow(ParseError);
    });

    it("throws ParseError for a non-integer command token", () => {
      const runner = new SimulationRunner(() => {});
      runner.feed("4 4");
      runner.feed("2 2");
      expect(() => runner.feed("abc")).toThrow(ParseError);
    });
  });
});
