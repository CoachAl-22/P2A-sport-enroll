import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageCircle, X, Sparkles, Send, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Step = "welcome" | "goal" | "age" | "sports" | "recommendation";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
}

interface Program {
  name: string;
  tagline: string;
  ageRange: string;
  price: string;
  highlights: string[];
  link: string;
  highlight?: boolean;
}

const GOALS = [
  { key: "speed", label: "⚡ Improve speed & fitness" },
  { key: "competition", label: "🏆 Prepare for competition" },
  { key: "school", label: "🏫 Boost school sport performance" },
  { key: "general", label: "💪 General athleticism" },
  { key: "unsure", label: "🤔 Not sure yet" },
];

const AGE_RANGES = [
  { key: "5-8", label: "5 – 8 years" },
  { key: "9-12", label: "9 – 12 years" },
  { key: "13-15", label: "13 – 15 years" },
  { key: "16+", label: "16 + years" },
];

function getRecommendations(goal: string, ageKey: string): Program[] {
  const isCompOrElite = goal === "competition" || goal === "speed";
  const programs: Record<string, Program[]> = {
    "5-8": [
      {
        name: "Foundation Program",
        tagline: "The perfect starting point for young athletes",
        ageRange: "5 – 8 years",
        price: "Group classes available",
        highlights: ["Run, jump & throw fundamentals", "Fun & confidence-building", "Small group sessions"],
        link: "/classes",
        highlight: true,
      },
    ],
    "9-12": [
      {
        name: "Emerging Athlete Program",
        tagline: "Developing athletic skills with purpose",
        ageRange: "9 – 12 years",
        price: "Group classes available",
        highlights: ["Speed & movement training", "Multi-sport athleticism", "Skill progression tracking"],
        link: "/classes",
        highlight: true,
      },
      {
        name: "Junior Academy",
        tagline: "Personalised 1-on-1 coaching",
        ageRange: "9 – 15 years",
        price: "From $100/month",
        highlights: ["Personalised programme via Final Surge app", "1 or 2 sessions per week", "Direct coach access & feedback"],
        link: "/junior-academy",
      },
    ],
    "13-15": [
      {
        name: "Academy Program",
        tagline: "Intermediate training for serious athletes",
        ageRange: "12 – 15 years",
        price: "Group classes available",
        highlights: ["Structured speed & strength work", "Competition simulation", "Technique refinement"],
        link: "/classes",
        highlight: !isCompOrElite,
      },
      {
        name: "Junior Academy",
        tagline: "Personalised 1-on-1 coaching",
        ageRange: "9 – 15 years",
        price: "From $100/month",
        highlights: ["Personalised programme via Final Surge app", "1 or 2 sessions per week", "Direct coach access & feedback"],
        link: "/junior-academy",
        highlight: isCompOrElite,
      },
    ],
    "16+": [
      {
        name: "Senior Squad",
        tagline: "Unlimited training for competition-ready athletes",
        ageRange: "16+ years",
        price: "$200/month + GST",
        highlights: ["Unlimited sessions", "Strength & conditioning programme", "Speed assessment + goal setting session", "Final Surge app access"],
        link: "/senior-squad",
        highlight: true,
      },
      {
        name: "High Performance Squad",
        tagline: "Elite-level training — by application only",
        ageRange: "16+ years",
        price: "Application required",
        highlights: ["Elite competition preparation", "Individual programme design", "State & national level focus"],
        link: "/high-performance",
      },
    ],
  };
  return programs[ageKey] || [];
}

export default function OneClickChat() {
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState<Step>("welcome");
  const [goal, setGoal] = useState("");
  const [ageKey, setAgeKey] = useState("");
  const [sports, setSports] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!dismissed) setBubbleVisible(true);
    }, 6000);
    return () => clearTimeout(timer);
  }, [dismissed]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (text: string, isBot: boolean) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), text, isBot }]);
  };

  const openChat = () => {
    setBubbleVisible(false);
    setChatOpen(true);
    if (messages.length === 0) {
      setTimeout(() => {
        addMessage("Hi there! 👋 I'm here to help you find the right Power2ADAPT program. What are you hoping to achieve?", true);
        setStep("goal");
      }, 300);
    }
  };

  const handleGoal = (g: { key: string; label: string }) => {
    setGoal(g.key);
    addMessage(g.label, false);
    setTimeout(() => {
      addMessage("Great! How old is the athlete?", true);
      setStep("age");
    }, 600);
  };

  const handleAge = (a: { key: string; label: string }) => {
    setAgeKey(a.key);
    addMessage(a.label, false);
    setTimeout(() => {
      addMessage("What sports or activities do they play? (e.g. football, running, netball — any is fine!)", true);
      setStep("sports");
    }, 600);
  };

  const handleSportsSubmit = () => {
    if (!sports.trim()) return;
    addMessage(sports, false);
    setTimeout(() => {
      const recs = getRecommendations(goal, ageKey);
      addMessage(
        `Perfect! Based on what you've told me, here ${recs.length === 1 ? "is my top recommendation" : "are the best programs"} for your athlete:`,
        true
      );
      setStep("recommendation");
    }, 700);
  };

  const reset = () => {
    setMessages([]);
    setStep("welcome");
    setGoal("");
    setAgeKey("");
    setSports("");
    setTimeout(() => {
      addMessage("Hi there! 👋 I'm here to help you find the right Power2ADAPT program. What are you hoping to achieve?", true);
      setStep("goal");
    }, 300);
  };

  const recommendations = step === "recommendation" ? getRecommendations(goal, ageKey) : [];

  return (
    <>
      {/* Auto-popup bubble */}
      <AnimatePresence>
        {bubbleVisible && !chatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-50 max-w-xs"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 relative">
              <button
                onClick={() => { setBubbleVisible(false); setDismissed(true); }}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Program Finder</p>
                  <p className="text-xs text-green-500 font-medium">● Online now</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-3">
                👋 Hi! Not sure which program is right for your child? I can help you find the perfect fit in under a minute.
              </p>
              <Button
                onClick={openChat}
                size="sm"
                className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-semibold"
              >
                Find the right program →
              </Button>
              {/* Arrow */}
              <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white border-r border-b border-gray-200 rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring" }}
      >
        <button
          onClick={openChat}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col items-center justify-center relative group"
        >
          <MessageCircle className="w-7 h-7 text-white" />
          <span className="text-[10px] text-white font-bold mt-0.5">HELP</span>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
        </button>
      </motion.div>

      {/* Chat dialog */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="max-w-sm w-full p-0 gap-0 overflow-hidden flex flex-col" style={{ height: "580px" }}>
          {/* Header */}
          <DialogHeader className="p-4 bg-gradient-to-r from-primary-600 to-secondary-500 text-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-white text-sm font-bold">Program Finder</DialogTitle>
                  <p className="text-white/80 text-xs">Power2ADAPT · Usually replies instantly</p>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
          </DialogHeader>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.isBot ? "justify-start" : "justify-end"}`}>
                {m.isBot && (
                  <div className="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  m.isBot
                    ? "bg-white text-gray-800 rounded-tl-sm shadow-sm"
                    : "bg-primary-500 text-white rounded-tr-sm"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}

            {/* Recommendation cards */}
            {step === "recommendation" && recommendations.length > 0 && (
              <div className="space-y-3 mt-2">
                {recommendations.map((rec, i) => (
                  <div key={i} className={`bg-white rounded-xl shadow-sm border-2 p-4 ${rec.highlight ? "border-primary-500" : "border-gray-100"}`}>
                    {rec.highlight && (
                      <span className="text-xs font-bold text-white bg-primary-500 px-2 py-0.5 rounded-full mb-2 inline-block">
                        ⭐ Best match
                      </span>
                    )}
                    <h4 className="font-bold text-gray-900 text-sm">{rec.name}</h4>
                    <p className="text-xs text-gray-500 mb-2">{rec.tagline}</p>
                    <p className="text-xs font-semibold text-primary-600 mb-2">{rec.price} · {rec.ageRange}</p>
                    <ul className="space-y-1 mb-3">
                      {rec.highlights.map((h, j) => (
                        <li key={j} className="text-xs text-gray-600 flex items-start gap-1.5">
                          <span className="text-green-500 mt-0.5">✓</span> {h}
                        </li>
                      ))}
                    </ul>
                    <a
                      href={rec.link}
                      className="block text-center text-xs font-semibold text-primary-600 border border-primary-400 rounded-lg py-1.5 hover:bg-primary-50 transition-colors"
                    >
                      Learn more →
                    </a>
                  </div>
                ))}

                {/* Discovery call CTA */}
                <div className="bg-gradient-to-r from-primary-600 to-secondary-500 rounded-xl p-4 text-white text-center">
                  <p className="font-bold text-sm mb-1">Ready to take the next step?</p>
                  <p className="text-xs text-white/80 mb-3">Book a free 15-minute Discovery Call with Alistair — no obligation, just a friendly chat about your athlete's goals.</p>
                  <a
                    href="https://power2adapt.setmore.com/services/a9a6a66a-9c61-4bec-829a-84d78687c2c0"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-white text-primary-600 font-bold text-sm rounded-lg py-2.5 px-4 hover:bg-gray-50 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    Book Free Discovery Call
                  </a>
                </div>

                <button onClick={reset} className="w-full text-xs text-gray-400 hover:text-gray-600 py-1">
                  ← Start over
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="flex-shrink-0 bg-white border-t border-gray-100">
            {step === "goal" && (
              <div className="p-3 grid grid-cols-1 gap-2">
                {GOALS.map(g => (
                  <button
                    key={g.key}
                    onClick={() => handleGoal(g)}
                    className="text-left text-sm px-4 py-2.5 rounded-xl border border-gray-200 hover:border-primary-400 hover:bg-primary-50 transition-colors font-medium text-gray-700"
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            )}

            {step === "age" && (
              <div className="p-3 grid grid-cols-2 gap-2">
                {AGE_RANGES.map(a => (
                  <button
                    key={a.key}
                    onClick={() => handleAge(a)}
                    className="text-sm px-3 py-2.5 rounded-xl border border-gray-200 hover:border-primary-400 hover:bg-primary-50 transition-colors font-medium text-gray-700"
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            )}

            {step === "sports" && (
              <div className="p-3 flex gap-2">
                <Input
                  placeholder="e.g. football, netball, running…"
                  value={sports}
                  onChange={e => setSports(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSportsSubmit()}
                  autoFocus
                  className="flex-1 text-sm"
                />
                <Button
                  onClick={handleSportsSubmit}
                  disabled={!sports.trim()}
                  size="icon"
                  className="bg-primary-500 hover:bg-primary-600"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
