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
