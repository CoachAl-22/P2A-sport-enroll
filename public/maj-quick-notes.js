(function () {
  'use strict';
  const API = '/api/maj';
  const state = {
    coachId: null, coachName: 'Coach', roster: [], showingInactive: false,
    reviews: [], raw: [], confirmed: [], parent: null, parentAthletes: [],
    selectedChild: null, invite: null, busy: false, draft: '', generation: 0, parentLoadId: 0,
    notificationAthleteId: null, sessionRole: null, persistableCoach: false
  };
  const initialParams = new URLSearchParams(location.search);
  const parentLinkMode = initialParams.get('parent') === '1';
  state.notificationAthleteId = parentLinkMode ? initialParams.get('athlete') : null;
  const $ = id => document.getElementById(id);
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const id = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0; return (c==='x'?r:(r&3|8)).toString(16); });
  const coachStoreKey = () => 'maj.quicknotes.coach.' + encodeURIComponent(state.coachId || 'unknown');
  const isCoach = () => !!state.coachId;
  function loadQueue() {
    if(!state.persistableCoach) { state.reviews=[];state.raw=[];state.confirmed=[];state.draft='';return; }
    try {
      const saved = JSON.parse(localStorage.getItem(coachStoreKey()) || '{}');
      state.reviews = Array.isArray(saved.reviews) ? saved.reviews : [];
      state.raw = Array.isArray(saved.raw) ? saved.raw : [];
      state.confirmed = Array.isArray(saved.confirmed) ? saved.confirmed : [];
      state.draft = typeof saved.draft === 'string' ? saved.draft : '';
      state.reviews.forEach(card => {
        if (card.status === 'processing' || card.status === 'sending') card.status = 'queued';
      });
    } catch (_) { state.reviews=[]; state.raw=[]; state.confirmed=[];state.draft=''; }
  }
  function persist() {
    if (!isCoach()||!state.persistableCoach) return false;
    try {
      localStorage.setItem(coachStoreKey(), JSON.stringify({reviews:state.reviews,raw:state.raw,confirmed:state.confirmed,draft:state.draft}));
      return true;
    } catch (_) { return false; }
  }
  async function request(url, method, body) {
    let response;
    try {
      response = await fetch(url, {method:method || 'GET', credentials:'include',
        headers: body === undefined ? {} : {'Content-Type':'application/json'},
        body: body === undefined ? undefined : JSON.stringify(body)});
    } catch (error) { error.isNetwork = true; throw error; }
    let data = {};
    try { data = await response.json(); } catch (_) {}
    if (!response.ok) {
      const error = new Error(data.message || data.error || data.detail || `Request failed (${response.status})`);
      error.status = response.status; error.payload = data;
      error.isNetwork = response.status === 503 && data.error === 'offline';
      throw error;
    }
    return data;
  }
  function showError(el, message) { if (el) { el.textContent=message; el.hidden=false; } }
  function offlineError(e) { return !!(e && (e.isNetwork || e.name === 'TypeError')); }
  function rosterActive(a) { return a.rosterActive !== false; }
  function quickNoteEligible(a) { return rosterActive(a) && a.enabled !== false; }
  function activeRoster() { return state.roster.filter(quickNoteEligible); }
  function coachStill(identity, generation) {
    return isCoach() && state.sessionRole==='coach' && state.coachId === identity && state.generation === generation && !state.parent;
  }
  function parentDeliveryText(payload,result) {
    if(!payload.send_to_parent)return 'Saved for coach view only; no parent message sent.';
    const push=result&&result.push||{};
    return push.sent?'Parent message saved; notification sent.':push.configured?'Parent message saved; notification delivery was not confirmed.':'Parent message saved; push notifications are not configured.';
  }

  function coachReady(athletes, coach) {
    state.generation++;
    state.parent = null;
    state.sessionRole = 'coach';
    state.reviews=[];state.raw=[];state.confirmed=[];state.draft='';
    state.roster = Array.isArray(athletes) ? athletes.slice() : [];
    const coachKey=coach&&(coach.id||coach.coachId||coach.username||coach.email);
    state.persistableCoach=!!coachKey;
    state.coachId = String(coachKey || `session-${id()}`);
    state.coachName = (coach && (coach.fullName || coach.full_name || coach.username)) || 'Coach';
    loadQueue();
    const home = $('page-home');
    if (!home) return;
    if (!$('maj-coach-tools')) {
      const homeContent = home.querySelector(':scope > div:not(.top-bar)');
      const wrap = document.createElement('section');
      wrap.id='maj-coach-tools';
      wrap.innerHTML = `<section class="maj-feature" aria-labelledby="maj-quick-title">
        <div class="maj-pill">Track-side notes</div><h2 id="maj-quick-title">Quick Note</h2>
        <p class="maj-muted">Dictate with your phone keyboard, then review each observation before it is saved or shared.</p>
        <label class="input-label" for="maj-raw-note" style="display:block;margin:12px 0 6px">Observation</label>
        <textarea id="maj-raw-note" class="maj-field" placeholder="e.g. Ava kept her arms relaxed through the sprint; next time, eyes forward." aria-label="Quick Note observation"></textarea>
        <div style="display:flex;align-items:center;gap:10px;margin-top:10px">
          <button class="maj-action" id="maj-parse-note" type="button">Save note</button>
          <button class="maj-action secondary" id="maj-retry-queue" type="button">Retry saved notes</button>
          <span class="maj-muted">You will confirm each athlete's note individually.</span>
        </div><div id="maj-note-error" class="maj-status" role="status" aria-live="polite"></div>
      </section>
      <div id="maj-review-list" aria-live="polite"></div>
      <section class="maj-feature maj-form">
        <div class="maj-pill">Roster</div><h3 style="font-size:20px;margin-bottom:5px">Athletes</h3>
        <div class="maj-tools">
          <button type="button" class="maj-action secondary" id="maj-inactive-toggle">Manage inactive</button>
          <button type="button" class="maj-action secondary" id="maj-add-toggle">Add athlete</button>
        </div>
        <div id="maj-add-form" hidden>
          <div class="maj-grid"><div><label for="maj-new-name">Athlete name</label><input class="maj-field" id="maj-new-name" autocomplete="name"></div>
          <div><label for="maj-new-group">Group</label><input class="maj-field" id="maj-new-group" placeholder="e.g. Thursday juniors"></div></div>
          <button type="button" class="maj-action" id="maj-create-athlete" style="margin-top:10px">Create athlete</button>
          <div id="maj-roster-error" class="maj-status" role="status"></div>
        </div>
      </section>`;
      if (homeContent) home.insertBefore(wrap, homeContent);
      $('maj-parse-note').addEventListener('click', parseNote);
      $('maj-retry-queue').addEventListener('click', syncQueue);
      $('maj-raw-note').addEventListener('input', () => {
        state.draft = $('maj-raw-note').value;
        if (!persist()) {
          const message = $('maj-note-error');
          if (message) message.textContent = 'This browser could not save your draft locally. Keep this text on screen and copy it before leaving.';
        }
      });
      $('maj-inactive-toggle').addEventListener('click', toggleInactive);
      $('maj-add-toggle').addEventListener('click', () => { $('maj-add-form').hidden=!$('maj-add-form').hidden; });
      $('maj-create-athlete').addEventListener('click', createAthlete);
    }
    $('maj-raw-note').value = state.draft || '';
    renderRosterControls();
    renderReviews();
    if (state.raw.length || state.confirmed.length) {
      const msg=$('maj-note-error'); if(msg) msg.textContent='Saved work is waiting on this device for this coach.';
    }
    if(!state.persistableCoach) {
      const msg=$('maj-note-error');if(msg)msg.textContent='This coach session has no stable account identifier, so local saving is disabled to protect another coach’s notes.';
    }
    if (navigator.onLine) syncQueue();
  }
  function renderRosterControls() {
    const btn=$('maj-inactive-toggle');
    if(btn) btn.textContent=state.showingInactive?'Hide inactive':'Manage inactive';
    const count=document.getElementById('athlete-count');
    if(count && state.showingInactive) count.textContent='Inactive athletes · select Active to return an athlete to the roster';
    const list=document.getElementById('athlete-list-body');
    if(list && state.showingInactive) {
      const inactive=state.roster.filter(a=>!rosterActive(a));
      list.innerHTML=inactive.length ? inactive.map(a=>{
        const name=a.fullName||a.full_name||'Athlete';
        const access=a.enabled===false?' · Access disabled':'';
        return `<div class="module-item" style="cursor:default"><div class="module-thumb" style="background:#414b49;font-weight:800">${esc(name.split(/\s+/).map(x=>x[0]).join('').slice(0,2))}</div><div class="module-body"><div class="module-name">${esc(name)}</div><div class="module-caption">${esc(a.program||'')}${access}</div></div><button class="maj-action secondary" type="button" data-reactivate="${esc(a.id)}">Reactivate</button></div>`;
      }).join('') : '<p class="maj-muted">No inactive athletes.</p>';
      list.querySelectorAll('[data-reactivate]').forEach(button=>button.addEventListener('click',async()=>{
        button.disabled=true;
        try {
          if(typeof window.toggleAthleteActive==='function') await window.toggleAthleteActive(button.dataset.reactivate,true);
        } finally { button.disabled=false; }
      }));
    }
  }
  function toggleInactive() {
    state.showingInactive=!state.showingInactive;
    const search=document.getElementById('athlete-search'); if(search) search.value='';
    renderRosterControls();
    if(!state.showingInactive && window.filterAthletes) window.filterAthletes('');
  }
  function rosterToggleDone(athleteId, active) {
    const athlete=state.roster.find(a=>String(a.id)===String(athleteId));
    if(athlete) athlete.rosterActive=!!active;
    if(state.showingInactive) renderRosterControls();
    else if(window.filterAthletes) window.filterAthletes('');
  }
  async function createAthlete() {
    const name=$('maj-new-name').value.trim(), group=$('maj-new-group').value.trim(), btn=$('maj-create-athlete'), err=$('maj-roster-error');
    if(!name||!group){showError(err,'Add both a name and group.');return;}
    btn.disabled=true; err.textContent='';
    try {
      const created=await request(`${API}/coach/athletes`,'POST',{name,group});
      const athlete=created.athlete||created;
      state.roster.push(athlete); $('maj-new-name').value=''; $('maj-new-group').value='';
      err.textContent=`${athlete.fullName||name} added to the active roster. A parent can be invited later.`;
      renderRosterControls();
      if(window.loadCoachDashboard) window.loadCoachDashboard();
    } catch(e){showError(err,e.message||'Could not create athlete.');}
    finally{btn.disabled=false;}
  }
  async function inviteParent(athleteId) {
    const email=window.prompt('Parent email address'); if(!email||!email.trim())return;
    try {
      const result=await request(`${API}/coach/athletes/${encodeURIComponent(athleteId)}/parent-invite`,'POST',{email:email.trim()});
      const link=new URL(result.invitePath,location.origin).href;
      let copied=false;
      try { await navigator.clipboard.writeText(link); copied=true; } catch (_) {}
      window.alert(`Parent invitation link${copied?' copied':''}.\n\n${link}\n\nPlease send this link to the parent yourself. It expires ${result.expiresAt||'soon'}.`);
    } catch(e) { window.alert(`Could not create parent invitation: ${e.message}`); }
  }
  async function parseNote() {
    const input=$('maj-raw-note'), btn=$('maj-parse-note'), err=$('maj-note-error');
    const note=input.value.trim(); if(!note){showError(err,'Write or dictate a note first.');return;}
    const identity=state.coachId, generation=state.generation;
    btn.disabled=true; err.textContent='Preparing observations…';
    try {
      const result=await request(`${API}/observe`,'POST',{note});
      if(!coachStill(identity,generation))return;
      const roster=result.roster||[];
      (result.observations||[]).forEach(obs=>state.reviews.push(makeReview(obs,roster)));
      const previousDraft=state.draft;
      state.draft='';
      if(!persist()) {
        state.draft=previousDraft||note;
        input.value=state.draft;
        err.textContent='The response is ready to review, but this browser could not store it locally. Keep this note and review open; copy the text before leaving.';
      } else {
        input.value='';
        err.textContent=(result.observations||[]).length ? 'Review each card below. Nothing is sent to a parent until you confirm it.' : 'No observations were found. Try adding the athlete name and one clear coaching detail.';
      }
      renderReviews();
    } catch(e) {
      if(!coachStill(identity,generation))return;
      if(offlineError(e)) {
        const queued={id:id(),note,createdAt:new Date().toISOString()};
        state.raw.push(queued);
        if(persist()) {
          state.draft=''; input.value='';
          if(!persist()) { state.draft=note; input.value=note; state.raw=state.raw.filter(x=>x.id!==queued.id); persist(); err.textContent='Could not safely save this note offline. It remains in the text box; copy it before leaving.'; }
          else err.textContent='No connection. Your original note is saved on this device and will be prepared for review when you reconnect.';
        } else {
          state.raw=state.raw.filter(x=>x.id!==queued.id);
          state.draft=note;input.value=note;
          err.textContent='Could not save this note offline in this browser. The text remains here; copy it before leaving.';
        }
      } else showError(err,e.message||'Could not prepare the note.');
    } finally { btn.disabled=false; }
  }
  function makeReview(obs, serverRoster) {
    const source=serverRoster.length?serverRoster:activeRoster();
    return {cardId:id(),clientNoteId:id(), athlete_id:obs.athlete_id||null, athlete_name:obs.athlete_name||'',
      skill:obs.skill||'',working_well:obs.working_well||'',to_improve:obs.to_improve||'',
      suggested_cue:obs.suggested_cue||'',parent_message:obs.parent_message||'',
      matched:!!obs.matched, send_to_parent:true, status:'review', roster:source};
  }
  function field(card,key,title,textarea) {
    const val=esc(card[key]);
    const disabled=['saved','queued','processing'].includes(card.status)?' disabled':'';
    return `<label for="q-${card.cardId}-${key}">${title}</label>${textarea
      ? `<textarea class="maj-field" id="q-${card.cardId}-${key}" data-card="${card.cardId}" data-key="${key}"${disabled}>${val}</textarea>`
      : `<input class="maj-field" id="q-${card.cardId}-${key}" data-card="${card.cardId}" data-key="${key}" value="${val}"${disabled}>`}`;
  }
  function renderReviews() {
    const root=$('maj-review-list'); if(!root) return;
    if(!state.reviews.length) {root.innerHTML='';return;}
    root.innerHTML=state.reviews.map(card=>{
      const eligible=activeRoster();
      const options=eligible.map(a=>`<option value="${esc(a.id)}" ${String(a.id)===String(card.athlete_id)?'selected':''}>${esc(a.fullName||a.full_name||'Athlete')} · ${esc(a.program||'')}</option>`).join('');
    const fieldsLocked=card.status==='saved'||card.status==='queued'||card.status==='processing';
      const matchedLine=card.matched?'Athlete matched — please check the details.':'Choose the athlete before confirming.';
      return `<article class="maj-review" data-review="${card.cardId}">
        <div class="maj-pill">${card.status==='queued'?'Waiting to sync':card.status==='saved'?'Saved':'Review before saving'}</div>
        <h3 style="font-size:20px">${esc(card.athlete_name||'Observation')}</h3>
        <label for="q-${card.cardId}-athlete">Athlete · ${esc(matchedLine)}</label>
        <select class="maj-field" id="q-${card.cardId}-athlete" data-card="${card.cardId}" data-key="athlete_id" ${fieldsLocked?'disabled':''}><option value="">Choose an active athlete</option>${options}</select>
        ${field(card,'athlete_name','Athlete name',false)}
        ${field(card,'skill','Skill',false)}
        ${field(card,'working_well','Working well',true)}
        ${field(card,'to_improve','To improve',true)}
        ${field(card,'suggested_cue','Suggested cue',true)}
        ${field(card,'parent_message','Message for parent',true)}
        <label class="maj-toggle"><input type="checkbox" data-card="${card.cardId}" data-key="send_to_parent" ${card.send_to_parent?'checked':''} ${fieldsLocked?'disabled':''}> Send to parent</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="maj-action" type="button" data-confirm="${card.cardId}" ${fieldsLocked?'disabled':''}>${card.status==='saved'?'Saved':card.status==='processing'?'Saving…':card.status==='queued'?'Queued for retry':'Confirm observation'}</button><button class="maj-action secondary" type="button" data-remove="${card.cardId}" ${fieldsLocked?'disabled':''}>Remove</button></div>
        <div class="maj-status" role="status">${esc(card.message|| (card.status==='queued'?'Confirmed edits will sync when connection returns.':card.status==='saved'?'Saved. '+(card.pushText||''):'Not saved or shared yet.'))}</div>
      </article>`;
    }).join('');
    root.querySelectorAll('[data-card]').forEach(el=>el.addEventListener('input',reviewInput));
    root.querySelectorAll('[data-card][type=checkbox]').forEach(el=>el.addEventListener('change',reviewInput));
    root.querySelectorAll('[data-confirm]').forEach(el=>el.addEventListener('click',()=>confirmReview(el.dataset.confirm)));
    root.querySelectorAll('[data-remove]').forEach(el=>el.addEventListener('click',()=>{state.reviews=state.reviews.filter(c=>c.cardId!==el.dataset.remove);persist();renderReviews();}));
  }
  function reviewInput(event) {
    const el=event.currentTarget, card=state.reviews.find(c=>c.cardId===el.dataset.card); if(!card)return;
    if(card.status==='queued'||card.status==='processing'||card.status==='saved')return;
    const key=el.dataset.key; card[key]=key==='send_to_parent'?el.checked:el.value;
    if(key==='athlete_id') {
      const athlete=activeRoster().find(a=>String(a.id)===String(el.value));
      if(athlete && !card.athlete_name) card.athlete_name=athlete.fullName||athlete.full_name||'';
      const name=document.getElementById(`q-${card.cardId}-athlete_name`); if(name && athlete && !name.value) name.value=card.athlete_name;
    }
    const queued=state.confirmed.find(q=>q.clientNoteId===card.clientNoteId);
    if(queued) queued[key]=card[key];
    if(!persist()) {
      card.message='This edit remains visible but could not be saved on this device. Keep the card open and copy the text before leaving.';
      const status=el.closest('.maj-review')?.querySelector('.maj-status');
      if(status)status.textContent=card.message;
    } else {
      const status=el.closest('.maj-review')?.querySelector('.maj-status');
      if(status)status.textContent='Edit saved on this device.';
    }
  }
  async function confirmReview(cardId) {
    const card=state.reviews.find(c=>c.cardId===cardId); if(!card)return;
    if(['saved','queued','processing'].includes(card.status))return;
    const identity=state.coachId,generation=state.generation;
    const selected=activeRoster().find(a=>String(a.id)===String(card.athlete_id));
    if(!selected){card.message='Choose a currently active athlete with account access before confirming.';renderReviews();return;}
    if(!card.athlete_id || !card.athlete_name.trim()){card.message='Select an active athlete and enter their name to confirm.';renderReviews();return;}
    if(!card.skill.trim()){card.message='Add a skill before confirming.';renderReviews();return;}
    const payload={clientNoteId:card.clientNoteId,athlete_id:card.athlete_id,athlete_name:card.athlete_name.trim(),skill:card.skill.trim(),
      working_well:card.working_well,to_improve:card.to_improve,suggested_cue:card.suggested_cue,parent_message:card.parent_message,
      send_to_parent:!!card.send_to_parent};
    card.status='processing';
    if(!state.confirmed.some(x=>x.clientNoteId===card.clientNoteId))state.confirmed.push(payload);
    if(!persist()) {
      state.confirmed=state.confirmed.filter(x=>x.clientNoteId!==card.clientNoteId);
      card.status='review';
      card.message='Could not securely save this confirmation on the device, so it was not sent. Keep the card open and copy its contents.';
      renderReviews();return;
    }
    renderReviews();
    try {
      const result=await request(`${API}/observe/confirm`,'POST',payload);
      if(!coachStill(identity,generation))return;
      if(!result.saved&&!result.duplicate)throw new Error('The server did not confirm that this observation was saved.');
      card.pushText=parentDeliveryText(payload,result);
      card.message=`${result.duplicate?'Already saved (safe retry). ':'Saved successfully. '}${card.pushText}`;
      card.status='saved';
      state.confirmed=state.confirmed.filter(x=>x.clientNoteId!==card.clientNoteId);
      if(!persist()) card.message=`${card.message} The server acknowledged the save, but local acknowledgement could not be stored; a safe retry may occur.`;
      renderReviews();
    } catch(e) {
      if(!coachStill(identity,generation))return;
      if(offlineError(e)) {
        card.status='queued';
        card.message=persist()?'Confirmed edits are saved on this device and will retry when connection returns.':'Connection failed and this browser could not store the retry. The card remains locked with the exact request details; do not edit it.';
        renderReviews();
      } else {
        state.confirmed=state.confirmed.filter(x=>x.clientNoteId!==card.clientNoteId);
        card.status='review';card.clientNoteId=id();card.message=`Not saved: ${e.message}`;
        if(!persist())card.message+=' The error state could not be stored locally; keep this card open.';
        renderReviews();
      }
    }
  }
  async function syncQueue() {
    if(!isCoach()||!navigator.onLine||state.busy)return;
    const identity=state.coachId,generation=state.generation;
    state.busy=true;
    try {
      const pending=state.raw.slice();
      for(const item of pending) {
        try {
          const result=await request(`${API}/observe`,'POST',{note:item.note});
          if(!coachStill(identity,generation))return;
          const newCards=(result.observations||[]).map(obs=>makeReview(obs,result.roster||[]));
          state.reviews.push(...newCards);
          state.raw=state.raw.filter(x=>x.id!==item.id);
          if(!persist()) {
            state.reviews=state.reviews.filter(card=>!newCards.includes(card));
            state.raw.push(item);
            const failed=$('maj-note-error');if(failed)failed.textContent='The offline note is ready, but this browser could not store its review. The raw note remains queued; do not leave until copied.';
          } else {
            renderReviews();
            const msg=$('maj-note-error');if(msg)msg.textContent='Offline note prepared. Review each card; it has not been confirmed or shared.';
          }
        } catch(e) {
          if(!coachStill(identity,generation)||offlineError(e))return;
          state.raw=state.raw.filter(x=>x.id!==item.id);
          const input=$('maj-raw-note'),visible=input&&input.value.trim();
          state.draft=visible&&visible!==item.note?`${visible}\n\n${item.note}`:item.note;
          if(input)input.value=state.draft;
          const stored=persist();
          const msg=$('maj-note-error'); if(msg)msg.textContent=`Offline note preparation was rejected: ${e.message}. The note was restored in the text box${stored?' and saved locally.':'; local saving failed, so keep this screen open and copy it.'}`;
          return;
        }
      }
      for(const payload of state.confirmed.slice()) {
        try {
          const card=state.reviews.find(c=>c.clientNoteId===payload.clientNoteId);
          if(card){card.status='processing';persist();renderReviews();}
          const result=await request(`${API}/observe/confirm`,'POST',payload);
          if(!coachStill(identity,generation))return;
          if(!result.saved&&!result.duplicate)throw new Error('The server did not confirm that this observation was saved.');
          state.confirmed=state.confirmed.filter(x=>x.clientNoteId!==payload.clientNoteId);
          if(card){card.status='saved';card.pushText=parentDeliveryText(payload,result);card.message=`${result.duplicate?'Saved previously (safe retry). ':'Saved successfully after reconnect. '}${card.pushText}`;}
          if(!persist()&&card){card.status='queued';card.message='Server acknowledged this save; the acknowledgement could not be stored here. A safe retry may occur.';}
          renderReviews();
        } catch(e) {
          if(!coachStill(identity,generation))return;
          const c=state.reviews.find(x=>x.clientNoteId===payload.clientNoteId);
          if(offlineError(e)){if(c){c.status='queued';c.message='Still offline; this exact confirmation will retry.';renderReviews();}return;}
          state.confirmed=state.confirmed.filter(x=>x.clientNoteId!==payload.clientNoteId);
          if(c){c.status='review';c.clientNoteId=id();c.message=`The server rejected this confirmation: ${e.message}. Review the athlete and fields, then confirm again.`;persist();renderReviews();}
          return;
        }
      }
    } finally { state.busy=false; }
  }
  async function loadCoachHistory(athlete) {
    const panel=$('assess-history-panel'); if(!panel)return;
    let section=document.getElementById('maj-quick-history');
    if(!section){section=document.createElement('section');section.id='maj-quick-history';section.style.marginTop='14px';panel.appendChild(section);}
    section.innerHTML='<div class="maj-muted">Loading coach observations…</div>';
    try {
      const data=await request(`${API}/athlete/${encodeURIComponent(athlete.id)}/quick-notes`);
      const notes=Array.isArray(data)?data:(data.notes||data.observations||[]);
      section.innerHTML=`<div class="maj-pill">Quick Note history · ${notes.length}</div>`+(notes.length?notes.map(n=>`<article class="maj-note-item"><strong>${esc(n.skill||'Coach note')}</strong><div class="maj-muted" style="margin-top:5px">Working well: ${esc(n.strengths||'—')}<br>Next focus: ${esc(n.areas_for_improvement||'—')}<br>Next steps: ${esc(n.next_steps||'—')}</div>${n.parent_message&&n.send_to_parent?`<div class="maj-muted" style="margin-top:6px">Parent message: ${esc(n.parent_message)}</div>`:''}<div class="maj-muted" style="margin-top:6px">${esc(n.coach_name||'Coach')} · ${esc(n.created_at||'')}</div></article>`).join(''):'<div class="maj-muted">No Quick Notes yet.</div>');
    } catch(e){section.innerHTML=`<div class="maj-muted">Quick Note history could not load: ${esc(e.message)}</div>`;}
  }
  function activatePage(page) {
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    page.classList.add('active');
  }
  function showParentSignIn() {
    if(isCoach())lockCoach();
    state.generation++;
    state.sessionRole='parent-pending';
    state.parent=null;
    const home=$('page-home'), login=$('page-login');
    if(home)home.classList.remove('active');
    login.classList.add('active');
    document.getElementById('bottom-nav').style.display='none';
    let parent=document.getElementById('maj-parent-login');
    if(!parent) {
      parent=document.createElement('div'); parent.id='maj-parent-login'; parent.className='maj-parent-shell';
      parent.innerHTML=`<section class="maj-feature"><div class="maj-pill">Family view</div><h2>Parent sign in</h2><p class="maj-muted">See your child's progress and the encouraging notes their coach has chosen to share.</p>
      <label for="maj-parent-id">Email or username</label><input id="maj-parent-id" class="maj-field" autocomplete="username">
      <label for="maj-parent-password">Password</label><input id="maj-parent-password" class="maj-field" type="password" autocomplete="current-password">
      <div id="maj-parent-error" class="maj-status" role="status"></div><button id="maj-parent-submit" class="maj-action" type="button" style="width:100%;margin-top:12px">Sign in</button>
      <button class="maj-action secondary" type="button" style="width:100%;margin-top:8px" onclick="window.MAJQuickNotes.backToSignIn()">Back</button></section>`;
      login.appendChild(parent); parent.querySelector('#maj-parent-submit').addEventListener('click',parentLogin);
      parent.querySelector('#maj-parent-password').addEventListener('keydown',e=>{if(e.key==='Enter')parentLogin();});
    } else parent.hidden=false;
    const base=login.firstElementChild; if(base)base.hidden=true;
  }
  function backToSignIn(){const box=$('maj-parent-login');if(box)box.hidden=true;const base=$('page-login').firstElementChild;if(base)base.hidden=false;}
  async function parentLogin() {
    const btn=$('maj-parent-submit'), err=$('maj-parent-error'); if(btn.disabled)return;
    btn.disabled=true;err.textContent='';
    state.generation++;
    state.sessionRole='parent-pending';
    try {
      await request('/api/auth/login','POST',{identifier:$('maj-parent-id').value.trim(),password:$('maj-parent-password').value});
      await loadParent();
    } catch(e){showError(err,e.message||'Could not sign in. Check your details and try again.');}
    finally{btn.disabled=false;}
  }
  async function loadParent() {
    const requestId=++state.parentLoadId;
    const generation=state.generation;
    const response=await request(`${API}/parent/me`);
    if(requestId!==state.parentLoadId||generation!==state.generation||state.sessionRole==='coach'||state.sessionRole==='athlete')return;
    state.parent=response.parent;state.parentAthletes=response.athletes||[];
    state.sessionRole='parent';
    const preferred=state.parentAthletes.find(a=>String(a.id)===String(state.notificationAthleteId));
    state.selectedChild=(preferred||state.parentAthletes[0]||{}).id||null;
    renderParent();
  }
  async function restoreParent() {
    if(state.sessionRole==='coach'||state.sessionRole==='athlete')return false;
    try { await loadParent(); return !!state.parent; } catch (_) { return false; }
  }
  function sessionResolved(me, parentMode) {
    if(parentMode) {
      if(me&&me.role==='parent') { if(isCoach())lockCoach();state.sessionRole='parent'; restoreParent(); }
      else restoreParent();
      return;
    }
    if(me&&me.role==='parent') { if(isCoach())lockCoach();state.sessionRole='parent';restoreParent();return; }
    if(me&&me.role==='coach') {
      state.sessionRole='coach';
      const home=$('page-home');
      if(home&&home.classList.contains('active')&&!$('maj-coach-tools'))coachReady(me.athletes||[],me);
      return;
    }
    if(me&&me.role==='athlete') { state.sessionRole='athlete';return; }
    restoreParent();
  }
  function renderParent() {
    const home=$('page-home');if(!home)return;
    if(isCoach())lockCoach();
    state.sessionRole='parent';
    document.getElementById('bottom-nav').style.display='none';
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    home.classList.add('active');
    home.innerHTML=`<header class="top-bar"><span class="top-bar-title">My Athletic Journey · Family</span><button class="maj-action secondary" type="button" onclick="window.MAJQuickNotes.parentLogout()">Sign out</button></header>
    <main class="maj-parent-shell"><div class="maj-pill">A safe view for your family</div><h1 style="font:800 32px var(--font-display);margin:0 0 5px">Hello, ${esc(state.parent&&state.parent.firstName||'there')}</h1>
    <p class="maj-muted" style="margin-bottom:16px">Progress, milestones and notes your coach has chosen to share.</p>
    ${state.parentAthletes.length>1?`<label for="maj-child-switch" class="maj-muted">Choose athlete</label><select id="maj-child-switch" class="maj-field" style="margin:6px 0 14px">${state.parentAthletes.map(a=>`<option value="${esc(a.id)}" ${String(a.id)===String(state.selectedChild)?'selected':''}>${esc(a.fullName)} · ${esc(a.program)}</option>`).join('')}</select>`:''}
    <section id="maj-journey" class="maj-feature" aria-live="polite"><div class="maj-muted">${state.selectedChild?'Loading journey…':'No athletes are connected to this parent account yet. Ask your coach to send an invitation.'}</div></section>
    <section class="maj-feature"><h3>Family updates</h3><p class="maj-muted">Allow MAJ notifications for updates from your child's coach.</p><button id="maj-parent-push" class="maj-action secondary" type="button">Enable notifications</button><div id="maj-parent-push-status" class="maj-status" role="status"></div></section>
    <div id="maj-parent-invite-accept"></div></main>`;
    const select=$('maj-child-switch');if(select)select.addEventListener('change',()=>{state.selectedChild=select.value;loadJourney();});
    $('maj-parent-push').addEventListener('click',enableParentPush);
    if(state.selectedChild)loadJourney();
    renderInviteAccept();
  }
  function renderInviteAccept() {
    const target=$('maj-parent-invite-accept');if(!target)return;
    if(!state.invite||!state.invite.existingAccount||!state.parent){target.innerHTML='';return;}
    target.innerHTML=`<section class="maj-feature"><div class="maj-pill">Parent invitation</div><h3>Connect ${esc(state.invite.athleteName||'your athlete')}</h3><p class="maj-muted">This invitation belongs to your signed-in parent account.</p><div id="maj-parent-invite-error" class="maj-status" role="status"></div><button id="maj-parent-accept" class="maj-action" type="button">Accept invitation</button></section>`;
    $('maj-parent-accept').addEventListener('click',acceptInvite);
  }
  async function loadJourney() {
    const box=$('maj-journey');if(!box)return;
    const selectedId=state.selectedChild,generation=state.generation;
    if(!selectedId){box.innerHTML='<div class="maj-muted">No athletes are connected to this parent account yet. Ask your coach to send an invitation.</div>';return;}
    if(!state.parentAthletes.some(a=>String(a.id)===String(selectedId))){box.innerHTML='<div class="maj-muted">That athlete is not connected to this parent account.</div>';return;}
    box.innerHTML="<div class=\"maj-muted\">Loading this athlete's journey…</div>";
    try {
      const data=await request(`${API}/parent/athlete/${encodeURIComponent(selectedId)}/journey`);
      if(generation!==state.generation||state.selectedChild!==selectedId||state.sessionRole!=='parent')return;
      const athlete=data.athlete||{}, notes=data.notes||[], badges=data.badges||[];
      box.innerHTML=`<div class="maj-pill">${esc(athlete.program||'Athlete journey')}</div><h2 style="font-size:27px">${esc(athlete.fullName||'Athlete')}</h2>
      <div class="maj-grid" style="margin:12px 0"><div class="maj-note-item"><strong>${esc(athlete.xp||0)} XP</strong><div class="maj-muted">Earned through effort</div></div><div class="maj-note-item"><strong>Module ${esc(athlete.currentModule||1)} · Week ${esc(athlete.currentWeek||1)}</strong><div class="maj-muted">Current journey</div></div></div>
      <h3 style="font-size:19px;margin:14px 0 7px">Badges</h3><div class="maj-muted">${badges.length?badges.map(b=>esc(typeof b==='string'?b:(b.badgeName||b.name||b.title||'Milestone'))).join(' · '):'Every milestone starts with showing up.'}</div>
      <h3 style="font-size:19px;margin:16px 0 7px">Coach notes</h3>${notes.length?notes.map(n=>`<article class="maj-note-item"><div class="maj-pill">${esc(n.skill||'Progress note')}</div><div>${esc(n.parent_message||'Your coach shared an update.')}</div><div class="maj-muted" style="margin-top:6px">${esc(n.coach_name||'Coach')} · ${esc(n.created_at||'')}</div></article>`).join(''):'<div class="maj-muted">When your coach shares a note, it will appear here.</div>'}`;
    }catch(e){if(generation===state.generation&&state.selectedChild===selectedId)box.innerHTML=`<div class="maj-muted">This journey could not load. <button class="maj-action secondary" type="button" onclick="window.MAJQuickNotes.loadJourney()">Try again</button><br>${esc(e.message)}</div>`;}
  }
  async function enableParentPush() {
    const out=$('maj-parent-push-status');
    if(!('serviceWorker'in navigator)||!('PushManager'in window)||!('Notification'in window)){showError(out,'Notifications are not available in this browser.');return;}
    try {
      const permission=await Notification.requestPermission();if(permission!=='granted')throw new Error('Notification permission was not granted.');
      const keyData=await request(`${API}/push/public-key`); const key=keyData.publicKey||keyData.key;
      if(!key)throw new Error('The notification key is not configured yet.');
      const reg=await navigator.serviceWorker.ready;
      const sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64(key)});
      await request(`${API}/parent/push/subscribe`,'POST',{subscription:sub.toJSON()});
      out.textContent='Notifications are enabled for this parent account.';
    }catch(e){out.textContent=e.message||'Could not enable notifications.';}
  }
  function urlBase64(s){const pad='='.repeat((4-s.length%4)%4);return Uint8Array.from(atob((s+pad).replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));}
  async function parentLogout() {
    state.generation++;state.parentLoadId++;state.sessionRole='logging-out';state.parent=null;
    document.getElementById('bottom-nav').style.display='none';
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration=await navigator.serviceWorker.getRegistration();
        const subscription=registration&&await registration.pushManager.getSubscription();
        if(subscription) {
          try { await request(`${API}/parent/push/unsubscribe`,'POST',{endpoint:subscription.endpoint}); } catch (_) {}
          try { await subscription.unsubscribe(); } catch (_) {}
        }
      }
    } catch (_) {}
    try{await request('/api/auth/logout','POST',{});}catch(_){}
    try{await request(`${API}/logout`,'POST',{});}catch(_){}
    state.parent=null;state.parentAthletes=[];state.selectedChild=null;state.invite=null;
    location.reload();
  }
  function lockCoach() {
    state.generation++;state.draft='';
    state.coachId=null;state.persistableCoach=false;state.coachName='Coach';state.roster=[];state.reviews=[];state.raw=[];state.confirmed=[];
    const list=$('maj-review-list');if(list)list.replaceChildren();
    const note=$('maj-raw-note');if(note)note.value='';
  }
  async function inspectInvite() {
    const token=new URLSearchParams(location.search).get('invite');if(!token)return;
    try {
      const invite=await request(`${API}/parent/invite?token=${encodeURIComponent(token)}`);
      state.invite={token,...invite};showInvite();
    }catch(e){showInviteError(e.message);}
  }
  function showInviteError(message) {
    const login=$('page-login');if(!login)return;
    let box=$('maj-invite-message');if(!box){box=document.createElement('div');box.id='maj-invite-message';box.className='maj-feature';login.appendChild(box);}
    box.innerHTML=`<h3>Parent invitation</h3><p class="maj-muted">${esc(message||'This invitation is invalid or has expired. Ask your coach for a new link.')}</p>`;
  }
  function showInvite() {
    if(state.parent) { renderParent(); return; }
    if(state.sessionRole==='coach'||state.sessionRole==='athlete')return;
    const login=$('page-login');if(!login)return;
    const base=login.firstElementChild;if(base)base.hidden=true;
    let box=$('maj-invite-onboard');if(!box){box=document.createElement('section');box.id='maj-invite-onboard';box.className='maj-parent-shell';login.appendChild(box);}
    const inv=state.invite;
    box.innerHTML=`<section class="maj-feature"><div class="maj-pill">Private parent invitation</div><h2>Connect to ${esc(inv.athleteName||'your athlete')}</h2><p class="maj-muted">Invite for ${esc(inv.email||'your parent account')}. ${inv.existingAccount?'Sign in to accept this invitation.':'Create your parent account to continue.'}</p>
      ${inv.existingAccount?`<label for="maj-invite-identifier">Email or username</label><input id="maj-invite-identifier" class="maj-field" autocomplete="username"><label for="maj-invite-password">Password</label><input id="maj-invite-password" class="maj-field" type="password" autocomplete="current-password" minlength="10">`:`<label for="maj-invite-first">First name</label><input id="maj-invite-first" class="maj-field" autocomplete="given-name"><label for="maj-invite-last">Last name</label><input id="maj-invite-last" class="maj-field" autocomplete="family-name"><label for="maj-invite-newpass">Create password (at least 10 characters)</label><input id="maj-invite-newpass" class="maj-field" type="password" autocomplete="new-password" minlength="10">`}
      <div id="maj-invite-error" class="maj-status" role="status"></div><button id="maj-invite-submit" class="maj-action" type="button" style="width:100%;margin-top:12px">${inv.existingAccount?'Sign in and accept':'Create account and connect'}</button></section>`;
    $('maj-invite-submit').addEventListener('click',acceptInvite);
  }
  async function acceptInvite() {
    const btn=$('maj-invite-submit')||$('maj-parent-accept'),err=$('maj-invite-error')||$('maj-parent-invite-error');
    if(!btn||!state.invite)return;
    btn.disabled=true;
    try {
      if(state.invite.existingAccount&&!state.parent) await request('/api/auth/login','POST',{identifier:$('maj-invite-identifier').value.trim(),password:$('maj-invite-password').value});
      const body={token:state.invite.token};
      if(!state.invite.existingAccount) {
        const first=$('maj-invite-first')?.value.trim()||'',last=$('maj-invite-last')?.value.trim()||'',password=$('maj-invite-newpass')?.value||'';
        if(!first||!last||password.length<10)throw new Error('Enter both names and a password of at least 10 characters.');
        Object.assign(body,{firstName:first,lastName:last,password});
      }
      await request(`${API}/parent/accept-invite`,'POST',body);
      history.replaceState({},'',location.pathname);
      state.invite=null;
      await loadParent();
    }catch(e){showError(err,e.message||'Could not accept this invitation.');}
    finally{btn.disabled=false;}
  }
  window.MAJQuickNotes={coachReady,showingInactive:()=>state.showingInactive,rosterToggleDone,loadCoachHistory,inviteParent,
    showParentSignIn,backToSignIn,parentLogout,restoreParent,loadJourney,lockCoach,sessionResolved};
  window.addEventListener('online',syncQueue);
  let receivedSessionEvent=false;
  window.addEventListener('maj-session-resolved',event=>{
    receivedSessionEvent=true;
    sessionResolved(event.detail&&event.detail.me,event.detail&&event.detail.parentMode);
  });
  document.addEventListener('DOMContentLoaded',inspectInvite);
  if(parentLinkMode&&!initialParams.get('invite'))showParentSignIn();
  if(window.__MAJ_SESSION_RESULT&&!receivedSessionEvent)sessionResolved(window.__MAJ_SESSION_RESULT.me,window.__MAJ_SESSION_RESULT.parentMode);
  if(document.readyState!=='loading') inspectInvite();
})();
