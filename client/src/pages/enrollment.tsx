import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/navbar";
import EnrollmentForm from "@/components/classes/enrollment-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Clock, DollarSign, ShieldCheck, ClipboardCheck } from "lucide-react";
import { APPLICATION_ONLY_PROGRAMS } from "@/lib/constants";
import { formatAustralianDate } from "@/lib/date-format";

export default function Enrollment() {
  const { classId } = useParams();

  const { data: classDetails, isLoading } = useQuery({
    queryKey: ["/api/classes", classId],
    queryFn: async () => {
      const response = await fetch(`/api/classes/${classId}`);
      if (!response.ok) throw new Error('Failed to fetch class details');
      return response.json();
    },
    enabled: !!classId,
  });

  const getDayName = (dayOfWeek: number) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[dayOfWeek];
  };

  const formatTime = (time?: string) => {
    if (!time) return "";
    const [hourValue, minuteValue] = time.split(":").map(Number);
    const suffix = hourValue >= 12 ? "pm" : "am";
    const hour = hourValue > 12 ? hourValue - 12 : hourValue === 0 ? 12 : hourValue;
    return `${hour}:${minuteValue.toString().padStart(2, "0")}${suffix}`;
  };

  const getStatusInfo = (classData: any) => {
    if (!classData?.class) return { status: "unknown", color: "bg-gray-100 text-gray-800", canEnroll: false };
    
    const { currentEnrollment, maxCapacity } = classData.class;
    const spotsLeft = maxCapacity - currentEnrollment;
    
    if (spotsLeft > 0) {
      return {
        status: "available",
        color: "bg-green-100 text-green-800",
        canEnroll: true,
        message: `${spotsLeft} spots available`
      };
    } else {
      return {
        status: "waitlist",
        color: "bg-yellow-100 text-yellow-800",
        canEnroll: true,
        message: "Join waitlist"
      };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!classDetails) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">Class not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(classDetails);
  const isApplicationOnly = APPLICATION_ONLY_PROGRAMS.includes(classDetails?.class?.sportType);

  if (isApplicationOnly) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">This is an application-only program</h1>
          <p className="text-gray-500 mb-8">
            Junior Academy, Senior Squad, and High Performance programs require an application. Our coaching team reviews all applications before offering a place.
          </p>
          <Link href={`/questionnaire?classId=${classId}&className=${encodeURIComponent(classDetails?.class?.name ?? '')}`}>
            <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 mb-3">
              Complete your application →
            </Button>
          </Link>
          <Link href="/classes">
            <Button variant="ghost" className="w-full text-gray-500">
              ← Back to classes
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">
            Class Enrolment
          </h1>
          <p className="text-gray-600">
            Confirm the class, athlete details, and payment information.
          </p>
        </div>

        <div className="mb-8 grid gap-3 sm:grid-cols-4">
          {["Class", "Athlete", "Review", "Payment"].map((label, index) => (
            <div key={label} className="rounded-xl border border-primary-100 bg-white px-3 py-3">
              <div className="flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${index === 0 ? "bg-primary-500 text-white" : "bg-primary-50 text-primary-700"}`}>
                  {index + 1}
                </div>
                <span className="text-sm font-semibold text-gray-900">{label}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Class Details */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-heading font-bold">
                    {classDetails.class?.name}
                  </CardTitle>
                  <Badge className={statusInfo.color}>
                    {statusInfo.status === "available" ? "Available" : "Waitlist"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {classDetails.class?.imageUrl && (
                  <img
                    src={classDetails.class.imageUrl}
                    alt={classDetails.class.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                )}
                
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="text-sm">
                      {classDetails.class && `${getDayName(classDetails.class.dayOfWeek)}s ${formatTime(classDetails.class.startTime)} - ${formatTime(classDetails.class.endTime)}`}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-sm">
                      {classDetails.venue?.name}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span className="text-sm">
                      Ages {classDetails.class?.minAge}-{classDetails.class?.maxAge} • {statusInfo.message}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span className="text-sm">
                      {(() => {
                        const s = classDetails.class?.startDate ? new Date(classDetails.class.startDate) : null;
                        const e = classDetails.class?.endDate ? new Date(classDetails.class.endDate) : null;
                        const weeks = s && e ? Math.max(1, Math.round((e.getTime() - s.getTime()) / (7 * 24 * 3600 * 1000)) + 1) : null;
                        return `${weeks ? `${weeks} weeks ` : ""}(${formatAustralianDate(classDetails.class?.startDate)} - ${formatAustralianDate(classDetails.class?.endDate)})`;
                      })()}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <DollarSign className="w-4 h-4 mr-2" />
                    <span className="text-sm">
                      ${classDetails.class?.pricePerTerm} AUD per term
                    </span>
                  </div>
                </div>

                {classDetails.class?.description && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">About this class</h4>
                    <p className="text-sm text-gray-600">
                      {classDetails.class.description}
                    </p>
                  </div>
                )}

                <div className="rounded-xl border border-green-100 bg-green-50 p-3">
                  <div className="mb-2 flex items-center gap-2 text-green-800">
                    <ShieldCheck className="h-4 w-4" />
                    <h4 className="text-sm font-semibold">Secure family details</h4>
                  </div>
                  <p className="text-xs leading-relaxed text-green-700">
                    Medical and emergency information is only used to support safe coaching and class administration.
                  </p>
                </div>

                {classDetails.coach && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Your Coach</h4>
                    <p className="text-sm text-gray-600">
                      {classDetails.coach.firstName} {classDetails.coach.lastName}
                    </p>
                    {classDetails.coach.bio && (
                      <p className="text-xs text-gray-500 mt-1">
                        {classDetails.coach.bio}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Enrollment Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-heading font-bold">
                  Enrolment Information
                </CardTitle>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-3">
                    <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" />
                    <p className="text-xs leading-relaxed text-gray-600">You can review every detail before payment.</p>
                  </div>
                  <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" />
                    <p className="text-xs leading-relaxed text-gray-600">Payments are handled through the secure checkout flow.</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <EnrollmentForm 
                  classId={classId!} 
                  classDetails={classDetails} 
                  canEnroll={statusInfo.canEnroll}
                  isWaitlist={statusInfo.status === "waitlist"}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
