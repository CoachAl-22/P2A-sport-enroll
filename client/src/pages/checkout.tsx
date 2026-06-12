import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useStripe, Elements, PaymentElement, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/navbar";
import { CreditCard, Lock, CheckCircle, CalendarDays, Zap, Users } from "lucide-react";

const rawStripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || import.meta.env.TESTING_VITE_STRIPE_PUBLIC_KEY;
const validStripeKey = typeof rawStripeKey === "string" && rawStripeKey.startsWith("pk_") ? rawStripeKey : null;
const stripePromise = validStripeKey ? loadStripe(validStripeKey) : null;

// Programs that offer monthly direct debit
const MONTHLY_ELIGIBLE = ["academy_year7_above", "senior_squad", "empowered_athlete_program"];

// ── Term (lump sum) form ──────────────────────────────────────────────────────
const TermPaymentForm = ({ enrollment, confirmationId, totalAmount }: { enrollment: any; confirmationId?: string; totalAmount?: number }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const price = totalAmount ?? parseFloat(enrollment?.class?.pricePerTerm || "0");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    if (!stripe || !elements) { setIsProcessing(false); return; }
    try {
      const enrollmentId = confirmationId ?? enrollment?.enrollment?.id ?? enrollment?.id;
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: `${window.location.origin}/confirmation?enrollmentId=${enrollmentId}` },
      });
      if (error) {
        toast({ title: "Payment Failed", description: error.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Payment Error", description: "An unexpected error occurred. Please try again.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-2">
        <Lock className="w-5 h-5 text-blue-500 flex-shrink-0" />
        <span className="text-sm text-blue-700">Your payment information is secure and encrypted</span>
      </div>

      <PaymentElement />

      <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
        <h4 className="font-semibold text-gray-900">Payment Summary</h4>
        <div className="flex justify-between"><span>Term fee</span><span>${price.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>GST (10%)</span><span>${(price * 0.1).toFixed(2)}</span></div>
        <div className="border-t pt-2 flex justify-between font-semibold">
          <span>Total charged today</span>
          <span>${(price * 1.1).toFixed(2)} AUD</span>
        </div>
      </div>

      <Button type="submit" disabled={!stripe || isProcessing} className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3">
        {isProcessing ? (
          <span className="flex items-center gap-2"><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Processing...</span>
        ) : (
          <span className="flex items-center justify-center gap-2"><CreditCard className="w-4 h-4" />Pay ${(price * 1.1).toFixed(2)} now</span>
        )}
      </Button>
      <p className="text-center text-xs text-gray-400">By completing this payment, you agree to Power2ADAPT's terms and conditions</p>
    </form>
  );
};

// ── Monthly (setup intent) form ───────────────────────────────────────────────
const MonthlyPaymentForm = ({ enrollment, onSuccess }: { enrollment: any; onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    if (!stripe || !elements) { setIsProcessing(false); return; }
    try {
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: { return_url: window.location.href },
        redirect: "if_required",
      });

      if (error) {
        toast({ title: "Setup Failed", description: error.message, variant: "destructive" });
        setIsProcessing(false);
        return;
      }

      if (setupIntent) {
        const enrollmentId = enrollment?.enrollment?.id ?? enrollment?.id;
        const res = await apiRequest("POST", "/api/activate-subscription", {
          enrollmentId,
          setupIntentId: setupIntent.id,
        });
        if (res.ok) {
          toast({ title: "Monthly plan activated!", description: "Your first payment of $121 will be charged shortly." });
          onSuccess();
        } else {
          const data = await res.json();
          toast({ title: "Activation Failed", description: data.message, variant: "destructive" });
        }
      }
    } catch {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-2">
        <Lock className="w-5 h-5 text-blue-500 flex-shrink-0" />
        <span className="text-sm text-blue-700">Card saved securely — charged monthly by Stripe</span>
      </div>

      <PaymentElement />

      <div className="bg-amber-50 rounded-lg p-4 space-y-2 text-sm">
        <h4 className="font-semibold text-gray-900">Monthly instalment plan</h4>
        <div className="flex justify-between"><span>Instalment 1 (today)</span><span>$121.00 AUD</span></div>
        <div className="flex justify-between text-gray-500"><span>Instalment 2 (1 month)</span><span>$121.00 AUD</span></div>
        <div className="flex justify-between text-gray-500"><span>Instalment 3 (2 months)</span><span>$121.00 AUD</span></div>
        <div className="border-t pt-2 flex justify-between font-semibold">
          <span>Total over term</span><span>$363.00 AUD (inc. GST)</span>
        </div>
        <p className="text-xs text-gray-400 pt-1">Subscription auto-cancels after 3 payments. No lock-in.</p>
      </div>

      <Button type="submit" disabled={!stripe || isProcessing} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3">
        {isProcessing ? (
          <span className="flex items-center gap-2"><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Activating...</span>
        ) : (
          <span className="flex items-center justify-center gap-2"><CalendarDays className="w-4 h-4" />Start monthly plan — $121/month</span>
        )}
      </Button>
      <p className="text-center text-xs text-gray-400">By activating this plan, you agree to Power2ADAPT's terms and conditions</p>
    </form>
  );
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const getDayName = (d: number) => DAY_NAMES[d] ?? "";

// ── Summary card — defined outside Checkout to keep a stable component type ──
const SummaryCard = ({ isBatch, batchEnrollments, batchTotal, enrollment }: {
  isBatch: boolean; batchEnrollments: any[]; batchTotal: number; enrollment: any;
}) => {
  if (isBatch) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-500" />
            Family Enrolment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {batchEnrollments.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              {batchEnrollments.map((row: any, i: number) => (
                <div key={i} className={i > 0 ? "border-t pt-4" : ""}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-heading font-bold text-gray-900">
                      {row.child?.firstName} {row.child?.lastName}
                    </span>
                    <Badge className="bg-green-100 text-green-800 text-xs">Enrolled</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{row.class?.name}</p>
                  <div className="space-y-1 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Schedule</span>
                      <span>{row.class && `${getDayName(row.class.dayOfWeek)}s ${row.class.startTime}–${row.class.endTime}`}</span>
                    </div>
                    <div className="flex justify-between"><span>Venue</span><span>{row.venue?.name}</span></div>
                  </div>
                </div>
              ))}
              <div className="border-t pt-3 flex justify-between font-semibold">
                <span>Total (ex. GST)</span>
                <span className="text-primary-600">${batchTotal.toFixed(0)}</span>
              </div>
              <p className="text-xs text-gray-400">GST of ${(batchTotal * 0.1).toFixed(2)} included at checkout</p>
            </>
          )}
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          Enrolment Confirmed
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-heading font-bold text-lg text-gray-900">{enrollment?.class?.name}</h3>
          <Badge className="mt-1 bg-green-100 text-green-800">Enrolled</Badge>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Student</span><span className="font-medium">{enrollment?.child?.firstName} {enrollment?.child?.lastName}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Schedule</span><span className="font-medium">{enrollment?.class && `${getDayName(enrollment.class.dayOfWeek)}s ${enrollment.class.startTime}–${enrollment.class.endTime}`}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Venue</span><span className="font-medium">{enrollment?.venue?.name}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Coach</span><span className="font-medium">{enrollment?.coach?.firstName} {enrollment?.coach?.lastName}</span></div>
        </div>
        {enrollment?.class?.description && (
          <p className="text-sm text-gray-500 border-t pt-3">{enrollment.class.description}</p>
        )}
      </CardContent>
    </Card>
  );
};

// ── Main checkout page ────────────────────────────────────────────────────────
export default function Checkout() {
  const { enrollmentId } = useParams();
  const { toast } = useToast();

  // Detect batch mode (?ids=id1,id2) — use regex to avoid URLSearchParams constructor issues in iframe
  const batchIds = useMemo(() => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    const match = search.match(/[?&]ids=([^&]*)/);
    return match ? match[1].split(",").filter(Boolean) : [];
  }, []);
  const isBatch = batchIds.length > 1;

  const [paymentMode, setPaymentMode] = useState<"choose" | "term" | "monthly">("choose");
  const [clientSecret, setClientSecret] = useState("");
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [batchEnrollments, setBatchEnrollments] = useState<any[]>([]);
  const [batchTotal, setBatchTotal] = useState(0);
  // Resolve stripe promise to actual instance — avoids "Illegal constructor" from Elements
  // receiving a pending Promise that gets interrupted by a re-render
  const [stripeInstance, setStripeInstance] = useState<any>(null);
  const [stripeLoading, setStripeLoading] = useState(!!stripePromise);
  useEffect(() => {
    if (!stripePromise) { setStripeLoading(false); return; }
    stripePromise.then(s => { if (s) setStripeInstance(s); setStripeLoading(false); }).catch(() => setStripeLoading(false));
  }, []);

  // ── Single enrollment fetch ──
  const { data: enrollment, isLoading } = useQuery({
    queryKey: ["/api/enrollments", enrollmentId],
    queryFn: async () => {
      const res = await fetch(`/api/enrollments/${enrollmentId}`);
      if (!res.ok) throw new Error("Failed to fetch enrollment");
      return res.json();
    },
    enabled: !!enrollmentId && !isBatch,
  });

  const sportType = enrollment?.class?.sportType;
  const isMonthlyEligible = !isBatch && MONTHLY_ELIGIBLE.includes(sportType);

  // Auto-select term mode for non-eligible / batch
  useEffect(() => {
    if (isBatch) { setPaymentMode("term"); return; }
    if (!enrollment) return;
    if (!isMonthlyEligible) setPaymentMode("term");
  }, [enrollment, isMonthlyEligible, isBatch]);

  // Single: fetch PaymentIntent
  useEffect(() => {
    if (isBatch || paymentMode !== "term" || !enrollmentId || !enrollment || clientSecret) return;
    apiRequest("POST", "/api/create-payment-intent", { enrollmentId })
      .then(r => r.json())
      .then(d => setClientSecret(d.clientSecret))
      .catch(() => toast({ title: "Payment Error", description: "Failed to initialise payment.", variant: "destructive" }));
  }, [isBatch, paymentMode, enrollmentId, enrollment, clientSecret, toast]);

  // Single: fetch subscription
  useEffect(() => {
    if (isBatch || paymentMode !== "monthly" || !enrollmentId || !enrollment || subscriptionData) return;
    apiRequest("POST", "/api/create-subscription", { enrollmentId })
      .then(r => r.json())
      .then(d => { setSubscriptionData(d); setClientSecret(d.clientSecret); })
      .catch(() => toast({ title: "Error", description: "Failed to initialise monthly plan.", variant: "destructive" }));
  }, [isBatch, paymentMode, enrollmentId, enrollment, subscriptionData, toast]);

  // Batch: fetch combined PaymentIntent
  useEffect(() => {
    if (!isBatch || clientSecret) return;
    apiRequest("POST", "/api/create-batch-payment-intent", { enrollmentIds: batchIds })
      .then(r => r.json())
      .then(d => {
        setClientSecret(d.clientSecret);
        setBatchEnrollments(d.enrollments ?? []);
        setBatchTotal(d.totalCents / 100);
      })
      .catch(() => toast({ title: "Payment Error", description: "Failed to initialise payment.", variant: "destructive" }));
  }, [isBatch, clientSecret]);

  const price = isBatch ? batchTotal : parseFloat(enrollment?.class?.pricePerTerm || "0");
  const confirmationId = isBatch ? batchIds[0] : (enrollmentId ?? "");
  const stripeReady = !!stripeInstance;

  if (isLoading && !isBatch) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    </div>
  );

  if (confirmed) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-heading font-bold text-gray-900 mb-2">You're enrolled!</h1>
        <p className="text-gray-500 mb-6">Monthly instalments will be charged automatically. You'll receive an SMS confirmation.</p>
        <Button onClick={() => window.location.href = "/classes"} className="bg-primary-500 hover:bg-primary-600 text-white">Back to classes</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">Complete Your Enrolment</h1>
          <p className="text-gray-600">{isBatch ? `Paying for ${batchIds.length} athletes in one transaction` : "Secure your spot in this program"}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <SummaryCard isBatch={isBatch} batchEnrollments={batchEnrollments} batchTotal={batchTotal} enrollment={enrollment} />

          {/* Right: Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stripeLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full" />
                </div>
              ) : !stripeReady ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                  <h3 className="font-heading font-bold text-yellow-800 mb-2">Payment Configuration Required</h3>
                  <p className="text-yellow-700 text-sm">Please contact support to complete your enrolment payment.</p>
                </div>
              ) : (
                <>
                  {/* Payment mode picker — only for single eligible programs */}
                  {!isBatch && isMonthlyEligible && paymentMode === "choose" && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500 mb-4">How would you like to pay for the term?</p>
                      <button onClick={() => setPaymentMode("term")} className="w-full text-left border-2 border-gray-200 hover:border-primary-400 rounded-xl p-4 transition-all group">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Zap className="w-5 h-5 text-primary-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 group-hover:text-primary-700">Pay full term upfront</p>
                            <p className="text-sm text-gray-500 mt-0.5">${(price * 1.1).toFixed(2)} AUD charged today (inc. GST)</p>
                          </div>
                        </div>
                      </button>
                      <button onClick={() => setPaymentMode("monthly")} className="w-full text-left border-2 border-amber-200 hover:border-amber-400 rounded-xl p-4 transition-all group">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CalendarDays className="w-5 h-5 text-amber-500" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900 group-hover:text-amber-700">Monthly direct debit</p>
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Flexible</span>
                            </div>
                            <p className="text-sm text-gray-500 mt-0.5">3 × $121.00 AUD/month (inc. GST) · auto-cancels after 3 payments</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Term payment form */}
                  {paymentMode === "term" && clientSecret && stripeInstance && (
                    <>
                      {!isBatch && isMonthlyEligible && (
                        <button onClick={() => { setPaymentMode("choose"); setClientSecret(""); }} className="text-xs text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1">← Change payment option</button>
                      )}
                      <Elements stripe={stripeInstance} options={{ clientSecret }}>
                        <TermPaymentForm
                          enrollment={isBatch ? (batchEnrollments[0] ?? {}) : enrollment}
                          confirmationId={confirmationId}
                          totalAmount={isBatch ? batchTotal : undefined}
                        />
                      </Elements>
                    </>
                  )}

                  {/* Monthly payment form */}
                  {!isBatch && paymentMode === "monthly" && clientSecret && stripeInstance && (
                    <>
                      <button onClick={() => { setPaymentMode("choose"); setClientSecret(""); setSubscriptionData(null); }} className="text-xs text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1">← Change payment option</button>
                      <Elements stripe={stripeInstance} options={{ clientSecret }}>
                        <MonthlyPaymentForm enrollment={enrollment} onSuccess={() => setConfirmed(true)} />
                      </Elements>
                    </>
                  )}

                  {/* Loading while fetching secret */}
                  {paymentMode !== "choose" && !clientSecret && (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full" />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
