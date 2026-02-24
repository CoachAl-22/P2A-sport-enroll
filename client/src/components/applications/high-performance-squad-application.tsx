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
import { X, Calendar, MapPin, Users, Award, Target, Clock, Zap, Phone, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const highPerformanceSquadApplicationSchema = z.object({
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
  
  // Athletic Background & Performance Level
  currentSports: z.string().min(1, "Please list current sports"),
  competitionLevel: z.string().min(1, "Please describe your competition level"),
  athleticExperience: z.string().min(1, "Please describe athletic experience"),
  previousClubs: z.string().optional(),
  personalBests: z.string().min(1, "Please list your personal best times/distances"),
  coachingHistory: z.string().optional(),
  
  // High Performance Goals
  athleticGoals: z.string().min(1, "Please describe your high-performance goals"),
  targetCompetitions: z.string().min(1, "What competitions are you targeting?"),
  performanceAmbitions: z.string().min(1, "Describe your performance ambitions (state, national, international)"),
  
  // Training & Commitment
  currentTrainingLoad: z.string().min(1, "Describe your current weekly training load"),
  trainingCommitment: z.string().min(1, "How many sessions per week can you commit to?"),
  timeAvailability: z.string().min(1, "What days/times are you available for training?"),
  
  // Specific Coaching Needs
  coachingType: z.string().min(1, "What type of coaching are you looking for? (1-on-1, small group, technical, etc.)"),
  specificNeeds: z.string().min(1, "What specific areas do you want to improve?"),
  reasonForHighPerformance: z.string().min(1, "Why do you want High Performance coaching?"),
  
  // Additional Information
  injuries: z.string().optional(),
  additionalNotes: z.string().optional(),
});

type HighPerformanceSquadApplicationForm = z.infer<typeof highPerformanceSquadApplicationSchema>;

interface HighPerformanceSquadApplicationProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HighPerformanceSquadApplication({ isOpen, onClose }: HighPerformanceSquadApplicationProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<HighPerformanceSquadApplicationForm>({
    resolver: zodResolver(highPerformanceSquadApplicationSchema),
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
      competitionLevel: "",
      athleticExperience: "",
      previousClubs: "",
      personalBests: "",
      coachingHistory: "",
      athleticGoals: "",
      targetCompetitions: "",
      performanceAmbitions: "",
      currentTrainingLoad: "",
      trainingCommitment: "",
      timeAvailability: "",
      coachingType: "",
      specificNeeds: "",
      reasonForHighPerformance: "",
      injuries: "",
      additionalNotes: "",
    },
  });

  const onSubmit = async (data: HighPerformanceSquadApplicationForm) => {
    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/applications/high-performance-squad", data);
      setIsSubmitted(true);
      toast({
        title: "Application Submitted Successfully!",
        description: "Your application has been received. Please book your discovery call below.",
      });
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

  const handleClose = () => {
    if (isSubmitted) {
      setIsSubmitted(false);
      form.reset();
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-heading font-bold text-gray-900">
              High Performance Squad Application
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-6">
          {isSubmitted ? (
            <div className="text-center py-12 space-y-6">
              <div className="bg-green-100 text-green-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Application Received!</h3>
              <p className="text-lg text-gray-600 max-w-md mx-auto">
                Thank you for applying to the High Performance Squad. The final step is to book your 15-minute discovery call with our coaches.
              </p>
              <div className="pt-4">
                <Button 
                  size="lg"
                  className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-8 py-6 text-xl shadow-lg hover:shadow-xl transition-all"
                  onClick={() => window.open('https://power2adapt.setmore.com/services/a9a6a66a-9c61-4bec-829a-84d78687c2c0', '_blank')}
                >
                  <Calendar className="w-6 h-6 mr-3" />
                  Book My Discovery Call Now
                </Button>
              </div>
              <p className="text-sm text-gray-500 pt-4">
                Opening your booking calendar in a new tab...
              </p>
            </div>
          ) : (
            <>
              {/* Program Overview */}
              <Card className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-800">
                    <Zap className="w-5 h-5" />
                    Elite High Performance Coaching
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center text-gray-700">
                        <Users className="w-4 h-4 mr-2 text-purple-600" />
                        <span className="text-sm">1-on-1 & Small Group Training</span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <Target className="w-4 h-4 mr-2 text-purple-600" />
                        <span className="text-sm">Performance Analysis & Planning</span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <Award className="w-4 h-4 mr-2 text-purple-600" />
                        <span className="text-sm">Competition Preparation</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Badge className="bg-purple-100 text-purple-800">Elite Coaching</Badge>
                      <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-purple-100">
                        <h4 className="font-semibold text-gray-900 mb-2">Program Details</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div>• Monthly: $300</div>
                          <div>• Annual program: $3,500</div>
                          <div className="text-xs text-gray-500 mt-2">Individual attention & custom programs</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Book Discovery Call Option */}
                  <div className="mt-6 pt-6 border-t border-purple-200">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">Unsure if High Performance is right for you?</h4>
                        <p className="text-sm text-gray-600">Speak with our elite coaches to discuss your athletic goals.</p>
                      </div>
                      <Button 
                        variant="outline" 
                        className="border-purple-300 text-purple-700 hover:bg-purple-100 whitespace-nowrap"
                        onClick={() => window.open('https://power2adapt.setmore.com/services/a9a6a66a-9c61-4bec-829a-84d78687c2c0', '_blank')}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Book Discovery Call
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

                  {/* Athletic Background & Performance Level */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Athletic Background & Performance Level</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="currentSports"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Sports *</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Athletics, Basketball" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="competitionLevel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Competition Level *</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., State, National" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="personalBests"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Personal Bests/Achievements *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="List your personal best times, distances, or major achievements..."
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
                        name="athleticExperience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Athletic Experience *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe your athletic background and training history..."
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
                                <Input placeholder="List previous clubs" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="coachingHistory"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Previous Coaching History</FormLabel>
                              <FormControl>
                                <Input placeholder="Previous coaches or programs" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Goals and Ambitions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Goals and Ambitions</CardTitle>
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
                        name="targetCompetitions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target Competitions *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="What specific competitions are you targeting?"
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
                        name="performanceAmbitions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Performance Ambitions *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="What are your ultimate ambitions in your sport?"
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

                  {/* Training and commitment */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Training and Commitment</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="currentTrainingLoad"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Weekly Training Load *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe your current weekly training schedule and sessions..."
                                rows={2}
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
                                <Input placeholder="Sessions per week" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="timeAvailability"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Time Availability *</FormLabel>
                              <FormControl>
                                <Input placeholder="Available days and times" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Specific Needs */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Specific Coaching Needs</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="coachingType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preferred Coaching Type *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 1-on-1, Technical focus" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="specificNeeds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Specific Areas for Improvement *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="What specific areas do you want to focus on?"
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
                        name="reasonForHighPerformance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Why High Performance Coaching? *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Why do you want to join the High Performance program?"
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
                        name="injuries"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Injury History</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="List any current or previous injuries..."
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
                                placeholder="Any other information you'd like us to know..."
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
                      onClick={handleClose}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
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
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
