# MAJ Athletes Management View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An admin page that lists all MAJ athletes grouped by school, with per-athlete enable/disable + credentials + reset, and a per-school bulk enable/disable (the white-label licence kill switch).

**Architecture:** A new admin page (`/admin/maj-athletes`) backed by two new admin endpoints (list-all + bulk-set-enabled-by-school) plus the existing per-athlete `PATCH /api/maj/athletes/:id`. Passwords are shown from `display_password` (the hash is never exposed).

**Tech Stack:** Express, Drizzle, React + TanStack Query, shadcn/ui (Switch, Button, Input).

---

## File Structure

- Modify: `server/storage.ts` — add `setMajEnabledBySchool(school, enabled)`.
- Modify: `server/routes.ts` — add `GET /api/admin/maj-athletes` and `POST /api/admin/maj-athletes/bulk-set-enabled`.
- Create: `client/src/pages/admin-maj-athletes.tsx` — the management page.
- Modify: `client/src/App.tsx` — route `/admin/maj-athletes`.
- Modify: `client/src/pages/admin.tsx` — a nav card linking to it.

---

## Task 1: Backend (list + bulk endpoints)

**Files:** Modify `server/storage.ts`, `server/routes.ts`.

- [ ] **Step 1: Bulk storage method**

In `server/storage.ts`, after `getAllMajAthletes`, add:

```typescript
  async setMajEnabledBySchool(school: string, enabled: boolean): Promise<number> {
    const rows = await db
      .update(majAthletes)
      .set({ enabled, updatedAt: new Date() })
      .where(eq(majAthletes.school, school))
      .returning({ id: majAthletes.id });
    return rows.length;
  }
```

Declare it on `IStorage` near the other MAJ methods:

```typescript
  setMajEnabledBySchool(school: string, enabled: boolean): Promise<number>;
```

- [ ] **Step 2: Admin endpoints**

In `server/routes.ts`, after the `app.get("/api/admin/children-maj", ...)` block (added previously), add:

```typescript
  // All MAJ athletes for the admin management view (no password hash exposed).
  app.get("/api/admin/maj-athletes", isAdmin, async (_req, res) => {
    try {
      const all = await storage.getAllMajAthletes();
      const safe = all.map((a: any) => ({
        id: a.id,
        fullName: a.fullName,
        username: a.username,
        school: a.school ?? null,
        schoolCode: a.schoolCode ?? null,
        enabled: a.enabled,
        displayPassword: a.displayPassword ?? null,
      }));
      res.json(safe);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Enable/disable every athlete at a school (white-label licence control).
  app.post("/api/admin/maj-athletes/bulk-set-enabled", isAdmin, async (req, res) => {
    try {
      const { school, enabled } = req.body as { school?: string; enabled?: boolean };
      if (typeof school !== "string" || typeof enabled !== "boolean") {
        return res.status(400).json({ message: "school (string) and enabled (boolean) are required" });
      }
      const count = await storage.setMajEnabledBySchool(school, enabled);
      res.json({ updated: count });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
```

- [ ] **Step 3: Typecheck and commit**

Run: `cd /Users/alistairtait/P2A-sport-enroll && npm run check` (no new errors in storage.ts / routes.ts; pre-existing errors expected).

```bash
cd /Users/alistairtait/P2A-sport-enroll && git add server/storage.ts server/routes.ts && git commit -m "feat: admin endpoints to list all MAJ athletes and bulk-toggle by school"
```

---

## Task 2: Admin page + route + nav

**Files:** Create `client/src/pages/admin-maj-athletes.tsx`; modify `client/src/App.tsx`, `client/src/pages/admin.tsx`.

- [ ] **Step 1: Create the page**

Create `client/src/pages/admin-maj-athletes.tsx`:

```tsx
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

  // group by school label
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
        const realSchool = list[0].school; // may be null for "Other"
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
                  <span className="font-medium w-48 truncate">{a.fullName}</span>
                  <span className="text-gray-600 w-32 truncate">{a.username}</span>
                  <span className="text-gray-400 w-24">{a.displayPassword ?? "—"}</span>
                  <Button size="sm" variant="ghost" onClick={() => { const p = window.prompt("New password", a.displayPassword ?? ""); if (p) resetOne.mutate({ id: a.id, password: p }); }}>Reset</Button>
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
```

- [ ] **Step 2: Register the route**

In `client/src/App.tsx`, add the import near the other admin imports:

```tsx
import AdminMajAthletes from "@/pages/admin-maj-athletes";
```

And a route next to `/admin/customers`:

```tsx
          <Route path="/admin/maj-athletes" component={AdminMajAthletes} />
```

- [ ] **Step 3: Add a nav card**

In `client/src/pages/admin.tsx`, near the existing `<a href="/admin/customers">` card (around line 296), add a sibling card link. Match the existing card markup pattern used by the neighbouring `<a href="/admin/...">` blocks; the link target is `/admin/maj-athletes` and the label is "MAJ Athletes". Use the same wrapper element and classes as the adjacent admin nav cards so it looks consistent.

- [ ] **Step 4: Typecheck and commit**

Run: `cd /Users/alistairtait/P2A-sport-enroll && npm run check` (no new errors in admin-maj-athletes.tsx, App.tsx, admin.tsx).

```bash
cd /Users/alistairtait/P2A-sport-enroll && git add client/src/pages/admin-maj-athletes.tsx client/src/App.tsx client/src/pages/admin.tsx && git commit -m "feat: MAJ Athletes admin management page + route + nav"
```

---

## Task 3: Deploy + data backfill + verification (Replit)

**Files:** none (runtime + one-off SQL).

- [ ] **Step 1: Deploy.** Merge to `main`, pull on Replit, tick Copy dev→prod, republish. (No new schema columns — `display_password`/`school_code`/`enabled` already exist.)

- [ ] **Step 2: Backfill the 49 existing athletes' display passwords + codes** (so they show in the view). In the Replit shell:

```
psql "$DATABASE_URL" -c "UPDATE maj_athletes SET display_password='PG2026', school_code='PG' WHERE school='Peninsula Grammar' AND display_password IS NULL; UPDATE maj_athletes SET display_password='TC2026', school_code='TC' WHERE school='Toorak College' AND display_password IS NULL;"
```

Then dev→prod copy + republish again (so the live DB has the backfilled values).

- [ ] **Step 3: Verify.** Visit `/admin/maj-athletes`: athletes grouped by Peninsula Grammar / Toorak College / Other; PG shows `PG2026`, Toorak shows `TC2026`; toggling one off blocks that athlete's MAJ login (inactive message); "Disable all" for a school disables the whole group; "Reset" sets a new password that works at login.

---

## Notes for the implementer

- The list endpoint reuses `getAllMajAthletes()` and strips the hashed `password`, exposing only `displayPassword`.
- Bulk toggle keys off the exact `school` string stored on the athlete ("Peninsula Grammar", "Toorak College"); the "Other" group (null school) has no bulk button by design.
- Per-athlete toggle/reset reuse the existing `PATCH /api/maj/athletes/:id` (which hashes a new password and updates `displayPassword`).
