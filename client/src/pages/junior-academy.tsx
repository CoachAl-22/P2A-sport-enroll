import { useState } from "react";
import { Button } from "@/components/ui/button";
import LoginModal from "@/components/auth/login-modal";
import { Users, ArrowLeft, CheckCircle, Star, Target, Zap, Shield, Calendar, MessageCircle, ChevronDown, ChevronUp, Home } from "lucide-react";
import { Link } from "wouter";

const faqs = [
  {
    q: "My child plays multiple sports. Will this clash with their other commitments?",
    a: "No — we work around your child's full sporting calendar. All existing commitments are mapped during onboarding and the Power2ADAPT programme is built to complement them.",
  },
  {
    q: "How fit does my child need to be to join?",
    a: "Any level of fitness is welcome. The programme starts from wherever your child is right now — no previous structured training required.",
  },
  {
    q: "What happens if my child gets injured during another sport?",
    a: "Please tell us immediately. We will modify or pause the programme and communicate directly with you about returning to full training. We do not train athletes through unresolved injury.",
  },
  {
    q: "How will I know if my child is progressing?",
    a: "You will receive regular progress updates from the coach and can follow the programme in real time through the Final Surge app.",
  },
  {
    q: "Can I watch sessions?",
    a: "Yes, parents are welcome to observe. We only ask that you let the coaching session run without intervention — feedback is most effective when delivered by one voice.",
  },
  {
    q: "What is the photo and content consent policy?",
    a: "We may photograph or film sessions for coaching purposes. You will be asked about this during registration and your preference will be respected.",
  },
];

export default function JuniorAcademy() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="font-sans bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/">
                <h1 className="text-2xl font-heading font-bold text-primary-500 cursor-pointer">Power2ADAPT</h1>
              </Link>
            </div>
            <div className="hidden md:flex items-baseline space-x-1">
              <Link href="/" className="text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium">Home</Link>
              <Link href="/classes" className="text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium">Classes</Link>
              <Link href="/junior-academy" className="text-primary-500 bg-primary-50 px-3 py-2 rounded-md text-sm font-medium">Junior Academy</Link>
              <Link href="/high-performance" className="text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium">High Performance</Link>
              <Link href="/senior-squad" className="text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium">Senior Squad</Link>
              <Link href="/#contact" className="text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium">Contact</Link>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setIsLoginModalOpen(true)}
                variant="ghost"
                className="text-primary-500 hover:text-primary-700 font-medium"
              >
                Login
              </Button>
              <Button
                onClick={() => setIsLoginModalOpen(true)}
                className="bg-secondary-500 hover:bg-secondary-600 text-white font-medium"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-10 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center text-primary-200 hover:text-primary-100 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Main Programs
            </Link>
            <div className="inline-block bg-white/10 text-primary-100 text-xs font-bold uppercase tracking-widest px-4 py-1 rounded-full mb-4">
              Ages 12 – 16 · Multi-Sport Athletes
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">Junior Academy</h1>
            <p className="text-xl text-primary-100 max-w-3xl mx-auto leading-relaxed">
              Build the physical foundations that make young athletes better at every sport they play — not just one.
            </p>
          </div>
          <div className="flex justify-center">
            <img
              src="https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&h=400"
              alt="Junior Academy athletes developing skills at athletic track"
              className="w-full max-w-3xl h-80 object-cover rounded-xl shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Key Message */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-heading font-bold text-gray-900 mb-6">
            What Is the Junior Academy?
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            The Power2ADAPT Junior Academy is an in-person athletic development programme for young athletes aged 12–16, designed for multi-sport athletes who want to build the physical foundations that make them better at every sport they play — not just one. Sessions run up to twice per week and focus on movement quality, speed, strength, and athletic confidence — skills that transfer across all sports and carry athletes forward as they grow.
          </p>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold text-gray-900 mb-4">What's Included in Every Membership</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Calendar className="w-7 h-7 text-primary-500" />, title: "Up to 2 Sessions Per Week", desc: "In-person coaching sessions tailored to your child's schedule and sport commitments." },
              { icon: <Zap className="w-7 h-7 text-primary-500" />, title: "Personalised Final Surge Programme", desc: "A training programme built for your child, loaded into the free Final Surge app." },
              { icon: <Star className="w-7 h-7 text-primary-500" />, title: "Session Notes & Feedback", desc: "Detailed coach feedback after every session so your child knows what to focus on." },
              { icon: <Users className="w-7 h-7 text-primary-500" />, title: "Regular Parent Progress Updates", desc: "Stay informed with regular updates from the coach on your child's development." },
              { icon: <MessageCircle className="w-7 h-7 text-primary-500" />, title: "Coach Availability Between Sessions", desc: "Direct access to the coach for questions, schedule changes, or health concerns." },
              { icon: <Shield className="w-7 h-7 text-primary-500" />, title: "Safe, Confident Environment", desc: "Coached by Alistair Tait (Level 4 High Performance Coach) with a focus on enjoyment and confidence." },
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex items-center mb-3">
                  {item.icon}
                  <h3 className="text-lg font-heading font-bold text-gray-900 ml-3">{item.title}</h3>
                </div>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Is It For + Philosophy */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl font-heading font-bold text-gray-900 mb-6">Who Is It For?</h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                The Junior Academy is for young athletes aged 12–16 who compete in any sport — or multiple sports. Footballers, swimmers, rugby players, gymnasts, runners — any discipline is welcome.
              </p>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Your child does not need to be elite, just willing to work, open to coaching, and ready to improve.
              </p>
              <div className="space-y-3">
                {["Any sport or combination of sports", "Any current fitness level — we start from where your child is", "Athletes aged 12 to 16", "Multi-sport athletes juggling busy calendars"].map((point, i) => (
                  <div key={i} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-primary-50 border border-primary-100 p-6 rounded-xl">
                <div className="flex items-center mb-3">
                  <Target className="w-6 h-6 text-primary-500 mr-2" />
                  <h3 className="text-xl font-heading font-bold text-gray-900">Our Philosophy</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">Broad, fun, and confidence-building. We do not specialise too early, push volume over quality, or sacrifice enjoyment for short-term gains.</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl">
                <div className="flex items-center mb-3">
                  <Star className="w-6 h-6 text-primary-500 mr-2" />
                  <h3 className="text-xl font-heading font-bold text-gray-900">Our Approach</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">Every programme is built around school and sport commitments. Coached in person by Alistair Tait (Level 4 High Performance Coach) and supported through Final Surge.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold text-gray-900 mb-4">What Does It Cost?</h2>
            <p className="text-gray-600">Both levels include full access to the Final Surge coaching platform. All prices in Australian dollars, excluding GST.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Starter */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
              <div className="bg-primary-500 px-8 py-6 text-white text-center">
                <div className="text-sm font-bold uppercase tracking-widest mb-1">Starter</div>
                <div className="text-5xl font-heading font-bold">$100</div>
                <div className="text-primary-100 text-sm mt-1">+ GST per month</div>
                <div className="text-primary-100 font-medium mt-2">1 Session Per Week</div>
              </div>
              <div className="px-8 py-6 space-y-3">
                {["1 in-person session per week", "Personalised Final Surge programme", "Session notes & coach feedback", "Regular parent progress updates", "Coach messaging access"].map((f, i) => (
                  <div key={i} className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{f}</span>
                  </div>
                ))}
              </div>
              <div className="px-8 pb-8">
                <Button
                  onClick={() => window.open("/junior-academy-application.html", "_blank")}
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold"
                >
                  Apply — Starter
                </Button>
              </div>
            </div>

            {/* Performance */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-primary-500 relative">
              <div className="absolute top-4 right-4 bg-secondary-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Most Popular</div>
              <div className="bg-primary-700 px-8 py-6 text-white text-center">
                <div className="text-sm font-bold uppercase tracking-widest mb-1">Performance</div>
                <div className="text-5xl font-heading font-bold">$200</div>
                <div className="text-primary-100 text-sm mt-1">+ GST per month</div>
                <div className="text-primary-100 font-medium mt-2">2 Sessions Per Week</div>
              </div>
              <div className="px-8 py-6 space-y-3">
                {["2 in-person sessions per week", "Personalised Final Surge programme", "Session notes & coach feedback", "Regular parent progress updates", "Coach messaging access", "Faster development through increased frequency"].map((f, i) => (
                  <div key={i} className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{f}</span>
                  </div>
                ))}
              </div>
              <div className="px-8 pb-8">
                <Button
                  onClick={() => window.open("/junior-academy-application.html", "_blank")}
                  className="w-full bg-primary-700 hover:bg-primary-800 text-white font-bold"
                >
                  Apply — Performance
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* First Few Weeks */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold text-gray-900 mb-4">What to Expect in the First Few Weeks</h2>
            <p className="text-gray-600">The first two to three weeks focus on assessment, relationship-building, and establishing good habits — not testing or pushing to exhaustion.</p>
          </div>
          <div className="space-y-6">
            {[
              { week: "Week 1", title: "Introduction Session", desc: "Baseline movement assessment and building confidence with the environment and coach." },
              { week: "Weeks 2–3", title: "Personalised Programme Begins", desc: "Focus on movement quality over intensity as the individualised programme kicks off." },
              { week: "Week 4+", title: "Progressive Loading", desc: "Progressive loading begins as the foundation is established. Regular check-ins ensure the programme stays appropriate." },
            ].map((step, i) => (
              <div key={i} className="flex items-start bg-gray-50 rounded-xl p-6">
                <div className="bg-primary-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg mr-5 flex-shrink-0 mt-0.5 whitespace-nowrap">{step.week}</div>
                <div>
                  <h3 className="font-heading font-bold text-gray-900 text-lg mb-1">{step.title}</h3>
                  <p className="text-gray-600">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Parent Involvement */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold text-gray-900 mb-4">Parent Involvement</h2>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full">
              <thead>
                <tr className="bg-primary-500 text-white">
                  <th className="text-left px-6 py-4 font-heading font-bold">What we ask of parents</th>
                  <th className="text-left px-6 py-4 font-heading font-bold">Why it matters</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Complete the registration form in full including all health and medical information", "Enables safe programming and appropriate responses in any situation"],
                  ["Communicate any changes to health, injury, or schedule promptly", "Allows programme adjustments before problems arise"],
                  ["Encourage consistency — sessions missed are progress lost", "Adaptation happens over weeks and months, not individual sessions"],
                  ["Trust the process and let your child be coached", "Conflicting instructions confuse athletes and slow their development"],
                  ["Share post-session updates with your athlete", "Reinforces learning and builds athlete ownership of their development"],
                ].map(([ask, why], i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-6 py-4 text-sm text-gray-700 border-t border-gray-100 align-top">{ask}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 border-t border-gray-100 align-top">{why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold text-gray-900 mb-4">Common Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  className="w-full text-left px-6 py-4 flex items-center justify-between font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span>{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="w-5 h-5 text-primary-500 flex-shrink-0 ml-4" /> : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-gray-600 leading-relaxed border-t border-gray-100">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Sign Up CTA */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-heading font-bold mb-4">Ready to Apply?</h2>
          <p className="text-xl text-primary-100 mb-10">Excellence Through Consistency</p>

          <div className="bg-white/10 backdrop-blur-sm p-8 rounded-xl mb-10 text-left max-w-2xl mx-auto">
            <h3 className="text-xl font-bold mb-6 text-center">How to Sign Up</h3>
            <div className="space-y-5">
              {[
                { n: "1", title: "Apply via power2adapt.online", desc: "Complete the short application form so we can understand your child's sporting background and goals." },
                { n: "2", title: "We'll be in touch within 48 hours", desc: "Alistair will review the application, confirm a place, and answer any questions." },
                { n: "3", title: "Registration link", desc: "Once accepted, you'll receive a Final Surge registration link. The onboarding form takes approximately 10 minutes." },
                { n: "4", title: "Programme begins", desc: "Alistair builds the personalised programme and your child starts within the agreed timeframe." },
              ].map((step) => (
                <div key={step.n} className="flex items-start">
                  <div className="bg-white text-primary-600 rounded-full w-7 h-7 flex items-center justify-center font-bold text-sm mr-4 mt-0.5 flex-shrink-0">{step.n}</div>
                  <div>
                    <div className="font-semibold">{step.title}</div>
                    <div className="text-primary-200 text-sm mt-0.5">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => window.open("/junior-academy-application.html", "_blank")}
              className="bg-secondary-500 hover:bg-secondary-600 text-white font-bold px-8 py-3 text-lg"
            >
              Apply Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="bg-white/10 border-white text-white hover:bg-white/20 font-bold px-8 py-3 text-lg"
            >
              <a href="mailto:info@power2adapt.com">Email Us a Question</a>
            </Button>
          </div>
          <p className="text-primary-200 text-sm mt-4">Questions? Email info@power2adapt.com</p>

          <div className="mt-10 pt-8 border-t border-white/20">
            <Link href="/">
              <Button variant="ghost" className="text-primary-200 hover:text-white hover:bg-white/10">
                <Home className="w-4 h-4 mr-2" />
                Return to Home
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  );
}
