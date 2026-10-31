import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import LoginModal from "@/components/auth/login-modal";
import ContactFormModal from "@/components/contact-form-modal";
import { HighPerformanceSquadApplication } from "@/components/applications/high-performance-squad-application";
import OneClickChat from "@/components/one-click-chat";
import { Calendar, MapPin, Users, RotateCcw, Building2, MessageSquare, Phone, Mail, School, Clock, Youtube, Instagram, Facebook, X, Menu, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Landing() {
  const [location, setLocation] = useLocation();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(location === "/login");
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [isHighPerformanceSquadModalOpen, setIsHighPerformanceSquadModalOpen] = useState(false);
  const [isSchoolPartnershipsModalOpen, setIsSchoolPartnershipsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFoundationInfoModalOpen, setIsFoundationInfoModalOpen] = useState(false);
  const [isEmergingAthletesInfoModalOpen, setIsEmergingAthletesInfoModalOpen] = useState(false);

  useEffect(() => {
    if (location === "/login") setIsLoginModalOpen(true);
  }, [location]);

  return (
    <div className="font-sans bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <a href="/" className="text-2xl font-heading font-bold text-primary-500" aria-label="Power2ADAPT home">Power2ADAPT</a>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a href="/programs" className="text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium">Programs</a>
                <a href="https://power2adapt.coach/where-we-train" className="text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium">Where we train</a>
                <a href="/coaches" className="text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium">Our Coaches</a>
                <a href="/high-performance" className="text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium">High Performance</a>
                <a href="/junior-academy" className="text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium">Junior Academy</a>
                <a href="/senior-squad" className="text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium">Senior Squad</a>
                <a href="https://www.skool.com/power2adapt-speed-school-8929" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium">Education</a>
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
              {/* Mobile menu button */}
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={isMobileMenuOpen ? "Close navigation" : "Open navigation"}
                  aria-expanded={isMobileMenuOpen}
                  aria-controls="mobile-navigation"
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
          <div id="mobile-navigation" className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              <a
                href="/programs"
                className="block px-3 py-2 text-gray-700 hover:text-primary-500 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Programs
              </a>
              <a
                href="https://power2adapt.coach/where-we-train"
                className="block px-3 py-2 text-gray-700 hover:text-primary-500 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Where we train
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
                href="https://www.skool.com/power2adapt-speed-school-8929"
                target="_blank"
                rel="noopener noreferrer"
                className="block px-3 py-2 text-gray-700 hover:text-primary-500 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Education
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
              </div>
            </div>
          </div>
        )}
      </nav>

      <div className="bg-orange-500 px-4 py-3 text-center text-sm font-bold text-white sm:text-base">
        Find your program, venue and session time. View classes or ask Coach Al where to start.{" "}
        <a href="/programs" className="underline underline-offset-2 hover:no-underline">Find your class →</a>
      </div>

      {/* Hero Section */}
      <section className="relative gradient-primary text-white py-20">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-blue-100 mb-4">Excellence Through Consistency</p>
              <h1 className="text-4xl md:text-6xl font-heading font-bold leading-tight mb-6">
                Build the Athlete <span className="text-secondary-500">Behind the Sport</span>
              </h1>
              <p className="text-xl mb-8 text-blue-100">
                Running technique, speed and athletic development across Frankston, Mornington and Mt Eliza. Find the right program for your athlete's stage and build confidence through consistent coaching.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild
                  className="bg-secondary-500 hover:bg-secondary-600 text-white px-8 py-4 rounded-lg font-heading font-semibold text-lg"
                >
                  <a href="https://power2adapt.setmore.com/book?step=additional-products&amp;products=a9a6a66a-9c61-4bec-829a-84d78687c2c0&amp;type=service&amp;staff=radec66996c3d8174cc26c451adc8c9832fdac5b7&amp;staffSelected=false">Book a Discovery Call →</a>
                </Button>
                <Button 
                  onClick={() => {
                    const classesSection = document.getElementById('classes');
                    classesSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  variant="outline"
                  className="border-2 border-white bg-transparent text-white hover:bg-white hover:text-primary-500 px-8 py-4 rounded-lg font-heading font-semibold text-lg"
                >
                  Explore Programs
                </Button>
              </div>
            </div>
            <div className="hidden md:block">
              <img 
                src="/images/georgia-goss-comp.jpg" 
                alt="Young athletes in training" 
                className="rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-heading font-bold text-primary-500 mb-2">1000+</div>
              <div className="text-gray-600">Athletes coached</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-heading font-bold text-primary-500 mb-2">Level 4</div>
              <div className="text-gray-600">Australian Athletics Level 4 High Performance Coach</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-heading font-bold text-primary-500 mb-2">Team Sport</div>
              <div className="text-gray-600">Athletic development - AFL, Soccer, Basketball, Netball and many more</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-heading font-bold text-primary-500 mb-2">Since 2007</div>
              <div className="text-gray-600">Coaching on the Mornington Peninsula</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section id="features" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">Why Parents Choose Power2ADAPT</h2>
            <p className="text-xl text-gray-600">Build movement skills, confidence and progress through consistent coaching</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">A foundation for every sport</h3>
              <p className="text-gray-600">Build the running, coordination and movement skills that support your child as their sport develops.</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <RotateCcw className="w-8 h-8 text-secondary-500" />
              </div>
              <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">Coaching for their stage</h3>
              <p className="text-gray-600">Start with your athlete's year level and goals. Coach Al can help you find the right group.</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">Progress you can see</h3>
              <p className="text-gray-600">Junior Academy, Senior Squad and High Performance athletes are tested in weeks 1, 5 and 10 to guide their development.</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-purple-500" />
              </div>
              <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">School and community sessions</h3>
              <p className="text-gray-600">Explore sessions in Frankston, Mornington and Mt Eliza. School sessions are for students of that school.</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">Train the mind too</h3>
              <p className="text-gray-600">Work on managing nerves, healthy expectations and building momentum alongside physical skills.</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <School className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">Consistency builds confidence</h3>
              <p className="text-gray-600">Give your athlete time to learn, practise and see what they can do. Real development builds over time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Current class tiles */}
      <section id="classes" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block bg-primary-100 text-primary-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">Find your program</span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">Explore Classes</h2>
            <p className="text-xl text-gray-600">Find a program, venue and session time that suits your athlete</p>
            <p className="text-lg text-gray-500 mt-2">Senior and High Performance squads by application</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Foundation — Peninsula Grammar Monday */}
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary-500 transition-colors hover:shadow-lg">
              <img src="/images/coach-georgia-crew.jpg" alt="Young children learning fundamental movement skills" className="w-full h-48 object-cover" />
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-heading font-bold text-gray-900">Foundation Class</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">View classes</span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600"><Calendar className="w-4 h-4 mr-2" /><span className="text-sm">Monday 3:30 – 4:45pm</span></div>
                  <div className="flex items-center text-gray-600"><MapPin className="w-4 h-4 mr-2" /><span className="text-sm">Peninsula Grammar</span></div>
                  <div className="flex items-center text-gray-600"><Users className="w-4 h-4 mr-2" /><span className="text-sm">Prep – Year 2</span></div>
                </div>
                <div className="flex items-center justify-between">
                  <div><span className="text-2xl font-heading font-bold text-primary-500">$30</span><span className="text-gray-500 text-sm"> + GST per class</span></div>
                  <a href="/programs" className="bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">View classes</a>
                </div>
              </div>
            </div>

            {/* Emerging Athletes — Peninsula Grammar Monday */}
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary-500 transition-colors hover:shadow-lg">
              <img src="/images/ashton-xcr.jpg" alt="Young athletes developing skills in team sports" className="w-full h-48 object-contain bg-gray-100" />
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-heading font-bold text-gray-900">Emerging Athletes</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">View classes</span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600"><Calendar className="w-4 h-4 mr-2" /><span className="text-sm">Monday 3:30 – 4:45pm</span></div>
                  <div className="flex items-center text-gray-600"><MapPin className="w-4 h-4 mr-2" /><span className="text-sm">Peninsula Grammar</span></div>
                  <div className="flex items-center text-gray-600"><Users className="w-4 h-4 mr-2" /><span className="text-sm">Year 3–6</span></div>
                </div>
                <div className="flex items-center justify-between">
                  <div><span className="text-2xl font-heading font-bold text-primary-500">$30</span><span className="text-gray-500 text-sm"> + GST per class</span></div>
                  <a href="/programs" className="bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">View classes</a>
                </div>
              </div>
            </div>

            {/* Foundation — Toorak College Thursday */}
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary-500 transition-colors hover:shadow-lg">
              <img src="/images/coach-georgia-crew.jpg" alt="Young children learning fundamental movement skills" className="w-full h-48 object-cover" />
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-heading font-bold text-gray-900">Foundation Class</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">View classes</span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600"><Calendar className="w-4 h-4 mr-2" /><span className="text-sm">Thursday 3:30 – 4:45pm</span></div>
                  <div className="flex items-center text-gray-600"><MapPin className="w-4 h-4 mr-2" /><span className="text-sm">Toorak College</span></div>
                  <div className="flex items-center text-gray-600"><Users className="w-4 h-4 mr-2" /><span className="text-sm">Prep – Year 2</span></div>
                </div>
                <div className="flex items-center justify-between">
                  <div><span className="text-2xl font-heading font-bold text-primary-500">$30</span><span className="text-gray-500 text-sm"> + GST per class</span></div>
                  <a href="/programs" className="bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">View classes</a>
                </div>
              </div>
            </div>

            {/* Team Sport Speed — Friday 4:30pm */}
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary-500 transition-colors hover:shadow-lg">
              <img src="/images/team-sport-running.jpg" alt="Athletes training for speed and agility" className="w-full h-48 object-cover" />
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-heading font-bold text-gray-900">Team Sport Speed</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">View classes</span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600"><Calendar className="w-4 h-4 mr-2" /><span className="text-sm">Friday 4:30pm</span></div>
                  <div className="flex items-center text-gray-600"><MapPin className="w-4 h-4 mr-2" /><span className="text-sm">Mornington Athletic Track</span></div>
                  <div className="flex items-center text-gray-600"><Users className="w-4 h-4 mr-2" /><span className="text-sm">Ages 13+</span></div>
                </div>
                <div className="flex items-center justify-between">
                  <div><span className="text-2xl font-heading font-bold text-primary-500">$30</span><span className="text-gray-500 text-sm"> + GST per class</span></div>
                  <a href="/programs" className="bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">View classes</a>
                </div>
              </div>
            </div>

            {/* Team Sport Speed — Friday 5:30pm */}
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary-500 transition-colors hover:shadow-lg">
              <img src="/images/team-sport-running.jpg" alt="Athletes training for speed and agility" className="w-full h-48 object-cover" />
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-heading font-bold text-gray-900">Team Sport Speed</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">View classes</span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600"><Calendar className="w-4 h-4 mr-2" /><span className="text-sm">Friday 5:30pm</span></div>
                  <div className="flex items-center text-gray-600"><MapPin className="w-4 h-4 mr-2" /><span className="text-sm">Mornington Athletic Track</span></div>
                  <div className="flex items-center text-gray-600"><Users className="w-4 h-4 mr-2" /><span className="text-sm">Ages 13+</span></div>
                </div>
                <div className="flex items-center justify-between">
                  <div><span className="text-2xl font-heading font-bold text-primary-500">$30</span><span className="text-gray-500 text-sm"> + GST per class</span></div>
                  <a href="/programs" className="bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">View classes</a>
                </div>
              </div>
            </div>

          </div>

          <div className="text-center mt-10">
            <a href="/programs" className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-md hover:shadow-lg transition-all">
              Find the right class
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-heading font-bold mb-4">Power2ADAPT</h3>
              <p className="text-gray-300 mb-4">Excellence Through Consistency. Athletic development across Frankston, Mornington and Mt Eliza.</p>
            </div>
            
            <div>
              <h4 className="font-heading font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="https://power2adapt.coach/where-we-train" className="hover:text-white">Where we train</a></li>
                <li><a href="/parent-help-center" className="hover:text-white">Parent Help Centre</a></li>
                <li><a href="/enrollment-guide" className="hover:text-white">Enrolment Guide</a></li>
                <li><a href="/payment-support" className="hover:text-white">Payment Support</a></li>
                <li><button onClick={() => setIsContactFormOpen(true)} className="hover:text-white cursor-pointer" data-testid="button-contact-us">Contact Us</button></li>
                <li><button onClick={() => setIsSchoolPartnershipsModalOpen(true)} className="hover:text-white cursor-pointer">School Partnerships</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-heading font-semibold mb-4">Contact Info</h4>
              <div className="space-y-2 text-gray-300">
                <p className="flex items-center"><Phone className="w-4 h-4 mr-2" />+61 434 679 395</p>
                <p className="flex items-center"><Mail className="w-4 h-4 mr-2" /><a href="mailto:info@power2adapt.com?subject=Coaching%20enquiry&amp;body=My%20mobile%20number%3A%20%0ABest%20time%20to%20call%3A%20%0AAthlete%20and%20goals%3A%20" className="hover:text-white">info@power2adapt.com</a></p>
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
                  href="https://www.skool.com/power2adapt-speed-school-8929"
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
            <p>&copy; {new Date().getFullYear()} Power2ADAPT. All rights reserved. | Privacy Policy | Terms of Service</p>
          </div>
        </div>
      </footer>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => {
          setIsLoginModalOpen(false);
          if (location === "/login") setLocation("/");
        }}
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
