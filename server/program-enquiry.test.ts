import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerProgramEnquiryRoute } from './program-enquiry';

const enquiry = {
  parent_name: 'TEST visitor journey', email: 'visitor-test@example.com', phone: '',
  child_name: '', school_year: '7-9', venue: 'frankston', goal: 'development',
  days: ['Monday', 'Thursday'], sport: 'Netball',
  message: 'Best time to call: Tuesdays after 4pm\n\nTEST only — no real athlete.',
};
function app() {
  const app = express();
  app.use(express.urlencoded({ extended: true }));
  registerProgramEnquiryRoute(app);
  return app;
}
afterEach(() => vi.unstubAllGlobals());
describe('program enquiry handoff (isolated providers)', () => {
  it('forwards mobile, callback message and repeated available days', async () => {
    const upstream = vi.fn().mockResolvedValue({ok: true});
    vi.stubGlobal('fetch', upstream);
    await request(app()).post('/api/programs/enquiry').type('form').send(enquiry).expect(200, {ok: true});
    const body = upstream.mock.calls[0][1].body as URLSearchParams;
    expect(body.get('phone')).toBe('');
    expect(body.get('message')).toBe(enquiry.message);
    expect(body.getAll('days')).toEqual(['Monday', 'Thursday']);
  });
  it('does not report success when the provider fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ok: false, status: 500}));
    const response = await request(app()).post('/api/programs/enquiry').type('form').send(enquiry).expect(502);
    expect(response.body.ok).not.toBe(true);
    expect(response.body.message).toContain('info@power2adapt.com');
  });
  it('does not report success on timeout or network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Timeout')));
    await request(app()).post('/api/programs/enquiry').type('form').send(enquiry).expect(502);
  });
  it('rejects invalid forms without contacting a provider', async () => {
    const upstream = vi.fn(); vi.stubGlobal('fetch', upstream);
    await request(app()).post('/api/programs/enquiry').type('form').send({...enquiry,email:'invalid'}).expect(400);
    expect(upstream).not.toHaveBeenCalled();
  });
  it('does not forward the honeypot', async () => {
    const upstream = vi.fn(); vi.stubGlobal('fetch', upstream);
    await request(app()).post('/api/programs/enquiry').type('form').send({...enquiry,website:'bot'}).expect(200);
    expect(upstream).not.toHaveBeenCalled();
  });
});
