// Per-week enrolment: computes the dated session weeks for a class within a term.
// Shared between server (term-weeks endpoint, price validation, backfill) and
// client (week-picker UI). Pure date-string logic — no DB, no timezone surprises.

export interface TermWeekHoliday {
  holidayDate: string; // YYYY-MM-DD
  name: string;
}

export interface TermWeek {
  weekNumber: number; // 1..weeksCount
  sessionDate: string; // YYYY-MM-DD — the date this class runs that week
  isHoliday: boolean; // true when a term holiday lands on the session date
  holidayName?: string;
}

// Business rule: parents must keep at least half the payable weeks
// (full term is the default; fortnightly is the main flexible pattern).
export function minimumSelectableWeeks(payableWeeksCount: number): number {
  return Math.max(1, Math.ceil(payableWeeksCount / 2));
}

function toUtcDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00Z`);
}

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// JS getUTCDay(): 0=Sunday..6=Saturday → ISO 1=Monday..7=Sunday (classes.dayOfWeek)
function isoDayOfWeek(d: Date): number {
  const day = d.getUTCDay();
  return day === 0 ? 7 : day;
}

export function computeTermWeeks(params: {
  termStartDate: string; // termConfigurations.startDate (YYYY-MM-DD)
  weeksCount: number; // termConfigurations.weeksCount
  classDayOfWeek: number; // classes.dayOfWeek (1=Monday..7=Sunday)
  holidays?: TermWeekHoliday[];
}): TermWeek[] {
  const { termStartDate, weeksCount, classDayOfWeek, holidays = [] } = params;

  if (classDayOfWeek < 1 || classDayOfWeek > 7) {
    throw new Error(`Invalid class dayOfWeek: ${classDayOfWeek} (expected 1-7)`);
  }
  if (weeksCount < 1) {
    throw new Error(`Invalid weeksCount: ${weeksCount}`);
  }

  const holidayByDate = new Map(holidays.map((h) => [h.holidayDate, h.name]));

  // First session: the first occurrence of the class's weekday on/after term start
  const first = toUtcDate(termStartDate);
  const offset = (classDayOfWeek - isoDayOfWeek(first) + 7) % 7;
  first.setUTCDate(first.getUTCDate() + offset);

  const weeks: TermWeek[] = [];
  for (let weekNumber = 1; weekNumber <= weeksCount; weekNumber++) {
    const session = new Date(first);
    session.setUTCDate(first.getUTCDate() + (weekNumber - 1) * 7);
    const sessionDate = toDateString(session);
    const holidayName = holidayByDate.get(sessionDate);
    weeks.push({
      weekNumber,
      sessionDate,
      isHoliday: holidayName !== undefined,
      ...(holidayName !== undefined ? { holidayName } : {}),
    });
  }
  return weeks;
}

export function payableWeeks(weeks: TermWeek[]): TermWeek[] {
  return weeks.filter((w) => !w.isHoliday);
}
