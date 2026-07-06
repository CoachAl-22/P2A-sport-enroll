// Sibling discount (legacy SportsBiz rule): 20% off when a THIRD sibling
// enrols in the program.
//
// ── HOLD: the exact mechanic is awaiting Al's confirmation ──────────────────
// Open questions before enabling:
//   1. Does the 20% apply only to the 3rd (cheapest? as-ordered?) child's fee,
//      or to the whole family total?
//   2. Does a 4th+ child also get 20%?
//   3. Is the threshold counted per distinct CHILD or per enrolment?
//      (getActiveEnrolmentCountForParent counts enrolments — a child in two
//      classes counts twice. Probably should be distinct children.)
// The placeholder mechanic below is: 20% off the fee of every child at family
// position >= 3 (prior active enrolments + position within this checkout).
// Flip SIBLING_DISCOUNT_ENABLED to true once the mechanic is confirmed.
export const SIBLING_DISCOUNT_ENABLED = false;
export const SIBLING_DISCOUNT_RATE = 0.2;
export const SIBLING_DISCOUNT_FROM_POSITION = 3; // 1-based family position

export interface SiblingDiscountResult {
  /** Per-item amounts after discount, same order as the input */
  discountedCents: number[];
  /** Total discount taken across the batch, in cents */
  discountCents: number;
  /** Which input positions (0-based) received the discount */
  discountedIndexes: number[];
}

/**
 * Apply the sibling discount to a batch of per-enrolment amounts.
 *
 * @param perItemCents  GST-inclusive amount per enrolment in this checkout,
 *                      in cents, in checkout order
 * @param priorCount    the family's already-active enrolment count for the
 *                      same term/year (storage.getActiveEnrolmentCountForParent)
 */
export function applySiblingDiscount(
  perItemCents: number[],
  priorCount: number,
): SiblingDiscountResult {
  if (!SIBLING_DISCOUNT_ENABLED) {
    return { discountedCents: [...perItemCents], discountCents: 0, discountedIndexes: [] };
  }
  const discountedCents: number[] = [];
  const discountedIndexes: number[] = [];
  let discountCents = 0;
  perItemCents.forEach((cents, i) => {
    const familyPosition = priorCount + i + 1; // 1-based
    if (familyPosition >= SIBLING_DISCOUNT_FROM_POSITION) {
      const off = Math.round(cents * SIBLING_DISCOUNT_RATE);
      discountCents += off;
      discountedCents.push(cents - off);
      discountedIndexes.push(i);
    } else {
      discountedCents.push(cents);
    }
  });
  return { discountedCents, discountCents, discountedIndexes };
}
