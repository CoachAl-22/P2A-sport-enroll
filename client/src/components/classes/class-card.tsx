import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { Link } from "wouter";

interface ClassCardProps {
  classData: any;
}

export default function ClassCard({ classData }: ClassCardProps) {
  const getDayName = (dayOfWeek: number) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[dayOfWeek];
  };

  const getProgramLabel = (sportType: string) => {
    const programMap: Record<string, string> = {
      foundation_prep_year2: "Movement & Skill Foundation (via a Games approach)",
      emerging_year3_6: "Athletic Development - Year 3 - 6", 
      junior_development: "Junior Development",
      team_sport_athletes: "Team Sport Athletes",
      team_sport_speed: "Team Sport Speed",
      senior_squad: "Senior Squad",
      competition_ready: "Competition Ready",
      empowered_athlete_program: "The Empowered Athlete Program",
      basketball: "Basketball",
      soccer: "Soccer",
      tennis: "Tennis",
      swimming: "Swimming",
      athletics: "Athletics",
      netball: "Netball",
      cricket: "Cricket",
      volleyball: "Volleyball",
      multi_sport: "Multi-Sport",
    };
    return programMap[sportType] || sportType?.toUpperCase();
  };

  const getStatusInfo = () => {
    const spotsLeft = classData.maxCapacity - classData.currentEnrollment;
    
    if (spotsLeft > 0) {
      return {
        status: "Available",
        color: "bg-green-100 text-green-800",
        buttonText: "Enroll Now",
        buttonClass: "bg-primary-500 hover:bg-primary-600"
      };
    } else {
      return {
        status: "Waitlist",
        color: "bg-yellow-100 text-yellow-800",
        buttonText: "Join Waitlist",
        buttonClass: "bg-yellow-500 hover:bg-yellow-600"
      };
    }
  };

  const statusInfo = getStatusInfo();
  const spotsLeft = Math.max(0, classData.maxCapacity - classData.currentEnrollment);

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary-500 transition-colors hover:shadow-lg">
      {classData.imageUrl ? (
        <img 
          src={classData.imageUrl} 
          alt={`${classData.name} training session`}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center">
          <span className="text-white text-lg font-heading font-bold text-center px-4">
            {getProgramLabel(classData.sportType)}
          </span>
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-heading font-bold text-gray-900">
            {classData.name}
          </h3>
          <Badge className={statusInfo.color}>
            {statusInfo.status}
          </Badge>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span className="text-sm">
              {getDayName(classData.dayOfWeek)}s {classData.startTime} - {classData.endTime}
            </span>
          </div>
          
          <div className="flex items-center text-gray-600">
            <MapPin className="w-4 h-4 mr-2" />
            <span className="text-sm">
              {classData.venue?.name || 'Venue TBA'}
            </span>
          </div>
          
          <div className="flex items-center text-gray-600">
            <Users className="w-4 h-4 mr-2" />
            <span className="text-sm">
              Ages {classData.minAge}-{classData.maxAge} • {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full class'}
            </span>
          </div>

          <div className="flex items-center text-gray-600">
            <Clock className="w-4 h-4 mr-2" />
            <span className="text-sm">
              {new Date(classData.startDate).toLocaleDateString()} - {new Date(classData.endDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        {classData.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {classData.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-heading font-bold text-primary-500">
              ${classData.pricePerTerm} + GST
            </span>
            <span className="text-gray-500 text-sm">/per class</span>
          </div>
          <Link href={`/enrollment/${classData.id}`}>
            <Button className={`${statusInfo.buttonClass} text-white transition-colors`}>
              {statusInfo.buttonText}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
