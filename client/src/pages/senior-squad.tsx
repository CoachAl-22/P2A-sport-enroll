import { useState } from "react";
import { Button } from "@/components/ui/button";
import LoginModal from "@/components/auth/login-modal";
import ContactFormModal from "@/components/contact-form-modal";
import { Users, Building2, Smartphone, ArrowLeft, Star, CheckCircle, Trophy, Target, Clock, Heart } from "lucide-react";
import { Link } from "wouter";

export default function SeniorSquad() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);

  return (
    <div className="font-sans bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link href="/">
                  <h1 className="text-2xl font-heading font-bold text-primary-500 cursor-pointer">Power2ADAPT</h1>
                </Link>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link href="/" className="text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium">Home</Link>
                <Link href="/classes" className="text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium">Classes</Link>
                <Link href="/high-performance" className="text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium">High Performance</Link>
                <Link href="/senior-squad" className="text-primary-500 bg-primary-50 px-3 py-2 rounded-md text-sm font-medium">Senior Squad</Link>
                <Link href="/#contact" className="text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium">Contact</Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
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

      {/* Hero Section */}
      <section className="py-8 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center text-primary-200 hover:text-primary-100 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Main Programs
            </Link>
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">Senior Squad - Competition Preparation</h1>
            <p className="text-xl text-primary-100 max-w-3xl mx-auto">
              Goal-driven programs designed to prepare athletes for competition success at senior level
            </p>
          </div>

          {/* Hero Image */}
          <div className="mb-8">
            <div className="flex justify-center">
              <img 
                src="/images/georgia-goss-comp.jpg" 
                alt="Senior athlete in competition preparation" 
                className="w-full max-w-2xl h-96 object-cover rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Key Message */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-heading font-bold text-gray-900 mb-6">
            The Most Important Aspect of an Athlete's Journey is Being Prepared for Competition
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            When an athlete is unprepared they will never achieve their full potential. Our Senior Squad program 
            understands the specific requirements of senior athletes and provides the challenging, rewarding training 
            needed to keep athletes motivated and meet their expectations.
          </p>
        </div>
      </section>

      {/* Program Overview */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold text-gray-900 mb-4">Senior Squad Program</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Comprehensive training designed for serious athletes ready to compete at higher levels
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {/* Goal-Driven Training */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center mb-4">
                <Target className="w-8 h-8 text-primary-500 mr-3" />
                <h3 className="text-xl font-heading font-bold text-gray-900">Goal-Driven Programs</h3>
              </div>
              <p className="text-gray-600">
                Training programs specifically designed with clear goals and challenging targets to keep senior athletes motivated and progressing.
              </p>
            </div>

            {/* Competition Preparation */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center mb-4">
                <Trophy className="w-8 h-8 text-primary-500 mr-3" />
                <h3 className="text-xl font-heading font-bold text-gray-900">Competition Ready</h3>
              </div>
              <p className="text-gray-600">
                Comprehensive preparation from School Athletics to State Championships, including anxiety management and performance strategies.
              </p>
            </div>

            {/* Mental Preparation */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center mb-4">
                <Heart className="w-8 h-8 text-primary-500 mr-3" />
                <h3 className="text-xl font-heading font-bold text-gray-900">Mental Strategies</h3>
              </div>
              <p className="text-gray-600">
                Warmup routines, visualization, and relaxation strategies to manage nerves and anxiety during competitions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Elite Performance Program */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold text-gray-900 mb-4">Elite Performance Program</h2>
            <p className="text-lg text-primary-600 font-semibold mb-6">Guaranteed to Improve your Sports Performance!</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-heading font-bold text-gray-900 mb-6">Who is it for?</h3>
              <p className="text-lg text-gray-700 mb-8">
                Athletes that want to step up to an elite level of training, preparation, and performance in their sport and improve their athleticism.
              </p>

              <h3 className="text-2xl font-heading font-bold text-gray-900 mb-6">Why should I do this program?</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Sharpen your reaction time and improve your speed</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Reduce injury risk and spend more time playing</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Beat your opponent to the contest</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Be more athletic, turn quicker, accelerate faster and jump higher</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-8 rounded-xl">
              <h3 className="text-2xl font-heading font-bold text-gray-900 mb-6">Training Focus Areas</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-primary-500 mr-3" />
                  <span className="font-medium">Speed Improvement & Resilience</span>
                </div>
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-primary-500 mr-3" />
                  <span className="font-medium">Speed Endurance Building</span>
                </div>
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-primary-500 mr-3" />
                  <span className="font-medium">Strength Building</span>
                </div>
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-primary-500 mr-3" />
                  <span className="font-medium">Agility & Power Training</span>
                </div>
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-primary-500 mr-3" />
                  <span className="font-medium">In Season / Off-Season / Pre-Season Programs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-heading font-bold text-gray-900 mb-8">Proven Track Record</h2>
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              "I have had dozens of gold, silver and bronze medalists at Little Athletics State championships and have had 
              several athletes qualify for Nationals at a senior level. The pathway is the same - build the fundamentals, 
              challenge the athlete to push out of their comfort zone and simulate competition environments."
            </p>
            <div className="flex justify-center items-center space-x-8 text-primary-600">
              <div className="text-center">
                <div className="text-2xl font-bold">State and National</div>
                <div className="text-sm">Medalists</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">Multiple</div>
                <div className="text-sm">National Qualifiers</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Elite Performance Platform */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold text-gray-900 mb-4">Elite Performance Platform Bonus</h2>
            <p className="text-lg text-gray-600">Advanced tools and support for serious athletes</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-xl">
              <h4 className="font-bold text-gray-900 mb-3">Online Training Platform</h4>
              <p className="text-gray-600">Track workouts and progress with uploaded sessions for coach assessment and real-time feedback.</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl">
              <h4 className="font-bold text-gray-900 mb-3">Video Analysis</h4>
              <p className="text-gray-600">Embedded training videos and biomechanical analysis of movements and running technique.</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl">
              <h4 className="font-bold text-gray-900 mb-3">Goal Setting & Mindset</h4>
              <p className="text-gray-600">Performance mindset coaching sessions and goal setting with direct coach messaging.</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl">
              <h4 className="font-bold text-gray-900 mb-3">Progress Reviews</h4>
              <p className="text-gray-600">Quarterly program and 1:1 progress review with your coach for continuous improvement.</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl">
              <h4 className="font-bold text-gray-900 mb-3">Competition Strategy</h4>
              <p className="text-gray-600">Specialized preparation for managing competition nerves and establishing effective warmup routines.</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl">
              <h4 className="font-bold text-gray-900 mb-3">Performance Tracking</h4>
              <p className="text-gray-600">Detailed tracking of improvements across speed, strength, and athletic performance metrics.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-heading font-bold mb-6">Ready to Join Senior Squad?</h2>
          <p className="text-xl text-primary-100 mb-8">
            Take the first step towards elite athletic performance with our comprehensive training program
          </p>
          
          <div className="bg-white/10 backdrop-blur-sm p-8 rounded-xl mb-8">
            <h3 className="text-xl font-bold mb-4">How to Get Started</h3>
            <div className="space-y-4 text-left max-w-2xl mx-auto">
              <div className="flex items-start">
                <div className="bg-white text-primary-600 rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm mr-4 mt-1">1</div>
                <span>Book your free 15min, no obligation Discovery call</span>
              </div>
              <div className="flex items-start">
                <div className="bg-white text-primary-600 rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm mr-4 mt-1">2</div>
                <span>Introductory 2 class offer for $50 (Normally $150)</span>
              </div>
              <div className="flex items-start">
                <div className="bg-white text-primary-600 rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm mr-4 mt-1">3</div>
                <span>45min movement and running technique assessment + 1 standard speed improvement class</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Button 
              onClick={() => setIsContactFormOpen(true)}
              size="lg"
              className="bg-white text-primary-600 hover:bg-gray-100 font-bold px-8 py-3 text-lg"
            >
              Book Discovery Call
            </Button>
            <p className="text-primary-200 text-sm">
              * By Application Only - Assessment Required
            </p>
          </div>
        </div>
      </section>

      {/* Modals */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
      
      <ContactFormModal 
        isOpen={isContactFormOpen} 
        onClose={() => setIsContactFormOpen(false)} 
      />
    </div>
  );
}