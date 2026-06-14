// Pure helpers for MAJ account provisioning. No DB, no side effects.

// Map a class venue name to a white-label school code used for the shared password.
export function schoolCodeForVenue(venueName: string | null | undefined): string {
  const v = (venueName ?? "").toLowerCase();
  if (v.includes("peninsula grammar")) return "PG";
  if (v.includes("toorak college")) return "TC";
  return "P2A";
}

// firstname + first letter of last name, lowercased, alphanumeric only.
export function majUsernameBase(firstName: string, lastName: string): string {
  const clean = (s: string) => (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const first = clean(firstName);
  const lastInitial = clean(lastName).charAt(0);
  return `${first}${lastInitial}`;
}

// Append the smallest integer suffix that is not taken (base, base2, base3, ...).
export function resolveUsername(base: string, isTaken: (u: string) => boolean): string {
  if (!isTaken(base)) return base;
  let n = 2;
  while (isTaken(`${base}${n}`)) n++;
  return `${base}${n}`;
}

// Shared per-school password: code + year.
export function majPassword(schoolCode: string, year: number): string {
  return `${schoolCode}${year}`;
}
