import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Video, Clock, User, Calendar, Eye, Play, ExternalLink } from "lucide-react";
import { format } from "date-fns";

export default function SharedVideo() {
  const { shareableLink } = useParams();

  const { data: video, isLoading, error } = useQuery({
    queryKey: ["/api/video-highlights/share", shareableLink],
    queryFn: () => fetch(`/api/video-highlights/share/${shareableLink}`).then(res => {
      if (!res.ok) throw new Error('Video not found');
      return res.json();
    }),
    enabled: !!shareableLink,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Video className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-pulse" />
          <p className="text-lg text-gray-600">Loading video highlight...</p>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <Video className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <CardTitle>Video Not Found</CardTitle>
            <CardDescription>
              The video highlight you're looking for doesn't exist or has been removed.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <a href="/">Go to Homepage</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Performance Video Highlight</h1>
          <p className="text-lg text-gray-600">Power2ADAPT Athletic Training</p>
        </div>

        {/* Video Card */}
        <Card className="overflow-hidden shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">{video.title}</CardTitle>
                <CardDescription className="text-blue-100">
                  {video.description}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white">
                {getTypeDisplay(video.type)}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Video Player */}
            {video.videoUrl ? (
              <div className="mb-6">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  {video.videoUrl.includes('youtube.com') || video.videoUrl.includes('youtu.be') ? (
                    <iframe
                      src={video.videoUrl.replace('watch?v=', 'embed/')}
                      className="w-full h-full"
                      frameBorder="0"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={video.videoUrl}
                      controls
                      className="w-full h-full object-cover"
                      poster={video.thumbnailUrl}
                    />
                  )}
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {video.duration && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {video.viewCount} view{video.viewCount !== 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(video.createdAt), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <Button asChild>
                    <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Watch Full Screen
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-6">
                <div className="text-center">
                  <Video className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500">Video processing...</p>
                </div>
              </div>
            )}

            {/* Video Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Athlete & Class Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Details</h3>
                <div className="space-y-2">
                  {video.childName && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Athlete: {video.childName}</span>
                    </div>
                  )}
                  {video.className && (
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Class: {video.className}</span>
                    </div>
                  )}
                  {video.coachName && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Coach: {video.coachName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Skills & Notes */}
              <div>
                {video.skillsHighlighted && video.skillsHighlighted.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Skills Highlighted</h3>
                    <div className="flex flex-wrap gap-1">
                      {video.skillsHighlighted.map((skill: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {video.performanceNotes && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Performance Notes</h3>
                    <p className="text-sm text-gray-600">{video.performanceNotes}</p>
                  </div>
                )}

                {video.coachComments && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Coach Comments</h3>
                    <p className="text-sm text-gray-600">{video.coachComments}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-600 mb-4">Want to see more highlights and join our athletic programs?</p>
          <Button asChild size="lg">
            <a href="/">Visit Power2ADAPT</a>
          </Button>
        </div>
      </div>
    </div>
  );
}