import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

type Athlete = {
  id: string; fullName: string; username: string;
  school: string | null; schoolCode: string | null;
  enabled: boolean; displayPassword: string | null;
};

export default function AdminMajAthletes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: athletes = [], isLoading } = useQuery<Athlete[]>({ queryKey: ["/api/admin/maj-athletes"] });

  const toggleOne = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const r = await apiRequest("PATCH", `/api/maj/athletes/${id}`, { enabled });
      return r.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/maj-athletes"] }),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const resetOne = useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      const r = await apiRequest("PATCH", `/api/maj/athletes/${id}`, { password });
      return r.json();
    },
    onSuccess: () => { toast({ title: "Password updated" }); queryClient.invalidateQueries({ queryKey: ["/api/admin/maj-athletes"] }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const bulk = useMutation({
    mutationFn: async ({ school, enabled }: { school: string; enabled: boolean }) => {
      const r = await apiRequest("POST", "/api/admin/maj-athletes/bulk-set-enabled", { school, enabled });
      return r.json();
    },
    onSuccess: (res: any) => { toast({ title: `Updated ${res.updated} athletes` }); queryClient.invalidateQueries({ queryKey: ["/api/admin/maj-athletes"] }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const q = search.trim().toLowerCase();
  const filtered = athletes.filter((a) =>
    !q || a.fullName.toLowerCase().includes(q) || a.username.toLowerCase().includes(q));

  const groups = new Map<string, Athlete[]>();
  for (const a of filtered) {
    const key = a.school || "Other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(a);
  }
  const groupKeys = Array.from(groups.keys()).sort();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">MAJ Athletes</h1>
        <p className="text-gray-600 text-sm">Manage My Athletic Journey access. Disable a school to revoke a lapsed white-label licence.</p>
      </div>
      <Input placeholder="Search by name or username…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

      {isLoading && <p className="text-gray-500">Loading…</p>}

      {groupKeys.map((school) => {
        const list = groups.get(school)!;
        const realSchool = list[0].school;
        return (
          <Card key={school}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{school} <span className="text-sm font-normal text-gray-400">({list.length})</span></CardTitle>
              {realSchool && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => bulk.mutate({ school: realSchool, enabled: true })}>Enable all</Button>
                  <Button size="sm" variant="outline" onClick={() => bulk.mutate({ school: realSchool, enabled: false })}>Disable all</Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-1">
              {list.map((a) => (
                <div key={a.id} className="flex items-center gap-3 py-1.5 border-b last:border-0 text-sm">
                  <Switch checked={a.enabled} onCheckedChange={(v) => toggleOne.mutate({ id: a.id, enabled: v })} />
                  <span className={`w-16 text-xs font-semibold ${a.enabled ? "text-green-600" : "text-red-500"}`}>{a.enabled ? "Active" : "Disabled"}</span>
                  <span className="font-medium w-48 truncate">{a.fullName}</span>
                  <span className="text-gray-600 w-32 truncate">{a.username}</span>
                  <span className="text-gray-400 w-24">{a.displayPassword ?? "—"}</span>
                  <Button size="sm" variant="ghost" onClick={() => { const p = window.prompt("New password", a.displayPassword ?? ""); if (p) resetOne.mutate({ id: a.id, password: p }); }}>Reset PW</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
      {!isLoading && filtered.length === 0 && <p className="text-gray-500">No athletes found.</p>}
    </div>
  );
}
