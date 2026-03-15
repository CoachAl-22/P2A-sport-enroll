import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/layout/navbar";
import { Eye, User, Calendar, Phone, Mail, Trophy, Target, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Redirect } from "wouter";
import { format } from "date-fns";
import type { SeniorSquadApplication, HighPerformanceSquadApplication } from "@shared/schema";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  under_review: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  under_review: "Under Review",
  accepted: "Accepted",
  rejected: "Rejected",
};

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="mb-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-gray-800 whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function ApplicationDialog({
  application,
  program,
  open,
  onClose,
  onUpdate,
  isPending,
}: {
  application: SeniorSquadApplication | HighPerformanceSquadApplication | null;
  program: "senior-squad" | "high-performance-squad";
  open: boolean;
  onClose: () => void;
  onUpdate: (status: string, notes: string) => void;
  isPending: boolean;
}) {
  const [status, setStatus] = useState(application?.status ?? "pending");
  const [notes, setReviewNotes] = useState(application?.reviewNotes ?? "");

  if (!application) return null;

  const hp = application as HighPerformanceSquadApplication;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            {application.athleteFirstName} {application.athleteLastName}
            <span className="text-sm font-normal text-gray-500">— {program === "senior-squad" ? "Senior Squad" : "High Performance Squad"}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Athlete Info */}
          <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>DOB: {application.dateOfBirth}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-gray-400" />
              <span>Year: {application.schoolYear}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-gray-400" />
              <span>{application.athleteEmail}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-gray-400" />
              <span>{application.athletePhone}</span>
            </div>
          </div>

          {/* Parent Info */}
          {application.parentGuardianName && (
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Parent / Guardian</p>
              <p className="text-sm font-medium">{application.parentGuardianName}</p>
              {application.parentGuardianEmail && <p className="text-sm text-gray-600">{application.parentGuardianEmail}</p>}
              {application.parentGuardianPhone && <p className="text-sm text-gray-600">{application.parentGuardianPhone}</p>}
            </div>
          )}

          {/* Athletic Details */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1">
              <Trophy className="h-3 w-3" /> Athletic Background
            </p>
            <DetailRow label="Sports" value={application.currentSports} />
            <DetailRow label="Experience" value={application.athleticExperience} />
            <DetailRow label="Previous Clubs" value={application.previousClubs} />
            <DetailRow label="Personal Bests" value={application.personalBests} />
            {hp.competitionLevel && <DetailRow label="Competition Level" value={hp.competitionLevel} />}
            {hp.coachingHistory && <DetailRow label="Coaching History" value={hp.coachingHistory} />}
          </div>

          {/* Goals */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1">
              <Target className="h-3 w-3" /> Goals &amp; Motivation
            </p>
            <DetailRow label="Athletic Goals" value={application.athleticGoals} />
            <DetailRow label="Reason for Joining" value={(application as SeniorSquadApplication).reasonForJoining} />
            {hp.targetCompetitions && <DetailRow label="Target Competitions" value={hp.targetCompetitions} />}
            {hp.performanceAmbitions && <DetailRow label="Performance Ambitions" value={hp.performanceAmbitions} />}
            {hp.reasonForHighPerformance && <DetailRow label="Why High Performance" value={hp.reasonForHighPerformance} />}
          </div>

          {/* Commitment */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Availability &amp; Commitment
            </p>
            <DetailRow label="Training Commitment" value={application.trainingCommitment} />
            <DetailRow label="Available Days" value={(application as SeniorSquadApplication).availableDays} />
            {hp.currentTrainingLoad && <DetailRow label="Current Training Load" value={hp.currentTrainingLoad} />}
            {hp.timeAvailability && <DetailRow label="Time Availability" value={hp.timeAvailability} />}
            {hp.coachingType && <DetailRow label="Coaching Type Sought" value={hp.coachingType} />}
            {hp.specificNeeds && <DetailRow label="Specific Needs" value={hp.specificNeeds} />}
          </div>

          {/* Additional Notes */}
          {(application.additionalNotes || hp.injuries) && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Additional Info</p>
              {hp.injuries && <DetailRow label="Injuries / Medical" value={hp.injuries} />}
              <DetailRow label="Additional Notes" value={application.additionalNotes} />
            </div>
          )}

          {/* Submitted */}
          {application.createdAt && (
            <p className="text-xs text-gray-400">
              Submitted: {format(new Date(application.createdAt), "dd MMM yyyy, h:mm a")}
            </p>
          )}

          {/* Admin Decision */}
          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">Admin Decision</p>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Set status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Review notes (internal, not sent to applicant)"
              value={notes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={() => onUpdate(status, notes)} disabled={isPending}>
                {isPending ? "Saving..." : "Save Decision"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ApplicationTable({
  applications,
  onView,
}: {
  applications: (SeniorSquadApplication | HighPerformanceSquadApplication)[];
  onView: (app: SeniorSquadApplication | HighPerformanceSquadApplication) => void;
}) {
  if (applications.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <Trophy className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No applications yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-xs text-gray-500 uppercase tracking-wide">
            <th className="text-left py-3 px-4 font-semibold">Athlete</th>
            <th className="text-left py-3 px-4 font-semibold">Year</th>
            <th className="text-left py-3 px-4 font-semibold">Contact</th>
            <th className="text-left py-3 px-4 font-semibold">Submitted</th>
            <th className="text-left py-3 px-4 font-semibold">Status</th>
            <th className="text-left py-3 px-4 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app.id} className="border-b hover:bg-gray-50 transition-colors">
              <td className="py-3 px-4 font-medium">
                {app.athleteFirstName} {app.athleteLastName}
              </td>
              <td className="py-3 px-4 text-gray-600">{app.schoolYear}</td>
              <td className="py-3 px-4 text-gray-600">
                <div>{app.athleteEmail}</div>
                <div className="text-xs text-gray-400">{app.athletePhone}</div>
              </td>
              <td className="py-3 px-4 text-gray-500">
                {app.createdAt ? format(new Date(app.createdAt), "dd MMM yyyy") : "—"}
              </td>
              <td className="py-3 px-4">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[app.status] ?? "bg-gray-100 text-gray-700"}`}>
                  {STATUS_LABELS[app.status] ?? app.status}
                </span>
              </td>
              <td className="py-3 px-4">
                <Button variant="ghost" size="sm" onClick={() => onView(app)}>
                  <Eye className="h-4 w-4 mr-1" /> Review
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminApplications() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedApp, setSelectedApp] = useState<SeniorSquadApplication | HighPerformanceSquadApplication | null>(null);
  const [activeProgram, setActiveProgram] = useState<"senior-squad" | "high-performance-squad">("senior-squad");
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!authLoading && user?.role !== "admin") {
    return <Redirect to="/" />;
  }

  const { data: seniorApps = [], isLoading: seniorLoading } = useQuery<SeniorSquadApplication[]>({
    queryKey: ["/api/applications/senior-squad"],
    enabled: user?.role === "admin",
  });

  const { data: hpApps = [], isLoading: hpLoading } = useQuery<HighPerformanceSquadApplication[]>({
    queryKey: ["/api/applications/high-performance-squad"],
    enabled: user?.role === "admin",
  });

  const updateMutation = useMutation({
    mutationFn: async ({ program, id, status, reviewNotes }: { program: string; id: string; status: string; reviewNotes: string }) => {
      return await apiRequest("PUT", `/api/applications/${program}/${id}`, { status, reviewNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications/senior-squad"] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications/high-performance-squad"] });
      toast({ title: "Decision saved", description: "Application status has been updated." });
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update application.", variant: "destructive" });
    },
  });

  const handleView = (app: SeniorSquadApplication | HighPerformanceSquadApplication, program: "senior-squad" | "high-performance-squad") => {
    setSelectedApp(app);
    setActiveProgram(program);
    setDialogOpen(true);
  };

  const handleUpdate = (status: string, reviewNotes: string) => {
    if (!selectedApp) return;
    updateMutation.mutate({ program: activeProgram, id: selectedApp.id, status, reviewNotes });
  };

  const pendingSenior = seniorApps.filter((a) => a.status === "pending").length;
  const pendingHp = hpApps.filter((a) => a.status === "pending").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Program Applications</h1>
          <p className="text-gray-500 text-sm mt-1">Review and manage applications for premium programs</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Senior Squad</p>
                  <p className="text-2xl font-bold text-gray-900">{seniorApps.length}</p>
                  <p className="text-xs text-gray-400">{pendingSenior} pending review</p>
                </div>
                <Trophy className="h-8 w-8 text-blue-500 opacity-60" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">High Performance Squad</p>
                  <p className="text-2xl font-bold text-gray-900">{hpApps.length}</p>
                  <p className="text-xs text-gray-400">{pendingHp} pending review</p>
                </div>
                <Target className="h-8 w-8 text-orange-500 opacity-60" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Application Tabs */}
        <Card>
          <CardHeader className="pb-0">
            <Tabs defaultValue="senior-squad">
              <TabsList>
                <TabsTrigger value="senior-squad">
                  Senior Squad
                  {pendingSenior > 0 && (
                    <Badge className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-semibold">{pendingSenior}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="high-performance">
                  High Performance Squad
                  {pendingHp > 0 && (
                    <Badge className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-semibold">{pendingHp}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="senior-squad" className="mt-0">
                {seniorLoading ? (
                  <div className="py-12 text-center text-gray-400 text-sm">Loading applications...</div>
                ) : (
                  <ApplicationTable
                    applications={seniorApps}
                    onView={(app) => handleView(app, "senior-squad")}
                  />
                )}
              </TabsContent>

              <TabsContent value="high-performance" className="mt-0">
                {hpLoading ? (
                  <div className="py-12 text-center text-gray-400 text-sm">Loading applications...</div>
                ) : (
                  <ApplicationTable
                    applications={hpApps}
                    onView={(app) => handleView(app, "high-performance-squad")}
                  />
                )}
              </TabsContent>
            </Tabs>
          </CardHeader>
          <CardContent className="pt-0" />
        </Card>
      </div>

      <ApplicationDialog
        application={selectedApp}
        program={activeProgram}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onUpdate={handleUpdate}
        isPending={updateMutation.isPending}
      />
    </div>
  );
}
