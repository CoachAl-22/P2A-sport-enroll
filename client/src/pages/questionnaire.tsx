import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Questionnaire() {
  const [submitted, setSubmitted] = useState(false);
  const [runVal, setRunVal] = useState(5);
  const [engageVal, setEngageVal] = useState(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-[#F7F4EE] font-['DM_Sans'] flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="font-['Bebas_Neue'] text-4xl text-[#F5C400]">Survey Submitted!</h2>
          <p className="text-[#aaa]">Thanks for helping us make this program awesome. See you on the track!</p>
          <Button 
            className="mt-8 bg-[#E8303A] hover:bg-[#c4242d] font-['Bebas_Neue'] text-xl tracking-widest px-8 py-6"
            onClick={() => window.location.href = '/'}
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F7F4EE] font-['DM_Sans'] overflow-x-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap');
        
        .hero-tag {
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          font-size: 11px;
          letter-spacing: 3px;
          text-transform: uppercase;
          background: #F5C400;
          color: #0D0D0D;
          display: inline-block;
          padding: 4px 12px;
          border-radius: 2px;
          margin-bottom: 16px;
        }

        .hero h1 {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(52px, 12vw, 90px);
          line-height: 0.92;
          letter-spacing: 1px;
          color: #F7F4EE;
        }

        .section-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 36px;
          color: #F5C400;
          line-height: 1;
        }

        .section-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 24px;
          letter-spacing: 1.5px;
          color: #F7F4EE;
          text-transform: uppercase;
        }

        .opt-label {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #2A2A2A;
          border: 2px solid #3a3a3a;
          border-radius: 8px;
          padding: 10px 14px;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
          font-size: 14px;
          font-weight: 500;
        }

        .opt-label:hover {
          border-color: #E8303A;
          background: #333;
        }

        input[type="range"] {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          background: linear-gradient(90deg, #E8303A, #F5C400);
          border-radius: 3px;
          outline: none;
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 22px; height: 22px;
          background: #F7F4EE;
          border: 3px solid #F5C400;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        }

        .star-group {
          display: flex;
          gap: 6px;
          flex-direction: row-reverse;
          justify-content: flex-end;
        }

        .star-group input { display: none; }

        .star-group label {
          font-size: 32px;
          cursor: pointer;
          color: #444;
          transition: color 0.15s, transform 0.1s;
        }

        .star-group input:checked ~ label,
        .star-group label:hover,
        .star-group label:hover ~ label {
          color: #F5C400;
          transform: scale(1.15);
        }
      `}} />

      {/* HERO */}
      <div className="bg-[#E8303A] p-8 md:p-12 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-black/10" />
        <div className="absolute -bottom-5 left-10 w-36 h-36 rounded-full bg-[#F5C400]/20" />
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="hero-tag">📋 Year 8 PE — Student Survey</div>
          <h1>Track<br />& <span>Field</span><br />Check-In</h1>
          <p className="mt-4 text-sm md:text-base opacity-90 max-w-lg leading-relaxed font-medium">
            No right or wrong answers — we just want to hear from YOU so we can make the next 4 weeks as good as possible.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <span className="bg-black/25 border border-white/20 rounded-full px-4 py-1.5 text-xs font-medium tracking-wide">⏱ Takes ~5 mins</span>
            <span className="bg-black/25 border border-white/20 rounded-full px-4 py-1.5 text-xs font-medium tracking-wide">🔒 Anonymous if you want</span>
            <span className="bg-black/25 border border-white/20 rounded-full px-4 py-1.5 text-xs font-medium tracking-wide">📅 4-Week Program</span>
          </div>
        </div>
      </div>

      {/* FORM */}
      <div className="max-w-2xl mx-auto px-6 py-12 pb-24">
        <form onSubmit={handleSubmit} className="space-y-12">
          
          {/* SECTION 1 */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <span className="section-num">01</span>
              <span className="section-title">About You</span>
            </div>
            <div className="h-0.5 bg-gradient-to-r from-[#E8303A] to-transparent mb-8" />
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-[#ccc] uppercase tracking-widest block">
                  <span className="text-[#E8303A] mr-1">Q1.</span> What's your name? (optional)
                </label>
                <input type="text" className="w-full bg-[#2A2A2A] border-2 border-[#3a3a3a] rounded-lg p-3 outline-none focus:border-[#F5C400]" placeholder="First name is fine, or leave blank" />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-[#ccc] uppercase tracking-widest block">
                  <span className="text-[#E8303A] mr-1">Q2.</span> What class / group are you in?
                </label>
                <input type="text" className="w-full bg-[#2A2A2A] border-2 border-[#3a3a3a] rounded-lg p-3 outline-none focus:border-[#F5C400]" placeholder="e.g. 8A, 8B..." />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-[#ccc] uppercase tracking-widest block">
                  <span className="text-[#E8303A] mr-1">Q3.</span> How would you describe yourself as an athlete right now?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {['Just getting started', 'Getting there', 'Pretty fit & active', 'Competitive athlete'].map((opt) => (
                    <label key={opt} className="opt-label">
                      <input type="radio" name="athlete_level" className="w-4 h-4 accent-[#F5C400]" />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2 */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <span className="section-num">02</span>
              <span className="section-title">Sports & Activities</span>
            </div>
            <div className="h-0.5 bg-gradient-to-r from-[#E8303A] to-transparent mb-8" />
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-[#ccc] uppercase tracking-widest block">
                  <span className="text-[#E8303A] mr-1">Q4.</span> Which sports or physical activities do you do outside of school?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    { l: '⚽ Football / Soccer' }, { l: '🏀 Basketball' }, { l: '🏐 Netball' },
                    { l: '🏉 Aussie Rules' }, { l: '🏈 Rugby' }, { l: '🏊 Swimming' },
                    { l: '🤸 Gymnastics' }, { l: '🥋 Martial Arts' }, { l: '🚴 Cycling' },
                    { l: '💃 Dance' }, { l: '🏃 Running' }, { l: '🏋️ Gym' }, { l: '🛋️ Nothing' }
                  ].map((s) => (
                    <label key={s.l} className="opt-label">
                      <input type="checkbox" className="w-4 h-4 accent-[#F5C400]" />
                      <span className="text-xs">{s.l}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-[#ccc] uppercase tracking-widest block">
                  <span className="text-[#E8303A] mr-1">Q5.</span> Any other sports or activities?
                </label>
                <input type="text" className="w-full bg-[#2A2A2A] border-2 border-[#3a3a3a] rounded-lg p-3 outline-none focus:border-[#F5C400]" placeholder="List them here..." />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-[#ccc] uppercase tracking-widest block">
                  <span className="text-[#E8303A] mr-1">Q6.</span> How many days a week are you active?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['0 days', '1-2 days', '3-4 days', '5+ days'].map(d => (
                    <label key={d} className="opt-label">
                      <input type="radio" name="days_active" className="w-4 h-4 accent-[#F5C400]" />
                      {d}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3 */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <span className="section-num">03</span>
              <span className="section-title">Running & Track</span>
            </div>
            <div className="h-0.5 bg-gradient-to-r from-[#E8303A] to-transparent mb-8" />
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-[#ccc] uppercase tracking-widest block">
                  <span className="text-[#E8303A] mr-1">Q7.</span> Which types of running do you enjoy most?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    '⚡ Short sprints (100m)', '🔄 Middle distance (400–800m)', 
                    '🌍 Long distance (1500m+)', '🚧 Hurdles', 
                    '🤝 Relay races', '😄 Fun / social runs', '😬 I don\'t enjoy running'
                  ].map(r => (
                    <label key={r} className="opt-label">
                      <input type="checkbox" className="w-4 h-4 accent-[#F5C400]" />
                      <span className="text-xs">{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-[#ccc] uppercase tracking-widest block">
                  <span className="text-[#E8303A] mr-1">Q8.</span> How much do you enjoy running overall?
                </label>
                <div className="space-y-4">
                  <div className="flex justify-between text-[10px] text-[#888] font-bold uppercase tracking-wider">
                    <span>😩 Hate it</span><span>😐 It's OK</span><span>🔥 Love it</span>
                  </div>
                  <input type="range" min="1" max="10" value={runVal} onChange={(e) => setRunVal(parseInt(e.target.value))} />
                  <div className="text-center font-['Bebas_Neue'] text-3xl text-[#F5C400]">{runVal}</div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-[#ccc] uppercase tracking-widest block">
                  <span className="text-[#E8303A] mr-1">Q9.</span> Which field events sound fun?
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    '🦘 Long jump', '🏔️ High jump', '🪨 Shot put', 
                    '🥏 Discus', '🎯 Javelin', '3️⃣ Triple jump', 
                    '🎪 Pole vault', '🤷 Not sure'
                  ].map(f => (
                    <label key={f} className="opt-label">
                      <input type="checkbox" className="w-4 h-4 accent-[#F5C400]" />
                      <span className="text-xs">{f}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-[#ccc] uppercase tracking-widest block">
                  <span className="text-[#E8303A] mr-1">Q10.</span> What do you find hardest about track?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    '😴 Gets boring quickly', '💨 Running out of breath', 
                    '😣 It hurts / too hard', '🧠 Staying motivated', 
                    '🏃 Not knowing technique', '😰 Competing', '😎 Nothing!'
                  ].map(h => (
                    <label key={h} className="opt-label">
                      <input type="radio" name="hardest" className="w-4 h-4 accent-[#F5C400]" />
                      <span className="text-xs">{h}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 4 */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <span className="section-num">04</span>
              <span className="section-title">What Makes PE Good</span>
            </div>
            <div className="h-0.5 bg-gradient-to-r from-[#E8303A] to-transparent mb-8" />
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-[#ccc] uppercase tracking-widest block">
                  <span className="text-[#E8303A] mr-1">Q11.</span> What makes a PE session fun?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    '🎮 Competitive games', '🏅 Personal challenges', 
                    '🎵 Music playing', '🤜 Working as a team', 
                    '🌀 Lots of variety', '🗽 Free choice', 
                    '📈 Beating your own record', '👫 Being with friends'
                  ].map(f => (
                    <label key={f} className="opt-label">
                      <input type="checkbox" className="w-4 h-4 accent-[#F5C400]" />
                      <span className="text-xs">{f}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-[#ccc] uppercase tracking-widest block">
                  <span className="text-[#E8303A] mr-1">Q12.</span> How do you feel about competing?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    '🔥 Love it — bring it on', '👍 Fine sometimes', 
                    '🧘 Prefer personal goals', '😬 Uncomfortable'
                  ].map(c => (
                    <label key={c} className="opt-label">
                      <input type="radio" name="comp_feel" className="w-4 h-4 accent-[#F5C400]" />
                      <span className="text-xs">{c}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-[#ccc] uppercase tracking-widest block">
                  <span className="text-[#E8303A] mr-1">Q13.</span> How engaged do you feel currently?
                </label>
                <div className="space-y-4">
                  <div className="flex justify-between text-[10px] text-[#888] font-bold uppercase tracking-wider">
                    <span>😴 Checked out</span><span>😐 Sometimes in</span><span>🙌 Fully engaged</span>
                  </div>
                  <input type="range" min="1" max="10" value={engageVal} onChange={(e) => setEngageVal(parseInt(e.target.value))} />
                  <div className="text-center font-['Bebas_Neue'] text-3xl text-[#F5C400]">{engageVal}</div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 5 */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <span className="section-num">05</span>
              <span className="section-title">Your Goals</span>
            </div>
            <div className="h-0.5 bg-gradient-to-r from-[#E8303A] to-transparent mb-8" />
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-[#ccc] uppercase tracking-widest block">
                  <span className="text-[#E8303A] mr-1">Q14.</span> What do you want to get out of this?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    '💪 Get fitter & faster', '🎯 Improve technique', 
                    '🆕 Try new events', '⏱️ Set a PB', 
                    '😄 Just enjoy it', '🏆 Make a school team', 
                    '👫 With my mates', '📝 Get a good mark'
                  ].map(g => (
                    <label key={g} className="opt-label">
                      <input type="checkbox" className="w-4 h-4 accent-[#F5C400]" />
                      <span className="text-xs">{g}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-[#ccc] uppercase tracking-widest block">
                  <span className="text-[#E8303A] mr-1">Q15.</span> One specific event or skill?
                </label>
                <input type="text" className="w-full bg-[#2A2A2A] border-2 border-[#3a3a3a] rounded-lg p-3 outline-none focus:border-[#F5C400]" placeholder="e.g. 100m, long jump..." />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-[#ccc] uppercase tracking-widest block">
                  <span className="text-[#E8303A] mr-1">Q16.</span> What would make this awesome?
                </label>
                <textarea className="w-full bg-[#2A2A2A] border-2 border-[#3a3a3a] rounded-lg p-3 outline-none focus:border-[#F5C400] min-h-[100px]" placeholder="Be as honest as you want!" />
              </div>
            </div>
          </section>

          {/* SECTION 6 */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <span className="section-num">06</span>
              <span className="section-title">Final Bits</span>
            </div>
            <div className="h-0.5 bg-gradient-to-r from-[#E8303A] to-transparent mb-8" />
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-[#ccc] uppercase tracking-widest block">
                  <span className="text-[#E8303A] mr-1">Q17.</span> Any injuries?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="opt-label"><input type="radio" name="injury" className="accent-[#F5C400]" /> ✅ Nope</label>
                  <label className="opt-label"><input type="radio" name="injury" className="accent-[#F5C400]" /> ⚠️ Yes</label>
                </div>
                <textarea className="w-full bg-[#2A2A2A] border-2 border-[#3a3a3a] rounded-lg p-3 outline-none focus:border-[#F5C400] mt-2 min-h-[60px]" placeholder="If yes, briefly describe..." />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-[#ccc] uppercase tracking-widest block">
                  <span className="text-[#E8303A] mr-1">Q18.</span> Overall excitement level?
                </label>
                <div className="star-group">
                  {[5,4,3,2,1].map(n => (
                    <span key={n}>
                      <input type="radio" name="excitement" id={`s${n}`} value={n} />
                      <label htmlFor={`s${n}`} className="text-4xl">★</label>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="text-center pt-8">
            <Button type="submit" className="bg-[#E8303A] hover:bg-[#c4242d] text-white rounded-lg px-12 py-8 font-['Bebas_Neue'] text-2xl tracking-[2px] shadow-[0_4px_20px_rgba(232,48,58,0.35)] hover:scale-105 transition-all">
              Submit Check-In
            </Button>
            <p className="text-[10px] text-[#666] italic mt-4">Your responses help us make PE better for everyone.</p>
          </div>

        </form>
      </div>
    </div>
  );
}
