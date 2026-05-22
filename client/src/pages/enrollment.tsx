import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navbar from "@/components/layout/navbar";
import ChildForm from "@/components/classes/child-form";
import { Button } from "@/components/ui/button";

type Step = 'child' | 'new-child' | 'summary';

export default function Enrollment() {
  const { classId } = useParams<{ classId: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>('child');
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [newChildId, setNewChildId] = useState<string | null>(null);

  const activeChildId = selectedChildId ?? newChildId;

  const { data: classDetails, isLoading: classLoading } = useQuery({
    queryKey: ["/api/classes", classId],
    queryFn: async () => {
      const res = await fetch(`/api/classes/${classId}`);
      if (!res.ok) throw new Error('Failed to fetch class');
      return res.json();
    },
    enabled: !!classId,
  });

  const { data: children = [] } = useQuery<any[]>({
    queryKey: ["/api/children"],
  });

  const { data: siblingDiscount } = useQuery({
    queryKey: ["/api/classes/sibling-discount", classDetails?.class?.term, classDetails?.class?.year],
    queryFn: () =>
      fetch(`/api/classes/sibling-discount?term=${classDetails.class.term}&year=${classDetails.class.year}`)
        .then(r => r.json()),
    enabled: !!classDetails?.class?.term,
  });

  const cls = classDetails?.class;
  const venue = classDetails?.venue;
  const spotsLeft = cls ? Math.max(0, cls.maxCapacity - (cls.currentEnrollment ?? 0)) : 0;
  const isWaitlist = spotsLeft === 0;
  const pricePerTerm = parseFloat(cls?.pricePerTerm ?? '0');
  const discountedPrice = siblingDiscount?.eligible ? Math.round(pricePerTerm * 0.8) : null;

  const selectedChild = children.find((c: any) => c.id === activeChildId);
  const childName = selectedChild
    ? `${selectedChild.firstName} ${selectedChild.lastName}`
    : null;

  const getDayName = (dow: number) => {
    return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dow];
  };

  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!activeChildId) throw new Error('No child selected');
      const res = await apiRequest("POST", "/api/enrollments", {
        classId,
        childId: activeChildId,
        autoRenew: true,
      });
      return res.json();
    },
    onSuccess: (enrollment) => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      if (enrollment.status === 'pending_payment') {
        setLocation(`/checkout/${enrollment.id}`);
      } else {
        toast({ title: "Added to waitlist", description: `${childName} is on the waitlist for ${cls?.name}.` });
        setLocation('/classes');
      }
    },
    onError: (error: any) => {
      toast({ title: "Enrolment failed", description: error.message, variant: "destructive" });
    },
  });

  // Step indicator
  const StepIndicator = () => (
    <div className="flex items-center gap-2 mb-8">
      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${step === 'child' || step === 'new-child' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>1</div>
      <div className="flex-1 h-0.5 bg-gray-200">
        <div className={`h-full bg-blue-600 transition-all ${step === 'summary' ? 'w-full' : 'w-0'}`} />
      </div>
      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${step === 'summary' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>2</div>
    </div>
  );

  if (classLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!cls) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-12 text-center text-gray-500">Class not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-8">
        <StepIndicator />

        {/* Step 1: Child selection */}
        {(step === 'child') && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Who are you enrolling?</h2>
            <p className="text-sm text-gray-500 mb-6">
              {isWaitlist ? 'Select the child to add to the waitlist.' : 'Select a child or add a new one.'}
            </p>

            {(children as any[]).map((child: any) => (
              <button
                key={child.id}
                onClick={() => { setSelectedChildId(child.id); setStep('summary'); }}
                className="w-full flex items-center gap-3 p-4 mb-3 border-2 border-gray-200 rounded-xl hover:border-blue-600 text-left transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                  {child.firstName[0]}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{child.firstName} {child.lastName}</div>
                  <div className="text-sm text-gray-500">
                    Age {new Date().getFullYear() - new Date(child.dateOfBirth).getFullYear()}
                  </div>
                </div>
              </button>
            ))}

            <button
              onClick={() => setStep('new-child')}
              className="w-full flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 text-gray-500 hover:text-blue-600 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-2xl">+</div>
              <span className="font-medium">Add a new child</span>
            </button>

            {isWaitlist && (
              <p className="text-xs text-gray-400 mt-4 text-center">
                No payment required now. You'll only be charged if a spot opens and you confirm.
              </p>
            )}
          </div>
        )}

        {/* Step 1b: New child form */}
        {step === 'new-child' && (
          <div>
            <button
              onClick={() => setStep('child')}
              className="text-sm text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1"
            >
              Back
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Add a new child</h2>
            <ChildForm
              onCreated={(childId) => {
                setNewChildId(childId);
                queryClient.invalidateQueries({ queryKey: ["/api/children"] });
                setStep('summary');
              }}
            />
          </div>
        )}

        {/* Step 2: Booking summary */}
        {step === 'summary' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Here's what you're booking</h2>

            <div className="bg-gray-50 rounded-2xl p-5 mb-6 flex flex-col gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Child</span>
                <span className="font-medium text-gray-900">{childName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Class</span>
                <span className="font-medium text-gray-900">{cls.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">When</span>
                <span className="font-medium text-gray-900">{getDayName(cls.dayOfWeek)}s, {cls.startTime}--{cls.endTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Venue</span>
                <span className="font-medium text-gray-900">{venue?.name ?? '--'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Term</span>
                <span className="font-medium text-gray-900">{cls.term?.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}, {cls.year} (10 weeks)</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="text-gray-500">Price</span>
                <div className="text-right">
                  {discountedPrice ? (
                    <>
                      <span className="line-through text-gray-400 mr-2">${pricePerTerm.toLocaleString('en-AU')}</span>
                      <span className="font-bold text-green-700">${discountedPrice.toLocaleString('en-AU')} AUD</span>
                      <div className="text-xs text-green-600">20% sibling discount applied</div>
                    </>
                  ) : (
                    <span className="font-bold text-gray-900">${pricePerTerm.toLocaleString('en-AU')} AUD</span>
                  )}
                </div>
              </div>
            </div>

            <Button
              onClick={() => enrollMutation.mutate()}
              disabled={enrollMutation.isPending}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 active:scale-95 transition-all mb-3 h-auto"
            >
              {enrollMutation.isPending ? 'Processing...' : isWaitlist ? 'Join waitlist' : 'Confirm and pay'}
            </Button>
            <button
              onClick={() => setStep('child')}
              className="w-full text-gray-500 py-3 text-sm hover:text-gray-700"
            >
              Change child
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
