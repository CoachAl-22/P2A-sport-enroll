import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { Link, useLocation } from "wouter";
import { WaitlistButton } from "@/components/waitlist-button";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { APPLICATION_ONLY_PROGRAMS } from "@/lib/constants";

// ── Sport-type → hero image ────────────────────────────────────────────────
const SPORT_IMAGES: Record<string, string> = {
  foundation_prep_year2:    "/images/coach-georgia-crew.jpg",
  emerging_year3_6:         "/images/ashton-xcr.jpg",
  academy_year7_above:      "/images/junior-academy.jpg",
  junior_development:       "/images/junior-academy.jpg",
  senior_squad:             "/images/the-archers.jpg",
  empowered_athlete_program:"/images/high-performance-1.jpg",
  competition_ready:        "/images/high-performance-2.jpg",
  team_sport_speed:         "/images/team-sport-running.jpg",
  team_sport_athletes:      "/images/team-sport-running.jpg",
};

// ── Sport-type → display label ────────────────────────────────────────────
const PROGRAM_LABELS: Record<string, string> = {
  foundation_prep_year2:    "Foundation Class",
  emerging_year3_6:         "Emerging Athletes",
  academy_year7_above:      "Junior Academy",
  junior_development:       "Junior Development",
  team_sport_athletes:      "Team Sport Athletes",
  team_sport_speed:         "Team Sport Speed",
  senior_squad:             "Senior Squad",
  competition_ready:        "Competition Ready",
  empowered_athlete_program:"Elite HP Squad",
  basketball:               "Basketball",
  soccer:                   "Soccer",
  tennis:                   "Tennis",
  swimming:                 "Swimming",
  athletics:                "Athletics",
  netball:                  "Netball",
  cricket:                  "Cricket",
  volleyball:               "Volleyball",
  multi_sport:              "Multi-Sport",
};

// Setmore booking link for Team Sport Speed casual sessions
const TSS_SETMORE_URL = "https://power2adapt.setmore.com/";

// Programs that are term enrolment only (no casual option)
const TERM_ONLY_PROGRAMS = ["foundation_prep_year2", "emerging_year3_6"];

// Format "16:30" → "4:30pm"
const formatTime = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${m.toString().padStart(2, "0")}${ampm}`;
};

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

  const getStatusInfo = () => {
    const spotsLeft = classData.maxCapacity - classData.currentEnrollment;
    if (spotsLeft > 0) {
      return { status: "Available", color: "bg-green-100 text-green-800", buttonText: "Book this class", buttonClass: "bg-primary-500 hover:bg-primary-600" };
    } else {
      return { status: "Waitlist", color: "bg-yellow-100 text-yellow-800", buttonText: "Join Waitlist", buttonClass: "bg-yellow-500 hover:bg-yellow-600" };
    }
  };

  const statusInfo = getStatusInfo();
  const spotsLeft = classData.spotsRemaining ?? Math.max(0, classData.maxCapacity - classData.currentEnrollment);
  const TERM3_OPENS = new Date("2026-06-05T00:00:00+10:00"); // AEST
  const isApplicationOnly = APPLICATION_ONLY_PROGRAMS.includes(classData.sportType);
  const isEnrollmentOpen = (classData.isEnrollmentOpen ?? true) && new Date() >= TERM3_OPENS;
  const isTeamSportSpeed = classData.sportType === "team_sport_speed";
  const isTermOnly = TERM_ONLY_PROGRAMS.includes(classData.sportType);
  const [, setLocation] = useLocation();

  const heroImage = classData.imageUrl || SPORT_IMAGES[classData.sportType];
  const programLabel = PROGRAM_LABELS[classData.sportType] || classData.sportType?.toUpperCase();

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary-500 transition-colors hover:shadow-lg flex flex-col">
      {/* Hero image */}
      {heroImage ? (
        <img
          src={heroImage}
          alt={`${programLabel} training session`}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center">
          <span className="text-white text-lg font-heading font-bold text-center px-4">{programLabel}</span>
        </div>
      )}

      <div className="p-6 flex flex-col flex-1">
        {/* Title + status */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-heading font-bold text-gray-900">{classData.name}</h3>
          <Badge className={statusInfo.color}>{statusInfo.status}</Badge>
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-600">
            <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="text-sm">{getDayName(classData.dayOfWeek)}s {formatTime(classData.startTime)} – {formatTime(classData.endTime)}</span>
          </div>
          <div className="flex items-start text-gray-600">
            <MapPin className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-sm">
              {classData.venue?.name || "Venue TBA"}
              {classData.venue?.address && (
                <span className="block text-xs text-gray-400">{classData.venue.address}</span>
              )}
            </span>
          </div>
          <div className="flex items-center text-gray-600">
            <Users className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="text-sm">
              Ages {classData.minAge}–{classData.maxAge} · {spotsLeft > 0 ? `${spotsLeft} spots left` : "Full class"}
            </span>
          </div>
          <div className="flex items-center text-gray-600">
            <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="text-sm">
              {new Date(classData.startDate).toLocaleDateString()} – {new Date(classData.endDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        {classData.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{classData.description}</p>
        )}

        {/* Pricing */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl font-heading font-bold text-primary-500">${parseFloat(classData.pricePerTerm).toFixed(0)} + GST</span>
            <span className="text-gray-500 text-sm">/term</span>
          </div>
          {classData.pricePerSession && classData.sessionCount ? (
            <p className="text-xs text-gray-500 mt-0.5">
              ${parseFloat(classData.pricePerSession).toFixed(0)}/session · {classData.sessionCount} sessions
            </p>
          ) : null}
          {isTermOnly && (
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5 font-medium">Term enrolment only</span>
            </div>
          )}
        </div>

        {/* CTA — pushed to bottom */}
        <div className="mt-auto space-y-2">
          {isApplicationOnly ? (
            <Button
              onClick={() => {
                if (classData.sportType === "senior_squad") {
                  window.open("/senior-squad-application.html", "_blank");
                } else if (classData.sportType === "empowered_athlete_program") {
                  setLocation("/high-performance#application-form");
                } else {
                  setLocation("/senior-squad");
                }
              }}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              Apply now →
            </Button>
          ) : !isEnrollmentOpen ? (
            <Button disabled className="w-full bg-gray-100 text-gray-400 cursor-not-allowed">
              Enrolments opening soon
            </Button>
          ) : spotsLeft > 0 ? (
            <>
              {/* Team Sport Speed: show "Book a casual session" via Setmore + term enrol */}
              {isTeamSportSpeed && (
                <Button
                  variant="outline"
                  className="w-full border-amber-400 text-amber-700 hover:bg-amber-50"
                  onClick={() => window.open(TSS_SETMORE_URL, "_blank", "noopener noreferrer")}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Book a casual session
                </Button>
              )}
              <Link href={`/enrollment/${classData.id}`}>
                <Button className="w-full bg-primary-500 hover:bg-primary-600 text-white">
                  {isTeamSportSpeed ? "Enrol for the full term →" : isTermOnly ? "Enrol for the term →" : "Book this class"}
                </Button>
              </Link>
            </>
          ) : (
            <div className="flex flex-col gap-1">
              {children.slice(0, 2).map((child: any) => {
                const waitlistEntry = waitlistEntries.find(
                  (entry: any) => entry.classId === classData.id && entry.childId === child.id
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
                <div className="text-xs text-gray-500 text-center">+{children.length - 2} more children</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
