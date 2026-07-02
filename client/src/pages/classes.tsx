import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/layout/navbar";
import ClassCard from "@/components/classes/class-card";
import { ChevronRight, X, ArrowRight, Filter, RotateCcw } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

// ─── Program options (the 6 official programs) ─────────────────────────────

// Toorak College & Peninsula Grammar are primary school venues — Foundation & Emerging only
const PRIMARY_SCHOOL_VENUES = ["Toorak College", "Peninsula Grammar"];

const PROGRAMS = [
  {
    sportType: "foundation_prep_year2",
    label: "Foundation",
    ages: "Prep – Year 2  ·  Ages 5–8",
    description: "Movement skills, games & confidence in a fun, welcoming environment.",
    color: "from-green-400 to-emerald-500",
    primarySchoolVenuesOnly: false,
  },
  {
    sportType: "emerging_year3_6",
    label: "Emerging Athletes",
    ages: "Year 3–6  ·  Ages 8–12",
    description: "Running, jumping, throwing & sport-specific athletic development.",
    color: "from-blue-400 to-sky-500",
    primarySchoolVenuesOnly: false,
  },
  {
    sportType: "academy_year7_above",
    label: "Junior Academy",
    ages: "Year 7+  ·  Ages 12–16",
    description: "Structured athletics & competition preparation for developing athletes.",
    color: "from-indigo-400 to-violet-500",
    primarySchoolVenuesOnly: true,
  },
  {
    sportType: "senior_squad",
    label: "Senior Squad",
    ages: "Ages 16+",
    description: "High-level squad training for committed senior athletes.",
    color: "from-orange-400 to-red-500",
    primarySchoolVenuesOnly: true,
  },
  {
    sportType: "empowered_athlete_program",
    label: "Elite HP Squad",
    ages: "By application",
    description: "High Performance program for elite athletes seeking next-level results.",
    color: "from-purple-500 to-fuchsia-500",
    primarySchoolVenuesOnly: true,
  },
  {
    sportType: "team_sport_speed",
    label: "Team Sport Speed",
    ages: "Ages 10+",
    description: "Speed, agility & athleticism training for AFL, soccer, basketball & more.",
    color: "from-amber-400 to-yellow-500",
    primarySchoolVenuesOnly: true,
  },
] as const;

const DAYS = [
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
  { value: "7", label: "Sunday" },
];

type QuizStep = "program" | "day" | "venue" | "results";

interface Selection {
  sportType: string;
  programLabel: string;
  dayOfWeek: string;
  dayLabel: string;
  venueId: string;
  venueLabel: string;
}

const DEFAULT_SELECTION: Selection = {
  sportType: "all",
  programLabel: "",
  dayOfWeek: "all",
  dayLabel: "",
  venueId: "all",
  venueLabel: "",
};

const TERM_ORDER: Record<string, number> = {
  term_1: 1,
  term_2: 2,
  term_3: 3,
  term_4: 4,
};

function getTermLabel(term?: { name?: string; term?: string; year?: number }) {
  if (term?.name) return term.name;
  if (!term?.term || !term?.year) return "Current term";
  return `${term.term.replace("term_", "Term ")} ${term.year}`;
}

export default function Classes() {
  const { user, isAuthenticated } = useAuth();
  const urlParams = new URLSearchParams(window.location.search);
  const preSelected = urlParams.get("sportType");

  const [step, setStep] = useState<QuizStep>(preSelected ? "results" : "program");
  const [sel, setSel] = useState<Selection>({
    ...DEFAULT_SELECTION,
    sportType: preSelected || "all",
    programLabel: PROGRAMS.find((p) => p.sportType === preSelected)?.label || "",
  });
  const [selectedTermId, setSelectedTermId] = useState("");
  const [termManuallySelected, setTermManuallySelected] = useState(false);
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

  const resultsRef = useRef<HTMLDivElement>(null);

  const { data: venues = [] } = useQuery<any[]>({ queryKey: ["/api/venues"] });
  const { data: termConfigs = [] } = useQuery<any[]>({ queryKey: ["/api/term-configurations"] });

  const availableTerms = useMemo(
    () =>
      [...termConfigs]
        .filter((term) => term.active !== false)
        .sort((a, b) => {
          const yearDiff = Number(b.year) - Number(a.year);
          if (yearDiff !== 0) return yearDiff;
          return (TERM_ORDER[b.term] ?? 0) - (TERM_ORDER[a.term] ?? 0);
        }),
    [termConfigs],
  );
  const selectedTerm = availableTerms.find((term) => term.id === selectedTermId) || availableTerms[0];
  const selectedTermLabel = getTermLabel(selectedTerm);

  const { data: classes = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/classes", sel, selectedTerm?.id, selectedTerm?.term, selectedTerm?.year],
    enabled: step === "results" && !!selectedTerm,
    queryFn: async () => {
      const params = new URLSearchParams({ term: selectedTerm.term, year: String(selectedTerm.year) });
      if (sel.sportType !== "all") params.append("sportType", sel.sportType);
      if (sel.dayOfWeek !== "all") params.append("dayOfWeek", sel.dayOfWeek);
      if (sel.venueId !== "all") params.append("venueId", sel.venueId);
      const res = await fetch(`/api/classes?${params}`);
      if (!res.ok) throw new Error("Failed to fetch classes");
      return res.json();
    },
  });

  const { data: termClasses = [] } = useQuery<any[]>({
    queryKey: ["/api/classes", selectedTerm?.id, selectedTerm?.term, selectedTerm?.year, "alternatives"],
    enabled: step === "results" && !!selectedTerm,
    queryFn: async () => {
      const params = new URLSearchParams({ term: selectedTerm.term, year: String(selectedTerm.year) });
      const res = await fetch(`/api/classes?${params}`);
      if (!res.ok) throw new Error("Failed to fetch classes");
      return res.json();
    },
  });

  const displayedClasses = useMemo(
    () =>
      availabilityFilter === "available"
        ? classes.filter((c: any) => (c.spotsRemaining ?? c.maxCapacity - c.currentEnrollment) > 0)
        : classes,
    [classes, availabilityFilter],
  );

  const alternativeClasses = useMemo(() => {
    const seen = new Set(classes.map((c: any) => c.id));
    return termClasses
      .filter((c: any) => !seen.has(c.id))
      .filter((c: any) => sel.sportType === "all" || c.sportType === sel.sportType)
      .slice(0, 3);
  }, [classes, sel.sportType, termClasses]);

  useEffect(() => {
    const latestTermId = availableTerms[0]?.id;
    if (!termManuallySelected && latestTermId && selectedTermId !== latestTermId) {
      setSelectedTermId(latestTermId);
    }
  }, [availableTerms, selectedTermId, termManuallySelected]);

  useEffect(() => {
    if (step === "results") {
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    }
  }, [step]);

  function pickProgram(sportType: string, label: string) {
    setSel((s) => ({ ...s, sportType, programLabel: label }));
    setStep("day");
  }

  function pickDay(dayOfWeek: string, dayLabel: string) {
    setSel((s) => ({ ...s, dayOfWeek, dayLabel }));
    setStep("venue");
  }

  function pickVenue(venueId: string, venueLabel: string) {
    setSel((s) => ({ ...s, venueId, venueLabel }));
    setStep("results");
  }

  function reset() {
    setSel(DEFAULT_SELECTION);
    setAvailabilityFilter("all");
    setStep("program");
  }

  function updateFinder(next: Partial<Selection>) {
    setSel((current) => ({ ...current, ...next }));
    setStep("results");
  }

  function clearFilters() {
    setSel(DEFAULT_SELECTION);
    setAvailabilityFilter("all");
    setStep("results");
  }

  // ── Step progress bar ───────────────────────────────────────────────────
  const steps: QuizStep[] = ["program", "day", "venue", "results"];
  const stepIdx = steps.indexOf(step);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Select your term</p>
              <p className="text-xs text-gray-500">
                Choose the term you want to browse before selecting a class.
              </p>
            </div>
            <Select
              value={selectedTerm?.id || ""}
              onValueChange={(termId) => {
                setTermManuallySelected(true);
                setSelectedTermId(termId);
              }}
              disabled={availableTerms.length === 0}
            >
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                {availableTerms.map((term) => (
                  <SelectItem key={term.id} value={term.id}>
                    {getTermLabel(term)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary-500" />
              <p className="text-sm font-semibold text-gray-900">Find a class</p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 text-xs text-gray-500">
              <RotateCcw className="mr-1 h-3.5 w-3.5" />
              Reset
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              value={sel.sportType}
              onValueChange={(sportType) => {
                const program = PROGRAMS.find((p) => p.sportType === sportType);
                updateFinder({ sportType, programLabel: program?.label || "" });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All programs</SelectItem>
                {PROGRAMS.map((program) => (
                  <SelectItem key={program.sportType} value={program.sportType}>
                    {program.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={sel.dayOfWeek}
              onValueChange={(dayOfWeek) => {
                const day = DAYS.find((d) => d.value === dayOfWeek);
                updateFinder({ dayOfWeek, dayLabel: day?.label || "" });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Day" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any day</SelectItem>
                {DAYS.map((day) => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={sel.venueId}
              onValueChange={(venueId) => {
                const venue = venues.find((v: any) => v.id === venueId);
                updateFinder({ venueId, venueLabel: venue?.name || "" });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any location</SelectItem>
                {venues.map((venue: any) => (
                  <SelectItem key={venue.id} value={venue.id}>
                    {venue.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={availabilityFilter} onValueChange={(value) => { setAvailabilityFilter(value); setStep("results"); }}>
              <SelectTrigger>
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All availability</SelectItem>
                <SelectItem value="available">Spots available</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Step 1: Program ─────────────────────────────────────────────── */}
        {step === "program" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

            {/* Returning family shortcut */}
            {isAuthenticated && user && (
              <div className="mb-6 rounded-xl bg-primary-50 border border-primary-100 p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-primary-900">
                    Welcome back, {user.firstName || user.email?.split("@")[0]}! 👋
                  </p>
                  <p className="text-xs text-primary-700 mt-0.5">
                    Returning family? Skip the quiz and see all {selectedTermLabel} classes now.
                  </p>
                </div>
                <button
                  onClick={() => { setSel(DEFAULT_SELECTION); setStep("results"); }}
                  className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold px-4 py-2 rounded-lg whitespace-nowrap transition-colors"
                >
                  See all classes <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <StepHeader current={1} total={3} />
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 mb-2 text-center">
              Which program are you interested in?
            </h1>
            <p className="text-gray-500 text-sm text-center mb-8">
              Choose the one that best matches your child.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {PROGRAMS.map((p) => (
                <button
                  key={p.sportType}
                  onClick={() => pickProgram(p.sportType, p.label)}
                  className="text-left rounded-xl border-2 border-gray-100 hover:border-primary-400 hover:shadow-md transition-all p-4 group flex items-start gap-4"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${p.color} flex-shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-heading font-bold text-gray-900 text-base">{p.label}</span>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 flex-shrink-0 transition-colors" />
                    </div>
                    <span className="text-xs text-gray-400 block mb-1">{p.ages}</span>
                    <span className="text-sm text-gray-600 line-clamp-2">{p.description}</span>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => { setSel(DEFAULT_SELECTION); setStep("day"); }}
              className="block text-center text-sm text-gray-400 underline underline-offset-2 mt-6 hover:text-gray-600 mx-auto"
            >
              Not sure — show all programs
            </button>
          </div>
        )}

        {/* ── Step 2: Day ─────────────────────────────────────────────────── */}
        {step === "day" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <StepHeader current={2} total={3} onBack={() => setStep("program")} />
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 mb-2 text-center">
              Which day suits you?
            </h2>
            {sel.programLabel && (
              <p className="text-gray-500 text-sm text-center mb-8">
                Program: <span className="font-semibold text-gray-700">{sel.programLabel}</span>
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {DAYS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => pickDay(d.value, d.label)}
                  className="h-12 rounded-xl border-2 border-gray-200 font-medium text-gray-700 hover:border-primary-500 hover:text-primary-600 active:bg-primary-50 transition-all text-sm"
                >
                  {d.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => pickDay("all", "Any day")}
              className="w-full h-12 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-all"
            >
              Any day — show all
            </button>
          </div>
        )}

        {/* ── Step 3: Venue ───────────────────────────────────────────────── */}
        {step === "venue" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <StepHeader current={3} total={3} onBack={() => setStep("day")} />
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 mb-2 text-center">
              Which location works for you?
            </h2>
            {(sel.programLabel || sel.dayLabel) && (
              <p className="text-gray-500 text-sm text-center mb-8">
                {[sel.programLabel, sel.dayLabel !== "Any day" ? sel.dayLabel : ""].filter(Boolean).join(" · ")}
              </p>
            )}
            {(() => {
              const selectedProgram = PROGRAMS.find((p) => p.sportType === sel.sportType);
              const excludePrimary = selectedProgram?.primarySchoolVenuesOnly === true;
              const filteredVenues = excludePrimary
                ? venues.filter((v: any) => !PRIMARY_SCHOOL_VENUES.includes(v.name))
                : venues;
              return (
                <>
                  <div className="flex flex-col gap-3 mb-4">
                    {filteredVenues.map((v: any) => (
                      <button
                        key={v.id}
                        onClick={() => pickVenue(v.id, v.name)}
                        className="text-left h-14 rounded-xl border-2 border-gray-200 px-5 font-medium text-gray-700 hover:border-primary-500 hover:text-primary-600 active:bg-primary-50 transition-all flex items-center justify-between group"
                      >
                        <span>{v.name}</span>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 transition-colors" />
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => pickVenue("all", "Any location")}
                    className="w-full h-14 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-all"
                  >
                    Any location — show all
                  </button>
                </>
              );
            })()}
          </div>
        )}

        {/* ── Results ─────────────────────────────────────────────────────── */}
        {step === "results" && (
          <div ref={resultsRef}>
            {/* Summary bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900">
                  {sel.programLabel || "All Programs"}
                </h1>
                <div className="flex flex-wrap gap-2 mt-2">
                  {sel.dayLabel && sel.dayLabel !== "Any day" && (
                    <Badge className="bg-primary-50 text-primary-700 border border-primary-200 font-normal">
                      {sel.dayLabel}
                    </Badge>
                  )}
                  {sel.venueLabel && sel.venueLabel !== "Any location" && (
                    <Badge className="bg-primary-50 text-primary-700 border border-primary-200 font-normal">
                      {sel.venueLabel}
                    </Badge>
                  )}
                  <Badge className="bg-gray-100 text-gray-500 border border-gray-200 font-normal">
                    {selectedTermLabel}
                  </Badge>
                </div>
              </div>
              <button
                onClick={reset}
                className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-800 font-medium whitespace-nowrap"
              >
                <X className="w-4 h-4" />
                Start over
              </button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
              </div>
            ) : displayedClasses.length > 0 ? (
              <>
                <p className="text-sm text-gray-400 mb-4">
                  {displayedClasses.length} class{displayedClasses.length !== 1 ? "es" : ""} available
                </p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedClasses.map((c: any) => (
                    <ClassCard key={c.id} classData={c} />
                  ))}
                </div>

                <div className="mt-12 rounded-2xl bg-amber-50 border border-amber-100 p-6">
                  <h3 className="font-heading font-bold text-gray-900 mb-1">None of these times work?</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Try a different day, venue, or availability filter.
                  </p>
                  <button
                    onClick={clearFilters}
                    className="text-sm font-medium text-amber-700 underline underline-offset-2 hover:text-amber-900"
                  >
                    Show all classes for this term →
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Top accent */}
                <div className="h-1.5 bg-gradient-to-r from-primary-400 to-secondary-400" />

                {(() => {
                  const isAdvanced = ["academy_year7_above", "senior_squad", "empowered_athlete_program"].includes(sel.sportType ?? "");
                  const DISCOVERY_URL = "https://power2adapt.setmore.com/services/a9a6a66a-9c61-4bec-829a-84d78687c2c0";

                  if (isAdvanced) {
                    return (
                      <div className="p-8 sm:p-10 text-center">
                        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-primary-50 flex items-center justify-center">
                          <span className="text-3xl">🏅</span>
                        </div>
                        <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">
                          Currently taking applications for {sel.programLabel}
                        </h3>
                        <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto mb-2">
                          These squads run year-round and athlete spots are filled through our application process.
                        </p>
                        <p className="text-gray-400 text-sm mb-8">
                          Book a free Discovery Call and Alistair will talk you through the application, training schedule, and whether it's the right fit.
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4 mb-6 text-left">
                          <div className="rounded-xl border-2 border-primary-100 bg-primary-50 p-5">
                            <div className="text-2xl mb-2">📞</div>
                            <h4 className="font-semibold text-gray-900 text-sm mb-1">Book a Discovery Call</h4>
                            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                              Free 15-minute call to discuss the program, expectations and how to apply.
                            </p>
                            <button
                              onClick={() => window.open(DISCOVERY_URL, "_blank", "noopener noreferrer")}
                              className="w-full inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold text-xs rounded-lg px-4 py-2.5 hover:opacity-90 transition-opacity"
                            >
                              📞 Book now — it's free
                            </button>
                          </div>
                          <div className="rounded-xl border-2 border-amber-100 bg-amber-50 p-5">
                            <div className="text-2xl mb-2">📋</div>
                            <h4 className="font-semibold text-gray-900 text-sm mb-1">Try a different day</h4>
                            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                              These squads run Monday–Friday across Ballam Park and Mornington. Another day may suit.
                            </p>
                            <button
                              onClick={() => setStep("day")}
                              className="w-full inline-flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-lg px-4 py-2.5 transition-colors"
                            >
                              Browse other days →
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="p-8 sm:p-10 text-center">
                      <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-amber-50 flex items-center justify-center">
                        <span className="text-3xl">📋</span>
                      </div>
                      <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">
                        No classes available here just yet
                      </h3>
                      <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto mb-2">
                        {sel.venueLabel && sel.venueLabel !== "Any location" && sel.programLabel ? (
                          <>
                            We don't currently run a <strong>{sel.programLabel}</strong> class
                            {sel.dayLabel && sel.dayLabel !== "Any day" ? <> on <strong>{sel.dayLabel}s</strong></> : null}
                            {" "}at <strong>{sel.venueLabel}</strong>.
                          </>
                        ) : (
                          "No classes match your current selection."
                        )}
                      </p>
                      <p className="text-gray-400 text-sm mb-8">
                        We'd love to keep you in the loop — join the waitlist for a term class, or let us know you're interested in our holiday programs.
                      </p>
                      <div className="grid sm:grid-cols-2 gap-4 mb-6 text-left">
                        <div className="rounded-xl border-2 border-primary-100 bg-primary-50 p-5">
                          <div className="text-2xl mb-2">📋</div>
                          <h4 className="font-semibold text-gray-900 text-sm mb-1">Join the term waitlist</h4>
                          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                            We'll contact you as soon as a spot opens up in a term class at your preferred venue.
                          </p>
                          <button
                            onClick={() => window.open(DISCOVERY_URL, "_blank", "noopener noreferrer")}
                            className="w-full inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold text-xs rounded-lg px-4 py-2.5 hover:opacity-90 transition-opacity"
                          >
                            📞 Book a free Discovery Call
                          </button>
                        </div>
                        <div className="rounded-xl border-2 border-amber-100 bg-amber-50 p-5">
                          <div className="text-2xl mb-2">🌞</div>
                          <h4 className="font-semibold text-gray-900 text-sm mb-1">Holiday program interest</h4>
                          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                            We run holiday programs during school breaks. Let us know and we'll reach out when registrations open.
                          </p>
                          <button
                            onClick={() => window.open(DISCOVERY_URL, "_blank", "noopener noreferrer")}
                            className="w-full inline-flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-lg px-4 py-2.5 transition-colors"
                          >
                            🌞 Register my interest
                          </button>
                        </div>
                      </div>
                      {alternativeClasses.length > 0 && (
                        <div className="mt-6 text-left">
                          <h4 className="mb-3 text-sm font-semibold text-gray-900">Other options this term</h4>
                          <div className="grid gap-3 sm:grid-cols-3">
                            {alternativeClasses.map((option: any) => (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => {
                                  updateFinder({
                                    sportType: option.sportType,
                                    programLabel: PROGRAMS.find((p) => p.sportType === option.sportType)?.label || option.name,
                                    dayOfWeek: "all",
                                    dayLabel: "",
                                    venueId: "all",
                                    venueLabel: "",
                                  });
                                }}
                                className="rounded-xl border border-gray-200 bg-white p-3 text-left text-sm hover:border-primary-300 hover:bg-primary-50"
                              >
                                <span className="block font-semibold text-gray-900">{option.name}</span>
                                <span className="text-xs text-gray-500">{option.venue?.name || "Venue TBA"}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Secondary actions */}
                <div className="px-8 pb-8 flex flex-wrap gap-3 justify-center">
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Show all classes
                  </Button>
                  <Button variant="ghost" size="sm" onClick={reset} className="text-gray-400">
                    Start over
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Shared step header component ────────────────────────────────────────────
function StepHeader({ current, total, onBack }: { current: number; total: number; onBack?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-6">
      {onBack ? (
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
          ← Back
        </button>
      ) : (
        <div />
      )}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i < current ? "w-8 bg-primary-500" : i === current - 1 ? "w-8 bg-primary-500" : "w-4 bg-gray-200"
            }`}
          />
        ))}
        <span className="text-xs text-gray-400 ml-1">{current}/{total}</span>
      </div>
      <div className="w-10" />
    </div>
  );
}
