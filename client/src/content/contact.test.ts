import { describe, it, expect } from 'vitest';
import { DISCOVERY_CALL_URL, EMAIL_ENQUIRY_URL, withCallbackDetails } from './contact';
describe('visitor enquiry handoff', () => {
  it('selects the existing discovery service, rather than the class catalogue', () => {
    const url = new URL(DISCOVERY_CALL_URL);
    expect(url.hostname).toBe('power2adapt.setmore.com');
    expect(url.searchParams.get('products')).toBe('a9a6a66a-9c61-4bec-829a-84d78687c2c0');
    expect(url.searchParams.get('type')).toBe('service');
    expect(url.searchParams.get('step')).toBe('time-slot');
  });
  it('carries callback time in the existing message contract', () => {
    expect(withCallbackDetails('Athlete plays netball.', 'After 4pm Tuesdays'))
      .toBe('Best time to call: After 4pm Tuesdays\n\nAthlete plays netball.');
  });
  it('keeps the message intact when callback time is omitted', () => {
    expect(withCallbackDetails('Please email me.', '  ')).toBe('Please email me.');
  });
  it('handles a callback preference without an extra message', () => {
    expect(withCallbackDetails('', '  Weekday mornings  ')).toBe('Best time to call: Weekday mornings');
  });
  it('keeps the program form maximum within the server message limit', () => {
    expect(withCallbackDetails('m'.repeat(1800), 't'.repeat(150)).length).toBeLessThanOrEqual(2000);
  });
  it('email template requests mobile and callback preference at the existing .com address', () => {
    const url = new URL(EMAIL_ENQUIRY_URL);
    expect(url.pathname).toBe('info@power2adapt.com');
    expect(EMAIL_ENQUIRY_URL).toContain('My%20mobile%20number');
    expect(url.searchParams.get('body')).toContain('My mobile number:');
    expect(url.searchParams.get('body')).toContain('Best time to call:');
  });
});
