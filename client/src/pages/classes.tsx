import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/layout/navbar";
import ClassCard from "@/components/classes/class-card";
import { Search, Filter } from "lucide-react";

export default function Classes() {
  const [filters, setFilters] = useState({
    sportType: "all",
    venueId: "all",
    term: "term_2",
    year: 2026,
    dayOfWeek: "all",
    search: "",
  });

  const { data: classes, isLoading } = useQuery({
    queryKey: ["/api/classes", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      
      const response = await fetch(`/api/classes?${params}`);
      if (!response.ok) throw new Error('Failed to fetch classes');
      return response.json();
    },
  });

  const { data: venues } = useQuery({
    queryKey: ["/api/venues"],
  });

  const programTypes = [
    { value: "foundation_prep_year2", label: "Foundation - Prep - Year 2" },
    { value: "emerging_year3_6", label: "Emerging - Year 3 - 6" },
    { value: "academy_year7_above", label: "Academy - Year 7 & Above" },
    { value: "team_sport_speed", label: "Team Sport Speed" },
    { value: "senior_squad", label: "Senior Squad" },
    { value: "empowered_athlete_program", label: "The Empowered Athlete Program" },
  ];

  const daysOfWeek = [
    { value: "1", label: "Monday" },
    { value: "2", label: "Tuesday" },
    { value: "3", label: "Wednesday" },
    { value: "4", label: "Thursday" },
    { value: "5", label: "Friday" },
    { value: "6", label: "Saturday" },
    { value: "7", label: "Sunday" },
  ];

  const [location] = useLocation();
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const quizAge = urlParams.get('age') ? parseInt(urlParams.get('age')!, 10) : null;
  const quizSportTypes = urlParams.get('sportTypes')?.split(',').filter(Boolean) ?? [];

  const filteredClasses = (classes ?? []).filter((classItem: any) => {
    // Text search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      if (!classItem.name.toLowerCase().includes(searchTerm) &&
          !classItem.description?.toLowerCase().includes(searchTerm)) {
        return false;
      }
    }
    // Quiz age filter
    if (quizAge !== null && (classItem.minAge > quizAge || classItem.maxAge < quizAge)) {
      return false;
    }
    // Quiz sport type filter
    if (quizSportTypes.length > 0 && !quizSportTypes.includes(classItem.sportType)) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">
            Programs Your Child Will Love
          </h1>
          <p className="text-xl text-gray-600">9 weeks of expert coaching designed for lasting success</p>
        </div>

        {/* Search and Filters */}
        <Card className="bg-gray-50 mb-8">
          <CardContent className="p-6">
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Find the perfect program for your child..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filter Grid */}
            <div className="grid md:grid-cols-4 gap-4">
              <Select
                value={filters.sportType}
                onValueChange={(value) => setFilters(prev => ({ ...prev, sportType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Programs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {programTypes.map(program => (
                    <SelectItem key={program.value} value={program.value}>
                      {program.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.venueId}
                onValueChange={(value) => setFilters(prev => ({ ...prev, venueId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Venues" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Venues</SelectItem>
                  {venues?.map((venue: any) => (
                    <SelectItem key={venue.id} value={venue.id}>
                      {venue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.dayOfWeek}
                onValueChange={(value) => setFilters(prev => ({ ...prev, dayOfWeek: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any Day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Day</SelectItem>
                  {daysOfWeek.map(day => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => setFilters({
                  sportType: "all",
                  venueId: "all",
                  term: "term_2",
                  year: 2026,
                  dayOfWeek: "all",
                  search: "",
                })}
                className="flex items-center"
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Classes Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : filteredClasses.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClasses.map((classItem: any) => (
              <ClassCard key={classItem.id} classData={classItem} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No classes found matching your criteria</p>
            <Button
              onClick={() => setFilters({
                sportType: "all",
                venueId: "all",
                term: "term_3",
                year: 2024,
                dayOfWeek: "all",
                search: "",
              })}
              className="bg-primary-500 hover:bg-primary-600"
            >
              Show All Classes
            </Button>
          </div>
        )}

        {/* Alternative Options */}
        <Card className="mt-12 bg-amber-50">
          <CardContent className="p-6">
            <h3 className="text-xl font-heading font-bold text-gray-900 mb-4">
              Can't find the perfect time? We have alternatives!
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-amber-500 mb-2">
                  <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900">Different Times</h4>
                <p className="text-sm text-gray-600">Same program, different schedule</p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-amber-500 mb-2">
                  <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900">Waitlist Priority</h4>
                <p className="text-sm text-gray-600">First in line for openings</p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-amber-500 mb-2">
                  <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900">Online Programs</h4>
                <p className="text-sm text-gray-600">Virtual training sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
