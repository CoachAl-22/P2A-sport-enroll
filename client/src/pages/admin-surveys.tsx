import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/navbar";
import { Eye, Search, ClipboardList, Star } from "lucide-react";
import { Redirect } from "wouter";
import { format } from "date-fns";
import type { SurveyResponse } from "@shared/schema";

function ScaleBar({ value, max = 10 }: { value: number; max?: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{value}/{max}</span>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value?: string | string[] | number | null }) {
  if (value === null || value === undefined || value === "") return null;
  const display = Array.isArray(value) ? value.join(", ") : String(value);
  if (!display) return null;
  return (
    <div className="mb-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-gray-800">{display}</p>
    </div>
  );
}

function SurveyDialog({ response, open, onClose }: { response: SurveyResponse | null; open: boolean; onClose: () => void }) {
  if (!response) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            {response.studentName || "Anonymous"} — Check-In Survey
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          {/* Identity */}
          <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-3">
            <DetailItem label="Name" value={response.studentName} />
            <DetailItem label="Class" value={response.studentClass} />
            <DetailItem label="Athlete Level" value={response.athleteLevel} />
            <DetailItem label="Days Active" value={response.daysActive} />
          </div>

          {/* Sports & Activities */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Sports &amp; Activities</p>
            <DetailItem label="Outside Sports" value={response.outsideSports} />
            <DetailItem label="Other Sports" value={response.otherSports} />
            <DetailItem label="Running Enjoyed" value={response.runningEnjoyed} />
            <DetailItem label="Field Events Interested In" value={response.fieldEventsInterested} />
          </div>

          {/* Feelings */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Engagement &amp; Feelings</p>
            <div className="mb-3">
              <p className="text-xs text-gray-400 mb-1">Running Enjoyment</p>
              <ScaleBar value={response.runningEnjoymentScale} />
            </div>
            <div className="mb-3">
              <p className="text-xs text-gray-400 mb-1">Overall Engagement</p>
              <ScaleBar value={response.engagementScale} />
            </div>
            <div className="mb-3">
              <p className="text-xs text-gray-400 mb-1">Excitement Level</p>
              <ScaleBar value={response.excitementLevel} />
            </div>
            <DetailItem label="Hardest Part" value={response.hardestPart} />
            <DetailItem label="Fun Factors" value={response.funFactors} />
            <DetailItem label="Competing Feel" value={response.competingFeel} />
          </div>

          {/* Goals */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Goals &amp; Aspirations</p>
            <DetailItem label="Goals" value={response.goals} />
            <DetailItem label="Specific Event" value={response.specificEvent} />
            <DetailItem label="Awesome Factor" value={response.awesomeFactor} />
          </div>

          {/* Health */}
          {response.injuryInfo && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-1">Injury / Health Info</p>
              <p className="text-sm text-orange-900">{response.injuryInfo}</p>
            </div>
          )}

          {response.createdAt && (
            <p className="text-xs text-gray-400 pt-2 border-t">
              Submitted: {format(new Date(response.createdAt), "dd MMM yyyy, h:mm a")}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminSurveys() {
  const { user, isLoading: authLoading } = useAuth();
  const [selected, setSelected] = useState<SurveyResponse | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");

  if (!authLoading && user?.role !== "admin") {
    return <Redirect to="/" />;
  }

  const { data: responses = [], isLoading } = useQuery<SurveyResponse[]>({
    queryKey: ["/api/survey-responses"],
    enabled: user?.role === "admin",
  });

  const filtered = responses.filter((r) => {
    const term = search.toLowerCase();
    return (
      !term ||
      (r.studentName ?? "").toLowerCase().includes(term) ||
      r.studentClass.toLowerCase().includes(term) ||
      r.athleteLevel.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Athlete Check-In Surveys</h1>
            <p className="text-gray-500 text-sm mt-1">
              Responses from the Running Improvement Check-In questionnaire — also synced to Google Sheets
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-blue-100 text-blue-800 text-sm px-3 py-1">
              {responses.length} total response{responses.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, class, or level…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-16 text-center text-gray-400 text-sm">Loading responses…</div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">{search ? "No results match your search" : "No survey responses yet"}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-gray-500 uppercase tracking-wide">
                      <th className="text-left py-3 px-4 font-semibold">Name</th>
                      <th className="text-left py-3 px-4 font-semibold">Class</th>
                      <th className="text-left py-3 px-4 font-semibold">Level</th>
                      <th className="text-left py-3 px-4 font-semibold">Enjoyment</th>
                      <th className="text-left py-3 px-4 font-semibold">Engagement</th>
                      <th className="text-left py-3 px-4 font-semibold">Excitement</th>
                      <th className="text-left py-3 px-4 font-semibold">Submitted</th>
                      <th className="text-left py-3 px-4 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-medium">{r.studentName || <span className="text-gray-400 italic">Anonymous</span>}</td>
                        <td className="py-3 px-4 text-gray-600">{r.studentClass}</td>
                        <td className="py-3 px-4">
                          <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">{r.athleteLevel}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-400" />
                            <span>{r.runningEnjoymentScale}/10</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">{r.engagementScale}/10</td>
                        <td className="py-3 px-4">{r.excitementLevel}/10</td>
                        <td className="py-3 px-4 text-gray-500">
                          {r.createdAt ? format(new Date(r.createdAt), "dd MMM yyyy") : "—"}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setSelected(r); setDialogOpen(true); }}
                          >
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <SurveyDialog response={selected} open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
