export type MediaChoices = { privateCoaching: boolean; website: boolean; social: boolean; decisionMaker: string; decisionMakerName: string };
export const EMPTY_MEDIA_CHOICES: MediaChoices = { privateCoaching: false, website: false, social: false, decisionMaker: '', decisionMakerName: '' };
export function imagePermissionRecord(value: MediaChoices) {
  return { ...value, policyVersion: '2026-11-01', recordedAt: new Date().toISOString(), athleteAgreement: 'Coach must check before each recording or public use' };
}
export function validImagePermission(value: MediaChoices) {
  return !(value.privateCoaching || value.website || value.social) || (['parent-guardian', 'adult-athlete'].includes(value.decisionMaker) && !!value.decisionMakerName.trim());
}
export function PhotoVideoChoices({value,onChange}:{value:MediaChoices;onChange:(v:MediaChoices)=>void}) {
  const any = value.privateCoaching || value.website || value.social;
  return <fieldset className="rounded-xl border p-5 space-y-4">
    <legend className="px-2 text-lg font-bold">Photos and videos — optional</legend>
    <p>For an athlete under 18, a parent or legal guardian records these choices. Adults choose for themselves. Unticked boxes grant no permission and do not affect participation.</p>
    {([['privateCoaching','Private coaching feedback, including one-to-one running and hurdle technique videos; shared only with the client/athlete and parent or guardian.'],['website','Public use on the Power2ADAPT website to encourage other athletes.'],['social','Public use on Power2ADAPT social media to encourage other athletes.']] as const).map(([key,label])=><label key={key} className="flex min-h-11 items-start gap-3 py-2"><input className="mt-1 h-5 w-5" type="checkbox" checked={value[key]} onChange={e=>onChange({...value,[key]:e.target.checked})}/><span>{label}</span></label>)}
    <p>The coach must obtain the athlete’s agreement before recording and before public use. The athlete can say no or stop. Private coaching permission does not authorise publicity. Print promotions, paid advertising and new purposes need separate permission.</p>
    <label className="block">Person recording permission<select required={any} className="mt-1 block min-h-11 w-full rounded border p-2 text-base" value={value.decisionMaker} onChange={e=>onChange({...value,decisionMaker:e.target.value})}><option value="">Choose…</option><option value="parent-guardian">Parent or legal guardian (athlete under 18)</option><option value="adult-athlete">Adult athlete (18 or over)</option></select></label>
    <label className="block">Name of person granting permission<input required={any} maxLength={120} autoComplete="name" className="mt-1 block min-h-11 w-full rounded border p-2 text-base" value={value.decisionMakerName} onChange={e=>onChange({...value,decisionMakerName:e.target.value})}/></label>
    <p className="text-sm">Private videos are kept in athlete-specific Google Drive folders currently accessed only by Coach Al. Copies are sent to parents via iMessage or WhatsApp. <a href="/photos-and-videos" target="_blank" rel="noopener noreferrer" className="underline">Photos and videos guidance</a>. To change permission, request removal or ask about retention, email info@power2adapt.com.</p>
  </fieldset>;
}
