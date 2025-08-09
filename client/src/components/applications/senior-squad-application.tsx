import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Calendar, MapPin, Users, Award, Target, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const seniorSquadApplicationSchema = z.object({
  // Athlete Information
  athleteFirstName: z.string().min(1, "First name is required"),
  athleteLastName: z.string().min(1, "Last name is required"),
  athleteEmail: z.string().email("Valid email is required"),
  athletePhone: z.string().min(1, "Phone number is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  schoolYear: z.string().min(1, "School year is required"),
  
  // Contact Information (if different from athlete)
  parentGuardianName: z.string().optional(),
  parentGuardianEmail: z.string().email().optional().or(z.literal("")),
  parentGuardianPhone: z.string().optional(),
  
  // Athletic Background
  currentSports: z.string().min(1, "Please list current sports"),
  athleticExperience: z.string().min(1, "Please describe athletic experience"),
  previousClubs: z.string().optional(),
  personalBests: z.string().optional(),
  
  // Goals and Commitment
  athleticGoals: z.string().min(1, "Please describe your athletic goals"),
  trainingCommitment: z.string().min(1, "Please describe your training commitment"),
  reasonForJoining: z.string().min(1, "Please explain why you want to join Senior Squad"),
  
  // Availability
  availableDays: z.string().min(1, "Please specify your availability"),
  additionalNotes: z.string().optional(),
});

type SeniorSquadApplicationForm = z.infer<typeof seniorSquadApplicationSchema>;

interface SeniorSquadApplicationProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SeniorSquadApplication({ isOpen, onClose }: SeniorSquadApplicationProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<SeniorSquadApplicationForm>({
    resolver: zodResolver(seniorSquadApplicationSchema),
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
      athleticExperience: "",
      previousClubs: "",
      personalBests: "",
      athleticGoals: "",
      trainingCommitment: "",
      reasonForJoining: "",
      availableDays: "",
      additionalNotes: "",
    },
  });

  const handleSubmit = async (data: SeniorSquadApplicationForm) => {
    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/applications/senior-squad", data);
      toast({
        title: "Application Submitted!",
        description: "We'll review your application and get back to you within 48 hours.",
      });
      form.reset();
      onClose();
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-heading font-bold text-gray-900">
              Senior Squad Application
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-6">
          {/* Program Overview */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary-500" />
                Elite Senior Squad Program
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="text-sm">Monday, Tuesday, Thursday 5:30pm</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-sm">Ballam Park Athletic Track</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span className="text-sm">Maximum 10 athletes</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Target className="w-4 h-4 mr-2" />
                    <span className="text-sm">High-performance training focus</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <Badge className="bg-orange-100 text-orange-800">By Application Only</Badge>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Pricing Options</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>• Casual: $30 + GST per class</div>
                      <div>• Unlimited Sessions: $300 per month</div>
                      <div className="text-xs text-gray-500 ml-4">(includes Finals Surge app access)</div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Our most advanced program designed for serious athletes seeking elite-level training 
                    and competitive performance development.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Athlete Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Athlete Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="athleteFirstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Athlete's first name" {...field} />
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
                            <Input placeholder="Athlete's last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="athleteEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="athlete@email.com" {...field} />
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
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="0400 000 000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
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
                            <Input placeholder="e.g., Year 10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Parent/Guardian Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Parent/Guardian Information (if under 18)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="parentGuardianName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent/Guardian Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="parentGuardianEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parent/Guardian Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="parent@email.com" {...field} />
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
                            <Input placeholder="0400 000 000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Athletic Background */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Athletic Background</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="currentSports"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Sports/Activities *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="List all sports and activities you're currently involved in..."
                            rows={2}
                            {...field} 
                          />
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
                          <Textarea 
                            placeholder="Describe your athletic background, years of experience, training history..."
                            rows={3}
                            {...field} 
                          />
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
                          <Textarea 
                            placeholder="List any previous athletic clubs, teams, or training programs..."
                            rows={2}
                            {...field} 
                          />
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
                        <FormLabel>Personal Bests/Achievements</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="List your personal bests, competition results, or athletic achievements..."
                            rows={2}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Goals and Commitment */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Goals and Commitment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="athleticGoals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Athletic Goals *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="What are your short-term and long-term athletic goals?"
                            rows={3}
                            {...field} 
                          />
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
                          <Textarea 
                            placeholder="How many days per week can you commit to training? What is your current training schedule?"
                            rows={2}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reasonForJoining"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Why Senior Squad? *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Why do you want to join the Senior Squad program? What do you hope to achieve?"
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Availability */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Availability</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="availableDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Available Days *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Please specify which days you're available for training (Mon/Tue/Thu 5:30pm) and any scheduling constraints..."
                            rows={2}
                            {...field} 
                          />
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
                          <Textarea 
                            placeholder="Any additional information, medical conditions, or special considerations..."
                            rows={2}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary-500 hover:bg-primary-600"
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Submitting Application...
                    </>
                  ) : (
                    "Submit Application"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}