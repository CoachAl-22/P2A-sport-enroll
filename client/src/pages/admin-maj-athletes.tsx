import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserPlus } from "lucide-react";

type Athlete = {
  id: string; fullName: string; username: string;
  school: string | null; schoolCode: string | null;
  enabled: boolean; displayPassword: string | null;
};

export default function AdminMajAthletes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addForm, setAddForm] = useState({ fullName: "", username: "", password: "", grade: "", program: "" });

  const addAthleteMutation = useMutation({
    mutationFn: async (data: typeof addForm) => {
      const res = await apiRequest("POST", "/api/maj/athletes", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Athlete created!", description: `${addForm.fullName} has been added to MAJ.` });
      setIsAddDialogOpen(false);
      setAddForm({ fullName: "", username: "", password: "", grade: "", program: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/maj-athletes"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">MAJ Athletes</h1>
          <p className="text-gray-600 text-sm">Manage My Athletic Journey access. Disable a school to revoke a lapsed white-label licence.</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="bg-green-600 hover:bg-green-700 text-white">
          <UserPlus className="w-4 h-4 mr-2" />
          Add athlete
        </Button>
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
                  <Switch checked={a.enabled} onCheckedChange={(v) => toggleOne.mutate({ id: a.id, enabled: v })} className="border border-gray-400 data-[state=unchecked]:bg-gray-300" />
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

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-green-600" />
              Add athlete to MAJ
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input value={addForm.fullName} onChange={e => setAddForm(f => ({ ...f, fullName: e.target.value }))} placeholder="e.g. Jordan Smith" />
            </div>
            <div>
              <Label>Username (login name)</Label>
              <Input value={addForm.username} onChange={e => setAddForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, "") }))} placeholder="e.g. jordan" />
              <p className="text-xs text-gray-400 mt-1">Lowercase, no spaces. Athlete uses this to log in.</p>
            </div>
            <div>
              <Label>Login Code (password)</Label>
              <Input value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} placeholder="e.g. athlete123" />
              <p className="text-xs text-gray-400 mt-1">Share this code with the athlete/parent after creation.</p>
            </div>
            <div>
              <Label>Grade / Year (optional)</Label>
              <Input value={addForm.grade} onChange={e => setAddForm(f => ({ ...f, grade: e.target.value }))} placeholder="e.g. Year 9" />
            </div>
            <div>
              <Label>Program (optional)</Label>
              <Input value={addForm.program} onChange={e => setAddForm(f => ({ ...f, program: e.target.value }))} placeholder="e.g. Senior Squad" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => addAthleteMutation.mutate(addForm)}
                disabled={addAthleteMutation.isPending || !addForm.fullName || !addForm.username || !addForm.password}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {addAthleteMutation.isPending ? "Creating…" : "Create athlete"}
              </Button>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
