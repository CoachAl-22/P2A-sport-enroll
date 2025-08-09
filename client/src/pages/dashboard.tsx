import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/navbar";
import { Plus, Calendar, CreditCard, Bell } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["/api/enrollments"],
  });

  const { data: notifications } = useQuery({
    queryKey: ["/api/notifications"],
  });

  const getDayName = (dayOfWeek: number) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[dayOfWeek];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending_payment":
        return "bg-yellow-100 text-yellow-800";
      case "waitlist":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b">
          <div>
            <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">Your Family Dashboard</h1>
            <p className="text-gray-600">Supporting your child's athletic success every step of the way</p>
          </div>
          <div className="mt-4 md:mt-0">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              Account Active
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link href="/classes">
            <Card className="gradient-primary text-white hover:scale-105 transition-transform cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-3">
                  <Plus className="w-8 h-8" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-1">Find New Programs</h3>
                <p className="text-sm text-blue-100">Discover classes your child will love</p>
              </CardContent>
            </Card>
          </Link>
          
          <Card className="gradient-secondary text-white hover:scale-105 transition-transform cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-3">
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-1">Weekly Schedule</h3>
              <p className="text-sm text-orange-100">See what's coming up</p>
            </CardContent>
          </Card>
          
          <Card className="gradient-green text-white hover:scale-105 transition-transform cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-3">
                <CreditCard className="w-8 h-8" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-1">Payments & Billing</h3>
              <p className="text-sm text-green-100">Easy payment management</p>
            </CardContent>
          </Card>
        </div>

        {/* Current Enrollments */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-heading font-bold text-gray-900">
              Your Child's Current Programs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {enrollmentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
              </div>
            ) : enrollments && enrollments.length > 0 ? (
              <div className="space-y-4">
                {enrollments.map((enrollment: any) => (
                  <div key={enrollment.enrollment.id} className="bg-gray-50 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between">
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-900 mb-1">
                        {enrollment.class?.name || 'Unknown Class'}
                      </h5>
                      <p className="text-gray-600">
                        {enrollment.class && `${getDayName(enrollment.class.dayOfWeek)}s ${enrollment.class.startTime} - ${enrollment.class.endTime}`}
                        {enrollment.venue && ` | ${enrollment.venue.name}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {enrollment.coach && `Coach: ${enrollment.coach.firstName} ${enrollment.coach.lastName}`}
                      </p>
                      {enrollment.child && (
                        <p className="text-sm text-gray-500">
                          Student: {enrollment.child.firstName} {enrollment.child.lastName}
                        </p>
                      )}
                    </div>
                    <div className="mt-3 md:mt-0 flex items-center space-x-3">
                      <Badge className={getStatusColor(enrollment.enrollment.status)}>
                        {enrollment.enrollment.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      {enrollment.enrollment.status === 'pending_payment' && (
                        <Link href={`/checkout/${enrollment.enrollment.id}`}>
                          <Button size="sm" className="bg-secondary-500 hover:bg-secondary-600">
                            Pay Now
                          </Button>
                        </Link>
                      )}
                      <Button variant="ghost" size="sm" className="text-primary-500 hover:text-primary-700">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Ready to start your child's athletic journey?</p>
                <Link href="/classes">
                  <Button className="bg-primary-500 hover:bg-primary-600">
                    Explore Our Programs
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Notifications */}
        <Card className="bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg font-heading font-semibold text-primary-700 flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Enrollment Reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-secondary-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm text-gray-700">
                    <strong>Term 4 2024</strong> enrollment opens in 3 weeks
                  </p>
                  <p className="text-xs text-gray-500">
                    Auto-enrollment enabled for your current classes
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm text-gray-700">
                    Holiday program available during school break
                  </p>
                  <p className="text-xs text-gray-500">
                    Early bird pricing ends Friday
                  </p>
                </div>
              </div>
              {notifications && notifications.length > 0 && (
                <div className="pt-2 border-t border-blue-200">
                  <p className="text-xs text-gray-500 mb-2">Recent notifications:</p>
                  {notifications.slice(0, 3).map((notification: any) => (
                    <div key={notification.id} className="text-sm text-gray-600 mb-1">
                      {notification.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
