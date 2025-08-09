import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/layout/navbar";
import { Redirect } from "wouter";
import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import {
  Users, DollarSign, TrendingUp, Calendar, Download, Filter,
  Clock, MapPin, Target, Award, AlertTriangle, CheckCircle
} from "lucide-react";

export default function Analytics() {
  const { user, isLoading: authLoading } = useAuth();
  const [timeRange, setTimeRange] = useState("current_term");
  const [selectedVenue, setSelectedVenue] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");

  // Analytics data queries
  const { data: enrollmentAnalytics, isLoading: enrollmentLoading } = useQuery({
    queryKey: ["/api/analytics/enrollments", timeRange, selectedVenue, selectedProgram],
    enabled: (user as any)?.role === "admin",
  });

  const { data: revenueAnalytics, isLoading: revenueLoading } = useQuery({
    queryKey: ["/api/analytics/revenue", timeRange, selectedVenue, selectedProgram],
    enabled: (user as any)?.role === "admin",
  });

  const { data: classAnalytics, isLoading: classLoading } = useQuery({
    queryKey: ["/api/analytics/classes", timeRange, selectedVenue, selectedProgram],
    enabled: (user as any)?.role === "admin",
  });

  const { data: coachAnalytics, isLoading: coachLoading } = useQuery({
    queryKey: ["/api/analytics/coaches", timeRange],
    enabled: (user as any)?.role === "admin",
  });

  const { data: venues } = useQuery({
    queryKey: ["/api/venues"],
    enabled: (user as any)?.role === "admin",
  });

  // Redirect if not admin
  if (!authLoading && (user as any)?.role !== "admin") {
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

  const programOptions = [
    { value: "", label: "All Programs" },
    { value: "foundation_prep_year2", label: "Foundation - Prep - Year 2" },
    { value: "emerging_year3_6", label: "Emerging - Year 3 - 6" },
    { value: "academy_year7_above", label: "Academy - Year 7 & Above" },
    { value: "team_sport_speed", label: "Team Sport Speed" },
    { value: "senior_squad", label: "Senior Squad" },
    { value: "empowered_athlete_program", label: "The Empowered Athlete Program" },
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const exportData = () => {
    // Implement CSV export functionality
    console.log("Exporting analytics data...");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-heading font-bold text-gray-900">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Comprehensive insights into your athletic programs
              </p>
            </div>
            <Button onClick={exportData} className="bg-primary-500 hover:bg-primary-600">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_term">Current Term</SelectItem>
                  <SelectItem value="last_term">Last Term</SelectItem>
                  <SelectItem value="year_to_date">Year to Date</SelectItem>
                  <SelectItem value="last_year">Last Year</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedVenue} onValueChange={setSelectedVenue}>
                <SelectTrigger>
                  <SelectValue placeholder="All Venues" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Venues</SelectItem>
                  {(venues as any[])?.map((venue: any) => (
                    <SelectItem key={venue.id} value={venue.id}>
                      {venue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                <SelectTrigger>
                  <SelectValue placeholder="All Programs" />
                </SelectTrigger>
                <SelectContent>
                  {programOptions.map((program) => (
                    <SelectItem key={program.value} value={program.value}>
                      {program.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Enrollments</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {(enrollmentAnalytics as any)?.totalEnrollments || 0}
                  </p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +{(enrollmentAnalytics as any)?.enrollmentGrowth || 0}% vs last period
                  </p>
                </div>
                <Users className="w-8 h-8 text-primary-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ${(revenueAnalytics as any)?.totalRevenue?.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +{(revenueAnalytics as any)?.revenueGrowth || 0}% vs last period
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Active Classes</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {(classAnalytics as any)?.activeClasses || 0}
                  </p>
                  <p className="text-sm text-blue-600 flex items-center mt-1">
                    <Target className="w-4 h-4 mr-1" />
                    {(classAnalytics as any)?.averageCapacity || 0}% avg capacity
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Retention Rate</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {(enrollmentAnalytics as any)?.retentionRate || 0}%
                  </p>
                  <p className="text-sm text-purple-600 flex items-center mt-1">
                    <Award className="w-4 h-4 mr-1" />
                    Industry leading
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Enrollment Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Enrollment Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={(enrollmentAnalytics as any)?.trends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="enrollments" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue by Program */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Program</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={(revenueAnalytics as any)?.byProgram || []}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="revenue"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {((revenueAnalytics as any)?.byProgram || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Class Performance & Coach Analytics */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Class Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Class Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={(classAnalytics as any)?.performance || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="className" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="capacity" fill="#10B981" name="Capacity %" />
                  <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Coach Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Coach Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(coachAnalytics as any)?.topCoaches?.map((coach: any, index: number) => (
                  <div key={coach.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{coach.name}</p>
                      <p className="text-sm text-gray-600">{coach.totalStudents} students</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">${coach.revenue}</p>
                      <p className="text-sm text-gray-600">{coach.satisfaction}% satisfaction</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Venue Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Venue Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={(classAnalytics as any)?.venuePerformance || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="venueName" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="enrollments" fill="#3B82F6" name="Enrollments" />
                <Bar dataKey="utilization" fill="#10B981" name="Utilization %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}