// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProgramEnquiryForm } from './program-enquiry-form';
let root: Root;
let host: HTMLDivElement;
async function mount() {
  // The app uses the Vite React plugin; the standalone test config uses classic JSX.
  vi.stubGlobal("React", React);
  (globalThis as {IS_REACT_ACT_ENVIRONMENT?: boolean}).IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement('div'); document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(React.createElement(ProgramEnquiryForm)));
  const values: Record<string,string> = {parent_name:'Test Parent',email:'test@example.com',phone:'0412345678',school_year:'7-9',venue:'frankston',goal:'development',best_time:'After 4pm Tuesdays',message:'Netball development'};
  for (const [name,value] of Object.entries(values)) {
    const field = host.querySelector(`[name="${name}"]`) as HTMLInputElement;
    field.value = value;
  }
}
afterEach(async () => { if(root) await act(async()=>root.unmount()); host?.remove(); vi.unstubAllGlobals(); });
describe('visitor enquiry form', () => {
  it('sends mobile and callback preference through the existing API and shows receipt only on acknowledgement', async () => {
    const send=vi.fn().mockResolvedValue({ok:true,json:async()=>({ok:true})});
    vi.stubGlobal('fetch',send); await mount();
    await act(async()=>host.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
    const body=send.mock.calls[0][1].body as URLSearchParams;
    expect(send.mock.calls[0][0]).toBe('/api/programs/enquiry');
    expect(body.get('phone')).toBe('0412345678');
    expect(body.get('message')).toBe('Best time to call: After 4pm Tuesdays\n\nNetball development');
    expect(body.has('best_time')).toBe(false);
    expect(host.querySelector('[role="status"]')?.textContent).toContain('enquiry has been received');
    expect(document.activeElement).toBe(host.querySelector('[role="status"]'));
  });
  it('keeps the form and callback details when the provider fails', async () => {
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,json:async()=>({message:'Delivery unavailable — please email Coach Al.'})}));
    await mount();
    await act(async()=>host.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
    expect(host.querySelector('[role="status"]')).toBeNull();
    expect(host.querySelector('[role="alert"]')?.textContent).toContain('Delivery unavailable');
    expect(document.activeElement).toBe(host.querySelector('[role="alert"]'));
    expect(host.querySelector('[role="alert"] a')?.getAttribute('href')).toContain('mailto:info@power2adapt.com');
    expect((host.querySelector('[name="best_time"]') as HTMLInputElement).value).toBe('After 4pm Tuesdays');
    expect(host.querySelector('button[type="submit"]')?.hasAttribute('disabled')).toBe(false);
  });
});
