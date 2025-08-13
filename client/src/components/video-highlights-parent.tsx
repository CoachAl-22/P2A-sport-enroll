import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { 
  Video, 
  Play, 
  Clock, 
  Calendar,
  User,
  Eye,
  FileVideo,
  Star,
  TrendingUp,
  Award
} from "lucide-react";
import { format } from "date-fns";

export default function VideoHighlightsParent() {
  const { user } = useAuth();
  const [selectedChild, setSelectedChild] = useState<string>("");

  // Fetch children for parent
  const { data: children = [] } = useQuery({
    queryKey: ["/api/children"],
    enabled: !!user && user.role === "parent",
  });

  // Fetch shared videos for parent
  const { data: sharedVideos = [], isLoading: sharedLoading } = useQuery({
    queryKey: ["/api/video-highlights/shared"],
    enabled: !!user && user.role === "parent",
  });

  // Fetch videos for selected child
  const { data: childVideos = [], isLoading: childLoading } = useQuery({
    queryKey: ["/api/video-highlights/child", selectedChild],
    enabled: !!selectedChild && !!user,
  });

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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "individual_performance": return <Star className="h-4 w-4" />;
      case "skill_demonstration": return <Award className="h-4 w-4" />;
      case "progress_comparison": return <TrendingUp className="h-4 w-4" />;
      default: return <Video className="h-4 w-4" />;
    }
  };

  const VideoCard = ({ video, isShared = false }: { video: any; isShared?: boolean }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
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
          <Badge variant="secondary" className="flex items-center gap-1">
            {getTypeIcon(video.type)}
            {getTypeDisplay(video.type)}
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
        <CardTitle className="text-lg line-clamp-2">{video.title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {video.description || video.coachComments}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {video.childName && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              {video.childName}
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            {format(new Date(video.createdAt), "MMM d, yyyy")}
          </div>

          {video.skillsHighlighted && video.skillsHighlighted.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {video.skillsHighlighted.slice(0, 3).map((skill: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {video.skillsHighlighted.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{video.skillsHighlighted.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {video.coachComments && (
            <div className="bg-blue-50 border-l-4 border-blue-200 p-3 rounded">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Coach Notes:</span> {video.coachComments}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {video.videoUrl && (
              <Button size="sm" className="flex-1" asChild>
                <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">
                  <Play className="h-4 w-4 mr-1" />
                  Watch Video
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!user || user.role !== "parent") {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>You need parent privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Performance Video Highlights</h1>
        <p className="text-gray-600 mt-2">
          View your child's performance videos and track their athletic progress
        </p>
      </div>

      <Tabs defaultValue="shared" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="shared">
            Shared with Me ({sharedVideos.length})
          </TabsTrigger>
          <TabsTrigger value="by-child">
            By Child
          </TabsTrigger>
        </TabsList>

        {/* Shared Videos Tab */}
        <TabsContent value="shared" className="mt-6">
          {sharedLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading shared videos...</p>
            </div>
          ) : sharedVideos.length === 0 ? (
            <div className="text-center py-12">
              <FileVideo className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No shared videos yet</h3>
              <p className="text-gray-600">
                Coaches will share performance videos with you as they become available.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sharedVideos.map((share: any) => (
                <VideoCard 
                  key={share.id} 
                  video={share.video || share} 
                  isShared={true}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* By Child Tab */}
        <TabsContent value="by-child" className="mt-6">
          <div className="space-y-6">
            {/* Child Selector */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedChild === "" ? "default" : "outline"}
                onClick={() => setSelectedChild("")}
                size="sm"
              >
                All Children
              </Button>
              {children.map((child: any) => (
                <Button
                  key={child.id}
                  variant={selectedChild === child.id ? "default" : "outline"}
                  onClick={() => setSelectedChild(child.id)}
                  size="sm"
                >
                  {child.firstName} {child.lastName}
                </Button>
              ))}
            </div>

            {/* Videos for Selected Child */}
            {selectedChild ? (
              childLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading videos...</p>
                </div>
              ) : childVideos.length === 0 ? (
                <div className="text-center py-12">
                  <FileVideo className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No videos for this child</h3>
                  <p className="text-gray-600">
                    Performance videos will appear here as coaches create them.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {childVideos.map((video: any) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a child</h3>
                <p className="text-gray-600">
                  Choose one of your children above to view their performance videos.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Performance Insights */}
      {(sharedVideos.length > 0 || childVideos.length > 0) && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Performance Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <Video className="h-4 w-4 mr-2" />
                  Total Videos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {sharedVideos.length + childVideos.length}
                </div>
                <p className="text-xs text-gray-500 mt-1">Performance highlights</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Skills Tracked
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {new Set(
                    [...sharedVideos, ...childVideos]
                      .flatMap((video: any) => video.skillsHighlighted || [])
                  ).size}
                </div>
                <p className="text-xs text-gray-500 mt-1">Different skills</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Latest Video
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {[...sharedVideos, ...childVideos].length > 0 
                    ? format(
                        new Date(
                          Math.max(
                            ...[...sharedVideos, ...childVideos].map((video: any) => 
                              new Date(video.createdAt).getTime()
                            )
                          )
                        ), 
                        "MMM d"
                      )
                    : "N/A"
                  }
                </div>
                <p className="text-xs text-gray-500 mt-1">Most recent</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}