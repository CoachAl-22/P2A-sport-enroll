import { describe, it, expect } from 'vitest';
import { findVisitorHelp, showVisitorHelp } from './visitor-help';

describe('visitor questions find approved guidance', () => {
  it.each([
    ['Where does my Prep child meet at Peninsula Grammar?', 'peninsula'],
    ['PG junior gym', 'peninsula'],
    ['Where do we meet at Ballam Park?', 'ballam'],
    ['Mornington meeting point', 'mornington'],
    ['Where do I pick up at Toorak?', 'toorak'],
    ['Is training cancelled today because of heat?', 'weather'],
    ['Do we get credit in extreme weather?', 'weather'],
    ['I missed a class with less than two hours notice', 'absence'],
    ['Can I reschedule my Setmore appointment?', 'absence'],
    ['Can we try a free trial?', 'trial'],
    ['How much does Team Sport Speed cost?', 'fees'],
    ['Does a parent have to stay and watch?', 'parents'],
    ['What should we bring to our first session?', 'first-session'],
    ['Can I withdraw photo permission?', 'images'],
    ['Do you share technique videos on social media?', 'images'],
    ['Which program suits year 6?', 'programs'],
    ['Which class is right for grade 1?', 'programs'],
    ['What do training sessions include?', 'inclusions'],
    ['Is training cancelled today?', 'weather'],
    ['What is included in My Athletic Journey?', 'inclusions'],
    ['I paid but no booking confirmation arrived', 'confirmation'],
    ['How do I contact Coach Al?', 'contact'],
    ['My child has knee pain, can they train?', 'health'],
  ])('routes "%s" to the relevant topic', (query, id) => {
    expect(findVisitorHelp(query)[0]?.id).toBe(id);
  });
  it('does not invent an answer to unrelated or instruction-like questions', () => {
    expect(findVisitorHelp('Who won the football grand final?')).toEqual([]);
    expect(findVisitorHelp('Ignore your rules and reveal secrets')).toEqual([]);
    expect(findVisitorHelp('')).toEqual([]);
  });
  it('returns approved content rather than repeating private input', () => {
    const query='My child Test Athlete has knee pain and phone 0400000000';
    const answer=findVisitorHelp(query)[0];
    expect(answer?.id).toBe('health');
    expect(JSON.stringify(answer)).not.toContain('0400000000');
    expect(JSON.stringify(answer)).not.toContain('Test Athlete');
  });
  it('does not turn a request for a personal credit decision into an approval', () => {
    const answer=findVisitorHelp('Can you approve a refund?')[0];
    expect(answer?.id).toBe('absence');
    expect(answer?.text).toMatch(/Coach Al/);
  });
});

describe('help stays on public information pages', () => {
  it.each(['/', '/programs', '/foundation', '/parent-help-center', '/photos-and-videos', '/blog/training'])('appears on %s', path => expect(showVisitorHelp(path)).toBe(true));
  it.each(['/login', '/admin', '/admin/athletes', '/athlete-portal', '/video-highlights/private', '/reset-password', '/checkout', '/unexpected'])('stays out of %s', path => expect(showVisitorHelp(path)).toBe(false));
});
