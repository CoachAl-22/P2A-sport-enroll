import { describe, it, expect } from "vitest";
import { FINDER_CHOICES, resolveRung } from "./finder";

describe("finder choices", () => {
  it("offers exactly five choices", () => {
    expect(FINDER_CHOICES).toHaveLength(5);
  });

  it("never offers High Performance", () => {
    expect(FINDER_CHOICES.map((c) => c.rung)).not.toContain("high-performance");
  });

  it("covers every program a parent can self-select into", () => {
    expect(FINDER_CHOICES.map((c) => c.rung)).toEqual([
      "foundation",
      "emerging-athletes",
      "junior-academy",
      "senior-squad",
      "team-sport-speed",
    ]);
  });

  it("has a unique id per choice", () => {
    const ids = FINDER_CHOICES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("resolveRung", () => {
  it("resolves each choice to its program", () => {
    expect(resolveRung("prep-2")).toBe("foundation");
    expect(resolveRung("years-3-6")).toBe("emerging-athletes");
    expect(resolveRung("years-7-10")).toBe("junior-academy");
    expect(resolveRung("age-16-plus")).toBe("senior-squad");
    expect(resolveRung("team-sport")).toBe("team-sport-speed");
  });

  it("returns null for anything it does not recognise", () => {
    expect(resolveRung("")).toBeNull();
    expect(resolveRung("year-7")).toBeNull();
    expect(resolveRung("../etc/passwd")).toBeNull();
  });

  it("returns null for non-string input rather than throwing", () => {
    const odd = [null, undefined, 42, {}, []] as unknown[];
    for (const value of odd) {
      expect(resolveRung(value as string)).toBeNull();
    }
  });
});

describe("choice labels", () => {
  it("uses year levels for the school-age bands and an age for the oldest", () => {
    const labels = FINDER_CHOICES.map((c) => c.label);
    expect(labels[0]).toMatch(/^Prep to Year 2$/);
    expect(labels[1]).toMatch(/^Years 3 to 6$/);
    expect(labels[2]).toMatch(/^Years 7 to 10$/);
    expect(labels[3]).toMatch(/16/);
  });

  it("carries no em dashes", () => {
    const text = FINDER_CHOICES.map((c) => `${c.label} ${c.note}`).join(" ");
    expect(text).not.toContain("—");
  });
});
