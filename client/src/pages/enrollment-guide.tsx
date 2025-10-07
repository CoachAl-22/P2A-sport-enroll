import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ChevronDown, ChevronRight, User, Calendar, CreditCard, CheckCircle, AlertCircle, MapPin, Clock, Users, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GuideStep {
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  tips?: string[];
}

export default function EnrollmentGuide() {
  const [expandedStep, setExpandedStep] = useState<string | null>("step-0");

  const toggleStep = (stepId: string) => {
    setExpandedStep(expandedStep === stepId ? null : stepId);
  };

  const enrollmentSteps: GuideStep[] = [
    {
      title: "Step 1: Create Your Family Account",
      icon: <User className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Getting Started</h4>
            <p className="text-gray-600 mb-3">Begin your Power2ADAPT journey by creating a secure family account:</p>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Visit the Power2ADAPT homepage: <a href="https://power2adapt.com/power-2-adapt-emerging-athlete/" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 underline">https://power2adapt.com/power-2-adapt-emerging-athlete/</a></li>
              <li>Click the "Enrol Now" button in the top navigation</li>
              <li>If you are a new customer then enter your family contact details (name, email, mobile number). If you are an existing customer, please enter your mobile number or email address to access your account and enrol your child into the desired class</li>
              <li>Create a secure password</li>
              <li>Verify your email address</li>
            </ol>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">Required Information:</h5>
            <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
              <li>Parent/Guardian full name</li>
              <li>Email address (for receipts and updates)</li>
              <li>Mobile number (for SMS notifications)</li>
              <li>Emergency contact details</li>
            </ul>
          </div>
        </div>
      ),
      tips: [
        "Use an email address you check regularly",
        "Ensure your mobile number is correct for SMS notifications",
        "Keep your login details secure"
      ]
    },
    {
      title: "Step 2: Add Your Child's Profile",
      icon: <Users className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Child Information</h4>
            <p className="text-gray-600 mb-3">Create detailed profiles for each child you wish to enroll:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Child's full name and date of birth</li>
              <li>Current school and year level</li>
              <li>Any medical conditions or allergies</li>
              <li>Emergency contact information</li>
              <li>Previous sports experience (optional)</li>
            </ul>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h5 className="font-medium text-yellow-900 mb-2">Medical Information:</h5>
            <p className="text-yellow-800 text-sm">
              Please provide details of any medical conditions, allergies, or medications your child takes. 
              This helps our coaches provide appropriate care and ensures your child's safety during activities.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Multiple Children</h4>
            <p className="text-gray-600">
              You can add multiple children to your family account. Each child will have their own profile 
              and can be enrolled in different programs based on their age and interests.
            </p>
          </div>
        </div>
      ),
      tips: [
        "Double-check birthdates for accurate age grouping",
        "Include all relevant medical information",
        "Update profiles if circumstances change"
      ]
    },
    {
      title: "Step 3: Browse Available Programs",
      icon: <Calendar className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Program Categories</h4>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h5 className="font-medium text-blue-900">Foundation (Prep - Year 2)</h5>
                <p className="text-blue-700 text-sm">Movement & Skill Foundation via games approach</p>
                <p className="text-blue-600 text-xs">Perfect for: First-time participants, building confidence</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <h5 className="font-medium text-green-900">Emerging Athletes (Year 3-6)</h5>
                <p className="text-green-700 text-sm">Team sport performance and athletic development</p>
                <p className="text-green-600 text-xs">Perfect for: Developing fundamental skills, sport-specific training</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <h5 className="font-medium text-purple-900">Academy Programs (Year 7+)</h5>
                <p className="text-purple-700 text-sm">Advanced training for Junior Development and Team Sport Athletes</p>
                <p className="text-purple-600 text-xs">Perfect for: Competitive athletes, advanced skill development</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <h5 className="font-medium text-orange-900">Elite Programs</h5>
                <p className="text-orange-700 text-sm">Senior Squad and High Performance (by application)</p>
                <p className="text-orange-600 text-xs">Perfect for: Dedicated athletes seeking high-level coaching</p>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Venue Considerations</h4>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="p-3 border border-orange-200 bg-orange-50 rounded-lg">
                <h5 className="font-medium text-orange-900">School-Based Venues</h5>
                <p className="text-orange-700 text-sm">Peninsula Grammar & Toorak College</p>
                <p className="text-orange-600 text-xs">Students attending these schools only</p>
              </div>
              <div className="p-3 border border-green-200 bg-green-50 rounded-lg">
                <h5 className="font-medium text-green-900">Public Venues</h5>
                <p className="text-green-700 text-sm">Ballam Park & Mornington Athletics Tracks</p>
                <p className="text-green-600 text-xs">Open to all students from any school</p>
              </div>
            </div>
          </div>
        </div>
      ),
      tips: [
        "Choose programs based on your child's age and experience level",
        "Consider venue location and accessibility",
        "Read program descriptions carefully to ensure good fit"
      ]
    },
    {
      title: "Step 4: Select Classes and Check Availability",
      icon: <Clock className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Class Selection Process</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Browse classes by program type and venue</li>
              <li>Check class times and days that work for your schedule</li>
              <li>Review class capacity and current enrollment numbers</li>
              <li>Select your preferred class option</li>
              <li>Join waitlist if class is full</li>
            </ol>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h5 className="font-medium text-green-900 mb-2">Class Information Includes:</h5>
            <ul className="list-disc list-inside space-y-1 text-green-800 text-sm">
              <li>Program type and age group</li>
              <li>Day of week and session times</li>
              <li>Venue location and facilities</li>
              <li>Coach information</li>
              <li>Term dates and number of sessions</li>
              <li>Total cost breakdown</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Waitlist System</h4>
            <p className="text-gray-600 mb-2">If your preferred class is full:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Join the waitlist at no cost</li>
              <li>Receive SMS notification when spots become available</li>
              <li>Priority access to enroll when contacted</li>
              <li>Automatic removal from waitlist if not responded to within 24 hours</li>
            </ul>
          </div>
        </div>
      ),
      tips: [
        "Have backup class options in case your first choice is full",
        "Consider multiple venues if location is flexible",
        "Join waitlists early for popular classes"
      ]
    },
    {
      title: "Step 5: Complete Payment",
      icon: <CreditCard className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Payment Process</h4>
            <p className="text-gray-600 mb-3">Secure online payment is required to complete enrollment:</p>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Review enrollment summary and total cost</li>
              <li>Enter payment details through secure Stripe checkout</li>
              <li>Confirm payment and enrollment details</li>
              <li>Receive immediate confirmation via email and SMS</li>
            </ol>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">Payment Details:</h5>
            <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
              <li>$30 + GST per class session</li>
              <li>Payment covers entire term (typically 9-10 weeks)</li>
              <li>Holiday dates excluded from pricing</li>
              <li>Secure credit/debit card processing via Stripe</li>
              <li>Immediate receipt via email</li>
            </ul>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h5 className="font-medium text-red-900 mb-2">Important Payment Notes:</h5>
            <ul className="list-disc list-inside space-y-1 text-red-800 text-sm">
              <li>Payment is due at time of enrollment</li>
              <li>No enrollment is confirmed until payment is received</li>
              <li>Refunds considered case-by-case for medical/family circumstances</li>
              <li>Contact us immediately if payment issues arise</li>
            </ul>
          </div>
        </div>
      ),
      tips: [
        "Have payment details ready before starting enrollment",
        "Check your email and phone for confirmation messages",
        "Contact us immediately if you don't receive confirmation"
      ]
    },
    {
      title: "Step 6: Confirmation and Preparation",
      icon: <CheckCircle className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">After Successful Enrollment</h4>
            <p className="text-gray-600 mb-3">You'll receive multiple confirmations:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Immediate email confirmation with enrollment details</li>
              <li>SMS confirmation with class information</li>
              <li>Payment receipt via email</li>
              <li>Welcome information packet</li>
              <li>Reminder SMS sent before first class</li>
            </ul>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h5 className="font-medium text-yellow-900 mb-2">What Your Child Needs:</h5>
            <ul className="list-disc list-inside space-y-1 text-yellow-800 text-sm">
              <li>Comfortable athletic clothing</li>
              <li>Proper athletic shoes (no school shoes)</li>
              <li>Water bottle</li>
              <li>Hat for outdoor sessions</li>
              <li>Sunscreen (apply before arrival)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">First Class Preparation</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Arrive 10 minutes early for first session</li>
              <li>Bring completed medical information forms if required</li>
              <li>Introduce yourself and your child to the coach</li>
              <li>Familiarize yourself with pickup/drop-off procedures</li>
              <li>Exchange contact details with other parents if desired</li>
            </ul>
          </div>
        </div>
      ),
      tips: [
        "Save all confirmation emails for your records",
        "Add class times to your family calendar",
        "Prepare your child by explaining what to expect"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center text-primary-500 hover:text-primary-700 mr-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
              <div>
                <h1 className="text-3xl font-heading font-bold text-gray-900">Enrollment Guide</h1>
                <p className="text-gray-600 mt-2">Complete step-by-step guide to enrolling your child in Power2ADAPT programs</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Contact */}
      <div className="bg-green-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center text-green-700">
              <Phone className="w-4 h-4 mr-2" />
              <span>Need help? Call us: </span>
              <a href="tel:+61434679395" className="font-medium hover:text-green-900 ml-1">+61 434 679 395</a>
            </div>
            <div className="flex items-center text-green-700">
              <Mail className="w-4 h-4 mr-2" />
              <span>Or email: </span>
              <a href="mailto:info@power2adapt.com" className="font-medium hover:text-green-900 ml-1">info@power2adapt.com</a>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h2 className="text-lg font-heading font-semibold text-gray-900 mb-4">Enrollment Process Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {enrollmentSteps.map((step, index) => (
              <div key={index} className="flex flex-col items-center text-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                  expandedStep === `step-${index}` ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {step.icon}
                </div>
                <p className="text-xs text-gray-600 font-medium">{step.title.replace('Step ', '').replace(/:\s.*/, '')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {enrollmentSteps.map((step, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm">
              <button
                onClick={() => toggleStep(`step-${index}`)}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 rounded-t-lg"
              >
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                    expandedStep === `step-${index}` ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {step.icon}
                  </div>
                  <h2 className="text-xl font-heading font-semibold text-gray-900">{step.title}</h2>
                </div>
                {expandedStep === `step-${index}` ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
              </button>
              
              {expandedStep === `step-${index}` && (
                <div className="px-6 pb-6">
                  {step.content}
                  
                  {step.tips && step.tips.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2 text-blue-500" />
                        Helpful Tips
                      </h4>
                      <ul className="space-y-1">
                        {step.tips.map((tip, tipIndex) => (
                          <li key={tipIndex} className="text-gray-600 text-sm flex items-start">
                            <span className="text-blue-500 mr-2">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg p-8 text-white text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-90" />
            <h3 className="text-2xl font-heading font-bold mb-2">Ready to Get Started?</h3>
            <p className="mb-6 opacity-90">Follow our simple enrollment process and get your child started in Power2ADAPT programs today!</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-white text-primary-500 hover:bg-gray-100">
                <Link href="/classes">Browse Programs</Link>
              </Button>
              <Button asChild variant="outline" className="border-white text-white hover:bg-white hover:text-primary-500 bg-transparent">
                <a href="mailto:info@power2adapt.com" className="text-white hover:text-primary-500">Ask a Question</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}