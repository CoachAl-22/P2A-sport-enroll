import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ChevronDown, ChevronRight, Phone, Mail, Clock, CreditCard, Calendar, Users, MapPin, Shield, AlertCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FAQItem {
  question: string;
  answer: string;
}

interface HelpSection {
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  faqs?: FAQItem[];
}

export default function ParentHelpCenter() {
  const [expandedSection, setExpandedSection] = useState<string | null>("getting-started");
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const toggleFAQ = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  const helpSections: HelpSection[] = [
    {
      title: "Getting Started",
      icon: <Users className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Creating Your Account</h4>
            <p className="text-gray-600 mb-3">To enroll your child in Power2ADAPT programs:</p>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Click "Sign Up" on our homepage</li>
              <li>Enter your family details and contact information</li>
              <li>Add your child's information (name, age, school)</li>
              <li>Browse available programs and select the best fit</li>
              <li>Complete enrollment and payment</li>
            </ol>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Understanding Program Levels</h4>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h5 className="font-medium text-blue-900">Foundation (Prep - Year 2)</h5>
                <p className="text-blue-700 text-sm">Movement & Skill Foundation via a games approach. Focus on fundamental movement skills and building confidence.</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <h5 className="font-medium text-green-900">Emerging Athletes (Year 3-6)</h5>
                <p className="text-green-700 text-sm">Team sport performance benefits and athletic movement development. More structured skill building.</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <h5 className="font-medium text-purple-900">Academy Programs (Year 7+)</h5>
                <p className="text-purple-700 text-sm">Junior Development and Team Sport Athletes categories for more advanced training.</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <h5 className="font-medium text-orange-900">Senior Squad & High Performance</h5>
                <p className="text-orange-700 text-sm">Elite programs by application only for dedicated athletes seeking high-level coaching.</p>
              </div>
            </div>
          </div>
        </div>
      ),
      faqs: [
        {
          question: "What age is right for my child to start?",
          answer: "We welcome children from Prep (age 5) through Year 13. Our Foundation programs are perfect for beginners, while older children can join Emerging or Academy programs based on their experience level."
        },
        {
          question: "Does my child need prior sports experience?",
          answer: "Not at all! Our programs are designed to welcome children of all skill levels. We focus on building confidence and fundamental skills in a supportive environment."
        }
      ]
    },
    {
      title: "Program Information",
      icon: <Calendar className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Training Schedules</h4>
            <p className="text-gray-600 mb-3">Our programs run during Victorian school terms (9-10 weeks):</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Classes typically run Monday to Friday, 3:30-4:45pm</li>
              <li>Weekend programs available at some venues</li>
              <li>Aligned with government school term dates</li>
              <li>No classes during school holidays</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">What Your Child Needs</h4>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h5 className="font-medium text-yellow-900 mb-2">Essential Items:</h5>
              <ul className="list-disc list-inside space-y-1 text-yellow-800">
                <li>Comfortable athletic clothing (t-shirt, shorts/tracksuit)</li>
                <li>Proper athletic shoes (no school shoes)</li>
                <li>Water bottle</li>
                <li>Hat for outdoor sessions</li>
                <li>Sunscreen (applied before arrival)</li>
              </ul>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Venue Locations</h4>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="p-3 border border-orange-200 bg-orange-50 rounded-lg">
                <h5 className="font-medium flex items-center text-orange-900"><MapPin className="w-4 h-4 mr-2" />Peninsula Grammar</h5>
                <p className="text-xs text-orange-700 font-medium">Students attending this school only</p>
                <p className="text-sm text-orange-600">Mount Eliza campus</p>
              </div>
              <div className="p-3 border border-orange-200 bg-orange-50 rounded-lg">
                <h5 className="font-medium flex items-center text-orange-900"><MapPin className="w-4 h-4 mr-2" />Toorak College</h5>
                <p className="text-xs text-orange-700 font-medium">Students attending this school only</p>
                <p className="text-sm text-orange-600">Mount Eliza campus</p>
              </div>
              <div className="p-3 border border-green-200 bg-green-50 rounded-lg">
                <h5 className="font-medium flex items-center text-green-900"><MapPin className="w-4 h-4 mr-2" />Ballam Park Athletics Track</h5>
                <p className="text-xs text-green-700 font-medium">Open to all students</p>
                <p className="text-sm text-green-600">Frankston South</p>
              </div>
              <div className="p-3 border border-green-200 bg-green-50 rounded-lg">
                <h5 className="font-medium flex items-center text-green-900"><MapPin className="w-4 h-4 mr-2" />Mornington Athletics Track</h5>
                <p className="text-xs text-green-700 font-medium">Open to all students</p>
                <p className="text-sm text-green-600">Mornington</p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Important:</strong> Peninsula Grammar and Toorak College programs are restricted to students attending those schools due to school policy. All other venues welcome students from any school.
              </p>
            </div>
          </div>
        </div>
      ),
      faqs: [
        {
          question: "What happens if my child's school is not a partner venue?",
          answer: "We're always expanding our partnerships! Contact us at info@power2adapt.com to discuss bringing Power2ADAPT programs to your child's school. Our athletics track venues (Ballam Park and Mornington) are also open to all students."
        },
        {
          question: "Can my child attend programs at a different venue?",
          answer: "Yes, but with restrictions. Peninsula Grammar and Toorak College programs are only for students attending those schools due to school policy. However, Ballam Park Athletics Track and Mornington Athletics Track welcome students from any school, providing flexible options for families."
        }
      ]
    },
    {
      title: "Payment & Billing",
      icon: <CreditCard className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Pricing Structure</h4>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-900 font-medium text-lg">$30 + GST per class</p>
              <p className="text-blue-700 text-sm mt-1">Total cost depends on number of classes in the term (typically 9-10 weeks)</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Payment Methods</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Secure online payments via Stripe</li>
              <li>Credit cards and debit cards accepted</li>
              <li>Payment due at time of enrollment</li>
              <li>Automatic receipt sent via email and SMS</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Term-Based Billing</h4>
            <p className="text-gray-600 mb-2">Our billing is aligned with school terms:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Payment covers the entire term</li>
              <li>Holiday dates are excluded from pricing</li>
              <li>Automatic re-enrollment for following terms (with advance notice)</li>
              <li>SMS reminders sent 1 month before term renewal</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Refund Policy</h4>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-orange-900 text-sm">
                Refunds are considered on a case-by-case basis for medical reasons or family circumstances. 
                Please contact us as soon as possible if you need to discuss your enrollment.
              </p>
            </div>
          </div>
        </div>
      ),
      faqs: [
        {
          question: "What if I can't afford the full term payment upfront?",
          answer: "Please contact us at info@power2adapt.com to discuss payment plan options. We want to make our programs accessible to all families."
        },
        {
          question: "Do I get a refund if my child misses classes?",
          answer: "Unfortunately, we cannot provide refunds for missed individual classes. However, we encourage makeup sessions when possible and will work with families on special circumstances."
        }
      ]
    },
    {
      title: "Communication & Updates",
      icon: <Phone className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">SMS Notifications</h4>
            <p className="text-gray-600 mb-3">You'll receive automatic SMS updates for:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Enrollment confirmations</li>
              <li>Payment confirmations</li>
              <li>Class reminders (sent day before)</li>
              <li>Weather-related cancellations</li>
              <li>Waitlist spot availability</li>
              <li>Term renewal reminders</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Email Communications</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Welcome emails with program details</li>
              <li>Payment receipts and invoices</li>
              <li>Term summaries and progress updates</li>
              <li>Important program announcements</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Updating Your Information</h4>
            <p className="text-gray-600 mb-2">Keep your contact details current through:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Your parent dashboard (log in to update)</li>
              <li>Email us at info@power2adapt.com</li>
              <li>Call us on +61 434 679 395</li>
            </ul>
          </div>
        </div>
      ),
      faqs: [
        {
          question: "I'm not receiving SMS notifications. What should I do?",
          answer: "Check that your mobile number is correct in your account settings. If the issue persists, contact us as your messages may be going to spam or your carrier may be blocking them."
        },
        {
          question: "How do I opt out of marketing messages?",
          answer: "You can reply 'STOP' to any marketing SMS, or contact us directly. Note that important program notifications (like class cancellations) will still be sent."
        }
      ]
    },
    {
      title: "Common Questions",
      icon: <HelpCircle className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3">Frequently Asked Questions</h4>
            <p className="text-gray-600">Here are answers to the most common questions from parents. If you can't find what you're looking for, don't hesitate to contact us!</p>
          </div>
        </div>
      ),
      faqs: [
        {
          question: "What if my child misses a class?",
          answer: "While we cannot provide refunds for missed classes, we encourage you to let us know if your child will be absent. We may be able to arrange makeup sessions depending on availability and circumstances."
        },
        {
          question: "How do waitlists work?",
          answer: "If a class is full, you can join the waitlist for free. You'll be notified immediately via SMS when a spot becomes available, and you'll have priority access to enroll."
        },
        {
          question: "Can my child switch programs during the term?",
          answer: "Program changes during a term are possible subject to availability. Contact us to discuss your child's needs and we'll work to find the best solution."
        },
        {
          question: "What happens in bad weather?",
          answer: "Safety is our priority. Classes may be cancelled for severe weather conditions. You'll receive SMS notification if a class is cancelled, and we'll arrange makeup sessions when possible."
        },
        {
          question: "How can I contact my child's coach directly?",
          answer: "For general questions, please contact our main office first. For specific coaching matters, we can facilitate direct communication with coaches through our coordination team."
        },
        {
          question: "What if my child has special needs or medical conditions?",
          answer: "We welcome children with diverse needs! Please discuss your child's requirements with us during enrollment so we can ensure appropriate support and safety measures."
        },
        {
          question: "Can siblings attend the same program?",
          answer: "Absolutely! Siblings in the same age group can attend together. For different age groups, we may be able to schedule programs back-to-back for your convenience."
        },
        {
          question: "Do you offer trial classes?",
          answer: "We occasionally offer trial sessions during open days or special events. Contact us to learn about upcoming opportunities to experience our programs."
        }
      ]
    },
    {
      title: "Safety & Policies",
      icon: <Shield className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Child Safety Protocols</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>All coaches hold current Working with Children Checks</li>
              <li>First Aid qualified staff present at all sessions</li>
              <li>Clear pickup and drop-off procedures</li>
              <li>Emergency action plans for each venue</li>
              <li>Incident reporting and communication protocols</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Medical Information</h4>
            <div className="bg-red-50 p-4 rounded-lg">
              <h5 className="font-medium text-red-900 mb-2">Important: Please inform us of:</h5>
              <ul className="list-disc list-inside space-y-1 text-red-800">
                <li>Any medical conditions or allergies</li>
                <li>Medications your child takes</li>
                <li>Previous injuries that may affect participation</li>
                <li>Emergency contact information</li>
              </ul>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Behavior Expectations</h4>
            <p className="text-gray-600 mb-2">We maintain a positive environment where all children can learn and grow:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Respect for coaches, peers, and equipment</li>
              <li>Effort and participation encouraged over winning</li>
              <li>Inclusive environment welcoming all abilities</li>
              <li>Clear consequences for inappropriate behavior</li>
              <li>Parent communication for ongoing concerns</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Insurance & Liability</h4>
            <p className="text-gray-600">
              Power2ADAPT carries public liability insurance. However, parents are responsible for ensuring 
              their child has appropriate personal accident insurance coverage. Please review our full terms 
              and conditions for complete details.
            </p>
          </div>
        </div>
      ),
      faqs: [
        {
          question: "What happens if my child gets injured during a session?",
          answer: "Our trained staff will provide immediate first aid and contact you immediately. We follow strict incident reporting procedures and will guide you through next steps."
        },
        {
          question: "Can I watch my child's training sessions?",
          answer: "We welcome parent observation! Please check with venue coordinators about designated viewing areas and any specific venue policies."
        }
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
                <h1 className="text-3xl font-heading font-bold text-gray-900">Parent Help Center</h1>
                <p className="text-gray-600 mt-2">Everything you need to know about Power2ADAPT programs</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Contact */}
      <div className="bg-blue-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center text-blue-700">
              <Phone className="w-4 h-4 mr-2" />
              <a href="tel:+61434679395" className="hover:text-blue-900">+61 434 679 395</a>
            </div>
            <div className="flex items-center text-blue-700">
              <Mail className="w-4 h-4 mr-2" />
              <a href="mailto:info@power2adapt.com" className="hover:text-blue-900">info@power2adapt.com</a>
            </div>
            <div className="flex items-center text-blue-700">
              <Clock className="w-4 h-4 mr-2" />
              <span>Mon-Fri: 8am-6pm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h3 className="font-heading font-semibold text-gray-900 mb-4">Quick Navigation</h3>
              <nav className="space-y-2">
                {helpSections.map((section, index) => (
                  <button
                    key={index}
                    onClick={() => toggleSection(`section-${index}`)}
                    className={`w-full text-left flex items-center p-3 rounded-lg transition-colors ${
                      expandedSection === `section-${index}`
                        ? 'bg-primary-50 text-primary-700'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {section.icon}
                    <span className="ml-3 text-sm font-medium">{section.title}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {helpSections.map((section, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm">
                <button
                  onClick={() => toggleSection(`section-${index}`)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 rounded-t-lg"
                >
                  <div className="flex items-center">
                    {section.icon}
                    <h2 className="ml-3 text-xl font-heading font-semibold text-gray-900">{section.title}</h2>
                  </div>
                  {expandedSection === `section-${index}` ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                
                {expandedSection === `section-${index}` && (
                  <div className="px-6 pb-6">
                    {section.content}
                    
                    {section.faqs && section.faqs.length > 0 && (
                      <div className="mt-6 pt-6 border-t">
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                          <HelpCircle className="w-4 h-4 mr-2" />
                          Frequently Asked Questions
                        </h4>
                        <div className="space-y-3">
                          {section.faqs.map((faq, faqIndex) => (
                            <div key={faqIndex} className="border rounded-lg">
                              <button
                                onClick={() => toggleFAQ(`${index}-${faqIndex}`)}
                                className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50"
                              >
                                <span className="font-medium text-gray-900 text-sm">{faq.question}</span>
                                {expandedFAQ === `${index}-${faqIndex}` ? (
                                  <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0 ml-2" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0 ml-2" />
                                )}
                              </button>
                              {expandedFAQ === `${index}-${faqIndex}` && (
                                <div className="px-4 pb-4">
                                  <p className="text-gray-600 text-sm">{faq.answer}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Still Have Questions */}
            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg p-8 text-white text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-90" />
              <h3 className="text-2xl font-heading font-bold mb-2">Still Have Questions?</h3>
              <p className="mb-6 opacity-90">Our team is here to help! Get in touch and we'll get back to you promptly.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild className="bg-white text-primary-500 hover:bg-gray-100">
                  <a href="mailto:info@power2adapt.com">Send us an Email</a>
                </Button>
                <Button asChild variant="outline" className="border-white text-white hover:bg-white hover:text-primary-500">
                  <a href="tel:+61434679395">Call Us Now</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}