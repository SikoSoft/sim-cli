import { RectangularTable } from "../../src/lib/table";

describe("RectangularTable.isInBounds", () => {
  const table = new RectangularTable({ width: 4, height: 4 });

  it("accepts corners of the table", () => {
    expect(table.isInBounds({ x: 0, y: 0 })).toBe(true);
    expect(table.isInBounds({ x: 3, y: 0 })).toBe(true);
    expect(table.isInBounds({ x: 0, y: 3 })).toBe(true);
    expect(table.isInBounds({ x: 3, y: 3 })).toBe(true);
  });

  it("accepts an interior position", () => {
    expect(table.isInBounds({ x: 1, y: 2 })).toBe(true);
  });

  it("rejects one step past the right edge (x === width)", () => {
    expect(table.isInBounds({ x: 4, y: 0 })).toBe(false);
  });

  it("rejects one step past the bottom edge (y === height)", () => {
    expect(table.isInBounds({ x: 0, y: 4 })).toBe(false);
  });

  it("rejects negative x", () =>
    expect(table.isInBounds({ x: -1, y: 0 })).toBe(false));
  it("rejects negative y", () =>
    expect(table.isInBounds({ x: 0, y: -1 })).toBe(false));

  it("handles non-square tables", () => {
    const wide = new RectangularTable({ width: 10, height: 2 });
    expect(wide.isInBounds({ x: 9, y: 1 })).toBe(true);
    expect(wide.isInBounds({ x: 10, y: 0 })).toBe(false);
    expect(wide.isInBounds({ x: 0, y: 2 })).toBe(false);
  });
});
