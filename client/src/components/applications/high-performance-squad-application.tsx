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
import { X, Calendar, MapPin, Users, Award, Target, Clock, Zap } from "lucide-react";
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
      await apiRequest("POST", "/api/high-performance-squad-applications", data);
      toast({
        title: "Application Submitted Successfully!",
        description: "We'll review your High Performance Squad application and contact you within 48 hours. Check your SMS for confirmation.",
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute -top-2 -right-2 h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <DialogTitle className="text-2xl font-heading font-bold text-gray-900 pr-8">
            High Performance Squad Application
          </DialogTitle>
        </DialogHeader>

        {/* Program Overview */}
        <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Zap className="w-5 h-5" />
              Elite High Performance Coaching
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-700">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span className="text-sm">1-on-1 & Small Group Training</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Target className="w-4 h-4 text-purple-600" />
                  <span className="text-sm">Performance Analysis & Planning</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Award className="w-4 h-4 text-purple-600" />
                  <span className="text-sm">Competition Preparation</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <span className="text-sm">Flexible Scheduling</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-4 h-4 text-purple-600" />
                  <span className="text-sm">Multiple Venue Options</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span className="text-sm">Custom Training Programs</span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">Elite Coaching</Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">Performance Focus</Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">Individual Attention</Badge>
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
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="athleteFirstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Athlete First Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter first name" {...field} />
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
                        <FormLabel>Athlete Last Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="athleteEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Athlete Email *</FormLabel>
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
                        <FormLabel>Athlete Mobile *</FormLabel>
                        <FormControl>
                          <Input placeholder="0400 000 000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
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
                        <FormLabel>Current School Year *</FormLabel>
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
                <CardTitle className="text-lg">Parent/Guardian Contact (if athlete is under 18)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
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
                        <FormLabel>Parent/Guardian Mobile</FormLabel>
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
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="currentSports"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Sports *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Athletics, Basketball, Swimming" {...field} />
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
                          <Input placeholder="e.g., School, Club, State, National" {...field} />
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
                      <FormLabel>Personal Best Times/Distances/Results *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="List your personal best performances, times, distances, or achievements..."
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
                          placeholder="Describe your athletic background, years of experience, major competitions..."
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="previousClubs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Previous Clubs/Teams</FormLabel>
                        <FormControl>
                          <Input placeholder="List previous clubs or teams" {...field} />
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
                        <FormLabel>Previous Coaching Experience</FormLabel>
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

            {/* High Performance Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">High Performance Goals & Ambitions</CardTitle>
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
                          placeholder="Describe your short-term and long-term athletic goals..."
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
                          placeholder="What competitions are you targeting? (School Sports, State Championships, Nationals, etc.)"
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
                          placeholder="Describe your performance ambitions (state level, national team, international competition, scholarships, etc.)"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Training & Commitment */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Training & Commitment</CardTitle>
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
                          placeholder="Describe your current weekly training schedule, sessions, and hours..."
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="trainingCommitment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Training Commitment *</FormLabel>
                        <FormControl>
                          <Input placeholder="How many sessions per week?" {...field} />
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
                          <Input placeholder="What days/times are you available?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Specific Coaching Needs */}
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
                      <FormLabel>Coaching Type Preference *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 1-on-1, small group, technical focus, strength focus" {...field} />
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
                          placeholder="What specific areas do you want to improve? (technique, speed, strength, mental preparation, etc.)"
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
                          placeholder="Why are you seeking High Performance coaching? What do you hope to achieve?"
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
                      <FormLabel>Current or Recent Injuries</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Please list any current or recent injuries that may affect training..."
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
                          placeholder="Any additional information you'd like us to know..."
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}