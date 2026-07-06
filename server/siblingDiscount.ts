// Sibling discount (legacy SportsBiz rule, confirmed by Al 2026-07-06):
// 20% off the individual fee of the 3rd sibling and each subsequent sibling.
// Children 1 and 2 pay full price; the discount applies per-child to that
// child's own fee — never to the family total.
//
// "Sibling" = distinct child linked to the same parent account, enrolled in
// the same term/year. A child in two classes counts once for positioning,
// but every enrolment belonging to a discounted child gets the 20% off.
// Prices are GST-inclusive when they reach this module; 20% off an
// inc-GST amount equals 20% off ex-GST then ×1.1 (multiplication commutes),
// so GST stays exactly 10% of the discounted ex-GST base.
export const SIBLING_DISCOUNT_ENABLED = true;
export const SIBLING_DISCOUNT_RATE = 0.2;
export const SIBLING_DISCOUNT_FROM_POSITION = 3; // 1-based family position

export interface SiblingDiscountItem {
  childId: string;
  /** GST-inclusive amount for this enrolment, in cents */
  cents: number;
}

export interface SiblingDiscountResult {
  /** Per-item amounts after discount, same order as the input */
  discountedCents: number[];
  /** Total discount taken across the batch, in cents */
  discountCents: number;
  /** Which input positions (0-based) received the discount */
  discountedIndexes: number[];
}

/**
 * Apply the sibling discount to a checkout batch.
 *
 * @param items          this checkout's enrolments in order (childId + inc-GST cents)
 * @param priorChildIds  distinct children of the family already ACTIVE in the
 *                       same term/year (storage.getActiveSiblingChildIdsForParent)
 */
export function applySiblingDiscount(
  items: SiblingDiscountItem[],
  priorChildIds: string[],
): SiblingDiscountResult {
  if (!SIBLING_DISCOUNT_ENABLED) {
    return { discountedCents: items.map((i) => i.cents), discountCents: 0, discountedIndexes: [] };
  }

  // Family position per distinct child: already-active siblings first, then
  // this checkout's children in order of first appearance.
  const position = new Map<string, number>();
  for (const id of priorChildIds) {
    if (!position.has(id)) position.set(id, position.size + 1);
  }
  for (const item of items) {
    if (!position.has(item.childId)) position.set(item.childId, position.size + 1);
  }

  const discountedCents: number[] = [];
  const discountedIndexes: number[] = [];
  let discountCents = 0;
  items.forEach((item, i) => {
    if ((position.get(item.childId) ?? 1) >= SIBLING_DISCOUNT_FROM_POSITION) {
      const off = Math.round(item.cents * SIBLING_DISCOUNT_RATE);
      discountCents += off;
      discountedCents.push(item.cents - off);
      discountedIndexes.push(i);
    } else {
      discountedCents.push(item.cents);
    }
  });
  return { discountedCents, discountCents, discountedIndexes };
}
