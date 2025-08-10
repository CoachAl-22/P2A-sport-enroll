import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ChevronDown, ChevronRight, CreditCard, DollarSign, Shield, AlertCircle, Phone, Mail, Clock, CheckCircle, HelpCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaymentSection {
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  faqs?: { question: string; answer: string; }[];
}

export default function PaymentSupport() {
  const [expandedSection, setExpandedSection] = useState<string | null>("pricing");
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const toggleFAQ = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  const paymentSections: PaymentSection[] = [
    {
      title: "Pricing Structure",
      icon: <DollarSign className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-3 text-lg">Simple, Transparent Pricing</h4>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-900">$30 <span className="text-lg font-normal">+ GST</span></p>
              <p className="text-blue-700 font-medium">per class session</p>
              <p className="text-blue-600 text-sm mt-2">Total: $33 per class (including GST)</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">How Pricing Works</h4>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Payment covers entire term (typically 9-10 weeks)</li>
              <li>Holiday dates are automatically excluded from pricing</li>
              <li>GST is included in all displayed prices</li>
              <li>No hidden fees or additional charges</li>
              <li>Same price for all program levels</li>
            </ul>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h5 className="font-medium text-green-900 mb-2">Example Term Pricing:</h5>
            <div className="space-y-1 text-green-800 text-sm">
              <p>10-week term: 10 classes × $33 = <strong>$330 total</strong></p>
              <p>9-week term: 9 classes × $33 = <strong>$297 total</strong></p>
              <p><em>*Actual term length varies by school calendar and holidays</em></p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">What's Included</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Professional coaching from qualified instructors</li>
              <li>All equipment and training materials</li>
              <li>Progress tracking and feedback</li>
              <li>SMS notifications and updates</li>
              <li>Access to family dashboard</li>
              <li>End-of-term progress reports</li>
            </ul>
          </div>
        </div>
      ),
      faqs: [
        {
          question: "Why do you charge per class rather than a flat term fee?",
          answer: "Per-class pricing ensures you only pay for the actual classes your child can attend. If term dates change or holidays are added, your total automatically adjusts to reflect the actual number of sessions."
        },
        {
          question: "Are there any discounts for multiple children?",
          answer: "Currently, each child is charged the standard rate. However, contact us if you have multiple children enrolling as we may be able to arrange payment plans to help manage costs."
        }
      ]
    },
    {
      title: "Payment Methods & Security",
      icon: <CreditCard className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Accepted Payment Methods</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h5 className="font-medium text-gray-900 mb-2">Credit Cards</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Visa</li>
                  <li>• Mastercard</li>
                  <li>• American Express</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <h5 className="font-medium text-gray-900 mb-2">Debit Cards</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Visa Debit</li>
                  <li>• Mastercard Debit</li>
                  <li>• EFTPOS</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Payment Security
            </h4>
            <ul className="list-disc list-inside space-y-1 text-green-800 text-sm">
              <li>Payments processed through Stripe (industry-leading security)</li>
              <li>PCI DSS compliant payment processing</li>
              <li>256-bit SSL encryption for all transactions</li>
              <li>No card details stored on our servers</li>
              <li>Fraud protection and monitoring</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Payment Process</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Select your child's program and review enrollment details</li>
              <li>Proceed to secure checkout page</li>
              <li>Enter payment information in encrypted form</li>
              <li>Review and confirm payment details</li>
              <li>Receive immediate confirmation via email and SMS</li>
            </ol>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h5 className="font-medium text-yellow-900 mb-2">Important Notes:</h5>
            <ul className="list-disc list-inside space-y-1 text-yellow-800 text-sm">
              <li>Payment is required to complete enrollment</li>
              <li>Enrollment is not confirmed until payment is successful</li>
              <li>You'll receive receipts immediately after payment</li>
              <li>Contact us immediately if payment fails or issues arise</li>
            </ul>
          </div>
        </div>
      ),
      faqs: [
        {
          question: "Is it safe to enter my card details online?",
          answer: "Yes, absolutely. We use Stripe, the same payment processor used by companies like Shopify, Lyft, and millions of other businesses worldwide. All payments are encrypted and we never see or store your card details."
        },
        {
          question: "Why did my payment fail?",
          answer: "Payment failures can occur for various reasons: insufficient funds, card restrictions, expired cards, or bank security blocks. Try a different card or contact your bank. If issues persist, contact us for assistance."
        }
      ]
    },
    {
      title: "Billing & Receipts",
      icon: <CheckCircle className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">What You'll Receive</h4>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h5 className="font-medium text-blue-900">Immediate Confirmation</h5>
                <p className="text-blue-700 text-sm">Email and SMS confirmation sent within minutes of successful payment</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <h5 className="font-medium text-green-900">Payment Receipt</h5>
                <p className="text-green-700 text-sm">Detailed receipt with breakdown of charges, GST, and payment method</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <h5 className="font-medium text-purple-900">Enrollment Details</h5>
                <p className="text-purple-700 text-sm">Complete program information, venue details, and term dates</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Receipt Information Includes</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Child's name and program details</li>
              <li>Class schedule and venue information</li>
              <li>Number of sessions and cost breakdown</li>
              <li>GST amount and total paid</li>
              <li>Payment method and transaction reference</li>
              <li>Date and time of payment</li>
            </ul>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <h4 className="font-medium text-orange-900 mb-2">Keep Your Receipts</h4>
            <p className="text-orange-800 text-sm">
              Save all payment confirmations and receipts for your records. You may need them for:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-orange-800 text-sm">
              <li>Tax purposes (if claiming child care or sports expenses)</li>
              <li>Insurance claims or reimbursements</li>
              <li>Employer benefit programs</li>
              <li>Family budget tracking</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Lost Receipt?</h4>
            <p className="text-gray-600 mb-2">
              If you need a copy of your payment receipt or enrollment confirmation:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Check your email inbox and spam folder</li>
              <li>Log into your parent dashboard to view payment history</li>
              <li>Contact us with your child's name and enrollment date</li>
              <li>We can resend receipts within 24 hours</li>
            </ul>
          </div>
        </div>
      ),
      faqs: [
        {
          question: "Can I get a tax invoice for my payment?",
          answer: "Yes, your payment receipt includes all GST details and serves as a tax invoice. It includes our ABN and meets Australian Tax Office requirements for claiming eligible expenses."
        },
        {
          question: "How long should I keep my receipts?",
          answer: "We recommend keeping receipts for at least 5 years for tax purposes. You can also access your payment history through your parent dashboard at any time."
        }
      ]
    },
    {
      title: "Refunds & Cancellations",
      icon: <RefreshCw className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h4 className="font-semibold text-red-900 mb-2">Refund Policy</h4>
            <p className="text-red-800 text-sm">
              Refunds are considered on a case-by-case basis for medical reasons or significant family circumstances. 
              We cannot provide refunds for missed individual classes or change of mind.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">When Refunds May Be Considered</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Medical conditions preventing participation (with medical certificate)</li>
              <li>Family relocation outside program areas</li>
              <li>Serious family circumstances</li>
              <li>Program cancellation by Power2ADAPT</li>
              <li>Safety concerns at venue level</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Refund Process</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Contact us immediately when circumstances arise</li>
              <li>Provide relevant documentation (medical certificates, etc.)</li>
              <li>We review each case individually</li>
              <li>If approved, refunds processed within 5-10 business days</li>
              <li>Refunds returned to original payment method</li>
            </ol>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Alternative Options</h4>
            <p className="text-blue-800 text-sm mb-2">Before requesting a refund, consider these alternatives:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
              <li>Transfer to a different class time or venue</li>
              <li>Hold enrollment credit for future terms</li>
              <li>Arrange makeup sessions for missed classes</li>
              <li>Switch to a different program better suited to your child</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">What's NOT Refundable</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Individual missed classes (illness, family events, etc.)</li>
              <li>Change of mind after enrollment</li>
              <li>Holiday periods (already excluded from pricing)</li>
              <li>Weather-related cancellations (makeup sessions provided)</li>
              <li>Child decides they don't like the program</li>
            </ul>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Our Commitment</h4>
            <p className="text-green-800 text-sm">
              We understand that family circumstances can change. While we cannot offer blanket refunds, 
              we're committed to working with families to find fair solutions. Contact us to discuss your situation.
            </p>
          </div>
        </div>
      ),
      faqs: [
        {
          question: "What if my child gets injured and can't continue?",
          answer: "For injuries preventing ongoing participation, we consider partial refunds with appropriate medical documentation. Contact us immediately to discuss options and required documentation."
        },
        {
          question: "Can I get a refund if we're moving interstate?",
          answer: "Yes, family relocation outside our program areas is grounds for refund consideration. Contact us with details of your move and we'll work out a fair solution."
        }
      ]
    },
    {
      title: "Payment Plans & Assistance",
      icon: <HelpCircle className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-900 mb-2">Financial Assistance Available</h4>
            <p className="text-purple-800 text-sm">
              We believe every child should have access to quality athletic programs. If cost is a barrier, 
              please contact us confidentially to discuss payment options.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Payment Plan Options</h4>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Split term payment into 2 installments</li>
              <li>Extended payment terms for multiple children</li>
              <li>Payment deferrals for temporary financial hardship</li>
              <li>Scholarship opportunities for eligible families</li>
              <li>Sibling payment arrangements</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">How to Request Payment Assistance</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Contact us before enrolling to discuss options</li>
              <li>Explain your family's circumstances confidentially</li>
              <li>We'll work together to find a suitable arrangement</li>
              <li>All payment plans must be agreed before enrollment</li>
              <li>Plans are reviewed each term</li>
            </ol>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-2">External Support Options</h4>
            <p className="text-yellow-800 text-sm mb-2">Families may also be eligible for support through:</p>
            <ul className="list-disc list-inside space-y-1 text-yellow-800 text-sm">
              <li>Government sports voucher programs</li>
              <li>School community support funds</li>
              <li>Local council recreational assistance</li>
              <li>Community sporting club scholarships</li>
              <li>Employer family benefit programs</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Late Payment Policy</h4>
            <p className="text-gray-600 mb-2">If you're unable to pay by the due date:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Contact us immediately - don't wait</li>
              <li>We'll work with you to arrange a payment extension</li>
              <li>Your child can continue attending while we sort out payment</li>
              <li>No penalties or fees for approved payment arrangements</li>
              <li>Confidential handling of all financial discussions</li>
            </ul>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Our Philosophy</h4>
            <p className="text-green-800 text-sm">
              Every child deserves the opportunity to develop through sport. Financial circumstances should never 
              prevent participation. We're committed to working with families to ensure all children can access our programs.
            </p>
          </div>
        </div>
      ),
      faqs: [
        {
          question: "Will asking for payment assistance affect my child's treatment in the program?",
          answer: "Absolutely not. Payment arrangements are handled confidentially by our admin team and coaches are not informed of family payment situations. All children receive equal attention and opportunities regardless of payment arrangements."
        },
        {
          question: "Can I pay weekly instead of for the whole term?",
          answer: "While our standard policy is term payment, we can arrange weekly payment plans for families who need this option. Contact us to discuss a schedule that works for your family budget."
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
                <h1 className="text-3xl font-heading font-bold text-gray-900">Payment Support</h1>
                <p className="text-gray-600 mt-2">Complete information about payments, pricing, and financial assistance</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Contact */}
      <div className="bg-purple-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center text-purple-700">
              <Phone className="w-4 h-4 mr-2" />
              <span>Payment help: </span>
              <a href="tel:+61434679395" className="font-medium hover:text-purple-900 ml-1">+61 434 679 395</a>
            </div>
            <div className="flex items-center text-purple-700">
              <Mail className="w-4 h-4 mr-2" />
              <span>Email support: </span>
              <a href="mailto:info@power2adapt.com" className="font-medium hover:text-purple-900 ml-1">info@power2adapt.com</a>
            </div>
            <div className="flex items-center text-purple-700">
              <Clock className="w-4 h-4 mr-2" />
              <span>Response time: Within 24 hours</span>
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
              <h3 className="font-heading font-semibold text-gray-900 mb-4">Payment Topics</h3>
              <nav className="space-y-2">
                {paymentSections.map((section, index) => (
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
            {paymentSections.map((section, index) => (
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
                          Common Questions
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

            {/* Emergency Contact */}
            <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-lg p-8 text-white text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-90" />
              <h3 className="text-2xl font-heading font-bold mb-2">Payment Emergency?</h3>
              <p className="mb-6 opacity-90">If you're experiencing payment issues or financial difficulty, don't wait - contact us immediately. We're here to help!</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild className="bg-white text-red-500 hover:bg-gray-100">
                  <a href="tel:+61434679395">Call Now</a>
                </Button>
                <Button asChild variant="outline" className="border-white text-white hover:bg-white hover:text-red-500 bg-transparent">
                  <a href="mailto:info@power2adapt.com" className="text-white hover:text-red-500">Send Urgent Email</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}