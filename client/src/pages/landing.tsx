import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import LoginModal from "@/components/auth/login-modal";
import { SeniorSquadApplication } from "@/components/applications/senior-squad-application";
import { HighPerformanceSquadApplication } from "@/components/applications/high-performance-squad-application";
import OneClickChat from "@/components/one-click-chat";
import { Calendar, MapPin, Users, Plus, BarChart3, CreditCard, Smartphone, RotateCcw, Building2, MessageSquare, Phone, Mail, School, Clock, Youtube, Instagram, Facebook, X, Menu, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import coachSamiImage from "@assets/IMG_3038_1759146359558.jpg";
import coachAlistairImage from "@assets/63271D0E-3E21-490C-B81E-18BEF5CCB270_1759298878111.jpg";
import coachMiahImage from "@assets/Miah Noble trail runner_1759299110875.jpg";

export default function Landing() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSeniorSquadModalOpen, setIsSeniorSquadModalOpen] = useState(false);
  const [isHighPerformanceSquadModalOpen, setIsHighPerformanceSquadModalOpen] = useState(false);
  const [isSchoolPartnershipsModalOpen, setIsSchoolPartnershipsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFoundationInfoModalOpen, setIsFoundationInfoModalOpen] = useState(false);
  const [isEmergingAthletesInfoModalOpen, setIsEmergingAthletesInfoModalOpen] = useState(false);

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
                <a href="#coaches" className="text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium">Our Coaches</a>
                <a href="/high-performance" className="text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium">High Performance</a>
                <a href="/senior-squad" className="text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium">Senior Squad</a>
                <a href="/education" className="text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium">Education</a>
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
                href="#coaches" 
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
              <h1 className="text-4xl md:text-6xl font-heading font-bold leading-tight mb-6">
                Where All Athletes <span className="text-secondary-500">Thrive</span>
              </h1>
              <p className="text-xl mb-8 text-blue-100">
                Expert coaching at your child's school. Flexible programs that build confidence, skill and athletic movements. Ages 5 to 13 welcome. For Senior Squad and High Performance, Ages 14+
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => {
                    window.open("https://www.thinksmartsoftware-au.com/ocr/schedule_view.php?c=5D6DC72044045&p_id=1&t=sportsbiz&set=yes", "_blank");
                  }}
                  className="bg-secondary-500 hover:bg-secondary-600 text-white px-8 py-4 rounded-lg font-heading font-semibold text-lg"
                >
                  Start Your Athletic Journey
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

      {/* Our Coaches */}
      <section id="coaches" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">Our Coaches</h2>
            <p className="text-xl text-gray-600">Experienced professionals dedicated to athletic development</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-primary-500" />
              </div>
              <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">Qualified Expertise</h3>
              <p className="text-gray-600">Our coaching team holds recognized qualifications in sports science, athletics, and youth development</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-20 h-20 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-10 h-10 text-secondary-500" />
              </div>
              <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">Proven Track Record</h3>
              <p className="text-gray-600">Years of experience developing young athletes with state and national level achievements</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">Individualized Approach</h3>
              <p className="text-gray-600">Every athlete receives personalized coaching tailored to their specific needs and goals</p>
            </div>
          </div>

          {/* Coach Profiles */}
          <div className="mt-16">
            <h3 className="text-2xl font-heading font-bold text-gray-900 text-center mb-8">Meet Our Coaching Team</h3>
            
            <div className="max-w-4xl mx-auto text-center mb-12 space-y-4">
              <p className="text-lg text-gray-700 leading-relaxed">
                All Power2Adapt Coaches are fully qualified athletics coaches, insured and WWC approved.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                They are passionate about sport, teaching movement and supporting an active and healthy lifestyle.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Our coaches are carefully matched to specific athletic development programs, based on their area of interest and expertise.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Our university degree qualified coaches work together to develop world leading, long term development programs, based on the latest scientific research and continually implement new learning strategies for children and adult athletes.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Coach 1 - Alistair (Head Coach) */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="text-center mb-4">
                  <img 
                    src={coachAlistairImage} 
                    alt="Alistair - Head Coach" 
                    className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-2 border-primary-200"
                  />
                  <h4 className="text-xl font-heading font-bold text-gray-900">Alistair</h4>
                  <p className="text-sm text-primary-600 font-medium">Head Coach</p>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Alistair started out in Little Aths, Cross Country and Fun runs and is a former National level track and field athlete (400mh) He has a Bachelor's Degree in Sports Coaching(PE) stream and has 20 years experience in coaching and is currently undertaking the Australian Athletics Level 4 High Performance coaching course.
                </p>
                <p className="text-gray-600 text-sm leading-relaxed mt-3">
                  Coach Al has guided athletes to World Junior u20, National and State medals, as well as helping team sport athletes improve their agilty, speed and endurance to aid selection for academy and representative teams.
                </p>
                <p className="text-gray-600 text-sm leading-relaxed mt-3">
                  Alistair prides himself on being an athletic movement and performance mindset specialist and is passionate about unlocking your potential to move better, live better and perform better in everything you do!
                </p>
              </div>

              {/* Coach 2 - Sami */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="text-center mb-4">
                  <img 
                    src={coachSamiImage} 
                    alt="Sami - Running Specialist Coach" 
                    className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-2 border-primary-200"
                  />
                  <h4 className="text-xl font-heading font-bold text-gray-900">Sami</h4>
                  <p className="text-sm text-primary-600 font-medium">Distance Running Specialist</p>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Sami's passion for running ignited during his soccer days when his natural speed and endurance shone through. 
                  By 2020, running became his primary focus, and he has since dedicated himself to becoming stronger every day. As a competitive runner with four years of experience, Sami understands the challenges of starting a new sport, learning first-hand the risks of overtraining and the value of proper guidance.
                </p>
                <p className="text-gray-600 text-sm leading-relaxed mt-3">
                  Through coaching education and personal experience, Sami has developed a tailored, holistic approach to help clients achieve their goals. Whether you aim to compete at a national level or build a foundation for another sport, Sami's expertise ensures you train efficiently and effectively. Backed by a network of experts and his team at Power2Adapt, Sami is dedicated to creating personalised, research-based programs to help you reach your full athletic potential.
                </p>
              </div>

              {/* Coach 3 - Miah Noble */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="text-center mb-4">
                  <img 
                    src={coachMiahImage} 
                    alt="Miah Noble - Trail Running Specialist" 
                    className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-2 border-primary-200"
                  />
                  <h4 className="text-xl font-heading font-bold text-gray-900">Miah Noble</h4>
                  <p className="text-sm text-primary-600 font-medium">Trail Running Specialist</p>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  As a coach, my mission is to support athletes of all levels, whether you are new to running or pursuing your next big goal through smart and sustainable training. I understand the challenge of balancing over 20 hours of training with a full-time job and the everyday demands of life.
                </p>
                <p className="text-gray-600 text-sm leading-relaxed mt-3">
                  My approach emphasizes performance and well-being, ensuring you can run long-term, remain injury-free, and enjoy the process.
                </p>
                <p className="text-gray-600 text-sm leading-relaxed mt-3">
                  I am dedicated to helping others cultivate strength, confidence, and resilience through running. If you're ready to run stronger, fuel better, and build genuine resilience, I'm here to guide you every step of the way.
                </p>
              </div>
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
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">Available Classes - Term 4, 2025</h2>
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
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Available
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
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Available
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
                  <Button 
                    onClick={() => {
                      window.open("https://www.thinksmartsoftware-au.com/ocr/schedule_view.php?c=5D6DC72044045&p_id=1&t=sportsbiz&set=yes", "_blank");
                    }}
                    className="bg-primary-500 hover:bg-primary-600 text-white"
                  >
                    Enroll Now
                  </Button>
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
                  <Button 
                    onClick={() => {
                      window.open("https://www.thinksmartsoftware-au.com/ocr/schedule_view.php?c=5D6DC72044045&p_id=1&t=sportsbiz&set=yes", "_blank");
                    }}
                    className="bg-primary-500 hover:bg-primary-600 text-white"
                  >
                    Enroll Now
                  </Button>
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
                  <Button 
                    onClick={() => {
                      window.open("https://www.thinksmartsoftware-au.com/ocr/schedule_view.php?c=5D6DC72044045&p_id=1&t=sportsbiz&set=yes", "_blank");
                    }}
                    className="bg-primary-500 hover:bg-primary-600 text-white"
                  >
                    Enroll Now
                  </Button>
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
                  <Button 
                    onClick={() => {
                      window.open("https://www.thinksmartsoftware-au.com/ocr/schedule_view.php?c=5D6DC72044045&p_id=1&t=sportsbiz&set=yes", "_blank");
                    }}
                    className="bg-primary-500 hover:bg-primary-600 text-white"
                  >
                    Enroll Now
                  </Button>
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
                    onClick={() => setIsSeniorSquadModalOpen(true)}
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
                <li><a href="mailto:info@power2adapt.com" className="hover:text-white">Contact Us</a></li>
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
      
      <SeniorSquadApplication
        isOpen={isSeniorSquadModalOpen}
        onClose={() => setIsSeniorSquadModalOpen(false)}
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
    </div>
  );
}
