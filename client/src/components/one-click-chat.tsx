import { DISCOVERY_CALL_URL } from "@/content/contact";
import { useState, useEffect, useRef } from "react";
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
    text: "Choose by your athlete’s stage and goals:\n\n• **Foundation** — Prep to Year 2.\n• **Emerging Athletes** — Years 3 to 6, at school or community venues.\n• **Junior Academy** — Years 6 to 9, with individual exceptions.\n• **Senior Squad** — Ages 16+, with individual placement considered.\n• **Team Sport Speed** — Ages 13+.\n• **High Performance** — Individual suitability discussed with Coach Al.\n\nYear 6 athletes may suit either Emerging Athletes or Junior Academy. A discovery call can help you choose.",
    cta: { label: "Compare programs", href: "/programs" },
  },
  cost: {
    text: "Fees depend on the program and number of sessions. School-based classes and Team Sport Speed are priced per class; Junior Academy, Senior Squad and High Performance have their own membership or coaching fees.\n\nCheck your program page for fees and GST wording, then confirm the total with the booking provider. Ballam Park may have separate venue membership costs — see Where we train.",
    cta: { label: "View programs and fees", href: "/programs" },
  },
  venues: {
    text: "We coach across Frankston, Mornington and Mt Eliza, including Ballam Park, Mornington Athletics Track, Peninsula Grammar and Toorak College.\n\nSchool sessions are for students of that school. Where we train has venue details, the weekly schedule and Ballam Park membership information. Confirm the session with Coach Al before attending.",
    cta: { label: "Where we train", href: "https://power2adapt.coach/where-we-train", external: true },
  },
  included: {
    text: "Coaching is matched to the athlete’s stage and goals. Inclusions vary by program, so check its page for session frequency, programming and feedback.\n\nBook a discovery call to discuss what your athlete needs and confirm which option fits.",
    cta: { label: "Compare programs", href: "/programs" },
  },
  trial: {
    text: "Every new athlete can try a free session. Book a free 15-minute discovery call with Coach Al so we can understand your athlete’s goals, confirm the right group and arrange the trial. Ballam Park venue membership requirements still need to be confirmed before attending.",
    cta: { label: "Book a Discovery Call", href: DISCOVERY_CALL_URL, external: true },
  },
  enrol: {
    text: "Start with the program finder and select your athlete’s stage. School and Team Sport Speed sessions link to the current booking provider. Junior Academy and Senior Squad use an application process.\n\nNot sure where to start? A discovery call helps us understand your athlete’s goals and confirm how we can help.",
    cta: { label: "Find a program", href: "/programs" },
  },
  apply: {
    text: "Junior Academy is for Years 6 to 9, with individual exceptions. Senior Squad placement is discussed individually.\n\nExplore the program page for the application and inclusions, or book a discovery call first to discuss suitability.",
    cta: { label: "Book a Discovery Call", href: DISCOVERY_CALL_URL, external: true },
  },
  contact: {
    text: "Book a free 15-minute video discovery call with Coach Al. We’ll discuss your athlete’s goals and confirm whether we can help.\n\nPrefer email? Contact info@power2adapt.com and include your mobile number and the best time to call (Melbourne time).",
    cta: { label: "Book a Discovery Call", href: DISCOVERY_CALL_URL, external: true },
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
  const [chatOpen, setChatOpen] = useState(false);
  const [activeTopic, setActiveTopic] = useState<TopicKey | null>(null);

  const helpButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!chatOpen) return;
    closeButton.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setChatOpen(false);
        helpButton.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chatOpen]);

  function openChat() { setChatOpen(true); }
  function closeChat() {
    setChatOpen(false);
    helpButton.current?.focus();
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
      {/* ── FAB button ── */}
      <motion.button
        ref={helpButton}
        aria-label="Open program help"
        aria-expanded={chatOpen}
        aria-controls="program-help-panel"
        onClick={() => chatOpen ? closeChat() : openChat()}
        className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-40 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8, type: "spring" }}
      >
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
            id="program-help-panel"
            role="region"
            aria-label="Program help"
            className="fixed bottom-[72px] right-3 sm:bottom-24 sm:right-6 z-50 w-[340px] max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden max-h-[min(520px,calc(100dvh-90px))] sm:max-h-[min(520px,calc(100dvh-112px))]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-secondary-500 p-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-none">Power2ADAPT</p>
                  <p className="text-white/70 text-xs mt-0.5">Program questions</p>
                </div>
              </div>
              <button ref={closeButton} aria-label="Close program help" onClick={closeChat} className="text-white/70 hover:text-white">
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
                onClick={() => handleCta(DISCOVERY_CALL_URL, true)}
                className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-primary-600 hover:text-primary-800"
              >
                <Phone className="w-3.5 h-3.5" />
                Book a Discovery Call
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
