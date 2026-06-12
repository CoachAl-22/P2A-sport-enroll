import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { AlertCircle, Plus, ChevronRight, Check, Search, Calendar, MapPin, UserPlus } from "lucide-react";
import { useLocation } from "wouter";
import LoginModal from "@/components/auth/login-modal";

const newChildSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  grade: z.string().optional(),
  medicalInfo: z.string().optional(),
  emergencyContact: z.string().optional(),
});

type NewChildForm = z.infer<typeof newChildSchema>;

interface EnrollmentFormProps {
  classId: string;
  classDetails: any;
  canEnroll: boolean;
  isWaitlist: boolean;
}

const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function EnrollmentForm({ classId, classDetails, canEnroll, isWaitlist }: EnrollmentFormProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [nameSearch, setNameSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [lookupResults, setLookupResults] = useState<any[]>([]);
  const [selectedChildIds, setSelectedChildIds] = useState<Set<string>>(new Set());
  const [isAddingNewChild, setIsAddingNewChild] = useState(false);
  const [autoRenew, setAutoRenew] = useState(true);
  const [notes, setNotes] = useState("");
  const [policyAgreed, setPolicyAgreed] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginContext, setLoginContext] = useState("");

  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Existing children if logged in
  const { data: myChildren = [] } = useQuery<any[]>({
    queryKey: ["/api/children"],
    enabled: isAuthenticated,
  });
  const myChildrenRef = useRef<any[]>([]);
  useEffect(() => { myChildrenRef.current = myChildren; }, [myChildren]);

  // Debounce the search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(nameSearch), 350);
    return () => clearTimeout(t);
  }, [nameSearch]);

  // Lookup athletes by name
  useEffect(() => {
    if (debouncedSearch.length < 2) { setLookupResults([]); return; }
    fetch(`/api/children/lookup?name=${encodeURIComponent(debouncedSearch)}`)
      .then((r) => r.json())
      .then((data) => {
        const myIds = new Set(myChildrenRef.current.map((c: any) => c.id));
        setLookupResults(data.filter((c: any) => !myIds.has(c.id)));
      })
      .catch(() => setLookupResults([]));
  }, [debouncedSearch]);

  const newChildForm = useForm<NewChildForm>({
    resolver: zodResolver(newChildSchema),
    defaultValues: { firstName: "", lastName: "", dateOfBirth: "", grade: "", medicalInfo: "", emergencyContact: "" },
  });

  const enrollmentMutation = useMutation({
    mutationFn: async () => {
      if (isAddingNewChild) {
        const v = newChildForm.getValues();
        const payload = { classId, autoRenew, notes, childInfo: { firstName: v.firstName, lastName: v.lastName, dateOfBirth: v.dateOfBirth, grade: v.grade, medicalInfo: v.medicalInfo, emergencyContact: v.emergencyContact } };
        const response = await apiRequest("POST", "/api/enrollments", payload);
        return [await response.json()];
      }
      // Submit one enrollment per selected child
      const results = await Promise.all(
        Array.from(selectedChildIds).map(async (childId) => {
          const response = await apiRequest("POST", "/api/enrollments", { classId, autoRenew, notes, childId });
          return response.json();
        })
      );
      return results;
    },
    onSuccess: (enrollments: any[]) => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      const first = enrollments[0];
      const count = enrollments.length;
      if (isWaitlist) {
        toast({ title: "Added to waitlist!", description: "We'll SMS you when a spot opens." });
        setLocation("/classes");
        return;
      }
      if (first?.status === "pending_payment") {
        const pendingIds = enrollments.filter((e: any) => e.status === "pending_payment").map((e: any) => e.id);
        if (pendingIds.length > 1) {
          // Multiple children — one combined checkout
          setLocation(`/checkout?ids=${pendingIds.join(",")}`);
        } else {
          setLocation(`/checkout/${first.id}`);
        }
      } else {
        toast({ title: "Spot secured!", description: "Confirmation SMS sent to your mobile." });
        setLocation("/classes");
      }
    },
    onError: (error: any) => {
      toast({ title: "Enrollment failed", description: error.message || "Something went wrong. Please try again.", variant: "destructive" });
    },
  });

  const toggleChildSelection = (child: any) => {
    if (!isAuthenticated) {
      setLoginContext(`Log in to confirm you're ${child.firstName}'s parent or guardian`);
      setShowLoginModal(true);
      return;
    }
    setIsAddingNewChild(false);
    setSelectedChildIds((prev) => {
      const next = new Set(prev);
      if (next.has(child.id)) next.delete(child.id);
      else next.add(child.id);
      return next;
    });
  };

  const handleAddNew = () => {
    setSelectedChildIds(new Set());
    setIsAddingNewChild(true);
    setNameSearch("");
    setLookupResults([]);
    if (!isAuthenticated) {
      setLoginContext("Create an account or log in to complete enrolment");
      setShowLoginModal(true);
    }
  };

  const handleStep1Next = async () => {
    if (!isAuthenticated) {
      setLoginContext("Log in or create an account to continue");
      setShowLoginModal(true);
      return;
    }
    if (isAddingNewChild) {
      const valid = await newChildForm.trigger();
      if (!valid) return;
    } else if (selectedChildIds.size === 0) {
      toast({ title: "Select an athlete", description: "Tick one or more of your children, or add a new one.", variant: "destructive" });
      return;
    }
    setStep(2);
  };

  const handleConfirm = () => {
    if (!policyAgreed) {
      toast({ title: "Please accept the policies", description: "Tick the box to continue.", variant: "destructive" });
      return;
    }
    enrollmentMutation.mutate();
  };

  if (!canEnroll) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center text-red-700">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>This class is currently not available for enrolment.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const cls = classDetails?.class;
  const selectedChildren = isAuthenticated ? myChildren.filter((c: any) => selectedChildIds.has(c.id)) : [];

  return (
    <div className="space-y-6">
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

      {/* Step indicator */}
      <div className="flex items-center gap-3">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${step >= 1 ? "bg-primary-500 text-white" : "bg-gray-200 text-gray-500"}`}>
          {step > 1 ? <Check className="w-4 h-4" /> : "1"}
        </div>
        <span className={`text-sm font-medium ${step === 1 ? "text-gray-900" : "text-gray-400"}`}>Choose athlete</span>
        <ChevronRight className="w-4 h-4 text-gray-300" />
        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${step >= 2 ? "bg-primary-500 text-white" : "bg-gray-200 text-gray-500"}`}>
          2
        </div>
        <span className={`text-sm font-medium ${step === 2 ? "text-gray-900" : "text-gray-400"}`}>Review & confirm</span>
      </div>

      {isWaitlist && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center text-amber-700 text-sm">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
              <span>This class is full — you'll be added to the waitlist and SMS'd when a spot opens.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 1: Find & select athlete ── */}
      {step === 1 && !isAddingNewChild && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Who is enrolling?</h3>

            {/* My existing children (when logged in) */}
            {isAuthenticated && myChildren.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                  Your athletes {myChildren.length > 1 && <span className="normal-case text-gray-400 font-normal">— tick all who are enrolling</span>}
                </p>
                <div className="grid gap-2">
                  {myChildren.map((child: any) => {
                    const checked = selectedChildIds.has(child.id);
                    return (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => toggleChildSelection(child)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-colors ${checked ? "border-primary-500 bg-primary-50" : "border-gray-200 hover:border-primary-300"}`}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${checked ? "bg-primary-500 border-primary-500" : "border-gray-300"}`}>
                          {checked && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold shrink-0">
                          {child.firstName[0]}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-sm">{child.firstName} {child.lastName}</p>
                          {child.grade && <p className="text-xs text-gray-500">{child.grade}</p>}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {selectedChildIds.size > 1 && (
                  <p className="mt-2 text-xs text-primary-600 font-medium">
                    ✓ {selectedChildIds.size} athletes selected — one enrolment will be created per child
                  </p>
                )}
              </div>
            )}

            {/* Name search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
                placeholder="Search athlete by name…"
                className="pl-9"
              />
            </div>

            {/* Lookup results */}
            {lookupResults.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <p className="text-xs text-gray-500 px-3 pt-2 pb-1">Found in our system</p>
                {lookupResults.map((child: any) => (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => toggleChildSelection(child)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-primary-50 border-t border-gray-100 transition-colors ${selectedChildIds.has(child.id) ? "bg-primary-50" : ""}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                      {child.firstName[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{child.firstName} {child.lastName}</p>
                      <p className="text-xs text-gray-400">Age {child.age} · existing athlete</p>
                    </div>
                    {!isAuthenticated && <span className="text-xs text-primary-500 font-medium">Log in to select →</span>}
                    {isAuthenticated && selectedChildIds.has(child.id) && <Check className="w-4 h-4 text-primary-500" />}
                  </button>
                ))}
              </div>
            )}

            {/* No results found / add new */}
            {debouncedSearch.length >= 2 && lookupResults.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">No matching athlete found for "{debouncedSearch}"</p>
            )}

            {/* Add new athlete button */}
            <button
              type="button"
              onClick={handleAddNew}
              className="mt-3 w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-gray-300 hover:border-primary-400 text-left transition-colors text-gray-600 hover:text-primary-600"
            >
              <UserPlus className="w-5 h-5" />
              <span className="text-sm font-medium">My child isn't listed — add them now</span>
            </button>
          </div>

          <Button onClick={handleStep1Next} className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3">
            Next: Review your booking →
          </Button>
        </div>
      )}

      {/* ── Step 1: New child form ── */}
      {step === 1 && isAddingNewChild && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Add athlete details</h3>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddingNewChild(false)} className="text-gray-500 text-xs">
              ← Search instead
            </Button>
          </div>
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>First name *</Label>
                  <Input {...newChildForm.register("firstName")} placeholder="First name" />
                  {newChildForm.formState.errors.firstName && <p className="text-red-500 text-xs mt-1">{newChildForm.formState.errors.firstName.message}</p>}
                </div>
                <div>
                  <Label>Last name *</Label>
                  <Input {...newChildForm.register("lastName")} placeholder="Last name" />
                  {newChildForm.formState.errors.lastName && <p className="text-red-500 text-xs mt-1">{newChildForm.formState.errors.lastName.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Date of birth *</Label>
                  <Input type="date" {...newChildForm.register("dateOfBirth")} />
                  {newChildForm.formState.errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{newChildForm.formState.errors.dateOfBirth.message}</p>}
                </div>
                <div>
                  <Label>Grade / Year level</Label>
                  <Input {...newChildForm.register("grade")} placeholder="e.g. Grade 5" />
                </div>
              </div>
              <div>
                <Label>Emergency contact phone</Label>
                <Input {...newChildForm.register("emergencyContact")} placeholder="04XX XXX XXX" />
              </div>
              <div>
                <Label>Medical info</Label>
                <Textarea {...newChildForm.register("medicalInfo")} placeholder="Allergies, conditions, or anything coaches should know" rows={2} />
              </div>
            </CardContent>
          </Card>
          <Button onClick={handleStep1Next} className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3">
            Next: Review your booking →
          </Button>
        </div>
      )}

      {/* ── Step 2: Review & confirm ── */}
      {step === 2 && (
        <div className="space-y-5">
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                Booking summary
                <Badge variant="outline" className="ml-auto text-xs">{isWaitlist ? "Waitlist" : "Enrolment"}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between items-start">
                <span className="text-gray-500 shrink-0">
                  {isAddingNewChild || selectedChildren.length <= 1 ? "Athlete" : `Athletes (${selectedChildren.length})`}
                </span>
                <span className="font-medium text-right">
                  {isAddingNewChild
                    ? `${newChildForm.getValues("firstName")} ${newChildForm.getValues("lastName")}`
                    : selectedChildren.length > 0
                      ? selectedChildren.map((c: any) => `${c.firstName} ${c.lastName}`).join(", ")
                      : "—"}
                </span>
              </div>
              {cls && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Program</span>
                    <span className="font-medium">{cls.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{DAY_NAMES[cls.dayOfWeek]}s, {cls.startTime} – {cls.endTime}</span>
                  </div>
                  {classDetails?.venue && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{classDetails.venue.name}</span>
                    </div>
                  )}
                  <div className="border-t pt-3">
                    {cls.pricePerSession && cls.sessionCount ? (
                      <p className="text-xs text-gray-500 mb-1 text-right">
                        ${parseFloat(cls.pricePerSession).toFixed(0)}/session × {cls.sessionCount} sessions
                      </p>
                    ) : null}
                    <div className="flex justify-between font-semibold text-base">
                      <span>Term fee</span>
                      <span className="text-primary-600">${parseFloat(cls.pricePerTerm).toFixed(0)} + GST</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox id="autoRenew" checked={autoRenew} onCheckedChange={(v) => setAutoRenew(!!v)} className="mt-0.5" />
              <Label htmlFor="autoRenew" className="text-sm leading-snug cursor-pointer">
                Re-enrol automatically each term — I'll get a reminder 4 weeks before and can cancel anytime
              </Label>
            </div>
            <div>
              <Label className="text-sm">Notes for the coach <span className="text-gray-400 font-normal">(optional)</span></Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything special we should know about this athlete?" rows={2} className="mt-1" />
            </div>
            <div className="flex items-start gap-3">
              <Checkbox id="policy" checked={policyAgreed} onCheckedChange={(v) => setPolicyAgreed(!!v)} className="mt-0.5" />
              <Label htmlFor="policy" className="text-sm leading-snug cursor-pointer">
                I understand: payment is due within 7 days to hold the spot, full refunds are available until 48 hours before the first session, and makeups are available with a medical certificate.
              </Label>
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">← Back</Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={enrollmentMutation.isPending}
              className="flex-1 bg-primary-500 hover:bg-primary-600 text-white"
            >
              {enrollmentMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Saving...
                </span>
              ) : isWaitlist ? "Join waitlist" : "Confirm & pay →"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
