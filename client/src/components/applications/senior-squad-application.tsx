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
import { X, Calendar, MapPin, Users, Award, Target, Clock, Phone } from "lucide-react";
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
          <Card className="mb-6 bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <Award className="w-5 h-5" />
                Elite Senior Squad Program
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center text-gray-700">
                    <Calendar className="w-4 h-4 mr-2 text-orange-600" />
                    <span className="text-sm">Mon, Tue, Thu 5:30pm @ Ballam Park</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Users className="w-4 h-4 mr-2 text-orange-600" />
                    <span className="text-sm">Maximum 10 athletes per squad</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Target className="w-4 h-4 mr-2 text-orange-600" />
                    <span className="text-sm">High-performance training focus</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <Badge className="bg-orange-100 text-orange-800">By Application Only</Badge>
                  <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-orange-100">
                    <h4 className="font-semibold text-gray-900 mb-2">Pricing Options</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>• Casual: $30 + GST per class</div>
                      <div>• Unlimited sessions. for $200 per month</div>
                      <div className="text-xs text-gray-500 mt-2">Elite training for serious athletes</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Book Discovery Call Option */}
              <div className="mt-6 pt-6 border-t border-orange-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">Unsure if Senior Squad is right for you?</h4>
                    <p className="text-sm text-gray-600">Speak with our elite coaches to discuss your athletic goals.</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="border-orange-300 text-orange-700 hover:bg-orange-100 whitespace-nowrap"
                    onClick={() => window.open('https://calendly.com/power2adapt', '_blank')}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Book Discovery Call
                  </Button>
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

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="previousClubs"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Previous Clubs/Teams</FormLabel>
                          <FormControl>
                            <Input placeholder="List any previous clubs" {...field} />
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
                            <Input placeholder="Times, distances, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="trainingCommitment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Training Commitment *</FormLabel>
                          <FormControl>
                            <Input placeholder="Days per week" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="availableDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Available Days *</FormLabel>
                          <FormControl>
                            <Input placeholder="Mon/Tue/Thu" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="reasonForJoining"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Why Senior Squad? *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Why do you want to join the Senior Squad program?"
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

              {/* Additional Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Additional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
              <div className="flex justify-end gap-4 pb-6">
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