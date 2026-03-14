import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import Navbar from "@/components/layout/navbar";

type TabId = "overview" | "junior" | "dev" | "senior" | "running" | "flags";

const tabs: { id: TabId; label: string }[] = [
  { id: "overview", label: "📋 48hr Process" },
  { id: "junior",   label: "🌱 Junior Academy" },
  { id: "dev",      label: "🏃 Development Squad" },
  { id: "senior",   label: "🏆 Senior Squad" },
  { id: "running",  label: "👟 Running Technique" },
  { id: "flags",    label: "🚩 Red Flags" },
];

export default function Onboarding() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" /></div>;
  if (!user || (user.role !== "admin" && user.role !== "coach")) return <Redirect to="/" />;

  return (
    <div style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: "#f4f4f5", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        :root {
          --orange:#F26522;--orange-dark:#d4541a;--orange-pale:#fff5f0;
          --cyan:#00B4D8;--cyan-pale:#f0fbfd;--green:#1aaa6e;--green-pale:#f0faf5;
          --amber:#f0a500;--amber-pale:#fffbf0;--red:#e03c3c;--red-pale:#fff5f5;
          --purple:#6b5ce7;--purple-pale:#f3f0ff;--black:#0a0a0a;--text:#1a1a1a;
          --muted:#6b7280;--border:#e5e7eb;--bg:#f4f4f5;--white:#ffffff;
          --r:12px;--rs:8px;
          --font-head:'Barlow Condensed','Arial Narrow',Arial,sans-serif;
        }
        .ob-wrap{max-width:960px;margin:0 auto;padding:28px 20px 80px}
        .ob-page-hdr{background:var(--black);border-radius:var(--r);padding:28px 32px;margin-bottom:20px;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;position:relative;overflow:hidden}
        .ob-page-hdr::after{content:'';position:absolute;top:0;right:0;width:180px;height:100%;background:linear-gradient(135deg,transparent 60%,rgba(242,101,34,.08));pointer-events:none}
        .ob-eye{font-size:.65rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--orange);margin-bottom:6px}
        .ob-title{font-family:var(--font-head);font-size:2rem;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:var(--white);line-height:1.1;margin-bottom:8px}
        .ob-title span{color:var(--orange)}
        .ob-sub{font-size:.85rem;color:#9ca3af;line-height:1.65;max-width:480px}
        .ob-badge{background:var(--orange);color:var(--white);font-size:.65rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:6px 14px;border-radius:99px;white-space:nowrap;flex-shrink:0;align-self:flex-start}
        .ob-tab-nav{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:20px}
        .ob-tab-btn{font-size:.8rem;font-weight:600;padding:8px 16px;border-radius:99px;border:1.5px solid var(--border);background:var(--white);color:var(--muted);cursor:pointer;transition:all .18s ease;white-space:nowrap}
        .ob-tab-btn:hover{border-color:var(--orange);color:var(--orange)}
        .ob-tab-btn.active{background:var(--orange);border-color:var(--orange);color:var(--white);box-shadow:0 4px 12px rgba(242,101,34,.28)}
        .ob-print-bar{display:flex;justify-content:flex-end;margin-bottom:16px}
        .ob-print-btn{font-size:.78rem;font-weight:600;color:var(--muted);background:var(--white);border:1.5px solid var(--border);border-radius:99px;padding:7px 16px;cursor:pointer;transition:all .18s;display:flex;align-items:center;gap:6px}
        .ob-print-btn:hover{border-color:var(--orange);color:var(--orange)}
        .ob-card{background:var(--white);border:1px solid var(--border);border-radius:var(--r);margin-bottom:20px;overflow:hidden}
        .ob-card-head{padding:15px 22px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:11px}
        .ob-card-icon{width:32px;height:32px;border-radius:var(--rs);display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0}
        .ob-card-icon.o{background:var(--orange-pale)}.ob-card-icon.c{background:var(--cyan-pale)}.ob-card-icon.g{background:var(--green-pale)}.ob-card-icon.a{background:var(--amber-pale)}
        .ob-card-title{font-family:var(--font-head);font-size:1.05rem;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:var(--black)}
        .ob-card-sub{font-size:.75rem;color:var(--muted);margin-top:1px}
        .ob-card-body{padding:20px 22px}
        .ob-timeline{padding:24px 28px}
        .ob-tl-title{font-family:var(--font-head);font-size:1.05rem;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:var(--black);margin-bottom:20px}
        .ob-steps{display:flex;flex-direction:column}
        .ob-step{display:flex;gap:16px;position:relative}
        .ob-step:not(:last-child)::after{content:'';position:absolute;left:15px;top:34px;bottom:0;width:2px;background:var(--border)}
        .ob-step-dot{width:32px;height:32px;border-radius:50%;background:var(--orange);color:var(--white);font-size:.75rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;position:relative;z-index:1;transition:transform .2s}
        .ob-step:hover .ob-step-dot{transform:scale(1.1)}
        .ob-step-dot.c{background:var(--cyan)}.ob-step-dot.g{background:var(--green)}
        .ob-step-body{padding-bottom:22px;flex:1}
        .ob-step-time{font-size:.67rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--orange);margin-bottom:2px}
        .ob-step-time.c{color:var(--cyan)}.ob-step-time.g{color:var(--green)}
        .ob-step-head{font-weight:700;font-size:.93rem;color:var(--black);margin-bottom:3px}
        .ob-step-desc{font-size:.84rem;color:var(--muted);line-height:1.65}
        .ob-sig-grid{display:grid;grid-template-columns:1fr 1fr;gap:13px;margin-bottom:20px}
        .ob-sig-card{background:var(--white);border:1px solid var(--border);border-radius:var(--r);padding:18px 20px;border-top:3px solid var(--border);transition:box-shadow .2s}
        .ob-sig-card:hover{box-shadow:0 4px 16px rgba(0,0,0,.07)}
        .ob-sig-card.g{border-top-color:var(--green)}.ob-sig-card.a{border-top-color:var(--amber)}.ob-sig-card.r{border-top-color:var(--red)}.ob-sig-card.p{border-top-color:var(--purple)}
        .ob-sig-label{font-size:.65rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:11px}
        .ob-sig-label.g{color:var(--green)}.ob-sig-label.a{color:var(--amber)}.ob-sig-label.r{color:var(--red)}.ob-sig-label.p{color:var(--purple)}
        .ob-sig-item{display:flex;align-items:flex-start;gap:8px;font-size:.83rem;color:var(--text);margin-bottom:7px;line-height:1.5}
        .ob-sig-item:last-child{margin-bottom:0}
        .ob-sig-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;margin-top:6px}
        .ob-sig-dot.g{background:var(--green)}.ob-sig-dot.a{background:var(--amber)}.ob-sig-dot.r{background:var(--red)}.ob-sig-dot.p{background:var(--purple)}
        .ob-action-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .ob-col-label{font-size:.65rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--border)}
        .ob-act-item{display:flex;align-items:flex-start;gap:7px;font-size:.83rem;color:var(--text);margin-bottom:7px;line-height:1.5}
        .ob-arr{font-size:.7rem;color:var(--orange);flex-shrink:0;margin-top:3px;font-weight:700}
        .ob-arr.c{color:var(--cyan)}
        .ob-sum-table{width:100%;border-collapse:collapse;font-size:.83rem}
        .ob-sum-table th{background:var(--black);color:var(--white);padding:10px 13px;text-align:left;font-size:.68rem;letter-spacing:.07em;text-transform:uppercase;font-weight:700}
        .ob-sum-table td{padding:11px 13px;border-bottom:1px solid var(--border);vertical-align:top;line-height:1.55}
        .ob-sum-table tr:last-child td{border-bottom:none}
        .ob-sum-table tr:nth-child(even) td{background:#fafafa}
        .ob-sum-table tr:hover td{background:var(--orange-pale);transition:background .15s}
        .ob-pill{display:inline-block;font-size:.62rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:2px 8px;border-radius:99px}
        .ob-pill.o{background:var(--orange-pale);color:var(--orange)}.ob-pill.c{background:var(--cyan-pale);color:var(--cyan)}.ob-pill.g{background:var(--green-pale);color:var(--green)}.ob-pill.r{background:var(--red-pale);color:var(--red)}
        .ob-flag-box{border-radius:var(--rs);padding:14px 16px;font-size:.84rem;line-height:1.65;margin-bottom:12px;transition:transform .15s}
        .ob-flag-box:hover{transform:translateX(3px)}
        .ob-flag-box:last-child{margin-bottom:0}
        .ob-flag-box.r{background:var(--red-pale);border:1px solid rgba(224,60,60,.2);color:#c03030}
        .ob-flag-box.a{background:var(--amber-pale);border:1px solid rgba(240,165,0,.2);color:#9a6800}
        .ob-flag-box.p{background:var(--purple-pale);border:1px solid rgba(107,92,231,.2);color:var(--purple)}
        .ob-flag-box strong{display:block;font-size:.7rem;letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px}
        @media(max-width:640px){.ob-sig-grid{grid-template-columns:1fr}.ob-action-row{grid-template-columns:1fr}.ob-page-hdr{flex-direction:column}.ob-badge{align-self:flex-start}}
        @media print{.ob-tab-nav,.ob-print-bar{display:none!important}}
      `}</style>

      <Navbar />

      <div className="ob-wrap">
        <div className="ob-page-hdr">
          <div>
            <div className="ob-eye">Internal Resource — Not for Public Sharing</div>
            <div className="ob-title">Onboarding <span>Reference Guide</span></div>
            <div className="ob-sub">What to look for in each athlete's onboarding responses — and how to action them within 48 hours of registration.</div>
          </div>
          <div className="ob-badge">Coach Use Only</div>
        </div>

        <div className="ob-print-bar">
          <button className="ob-print-btn" onClick={() => window.print()}>🖨️ Print this guide</button>
        </div>

        <div className="ob-tab-nav">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`ob-tab-btn${activeTab === t.id ? " active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── 48HR PROCESS ── */}
        {activeTab === "overview" && (
          <div>
            <div className="ob-card">
              <div className="ob-timeline">
                <div className="ob-tl-title">The 48-Hour Onboarding Action Process</div>
                <div className="ob-steps">
                  <div className="ob-step">
                    <div className="ob-step-dot">1</div>
                    <div className="ob-step-body">
                      <div className="ob-step-time">0–2 hours</div>
                      <div className="ob-step-head">Read the full profile — don't skim</div>
                      <div className="ob-step-desc">Open the athlete's onboarding in Final Surge and read every answer in full. The real signal is usually in the long-text fields — injury history, "why now", how they describe their training. Note anything that stands out before moving on.</div>
                    </div>
                  </div>
                  <div className="ob-step">
                    <div className="ob-step-dot">2</div>
                    <div className="ob-step-body">
                      <div className="ob-step-time">2–4 hours</div>
                      <div className="ob-step-head">Flag and categorise responses</div>
                      <div className="ob-step-desc">Use the programme-specific signal guides in this document. Green = proceed. Amber = factor into programme design or clarify first. Red = contact athlete before building anything.</div>
                    </div>
                  </div>
                  <div className="ob-step">
                    <div className="ob-step-dot c">3</div>
                    <div className="ob-step-body">
                      <div className="ob-step-time c">4–8 hours</div>
                      <div className="ob-step-head">Send a personal intro message</div>
                      <div className="ob-step-desc">Reference something specific from their profile — their goal event, injury history, or their stated "why". This is not a template message. One personalised sentence builds more trust than a paragraph of boilerplate.</div>
                    </div>
                  </div>
                  <div className="ob-step">
                    <div className="ob-step-dot c">4</div>
                    <div className="ob-step-body">
                      <div className="ob-step-time c">8–24 hours</div>
                      <div className="ob-step-head">Build week one — conservatively</div>
                      <div className="ob-step-desc">New athletes almost always underestimate fatigue and overestimate readiness. Start at 70–80% of what you think they can handle. You can always add load — you can't undo a first week that breaks them. Factor all amber flags before publishing.</div>
                    </div>
                  </div>
                  <div className="ob-step">
                    <div className="ob-step-dot g">5</div>
                    <div className="ob-step-body">
                      <div className="ob-step-time g">24–36 hours</div>
                      <div className="ob-step-head">Publish and personalise the first session note</div>
                      <div className="ob-step-desc">Load week one and add a brief coach note to the first session that ties back to their stated goal. Makes the programme feel built for them — not dropped in generically.</div>
                    </div>
                  </div>
                  <div className="ob-step">
                    <div className="ob-step-dot g">6</div>
                    <div className="ob-step-body" style={{ paddingBottom: 0 }}>
                      <div className="ob-step-time g">36–48 hours</div>
                      <div className="ob-step-head">Follow up and close the loop</div>
                      <div className="ob-step-desc">Send a brief check-in to confirm they've found their programme and are clear on what to do first. Ask if they have any questions. Sets the communication standard for the whole relationship.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="ob-card">
              <div className="ob-card-head">
                <div className="ob-card-icon o">📊</div>
                <div>
                  <div className="ob-card-title">Programme-Specific Action Summary</div>
                  <div className="ob-card-sub">Key differences in how to process each programme type on registration</div>
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="ob-sum-table">
                  <thead>
                    <tr><th>Programme</th><th>First contact priority</th><th>Week 1 approach</th><th>Key watch-out</th></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><span className="ob-pill o">Junior Academy</span><br /><span style={{ fontSize: ".78rem", color: "var(--muted)" }}>Ages 12–16</span></td>
                      <td>Contact parent first, then athlete. Offer a brief intro call if any flags present.</td>
                      <td>Very conservative — 2 sessions max. Fun and confidence-building over intensity.</td>
                      <td>Overloading across school sport calendar. Map all commitments before building.</td>
                    </tr>
                    <tr>
                      <td><span className="ob-pill c">Development Squad</span><br /><span style={{ fontSize: ".78rem", color: "var(--muted)" }}>Ages 17–21</span></td>
                      <td>Contact athlete directly. Reference the junior transition in your opening message.</td>
                      <td>Match current training volume — don't jump to senior-level load immediately.</td>
                      <td>Athlete underestimates how different senior training feels. Set expectations early.</td>
                    </tr>
                    <tr>
                      <td><span className="ob-pill g">Senior Squad</span><br /><span style={{ fontSize: ".78rem", color: "var(--muted)" }}>Competitive adults</span></td>
                      <td>Direct, concise message. Senior athletes value efficiency. Confirm event calendar.</td>
                      <td>Match stated current load — don't assume they're starting from scratch.</td>
                      <td>Previous coaching baggage. Understand what didn't work before replicating any structure.</td>
                    </tr>
                    <tr>
                      <td><span className="ob-pill r">Running Technique</span><br /><span style={{ fontSize: ".78rem", color: "var(--muted)" }}>Adult runners</span></td>
                      <td>Schedule first in-person session immediately — time is the main friction point.</td>
                      <td>No programme until after gait analysis. Confirm injury status and shoes first.</td>
                      <td>Unresolved injury or current pain — clarify before booking. Refer to physio if needed.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── JUNIOR ACADEMY ── */}
        {activeTab === "junior" && (
          <div>
            <div className="ob-sig-grid">
              <div className="ob-sig-card g">
                <div className="ob-sig-label g">✅ Green Lights — Proceed with confidence</div>
                <div className="ob-sig-item"><div className="ob-sig-dot g" />Active in 2–3 sports — multi-sport background ideal at this age</div>
                <div className="ob-sig-item"><div className="ob-sig-dot g" />Parent describes athlete as "keen", "always asking to do more"</div>
                <div className="ob-sig-item"><div className="ob-sig-dot g" />Athlete's own Q10–12 answers are specific and enthusiastic</div>
                <div className="ob-sig-item"><div className="ob-sig-dot g" />Parent has realistic expectations — enjoyment and confidence over early results</div>
                <div className="ob-sig-item"><div className="ob-sig-dot g" />Clear 2-day availability with minimal conflicts</div>
              </div>
              <div className="ob-sig-card a">
                <div className="ob-sig-label a">⚠️ Amber — Factor into programme design</div>
                <div className="ob-sig-item"><div className="ob-sig-dot a" />4+ sport commitments — monitor total load; coordinate around peak competition blocks</div>
                <div className="ob-sig-item"><div className="ob-sig-dot a" />Parent appears to be driving the decision more than the athlete — verify actual enthusiasm at first session</div>
                <div className="ob-sig-item"><div className="ob-sig-dot a" />Athlete Q12 suggests anxiety — lead first session with fun, not fitness testing</div>
                <div className="ob-sig-item"><div className="ob-sig-dot a" />Recent injury mentioned even if "resolved" — get full detail first</div>
                <div className="ob-sig-item"><div className="ob-sig-dot a" />Exam periods noted — reduce volume but maintain consistency</div>
              </div>
              <div className="ob-sig-card r">
                <div className="ob-sig-label r">🚩 Red Flags — Resolve before building</div>
                <div className="ob-sig-item"><div className="ob-sig-dot r" />Medical condition — confirm management plan and emergency contact before any session</div>
                <div className="ob-sig-item"><div className="ob-sig-dot r" />Athlete answers suggest they don't want to be here — parent-driven enrolment. Call parent before proceeding.</div>
                <div className="ob-sig-item"><div className="ob-sig-dot r" />Unresolved injury — do not programme until medically cleared</div>
                <div className="ob-sig-item"><div className="ob-sig-dot r" />Photo/content consent not confirmed — clarify before filming</div>
              </div>
              <div className="ob-sig-card p">
                <div className="ob-sig-label p">💡 Use in Programme Design</div>
                <div className="ob-sig-item"><div className="ob-sig-dot p" />Q11 (favourite sport) — weave elements of it into early sessions to build motivation</div>
                <div className="ob-sig-item"><div className="ob-sig-dot p" />Q15 (learning style from parent) — shape how you deliver in-person feedback</div>
                <div className="ob-sig-item"><div className="ob-sig-dot p" />Q13 (who to contact) — if "both", involve the athlete in comms to build ownership</div>
                <div className="ob-sig-item"><div className="ob-sig-dot p" />Preferred feedback channel — establish before first session, not after</div>
              </div>
            </div>
            <div className="ob-card">
              <div className="ob-card-head"><div className="ob-card-icon o">📝</div><div><div className="ob-card-title">Junior Academy — 48hr Checklist</div></div></div>
              <div className="ob-card-body">
                <div className="ob-action-row">
                  <div>
                    <div className="ob-col-label">Must Do</div>
                    <div className="ob-act-item"><span className="ob-arr">→</span>Contact parent within 4 hours — they're the primary contact at this stage</div>
                    <div className="ob-act-item"><span className="ob-arr">→</span>Confirm photo/content consent from the waiver before any filming</div>
                    <div className="ob-act-item"><span className="ob-arr">→</span>Map all school sport commitments before building the programme</div>
                    <div className="ob-act-item"><span className="ob-arr">→</span>Read athlete's Q10–12 closely — shapes the entire first session tone</div>
                    <div className="ob-act-item"><span className="ob-arr">→</span>Build 2 sessions/week max — do not exceed agreed load</div>
                    <div className="ob-act-item"><span className="ob-arr">→</span>First session must feel achievable and enjoyable — confidence before fitness</div>
                  </div>
                  <div>
                    <div className="ob-col-label">Good to Do</div>
                    <div className="ob-act-item"><span className="ob-arr c">→</span>Send a short separate message directly to the athlete — in their language, not parent-speak</div>
                    <div className="ob-act-item"><span className="ob-arr c">→</span>Reference Q11 (favourite sport) in your first session coach note</div>
                    <div className="ob-act-item"><span className="ob-arr c">→</span>Flag upcoming exam or competition-heavy periods and plan reduced-load weeks proactively</div>
                    <div className="ob-act-item"><span className="ob-arr c">→</span>Set up preferred feedback channel before first session</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── DEVELOPMENT SQUAD ── */}
        {activeTab === "dev" && (
          <div>
            <div className="ob-sig-grid">
              <div className="ob-sig-card g">
                <div className="ob-sig-label g">✅ Green Lights</div>
                <div className="ob-sig-item"><div className="ob-sig-dot g" />Clear event calendar with realistic A/B/C priorities</div>
                <div className="ob-sig-item"><div className="ob-sig-dot g" />Honest self-assessment of strengths and current weaknesses</div>
                <div className="ob-sig-item"><div className="ob-sig-dot g" />Has structured training history — not starting from zero</div>
                <div className="ob-sig-item"><div className="ob-sig-dot g" />Motivation rating 7/10 or above</div>
                <div className="ob-sig-item"><div className="ob-sig-dot g" />Feedback preference "direct" or "balanced" — coachable mindset</div>
                <div className="ob-sig-item"><div className="ob-sig-dot g" />Studying or working — shows real-world structure in their life</div>
              </div>
              <div className="ob-sig-card a">
                <div className="ob-sig-label a">⚠️ Amber</div>
                <div className="ob-sig-item"><div className="ob-sig-dot a" />Q13 (transition concerns) reveals anxiety — address directly in intro message</div>
                <div className="ob-sig-item"><div className="ob-sig-dot a" />Very high current training volume for their age — check for burnout risk</div>
                <div className="ob-sig-item"><div className="ob-sig-dot a" />Motivation below 6 — direct conversation before programme build</div>
                <div className="ob-sig-item"><div className="ob-sig-dot a" />"My last coach always did X" — philosophy clash risk. Address your approach early.</div>
                <div className="ob-sig-item"><div className="ob-sig-dot a" />Heavy study or work load — build flexibility for deadlines and exams</div>
              </div>
              <div className="ob-sig-card r">
                <div className="ob-sig-label r">🚩 Red Flags</div>
                <div className="ob-sig-item"><div className="ob-sig-dot r" />Unresolved injury — do not build programme until cleared</div>
                <div className="ob-sig-item"><div className="ob-sig-dot r" />"I just push through" for setbacks — address recovery culture before week one</div>
                <div className="ob-sig-item"><div className="ob-sig-dot r" />No event calendar — periodisation impossible. Clarify before building.</div>
                <div className="ob-sig-item"><div className="ob-sig-dot r" />Motivation 4 or below — contact athlete before building anything</div>
              </div>
              <div className="ob-sig-card p">
                <div className="ob-sig-label p">💡 Use in Design</div>
                <div className="ob-sig-item"><div className="ob-sig-dot p" />Q5 (what's held them back) — this is where the real coaching work begins</div>
                <div className="ob-sig-item"><div className="ob-sig-dot p" />Q13 (transition concerns) — shapes the emotional tone of your intro</div>
                <div className="ob-sig-item"><div className="ob-sig-dot p" />Q17 (feedback preference) — apply from your very first session note</div>
                <div className="ob-sig-item"><div className="ob-sig-dot p" />Study/work context — normalise open comms about schedule conflicts upfront</div>
              </div>
            </div>
            <div className="ob-card">
              <div className="ob-card-head"><div className="ob-card-icon c">📝</div><div><div className="ob-card-title">Development Squad — 48hr Checklist</div></div></div>
              <div className="ob-card-body">
                <div className="ob-action-row">
                  <div>
                    <div className="ob-col-label">Must Do</div>
                    <div className="ob-act-item"><span className="ob-arr">→</span>Read Q5 and Q13 before writing a word of your intro message</div>
                    <div className="ob-act-item"><span className="ob-arr">→</span>Acknowledge the junior-to-senior transition in your first message — it's a significant step</div>
                    <div className="ob-act-item"><span className="ob-arr">→</span>Map the event calendar and build periodisation backwards from the A event</div>
                    <div className="ob-act-item"><span className="ob-arr">→</span>Start at current training volume — do not increase load in week one</div>
                    <div className="ob-act-item"><span className="ob-arr">→</span>Apply Q17 feedback preference from your very first session note</div>
                  </div>
                  <div>
                    <div className="ob-col-label">Good to Do</div>
                    <div className="ob-act-item"><span className="ob-arr c">→</span>Map study/work schedule and flag likely heavy periods in advance</div>
                    <div className="ob-act-item"><span className="ob-arr c">→</span>If Q5 reveals a clear weakness, mention it briefly in your intro — shows you read the profile</div>
                    <div className="ob-act-item"><span className="ob-arr c">→</span>Check for club commitments that need integrating — don't programme over them</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SENIOR SQUAD ── */}
        {activeTab === "senior" && (
          <div>
            <div className="ob-sig-grid">
              <div className="ob-sig-card g">
                <div className="ob-sig-label g">✅ Green Lights</div>
                <div className="ob-sig-item"><div className="ob-sig-dot g" />Detailed event calendar with a clear A priority</div>
                <div className="ob-sig-item"><div className="ob-sig-dot g" />Honest PBs and competition history — not inflated</div>
                <div className="ob-sig-item"><div className="ob-sig-dot g" />Has used structured coaching before — understands the process</div>
                <div className="ob-sig-item"><div className="ob-sig-dot g" />Sleep and recovery rated "Good" or above</div>
                <div className="ob-sig-item"><div className="ob-sig-dot g" />Motivation rating 7–10 with a specific reason stated</div>
                <div className="ob-sig-item"><div className="ob-sig-dot g" />Consistent, documented current training load</div>
              </div>
              <div className="ob-sig-card a">
                <div className="ob-sig-label a">⚠️ Amber</div>
                <div className="ob-sig-item"><div className="ob-sig-dot a" />Sleep rated "Poor" or "Fair" — recovery limits adaptation. Address early.</div>
                <div className="ob-sig-item"><div className="ob-sig-dot a" />Multiple A events close together — may need to reframe as A/B to protect peak</div>
                <div className="ob-sig-item"><div className="ob-sig-dot a" />Specific supplements or nutrition plan mentioned — check compatibility with training</div>
                <div className="ob-sig-item"><div className="ob-sig-dot a" />Previous coach mentioned negatively — understand what went wrong first</div>
                <div className="ob-sig-item"><div className="ob-sig-dot a" />Very high current volume — risk of compounding overtraining</div>
              </div>
              <div className="ob-sig-card r">
                <div className="ob-sig-label r">🚩 Red Flags</div>
                <div className="ob-sig-item"><div className="ob-sig-dot r" />Unresolved injury — mandatory clearance before programme build</div>
                <div className="ob-sig-item"><div className="ob-sig-dot r" />Sleep consistently "Poor" — address before loading. Adaptation requires recovery.</div>
                <div className="ob-sig-item"><div className="ob-sig-dot r" />No event calendar — senior athletes without goals are very hard to programme for. Clarify first.</div>
                <div className="ob-sig-item"><div className="ob-sig-dot r" />Motivation below 5 — direct call before investing in programme design</div>
              </div>
              <div className="ob-sig-card p">
                <div className="ob-sig-label p">💡 Use in Design</div>
                <div className="ob-sig-item"><div className="ob-sig-dot p" />Q3 (previous coaching) — tells you exactly how not to replicate mistakes</div>
                <div className="ob-sig-item"><div className="ob-sig-dot p" />Q10 (success definition) — your north star for this athlete. Refer back at every review.</div>
                <div className="ob-sig-item"><div className="ob-sig-dot p" />Q5 (typical week) — real baseline data. Trust this more than their self-rated fitness.</div>
                <div className="ob-sig-item"><div className="ob-sig-dot p" />Senior athletes often have strong opinions — establish your philosophy clearly and early</div>
              </div>
            </div>
            <div className="ob-card">
              <div className="ob-card-head"><div className="ob-card-icon g">📝</div><div><div className="ob-card-title">Senior Squad — 48hr Checklist</div></div></div>
              <div className="ob-card-body">
                <div className="ob-action-row">
                  <div>
                    <div className="ob-col-label">Must Do</div>
                    <div className="ob-act-item"><span className="ob-arr">→</span>Map the full event calendar before building anything — non-negotiable for periodisation</div>
                    <div className="ob-act-item"><span className="ob-arr">→</span>Read Q3 (previous coaching) thoroughly — don't repeat what didn't work</div>
                    <div className="ob-act-item"><span className="ob-arr">→</span>Match week one to their stated current training load</div>
                    <div className="ob-act-item"><span className="ob-arr">→</span>Be direct in your intro — senior athletes respond to confidence and clarity</div>
                    <div className="ob-act-item"><span className="ob-arr">→</span>Confirm A event and align periodisation immediately</div>
                  </div>
                  <div>
                    <div className="ob-col-label">Good to Do</div>
                    <div className="ob-act-item"><span className="ob-arr c">→</span>Ask one good clarifying question in your intro — shows engagement without overwhelming</div>
                    <div className="ob-act-item"><span className="ob-arr c">→</span>Reference their Q10 success definition — "here's what we're building toward"</div>
                    <div className="ob-act-item"><span className="ob-arr c">→</span>Check Q6 device/platform and connect Final Surge to Garmin/Strava if applicable</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── RUNNING TECHNIQUE ── */}
        {activeTab === "running" && (
          <div>
            <div className="ob-sig-grid">
              <div className="ob-sig-card g">
                <div className="ob-sig-label g">✅ Green Lights</div>
                <div className="ob-sig-item"><div className="ob-sig-dot g" />Clear articulate self-description of running style — self-aware athlete</div>
                <div className="ob-sig-item"><div className="ob-sig-dot g" />No current injury or pain — assessment can proceed without modification</div>
                <div className="ob-sig-item"><div className="ob-sig-dot g" />Knows cadence — data-aware, will engage well with metrics</div>
                <div className="ob-sig-item"><div className="ob-sig-dot g" />Well-fitted, consistent training shoes — reliable baseline gait data</div>
                <div className="ob-sig-item"><div className="ob-sig-dot g" />Has a clear target event — technique work has obvious context and urgency</div>
              </div>
              <div className="ob-sig-card a">
                <div className="ob-sig-label a">⚠️ Amber — Prepare specifically</div>
                <div className="ob-sig-item"><div className="ob-sig-dot a" />Orthotics mentioned — understand prescription history. Don't assume they're the long-term solution.</div>
                <div className="ob-sig-item"><div className="ob-sig-dot a" />Significant form breakdown when fatigued — plan to film both fresh and fatigued states</div>
                <div className="ob-sig-item"><div className="ob-sig-dot a" />Triathlete — ask about bike fit and volume. Run-off-bike mechanics are a separate assessment layer.</div>
                <div className="ob-sig-item"><div className="ob-sig-dot a" />Previous conflicting gait analysis — establish your own baseline without dismissing prior work</div>
                <div className="ob-sig-item"><div className="ob-sig-dot a" />Target event within 4 weeks — technique changes take time. Manage expectations clearly.</div>
              </div>
              <div className="ob-sig-card r">
                <div className="ob-sig-label r">🚩 Red Flags</div>
                <div className="ob-sig-item"><div className="ob-sig-dot r" />Current pain during running — do not proceed until investigated. Refer to physio first.</div>
                <div className="ob-sig-item"><div className="ob-sig-dot r" />Recent surgery or acute injury — mandatory medical clearance before any assessment</div>
                <div className="ob-sig-item"><div className="ob-sig-dot r" />"Pushing through" significant pain — needs direct conversation on discomfort vs injury</div>
                <div className="ob-sig-item"><div className="ob-sig-dot r" />Physio has recommended no running — confirm clearance before booking session</div>
              </div>
              <div className="ob-sig-card p">
                <div className="ob-sig-label p">💡 Pre-Session Prep</div>
                <div className="ob-sig-item"><div className="ob-sig-dot p" />Q6 (self-described style) — tells you where to point the camera first</div>
                <div className="ob-sig-item"><div className="ob-sig-dot p" />Q8 (pain/discomfort location) — tells you which movement pattern to prioritise</div>
                <div className="ob-sig-item"><div className="ob-sig-dot p" />Q9 (fatigue breakdown) — plan a longer filming run to capture form degradation live</div>
                <div className="ob-sig-item"><div className="ob-sig-dot p" />Injury history often leaves compensatory patterns even after recovery — look for them</div>
              </div>
            </div>
            <div className="ob-card">
              <div className="ob-card-head"><div className="ob-card-icon a">📝</div><div><div className="ob-card-title">Running Technique — 48hr Checklist</div></div></div>
              <div className="ob-card-body">
                <div className="ob-action-row">
                  <div>
                    <div className="ob-col-label">Must Do</div>
                    <div className="ob-act-item"><span className="ob-arr">→</span>Check injury history before confirming session — refer to physio if anything unclear</div>
                    <div className="ob-act-item"><span className="ob-arr">→</span>Confirm what shoes they'll bring — training AND race shoes</div>
                    <div className="ob-act-item"><span className="ob-arr">→</span>Note orthotic use and prepare to assess with/without where appropriate</div>
                    <div className="ob-act-item"><span className="ob-arr">→</span>Remind athlete not to change their running before session — include in intro message</div>
                    <div className="ob-act-item"><span className="ob-arr">→</span>Schedule session within 5 days — momentum matters at sign-up</div>
                    <div className="ob-act-item"><span className="ob-arr">→</span>Plan filming angles and location before session day — don't improvise</div>
                  </div>
                  <div>
                    <div className="ob-col-label">Good to Do</div>
                    <div className="ob-act-item"><span className="ob-arr c">→</span>Re-read Q8 (pain/discomfort) the morning of the session</div>
                    <div className="ob-act-item"><span className="ob-arr c">→</span>If triathlete — ask about upcoming training to understand fatigue state on session day</div>
                    <div className="ob-act-item"><span className="ob-arr c">→</span>For one-off clients — mention the subscription in intro but don't push it. Let the session sell.</div>
                    <div className="ob-act-item"><span className="ob-arr c">→</span>Build drills programme within 24hrs of session while observations are fresh</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── RED FLAGS ── */}
        {activeTab === "flags" && (
          <div>
            <div className="ob-card">
              <div className="ob-card-head">
                <div className="ob-card-icon o">🚩</div>
                <div>
                  <div className="ob-card-title">Universal Red Flags — All Programmes</div>
                  <div className="ob-card-sub">Never build a programme before resolving a red flag. These apply across every programme type.</div>
                </div>
              </div>
              <div className="ob-card-body">
                <div className="ob-flag-box r"><strong>🚨 Unresolved Injury</strong>Any injury described as "still there", "comes and goes", or "haven't had it checked" must be resolved before programme build. Contact the athlete directly, ask clear questions about current pain status, and refer to a physiotherapist if in any doubt. Do not programme around an undiagnosed injury.</div>
                <div className="ob-flag-box r"><strong>🚨 Current Pain During Exercise</strong>Different from past injury history. Current pain during running or training requires medical clearance — not a modified programme. Do not proceed with session or programme build. Refer to sports medicine or physiotherapy first.</div>
                <div className="ob-flag-box a"><strong>⚠️ Low Motivation Score (4/10 or below)</strong>A motivated athlete who struggles physically will push through. An unmotivated capable athlete won't engage. Call or message before building — understand what's behind the score. It may be a temporary life circumstance, or a deeper issue with their current relationship to sport.</div>
                <div className="ob-flag-box a"><strong>⚠️ Parent-Driven Junior Enrolment Without Athlete Buy-In</strong>Signs: athlete answers are vague, one-word, or reluctant. Parent answers are highly detailed and performance-focused. Contact the parent and gently explore whether the athlete is genuinely enthusiastic. A forced start rarely leads to a successful junior programme.</div>
                <div className="ob-flag-box a"><strong>⚠️ Significant Previous Coaching Conflict</strong>If an athlete describes a strongly negative prior coaching experience, understand what happened before replicating similar structure. Address your coaching philosophy directly and early — ideally in your intro message. Don't wait for the conflict to surface.</div>
                <div className="ob-flag-box p"><strong>💡 Medical Condition Disclosed</strong>Not automatically a red flag — but requires a clear management plan. Confirm the condition is managed, ask about protocols in place, and ensure emergency contact details are complete. For juniors, confirm the parent is aware it may be relevant to exercise.</div>
                <div className="ob-flag-box p"><strong>💡 Eating Disorder or Mental Health History</strong>If disclosed directly or indirectly (language around weight, restriction, or body image), approach with care. Do not programme around weight loss as a goal. Focus entirely on performance, strength, and health. A sports psychology referral alongside coaching may be appropriate.</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
