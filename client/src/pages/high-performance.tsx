import { useState } from "react";
import { Button } from "@/components/ui/button";
import LoginModal from "@/components/auth/login-modal";
import { Users, Building2, Smartphone, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function HighPerformance() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

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
                <Link href="/#classes" className="text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium">Classes</Link>
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

          {/* Header Image */}
          <div className="mb-12">
            <img 
              src="/images/speed-gradient-bg.png" 
              alt="High Performance Speed Training" 
              className="w-full h-64 md:h-80 object-cover rounded-xl shadow-2xl"
            />
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
              
              {/* High Performance Training Images */}
              <div className="grid grid-cols-2 gap-4 mt-8">
                <img 
                  src="/images/high-performance-1.jpg" 
                  alt="High performance athlete training session" 
                  className="rounded-lg object-cover object-top h-64 w-full"
                />
                <img 
                  src="/images/high-performance-2.jpg" 
                  alt="Elite coaching and movement analysis" 
                  className="rounded-lg object-cover object-top h-64 w-full"
                />
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
                  <p className="text-2xl font-bold">$400</p>
                  <p className="text-gray-300 text-sm">4+ sessions per week + Power2Perform app + Athlete Monitoring protocols</p>
                </div>
                <div className="border-l-4 border-primary-500 pl-4">
                  <h3 className="font-semibold text-lg text-primary-400">Season Program Investment</h3>
                  <p className="text-2xl font-bold">$5,000</p>
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

          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-heading font-bold mb-4">Ready to Take Your Performance to the Next Level?</h2>
            <p className="text-lg mb-6 text-primary-100">
              Schedule a consultation to discuss your specific goals and create a customized development plan
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => setIsLoginModalOpen(true)}
                className="bg-white text-primary-600 hover:bg-gray-100 font-semibold px-8 py-3"
              >
                Schedule Consultation
              </Button>
              <Button 
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-primary-600 px-8 py-3"
              >
                Download Performance Assessment
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
                <li><Link href="/#classes" className="hover:text-white">Group Programs</Link></li>
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
                <p>coach@power2adapt.com</p>
                <p>(03) 9xxx-xxxx</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2024 Power2ADAPT. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </div>
  );
}