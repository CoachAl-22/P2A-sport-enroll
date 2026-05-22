import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { Link } from "wouter";
import { WaitlistButton } from "@/components/waitlist-button";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

interface ClassCardProps {
  classData: any;
}

export default function ClassCard({ classData }: ClassCardProps) {
  const { user } = useAuth();
  
  const { data: children = [] } = useQuery<any[]>({
    queryKey: ["/api/children"],
  });

  const { data: waitlistEntries = [] } = useQuery<any[]>({
    queryKey: ["/api/waitlist/parent"],
  });
  const getDayName = (dayOfWeek: number) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[dayOfWeek];
  };

  const getProgramLabel = (sportType: string) => {
    const programMap: Record<string, string> = {
      sprints: 'Sprints & Speed',
      athletics: 'Athletics',
      jumps: 'Jumps',
      throws: 'Throws',
      multi_event: 'Multi-Event',
      cross_country: 'Cross Country',
      general_fitness: 'General Fitness',
      team_sport_speed: 'Team Sport Speed',
      foundation_prep_year2: 'Foundation - Prep - Year 2',
      emerging_year3_6: 'Athletic Development - Year 3–6',
      junior_development: 'Junior Development',
      team_sport_athletes: 'Team Sport Athletes',
      senior_squad: 'Senior Squad',
      competition_ready: 'Competition Ready',
      empowered_athlete_program: 'The Empowered Athlete Program',
      basketball: 'Basketball',
      soccer: 'Soccer',
      tennis: 'Tennis',
      swimming: 'Swimming',
      netball: 'Netball',
      cricket: 'Cricket',
      volleyball: 'Volleyball',
      multi_sport: 'Multi-Sport',
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

          {classData.isEnrollmentOpen !== false && (
            <div className="flex gap-0.5 mt-1">
              {Array.from({ length: 10 }, (_, i) => {
                const filled = Math.round(((classData.currentEnrollment ?? 0) / (classData.maxCapacity ?? 1)) * 10);
                return (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full ${i < filled ? 'bg-blue-500' : 'bg-gray-200'}`}
                  />
                );
              })}
            </div>
          )}

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
          
          {classData.isEnrollmentOpen === false ? (
            <Button disabled className="bg-gray-100 text-gray-400 cursor-not-allowed">
              Enrolments opening soon
            </Button>
          ) : spotsLeft > 0 ? (
            <Link href={`/enrollment/${classData.id}`}>
              <Button className="bg-primary-500 hover:bg-primary-600 text-white transition-colors">
                Enrol now
              </Button>
            </Link>
          ) : (
            <div className="flex flex-col gap-1">
              {children.slice(0, 2).map((child: any) => {
                const waitlistEntry = waitlistEntries.find((entry: any) =>
                  entry.classId === classData.id && entry.childId === child.id
                );
                return (
                  <WaitlistButton
                    key={child.id}
                    classId={classData.id}
                    childId={child.id}
                    isOnWaitlist={!!waitlistEntry}
                    waitlistPosition={waitlistEntry?.position}
                    className="text-xs px-2 py-1"
                  />
                );
              })}
              {children.length > 2 && (
                <div className="text-xs text-gray-500 text-center">
                  +{children.length - 2} more children
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
