import { useState } from "react";
import { Button } from "@/components/ui/button";
import LoginModal from "@/components/auth/login-modal";
import { Calendar, MapPin, Users, Plus, BarChart3, CreditCard, Smartphone, RotateCcw, Building2, MessageSquare, Phone, Mail, School, Clock } from "lucide-react";

export default function Landing() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

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
                <a href="#contact" className="text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium">Contact</a>
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
                Where Young Athletes <span className="text-secondary-500">Thrive</span>
              </h1>
              <p className="text-xl mb-8 text-blue-100">
                Expert coaching at your child's school. Flexible programs that build confidence, skill, and a love for sport. Ages 5 to 13 welcome.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => setIsLoginModalOpen(true)}
                  className="bg-secondary-500 hover:bg-secondary-600 text-white px-8 py-4 rounded-lg font-heading font-semibold text-lg"
                >
                  Start Your Child's Journey
                </Button>
                <Button 
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white hover:text-primary-500 px-8 py-4 rounded-lg font-heading font-semibold text-lg"
                >
                  Explore Programs
                </Button>
              </div>
            </div>
            <div className="hidden md:block">
              <img 
                src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Young athletes playing basketball" 
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
              <div className="text-3xl md:text-4xl font-heading font-bold text-primary-500 mb-2">Multiple</div>
              <div className="text-gray-600">Venues</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-heading font-bold text-primary-500 mb-2">Multiple</div>
              <div className="text-gray-600">Team Sports</div>
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
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">Available Classes - Term 3, 2024</h2>
            <p className="text-xl text-gray-600">9 weeks of professional athletic training</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Foundation Class */}
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary-500 transition-colors hover:shadow-lg">
              <img 
                src="https://images.unsplash.com/photo-1566666826155-6532fb52b1a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200" 
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
                    <span className="text-sm">Multiple Venues Available</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span className="text-sm">Ages Prep - Year 2 • 15 spots</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-heading font-bold text-primary-500">$30</span>
                    <span className="text-gray-500 text-sm"> + GST per class</span>
                  </div>
                  <Button 
                    onClick={() => setIsLoginModalOpen(true)}
                    className="bg-primary-500 hover:bg-primary-600 text-white"
                  >
                    Enroll Now
                  </Button>
                </div>
              </div>
            </div>

            {/* Emerging Athletes */}
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary-500 transition-colors hover:shadow-lg">
              <img 
                src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200" 
                alt="Young athletes developing skills in team sports" 
                className="w-full h-48 object-cover"
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
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-heading font-bold text-primary-500">$30</span>
                    <span className="text-gray-500 text-sm"> + GST per class</span>
                  </div>
                  <Button 
                    onClick={() => setIsLoginModalOpen(true)}
                    className="bg-primary-500 hover:bg-primary-600 text-white"
                  >
                    Enroll Now
                  </Button>
                </div>
              </div>
            </div>

            {/* Foundation Class - Toorak College Tuesday */}
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary-500 transition-colors hover:shadow-lg">
              <img 
                src="https://images.unsplash.com/photo-1566666826155-6532fb52b1a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200" 
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
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-heading font-bold text-primary-500">$30</span>
                    <span className="text-gray-500 text-sm"> + GST per class</span>
                  </div>
                  <Button 
                    onClick={() => setIsLoginModalOpen(true)}
                    className="bg-primary-500 hover:bg-primary-600 text-white"
                  >
                    Enroll Now
                  </Button>
                </div>
              </div>
            </div>

            {/* Emerging Athletes - Toorak College Thursday */}
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary-500 transition-colors hover:shadow-lg">
              <img 
                src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200" 
                alt="Young athletes developing skills in team sports" 
                className="w-full h-48 object-cover"
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
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-heading font-bold text-primary-500">$30</span>
                    <span className="text-gray-500 text-sm"> + GST per class</span>
                  </div>
                  <Button 
                    onClick={() => setIsLoginModalOpen(true)}
                    className="bg-primary-500 hover:bg-primary-600 text-white"
                  >
                    Enroll Now
                  </Button>
                </div>
              </div>
            </div>

            {/* Team Sport Speed - Friday 4:30pm */}
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary-500 transition-colors hover:shadow-lg">
              <img 
                src="https://images.unsplash.com/photo-1544717297-fa95b6ee9643?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200" 
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
                    onClick={() => setIsLoginModalOpen(true)}
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
                src="https://images.unsplash.com/photo-1544717297-fa95b6ee9643?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200" 
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
                    onClick={() => setIsLoginModalOpen(true)}
                    className="bg-primary-500 hover:bg-primary-600 text-white"
                  >
                    Enroll Now
                  </Button>
                </div>
              </div>
            </div>

            {/* Academy - Ballam Park Monday */}
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary-500 transition-colors hover:shadow-lg">
              <img 
                src="https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200" 
                alt="Elite academy athletes training at professional athletic track" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-heading font-bold text-gray-900">Academy</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Available
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="text-sm">Monday 5:30pm</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-sm">Ballam Park Athletic Track</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span className="text-sm">Max 20 athletes total</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-heading font-bold text-primary-500">$30</span>
                    <span className="text-gray-500 text-sm"> + GST per class</span>
                  </div>
                  <Button 
                    onClick={() => setIsLoginModalOpen(true)}
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
                    <span className="text-sm">Tuesday 5:30pm</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-sm">Ballam Park Athletic Track</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span className="text-sm">Max 20 athletes total</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-heading font-bold text-primary-500">$30</span>
                    <span className="text-gray-500 text-sm"> + GST per class</span>
                  </div>
                  <Button 
                    onClick={() => setIsLoginModalOpen(true)}
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
                src="https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200" 
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
                    <span className="text-sm">Thursday 5:30pm</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-sm">Ballam Park Athletic Track</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span className="text-sm">Max 20 athletes • Application only</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-heading font-bold text-primary-500">$30</span>
                    <span className="text-gray-500 text-sm"> + GST per class</span>
                  </div>
                  <Button 
                    onClick={() => setIsLoginModalOpen(true)}
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
                <li><a href="#" className="hover:text-white">Basketball</a></li>
                <li><a href="#" className="hover:text-white">Soccer</a></li>
                <li><a href="#" className="hover:text-white">Tennis</a></li>
                <li><a href="#" className="hover:text-white">Swimming</a></li>
                <li><a href="#" className="hover:text-white">Multi-Sport</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-heading font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white">Parent Help Center</a></li>
                <li><a href="#" className="hover:text-white">Enrollment Guide</a></li>
                <li><a href="#" className="hover:text-white">Payment Support</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">School Partnerships</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-heading font-semibold mb-4">Contact Info</h4>
              <div className="space-y-2 text-gray-300">
                <p className="flex items-center"><Phone className="w-4 h-4 mr-2" />1300 SPORTS (1300 776 787)</p>
                <p className="flex items-center"><Mail className="w-4 h-4 mr-2" />support@power2perform.com.au</p>
                <p className="flex items-center"><School className="w-4 h-4 mr-2" />Serving Victorian Schools</p>
                <p className="flex items-center"><Clock className="w-4 h-4 mr-2" />Mon-Fri: 8am-6pm</p>
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
    </div>
  );
}
