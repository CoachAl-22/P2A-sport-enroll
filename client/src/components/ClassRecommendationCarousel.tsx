import { useState } from 'react';
import { ChevronLeft, ChevronRight, Star, Users, Calendar, MapPin, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RecommendationData {
  id: string;
  title: string;
  description: string;
  ageRange: string;
  benefits: string[];
  image: string;
  venue: string;
  spots: number;
  price: number;
  matchScore: number;
  funFact: string;
  emoji: string;
}

const sampleRecommendations: RecommendationData[] = [
  {
    id: '1',
    title: 'Foundation Movement & Fun',
    description: 'Perfect starter program for young athletes using games-based learning',
    ageRange: 'Prep - Year 2',
    benefits: ['Balance & Coordination', 'Social Skills', 'Confidence Building', 'Fun Games'],
    image: '/images/coach-georgia-crew.jpg',
    venue: 'Peninsula Grammar',
    spots: 12,
    price: 30,
    matchScore: 95,
    funFact: 'Did you know? Young athletes who start with movement games show 40% better coordination!',
    emoji: '🤸‍♀️'
  },
  {
    id: '2',
    title: 'Emerging Team Athletes',
    description: 'Develop team sport skills and athletic movement patterns',
    ageRange: 'Year 3 - 6',
    benefits: ['Team Skills', 'Sport Fundamentals', 'Leadership', 'Athletic Development'],
    image: '/images/ashton-xcr.jpg',
    venue: 'Toorak College',
    spots: 15,
    price: 30,
    matchScore: 88,
    funFact: 'Amazing! Kids in this program improve their running speed by an average of 25%!',
    emoji: '⚡'
  },
  {
    id: '3',
    title: 'Academy Performance',
    description: 'Elite development for dedicated young athletes',
    ageRange: 'Year 7+',
    benefits: ['Advanced Techniques', 'Mental Resilience', 'Competition Prep', 'Peak Performance'],
    image: '/images/georgia-goss-comp.jpg',
    venue: 'Ballam Park Athletic Track',
    spots: 10,
    price: 30,
    matchScore: 92,
    funFact: 'Incredible! Our academy athletes have gone on to represent their schools at state level!',
    emoji: '🏆'
  },
  {
    id: '4',
    title: 'Speed & Power Development',
    description: 'Explosive training for aspiring team sport athletes',
    ageRange: 'Year 5+',
    benefits: ['Speed Training', 'Power Development', 'Agility Skills', 'Competition Edge'],
    image: '/images/team-sport-running.jpg',
    venue: 'Mornington Athletic Track',
    spots: 8,
    price: 30,
    matchScore: 85,
    funFact: 'Wow! Athletes typically see 30% improvement in sprint times within 6 weeks!',
    emoji: '🚀'
  }
];

interface ClassRecommendationCarouselProps {
  onEnrollClick: () => void;
}

export function ClassRecommendationCarousel({ onEnrollClick }: ClassRecommendationCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalSlides = sampleRecommendations.length;

  const scrollPrev = () => {
    setCurrentIndex((prev) => prev === 0 ? totalSlides - 1 : prev - 1);
  };

  const scrollNext = () => {
    setCurrentIndex((prev) => prev === totalSlides - 1 ? 0 : prev + 1);
  };

  return (
    <section className="py-16 bg-gradient-to-r from-purple-50 via-blue-50 to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-purple-500 mr-3" />
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900">
              Perfect Program Finder
            </h2>
            <Sparkles className="w-8 h-8 text-purple-500 ml-3" />
          </div>
          <p className="text-xl text-gray-600 mb-4">
            Discover the ideal athletic program for your child's age and interests!
          </p>
          <div className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-md">
            <Star className="w-5 h-5 text-yellow-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">
              Personalized recommendations based on age and development
            </span>
          </div>
        </div>

        <div className="relative">
          {/* Carousel Container */}
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {sampleRecommendations.map((program, index) => (
                <div key={program.id} className="flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.333%] px-4">
                  <div className={`
                    bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl
                    ${index === currentIndex ? 'ring-4 ring-purple-300 ring-opacity-50' : ''}
                  `}>
                    {/* Match Score Badge */}
                    <div className="relative">
                      <img 
                        src={program.image} 
                        alt={program.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                        {program.matchScore}% Match! {program.emoji}
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Program Title */}
                      <div className="mb-4">
                        <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">
                          {program.title}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {program.description}
                        </p>
                      </div>

                      {/* Program Details */}
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center text-gray-600">
                          <Users className="w-4 h-4 mr-2 text-blue-500" />
                          <span className="text-sm font-medium">{program.ageRange} • {program.spots} spots available</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <MapPin className="w-4 h-4 mr-2 text-red-500" />
                          <span className="text-sm">{program.venue}</span>
                        </div>
                      </div>

                      {/* Benefits */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Benefits:</h4>
                        <div className="flex flex-wrap gap-1">
                          {program.benefits.slice(0, 3).map((benefit, idx) => (
                            <span 
                              key={idx}
                              className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                              {benefit}
                            </span>
                          ))}
                          {program.benefits.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{program.benefits.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Fun Fact */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-yellow-800 font-medium">
                          💡 {program.funFact}
                        </p>
                      </div>

                      {/* Price and Action */}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-heading font-bold text-purple-600">
                            ${program.price}
                          </span>
                          <span className="text-gray-500 text-sm"> + GST per class</span>
                        </div>
                        <Button 
                          onClick={onEnrollClick}
                          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow-lg transform transition-all hover:scale-105"
                        >
                          Start Journey! ✨
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={scrollPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-lg
              flex items-center justify-center transition-all duration-200
              hover:bg-purple-50 hover:shadow-xl text-gray-700 hover:text-purple-600"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={scrollNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-lg
              flex items-center justify-center transition-all duration-200
              hover:bg-purple-50 hover:shadow-xl text-gray-700 hover:text-purple-600"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center mt-8 space-x-2">
          {sampleRecommendations.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`
                w-3 h-3 rounded-full transition-all duration-200
                ${index === currentIndex 
                  ? 'bg-purple-500 scale-125' 
                  : 'bg-gray-300 hover:bg-purple-300'
                }
              `}
            />
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center px-6 py-3 bg-white rounded-full shadow-md">
            <Calendar className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">
              Term 3 enrollment now open • 9 weeks of expert coaching
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}