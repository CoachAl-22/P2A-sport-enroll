import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Redirect } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { EnrolmentLink } from "@shared/schema";

type ClickCount = { slug: string; src: string; count: number };

export default function AdminEnrolmentLinks() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const { data: links = [], isLoading } = useQuery<EnrolmentLink[]>({
    queryKey: ["/api/admin/enrolment-links"],
  });
  const { data: clicks = [] } = useQuery<ClickCount[]>({
    queryKey: ["/api/admin/enrolment-link-clicks"],
  });

  const update = useMutation({
    mutationFn: async ({ slug, ...body }: { slug: string } & Partial<EnrolmentLink>) =>
      apiRequest("PATCH", `/api/admin/enrolment-links/${slug}`, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/enrolment-links"] });
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[variables.slug];
        return next;
      });
      toast({ title: "Saved" });
    },
    onError: () => toast({ title: "Save failed", variant: "destructive" }),
  });

  if (!authLoading && user?.role !== "admin") return <Redirect to="/" />;
  if (isLoading) return <div className="p-8">Loading...</div>;

  const countFor = (slug: string) =>
    clicks.filter((c) => c.slug === slug).reduce((total, c) => total + c.count, 0);

  return (
    <div className="mx-auto max-w-5xl p-8">
      <h1 className="mb-2 text-3xl font-black">Enrolment links</h1>
      <p className="mb-8 text-muted-foreground">
        These are the only place a SportsBiz URL should live. Update them each term instead of
        editing pages.
      </p>

      <div className="space-y-3">
        {links.map((link) => (
          <div
            key={link.slug}
            className={`rounded-lg border p-4 ${link.active ? "" : "border-dashed bg-muted/40 opacity-80"}`}
            data-testid={`link-${link.slug}`}
          >
            <div className="mb-2 flex items-center justify-between gap-4">
              <div>
                <code className="font-bold">/enrol/{link.slug}</code>
                <p className="text-sm text-muted-foreground">{link.label}</p>
                {!link.active && (
                  <span className="mt-1 inline-block rounded bg-muted px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Inactive
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">{countFor(link.slug)} clicks</span>
                <Switch
                  checked={link.active}
                  onCheckedChange={(active) => update.mutate({ slug: link.slug, active })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                value={drafts[link.slug] ?? link.destinationUrl}
                onChange={(e) => setDrafts({ ...drafts, [link.slug]: e.target.value })}
              />
              <Button
                onClick={() =>
                  update.mutate({
                    slug: link.slug,
                    destinationUrl: drafts[link.slug] ?? link.destinationUrl,
                  })
                }
              >
                Save
              </Button>
            </div>
            {link.notes && <p className="mt-2 text-sm text-[#f6930e]">{link.notes}</p>}
          </div>
        ))}
      </div>

      <h2 className="mb-3 mt-10 text-xl font-bold">Clicks by source</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted-foreground">
            <th className="py-2">Slug</th>
            <th>Source</th>
            <th className="text-right">Clicks</th>
          </tr>
        </thead>
        <tbody>
          {clicks.map((c) => (
            <tr key={`${c.slug}-${c.src}`} className="border-t">
              <td className="py-2">{c.slug}</td>
              <td>{c.src}</td>
              <td className="text-right">{c.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
