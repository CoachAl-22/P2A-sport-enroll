import { afterEach, describe, expect, it, vi } from "vitest";
import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";

const script = readFileSync("public/maj-quick-notes.js", "utf8");
const hiddenRule = readFileSync("public/my-athletic-journey.html", "utf8").match(/#app \[hidden\]\{[^}]+\}/)?.[0] || "";
const athlete = { id: "90b68fb7-689a-4465-a6b4-eb1e0e90fc40", fullName: "Test James", program: "Test Juniors", enabled: true, rosterActive: true };
const observation = { athlete_id: athlete.id, athlete_name: athlete.fullName, skill: "Running Arms",
  working_well: "Relaxed arms", to_improve: "Head position", suggested_cue: "Eyes forward",
  parent_message: "Great effort today", matched: true };
const windows: JSDOM[] = [];
const tick = async () => { await new Promise(resolve => setTimeout(resolve, 15)); };
function harness() {
  const dom = new JSDOM(`<style>${hiddenRule}</style><div id="app"><div id="page-login" class="page active"><div id="original-login" style="display:flex"></div></div>
    <div id="page-home" class="page"><div class="top-bar"></div><div class="original-home"></div></div>
    <div id="bottom-nav"></div><div id="athlete-count"></div><div id="athlete-list-body"></div>
    <div id="assess-history-panel"></div></div>`, {
    url: "https://example.invalid/my-athletic-journey", runScripts: "outside-only",
  });
  windows.push(dom);
  const w = dom.window as any;
  w.CSS = { escape: (v: string) => v };
  const fetch = vi.fn(async () => ({ ok: false, status: 401, json: async () => ({ message: "Sign-in required" }) }));
  w.fetch = fetch;
  w.eval(script);
  return { w, d: w.document as Document, fetch };
}
function respond(fetch: any, handler: (url: string, body: any) => any) {
  fetch.mockImplementation(async (url: string, options: any = {}) => {
    const body = handler(url, options.body ? JSON.parse(options.body) : undefined);
    return { ok: true, status: 200, json: async () => body };
  });
}
afterEach(() => { windows.splice(0).forEach(dom => dom.window.close()); });

describe("MAJ Quick Note browser logic", () => {
  it("renders one mobile-friendly dictation box and persists the draft on input", async () => {
    const { w, d } = harness();
    await tick();
    w.MAJQuickNotes.coachReady([athlete], { id: "test-coach-a" });
    const input = d.querySelector<HTMLTextAreaElement>("#maj-raw-note")!;
    input.value = "Dictated but not yet submitted";
    input.dispatchEvent(new w.Event("input", { bubbles: true }));
    expect(d.querySelectorAll("#maj-raw-note")).toHaveLength(1);
    expect(w.localStorage.getItem("maj.quicknotes.coach.test-coach-a")).toContain(input.value);
  });
  it("queues offline raw notes, restores them only for the same coach, and syncs to unconfirmed cards", async () => {
    const { w, d, fetch } = harness();
    await tick();
    Object.defineProperty(w.navigator, "onLine", { configurable: true, value: false });
    w.MAJQuickNotes.coachReady([athlete], { id: "test-coach-a" });
    fetch.mockRejectedValue(new TypeError("offline"));
    (d.querySelector("#maj-raw-note") as HTMLTextAreaElement).value = "Looked at Test James";
    (d.querySelector("#maj-parse-note") as HTMLButtonElement).click();
    await tick();
    expect(JSON.parse(w.localStorage.getItem("maj.quicknotes.coach.test-coach-a")).raw).toHaveLength(1);
    w.MAJQuickNotes.lockCoach();
    w.MAJQuickNotes.coachReady([athlete], { id: "test-coach-b" });
    expect(d.querySelectorAll("[data-review]")).toHaveLength(0);
    w.MAJQuickNotes.lockCoach();
    w.MAJQuickNotes.coachReady([athlete], { id: "test-coach-a" });
    respond(fetch, url => url.endsWith("/observe") ? { observations: [observation], roster: [athlete] } : {});
    Object.defineProperty(w.navigator, "onLine", { configurable: true, value: true });
    w.dispatchEvent(new w.Event("online"));
    await tick();
    expect(d.querySelectorAll("[data-review]")).toHaveLength(1);
    expect((d.querySelector('[data-key="send_to_parent"]') as HTMLInputElement).checked).toBe(true);
    expect(fetch.mock.calls.some(([url]) => String(url).endsWith("/observe/confirm"))).toBe(false);
  });
  it("sends only the individually confirmed edits and respects the parent toggle", async () => {
    const { w, d, fetch } = harness();
    await tick();
    const payloads: any[] = [];
    respond(fetch, (url, body) => {
      if (url.endsWith("/observe")) return { observations: [observation, { ...observation, athlete_name: "Unmatched", athlete_id: null, matched: false }], roster: [athlete] };
      if (url.endsWith("/observe/confirm")) { payloads.push(body); return { saved: { id: "saved" }, push: { sent: 0, configured: false } }; }
      return {};
    });
    w.MAJQuickNotes.coachReady([athlete], { id: "test-coach-a" });
    (d.querySelector("#maj-raw-note") as HTMLTextAreaElement).value = "A multi-child note";
    (d.querySelector("#maj-parse-note") as HTMLButtonElement).click();
    await tick();
    const first = d.querySelector("[data-review]")!;
    const cue = first.querySelector<HTMLTextAreaElement>('[data-key="suggested_cue"]')!;
    cue.value = "Edited cue"; cue.dispatchEvent(new w.Event("input", { bubbles: true }));
    const toggle = first.querySelector<HTMLInputElement>('[data-key="send_to_parent"]')!;
    toggle.checked = false; toggle.dispatchEvent(new w.Event("change", { bubbles: true }));
    (first.querySelector("[data-confirm]") as HTMLButtonElement).click();
    await tick();
    expect(payloads).toHaveLength(1);
    expect(payloads[0]).toMatchObject({ suggested_cue: "Edited cue", send_to_parent: false });
    expect(d.querySelectorAll("[data-review]")).toHaveLength(2);
    expect((d.querySelectorAll('[data-review] select')[1] as HTMLSelectElement).value).toBe("");
  });
  it("does not pretend an AI configuration failure is an offline save", async () => {
    const { w, d, fetch } = harness();
    await tick();
    fetch.mockImplementation(async () => ({ ok: false, status: 503, json: async () => ({ message: "API key needed", code: "AI_NOT_CONFIGURED" }) }));
    w.MAJQuickNotes.coachReady([athlete], { id: "test-coach-a" });
    (d.querySelector("#maj-raw-note") as HTMLTextAreaElement).value = "Note retained";
    (d.querySelector("#maj-parse-note") as HTMLButtonElement).click();
    await tick();
    expect((d.querySelector("#maj-raw-note") as HTMLTextAreaElement).value).toBe("Note retained");
    expect(d.querySelector("#maj-note-error")?.textContent).toContain("API key needed");
    const stored = JSON.parse(w.localStorage.getItem("maj.quicknotes.coach.test-coach-a") || "{}");
    expect(stored.raw || []).toHaveLength(0);
  });
  it("replays explicitly confirmed offline cards with the same ID and removes the queue on acknowledgement", async () => {
    const { w, d, fetch } = harness();
    await tick();
    respond(fetch, () => ({ observations: [observation], roster: [athlete] }));
    w.MAJQuickNotes.coachReady([athlete], { id: "test-coach-a" });
    (d.querySelector("#maj-raw-note") as HTMLTextAreaElement).value = "Review then confirm offline";
    (d.querySelector("#maj-parse-note") as HTMLButtonElement).click();
    await tick();
    Object.defineProperty(w.navigator, "onLine", { configurable: true, value: false });
    fetch.mockRejectedValue(new TypeError("offline"));
    (d.querySelector("[data-confirm]") as HTMLButtonElement).click();
    await tick();
    const queued = JSON.parse(w.localStorage.getItem("maj.quicknotes.coach.test-coach-a")).confirmed;
    expect(queued).toHaveLength(1);
    expect((d.querySelector('[data-key="suggested_cue"]') as HTMLTextAreaElement).disabled).toBe(true);
    const replayed: any[] = [];
    respond(fetch, (_url, body) => { replayed.push(body); return { saved: { id: "saved" }, duplicate: true, push: { sent: 0, configured: false } }; });
    Object.defineProperty(w.navigator, "onLine", { configurable: true, value: true });
    w.dispatchEvent(new w.Event("online"));
    await tick();
    expect(replayed[0].clientNoteId).toBe(queued[0].clientNoteId);
    expect(JSON.parse(w.localStorage.getItem("maj.quicknotes.coach.test-coach-a")).confirmed).toHaveLength(0);
  });
  it("does not attach a delayed extraction to a different coach after logout", async () => {
    const { w, d, fetch } = harness();
    await tick();
    let finish!: (response: any) => void;
    fetch.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    w.MAJQuickNotes.coachReady([athlete], { id: "test-coach-a" });
    (d.querySelector("#maj-raw-note") as HTMLTextAreaElement).value = "Private draft for coach A";
    (d.querySelector("#maj-parse-note") as HTMLButtonElement).click();
    w.MAJQuickNotes.lockCoach();
    w.MAJQuickNotes.coachReady([athlete], { id: "test-coach-b" });
    finish({ ok: true, json: async () => ({ observations: [observation], roster: [athlete] }) });
    await tick();
    expect(d.querySelectorAll("[data-review]")).toHaveLength(0);
    expect(w.localStorage.getItem("maj.quicknotes.coach.test-coach-b") || "").not.toContain("Private draft");
  });
  it("keeps offline text visible if device storage fails", async () => {
    const { w, d, fetch } = harness();
    await tick();
    w.MAJQuickNotes.coachReady([athlete], { id: "test-coach-a" });
    w.Storage.prototype.setItem = () => { throw new Error("Quota full"); };
    fetch.mockRejectedValue(new TypeError("offline"));
    (d.querySelector("#maj-raw-note") as HTMLTextAreaElement).value = "Must not disappear";
    (d.querySelector("#maj-parse-note") as HTMLButtonElement).click();
    await tick();
    expect((d.querySelector("#maj-raw-note") as HTMLTextAreaElement).value).toBe("Must not disappear");
    expect(d.querySelector("#maj-note-error")?.textContent?.toLowerCase()).toContain("copy");
  });
  it("renders the owned parent journey and real badge names without private observation fields", async () => {
    const { w, d, fetch } = harness();
    await tick();
    w.MAJQuickNotes.showParentSignIn();
    expect(w.getComputedStyle(d.querySelector("#original-login")).display).toBe("none");
    respond(fetch, url => url.endsWith("/parent/me")
      ? { parent: { firstName: "Test Parent" }, athletes: [athlete] }
      : { athlete: { ...athlete, xp: 42 }, badges: [{ badgeName: "Great Effort" }], notes: [{ skill: "Arms", parent_message: "A shared update", coach_name: "Coach" }] });
    await w.MAJQuickNotes.restoreParent();
    await tick();
    expect(d.querySelector("#maj-journey")?.textContent).toContain("A shared update");
    expect(d.querySelector("#maj-journey")?.textContent).toContain("Great Effort");
    expect(d.querySelector("#maj-journey")?.textContent).toContain("42 XP");
  });
  it("shows an empty parent journey state instead of endlessly loading", async () => {
    const { w, d, fetch } = harness();
    await tick();
    respond(fetch, () => ({ parent: { firstName: "Test Parent" }, athletes: [] }));
    await w.MAJQuickNotes.restoreParent();
    await tick();
    expect(d.querySelector("#maj-journey")?.textContent).not.toContain("Loading");
  });
});
