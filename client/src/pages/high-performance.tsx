import { useState } from "react";
import { Button } from "@/components/ui/button";
import LoginModal from "@/components/auth/login-modal";
import ContactFormModal from "@/components/contact-form-modal";
import { HighPerformanceSquadApplication } from "@/components/applications/high-performance-squad-application";
import { Users, Building2, Smartphone, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function HighPerformance() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [isApplicationFormOpen, setIsApplicationFormOpen] = useState(false);

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
                <Link href="/high-performance" className="text-primary-500 bg-primary-50 px-3 py-2 rounded-md text-sm font-medium">High Performance</Link>
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

      {/* Hero Section with Header Image */}
      <section className="py-8 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center text-primary-400 hover:text-primary-300 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Main Programs
            </Link>
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">High Performance Coaching & Consulting</h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Elite coaching services for serious athletes, coaches, and sporting organizations seeking competitive advantage
            </p>
          </div>

          {/* Coach Photo */}
          <div className="mb-8">
            <div className="flex justify-center">
              <img 
                src="/images/coach-photo.jpg" 
                alt="Alistair Tait - Head Coach Power2ADAPT" 
                className="w-80 h-80 object-cover object-top rounded-xl shadow-2xl"
              />
            </div>
          </div>



          {/* Head Coach Section */}
          <div className="bg-gray-800 rounded-xl p-8 mb-16">
            <div className="max-w-4xl mx-auto">
              <div>
                <h2 className="text-3xl font-heading font-bold mb-4 text-primary-400">Head Coach</h2>
                <div className="space-y-4 text-gray-300">
                  {/* Bio content */}
                  <div className="space-y-4">
                    <p className="text-gray-200 leading-relaxed">
                      Alistair was born and bred in Seaford and has lived on the Mornington Peninsula all of his life. He first became involved in athletics at the age of 8 and has been involved in the sport for over 30 years.
                    </p>
                    <p className="text-gray-200 leading-relaxed">
                      Alistair is a former track and field athlete and has since taken his love of athletics, health and fitness into coaching. He completed a Bachelor's Degree in Sports Coaching and holds a Level 3 Performance Development Coach accreditation with Athletics Australia.
                    </p>
                    <div className="bg-primary-900/30 rounded-lg p-4 border-l-4 border-primary-500">
                      <h4 className="font-semibold text-primary-400 mb-2">Movement & Mindset Specialist</h4>
                      <p className="text-gray-200 text-sm leading-relaxed">
                        Alistair considers himself to be a "Movement and Mindset" improvement specialist with extensive knowledge in anatomy, biomechanics, physiology, sports psychology and nutrition. He understands that no two athletes are alike and each require coaching and programs that meet their specific needs.
                      </p>
                    </div>
                    
                    {/* Key Achievements */}
                    <div className="mt-6">
                      <h4 className="text-lg font-semibold mb-3 text-white">Notable Achievements</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-secondary-500 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-gray-300">3x Victoria State Representative for 400m hurdles</p>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-secondary-500 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-gray-300">Trained under Level 5 National hurdles coach Roy Boyd (coach of Australian 110mh record holder)</p>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-secondary-500 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-gray-300">Athletic Training Venue Supervisor Melbourne 2006 Commonwealth Games</p>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-secondary-500 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-gray-300">Led talent identification testing for 6,000+ youth athletes in India (Meghalaya Sport & Olympic Association)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Credentials/Qualifications */}
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3 text-white">Professional Qualifications</h3>
                    <div className="bg-gray-700 rounded-lg p-4 space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-primary-500 rounded-full flex-shrink-0"></div>
                        <p className="text-gray-200">
                          <span className="font-semibold text-white">Level 4 High Performance Coach</span> with World and Australian Athletics
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-primary-500 rounded-full flex-shrink-0"></div>
                        <p className="text-gray-200">
                          <span className="font-semibold text-white">Bachelor of Sports Coaching - PE Stream</span> (Victorian University)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Specializations */}
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3 text-white">Specializations</h3>
                    <div className="bg-gray-700 rounded-lg p-4 space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-secondary-500 rounded-full flex-shrink-0"></div>
                        <p className="text-gray-200">
                          <span className="font-semibold text-white">Sprints, Hurdles & Relays</span>
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-secondary-500 rounded-full flex-shrink-0"></div>
                        <p className="text-gray-200">
                          <span className="font-semibold text-white">Former 400m Hurdler</span> at Junior National Level
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-secondary-500 rounded-full flex-shrink-0"></div>
                        <p className="text-gray-200">
                          <span className="font-semibold text-white">Performance Mindset</span> specialist
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-secondary-500 rounded-full flex-shrink-0"></div>
                        <p className="text-gray-200">
                          <span className="font-semibold text-white">Instrumentation Tool</span> technical expert
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="text-2xl font-heading font-bold mb-6 text-primary-400">Individual Athlete Development</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mt-3 flex-shrink-0"></div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">1-on-1 Performance Coaching</h3>
                    <p className="text-gray-300">Personalized training programs designed around your specific sport, goals, and competition schedule</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mt-3 flex-shrink-0"></div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Movement Analysis & Correction</h3>
                    <p className="text-gray-300">Advanced biomechanical assessment using video analysis and movement screening protocols</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mt-3 flex-shrink-0"></div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Competition Preparation</h3>
                    <p className="text-gray-300">Peak performance protocols for tournaments, trials, and championship events</p>
                  </div>
                </div>
              </div>
              

            </div>
            
            <div className="bg-gray-800 rounded-xl p-8">
              <h2 className="text-xl font-heading font-bold mb-4">Investment Options</h2>
              <div className="space-y-6">
                <div className="border-l-4 border-primary-500 pl-4">
                  <h3 className="font-semibold text-lg text-primary-400">Single Session</h3>
                  <p className="text-2xl font-bold">$150</p>
                  <p className="text-gray-300 text-sm">90-minute assessment + program design</p>
                </div>
                <div className="border-l-4 border-primary-500 pl-4">
                  <h3 className="font-semibold text-lg text-primary-400">Monthly Package</h3>
                  <p className="text-2xl font-bold">$300</p>
                  <p className="text-gray-300 text-sm">4+ sessions per week + Power2Perform app + Athlete Monitoring protocols</p>
                </div>
                <div className="border-l-4 border-primary-500 pl-4">
                  <h3 className="font-semibold text-lg text-primary-400">Annual Program Investment</h3>
                  <p className="text-2xl font-bold">$3,500</p>
                  <p className="text-gray-300 text-sm"><strong>Benefits:</strong> Leverages our unique Professional partnerships for Strength and Conditioning, Physiotherapy support and the Empowered Athlete support program</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-heading font-bold mb-3">Team Consulting</h2>
              <p className="text-gray-300 mb-4">
                Comprehensive team development programs for clubs, schools, and representative squads
              </p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Training periodization design</li>
                <li>• Coaching education workshops</li>
                <li>• Performance testing protocols</li>
                <li>• Team culture development</li>
              </ul>
            </div>

            <div className="bg-gray-800 rounded-xl p-6">
              <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-heading font-bold mb-3">Organizational Development</h2>
              <p className="text-gray-300 mb-4">
                Strategic consulting for sporting organizations and educational institutions
              </p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Program design & implementation</li>
                <li>• Coach development pathways</li>
                <li>• Facility optimization</li>
                <li>• Long-term athlete development</li>
              </ul>
            </div>

            <div className="bg-gray-800 rounded-xl p-6">
              <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-heading font-bold mb-3">Remote Coaching</h2>
              <p className="text-gray-300 mb-4">
                Virtual coaching services for athletes unable to attend in-person sessions
              </p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Video movement analysis</li>
                <li>• Weekly program adjustments</li>
                <li>• Performance monitoring</li>
                <li>• Competition strategy</li>
              </ul>
            </div>
          </div>

          {/* Performance Testing Section */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-heading font-bold mb-4 text-primary-400">Performance Testing</h2>
              <p className="text-lg text-gray-300 max-w-3xl mx-auto">
                Advanced testing protocols and movement analysis techniques used to optimize athletic performance and identify areas for improvement
              </p>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-8">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-white">Elite Movement Analysis</h3>
                  <p className="text-gray-300 mb-4">
                    Our comprehensive testing protocols utilize advanced video analysis and biomechanical assessment to identify performance limiting factors and movement inefficiencies.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-secondary-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-300 text-sm">High-speed video analysis for technique refinement</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-secondary-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-300 text-sm">Biomechanical assessment protocols</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-secondary-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-300 text-sm">Performance benchmarking and tracking</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-secondary-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-300 text-sm">Individualized improvement strategies</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-900 rounded-lg p-4">
                  <video 
                    controls 
                    className="w-full h-auto rounded-lg"
                    preload="metadata"
                  >
                    <source src="/images/reel_edge10 alistair iv (1).MP4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  <p className="text-center text-gray-400 text-sm mt-2">
                    Performance testing demonstration by Head Coach Alistair Tait
                  </p>
                </div>
              </div>
            </div>
          </div>


          {/* Application Form Section */}
          <div className="mb-16" id="application-form">
            <div className="bg-white rounded-xl shadow-xl p-8 max-w-5xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">
                High Performance Squad Application
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Apply for elite-level coaching and join our High Performance program
              </p>
              <Button
                onClick={() => setIsApplicationFormOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 text-lg"
                data-testid="button-open-application"
              >
                Apply Now
              </Button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-heading font-bold mb-4">Have Questions?</h2>
            <p className="text-lg mb-6 text-primary-100">
              Contact us to discuss your specific goals and learn more about our High Performance program
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild
                className="bg-secondary-500 hover:bg-secondary-600 text-white font-semibold px-8 py-3"
              >
                <a href="https://power2adapt.setmore.com/services/a9a6a66a-9c61-4bec-829a-84d78687c2c0" target="_blank" rel="noopener noreferrer">
                  Book Free Discovery Call
                </a>
              </Button>
              <Button 
                onClick={() => setIsContactFormOpen(true)}
                className="bg-transparent border-2 border-secondary-400 text-secondary-400 hover:bg-secondary-400 hover:text-white px-8 py-3 font-semibold"
              >
                Send Us an Enquiry
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-heading font-bold mb-4">Power2ADAPT</h3>
              <p className="text-gray-300 mb-4">Elite athletic development through expert coaching and consulting services.</p>
            </div>
            
            <div>
              <h4 className="font-heading font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/classes" className="hover:text-white">Group Programs</Link></li>
                <li><Link href="/high-performance" className="hover:text-white">1-on-1 Coaching</Link></li>
                <li><Link href="/high-performance" className="hover:text-white">Team Consulting</Link></li>
                <li><Link href="/high-performance" className="hover:text-white">Remote Coaching</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-heading font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white">Performance Assessment</a></li>
                <li><a href="#" className="hover:text-white">Coaching Resources</a></li>
                <li><a href="#" className="hover:text-white">Contact Coach</a></li>
                <li><a href="#" className="hover:text-white">Athlete Portal</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-heading font-semibold mb-4">Contact Info</h4>
              <div className="space-y-2 text-gray-300">
                <p>Elite Performance Coaching</p>
                <p>Melbourne, Victoria</p>
                <p>info@power2adapt.com</p>
                <p>+61 434 679 395</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2026 Power2ADAPT. All rights reserved.</p>
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
        isOpen={isApplicationFormOpen} 
        onClose={() => setIsApplicationFormOpen(false)} 
      />
    </div>
  );
}