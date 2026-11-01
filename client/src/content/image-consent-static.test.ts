import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { describe, it, expect, vi } from 'vitest';

for (const file of ['public/junior-academy-application.html','client/public/junior-academy-application.html','public/senior-squad-application.html','public/speed-running-application.html']) {
  describe(file, () => {
    async function prepare() {
      const dom = new JSDOM(readFileSync(file,'utf8'), {runScripts:'outside-only',url:'https://example.test/'});
      const w = dom.window;
      w.alert=vi.fn();w.scrollTo=vi.fn();
      const send=vi.fn().mockResolvedValue({ok:true});(w as any).fetch=send;
      // Execute only the actual application script; no analytics or network scripts.
      const appScript=[...w.document.querySelectorAll('script:not([src])')].find(s=>s.textContent?.includes('function submitForm()'))!;
      w.eval(appScript.textContent!);
      if (w.document.querySelector('[data-image-consent]')) {
        w.eval(readFileSync('client/public/image-consent.js','utf8'));
      }
      (w.document.getElementById('consentCB') as HTMLInputElement).checked=true;
      for (const selector of ['#qProgramme input','#programme input','#qPhoto input[value="No"]']) {
        const field=w.document.querySelector(selector) as HTMLInputElement|null;if(field)field.checked=true;
      }
      return {w,send,dom};
    }
    it('records no media permissions by default without preventing participation',async()=>{
      const {w,send,dom}=await prepare();(w as any).submitForm();await Promise.resolve();
      expect(send).toHaveBeenCalledTimes(1);
      const payload=JSON.parse(send.mock.calls[0][1].body);
      expect(payload.imagePermissions).toMatchObject({privateCoaching:false,website:false,social:false,athleteAgreement:'Coach must check before each recording or public use'});
      expect(payload.imagePermissions.policyVersion).toBeTruthy();
      dom.window.close();
    });
    it('keeps coaching permission separate from public permission and records the decision maker',async()=>{
      const {w,send,dom}=await prepare();
      const privateBox=w.document.querySelector('[name="mediaPrivate"]') as HTMLInputElement|null;
      expect(privateBox).not.toBeNull();privateBox!.checked=true;
      (w.document.querySelector('[name="mediaActor"]') as HTMLSelectElement).value='parent-guardian';
      (w.document.querySelector('[name="mediaName"]') as HTMLInputElement).value='Test Parent';
      (w as any).submitForm();await Promise.resolve();
      expect(send).toHaveBeenCalledTimes(1);
      const payload=JSON.parse(send.mock.calls[0][1].body);
      expect(payload.imagePermissions).toMatchObject({privateCoaching:true,website:false,social:false,decisionMaker:'parent-guardian',decisionMakerName:'Test Parent'});
      dom.window.close();
    });
    it('does not submit a positive permission without an identified decision maker',async()=>{
      const {w,send,dom}=await prepare();
      const social=w.document.querySelector('[name="mediaSocial"]') as HTMLInputElement|null;
      expect(social).not.toBeNull();social!.checked=true;
      (w as any).submitForm();await Promise.resolve();
      expect(send).not.toHaveBeenCalled();
      dom.window.close();
    });
  });
}
