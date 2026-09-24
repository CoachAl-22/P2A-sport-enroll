import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const DAY_NAMES = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AdminSetupTerm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1 state — new term config
  // Term 4 2026 is already configured; the wizard starts with the next term.
  const [term, setTerm] = useState("term_1");
  const [year, setYear] = useState(2027);
  const [name, setName] = useState("Term 1 2027");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [weeksCount, setWeeksCount] = useState(10);
  const [pricePerWeek, setPricePerWeek] = useState(30);
  const [gstRate, setGstRate] = useState(0.1);
  const [holidays, setHolidays] = useState<{ date: string; name: string }[]>([]);
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayName, setHolidayName] = useState("");
  const [newConfigId, setNewConfigId] = useState<string | null>(null);
  const [term4Confirmation, setTerm4Confirmation] = useState("");

  const { data: term4Status, isError: term4StatusError } = useQuery<{
    term3ActiveCount: number;
    term3OpenCount: number;
    term4ClassCount: number;
    term3ConfigActive: boolean;
    term4ConfigExists: boolean;
    term4ConfigActive: boolean;
  }>({ queryKey: ["/api/admin/term4-2026/setup-status"] });

  const setupTerm4 = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/admin/term4-2026/setup", {
        confirmation: term4Confirmation,
      });
      return r.json() as Promise<{ created: number; archived: number }>;
    },
    onSuccess: ({ created, archived }) => {
      setTerm4Confirmation("");
      toast({ title: "Term 4 ready", description: `${created} closed Term 4 classes created; ${archived} Term 3 classes archived.` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/term4-2026/setup-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/term-configurations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
    },
    onError: (e: Error) => toast({ title: "Term 4 setup failed", description: e.message, variant: "destructive" }),
  });

  // Step 2 state — source term
  const [sourceConfigId, setSourceConfigId] = useState<string>("");

  const { data: termConfigs = [] } = useQuery<any[]>({ queryKey: ["/api/term-configurations"] });
  const { data: newClasses = [] } = useQuery<any[]>({
    queryKey: ["/api/term-configurations", newConfigId, "classes"],
    queryFn: async () => {
      const r = await apiRequest("GET", `/api/term-configurations/${newConfigId}/classes`);
      return r.json();
    },
    enabled: !!newConfigId && step >= 3,
  });

  // Step 1: create config + holidays
  const createConfig = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/term-configurations", {
        term, year, name, startDate, endDate, weeksCount, pricePerWeek, gstRate, active: true,
      });
      const cfg = await r.json();
      for (const h of holidays) {
        await apiRequest("POST", `/api/term-configurations/${cfg.id}/holidays`, {
          holidayDate: h.date, name: h.name, type: "public_holiday",
        });
      }
      return cfg;
    },
    onSuccess: (cfg) => {
      setNewConfigId(cfg.id);
      queryClient.invalidateQueries({ queryKey: ["/api/term-configurations"] });
      setStep(2);
    },
    onError: (e: any) => toast({ title: "Could not create term", description: e.message, variant: "destructive" }),
  });

  // Step 2: clone classes from source into the new config
  const cloneTerm = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/admin/clone-term", {
        sourceTermConfigId: sourceConfigId, targetTermConfigId: newConfigId,
      });
      return r.json();
    },
    onSuccess: (res) => {
      toast({ title: "Classes cloned", description: `${res.created} classes created.` });
      queryClient.invalidateQueries({ queryKey: ["/api/term-configurations", newConfigId, "classes"] });
      setStep(3);
    },
    onError: (e: any) => toast({ title: "Clone failed", description: e.message, variant: "destructive" }),
  });

  // Step 3: per-class edits (per-week toggle)
  const updateClass = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const r = await apiRequest("PUT", `/api/classes/${id}`, updates);
      return r.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/term-configurations", newConfigId, "classes"] }),
    onError: (e: any) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const addHoliday = () => {
    if (!holidayDate || !holidayName) return;
    setHolidays((h) => [...h, { date: holidayDate, name: holidayName }]);
    setHolidayDate(""); setHolidayName("");
  };
  const reservedTerm4 = term === "term_4" && year === 2026;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <Card>
        <CardHeader><CardTitle>Term 4 2026 — one-time setup</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {term4StatusError ? (
            <p role="alert" className="text-sm text-red-700">Could not check the term status. No setup action is available.</p>
          ) : !term4Status ? (
            <p className="text-sm text-gray-600">Checking this site's term records…</p>
          ) : term4Status.term4ConfigExists || term4Status.term4ClassCount > 0 ? (
            <p className="text-sm text-gray-700">
              Term 4 already has {term4Status.term4ClassCount} class records here.
              {term4Status.term3OpenCount > 0
                ? ` ${term4Status.term3OpenCount} Term 3 classes are still open — review them in Classes admin before making changes.`
                : " The one-time setup cannot run again."}
            </p>
          ) : !term4Status.term3ConfigActive || term4Status.term3ActiveCount === 0 ? (
            <p className="text-sm text-gray-700">Term 3 source classes are not ready. No setup action is available.</p>
          ) : (
            <>
              <p className="text-sm text-gray-700">
                This site has {term4Status.term3ActiveCount} active Term 3 classes.
                Set up the approved Term 4 schedule, create its classes with enrolment closed,
                mark active Term 3 classes completed, and close Term 3 enrolment.
                Existing enrolment history stays intact. SportsBiz and Setmore are unchanged.
              </p>
              <Label htmlFor="term4-confirmation">Type ARCHIVE TERM 3 2026 to confirm</Label>
              <Input
                id="term4-confirmation"
                value={term4Confirmation}
                onChange={(event) => setTerm4Confirmation(event.target.value)}
                autoComplete="off"
              />
              <Button
                type="button"
                disabled={term4Confirmation !== "ARCHIVE TERM 3 2026" || setupTerm4.isPending}
                onClick={() => setupTerm4.mutate()}
              >
                {setupTerm4.isPending ? "Setting up Term 4…" : "Set up Term 4 and archive Term 3"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
      <h1 className="text-2xl font-bold">Set Up New Term — Step {step} of 4</h1>

      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>1. Create the term</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Term</Label>
                <Select value={term} onValueChange={setTerm}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="term_1">Term 1</SelectItem>
                    <SelectItem value="term_2">Term 2</SelectItem>
                    <SelectItem value="term_3">Term 3</SelectItem>
                    <SelectItem value="term_4">Term 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Year</Label><Input type="number" value={year} onChange={(e) => setYear(+e.target.value)} /></div>
              <div className="col-span-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><Label>Start date</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
              <div><Label>End date</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
              <div><Label>Weeks</Label><Input type="number" value={weeksCount} onChange={(e) => setWeeksCount(+e.target.value)} /></div>
              <div><Label>Price / week</Label><Input type="number" value={pricePerWeek} onChange={(e) => setPricePerWeek(+e.target.value)} /></div>
              <div><Label>GST rate</Label><Input type="number" step="0.01" value={gstRate} onChange={(e) => setGstRate(+e.target.value)} /></div>
            </div>
            <div className="border-t pt-4">
              <Label>Holidays (no-class weeks)</Label>
              <div className="flex gap-2 mt-2">
                <Input type="date" value={holidayDate} onChange={(e) => setHolidayDate(e.target.value)} />
                <Input placeholder="Name e.g. Public Holiday" value={holidayName} onChange={(e) => setHolidayName(e.target.value)} />
                <Button type="button" variant="outline" onClick={addHoliday}>Add</Button>
              </div>
              <ul className="mt-2 text-sm text-gray-600">
                {holidays.map((h, i) => <li key={i}>{h.date} — {h.name}</li>)}
              </ul>
            </div>
            {reservedTerm4 && (
              <p className="text-sm text-amber-800">Use the one-time Term 4 2026 setup above for this term.</p>
            )}
            <Button onClick={() => createConfig.mutate()} disabled={createConfig.isPending || reservedTerm4} className="w-full">
              {createConfig.isPending ? "Creating…" : "Create term & continue →"}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>2. Clone classes from a previous term</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Label>Copy classes from</Label>
            <Select value={sourceConfigId} onValueChange={setSourceConfigId}>
              <SelectTrigger><SelectValue placeholder="Choose a source term" /></SelectTrigger>
              <SelectContent>
                {termConfigs.filter((c) => c.id !== newConfigId).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => cloneTerm.mutate()} disabled={!sourceConfigId || cloneTerm.isPending} className="w-full">
              {cloneTerm.isPending ? "Cloning…" : "Clone classes →"}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader><CardTitle>3. Review classes ({newClasses.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {newClasses.map((c) => (
              <div key={c.id} className="flex items-center gap-3 border rounded-lg p-3 text-sm">
                <div className="flex-1">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-gray-500">{DAY_NAMES[c.dayOfWeek]} {c.startTime}–{c.endTime} · cap {c.maxCapacity} · ${c.pricePerTerm} + GST</p>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Per-week</Label>
                  <Switch
                    checked={!!c.perWeekEnabled}
                    onCheckedChange={(v) => updateClass.mutate({ id: c.id, updates: { perWeekEnabled: v } })}
                  />
                </div>
              </div>
            ))}
            <p className="text-xs text-gray-500 mt-2">
              Need to change a class's day, time, venue, coach, or add/remove a class? Use the{" "}
              <a href="/admin/classes" className="underline text-primary-600">Classes admin</a> page — it edits the full class details.
            </p>
            <Button onClick={() => setStep(4)} className="w-full mt-4">Looks good →</Button>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader><CardTitle>4. Done</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              {name} created with {newClasses.length} classes. Per-week enrolment is on for{" "}
              {newClasses.filter((c) => c.perWeekEnabled).length} of them.
            </p>
            <p className="text-sm text-gray-600">
              Next: open enrolments on each class when you are ready, and test one fortnightly booking.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
