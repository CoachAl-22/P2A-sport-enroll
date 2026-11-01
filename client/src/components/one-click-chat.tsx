import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { MessageCircle, X, Search, ArrowUpRight } from 'lucide-react';
import { DISCOVERY_CALL_URL, EMAIL_ENQUIRY_URL } from '@/content/contact';
import { BOOKING_OPTIONS, findVisitorHelp, HelpAnswer, showVisitorHelp, VISITOR_HELP } from '@/content/visitor-help';

const QUICK_TOPICS=['enrol','programs','first-session','existing','contact'];

export default function OneClickChat() {
  const [location]=useLocation();
  const [open,setOpen]=useState(false);
  const [query,setQuery]=useState('');
  const [answers,setAnswers]=useState<HelpAnswer[] | null>(null);
  const [allTopics,setAllTopics]=useState(false);
  const trigger=useRef<HTMLButtonElement>(null);
  const panel=useRef<HTMLDivElement>(null);
  const heading=useRef<HTMLHeadingElement>(null);
  const result=useRef<HTMLDivElement>(null);

  function clear() { setQuery(''); setAnswers(null); setAllTopics(false); }
  function close() { setOpen(false); clear(); trigger.current?.focus({preventScroll:true}); }
  useEffect(()=>{ setOpen(false); clear(); },[location]);
  useEffect(()=>{
    if (!open) return;
    heading.current?.focus({preventScroll:true}); // Avoid opening the phone keyboard automatically.
    function onKey(event:KeyboardEvent) { if(event.key==='Escape') close(); }
    function outside(event:PointerEvent) {
      if(event.target instanceof Node && !panel.current?.contains(event.target) && !trigger.current?.contains(event.target)) { setOpen(false); clear(); }
    }
    window.addEventListener('keydown',onKey);
    window.addEventListener('pointerdown',outside);
    return ()=>{window.removeEventListener('keydown',onKey);window.removeEventListener('pointerdown',outside);};
  },[open]);
  useEffect(()=>{ if(answers!==null) result.current?.focus({preventScroll:true}); },[answers]);

  if (!showVisitorHelp(location)) return null;
  const topics=allTopics?VISITOR_HELP.filter(a=>a.id!=='health'):QUICK_TOPICS.map(id=>VISITOR_HELP.find(a=>a.id===id)!);
  return <>
    <div aria-hidden="true" className="h-20" />
    <button ref={trigger} type="button" aria-label="Open Power2ADAPT help" aria-expanded={open} aria-controls="visitor-help-panel"
      onClick={()=>open?close():setOpen(true)}
      className="fixed bottom-[max(12px,env(safe-area-inset-bottom))] right-3 z-40 flex h-12 min-w-12 items-center justify-center gap-2 rounded-full bg-[#0a6b66] px-4 font-bold text-white shadow-lg hover:bg-[#085550] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a6b66]">
      <MessageCircle aria-hidden="true" className="h-5 w-5"/><span>Help</span>
    </button>
    {open && <div ref={panel} id="visitor-help-panel" role="region" aria-labelledby="visitor-help-title"
      className="fixed bottom-[calc(72px+env(safe-area-inset-bottom))] left-3 right-3 z-50 flex max-h-[calc(100dvh-90px-env(safe-area-inset-bottom))] w-auto sm:left-auto sm:w-[380px] flex-col overflow-hidden rounded-2xl border border-[#e7e1d8] bg-white text-[#2e2600] shadow-2xl">
      <header className="flex shrink-0 items-center justify-between border-b border-[#e7e1d8] bg-[#faf8f5] px-4 py-2">
        <div><h2 ref={heading} tabIndex={-1} id="visitor-help-title" className="font-bold focus:outline-none">Ask Power2ADAPT</h2><p className="text-xs text-[#525759]">Find answers from our website</p></div>
        <button type="button" aria-label="Close help" onClick={close} className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-white focus-visible:outline"><X aria-hidden="true" className="h-5 w-5"/></button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
        <form onSubmit={event=>{event.preventDefault();setAnswers(findVisitorHelp(query));setAllTopics(false);}}>
          <label htmlFor="visitor-help-question" className="mb-2 block text-sm font-semibold">What would you like to know?</label>
          <div className="flex gap-2">
            <input id="visitor-help-question" value={query} onChange={event=>setQuery(event.target.value)} maxLength={220} autoComplete="off" enterKeyHint="search" aria-describedby="visitor-help-privacy"
              placeholder="e.g. Where do we meet?" className="min-h-11 min-w-0 flex-1 rounded-lg border border-[#b8c4c2] px-3 text-base text-[#2e2600] focus:outline focus:outline-2 focus:outline-[#0a6b66]"/>
            <button type="submit" aria-label="Find an answer" disabled={!query.trim()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#0a6b66] text-white disabled:opacity-40 focus-visible:outline focus-visible:outline-offset-2"><Search aria-hidden="true" className="h-5 w-5"/></button>
          </div>
          <p id="visitor-help-privacy" className="mt-2 text-xs leading-relaxed text-[#525759]">Use a general question. Please leave out names, contact details and medical information.</p>
        </form>
        {answers!==null && <div ref={result} tabIndex={-1} className="mt-4 space-y-3 focus:outline-none" aria-label="Help results">
          <p className="text-xs font-bold uppercase tracking-wide text-[#0a6b66]" role="status">{answers.length?'Relevant website guidance':'No clear match'}</p>
          {answers.length?answers.map(answer=><article key={answer.id} className="rounded-xl border border-[#e7e1d8] bg-[#faf8f5] p-3">
            <h3 className="mb-2 font-bold">{answer.title}</h3><p className="whitespace-pre-line text-sm leading-relaxed text-[#525759]">{answer.text}</p>
            {answer.id==='enrol' && <div className="mt-3 space-y-2">
              {BOOKING_OPTIONS.map(group=><details key={group.id} className="rounded-lg border border-[#d4dfdc] bg-white">
                <summary className="min-h-11 cursor-pointer rounded-lg px-3 py-3 text-sm font-bold text-[#0a6b66] focus-visible:outline focus-visible:outline-[#0a6b66]">{group.title}</summary>
                <div className="space-y-2 px-3 pb-3">
                  <p className="text-sm leading-relaxed text-[#525759]">{group.note}</p>
                  {group.links.map(link=><a key={link.href} href={link.href} onClick={close} className="flex min-h-11 items-center justify-between gap-2 rounded-lg border border-[#e7e1d8] px-3 py-3 text-sm font-bold text-[#0a6b66] underline hover:bg-[#faf8f5] focus-visible:outline focus-visible:outline-[#0a6b66]"><span>{link.label}</span><ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0"/></a>)}
                </div>
              </details>)}
            </div>}
            <a href={answer.href} onClick={close} className="mt-2 inline-flex min-h-11 items-center gap-1 font-bold text-[#0a6b66] underline">{answer.label}<ArrowUpRight aria-hidden="true" className="h-4 w-4"/></a>
          </article>):<p className="text-sm leading-relaxed text-[#525759]">I couldn’t find a confident match in our website guidance. Try a topic below, or contact Coach Al for an individual answer. This help cannot check live bookings or make decisions about your athlete.</p>}
        </div>}
        <div className="mt-4 grid gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-[#525759]">{answers===null?'Or choose a topic':'Explore a topic'}</p>
          {topics.map(answer=><button key={answer.id} type="button" onClick={()=>{setAnswers([answer]);setQuery('');setAllTopics(false);}} className="min-h-11 rounded-lg border border-[#e7e1d8] px-3 py-2 text-left text-sm font-semibold hover:bg-[#faf8f5] focus-visible:outline focus-visible:outline-[#0a6b66]">{answer.title}</button>)}
          <button type="button" aria-expanded={allTopics} onClick={()=>setAllTopics(!allTopics)} className="min-h-11 text-left text-sm font-bold text-[#0a6b66] underline">{allTopics?'Show fewer topics':'Browse all help topics'}</button>
        </div>
      </div>
      <footer className="shrink-0 border-t border-[#e7e1d8] px-4 py-2">
        <div className="flex flex-wrap items-center gap-x-4"><a href={DISCOVERY_CALL_URL} onClick={close} className="inline-flex min-h-11 items-center text-sm font-bold text-[#0a6b66] underline">Book a discovery call</a><a href={EMAIL_ENQUIRY_URL} onClick={close} className="inline-flex min-h-11 items-center text-sm font-bold text-[#0a6b66] underline">Email Coach Al</a></div>
        <p className="text-xs text-[#525759]">Website guidance only. Questions clear when you close help.</p>
      </footer>
    </div>}
  </>;
}
