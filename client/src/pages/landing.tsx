import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import LoginModal from "@/components/auth/login-modal";
import ContactFormModal from "@/components/contact-form-modal";
import { HighPerformanceSquadApplication } from "@/components/applications/high-performance-squad-application";
import OneClickChat from "@/components/one-click-chat";
import { Calendar, MapPin, Users, CreditCard, Smartphone, RotateCcw, Building2, MessageSquare, Phone, Mail, School, Clock, Youtube, Instagram, Facebook, X, Menu, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProgramQuiz } from '@/components/ProgramQuiz';

export default function Landing() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [isHighPerformanceSquadModalOpen, setIsHighPerformanceSquadModalOpen] = useState(false);
  const [isSchoolPartnershipsModalOpen, setIsSchoolPartnershipsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFoundationInfoModalOpen, setIsFoundationInfoModalOpen] = useState(false);
  const [isEmergingAthletesInfoModalOpen, setIsEmergingAthletesInfoModalOpen] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);

  return (
    <div className="font-sans bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-heading font-bold text-primary-500">Power2ADAPT</h1>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a href="#classes" className="text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium">Classes</a>
                <a href="#features" className="text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium">Features</a>
                <a href="/coaches" className="text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium">Our Coaches</a>
                <a href="/high-performance" className="text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium">High Performance</a>
                <a href="/junior-academy" className="text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium">Junior Academy</a>
                <a href="/senior-squad" className="text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium">Senior Squad</a>
                <a href="/education" className="text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium">Education</a>
                <a href="/questionnaire" className="bg-primary-500 text-white hover:bg-primary-600 px-4 py-2 rounded-md text-sm font-bold shadow-sm">Check-In</a>
                <a href="#contact" className="text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium">Contact</a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => setIsLoginModalOpen(true)}
                variant="ghost"
                className="hidden sm:inline-flex text-primary-500 hover:text-primary-700 font-medium"
              >
                Login
              </Button>
              <Button 
                onClick={() => setIsLoginModalOpen(true)}
                className="hidden sm:inline-flex bg-secondary-500 hover:bg-secondary-600 text-white font-medium"
              >
                Sign Up
              </Button>
              
              {/* Mobile menu button */}
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              <a 
                href="#classes" 
                className="block px-3 py-2 text-gray-700 hover:text-primary-500 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Classes
              </a>
              <a 
                href="#features" 
                className="block px-3 py-2 text-gray-700 hover:text-primary-500 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </a>
              <a 
                href="/coaches" 
                className="block px-3 py-2 text-gray-700 hover:text-primary-500 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Our Coaches
              </a>
              <a 
                href="/high-performance" 
                className="block px-3 py-2 text-gray-700 hover:text-primary-500 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                High Performance
              </a>
              <a 
                href="/junior-academy" 
                className="block px-3 py-2 text-gray-700 hover:text-primary-500 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Junior Academy
              </a>
              <a 
                href="/senior-squad" 
                className="block px-3 py-2 text-gray-700 hover:text-primary-500 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Senior Squad
              </a>
              <a 
                href="/education" 
                className="block px-3 py-2 text-gray-700 hover:text-primary-500 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Education
              </a>
              <a 
                href="/questionnaire" 
                className="block px-3 py-2 text-primary-600 font-bold"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Check-In
              </a>
              <a 
                href="#contact" 
                className="block px-3 py-2 text-gray-700 hover:text-primary-500 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contact
              </a>
              <div className="pt-2 border-t border-gray-200">
                <Button 
                  onClick={() => {
                    setIsLoginModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  variant="ghost"
                  className="w-full justify-start text-primary-500 hover:text-primary-700 font-medium"
                >
                  Login
                </Button>
                <Button 
                  onClick={() => {
                    setIsLoginModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full justify-start bg-secondary-500 hover:bg-secondary-600 text-white font-medium mt-2"
                >
                  Sign Up
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center bg-white">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl max-w-lg">
          Help your athlete run faster, jump higher, and train smarter.
        </h1>
        <p className="mt-4 text-lg text-gray-500 max-w-md">
          Term-based athletic programs for kids aged 5–17 on the Mornington Peninsula.
        </p>
        <button
          onClick={() => setShowQuiz(true)}
          className="mt-8 w-full max-w-xs bg-blue-600 text-white py-4 px-6 rounded-xl text-lg font-semibold hover:bg-blue-700 active:scale-95 transition-all"
        >
          Find the right class →
        </button>
        <button
          className="mt-4 text-sm text-gray-400 underline underline-offset-2 hover:text-gray-600 bg-transparent border-0 cursor-pointer"
          onClick={() => { window.location.href = '/classes'; }}
        >
          Browse all classes ↓
        </button>
      </section>

      {/* Trust signals */}
      <section className="bg-gray-50 py-8 px-4">
        <div className="flex flex-col sm:flex-row justify-center gap-6 max-w-2xl mx-auto">
          {[
            { icon: '📅', text: 'Term-based programs, ages 5–17' },
            { icon: '📍', text: 'Mornington Peninsula venues' },
            { icon: '🏅', text: 'Coached by accredited Level 2–4 coaches' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-xl">{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Quiz modal */}
      {showQuiz && (
        <ProgramQuiz onClose={() => setShowQuiz(false)} />
      )}

      {/* Quick Stats */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-heading font-bold text-primary-500 mb-2">1000+</div>
              <div className="text-gray-600">Students Helped</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-heading font-bold text-primary-500 mb-2">Multiple Venues and Options</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-heading font-bold text-primary-500 mb-2">Team Sport</div>
              <div className="text-gray-600">Athletic development - AFL, Soccer, Basketball, Netball and many more</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-heading font-bold text-primary-500 mb-2">98%</div>
              <div className="text-gray-600">Parent Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section id="features" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">Why Parents Choose Power2ADAPT</h2>
            <p className="text-xl text-gray-600">Simple, convenient, and designed with your family in mind</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">Easy Mobile Access</h3>
              <p className="text-gray-600">Manage enrollments, payments and schedules from anywhere on your phone</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <RotateCcw className="w-8 h-8 text-secondary-500" />
              </div>
              <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">Set and Forget Renewals</h3>
              <p className="text-gray-600">Your child automatically re-enrolls each term (with advance notice and easy opt-out)</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">Secure Online Payments</h3>
              <p className="text-gray-600">Pay safely online with instant receipts and automatic payment reminders</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-purple-500" />
              </div>
              <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">Multi-Venue Support</h3>
              <p className="text-gray-600">Manage classes across multiple school locations efficiently</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">Smart Notifications</h3>
              <p className="text-gray-600">Automated SMS and email reminders for enrollment and payments</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <School className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">Victorian School Terms</h3>
              <p className="text-gray-600">Aligned with 9-10 week government school terms and holidays</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sample Classes Preview */}
      <section id="classes" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">Available Classes - Term 2, 2026</h2>
            <p className="text-xl text-gray-600">10 weeks of professional athletic training</p>
            <p className="text-lg text-gray-500 mt-2">Senior and High Performance squads by Application</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Foundation Class */}
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary-500 transition-colors hover:shadow-lg">
              <img 
                src="/images/coach-georgia-crew.jpg" 
                alt="Young children learning fundamental movement skills" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-heading font-bold text-gray-900">Foundation Class</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Available
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="text-sm">Building fundamental movement skills</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-sm">Peninsula Grammar</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span className="text-sm">Ages Prep - Year 2 • 15 spots</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-heading font-bold text-primary-500">$30</span>
                      <span className="text-gray-500 text-sm"> + GST per class</span>
                    </div>
                    <Button 
                      onClick={() => {
                        window.open("https://www.thinksmartsoftware-au.com/ocr/schedule_view.php?c=5D6DC72044045&p_id=1&t=sportsbiz&set=yes", "_blank");
                      }}
                      className="bg-primary-500 hover:bg-primary-600 text-white"
                    >
                      Enroll Now
                    </Button>
                  </div>
                  <Button 
                    onClick={() => setIsFoundationInfoModalOpen(true)}
                    variant="outline"
                    className="w-full border-primary-300 text-primary-600 hover:bg-primary-50"
                  >
                    <Info className="w-4 h-4 mr-2" />
                    Find out more
                  </Button>
                </div>
              </div>
            </div>

            {/* Emerging Athletes */}
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary-500 transition-colors hover:shadow-lg">
              <img 
                src="/images/ashton-xcr.jpg" 
                alt="Young athletes developing skills in team sports" 
                className="w-full h-48 object-contain bg-gray-100"
              />
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-heading font-bold text-gray-900">Emerging Athletes</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Available
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="text-sm">Monday 3:30 - 4:45pm</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-sm">Peninsula Grammar</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span className="text-sm">Year 3-6 • 30 spots</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-heading font-bold text-primary-500">$30</span>
                      <span className="text-gray-500 text-sm"> + GST per class</span>
                    </div>
                    <Button 
                      onClick={() => {
                        window.open("https://www.thinksmartsoftware-au.com/ocr/schedule_view.php?c=5D6DC72044045&p_id=1&t=sportsbiz&set=yes", "_blank");
                      }}
                      className="bg-primary-500 hover:bg-primary-600 text-white"
                    >
                      Enroll Now
                    </Button>
                  </div>
                  <Button 
                    onClick={() => setIsEmergingAthletesInfoModalOpen(true)}
                    variant="outline"
                    className="w-full border-primary-300 text-primary-600 hover:bg-primary-50"
                  >
                    <Info className="w-4 h-4 mr-2" />
                    Find out more
                  </Button>
                </div>
              </div>
            </div>

            {/* Foundation Class - Toorak College Tuesday */}
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary-500 transition-colors hover:shadow-lg">
              <img 
                src="/images/coach-georgia-crew.jpg" 
                alt="Young children learning fundamental movement skills" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-heading font-bold text-gray-900">Foundation Class</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    Waitlist Open
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="text-sm">Tuesday 3:30 - 4:45pm</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-sm">Toorak College</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span className="text-sm">Ages Prep - Year 2 • 15 spots</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-heading font-bold text-primary-500">$30</span>
                      <span className="text-gray-500 text-sm"> + GST per class</span>
                    </div>
                    <Button 
                      onClick={() => {
                        window.open("https://forms.gle/TsQXvtULK17c5oaB8", "_blank");
                      }}
                      className="bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      Join Waitlist
                    </Button>
                  </div>
                  <Button 
                    onClick={() => setIsFoundationInfoModalOpen(true)}
                    variant="outline"
                    className="w-full border-primary-300 text-primary-600 hover:bg-primary-50"
                  >
                    <Info className="w-4 h-4 mr-2" />
                    Find out more
                  </Button>
                </div>
              </div>
            </div>

            {/* Emerging Athletes - Toorak College Tuesday NEW */}
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary-500 transition-colors hover:shadow-lg">
              <img 
                src="/images/ashton-xcr.jpg" 
                alt="Young athletes developing skills in team sports" 
                className="w-full h-48 object-contain bg-gray-100"
              />
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-heading font-bold text-gray-900">Emerging Athletes</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    Waitlist Open
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="text-sm">Tuesday 3:30 - 4:45pm</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-sm">Toorak College</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span className="text-sm">Year 3-6 • 30 spots</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-heading font-bold text-primary-500">$30</span>
                      <span className="text-gray-500 text-sm"> + GST per class</span>
                    </div>
                    <Button 
                      onClick={() => {
                        window.open("https://forms.gle/TsQXvtULK17c5oaB8", "_blank");
                      }}
                      className="bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      Join Waitlist
                    </Button>
                  </div>
                  <Button 
                    onClick={() => setIsEmergingAthletesInfoModalOpen(true)}
                    variant="outline"
                    className="w-full border-primary-300 text-primary-600 hover:bg-primary-50"
                  >
                    <Info className="w-4 h-4 mr-2" />
                    Find out more
                  </Button>
                </div>
              </div>
            </div>

            {/* Foundation Class - Toorak College Thursday NEW */}
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary-500 transition-colors hover:shadow-lg">
              <img 
                src="/images/coach-georgia-crew.jpg" 
                alt="Young children learning fundamental movement skills" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-heading font-bold text-gray-900">Foundation Class</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Available
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="text-sm">Thursday 3:30 - 4:45pm</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-sm">Toorak College</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span className="text-sm">Ages Prep - Year 2 • 15 spots</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-heading font-bold text-primary-500">$30</span>
                      <span className="text-gray-500 text-sm"> + GST per class</span>
                    </div>
                    <Button 
                      onClick={() => {
                        window.open("https://www.thinksmartsoftware-au.com/ocr/schedule_view.php?c=5D6DC72044045&p_id=1&t=sportsbiz&set=yes", "_blank");
                      }}
                      className="bg-primary-500 hover:bg-primary-600 text-white"
                    >
                      Enroll Now
                    </Button>
                  </div>
                  <Button 
                    onClick={() => setIsFoundationInfoModalOpen(true)}
                    variant="outline"
                    className="w-full border-primary-300 text-primary-600 hover:bg-primary-50"
                  >
                    <Info className="w-4 h-4 mr-2" />
                    Find out more
                  </Button>
                </div>
              </div>
            </div>

            {/* Emerging Athletes - Toorak College Thursday */}
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary-500 transition-colors hover:shadow-lg">
              <img 
                src="/images/ashton-xcr.jpg" 
                alt="Young athletes developing skills in team sports" 
                className="w-full h-48 object-contain bg-gray-100"
              />
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-heading font-bold text-gray-900">Emerging Athletes</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Available
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="text-sm">Thursday 3:30 - 4:45pm</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-sm">Toorak College</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span className="text-sm">Year 3-6 • 30 spots</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-heading font-bold text-primary-500">$30</span>
                      <span className="text-gray-500 text-sm"> + GST per class</span>
                    </div>
                    <Button 
                      onClick={() => {
                        window.open("https://www.thinksmartsoftware-au.com/ocr/schedule_view.php?c=5D6DC72044045&p_id=1&t=sportsbiz&set=yes", "_blank");
                      }}
                      className="bg-primary-500 hover:bg-primary-600 text-white"
                    >
                      Enroll Now
                    </Button>
                  </div>
                  <Button 
                    onClick={() => setIsEmergingAthletesInfoModalOpen(true)}
                    variant="outline"
                    className="w-full border-primary-300 text-primary-600 hover:bg-primary-50"
                  >
                    <Info className="w-4 h-4 mr-2" />
                    Find out more
                  </Button>
                </div>
              </div>
            </div>

            {/* Team Sport Speed - Friday 4:30pm */}
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary-500 transition-colors hover:shadow-lg">
              <img 
                src="/images/team-sport-running.jpg" 
                alt="Athletes training for speed and performance at athletic track" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-heading font-bold text-gray-900">Team Sport Speed</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Available
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="text-sm">Friday 4:30pm</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-sm">Mornington Athletic Track</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span className="text-sm">Ages 13+ • 10 spots only</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-heading font-bold text-primary-500">$30</span>
                    <span className="text-gray-500 text-sm"> + GST per class</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => {
                        window.open("https://power2adapt.setmore.com/", "_blank");
                      }}
                      variant="outline"
                      className="border-primary-500 text-primary-500 hover:bg-primary-50"
                    >
                      <Calendar className="w-4 h-4 mr-1" />
                      Book a Session
                    </Button>
                    <div className="relative">
                      <div className="absolute -top-10 -right-2 flex items-end gap-1 animate-bounce-subtle">
                        <span className="text-xs font-bold text-white whitespace-nowrap bg-gradient-to-r from-orange-500 to-red-500 px-2 py-1 rounded-full shadow-md">Want long term results?</span>
                        <svg className="w-5 h-5 text-red-500 flex-shrink-0 translate-y-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 5v14M19 12l-7 7-7-7" />
                        </svg>
                      </div>
                      <Button 
                        onClick={() => {
                          window.open("https://www.thinksmartsoftware-au.com/ocr/schedule_view.php?c=5D6DC72044045&p_id=1&t=sportsbiz&set=yes", "_blank");
                        }}
                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                      >
                        Enroll Now
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Sport Speed - Friday 5:30pm */}
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary-500 transition-colors hover:shadow-lg">
              <img 
                src="/images/team-sport-running.jpg" 
                alt="Athletes training for speed and performance at athletic track" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-heading font-bold text-gray-900">Team Sport Speed</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Available
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="text-sm">Friday 5:30pm</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-sm">Mornington Athletic Track</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span className="text-sm">Ages 13+ • 10 spots only</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-heading font-bold text-primary-500">$30</span>
                    <span className="text-gray-500 text-sm"> + GST per class</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => {
                        window.open("https://power2adapt.setmore.com/", "_blank");
                      }}
                      variant="outline"
                      className="border-primary-500 text-primary-500 hover:bg-primary-50"
                    >
                      <Calendar className="w-4 h-4 mr-1" />
                      Book a Session
                    </Button>
                    <div className="relative">
                      <div className="absolute -top-10 -right-2 flex items-end gap-1 animate-bounce-subtle">
                        <span className="text-xs font-bold text-white whitespace-nowrap bg-gradient-to-r from-orange-500 to-red-500 px-2 py-1 rounded-full shadow-md">Want long term results?</span>
                        <svg className="w-5 h-5 text-red-500 flex-shrink-0 translate-y-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 5v14M19 12l-7 7-7-7" />
                        </svg>
                      </div>
                      <Button 
                        onClick={() => {
                          window.open("https://www.thinksmartsoftware-au.com/ocr/schedule_view.php?c=5D6DC72044045&p_id=1&t=sportsbiz&set=yes", "_blank");
                        }}
                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                      >
                        Enroll Now
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Junior Academy - Ballam Park Tuesday */}
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary-500 transition-colors hover:shadow-lg">
              <img 
                src="https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200" 
                alt="Junior academy athletes developing skills at athletic track" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-heading font-bold text-gray-900">Junior Academy</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Available
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="text-sm">Mon, Tue, Thu 5:30pm</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-sm">Ballam Park Athletic Track</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span className="text-sm">Ages 12 - 16 • Max 20 athletes</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-heading font-bold text-primary-500">$30</span>
                    <span className="text-gray-500 text-sm"> + GST per class</span>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Button
                      variant="outline"
                      onClick={() => window.open("/junior-academy-application.html", "_blank")}
                      className="border-primary-500 text-primary-500 hover:bg-primary-50 w-full"
                    >
                      By Application
                    </Button>
                    <div className="w-full">
                      <p className="text-xs font-bold text-gray-800 uppercase tracking-wide text-right mb-1">⬇ Existing clients</p>
                      <Button 
                        onClick={() => {
                          window.open("https://www.thinksmartsoftware-au.com/ocr/schedule_view.php?c=5D6DC72044045&p_id=1&t=sportsbiz&set=yes", "_blank");
                        }}
                        className="bg-primary-500 hover:bg-primary-600 text-white w-full"
                      >
                        Enroll Now
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Junior Academy - Mornington Wednesday */}
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary-500 transition-colors hover:shadow-lg">
              <img 
                src="https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200" 
                alt="Junior academy athletes developing skills at athletic track" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-heading font-bold text-gray-900">Junior Academy</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Available
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="text-sm">Wednesday 4:30pm</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-sm">Mornington Athletic Track</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span className="text-sm">Ages 12 - 16 • Max 20 athletes</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-heading font-bold text-primary-500">$30</span>
                    <span className="text-gray-500 text-sm"> + GST per class</span>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Button
                      variant="outline"
                      onClick={() => window.open("/junior-academy-application.html", "_blank")}
                      className="border-primary-500 text-primary-500 hover:bg-primary-50 w-full"
                    >
                      By Application
                    </Button>
                    <div className="w-full">
                      <p className="text-xs font-bold text-gray-800 uppercase tracking-wide text-right mb-1">⬇ Existing clients</p>
                      <Button 
                        onClick={() => {
                          window.open("https://www.thinksmartsoftware-au.com/ocr/schedule_view.php?c=5D6DC72044045&p_id=1&t=sportsbiz&set=yes", "_blank");
                        }}
                        className="bg-primary-500 hover:bg-primary-600 text-white w-full"
                      >
                        Enroll Now
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Senior Squad - Ballam Park Thursday */}
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary-500 transition-colors hover:shadow-lg">
              <img 
                src="/images/the-archers.jpg" 
                alt="Senior squad athletes training at professional athletic track" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-heading font-bold text-gray-900">Senior Squad</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    By Application
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="text-sm">Mon, Tue, Thu 5:30pm</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-sm">Ballam Park Athletic Track</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span className="text-sm">Max 10 athletes • Application only</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Casual $30 + GST per class</div>
                    <div className="text-sm text-gray-600">Unlimited Sessions <span className="text-lg font-heading font-bold text-primary-500">$200</span> per month</div>
                    <div className="text-xs text-gray-500">(includes Final Surge app access)</div>
                  </div>
                  <Button 
                    onClick={() => window.open('/senior-squad-application.html', '_blank')}
                    className="bg-primary-500 hover:bg-primary-600 text-white"
                  >
                    Apply Now
                  </Button>
                </div>
              </div>
            </div>

            {/* High Performance Squad */}
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary-500 transition-colors hover:shadow-lg">
              <img 
                src="/al-archer-peru.jpg" 
                alt="High performance squad athletes training with elite coaching" 
                className="w-full h-56 object-contain bg-gray-100"
              />
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-heading font-bold text-gray-900">High Performance Squad</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    By Application
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="text-sm">Elite coaching sessions</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-sm">Multiple venues available</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span className="text-sm">1-on-1 & small group training</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Monthly <span className="text-lg font-heading font-bold text-primary-500">$300</span></div>
                    <div className="text-xs text-gray-500">Annual program $3,500</div>
                  </div>
                  <Button 
                    onClick={() => setIsHighPerformanceSquadModalOpen(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Apply Now
                  </Button>
                </div>
              </div>
            </div>

            {/* Speed & Running Technique */}
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary-500 transition-colors hover:shadow-lg">
              <img
                src="/speed-running-hero.jpg"
                alt="Athlete preparing for speed assessment with timing gates"
                className="w-full h-56 object-cover object-top"
              />
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-heading font-bold text-gray-900">Speed & Running Technique</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    By Application
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4">Run faster, more efficiently, and more powerfully — whether you play team sport or simply want to move better. Personalised coaching with a programme delivered through Final Surge.</p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span className="text-sm">Individual & small group • All ages welcome</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span className="text-sm">Flexible scheduling around your sport</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">One-off assessment or ongoing coaching</div>
                    <div className="text-xs text-gray-500">Alistair will be in touch within 48 hours</div>
                  </div>
                  <Button
                    onClick={() => window.open('/speed-running-application.html', '_blank')}
                    className="bg-primary-500 hover:bg-primary-600 text-white"
                  >
                    Apply Now
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Alternative Options */}
          <div className="mt-12 bg-amber-50 rounded-xl p-6">
            <h3 className="text-xl font-heading font-bold text-gray-900 mb-4">Can't find the perfect time? We have alternatives!</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-amber-500 mb-2">
                  <Clock className="w-8 h-8 mx-auto" />
                </div>
                <h4 className="font-semibold text-gray-900">Different Times</h4>
                <p className="text-sm text-gray-600">Same program, different schedule</p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-amber-500 mb-2">
                  <Users className="w-8 h-8 mx-auto" />
                </div>
                <h4 className="font-semibold text-gray-900">Waitlist Priority</h4>
                <p className="text-sm text-gray-600">First in line for openings</p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-amber-500 mb-2">
                  <Smartphone className="w-8 h-8 mx-auto" />
                </div>
                <h4 className="font-semibold text-gray-900">Online Programs</h4>
                <p className="text-sm text-gray-600">Virtual training sessions</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-heading font-bold mb-4">Power2Perform</h3>
              <p className="text-gray-300 mb-4">Empowering athletic excellence through innovative school-based sports programs.</p>
            </div>
            
            <div>
              <h4 className="font-heading font-semibold mb-4">Programs</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white">Athletics</a></li>
                <li><a href="#" className="hover:text-white">AFL</a></li>
                <li><a href="#" className="hover:text-white">Soccer</a></li>
                <li><a href="#" className="hover:text-white">Basketball</a></li>
                <li><a href="#" className="hover:text-white">Netball</a></li>
                <li><a href="#" className="hover:text-white">Multi-sports</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-heading font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="/parent-help-center" className="hover:text-white">Parent Help Center</a></li>
                <li><a href="/enrollment-guide" className="hover:text-white">Enrollment Guide</a></li>
                <li><a href="/payment-support" className="hover:text-white">Payment Support</a></li>
                <li><button onClick={() => setIsContactFormOpen(true)} className="hover:text-white cursor-pointer" data-testid="button-contact-us">Contact Us</button></li>
                <li><button onClick={() => setIsSchoolPartnershipsModalOpen(true)} className="hover:text-white cursor-pointer">School Partnerships</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-heading font-semibold mb-4">Contact Info</h4>
              <div className="space-y-2 text-gray-300">
                <p className="flex items-center"><Phone className="w-4 h-4 mr-2" />+61 434 679 395</p>
                <p className="flex items-center"><Mail className="w-4 h-4 mr-2" /><a href="mailto:info@power2adapt.com" className="hover:text-white">info@power2adapt.com</a></p>
                <p className="flex items-center"><School className="w-4 h-4 mr-2" />Serving Schools, Sporting Clubs and the Community</p>
                <p className="flex items-center"><Clock className="w-4 h-4 mr-2" />Mon-Fri: 8am-6pm</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-heading font-semibold mb-4">Follow Us</h4>
              <div className="flex space-x-4">
                <a 
                  href="https://youtube.com/@power2adapt" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-red-500 transition-colors"
                  aria-label="Visit our YouTube channel"
                >
                  <Youtube className="w-6 h-6" />
                </a>
                <a 
                  href="https://instagram.com/power2adapt" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-pink-500 transition-colors"
                  aria-label="Follow us on Instagram"
                >
                  <Instagram className="w-6 h-6" />
                </a>
                <a 
                  href="https://facebook.com/power2adapt" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-blue-500 transition-colors"
                  aria-label="Like us on Facebook"
                >
                  <Facebook className="w-6 h-6" />
                </a>
                <a 
                  href="https://skool.com/power2adapt" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-yellow-500 transition-colors flex items-center justify-center w-6 h-6 text-sm font-bold border border-gray-300 rounded"
                  aria-label="Join our Skool community"
                >
                  S
                </a>
              </div>
              <div className="mt-3 text-sm text-gray-400">
                <p>Follow for training tips, success stories, and program updates!</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; 2024 Power2Perform. All rights reserved. | Privacy Policy | Terms of Service</p>
          </div>
        </div>
      </footer>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
      
      <ContactFormModal 
        isOpen={isContactFormOpen} 
        onClose={() => setIsContactFormOpen(false)} 
      />
      
      
      <HighPerformanceSquadApplication 
        isOpen={isHighPerformanceSquadModalOpen} 
        onClose={() => setIsHighPerformanceSquadModalOpen(false)} 
      />
      

      {/* Foundation Class Info Modal */}
      <Dialog open={isFoundationInfoModalOpen} onOpenChange={setIsFoundationInfoModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading font-bold text-gray-900">Foundation Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Working on the FUNdamentals of athletic movement, we build confidence and improve athletic movements, build fitness and endurance, so our athletes can achieve their goals, whatever their sport may be.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Emerging Athletes Info Modal */}
      <Dialog open={isEmergingAthletesInfoModalOpen} onOpenChange={setIsEmergingAthletesInfoModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading font-bold text-gray-900">Junior Athlete Development</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Every parent and every kid that comes to our programs wants to move better, get fitter and be faster. Sport is fun, but for a lot of kids, if they feel uncomfortable, slow or awkward it takes this fun out of the sport for them. They begin to feel self-conscious and then get lost to the sport and have their self-esteem affected.
            </p>
            <p className="text-gray-600">
              Our junior development programs help every kid move better, understand their challenge points and learn that persistence leads to improvement and changes. Every kid is coached for what they need and given cues that they understand and can implement.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* School Partnerships Modal */}
      <Dialog open={isSchoolPartnershipsModalOpen} onOpenChange={setIsSchoolPartnershipsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading font-bold text-gray-900">Our School Partners</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">Power2ADAPT is proud to partner with these prestigious educational institutions:</p>
            <div className="space-y-3">
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <School className="w-5 h-5 text-primary-500 mr-3" />
                <span className="font-medium">Peninsula Grammar</span>
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <School className="w-5 h-5 text-primary-500 mr-3" />
                <span className="font-medium">Toorak College</span>
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <School className="w-5 h-5 text-primary-500 mr-3" />
                <span className="font-medium">Haileybury</span>
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <School className="w-5 h-5 text-primary-500 mr-3" />
                <span className="font-medium">Balcombe Grammar</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">These partnerships enable us to deliver high-quality athletic programs directly at your child's school.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Program Finder chat widget */}
      <OneClickChat />
    </div>
  );
}
