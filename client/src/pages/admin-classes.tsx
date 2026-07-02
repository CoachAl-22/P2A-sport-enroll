import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CLASS_PRESETS } from "@shared/class-presets";
import Navbar from "@/components/layout/navbar";
import { PlusIcon, EditIcon, TrashIcon, CalendarIcon, List, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Redirect } from "wouter";

const DAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
];

const PROGRAM_TYPES = [
  { value: "foundation_prep_year2", label: "Foundation (Prep–Year 2)", color: "green" },
  { value: "emerging_grades3_6", label: "Emerging (Grades 3–6)", color: "blue" },
  { value: "academy_year7_above", label: "Junior Academy (Year 6+)", color: "purple" },
  { value: "senior_squad", label: "Senior Squad", color: "orange" },
  { value: "empowered_athlete_program", label: "Empowered Athlete Program", color: "rose" },
  { value: "competition_ready", label: "Competition Ready", color: "yellow" },
  { value: "high_performance_squad", label: "High Performance Squad", color: "indigo" },
  { value: "power2adapt", label: "POWER2ADAPT", color: "teal" },
  { value: "team_sport_speed", label: "Team Sport Speed", color: "cyan" },
];

const COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  green:  { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300" },
  blue:   { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300" },
  purple: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-300" },
  orange: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300" },
  rose:   { bg: "bg-rose-100",   text: "text-rose-800",   border: "border-rose-300" },
  yellow: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-300" },
  indigo: { bg: "bg-indigo-100", text: "text-indigo-800", border: "border-indigo-300" },
  teal:   { bg: "bg-teal-100",   text: "text-teal-800",   border: "border-teal-300" },
  cyan:   { bg: "bg-cyan-100",   text: "text-cyan-800",   border: "border-cyan-300" },
};

function getProgramStyle(sportType: string) {
  const pt = PROGRAM_TYPES.find(p => p.value === sportType);
  if (!pt) return { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" };
  return COLOR_MAP[pt.color] || { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" };
}

function getProgramLabel(sportType: string) {
  return PROGRAM_TYPES.find(p => p.value === sportType)?.label || sportType || "—";
}

function formatTime(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

function termLabel(term: string) {
  return "Term " + term.replace("term_", "");
}

function addMinutes(time: string, mins: number) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${Math.floor(total / 60).toString().padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`;
}

const DEFAULT_TIME_SLOTS = [
  "14:00","14:30","15:00","15:30","16:00","16:30",
  "17:00","17:30","18:00","18:30","19:00","19:30",
];

const EMPTY_FORM = {
  name: "", description: "", sportType: "", venueId: "", coachId: "",
  term: "term_3", year: 2026, dayOfWeek: "", startTime: "", endTime: "",
  startDate: "", endDate: "",
  minAge: "", maxAge: "", maxCapacity: "", pricePerSession: "", isEnrollmentOpen: true,
  perWeekEnabled: false,
};

export default function AdminClasses() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState<"schedule" | "table">("schedule");
  const [selectedTerm, setSelectedTerm] = useState("term_3");
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });

  if (!authLoading && user?.role !== "admin") return <Redirect to="/" />;

  const { data: classes = [], isLoading: classesLoading } = useQuery<any[]>({
    queryKey: ["/api/classes"],
    enabled: user?.role === "admin",
  });
  const { data: venues = [] } = useQuery<any[]>({
    queryKey: ["/api/venues"],
    enabled: user?.role === "admin",
  });
  const { data: coaches = [] } = useQuery<any[]>({
    queryKey: ["/api/coaches"],
    enabled: user?.role === "admin",
  });

  // Term tabs: show years current-1 to current+1
  const termTabs = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const tabs: { year: number; term: string; hasData: boolean }[] = [];
    for (let y = Math.max(2024, currentYear - 1); y <= currentYear + 1; y++) {
      for (const t of ["term_1", "term_2", "term_3", "term_4"]) {
        const hasData = classes.some(c => c.term === t && c.year === y);
        tabs.push({ year: y, term: t, hasData });
      }
    }
    return tabs;
  }, [classes]);

  // Schedule classes
  const scheduleClasses = useMemo(() =>
    classes.filter(c =>
      c.term === selectedTerm &&
      c.year === selectedYear &&
      (!selectedVenueId || c.venueId === selectedVenueId)
    ), [classes, selectedTerm, selectedYear, selectedVenueId]);

  // Time slots: merge defaults with any actual times in the data
  const timeSlots = useMemo(() => {
    const actual = scheduleClasses.map(c => c.startTime).filter(Boolean);
    return Array.from(new Set([...DEFAULT_TIME_SLOTS, ...actual])).sort();
  }, [scheduleClasses]);

  // Table classes (with search)
  const tableClasses = useMemo(() => {
    if (!searchTerm) return classes;
    const s = searchTerm.toLowerCase();
    return classes.filter(c =>
      c.name?.toLowerCase().includes(s) ||
      c.sportType?.toLowerCase().includes(s) ||
      c.year?.toString().includes(s)
    );
  }, [classes, searchTerm]);

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/classes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      setIsDialogOpen(false);
      setFormData({ ...EMPTY_FORM });
      toast({ title: "Class created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PUT", `/api/classes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      setIsDialogOpen(false);
      setEditingClass(null);
      toast({ title: "Class updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/classes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({ title: "Class deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  function openAdd(prefill?: Partial<typeof EMPTY_FORM>) {
    setEditingClass(null);
    setFormData({ ...EMPTY_FORM, term: selectedTerm, year: selectedYear, ...prefill });
    setIsDialogOpen(true);
  }

  function openEdit(cls: any) {
    setEditingClass(cls);
    setFormData({
      name: cls.name || "",
      description: cls.description || "",
      sportType: cls.sportType || "",
      venueId: cls.venueId || "",
      coachId: cls.coachId || "",
      term: cls.term || "term_3",
      year: cls.year || 2026,
      dayOfWeek: cls.dayOfWeek?.toString() || "",
      startTime: cls.startTime || "",
      endTime: cls.endTime || "",
      startDate: cls.startDate ? new Date(cls.startDate).toISOString().split("T")[0] : "",
      endDate: cls.endDate ? new Date(cls.endDate).toISOString().split("T")[0] : "",
      minAge: cls.minAge?.toString() || "",
      maxAge: cls.maxAge?.toString() || "",
      maxCapacity: cls.maxCapacity?.toString() || "",
      pricePerSession: cls.pricePerSession?.toString() || "",
      perWeekEnabled: !!cls.perWeekEnabled,
      isEnrollmentOpen: cls.isEnrollmentOpen !== false,
    });
    setIsDialogOpen(true);
  }

  function handleCellClick(dayOfWeek: number, time: string) {
    openAdd({
      dayOfWeek: dayOfWeek.toString(),
      startTime: time,
      endTime: addMinutes(time, 60),
      venueId: selectedVenueId || "",
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...formData,
      year: parseInt(formData.year.toString()),
      dayOfWeek: parseInt(formData.dayOfWeek),
      minAge: parseInt(formData.minAge),
      maxAge: parseInt(formData.maxAge),
      maxCapacity: parseInt(formData.maxCapacity),
      pricePerSession: parseFloat(formData.pricePerSession) || undefined,
    };
    if (editingClass) {
      updateMutation.mutate({ id: editingClass.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const getVenueName = (id: string) => venues.find(v => v.id === id)?.name || "—";
  const getCoachName = (id: string) => {
    const c = coaches.find(c => c.id === id);
    return c ? `${c.firstName} ${c.lastName}` : "—";
  };
  const getDayName = (n: number) => DAYS.find(d => d.value === n)?.label || "?";

  if (authLoading || classesLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Class Management</h1>
            <p className="text-gray-500 text-sm mt-1">{classes.length} classes across all terms</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-white border rounded-lg overflow-hidden shadow-sm">
              <button
                onClick={() => setViewMode("schedule")}
                className={`px-3 py-2 text-sm font-medium flex items-center gap-1.5 transition-colors ${viewMode === "schedule" ? "bg-primary-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
              >
                <CalendarIcon className="w-4 h-4" /> Schedule
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-2 text-sm font-medium flex items-center gap-1.5 transition-colors ${viewMode === "table" ? "bg-primary-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
              >
                <List className="w-4 h-4" /> List
              </button>
            </div>
            <Button onClick={() => openAdd()}>
              <PlusIcon className="w-4 h-4 mr-2" /> Add Class
            </Button>
          </div>
        </div>

        {viewMode === "schedule" ? (
          /* ─── SCHEDULE VIEW ─── */
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            {/* Venue pills */}
            <div className="flex gap-2 px-4 py-3 border-b bg-gray-50 overflow-x-auto">
              <button
                onClick={() => setSelectedVenueId(null)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${!selectedVenueId ? "bg-primary-600 text-white shadow-sm" : "bg-white border text-gray-600 hover:bg-gray-100"}`}
              >
                All Venues
              </button>
              {venues.map(v => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVenueId(selectedVenueId === v.id ? null : v.id)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${selectedVenueId === v.id ? "bg-primary-600 text-white shadow-sm" : "bg-white border text-gray-600 hover:bg-gray-100"}`}
                >
                  {v.name}
                </button>
              ))}
            </div>

            {/* Term tabs */}
            <div className="flex overflow-x-auto border-b bg-white">
              {termTabs.map(({ year, term, hasData }) => {
                const active = term === selectedTerm && year === selectedYear;
                return (
                  <button
                    key={`${year}-${term}`}
                    onClick={() => { setSelectedTerm(term); setSelectedYear(year); }}
                    className={`relative px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors flex items-center gap-1.5
                      ${active
                        ? "border-primary-600 text-primary-700 bg-primary-50 font-semibold"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      } ${hasData ? "font-medium" : "opacity-60"}`}
                  >
                    {year} {termLabel(term)}
                    {hasData && (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Grid */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" style={{ minWidth: 900 }}>
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="w-[76px] px-3 py-2 text-xs font-medium text-gray-400 border-r text-left">Time</th>
                    {DAYS.map(day => (
                      <th key={day.value} className="px-2 py-2 text-sm font-semibold text-gray-700 border-r last:border-r-0 text-center min-w-[130px]">
                        {day.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map(time => {
                    const rowClasses = scheduleClasses.filter(c => c.startTime === time);
                    const hasAny = rowClasses.length > 0;
                    return (
                      <tr key={time} className={hasAny ? "" : "bg-gray-50/40"}>
                        <td className="px-3 py-2 text-xs font-medium text-gray-400 border-r border-b align-top whitespace-nowrap">
                          {formatTime(time)}
                        </td>
                        {DAYS.map(day => {
                          const cellClasses = rowClasses.filter(c => c.dayOfWeek === day.value);
                          return (
                            <td
                              key={day.value}
                              className="p-1.5 border-r border-b last:border-r-0 align-top cursor-pointer group transition-colors hover:bg-blue-50/40"
                              style={{ minHeight: 72 }}
                              onClick={() => cellClasses.length === 0 && handleCellClick(day.value, time)}
                            >
                              {cellClasses.map(cls => {
                                const style = getProgramStyle(cls.sportType);
                                const enrolled = cls.currentEnrollment || 0;
                                const cap = cls.maxCapacity || 1;
                                const pct = enrolled / cap;
                                const countColor = pct >= 1 ? "bg-red-500" : pct >= 0.75 ? "bg-amber-500" : "bg-green-500";
                                return (
                                  <div
                                    key={cls.id}
                                    onClick={e => { e.stopPropagation(); openEdit(cls); }}
                                    className={`rounded p-1.5 mb-1 border text-xs cursor-pointer hover:brightness-95 transition-all select-none ${style.bg} ${style.text} ${style.border}`}
                                  >
                                    <div className="font-semibold leading-tight line-clamp-2">{cls.name}</div>
                                    <div className="flex items-center justify-between mt-1 gap-1">
                                      <span className="opacity-60 text-[10px] truncate">{getVenueName(cls.venueId)}</span>
                                      <span className={`flex-shrink-0 text-[10px] font-bold text-white px-1.5 py-0.5 rounded ${countColor}`}>
                                        {enrolled}/{cap}
                                      </span>
                                    </div>
                                    {!cls.isEnrollmentOpen && (
                                      <div className="text-[10px] opacity-60 italic mt-0.5">Closed</div>
                                    )}
                                  </div>
                                );
                              })}
                              {cellClasses.length === 0 && (
                                <div className="h-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="flex flex-col items-center gap-0.5 text-blue-400">
                                    <PlusIcon className="w-4 h-4" />
                                    <span className="text-[10px]">Add</span>
                                  </div>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {scheduleClasses.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <CalendarIcon className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium text-gray-500">
                    No classes for {selectedYear} {termLabel(selectedTerm)}
                    {selectedVenueId ? ` at ${getVenueName(selectedVenueId)}` : ""}
                  </p>
                  <p className="text-xs mt-1 mb-5">Click any time slot to add a class, or use the button below</p>
                  <Button size="sm" onClick={() => openAdd()}>
                    <PlusIcon className="w-4 h-4 mr-2" /> Add first class
                  </Button>
                </div>
              )}
            </div>

            {/* Program legend */}
            {scheduleClasses.length > 0 && (
              <div className="px-4 py-2.5 border-t bg-gray-50 flex flex-wrap gap-2 items-center">
                <span className="text-xs text-gray-400 mr-1">Programs:</span>
                {PROGRAM_TYPES.map(pt => {
                  const style = COLOR_MAP[pt.color];
                  if (!classes.some(c => c.sportType === pt.value)) return null;
                  return (
                    <span key={pt.value} className={`text-xs px-2 py-0.5 rounded border ${style.bg} ${style.text} ${style.border}`}>
                      {pt.label}
                    </span>
                  );
                })}
                <span className="ml-auto text-xs text-gray-400 flex items-center gap-3">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-green-500 inline-block" /> Available</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500 inline-block" /> Almost full</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-500 inline-block" /> Full</span>
                </span>
              </div>
            )}
          </div>
        ) : (
          /* ─── LIST VIEW ─── */
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle>All Classes ({tableClasses.length})</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search classes…"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead>Coach</TableHead>
                    <TableHead>Spots</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Enrolment</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableClasses.map(cls => {
                    const style = getProgramStyle(cls.sportType);
                    const enrolled = cls.currentEnrollment || 0;
                    const cap = cls.maxCapacity || 1;
                    const pct = enrolled / cap;
                    return (
                      <TableRow key={cls.id}>
                        <TableCell>
                          <div className="font-medium text-sm">{cls.name}</div>
                          <div className="text-xs text-gray-400">Ages {cls.minAge}–{cls.maxAge} · {cls.year} {termLabel(cls.term)}</div>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-0.5 rounded border ${style.bg} ${style.text} ${style.border}`}>
                            {getProgramLabel(cls.sportType)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{getDayName(cls.dayOfWeek)}</div>
                          <div className="text-xs text-gray-500">{formatTime(cls.startTime)} – {formatTime(cls.endTime)}</div>
                        </TableCell>
                        <TableCell className="text-sm">{getVenueName(cls.venueId)}</TableCell>
                        <TableCell className="text-sm">{getCoachName(cls.coachId)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{enrolled}/{cap}</span>
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${pct >= 1 ? "bg-red-500" : pct >= 0.75 ? "bg-amber-500" : "bg-green-500"}`}
                                style={{ width: `${Math.min(100, pct * 100)}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">${cls.pricePerTerm}</TableCell>
                        <TableCell>
                          {cls.isEnrollmentOpen ? (
                            <Badge className="bg-green-100 text-green-800 text-xs border-0">Open</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Closed</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(cls)}>
                              <EditIcon className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm" variant="ghost" className="h-7 w-7 p-0"
                              onClick={() => window.confirm("Delete this class?") && deleteMutation.mutate(cls.id)}
                            >
                              <TrashIcon className="w-3.5 h-3.5 text-red-400" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {tableClasses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-10 text-gray-400">
                        No classes found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ─── ADD / EDIT DIALOG ─── */}
      <Dialog open={isDialogOpen} onOpenChange={open => { setIsDialogOpen(open); if (!open) setEditingClass(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClass ? "Edit Class" : "Add New Class"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {!editingClass && (
              <div className="rounded-lg border border-dashed p-3 bg-gray-50">
                <label className="text-sm font-medium">Choose a class template <span className="text-gray-400 font-normal">(optional — fills the fields below, all editable)</span></label>
                <Select
                  value=""
                  onValueChange={(key) => {
                    const preset = CLASS_PRESETS.find((p) => p.key === key);
                    if (!preset) return;
                    setFormData((prev) => ({
                      ...prev,
                      name: preset.name,
                      description: preset.description,
                      sportType: preset.sportType,
                      minAge: String(preset.minAge),
                      maxAge: String(preset.maxAge),
                      pricePerSession: preset.pricePerSession,
                      perWeekEnabled: preset.perWeekEnabled,
                    }));
                  }}
                >
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select a program template…" /></SelectTrigger>
                  <SelectContent>
                    {CLASS_PRESETS.map((p) => (
                      <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Class Name *</Label>
              <Input
                value={formData.name}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                required
                placeholder="e.g. Emerging Athletes – Ballam Park"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Program Type</Label>
                <Select value={formData.sportType} onValueChange={v => setFormData(p => ({ ...p, sportType: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                  <SelectContent>
                    {PROGRAM_TYPES.map(pt => (
                      <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Venue</Label>
                <Select value={formData.venueId} onValueChange={v => setFormData(p => ({ ...p, venueId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select venue" /></SelectTrigger>
                  <SelectContent>
                    {venues.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Term *</Label>
                <Select value={formData.term} onValueChange={v => setFormData(p => ({ ...p, term: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="term_1">Term 1</SelectItem>
                    <SelectItem value="term_2">Term 2</SelectItem>
                    <SelectItem value="term_3">Term 3</SelectItem>
                    <SelectItem value="term_4">Term 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Year *</Label>
                <Input
                  type="number"
                  value={formData.year}
                  onChange={e => setFormData(p => ({ ...p, year: parseInt(e.target.value) }))}
                  required
                />
              </div>
              <div>
                <Label>Day *</Label>
                <Select value={formData.dayOfWeek} onValueChange={v => setFormData(p => ({ ...p, dayOfWeek: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select day" /></SelectTrigger>
                  <SelectContent>
                    {DAYS.map(d => <SelectItem key={d.value} value={d.value.toString()}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time *</Label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={e => setFormData(p => ({ ...p, startTime: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>End Time *</Label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={e => setFormData(p => ({ ...p, endTime: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Term Start Date *</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={e => setFormData(p => ({ ...p, startDate: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>Term End Date *</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={e => setFormData(p => ({ ...p, endDate: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label>Min Age *</Label>
                <Input
                  type="number"
                  value={formData.minAge}
                  onChange={e => setFormData(p => ({ ...p, minAge: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>Max Age *</Label>
                <Input
                  type="number"
                  value={formData.maxAge}
                  onChange={e => setFormData(p => ({ ...p, maxAge: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>Capacity *</Label>
                <Input
                  type="number"
                  value={formData.maxCapacity}
                  onChange={e => setFormData(p => ({ ...p, maxCapacity: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>Per session rate ($) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 30"
                  value={formData.pricePerSession}
                  onChange={e => setFormData(p => ({ ...p, pricePerSession: e.target.value }))}
                  required
                />
                {formData.pricePerSession && formData.dayOfWeek && formData.startDate && formData.endDate && (() => {
                  const dow = parseInt(formData.dayOfWeek);
                  const jsDow = dow === 7 ? 0 : dow;
                  const start = new Date(formData.startDate as any);
                  const end = new Date(formData.endDate as any);
                  while (start.getDay() !== jsDow) start.setDate(start.getDate() + 1);
                  let sessions = 0; const cur = new Date(start);
                  while (cur <= end) { sessions++; cur.setDate(cur.getDate() + 7); }
                  const total = (parseFloat(formData.pricePerSession) * sessions).toFixed(0);
                  return <p className="text-xs text-gray-500 mt-1">→ {sessions} sessions · ${total}/term</p>;
                })()}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={!!formData.perWeekEnabled}
                onCheckedChange={v => setFormData(p => ({ ...p, perWeekEnabled: v }))}
              />
              <label className="text-sm">Offer per-week (fortnightly) enrolment</label>
            </div>

            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <Label>Coach</Label>
                <Select value={formData.coachId} onValueChange={v => setFormData(p => ({ ...p, coachId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select coach" /></SelectTrigger>
                  <SelectContent>
                    {coaches.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 pb-0.5">
                <Switch
                  id="enroll-open"
                  checked={formData.isEnrollmentOpen}
                  onCheckedChange={v => setFormData(p => ({ ...p, isEnrollmentOpen: v }))}
                />
                <Label htmlFor="enroll-open" className="cursor-pointer">
                  Enrolment Open
                </Label>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                rows={2}
                placeholder="Brief description of the class…"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingClass ? "Save Changes" : "Create Class"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
