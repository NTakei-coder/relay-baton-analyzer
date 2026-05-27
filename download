import { describe, expect, it } from "vitest";
import { elapsedTimeBetweenFrames, frameSpeeds, median, parseNum, rowsToCsv } from "./lib.js";

describe("calculation utilities", () => {
  it("parses numeric text", () => {
    expect(parseNum("1,234.5")).toBe(1234.5);
    expect(Number.isNaN(parseNum("")).toBe(true);
  });

  it("computes median", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
  });

  it("computes elapsed time from frame difference and fps", () => {
    expect(elapsedTimeBetweenFrames("100", "160", 60)).toBeCloseTo(1);
  });

  it("computes section speed", () => {
    const rows = frameSpeeds(
      [
        { key: "a", distance: 0, label: "0-5m" },
        { key: "b", distance: 5, label: "0-5m" },
      ],
      { a: "0", b: "60" },
      60,
    );
    expect(rows[0].time).toBeCloseTo(1);
    expect(rows[0].speed).toBeCloseTo(5);
  });

  it("escapes CSV cells", () => {
    const csv = rowsToCsv([["a", "b"], ["line", "quote\"test"]]);
    expect(csv).toContain("\n");
    expect(csv).toContain('"quote""test"');
  });
});
