import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { AlertCircle, Plus, User } from "lucide-react";
import { useLocation } from "wouter";

const enrollmentSchema = z.object({
  childId: z.string().optional(),
  autoRenew: z.boolean().default(true),
  notes: z.string().optional(),
  // New child fields (if creating new child)
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  grade: z.string().optional(),
  medicalInfo: z.string().optional(),
  emergencyContact: z.string().optional(),
});

type EnrollmentForm = z.infer<typeof enrollmentSchema>;

interface EnrollmentFormProps {
  classId: string;
  classDetails: any;
  canEnroll: boolean;
  isWaitlist: boolean;
}

export default function EnrollmentForm({ classId, classDetails, canEnroll, isWaitlist }: EnrollmentFormProps) {
  const [isCreatingNewChild, setIsCreatingNewChild] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: children } = useQuery({
    queryKey: ["/api/children"],
  });

  const form = useForm<EnrollmentForm>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      autoRenew: true,
      notes: "",
    },
  });

  const enrollmentMutation = useMutation({
    mutationFn: async (data: EnrollmentForm) => {
      const enrollmentData: any = {
        classId,
        autoRenew: data.autoRenew,
        notes: data.notes,
      };

      if (isCreatingNewChild) {
        enrollmentData.childInfo = {
          firstName: data.firstName!,
          lastName: data.lastName!,
          dateOfBirth: data.dateOfBirth!,
          grade: data.grade,
          medicalInfo: data.medicalInfo,
          emergencyContact: data.emergencyContact,
        };
      } else {
        enrollmentData.childId = data.childId;
      }

      const response = await apiRequest("POST", "/api/enrollments", enrollmentData);
      return response.json();
    },
    onSuccess: (enrollment) => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      toast({
        title: "Great news! Enrollment confirmed!",
        description: isWaitlist 
          ? "Your child is on the waitlist. We'll contact you as soon as a spot opens up."
          : "Your child's spot is secured! Payment details will be sent to you shortly.",
      });
      
      // Redirect to payment if not waitlisted
      if (!isWaitlist && enrollment.status === "pending_payment") {
        setLocation(`/checkout/${enrollment.id}`);
      } else {
        setLocation("/");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Enrollment Failed",
        description: error.message || "Failed to enroll in class",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EnrollmentForm) => {
    if (!isCreatingNewChild && !data.childId) {
      toast({
        title: "Almost there!",
        description: "Please select which child is enrolling or add their details",
        variant: "destructive",
      });
      return;
    }

    if (isCreatingNewChild) {
      if (!data.firstName || !data.lastName || !data.dateOfBirth) {
        toast({
          title: "Just a few more details needed",
          description: "Please complete your child's name and date of birth",
          variant: "destructive",
        });
        return;
      }
    }

    enrollmentMutation.mutate(data);
  };

  if (!canEnroll) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center text-red-700">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>This class is currently not available for enrollment.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Enrollment Type Notice */}
      {isWaitlist && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center text-yellow-700">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>This class is full. You'll be added to the waitlist and notified when a spot becomes available.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Child Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Which child is enrolling?</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsCreatingNewChild(!isCreatingNewChild)}
            className="flex items-center"
          >
            {isCreatingNewChild ? (
              <>
                <User className="w-4 h-4 mr-2" />
                Select Existing Child
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add New Child
              </>
            )}
          </Button>
        </div>

        {isCreatingNewChild ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tell us about your child</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    {...form.register("firstName")}
                    placeholder="Child's first name"
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.firstName.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    {...form.register("lastName")}
                    placeholder="Child's last name"
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...form.register("dateOfBirth")}
                  />
                  {form.formState.errors.dateOfBirth && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.dateOfBirth.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="grade">Grade/Year Level</Label>
                  <Input
                    id="grade"
                    {...form.register("grade")}
                    placeholder="e.g., Grade 6"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="emergencyContact">Emergency Contact</Label>
                <Input
                  id="emergencyContact"
                  {...form.register("emergencyContact")}
                  placeholder="Emergency contact phone number"
                />
              </div>

              <div>
                <Label htmlFor="medicalInfo">Medical Information</Label>
                <Textarea
                  id="medicalInfo"
                  {...form.register("medicalInfo")}
                  placeholder="Any allergies, medical conditions, or special requirements"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <div>
            <Select onValueChange={(value) => form.setValue("childId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a child" />
              </SelectTrigger>
              <SelectContent>
                {children?.map((child: any) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.firstName} {child.lastName} 
                    {child.grade && ` (${child.grade})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {children?.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                No children found. Please add a new child to continue.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Enrollment Options */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="autoRenew"
            checked={form.watch("autoRenew")}
            onCheckedChange={(checked) => form.setValue("autoRenew", !!checked)}
          />
          <Label htmlFor="autoRenew" className="text-sm">
            Keep my child enrolled for future terms (we'll send friendly reminders 1 month ahead)
          </Label>
        </div>

        <div>
          <Label htmlFor="notes">Notes for the Coach</Label>
          <Textarea
            id="notes"
            {...form.register("notes")}
            placeholder="Anything special we should know about your child? (Optional)"
            rows={3}
          />
        </div>
      </div>

      {/* Terms and Conditions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm text-blue-700">
            <h4 className="font-semibold">What you need to know:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Complete payment within 7 days to secure your child's spot</li>
              <li>Full refund available until 48 hours before first class</li>
              <li>Missed classes due to illness can be made up (medical certificate required)</li>
              <li>Change auto-renewal settings anytime from your dashboard</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={enrollmentMutation.isPending}
        className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3"
      >
        {enrollmentMutation.isPending ? (
          <div className="flex items-center">
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
            Processing...
          </div>
        ) : isWaitlist ? (
          "Join the Waitlist"
        ) : (
          "Secure My Child's Spot"
        )}
      </Button>
    </form>
  );
}
