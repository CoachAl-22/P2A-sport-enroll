import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Video, 
  Plus, 
  Zap,
  Upload,
  FileVideo,
  Star,
  Award,
  TrendingUp,
  Clock,
  User
} from "lucide-react";

const quickVideoSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(["individual_performance", "class_highlights", "skill_demonstration", "progress_comparison"]),
  childId: z.string().optional(),
  classId: z.string().optional(),
  videoUrl: z.string().url("Please enter a valid video URL"),
  coachComments: z.string().min(1, "Coach comments are required"),
  skillsHighlighted: z.string().optional(),
  isPublic: z.boolean().default(false),
});

type QuickVideoForm = z.infer<typeof quickVideoSchema>;

// Pre-defined quick video templates
const quickTemplates = [
  {
    id: "speed-improvement",
    title: "Speed Improvement",
    type: "individual_performance" as const,
    icon: <TrendingUp className="h-5 w-5" />,
    description: "Showcase an athlete's speed progress",
    defaultComments: "Great improvement in sprint technique and speed! Keep up the excellent work.",
    skills: ["Sprint Technique", "Speed", "Acceleration"]
  },
  {
    id: "technique-demo",
    title: "Technique Demonstration", 
    type: "skill_demonstration" as const,
    icon: <Award className="h-5 w-5" />,
    description: "Highlight perfect form and technique",
    defaultComments: "Excellent technique demonstration! This is a great example for other athletes.",
    skills: ["Form", "Technique", "Execution"]
  },
  {
    id: "class-highlights",
    title: "Class Highlights",
    type: "class_highlights" as const,
    icon: <Star className="h-5 w-5" />,
    description: "Best moments from today's class",
    defaultComments: "Fantastic energy and effort from the whole class today!",
    skills: ["Teamwork", "Energy", "Effort"]
  },
  {
    id: "progress-comparison",
    title: "Progress Comparison",
    type: "progress_comparison" as const,
    icon: <TrendingUp className="h-5 w-5" />,
    description: "Before and after progress showcase",
    defaultComments: "Amazing progress over the past few weeks! The improvement is clearly visible.",
    skills: ["Progress", "Improvement", "Development"]
  }
];

interface OneClickVideoProps {
  selectedChild?: any;
  selectedClass?: any;
  onSuccess?: () => void;
}

export default function OneClickVideo({ selectedChild, selectedClass, onSuccess }: OneClickVideoProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch children and classes for selection
  const { data: children = [] } = useQuery({
    queryKey: ["/api/admin/students"],
  });

  const { data: classes = [] } = useQuery({
    queryKey: ["/api/classes"],
  });

  const createVideoMutation = useMutation({
    mutationFn: async (data: QuickVideoForm) => {
      const response = await fetch("/api/video-highlights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          skillsHighlighted: data.skillsHighlighted ? data.skillsHighlighted.split(',').map(s => s.trim()) : [],
        }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/video-highlights"] });
      setDialogOpen(false);
      setSelectedTemplate(null);
      form.reset();
      onSuccess?.();
      toast({
        title: "Success",
        description: "Video highlight created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create video highlight",
        variant: "destructive",
      });
    },
  });

  const form = useForm<QuickVideoForm>({
    resolver: zodResolver(quickVideoSchema),
    defaultValues: {
      title: "",
      type: "individual_performance",
      isPublic: false,
      coachComments: "",
      skillsHighlighted: "",
      videoUrl: "",
      childId: selectedChild?.id || "",
      classId: selectedClass?.id || "",
    },
  });

  const handleTemplateSelect = (templateId: string) => {
    const template = quickTemplates.find(t => t.id === templateId);
    if (!template) return;

    setSelectedTemplate(templateId);
    
    form.setValue("type", template.type);
    form.setValue("coachComments", template.defaultComments);
    form.setValue("skillsHighlighted", template.skills.join(", "));
    
    // Auto-generate title based on template and child/class
    let title = template.title;
    if (selectedChild) {
      title = `${selectedChild.firstName} - ${template.title}`;
    } else if (selectedClass) {
      title = `${selectedClass.name} - ${template.title}`;
    }
    form.setValue("title", title);
  };

  const onSubmit = (data: QuickVideoForm) => {
    createVideoMutation.mutate(data);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Zap className="h-4 w-4" />
          One-Click Video
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            One-Click Video Highlight Creation
          </DialogTitle>
          <DialogDescription>
            Choose a template to quickly create a video highlight, then customize with your content.
          </DialogDescription>
        </DialogHeader>

        {!selectedTemplate ? (
          /* Template Selection */
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Choose a Video Template</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickTemplates.map((template) => (
                  <Card 
                    key={template.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-200"
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        {template.icon}
                        {template.title}
                      </CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">Default skills:</p>
                        <div className="flex flex-wrap gap-1">
                          {template.skills.map((skill, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          /* Video Creation Form */
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  {quickTemplates.find(t => t.id === selectedTemplate)?.icon}
                  <span className="font-medium">
                    {quickTemplates.find(t => t.id === selectedTemplate)?.title} Template
                  </span>
                </div>
                <p className="text-sm text-blue-700">
                  {quickTemplates.find(t => t.id === selectedTemplate)?.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Video Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Amazing Performance Highlight" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="videoUrl"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Video URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://youtu.be/... or https://vimeo.com/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="childId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Child (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select child" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {(children as any[]).map((child: any) => (
                            <SelectItem key={child.id} value={child.id}>
                              {child.firstName} {child.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="classId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {(classes as any[]).map((cls: any) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="skillsHighlighted"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skills Highlighted</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Speed, Technique, Coordination (comma-separated)" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="coachComments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coach Comments</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add your coaching insights and feedback..."
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between gap-3">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setSelectedTemplate(null)}
                >
                  Back to Templates
                </Button>
                
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createVideoMutation.isPending}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {createVideoMutation.isPending ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Create Video Highlight
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}