import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Sparkles, Phone, ChevronRight, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

// ─── FAQ content ────────────────────────────────────────────────────────────

const TOPICS = [
  { key: "programs",   emoji: "🏃", label: "Which program suits my child?" },
  { key: "cost",       emoji: "💰", label: "How much does it cost?" },
  { key: "venues",     emoji: "📍", label: "Where are the venues?" },
  { key: "included",   emoji: "✅", label: "What's included in sessions?" },
  { key: "trial",      emoji: "🎯", label: "Can my child try a session?" },
  { key: "enrol",      emoji: "📋", label: "How do I enrol?" },
  { key: "apply",      emoji: "🌟", label: "Junior Academy / Senior Squad applications" },
  { key: "contact",    emoji: "💬", label: "Talk to someone" },
] as const;

type TopicKey = typeof TOPICS[number]["key"];

const ANSWERS: Record<TopicKey, { text: string; cta?: { label: string; href: string; external?: boolean } }> = {
  programs: {
    text: "We run 6 programs designed for different ages and goals:\n\n• **Foundation Class** — Prep–Year 2 (Ages 5–8). Movement skills & games. _(Peninsula Grammar, Toorak College, Mornington & Ballam Park)_\n• **Emerging Athletes** — Year 3–6 (Ages 8–12). Running, jumping, throwing. _(Peninsula Grammar, Toorak College, Mornington & Ballam Park)_\n• **Junior Academy — Ages 12–16** — Structured athletics & competition prep. Ballam Park & Mornington.\n• **Senior Squad** — Ages 16+. High-level squad training. Ballam Park & Mornington.\n• **Elite HP Squad** — By application only. Next-level performance.\n• **Team Sport Speed** — Ages 10+. Speed & agility for AFL, soccer, basketball & more. Wed & Fri at Mornington.\n\nUse our 3-step finder to see live class times at your preferred venue.",
    cta: { label: "Find the right class →", href: "/classes" },
  },
  cost: {
    text: "All programs are **$300 + GST per term** (approx. 9–10 weeks).\n\n• **Foundation, Emerging Athletes & Team Sport Speed** — full term payment upfront.\n• **Junior Academy, Senior Squad & Elite HP Squad** — full term or monthly direct debit available.\n\nDiscounts aren't listed publicly, but if your situation warrants it, bring it up on a Discovery Call and Alistair will work something out.",
    cta: { label: "Book a free discovery call", href: "https://power2adapt.setmore.com/services/a9a6a66a-9c61-4bec-829a-84d78687c2c0", external: true },
  },
  venues: {
    text: "We run across **4 venues** on the Mornington Peninsula.\n\n🏫 **Toorak College** — Foundation & Emerging Athletes (Thu 3:30–4:45pm · Tue waitlist)\n🏫 **Peninsula Grammar** — Foundation & Emerging Athletes (Mon 3:30–4:45pm)\n🏟️ **Ballam Park Athletic Track** — Foundation & Emerging Athletes (Thu 4:30–5:30pm) · Junior Academy, Senior Squad & Elite HP Squad (Tue & Thu 5:30pm)\n🏃 **Mornington Athletic Track** — Foundation & Emerging Athletes (Wed 4:30–5:30pm) · Junior Academy, Senior Squad, Elite HP Squad & Team Sport Speed (Wed & Fri 5:30pm)\n\n─────────────────\n📅 **Monday · Peninsula Grammar** (3:30–4:45pm)\n→ Foundation Class, Emerging Athletes\n\n📅 **Tuesday · Toorak College** _(Waitlist only)_\n→ Foundation Class, Emerging Athletes (3:30–4:45pm)\n📅 **Tuesday · Ballam Park** (5:30pm)\n→ Junior Academy, Senior Squad, Elite HP Squad\n\n📅 **Wednesday · Mornington**\n→ Foundation Class, Emerging Athletes (4:30–5:30pm)\n→ Junior Academy, Senior Squad, Elite HP Squad & Team Sport Speed (5:30pm)\n\n📅 **Thursday · Toorak College** (3:30–4:45pm)\n→ Foundation Class, Emerging Athletes\n📅 **Thursday · Ballam Park**\n→ Foundation Class, Emerging Athletes (4:30–5:30pm)\n→ Junior Academy, Senior Squad, Elite HP Squad (5:30pm)\n\n📅 **Friday · Mornington** (5:30pm)\n→ Junior Academy, Senior Squad & Team Sport Speed\n\n📅 **Saturday** · 1-on-1 coaching 8am–12pm (book via Setmore)\n\n📅 **Sunday** · Senior Squad & Elite HP Squad only _(venue & time TBC — contact us)_",
    cta: { label: "Browse by venue →", href: "/classes" },
  },
  included: {
    text: "Every session includes:\n\n✓ **Expert coaching** from qualified athletics coaches\n✓ **Structured warm-up** and cool-down\n✓ **Skill-based drills** tailored to the program level\n✓ **Small group sizes** for personal attention\n✓ **Progress tracking** through our platform\n\nFor Senior Squad & Elite HP Squad, athletes also get access to personalised training programmes and direct coach feedback between sessions.",
  },
  trial: {
    text: "Yes! We offer a **free trial session** for new athletes — no commitment required.\n\nThe best way to arrange a trial is to book a quick 15-minute Discovery Call with our head coach Alistair. He'll find the right class and session for your child to try.",
    cta: { label: "Book free trial / discovery call", href: "https://power2adapt.setmore.com/services/a9a6a66a-9c61-4bec-829a-84d78687c2c0", external: true },
  },
  enrol: {
    text: "Enrolment is simple and takes about 2 minutes:\n\n1️⃣ Use the **class finder** to pick your program, day & venue\n2️⃣ Click **\"Book this class\"** on the session you want\n3️⃣ Create an account (or log in) and add your child's details\n4️⃣ Pay securely — you're confirmed!\n\nFor Junior Academy, Senior Squad & Elite HP Squad, you'll need to submit an application first.",
    cta: { label: "Start the class finder →", href: "/classes" },
  },
  apply: {
    text: "**Junior Academy** and **Senior Squad** are selective programs designed for athletes who are ready to commit to structured training.\n\nTo apply:\n• Complete a short online application\n• Our coaching team reviews it\n• You'll hear back within 5 business days\n\nNot sure if your athlete is ready? Book a free discovery call — Alistair will give you an honest assessment.",
    cta: { label: "Book a discovery call", href: "https://power2adapt.setmore.com/services/a9a6a66a-9c61-4bec-829a-84d78687c2c0", external: true },
  },
  contact: {
    text: "Happy to help! The best way to get a quick, personal answer is a free **15-minute Discovery Call** with Alistair — our head coach. No sales pitch, just a friendly chat about your athlete's goals.\n\nAlternatively, use our Contact form and we'll get back to you within 1 business day.",
    cta: { label: "Book free discovery call", href: "https://power2adapt.setmore.com/services/a9a6a66a-9c61-4bec-829a-84d78687c2c0", external: true },
  },
};

// ─── Markdown-lite renderer ─────────────────────────────────────────────────
function renderText(text: string) {
  return text.split("\n").map((line, i) => {
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <span key={i} className="block leading-relaxed">
        {parts.map((part, j) =>
          j % 2 === 1 ? <strong key={j}>{part}</strong> : part
        )}
      </span>
    );
  });
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function OneClickChat() {
  const [, setLocation] = useLocation();
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [activeTopic, setActiveTopic] = useState<TopicKey | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { if (!dismissed) setBubbleVisible(true); }, 8000);
    return () => clearTimeout(t);
  }, [dismissed]);

  function openChat() {
    setBubbleVisible(false);
    setDismissed(true);
    setChatOpen(true);
  }

  function handleCta(href: string, external?: boolean) {
    setChatOpen(false);
    if (external) {
      window.open(href, "_blank", "noopener noreferrer");
    } else {
      setLocation(href);
    }
  }

  const answer = activeTopic ? ANSWERS[activeTopic] : null;
  const topicLabel = activeTopic ? TOPICS.find(t => t.key === activeTopic)?.label : null;

  return (
    <>
      {/* ── Auto-popup bubble ── */}
      <AnimatePresence>
        {bubbleVisible && !chatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.92 }}
            className="fixed bottom-24 right-6 z-50 max-w-[280px]"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 relative">
              <button
                onClick={() => { setBubbleVisible(false); setDismissed(true); }}
                className="absolute top-2 right-2 text-gray-300 hover:text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm leading-none">Got questions?</p>
                  <p className="text-xs text-green-500 font-medium mt-0.5">● We're here to help</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Ask us anything about programs, venues, pricing or how to enrol.
              </p>
              <Button
                onClick={openChat}
                size="sm"
                className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:opacity-90 text-white font-semibold"
              >
                Ask a question →
              </Button>
              <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white border-r border-b border-gray-200 rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FAB button ── */}
      <motion.button
        onClick={openChat}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8, type: "spring" }}
      >
        <span className="absolute inset-0 rounded-full bg-secondary-400 opacity-20 animate-ping" />
        <MessageCircle className="w-6 h-6 text-white" />
        <span className="text-[9px] text-white font-bold mt-0.5 tracking-wide">HELP</span>
        <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white" />
      </motion.button>

      {/* ── Chat panel ── */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed bottom-24 right-6 z-50 w-[340px] max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
            style={{ maxHeight: "520px" }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-secondary-500 p-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-none">Power2ADAPT</p>
                  <p className="text-white/70 text-xs mt-0.5">Ask us anything</p>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {!activeTopic ? (
                /* Topic list */
                <div className="p-3">
                  <p className="text-xs text-gray-400 font-medium px-1 mb-2 uppercase tracking-wide">
                    What would you like to know?
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {TOPICS.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setActiveTopic(t.key)}
                        className="flex items-center gap-3 text-left px-3 py-2.5 rounded-xl border border-gray-100 hover:border-primary-300 hover:bg-primary-50 transition-all group"
                      >
                        <span className="text-lg flex-shrink-0">{t.emoji}</span>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-primary-700 flex-1">
                          {t.label}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-primary-400 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Answer view */
                <div className="p-4">
                  <button
                    onClick={() => setActiveTopic(null)}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-3"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to questions
                  </button>

                  <p className="text-xs font-semibold text-primary-600 uppercase tracking-wide mb-2">
                    {topicLabel}
                  </p>

                  <div className="text-sm text-gray-700 space-y-1 mb-4">
                    {renderText(answer!.text)}
                  </div>

                  {answer?.cta && (
                    <button
                      onClick={() => handleCta(answer.cta!.href, answer.cta!.external)}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold text-sm rounded-xl py-3 hover:opacity-90 transition-opacity"
                    >
                      {answer.cta.external && <Phone className="w-4 h-4" />}
                      {answer.cta.label}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-4 py-3 flex-shrink-0 bg-gray-50">
              <button
                onClick={() => handleCta("https://power2adapt.setmore.com/services/a9a6a66a-9c61-4bec-829a-84d78687c2c0", true)}
                className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-primary-600 hover:text-primary-800"
              >
                <Phone className="w-3.5 h-3.5" />
                Book a free 15-min Discovery Call with Alistair
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
