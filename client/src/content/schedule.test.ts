import { describe, it, expect } from 'vitest';
import { sessionsFor, TRAINING_SCHEDULE } from './schedule';
import { SESSION_VENUES } from './rungs';
describe('approved Where we train timetable', () => {
  it('does not advertise Tuesday 4:30 as Junior Academy', () => {
    expect(sessionsFor('junior-academy').some(s => s.day === 'Tuesday' && s.time === '4:30pm')).toBe(false);
  });
  it('uses Alistair’s latest Tuesday 4:30 Hurdle Squad correction', () => {
    const session = TRAINING_SCHEDULE.find(s => s.day === 'Tuesday' && s.time === '4:30pm');
    expect(session?.waitlist).not.toBe(true);
    expect(session?.programs).toEqual(['hurdle-squad']);
  });
  it('includes Wednesday and both Friday shared squad sessions', () => {
    const mornington = sessionsFor('junior-academy').filter(s => s.venue.includes('Mornington'));
    expect(mornington.map(s => [s.day, s.time])).toEqual([['Wednesday','5:30pm'],['Friday','4:30pm'],['Friday','5:30pm']]);
    expect(sessionsFor('senior-squad')).toEqual(sessionsFor('junior-academy'));
  });
  it('feeds the same timetable to squad detail pages', () => {
    expect(SESSION_VENUES['junior-academy'].find(v => v.venue.includes('Mornington'))?.times)
      .toEqual(['Wednesday 5:30pm', 'Friday 4:30pm', 'Friday 5:30pm']);
  });
  it('keeps school restrictions explicit', () => {
    expect(TRAINING_SCHEDULE.filter(s => s.studentsOnly).map(s => s.studentsOnly)).toEqual(['Peninsula Grammar', 'Toorak College']);
  });
});
