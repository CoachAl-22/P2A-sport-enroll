import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/navbar";
import AnalyticsCard from "@/components/admin/analytics-card";
import { Plus, Users, Settings, BarChart3, MessageSquare, CreditCard, TrendingUp, AlertCircle, FileText } from "lucide-react";
import { Redirect } from "wouter";

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/admin/analytics"],
    enabled: user?.role === "admin",
  });

  // Redirect if not admin
  if (!authLoading && user?.role !== "admin") {
    return <Redirect to="/" />;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Admin Command Center
          </h1>
          <p className="text-xl text-gray-300">
            Powerful tools for managing your athletic programs
          </p>
        </div>

        {/* Analytics Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Enrollment Analytics */}
          <AnalyticsCard
            title="Enrollment Analytics"
            icon={<Users className="w-6 h-6" />}
            loading={analyticsLoading}
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Total Enrolled</span>
                <span className="text-2xl font-bold text-green-400">
                  {analytics?.enrollment?.totalEnrolled || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">This Week</span>
                <span className="text-xl font-bold text-blue-400">
                  +{analytics?.enrollment?.thisWeek || 0}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full" 
                  style={{ width: `${analytics?.enrollment?.capacityPercentage || 0}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-400">
                {analytics?.enrollment?.capacityPercentage || 0}% capacity across all programs
              </p>
            </div>
          </AnalyticsCard>

          {/* Revenue Tracking */}
          <AnalyticsCard
            title="Revenue Tracking"
            icon={<CreditCard className="w-6 h-6" />}
            loading={analyticsLoading}
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">This Term</span>
                <span className="text-2xl font-bold text-secondary-500">
                  ${analytics?.revenue?.thisTerm?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Outstanding</span>
                <span className="text-xl font-bold text-yellow-400">
                  ${analytics?.revenue?.outstanding?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex items-center text-sm text-green-400">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>+{analytics?.revenue?.percentageChange || 0}% vs last term</span>
              </div>
            </div>
          </AnalyticsCard>

          {/* Communication Hub */}
          <AnalyticsCard
            title="Communication Hub"
            icon={<MessageSquare className="w-6 h-6" />}
            loading={false}
          >
            <div className="space-y-3">
              <Button className="w-full bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                Send Term Enrollment Reminder
              </Button>
              <Button asChild className="w-full bg-secondary-500 hover:bg-secondary-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                <a href="/admin/sms">
                  SMS Notifications
                </a>
              </Button>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                Generate Reports
              </Button>
              <div className="text-xs text-gray-400 pt-2">
                Last notification sent: 2 days ago
              </div>
            </div>
          </AnalyticsCard>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
          <Button className="bg-gray-800 hover:bg-gray-700 p-4 rounded-lg text-center transition-colors h-auto flex-col">
            <div className="text-primary-400 mb-2">
              <Plus className="w-6 h-6 mx-auto" />
            </div>
            <span className="text-sm font-medium">Add New Class</span>
          </Button>
          
          <Button className="bg-gray-800 hover:bg-gray-700 p-4 rounded-lg text-center transition-colors h-auto flex-col">
            <div className="text-secondary-400 mb-2">
              <Users className="w-6 h-6 mx-auto" />
            </div>
            <span className="text-sm font-medium">Manage Staff</span>
          </Button>
          
          <Button asChild className="bg-gray-800 hover:bg-gray-700 p-4 rounded-lg text-center transition-colors h-auto flex-col">
            <a href="/admin/blog">
              <div className="text-blue-400 mb-2">
                <FileText className="w-6 h-6 mx-auto" />
              </div>
              <span className="text-sm font-medium">Blog Management</span>
            </a>
          </Button>
          
          <Button className="bg-gray-800 hover:bg-gray-700 p-4 rounded-lg text-center transition-colors h-auto flex-col">
            <div className="text-green-400 mb-2">
              <BarChart3 className="w-6 h-6 mx-auto" />
            </div>
            <span className="text-sm font-medium">View Analytics</span>
          </Button>
          
          <Button className="bg-gray-800 hover:bg-gray-700 p-4 rounded-lg text-center transition-colors h-auto flex-col">
            <div className="text-yellow-400 mb-2">
              <Settings className="w-6 h-6 mx-auto" />
            </div>
            <span className="text-sm font-medium">Settings</span>
          </Button>
        </div>

        {/* Recent Activity */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-center justify-between py-2 border-b border-gray-700">
                <span className="text-sm">New enrollment: Alex Johnson - Basketball Elite</span>
                <span className="text-xs text-gray-400">2 minutes ago</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-700">
                <span className="text-sm">Payment received: $280 from Sarah Johnson</span>
                <span className="text-xs text-gray-400">15 minutes ago</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-700">
                <span className="text-sm">Class capacity updated: Soccer Champions now full</span>
                <span className="text-xs text-gray-400">1 hour ago</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm">New venue added: Northcote Primary School</span>
                <span className="text-xs text-gray-400">3 hours ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
