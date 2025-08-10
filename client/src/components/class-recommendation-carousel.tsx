import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, MapPin, Clock, Users, Star, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

// Type for API class response
interface ApiClass {
  id: string;
  name: string;
  program: string;
  venue?: { name: string };
  dayOfWeek: string;
  startTime: string;
  minAge: number;
  maxAge: number;
  maxCapacity: number;
  termPrice: number;
  coach?: { firstName: string; lastName: string };
  enrollments?: any[];
}

interface ClassRecommendation {
  id: string;
  name: string;
  program: string;
  venue: string;
  day: string;
  time: string;
  ageRange: string;
  spots: number;
  maxCapacity: number;
  price: number;
  coach: string;
  description: string;
  highlights: string[];
  color: string;
  icon: string;
}

interface ClassRecommendationCarouselProps {
  onEnrollClick?: (classId: string) => void;
}

export default function ClassRecommendationCarousel({ onEnrollClick }: ClassRecommendationCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["/api/classes"],
  });

  // Transform classes into recommendation format
  const recommendations: ClassRecommendation[] = (classes as ApiClass[]).map((cls) => ({
    id: cls.id,
    name: cls.name,
    program: cls.program,
    venue: cls.venue?.name || "TBA",
    day: cls.dayOfWeek,
    time: cls.startTime,
    ageRange: `${cls.minAge}-${cls.maxAge} years`,
    spots: cls.maxCapacity - (cls.enrollments?.length || 0),
    maxCapacity: cls.maxCapacity,
    price: cls.termPrice,
    coach: cls.coach?.firstName + " " + cls.coach?.lastName || "TBA",
    description: getClassDescription(cls.program),
    highlights: getClassHighlights(cls.program),
    color: getProgramColor(cls.program),
    icon: getProgramIcon(cls.program),
  }));

  // Auto-rotation effect
  useEffect(() => {
    if (!isAutoPlaying || recommendations.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % recommendations.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, recommendations.length]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % recommendations.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + recommendations.length) % recommendations.length);
    setIsAutoPlaying(false);
  };

  const toggleFavorite = (classId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(classId)) {
        newFavorites.delete(classId);
      } else {
        newFavorites.add(classId);
      }
      return newFavorites;
    });
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded-md mb-4 w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No Classes Available</h3>
        <p className="text-gray-500">Check back soon for exciting new programs!</p>
      </div>
    );
  }

  const currentClass = recommendations[currentIndex];

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-heading font-bold text-gray-900 mb-2">
          Perfect Programs for Your Child
        </h2>
        <p className="text-gray-600">
          Discover engaging athletics programs designed to build confidence and skills
        </p>
      </div>

      <div className="relative">
        {/* Main Carousel */}
        <div className="relative overflow-hidden rounded-2xl shadow-xl bg-white">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="p-8"
              style={{ background: `linear-gradient(135deg, ${currentClass.color}15 0%, ${currentClass.color}05 100%)` }}
            >
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Content Side */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl"
                      style={{ backgroundColor: currentClass.color }}
                    >
                      {currentClass.icon}
                    </div>
                    <div>
                      <Badge variant="secondary" className="mb-2">
                        {currentClass.program}
                      </Badge>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {currentClass.name}
                      </h3>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {currentClass.description}
                  </p>

                  {/* Highlights */}
                  <div className="space-y-2 mb-6">
                    {currentClass.highlights.map((highlight, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm text-gray-700">{highlight}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => onEnrollClick?.(currentClass.id)}
                      className="flex-1"
                      style={{ backgroundColor: currentClass.color }}
                    >
                      Enroll Now - ${currentClass.price}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleFavorite(currentClass.id)}
                      className={favorites.has(currentClass.id) ? "text-red-500 border-red-200" : ""}
                    >
                      <Heart className={`w-4 h-4 ${favorites.has(currentClass.id) ? "fill-current" : ""}`} />
                    </Button>
                  </div>
                </div>

                {/* Details Side */}
                <div className="space-y-4">
                  <Card className="border-0 shadow-md">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Class Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{currentClass.venue}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{currentClass.day}s at {currentClass.time}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">
                          Ages {currentClass.ageRange} • {currentClass.spots} spots left
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">Coach</p>
                        <p className="font-semibold text-gray-900">{currentClass.coach}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows */}
          <Button
            variant="ghost"
            size="icon"
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-md"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-md"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center mt-6 space-x-2">
          {recommendations.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx);
                setIsAutoPlaying(false);
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex 
                  ? 'bg-primary-500 w-8' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        {/* Auto-play indicator */}
        <div className="text-center mt-4">
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            {isAutoPlaying ? "⏸️ Pause" : "▶️ Auto-play"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getClassDescription(program: string): string {
  const descriptions = {
    "Foundation Movement & Skills": "Fun games-based learning that builds fundamental movement patterns and athletic skills through play.",
    "Emerging Athletes": "Development-focused training that enhances coordination, speed, and team sport readiness.",
    "Academy Performance": "Advanced athletic development for serious young athletes preparing for competitive sports.",
    "Team Sport Speed": "Specialized speed and agility training designed for team sport athletes.",
    "The Empowered Athlete Program": "Holistic athletic development combining physical training with mental skills and leadership."
  };
  return descriptions[program as keyof typeof descriptions] || "Comprehensive athletic development program.";
}

function getClassHighlights(program: string): string[] {
  const highlights = {
    "Foundation Movement & Skills": [
      "Games-based learning approach",
      "Builds confidence through play",
      "Fundamental movement development"
    ],
    "Emerging Athletes": [
      "Team sport performance focus",
      "Coordination and agility training",
      "Age-appropriate skill building"
    ],
    "Academy Performance": [
      "Advanced athletic techniques",
      "Competition preparation",
      "Elite development pathway"
    ],
    "Team Sport Speed": [
      "Sport-specific speed training",
      "Agility and reaction time",
      "Performance enhancement"
    ],
    "The Empowered Athlete Program": [
      "Physical and mental development",
      "Leadership skills training",
      "Holistic athlete approach"
    ]
  };
  return highlights[program as keyof typeof highlights] || ["Expert coaching", "Skill development", "Fun environment"];
}

function getProgramColor(program: string): string {
  const colors = {
    "Foundation Movement & Skills": "#10B981", // Green
    "Emerging Athletes": "#3B82F6", // Blue
    "Academy Performance": "#8B5CF6", // Purple
    "Team Sport Speed": "#F59E0B", // Orange
    "The Empowered Athlete Program": "#EF4444" // Red
  };
  return colors[program as keyof typeof colors] || "#6B7280";
}

function getProgramIcon(program: string): string {
  const icons = {
    "Foundation Movement & Skills": "🏃",
    "Emerging Athletes": "⚡",
    "Academy Performance": "🏆",
    "Team Sport Speed": "💨",
    "The Empowered Athlete Program": "🌟"
  };
  return icons[program as keyof typeof icons] || "🏃";
}