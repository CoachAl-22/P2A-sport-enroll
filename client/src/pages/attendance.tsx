import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/layout/navbar";
import { Calendar, CheckCircle, XCircle, Clock, Users } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Attendance() {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [attendanceData, setAttendanceData] = useState<any>({});
  const { toast } = useToast();

  // Get today's classes for the coach
  const { data: coachClasses = [], isLoading: classesLoading } = useQuery<any[]>({
    queryKey: ["/api/coach/classes"],
  });

  // Get attendance for selected class and date
  const { data: attendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ["/api/classes", selectedClass, "attendance", selectedDate],
    enabled: !!selectedClass && !!selectedDate,
    queryFn: async () => {
      const response = await fetch(`/api/classes/${selectedClass}/attendance/${selectedDate}`);
      if (!response.ok) throw new Error('Failed to fetch attendance');
      return response.json();
    },
  });

  // Mark attendance mutation
  const markAttendanceMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/attendance/mark", data);
    },
    onSuccess: () => {
      toast({
        title: "Attendance Updated",
        description: "Student attendance has been recorded successfully.",
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/classes", selectedClass, "attendance", selectedDate] 
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark attendance",
        variant: "destructive",
      });
    },
  });

  const handleAttendanceChange = (studentId: string, status: 'present' | 'absent' | 'late', absenceReason?: string, notes?: string) => {
    const attendanceRecord = {
      classId: selectedClass,
      studentId,
      date: selectedDate,
      status,
      absenceReason: status === 'absent' ? absenceReason : undefined,
      notes: notes || undefined,
    };

    markAttendanceMutation.mutate(attendanceRecord);
  };

  // Get today's date for filtering today's classes
  const today = new Date();
  const todayDayOfWeek = today.getDay() === 0 ? 7 : today.getDay(); // Convert Sunday from 0 to 7

  const todaysClasses = (coachClasses || []).filter((cls: any) => cls.dayOfWeek === todayDayOfWeek);

  const getDayName = (dayOfWeek: number) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[dayOfWeek === 7 ? 0 : dayOfWeek];
  };

  const absenceReasons = [
    { value: "illness", label: "Illness", creditsEligible: true },
    { value: "injury", label: "Injury", creditsEligible: true },
    { value: "family_emergency", label: "Family Emergency", creditsEligible: true },
    { value: "school_event", label: "School Event", creditsEligible: false },
    { value: "vacation", label: "Vacation", creditsEligible: false },
    { value: "other", label: "Other", creditsEligible: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">
            Attendance Management
          </h1>
          <p className="text-gray-600">Mark attendance for your classes</p>
        </div>

        {/* Today's Classes Overview */}
        {todaysClasses.length > 0 && (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-800">
                <Calendar className="w-5 h-5 mr-2" />
                Today's Classes ({getDayName(todayDayOfWeek)})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {todaysClasses.map((cls: any) => (
                  <div key={cls.id} className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                        <p className="text-sm text-gray-600">
                          {cls.startTime} - {cls.endTime} | {cls.venueName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {cls.currentEnrollments || 0} students enrolled
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          setSelectedClass(cls.id);
                          setSelectedDate(new Date().toISOString().split('T')[0]);
                        }}
                        variant={selectedClass === cls.id ? "default" : "outline"}
                      >
                        {selectedClass === cls.id ? "Selected" : "Take Attendance"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Class and Date Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Select Class and Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class
                </label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {(coachClasses || []).map((cls: any) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} - {getDayName(cls.dayOfWeek)}s {cls.startTime}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance List */}
        {selectedClass && selectedDate && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Student Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attendanceLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                </div>
              ) : attendance && attendance.length > 0 ? (
                <div className="space-y-4">
                  {attendance.map((record: any) => (
                    <AttendanceRow
                      key={record.student.id}
                      student={record.student}
                      attendance={record.attendance}
                      onAttendanceChange={handleAttendanceChange}
                      absenceReasons={absenceReasons}
                      isLoading={markAttendanceMutation.isPending}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No students found for this class and date
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function AttendanceRow({ 
  student, 
  attendance, 
  onAttendanceChange, 
  absenceReasons,
  isLoading 
}: {
  student: any;
  attendance: any;
  onAttendanceChange: (studentId: string, status: 'present' | 'absent' | 'late', absenceReason?: string, notes?: string) => void;
  absenceReasons: any[];
  isLoading: boolean;
}) {
  const [notes, setNotes] = useState(attendance?.notes || "");
  const [absenceReason, setAbsenceReason] = useState(attendance?.absenceReason || "");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800";
      case "absent":
        return "bg-red-100 text-red-800";
      case "late":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle className="w-4 h-4" />;
      case "absent":
        return <XCircle className="w-4 h-4" />;
      case "late":
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 border">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">
            {student.firstName} {student.lastName}
          </h4>
          <p className="text-sm text-gray-600">Age: {student.age}</p>
          {attendance && (
            <div className="flex items-center mt-2">
              <Badge className={getStatusColor(attendance.status)}>
                <span className="flex items-center">
                  {getStatusIcon(attendance.status)}
                  <span className="ml-1">{attendance.status.toUpperCase()}</span>
                </span>
              </Badge>
              {attendance.creditsEligible && (
                <Badge variant="outline" className="ml-2 text-green-600 border-green-600">
                  Credit Eligible
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 max-w-md space-y-3">
          {/* Attendance Buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={attendance?.status === "present" ? "default" : "outline"}
              onClick={() => onAttendanceChange(student.id, "present")}
              disabled={isLoading}
              className="flex-1"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Present
            </Button>
            <Button
              size="sm"
              variant={attendance?.status === "late" ? "default" : "outline"}
              onClick={() => onAttendanceChange(student.id, "late")}
              disabled={isLoading}
              className="flex-1"
            >
              <Clock className="w-4 h-4 mr-1" />
              Late
            </Button>
            <Button
              size="sm"
              variant={attendance?.status === "absent" ? "destructive" : "outline"}
              onClick={() => onAttendanceChange(student.id, "absent", absenceReason, notes)}
              disabled={isLoading}
              className="flex-1"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Absent
            </Button>
          </div>

          {/* Absence Reason */}
          {(attendance?.status === "absent" || attendance === null) && (
            <Select value={absenceReason} onValueChange={setAbsenceReason}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select absence reason" />
              </SelectTrigger>
              <SelectContent>
                {absenceReasons.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label} {reason.creditsEligible ? "(Credit Eligible)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Notes */}
          <Textarea
            placeholder="Add notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="text-sm"
            rows={2}
          />
        </div>
      </div>
    </div>
  );
}
