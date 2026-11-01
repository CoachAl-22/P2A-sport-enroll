// @vitest-environment jsdom
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import OneClickChat from './one-click-chat';

beforeAll(()=>{vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);vi.stubGlobal('React',React);});
afterAll(()=>vi.unstubAllGlobals());
let host: HTMLDivElement;
let root: Root;
beforeEach(async()=>{
  window.history.replaceState({}, '', '/programs');
  host=document.createElement('div'); document.body.append(host); root=createRoot(host);
  await act(async()=>root.render(React.createElement(OneClickChat)));
});
afterEach(async()=>{ await act(async()=>root.unmount()); host.remove(); });
const button=(label:string)=>Array.from(host.querySelectorAll('button')).find(b=>b.textContent?.includes(label) || b.getAttribute('aria-label')===label)!;
async function click(label:string){ await act(async()=>button(label).click()); }

describe('quiet visitor help',()=>{
  it('waits for the visitor to open it and offers typed questions',async()=>{
    expect(host.querySelector('input')).toBeNull();
    await click('Open Power2ADAPT help');
    expect(host.querySelector('input')?.getAttribute('maxlength')).toBe('220');
    expect(document.activeElement).not.toBe(host.querySelector('input'));
  });
  it('finds meeting information and provides its source link',async()=>{
    await click('Open Power2ADAPT help');
    const input=host.querySelector('input')!;
    await act(async()=>{
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(input,'Where does my Prep child meet at Peninsula Grammar?');
      input.dispatchEvent(new Event('input',{bubbles:true}));
    });
    await act(async()=>host.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
    expect(host.textContent).toContain('classroom/playground');
    expect(host.querySelector('a[href="/enrollment-guide#venue-meeting-points"]')).not.toBeNull();
  });
  it('clears a question on close and restores focus to Help',async()=>{
    await click('Open Power2ADAPT help');
    await click('Close help');
    expect(host.querySelector('input')).toBeNull();
    expect(document.activeElement).toBe(button('Open Power2ADAPT help'));
    await click('Open Power2ADAPT help');
    expect(host.querySelector('input')?.value).toBe('');
  });
  it('lets visitors dismiss with Escape',async()=>{
    await click('Open Power2ADAPT help');
    await act(async()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'})));
    expect(host.querySelector('input')).toBeNull();
  });
});

describe('direct booking help',()=>{
  it('offers enrolment in the opening menu without a typed question',async()=>{
    await click('Open Power2ADAPT help');
    expect(button('Enrol or book a session')).toBeDefined();
  });
  it('offers the school, session, squad and trial routes separately',async()=>{
    await click('Open Power2ADAPT help'); await click('Enrol or book a session');
    expect(Array.from(host.querySelectorAll('summary')).map(s=>s.textContent)).toEqual(['School classes','Team Sport Speed sessions','Junior Academy / Senior Squad applications','Arrange a free trial']);
  });
  it('links each school and stage to its existing booking route',async()=>{
    await click('Open Power2ADAPT help'); await click('Enrol or book a session');
    const school=Array.from(host.querySelectorAll('details')).find(d=>d.querySelector('summary')?.textContent==='School classes')!;
    expect(Array.from(school.querySelectorAll('a')).map(a=>a.getAttribute('href'))).toEqual(['/enrol/pg-foundation-mon','/enrol/toorak-foundation-thu','/enrol/pg-emerging-mon','/enrol/toorak-emerging-thu']);
    expect(school.textContent).toContain('students of that school');
    expect(school.textContent).toContain('term');
  });
  it('offers the three session routes without selecting a date or taking payment',async()=>{
    await click('Open Power2ADAPT help'); await click('Enrol or book a session');
    const sessions=Array.from(host.querySelectorAll('details')).find(d=>d.querySelector('summary')?.textContent==='Team Sport Speed sessions')!;
    expect(Array.from(sessions.querySelectorAll('a')).map(a=>a.getAttribute('href'))).toEqual(['/enrol/team-speed-wed-530','/enrol/team-speed-fri-430','/enrol/team-speed-fri-530']);
    expect(sessions.textContent).toContain('$33 including GST');
  });
  it('opens the actual squad application pages and keeps trials on the discovery-call route',async()=>{
    await click('Open Power2ADAPT help'); await click('Enrol or book a session');
    const groups=Array.from(host.querySelectorAll('details'));
    expect(Array.from(groups[2].querySelectorAll('a')).map(a=>a.getAttribute('href'))).toEqual(['/junior-academy-application.html','/senior-squad-application.html']);
    expect(groups[3].querySelector('a')?.getAttribute('href')).toContain('power2adapt.setmore.com/book?step=time-slot&products=a9a6a66a');
    expect(groups[3].querySelectorAll('a')).toHaveLength(1);
  });
});
