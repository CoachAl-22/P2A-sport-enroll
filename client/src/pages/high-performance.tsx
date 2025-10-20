import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import LoginModal from "@/components/auth/login-modal";
import ContactFormModal from "@/components/contact-form-modal";
import { Users, Building2, Smartphone, ArrowLeft, Calendar, MapPin, Award, Target, Clock, Zap } from "lucide-react";
import { Link } from "wouter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const highPerformanceSquadApplicationSchema = z.object({
  athleteFirstName: z.string().min(1, "First name is required"),
  athleteLastName: z.string().min(1, "Last name is required"),
  athleteEmail: z.string().email("Valid email is required"),
  athletePhone: z.string().min(1, "Phone number is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  schoolYear: z.string().min(1, "School year is required"),
  parentGuardianName: z.string().optional(),
  parentGuardianEmail: z.string().email().optional().or(z.literal("")),
  parentGuardianPhone: z.string().optional(),
  currentSports: z.string().min(1, "Please list current sports"),
  competitionLevel: z.string().min(1, "Please describe your competition level"),
  athleticExperience: z.string().min(1, "Please describe athletic experience"),
  previousClubs: z.string().optional(),
  personalBests: z.string().min(1, "Please list your personal best times/distances"),
  coachingHistory: z.string().optional(),
  athleticGoals: z.string().min(1, "Please describe your high-performance goals"),
  targetCompetitions: z.string().min(1, "What competitions are you targeting?"),
  performanceAmbitions: z.string().min(1, "Describe your performance ambitions (state, national, international)"),
  currentTrainingLoad: z.string().min(1, "Describe your current weekly training load"),
  trainingCommitment: z.string().min(1, "How many sessions per week can you commit to?"),
  timeAvailability: z.string().min(1, "What days/times are you available for training?"),
  coachingType: z.string().min(1, "What type of coaching are you looking for? (1-on-1, small group, technical, etc.)"),
  specificNeeds: z.string().min(1, "What specific areas do you want to improve?"),
  reasonForHighPerformance: z.string().min(1, "Why do you want High Performance coaching?"),
  injuries: z.string().optional(),
  additionalNotes: z.string().optional(),
});

type HighPerformanceSquadApplicationForm = z.infer<typeof highPerformanceSquadApplicationSchema>;

export default function HighPerformance() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<HighPerformanceSquadApplicationForm>({
    resolver: zodResolver(highPerformanceSquadApplicationSchema),
    defaultValues: {
      athleteFirstName: "",
      athleteLastName: "",
      athleteEmail: "",
      athletePhone: "",
      dateOfBirth: "",
      schoolYear: "",
      parentGuardianName: "",
      parentGuardianEmail: "",
      parentGuardianPhone: "",
      currentSports: "",
      competitionLevel: "",
      athleticExperience: "",
      previousClubs: "",
      personalBests: "",
      coachingHistory: "",
      athleticGoals: "",
      targetCompetitions: "",
      performanceAmbitions: "",
      currentTrainingLoad: "",
      trainingCommitment: "",
      timeAvailability: "",
      coachingType: "",
      specificNeeds: "",
      reasonForHighPerformance: "",
      injuries: "",
      additionalNotes: "",
    },
  });

  const onSubmit = async (data: HighPerformanceSquadApplicationForm) => {
    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/high-performance-squad-applications", data);
      toast({
        title: "Application Submitted Successfully!",
        description: "We'll review your High Performance Squad application and contact you within 48 hours. Check your SMS for confirmation.",
      });
      form.reset();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      toast({
        title: "Application Failed",
        description: error.message || "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <div className="bg-white rounded-xl shadow-xl p-8 max-w-5xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">
                  High Performance Squad Application
                </h2>
                <p className="text-lg text-gray-600">
                  Apply for elite-level coaching and join our High Performance program
                </p>
              </div>

              {/* Program Overview Card */}
              <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 mb-8">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-purple-800">
                    <Zap className="w-5 h-5" />
                    Elite High Performance Coaching
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Users className="w-4 h-4 text-purple-600" />
                        <span className="text-sm">1-on-1 & Small Group Training</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Target className="w-4 h-4 text-purple-600" />
                        <span className="text-sm">Performance Analysis & Planning</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Award className="w-4 h-4 text-purple-600" />
                        <span className="text-sm">Competition Preparation</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        <span className="text-sm">Flexible Scheduling</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin className="w-4 h-4 text-purple-600" />
                        <span className="text-sm">Multiple Venue Options</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock className="w-4 h-4 text-purple-600" />
                        <span className="text-sm">Custom Training Programs</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Application Form */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {/* Athlete Information Section */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Athlete Information</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="athleteFirstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} data-testid="input-athlete-first-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="athleteLastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Smith" {...field} data-testid="input-athlete-last-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="athleteEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john@example.com" {...field} data-testid="input-athlete-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="athletePhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone *</FormLabel>
                            <FormControl>
                              <Input placeholder="0412 345 678" {...field} data-testid="input-athlete-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Birth *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} data-testid="input-date-of-birth" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="schoolYear"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>School Year *</FormLabel>
                            <FormControl>
                              <Input placeholder="Year 10" {...field} data-testid="input-school-year" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Parent/Guardian Information */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Parent/Guardian Contact</h3>
                    <p className="text-sm text-gray-600 mb-4">(If different from athlete)</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="parentGuardianName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Parent/Guardian Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Jane Smith" {...field} data-testid="input-parent-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="parentGuardianEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Parent/Guardian Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="parent@example.com" {...field} data-testid="input-parent-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="parentGuardianPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Parent/Guardian Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="0412 345 678" {...field} data-testid="input-parent-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Athletic Background */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Athletic Background & Performance Level</h3>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="currentSports"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Sports *</FormLabel>
                            <FormControl>
                              <Textarea placeholder="List all sports you currently participate in..." {...field} data-testid="input-current-sports" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="competitionLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Competition Level *</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Describe your current competition level (e.g., local, regional, state, national)..." {...field} data-testid="input-competition-level" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="athleticExperience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Athletic Experience *</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Years of experience, achievements, competitions..." {...field} data-testid="input-athletic-experience" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="previousClubs"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Previous Clubs/Teams</FormLabel>
                            <FormControl>
                              <Input placeholder="List any previous clubs or teams..." {...field} data-testid="input-previous-clubs" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="personalBests"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Personal Best Times/Distances *</FormLabel>
                            <FormControl>
                              <Textarea placeholder="List your personal records (e.g., 100m: 12.3s, Long Jump: 5.2m)..." {...field} data-testid="input-personal-bests" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="coachingHistory"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Previous Coaching History</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Previous coaches, programs, training history..." {...field} data-testid="input-coaching-history" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* High Performance Goals */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">High Performance Goals</h3>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="athleticGoals"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Athletic Goals *</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Describe your high-performance goals..." {...field} data-testid="input-athletic-goals" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="targetCompetitions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target Competitions *</FormLabel>
                            <FormControl>
                              <Textarea placeholder="What competitions are you targeting? (e.g., State Championships, National Junior Championships)..." {...field} data-testid="input-target-competitions" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="performanceAmbitions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Performance Ambitions *</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Describe your performance ambitions (state, national, international level)..." {...field} data-testid="input-performance-ambitions" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Training & Commitment */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Training & Commitment</h3>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="currentTrainingLoad"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Weekly Training Load *</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Describe your current weekly training schedule and volume..." {...field} data-testid="input-training-load" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="trainingCommitment"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Training Commitment *</FormLabel>
                            <FormControl>
                              <Textarea placeholder="How many sessions per week can you commit to?" {...field} data-testid="input-training-commitment" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="timeAvailability"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Time Availability *</FormLabel>
                            <FormControl>
                              <Textarea placeholder="What days/times are you available for training?" {...field} data-testid="input-time-availability" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Specific Coaching Needs */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Specific Coaching Needs</h3>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="coachingType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Coaching Type Preference *</FormLabel>
                            <FormControl>
                              <Textarea placeholder="What type of coaching are you looking for? (1-on-1, small group, technical, etc.)" {...field} data-testid="input-coaching-type" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="specificNeeds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Specific Areas to Improve *</FormLabel>
                            <FormControl>
                              <Textarea placeholder="What specific areas do you want to improve?" {...field} data-testid="input-specific-needs" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="reasonForHighPerformance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Why High Performance Coaching? *</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Why do you want High Performance coaching?" {...field} data-testid="input-reason-hp" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Additional Information</h3>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="injuries"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current or Past Injuries</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Please list any current or past injuries we should be aware of..." {...field} data-testid="input-injuries" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="additionalNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Additional Notes</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Any other information you'd like to share..." {...field} data-testid="input-additional-notes" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-center pt-4">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="bg-purple-600 hover:bg-purple-700 px-12 py-3 text-lg"
                      data-testid="button-submit-application"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Application"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>

          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-heading font-bold mb-4">Have Questions?</h2>
            <p className="text-lg mb-6 text-primary-100">
              Contact us to discuss your specific goals and learn more about our High Performance program
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => setIsContactFormOpen(true)}
                className="bg-secondary-500 hover:bg-secondary-600 text-white font-semibold px-8 py-3"
              >
                Book a Call / Email
              </Button>
              <Button 
                onClick={() => setIsContactFormOpen(true)}
                className="bg-transparent border-2 border-secondary-400 text-secondary-400 hover:bg-secondary-400 hover:text-white px-8 py-3 font-semibold"
              >
                Enquire / Book Performance Assessment
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
      
      <ContactFormModal 
        isOpen={isContactFormOpen} 
        onClose={() => setIsContactFormOpen(false)} 
      />
    </div>
  );
}