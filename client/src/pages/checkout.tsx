import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useStripe, Elements, PaymentElement, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/navbar";
import { CreditCard, Lock, CheckCircle } from "lucide-react";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

const CheckoutForm = ({ enrollment }: { enrollment: any }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    if (!stripe || !elements) {
      setIsProcessing(false);
      return;
    }

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/?payment=success`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: "Thank you! Your enrollment is now confirmed.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <Lock className="w-5 h-5 text-blue-500 mr-2" />
          <span className="text-sm text-blue-700">
            Your payment information is secure and encrypted
          </span>
        </div>
      </div>

      <PaymentElement />

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">Payment Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Class fee (9 weeks)</span>
            <span>${enrollment?.class?.pricePerTerm}</span>
          </div>
          <div className="flex justify-between">
            <span>GST (10%)</span>
            <span>${(parseFloat(enrollment?.class?.pricePerTerm || 0) * 0.1).toFixed(2)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Total</span>
            <span>${(parseFloat(enrollment?.class?.pricePerTerm || 0) * 1.1).toFixed(2)} AUD</span>
          </div>
        </div>
      </div>

      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3"
      >
        {isProcessing ? (
          <div className="flex items-center">
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
            Processing Payment...
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <CreditCard className="w-4 h-4 mr-2" />
            Complete Payment
          </div>
        )}
      </Button>

      <div className="text-center text-xs text-gray-500">
        By completing this payment, you agree to Power2Perform's terms and conditions
      </div>
    </form>
  );
};

export default function Checkout() {
  const { enrollmentId } = useParams();
  const [clientSecret, setClientSecret] = useState("");
  const { toast } = useToast();

  const { data: enrollment, isLoading } = useQuery({
    queryKey: ["/api/enrollments", enrollmentId],
    queryFn: async () => {
      const response = await fetch(`/api/enrollments/${enrollmentId}`);
      if (!response.ok) throw new Error('Failed to fetch enrollment');
      return response.json();
    },
    enabled: !!enrollmentId,
  });

  useEffect(() => {
    if (enrollmentId && enrollment) {
      // Create PaymentIntent as soon as the page loads
      apiRequest("POST", "/api/create-payment-intent", { enrollmentId })
        .then((res) => res.json())
        .then((data) => {
          setClientSecret(data.clientSecret);
        })
        .catch((error) => {
          toast({
            title: "Payment Error",
            description: "Failed to initialize payment. Please try again.",
            variant: "destructive",
          });
        });
    }
  }, [enrollmentId, enrollment, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!enrollment || !clientSecret) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">
                {!enrollment ? "Enrollment not found" : "Loading payment..."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getDayName = (dayOfWeek: number) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[dayOfWeek];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">
            Complete Your Payment
          </h1>
          <p className="text-gray-600">
            Secure your spot in this athletic program
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Enrollment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                Enrollment Confirmed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-heading font-bold text-lg text-gray-900">
                  {enrollment.class?.name}
                </h3>
                <Badge className="mt-1 bg-green-100 text-green-800">
                  {enrollment.enrollment?.status === "waitlist" ? "Waitlisted" : "Enrolled"}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Student:</span>
                  <span className="font-medium">
                    {enrollment.child?.firstName} {enrollment.child?.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Schedule:</span>
                  <span className="font-medium">
                    {enrollment.class && `${getDayName(enrollment.class.dayOfWeek)}s ${enrollment.class.startTime} - ${enrollment.class.endTime}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Venue:</span>
                  <span className="font-medium">{enrollment.venue?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">9 weeks</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Coach:</span>
                  <span className="font-medium">
                    {enrollment.coach?.firstName} {enrollment.coach?.lastName}
                  </span>
                </div>
              </div>

              {enrollment.class?.description && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">About this class</h4>
                  <p className="text-sm text-gray-600">
                    {enrollment.class.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Check if Stripe is configured */}
              {!import.meta.env.VITE_STRIPE_PUBLIC_KEY ? (
                <div className="text-center py-8">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h3 className="font-heading font-bold text-yellow-800 mb-2">Payment Configuration Required</h3>
                    <p className="text-yellow-700">
                      Stripe payment processing is not yet configured. Please contact support to complete your enrollment payment.
                    </p>
                    <div className="mt-4">
                      <Button variant="outline" className="text-yellow-700 border-yellow-300">
                        Contact Support
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Make SURE to wrap the form in <Elements> which provides the stripe context. */
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm enrollment={enrollment} />
                </Elements>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
