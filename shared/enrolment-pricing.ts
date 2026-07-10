// Enrolment money math: single source of truth for the GST-inclusive amount
// charged at enrolment. Pure — no DB, no Stripe. Shared so server routes and
// any future client preview use identical rules.
//
// Rules (see docs/superpowers/specs/2026-07-10-p2a-platform-design.md):
// - amount = ex-GST base × (1 + gstRate); gstRate defaults upstream to 0.10
// - full term (no selectedWeekNumbers) charges the flat pricePerTerm — exact
//   original behaviour, no regression
// - per-week charges pricePerWeek × unique selected weeks, guarded by the
//   half-term minimum (minimumSelectableWeeks) and the payable-week ceiling

import { minimumSelectableWeeks } from "@shared/term-weeks";

export interface EnrolmentPriceInput {
  pricePerTerm: string;
  pricePerWeek: string | null;
  gstRate: number;
  payableWeekCount: number;
  selectedWeekNumbers?: number[];
}

export interface EnrolmentPriceResult {
  baseExGst: number;
  gstRate: number;
  amount: string; // GST-inclusive, 2dp
  selectedWeekCount: number;
  isFullTerm: boolean;
}

export function computeEnrolmentAmount(input: EnrolmentPriceInput): EnrolmentPriceResult {
  const { pricePerTerm, pricePerWeek, gstRate, payableWeekCount, selectedWeekNumbers } = input;

  const isPerWeek = Array.isArray(selectedWeekNumbers) && selectedWeekNumbers.length > 0;

  if (!isPerWeek) {
    const baseExGst = parseFloat(pricePerTerm);
    return {
      baseExGst,
      gstRate,
      amount: (baseExGst * (1 + gstRate)).toFixed(2),
      selectedWeekCount: payableWeekCount,
      isFullTerm: true,
    };
  }

  if (pricePerWeek == null) {
    throw new Error("Per-week enrolment requires a pricePerWeek on the term config");
  }

  const unique = Array.from(new Set(selectedWeekNumbers));
  const minWeeks = minimumSelectableWeeks(payableWeekCount);
  if (unique.length < minWeeks) {
    throw new Error(`Selection below half-term minimum: ${unique.length} < ${minWeeks}`);
  }
  if (unique.length > payableWeekCount) {
    throw new Error(`Selection exceeds payable weeks: ${unique.length} > ${payableWeekCount}`);
  }

  const baseExGst = parseFloat(pricePerWeek) * unique.length;
  return {
    baseExGst,
    gstRate,
    amount: (baseExGst * (1 + gstRate)).toFixed(2),
    selectedWeekCount: unique.length,
    isFullTerm: false,
  };
}
