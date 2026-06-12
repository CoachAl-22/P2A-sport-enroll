import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { 
  Video, 
  Plus, 
  Share2, 
  Play, 
  Clock, 
  User,
  Eye,
  MoreHorizontal,
  Edit,
  Trash2,
  Upload,
  FileVideo,
  Calendar,
  Users,
  ExternalLink,
  Copy
} from "lucide-react";
import OneClickVideo from "@/components/one-click-video";
import { format } from "date-fns";

const videoHighlightSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["individual_performance", "class_highlights", "skill_demonstration", "progress_comparison", "team_performance"]),
  childId: z.string().optional(),
  classId: z.string().optional(),
  videoUrl: z.string().url("Please enter a valid video URL").optional(),
  thumbnailUrl: z.string().url("Please enter a valid thumbnail URL").optional(),
  duration: z.number().min(1).optional(),
  skillsHighlighted: z.array(z.string()).optional(),
  performanceNotes: z.string().optional(),
  coachComments: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().default(false),
});

type VideoHighlightForm = z.infer<typeof videoHighlightSchema>;

const shareVideoSchema = z.object({
  parentId: z.string().optional(),
  email: z.string().email().optional(),
  message: z.string().optional(),
});

type ShareVideoForm = z.infer<typeof shareVideoSchema>;

export default function VideoHighlights() {
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch video highlights
  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["/api/video-highlights"],
    enabled: !!user && ["coach", "admin"].includes(user.role),
  });

  // Fetch children and classes for forms
  const { data: children = [] } = useQuery({
    queryKey: ["/api/admin/students"],
    enabled: !!user && user.role === "admin",
  });

  const { data: classes = [] } = useQuery({
    queryKey: ["/api/classes"],
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["/api/admin/customers"],
    enabled: !!user && ["coach", "admin"].includes(user.role),
  });

  // Create video highlight mutation
  const createVideoMutation = useMutation({
    mutationFn: async (data: VideoHighlightForm) => {
      const response = await fetch("/api/video-highlights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/video-highlights"] });
      setCreateDialogOpen(false);
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

  // Share video mutation
  const shareVideoMutation = useMutation({
    mutationFn: async ({ videoId, shareData }: { videoId: string; shareData: ShareVideoForm }) => {
      const response = await fetch(`/api/video-highlights/${videoId}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(shareData),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    },
    onSuccess: () => {
      setShareDialogOpen(false);
      setSelectedVideo(null);
      toast({
        title: "Success",
        description: "Video shared successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to share video",
        variant: "destructive",
      });
    },
  });

  // Delete video mutation
  const deleteVideoMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const response = await fetch(`/api/video-highlights/${videoId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/video-highlights"] });
      toast({
        title: "Success",
        description: "Video highlight deleted successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete video",
        variant: "destructive",
      });
    },
  });

  const form = useForm<VideoHighlightForm>({
    resolver: zodResolver(videoHighlightSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "individual_performance",
      isPublic: false,
      skillsHighlighted: [],
      tags: [],
    },
  });

  const shareForm = useForm<ShareVideoForm>({
    resolver: zodResolver(shareVideoSchema),
  });

  const onSubmit = (data: VideoHighlightForm) => {
    // Clean up form data
    const formattedData = {
      ...data,
      childId: data.childId === "none" ? undefined : data.childId,
      classId: data.classId === "none" ? undefined : data.classId,
      skillsHighlighted: data.skillsHighlighted || [],
      tags: data.tags || [],
    };
    createVideoMutation.mutate(formattedData);
  };

  const onShare = (data: ShareVideoForm) => {
    if (!selectedVideo) return;
    shareVideoMutation.mutate({
      videoId: selectedVideo.id,
      shareData: data,
    });
  };

  const shareToSkool = (video: any) => {
    // Generate a shareable message for Skool
    const skoolMessage = `🏃‍♂️ **${video.title}** 
    
${video.description || "Check out this amazing performance highlight!"}

🎯 Type: ${getTypeDisplay(video.type)}
${video.childName ? `👤 Athlete: ${video.childName}` : ''}
${video.className ? `🏫 Class: ${video.className}` : ''}
${video.coachName ? `👨‍🏫 Coach: ${video.coachName}` : ''}

Watch the full video: ${window.location.origin}/video-highlights/${video.shareableLink}

#Power2ADAPT #AthleticTraining #PerformanceHighlights`;

    // Copy to clipboard for easy pasting in Skool
    navigator.clipboard.writeText(skoolMessage).then(() => {
      toast({
        title: "Skool Post Ready!",
        description: "Message copied to clipboard. Paste it in your Skool community!",
      });
    }).catch(() => {
      // Fallback: open in new window with the message
      const skoolUrl = `https://www.skool.com/power2adapt-speed-school-8929`;
      window.open(skoolUrl, '_blank');
      toast({
        title: "Skool Community Opened",
        description: "Create a new post and share your video highlight!",
      });
    });
  };

  const copyShareableLink = (video: any) => {
    const shareableUrl = `${window.location.origin}/video-highlights/${video.shareableLink}`;
    navigator.clipboard.writeText(shareableUrl).then(() => {
      toast({
        title: "Link Copied!",
        description: "Shareable link copied to clipboard",
      });
    }).catch(() => {
      toast({
        title: "Copy Failed",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    });
  };

  const getTypeDisplay = (type: string) => {
    const typeMap: Record<string, string> = {
      individual_performance: "Individual Performance",
      class_highlights: "Class Highlights",
      skill_demonstration: "Skill Demonstration", 
      progress_comparison: "Progress Comparison",
      team_performance: "Team Performance",
    };
    return typeMap[type] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready": return "bg-green-100 text-green-800";
      case "processing": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      case "archived": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (!user || !["coach", "admin"].includes(user.role)) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>You need coach or admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Performance Video Highlights</h1>
          <p className="text-gray-600 mt-2">Create and manage video highlights for athlete performance tracking</p>
        </div>
        
        <div className="flex gap-3">
          <OneClickVideo onSuccess={() => window.location.reload()} />
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Advanced Create
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Video Highlight</DialogTitle>
              <DialogDescription>
                Create a performance video highlight to showcase athlete progress and skills.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Video Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Amazing Sprint Performance" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Video Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select video type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="individual_performance">Individual Performance</SelectItem>
                            <SelectItem value="class_highlights">Class Highlights</SelectItem>
                            <SelectItem value="skill_demonstration">Skill Demonstration</SelectItem>
                            <SelectItem value="progress_comparison">Progress Comparison</SelectItem>
                            <SelectItem value="team_performance">Team Performance</SelectItem>
                          </SelectContent>
                        </Select>
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
                            <SelectItem value="none">None</SelectItem>
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
                            <SelectItem value="none">None</SelectItem>
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

                  <FormField
                    control={form.control}
                    name="videoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Video URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormDescription>
                          Link to the video file or streaming URL
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe what this video showcases..."
                          className="min-h-[100px]"
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
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createVideoMutation.isPending}
                  >
                    {createVideoMutation.isPending ? "Creating..." : "Create Video Highlight"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Videos Grid */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Videos ({videos.length})</TabsTrigger>
          <TabsTrigger value="individual">Individual</TabsTrigger>
          <TabsTrigger value="class">Class Highlights</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading video highlights...</p>
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-12">
              <FileVideo className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No video highlights yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first performance video highlight to get started.
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Video Highlight
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video: any) => (
                <Card key={video.id} className="overflow-hidden">
                  <div className="aspect-video bg-gray-100 relative">
                    {video.thumbnailUrl ? (
                      <img 
                        src={video.thumbnailUrl} 
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <Badge className={getStatusColor(video.status)}>
                        {video.status}
                      </Badge>
                    </div>
                    {video.duration && (
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                      </div>
                    )}
                  </div>
                  
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-1">{video.title}</CardTitle>
                        <CardDescription className="text-sm mt-1">
                          {getTypeDisplay(video.type)}
                        </CardDescription>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      {video.childName && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="h-4 w-4" />
                          {video.childName}
                        </div>
                      )}
                      
                      {video.className && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="h-4 w-4" />
                          {video.className}
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(video.createdAt), "MMM d, yyyy")}
                      </div>

                      {video.viewCount > 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Eye className="h-4 w-4" />
                          {video.viewCount} view{video.viewCount !== 1 ? 's' : ''}
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        {video.videoUrl && (
                          <Button size="sm" asChild>
                            <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">
                              <Play className="h-4 w-4 mr-1" />
                              Watch
                            </a>
                          </Button>
                        )}
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedVideo(video);
                            setShareDialogOpen(true);
                          }}
                        >
                          <Share2 className="h-4 w-4 mr-1" />
                          Share
                        </Button>
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => shareToSkool(video)}
                          title="Share to Skool Community"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Skool
                        </Button>
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => copyShareableLink(video)}
                          title="Copy shareable link"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this video highlight?')) {
                              deleteVideoMutation.mutate(video.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="individual">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos
              .filter((video: any) => video.type === 'individual_performance')
              .map((video: any) => (
                // Same card component as above
                <Card key={video.id} className="overflow-hidden">
                  {/* Card content */}
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="class">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos
              .filter((video: any) => video.type === 'class_highlights')
              .map((video: any) => (
                // Same card component as above
                <Card key={video.id} className="overflow-hidden">
                  {/* Card content */}
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Video Highlight</DialogTitle>
            <DialogDescription>
              Share "{selectedVideo?.title}" with parents or via email.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...shareForm}>
            <form onSubmit={shareForm.handleSubmit(onShare)} className="space-y-4">
              <FormField
                control={shareForm.control}
                name="parentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select parent" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer: any) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.firstName} {customer.lastName} ({customer.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="text-center text-sm text-gray-500">OR</div>

              <FormField
                control={shareForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="parent@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={shareForm.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add a personal message..."
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShareDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={shareVideoMutation.isPending}
                >
                  {shareVideoMutation.isPending ? "Sharing..." : "Share Video"}
                </Button>
              </div>
            </form>
          </Form>
          </DialogContent>
        </Dialog>
        </div>
    </div>
  );
}