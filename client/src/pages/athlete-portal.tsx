import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { 
  Trophy, 
  Target, 
  Calendar, 
  TrendingUp, 
  MessageSquare, 
  PlayCircle, 
  Clock, 
  Award,
  ChevronRight,
  Star,
  Activity,
  Users,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Timer,
  Zap
} from "lucide-react";
import { format, isToday, isTomorrow, addDays } from "date-fns";

export default function AthletePortal() {
  const { user } = useAuth();
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");

  // Fetch athlete data
  const { data: children } = useQuery({
    queryKey: ["/api/children"],
    enabled: !!user,
  });

  const { data: performanceRecords } = useQuery({
    queryKey: ["/api/performance-records", selectedChild],
    enabled: !!selectedChild,
  });

  const { data: trainingGoals } = useQuery({
    queryKey: ["/api/training-goals", selectedChild],
    enabled: !!selectedChild,
  });

  const { data: attendanceRecords } = useQuery({
    queryKey: ["/api/attendance-records", selectedChild],
    enabled: !!selectedChild,
  });

  const { data: coachMessages } = useQuery({
    queryKey: ["/api/coach-messages", selectedChild],
    enabled: !!selectedChild,
  });

  const { data: upcomingClasses } = useQuery({
    queryKey: ["/api/upcoming-classes", selectedChild],
    enabled: !!selectedChild,
  });

  const { data: videoHighlights } = useQuery({
    queryKey: ["/api/video-highlights", selectedChild],
    enabled: !!selectedChild,
  });

  // Select first child by default
  const firstChild = children?.[0];
  if (!selectedChild && firstChild) {
    setSelectedChild(firstChild.id);
  }

  const currentChild = children?.find(child => child.id === selectedChild);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    return format(d, "MMM d");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "achieved": return "bg-green-100 text-green-800";
      case "active": return "bg-blue-100 text-blue-800";
      case "paused": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high": return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "medium": return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  if (!children || children.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Athletes Found</h2>
          <p className="text-gray-600">Please contact your coach to set up your athlete profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Trophy className="w-8 h-8 text-primary-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Athlete Portal</h1>
                <p className="text-sm text-gray-500">Track your athletic journey</p>
              </div>
            </div>
            
            {/* Child Selector */}
            {children.length > 1 && (
              <div className="flex items-center space-x-2">
                <Label htmlFor="child-select" className="text-sm font-medium">Athlete:</Label>
                <select 
                  id="child-select"
                  value={selectedChild || ""}
                  onChange={(e) => setSelectedChild(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  {children.map(child => (
                    <option key={child.id} value={child.id}>
                      {child.firstName} {child.lastName}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentChild && (
          <>
            {/* Athlete Profile Header */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 text-white mb-8">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={currentChild.profilePicture} />
                  <AvatarFallback className="bg-white text-primary-600 text-lg font-bold">
                    {getInitials(`${currentChild.firstName} ${currentChild.lastName}`)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">{currentChild.firstName} {currentChild.lastName}</h2>
                  <p className="text-primary-100">Age {currentChild.age} • {currentChild.schoolYear}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1">
                      <Trophy className="w-4 h-4" />
                      <span className="text-sm">{performanceRecords?.filter(r => r.isPersonalBest).length || 0} Personal Bests</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Target className="w-4 h-4" />
                      <span className="text-sm">{trainingGoals?.filter(g => g.status === 'achieved').length || 0} Goals Achieved</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="goals">Goals</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="messages">Messages</TabsTrigger>
                <TabsTrigger value="videos">Videos</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Quick Stats */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {attendanceRecords ? Math.round((attendanceRecords.filter(a => a.status === 'present').length / attendanceRecords.length) * 100) : 0}%
                      </div>
                      <p className="text-xs text-muted-foreground">Last 30 days</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
                      <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{trainingGoals?.filter(g => g.status === 'active').length || 0}</div>
                      <p className="text-xs text-muted-foreground">In progress</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Personal Bests</CardTitle>
                      <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{performanceRecords?.filter(r => r.isPersonalBest).length || 0}</div>
                      <p className="text-xs text-muted-foreground">All time</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">New Messages</CardTitle>
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{coachMessages?.filter(m => !m.isRead).length || 0}</div>
                      <p className="text-xs text-muted-foreground">From coaches</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Performance</CardTitle>
                      <CardDescription>Your latest achievements and records</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {performanceRecords?.slice(0, 5).map((record) => (
                          <div key={record.id} className="flex items-center space-x-3">
                            <div className={`p-2 rounded-full ${record.isPersonalBest ? 'bg-yellow-100' : 'bg-blue-100'}`}>
                              {record.isPersonalBest ? <Star className="w-4 h-4 text-yellow-600" /> : <BarChart3 className="w-4 h-4 text-blue-600" />}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{record.recordType.replace('_', ' ')}</p>
                              <p className="text-xs text-gray-500">{format(new Date(record.recordDate), 'MMM d, yyyy')}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">{record.value} {record.unit}</p>
                              {record.isPersonalBest && <Badge variant="secondary" className="text-xs">PB</Badge>}
                            </div>
                          </div>
                        ))}
                        {(!performanceRecords || performanceRecords.length === 0) && (
                          <p className="text-sm text-gray-500 text-center py-4">No performance records yet</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Upcoming Training</CardTitle>
                      <CardDescription>Your next training sessions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {upcomingClasses?.slice(0, 5).map((session, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <div className="p-2 rounded-full bg-primary-100">
                              <Calendar className="w-4 h-4 text-primary-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{session.name}</p>
                              <p className="text-xs text-gray-500">{session.venue?.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">{formatDate(session.date)}</p>
                              <p className="text-xs text-gray-500">{session.startTime} - {session.endTime}</p>
                            </div>
                          </div>
                        ))}
                        {(!upcomingClasses || upcomingClasses.length === 0) && (
                          <p className="text-sm text-gray-500 text-center py-4">No upcoming sessions</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Performance Tab */}
              <TabsContent value="performance" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Performance Records</CardTitle>
                      <CardDescription>Track your personal bests and improvements over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {performanceRecords?.map((record) => (
                          <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-full ${record.isPersonalBest ? 'bg-yellow-100' : 'bg-blue-100'}`}>
                                {record.isPersonalBest ? <Trophy className="w-5 h-5 text-yellow-600" /> : <BarChart3 className="w-5 h-5 text-blue-600" />}
                              </div>
                              <div>
                                <h4 className="font-medium">{record.recordType.replace('_', ' ').toUpperCase()}</h4>
                                <p className="text-sm text-gray-500">{format(new Date(record.recordDate), 'MMM d, yyyy')}</p>
                                {record.notes && <p className="text-xs text-gray-400 mt-1">{record.notes}</p>}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold">{record.value} {record.unit}</div>
                              {record.isPersonalBest && (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Personal Best</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                        {(!performanceRecords || performanceRecords.length === 0) && (
                          <div className="text-center py-8">
                            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Performance Records Yet</h3>
                            <p className="text-gray-500">Your coach will add performance records as you train and compete.</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Categories</CardTitle>
                      <CardDescription>Performance by category</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {['Speed', 'Strength', 'Endurance', 'Technique'].map((category) => {
                          const categoryRecords = performanceRecords?.filter(r => 
                            r.recordType.toLowerCase().includes(category.toLowerCase())
                          ).length || 0;
                          return (
                            <div key={category} className="flex items-center justify-between">
                              <span className="text-sm font-medium">{category}</span>
                              <span className="text-sm text-gray-500">{categoryRecords} records</span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Goals Tab */}
              <TabsContent value="goals" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Training Goals</CardTitle>
                    <CardDescription>Work towards your athletic objectives</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {trainingGoals?.map((goal) => (
                        <div key={goal.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {getPriorityIcon(goal.priority)}
                              <h4 className="font-medium">{goal.title}</h4>
                              <Badge className={getStatusColor(goal.status)}>
                                {goal.status}
                              </Badge>
                            </div>
                            <span className="text-sm text-gray-500">{goal.category}</span>
                          </div>
                          
                          {goal.description && (
                            <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                          )}
                          
                          {goal.targetValue && goal.currentValue && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Progress</span>
                                <span>{goal.currentValue} / {goal.targetValue} {goal.targetUnit}</span>
                              </div>
                              <Progress 
                                value={(parseFloat(goal.currentValue) / parseFloat(goal.targetValue)) * 100} 
                                className="h-2"
                              />
                            </div>
                          )}
                          
                          {goal.targetDate && (
                            <p className="text-xs text-gray-500 mt-2">
                              Target: {format(new Date(goal.targetDate), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                      ))}
                      {(!trainingGoals || trainingGoals.length === 0) && (
                        <div className="text-center py-8">
                          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Goals Set Yet</h3>
                          <p className="text-gray-500">Your coach will set personalized goals to help you improve.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Schedule Tab */}
              <TabsContent value="schedule" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Training Schedule</CardTitle>
                    <CardDescription>Your upcoming training sessions and events</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {upcomingClasses?.map((session, index) => (
                        <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                          <div className="p-3 rounded-full bg-primary-100">
                            <Calendar className="w-6 h-6 text-primary-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{session.name}</h4>
                            <p className="text-sm text-gray-500">{session.venue?.name}</p>
                            <p className="text-sm text-gray-500">{session.coach?.firstName} {session.coach?.lastName}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold">{formatDate(session.date)}</div>
                            <div className="text-sm text-gray-500">{session.startTime} - {session.endTime}</div>
                          </div>
                        </div>
                      ))}
                      {(!upcomingClasses || upcomingClasses.length === 0) && (
                        <div className="text-center py-8">
                          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Scheduled Sessions</h3>
                          <p className="text-gray-500">Check back later for your training schedule.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Messages Tab */}
              <TabsContent value="messages" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Coach Messages</CardTitle>
                    <CardDescription>Communication with your coaching team</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {coachMessages?.map((message) => (
                        <div key={message.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback>
                                  {getInitials(`${message.fromCoach?.firstName} ${message.fromCoach?.lastName}`)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">
                                  {message.fromCoach?.firstName} {message.fromCoach?.lastName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {format(new Date(message.createdAt), 'MMM d, h:mm a')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getPriorityIcon(message.priority)}
                              <Badge variant={message.isRead ? "secondary" : "default"}>
                                {message.messageType}
                              </Badge>
                            </div>
                          </div>
                          
                          {message.subject && (
                            <h4 className="font-medium mb-2">{message.subject}</h4>
                          )}
                          
                          <p className="text-sm text-gray-700 mb-3">{message.message}</p>
                          
                          {message.parentReply && (
                            <div className="bg-gray-50 p-3 rounded border-l-4 border-primary-500">
                              <p className="text-sm text-gray-700">{message.parentReply}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Replied {format(new Date(message.repliedAt), 'MMM d, h:mm a')}
                              </p>
                            </div>
                          )}
                          
                          {!message.parentReply && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MessageSquare className="w-4 h-4 mr-2" />
                                  Reply
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Reply to Coach</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="reply">Your Reply</Label>
                                    <Textarea
                                      id="reply"
                                      value={replyMessage}
                                      onChange={(e) => setReplyMessage(e.target.value)}
                                      placeholder="Type your reply here..."
                                      rows={4}
                                    />
                                  </div>
                                  <div className="flex justify-end space-x-2">
                                    <Button variant="outline">Cancel</Button>
                                    <Button>Send Reply</Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      ))}
                      {(!coachMessages || coachMessages.length === 0) && (
                        <div className="text-center py-8">
                          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Messages Yet</h3>
                          <p className="text-gray-500">Your coaches will send updates and feedback here.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Videos Tab */}
              <TabsContent value="videos" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Videos</CardTitle>
                    <CardDescription>Your training highlights and technique analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {videoHighlights?.map((video) => (
                        <div key={video.id} className="border rounded-lg overflow-hidden">
                          <div className="aspect-video bg-gray-100 flex items-center justify-center">
                            <PlayCircle className="w-12 h-12 text-gray-400" />
                          </div>
                          <div className="p-4">
                            <h4 className="font-medium mb-2">{video.title}</h4>
                            {video.description && (
                              <p className="text-sm text-gray-600 mb-2">{video.description}</p>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                {format(new Date(video.createdAt), 'MMM d, yyyy')}
                              </span>
                              <Button size="sm" variant="outline">
                                <PlayCircle className="w-4 h-4 mr-2" />
                                Watch
                              </Button>
                            </div>
                            {video.skillsHighlighted && video.skillsHighlighted.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-1">
                                {video.skillsHighlighted.map((skill, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {(!videoHighlights || videoHighlights.length === 0) && (
                        <div className="col-span-full text-center py-8">
                          <PlayCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Videos Yet</h3>
                          <p className="text-gray-500">Your coaches will create video highlights of your training.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}