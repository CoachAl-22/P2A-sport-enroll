import { describe, it, expect } from "vitest";
import { computeEnrolmentAmount } from "./enrolment-pricing";

describe("computeEnrolmentAmount", () => {
  it("full term = pricePerTerm + GST, unchanged behaviour", () => {
    const r = computeEnrolmentAmount({
      pricePerTerm: "200.00", pricePerWeek: "20.00", gstRate: 0.1, payableWeekCount: 10,
    });
    expect(r.isFullTerm).toBe(true);
    expect(r.amount).toBe("220.00"); // 200 * 1.1
  });

  it("per-week = pricePerWeek x selected + GST", () => {
    const r = computeEnrolmentAmount({
      pricePerTerm: "200.00", pricePerWeek: "20.00", gstRate: 0.1, payableWeekCount: 10,
      selectedWeekNumbers: [1, 3, 5, 7, 9], // 5 weeks, meets half-term min
    });
    expect(r.isFullTerm).toBe(false);
    expect(r.selectedWeekCount).toBe(5);
    expect(r.amount).toBe("110.00"); // 20 * 5 * 1.1
  });

  it("dedupes repeated week numbers before pricing", () => {
    const r = computeEnrolmentAmount({
      pricePerTerm: "200.00", pricePerWeek: "20.00", gstRate: 0.1, payableWeekCount: 10,
      selectedWeekNumbers: [1, 1, 3, 5, 7, 9],
    });
    expect(r.selectedWeekCount).toBe(5);
    expect(r.amount).toBe("110.00");
  });

  it("rejects a selection below the half-term minimum", () => {
    expect(() => computeEnrolmentAmount({
      pricePerTerm: "200.00", pricePerWeek: "20.00", gstRate: 0.1, payableWeekCount: 10,
      selectedWeekNumbers: [1, 2, 3, 4], // 4 < ceil(10/2)=5
    })).toThrow(/minimum/i);
  });

  it("rejects selecting more weeks than are payable", () => {
    expect(() => computeEnrolmentAmount({
      pricePerTerm: "200.00", pricePerWeek: "20.00", gstRate: 0.1, payableWeekCount: 8,
      selectedWeekNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    })).toThrow(/payable/i);
  });

  it("applies a non-default gstRate", () => {
    const r = computeEnrolmentAmount({
      pricePerTerm: "100.00", pricePerWeek: null, gstRate: 0, payableWeekCount: 8,
    });
    expect(r.amount).toBe("100.00"); // 100 * 1.0
  });
});
