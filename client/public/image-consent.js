(function () {
  const version = '2026-11-01';
  const html = `<h3>Photos and video permissions — optional</h3>
<p>For an athlete under 18, a parent or legal guardian records these choices. Adults can choose for themselves. Leaving every box unticked means no permission is granted and does not affect participation.</p>
<label style="display:flex;gap:10px;align-items:start;min-height:44px;padding:8px 0"><input type="checkbox" name="mediaPrivate"> Private coaching photos/video, including one-to-one running or hurdle technique analysis. Feedback is shared only with the client/athlete and their parent or guardian; it is not permission for publicity.</label>
<label style="display:flex;gap:10px;align-items:start;min-height:44px;padding:8px 0"><input type="checkbox" name="mediaWebsite"> Public use on the Power2ADAPT website to share progress and encourage other athletes.</label>
<label style="display:flex;gap:10px;align-items:start;min-height:44px;padding:8px 0"><input type="checkbox" name="mediaSocial"> Public use on Power2ADAPT social media to share progress and encourage other athletes.</label>
<p>The coach must also obtain the athlete’s agreement before recording and before public use. The athlete can say no or stop even if a parent has agreed. Printed promotions, paid advertising or a new purpose require separate permission.</p>
<label style="display:block;margin-top:12px">If granting permission, who is recording it?<select name="mediaActor" style="display:block;width:100%;min-height:44px;font-size:16px"><option value="">Choose…</option><option value="parent-guardian">Parent or legal guardian (athlete under 18)</option><option value="adult-athlete">Adult athlete (18 or over)</option></select></label>
<label style="display:block;margin-top:12px">Name of person granting permission<input name="mediaName" maxlength="120" autocomplete="name" style="display:block;width:100%;min-height:44px;font-size:16px"></label>
<p>Private videos are kept in athlete-specific Google Drive folders currently accessed only by Coach Al. Copies are sent to parents via iMessage or WhatsApp. Email <a href="mailto:info@power2adapt.com">info@power2adapt.com</a> to change permission, ask about retention or request removal. Public copies made by others may be outside our control. <a href="/photos-and-videos" target="_blank" rel="noopener">Read the photos and videos guidance</a>.</p>
<p data-media-error role="alert" tabindex="-1" style="color:#b91c1c"></p>`;
  document.querySelectorAll('[data-image-consent]').forEach(el => { el.innerHTML = html; });
  window.P2AImageConsent = {
    collect: function () {
      const box = document.querySelector('[data-image-consent]');
      if (!box) return null;
      const checked = name => !!box.querySelector('[name="'+name+'"]').checked;
      const privateCoaching=checked('mediaPrivate'), website=checked('mediaWebsite'), social=checked('mediaSocial');
      const decisionMaker=box.querySelector('[name="mediaActor"]').value;
      const decisionMakerName=box.querySelector('[name="mediaName"]').value.trim();
      const error=box.querySelector('[data-media-error]');
      if ((privateCoaching || website || social) && (!['parent-guardian','adult-athlete'].includes(decisionMaker) || !decisionMakerName)) {
        error.textContent='To grant permission, choose who is recording it and enter their name. You can leave all permission boxes unticked to continue without granting permission.'; error.focus();return null;
      }
      error.textContent='';
      return {policyVersion:version,recordedAt:new Date().toISOString(),privateCoaching,website,social,decisionMaker:decisionMaker||'not-provided',decisionMakerName,athleteAgreement:'Coach must check before each recording or public use'};
    }
  };
})();
