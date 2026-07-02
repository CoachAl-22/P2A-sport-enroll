import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays } from "lucide-react";

interface EnrollmentWeek {
  id: string;
  weekNumber: number;
  sessionDate: string;
  status: "selected" | "skipped" | "holiday" | "credited" | "makeup";
  reason: string | null;
}

interface WeeksResponse {
  enrollmentId: string;
  weeks: EnrollmentWeek[];
  selectedWeeks: number;
  payableWeeks: number;
  pricePerWeek: string | null;
}

function fmtDate(d: string): string {
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function EnrollmentWeeksDialog({
  enrollmentId,
  studentName,
  className,
  open,
  onOpenChange,
}: {
  enrollmentId: string;
  studentName: string;
  className: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<WeeksResponse>({
    queryKey: [`/api/enrollments/${enrollmentId}/weeks`],
    enabled: open,
  });

  const toggle = useMutation({
    mutationFn: async (vars: { weekNumber: number; status: string; reason?: string }) => {
      return apiRequest("PATCH", `/api/enrollments/${enrollmentId}/weeks/${vars.weekNumber}`, {
        status: vars.status,
        reason: vars.reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/enrollments/${enrollmentId}/weeks`] });
    },
    onError: (err: any) => {
      toast({ title: "Could not update week", description: err?.message ?? "", variant: "destructive" });
    },
  });

  const amount =
    data?.pricePerWeek != null
      ? (parseFloat(data.pricePerWeek) * (data.selectedWeeks ?? 0) * 1.1).toFixed(2)
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" /> Session weeks — {studentName}
          </DialogTitle>
          <p className="text-sm text-gray-500">{className}</p>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-gray-400 py-4">Loading weeks…</p>
        ) : !data?.weeks?.length ? (
          <p className="text-sm text-gray-400 py-4">
            No per-week schedule for this enrolment (class has no term configuration).
          </p>
        ) : (
          <>
            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {data.weeks.map((w) => {
                const isHoliday = w.status === "holiday";
                const isOn = w.status === "selected" || w.status === "makeup";
                return (
                  <div
                    key={w.id}
                    className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm"
                  >
                    <span className="w-14 text-xs text-gray-400">Wk {w.weekNumber}</span>
                    <span className="flex-1">{fmtDate(w.sessionDate)}</span>
                    {isHoliday ? (
                      <span className="text-xs text-gray-400">Holiday</span>
                    ) : (
                      <Button
                        size="sm"
                        variant={isOn ? "default" : "outline"}
                        disabled={toggle.isPending}
                        onClick={() => {
                          if (isOn) {
                            const reason =
                              window.prompt("Reason for skipping this week? (e.g. school camp)") ??
                              undefined;
                            if (reason === undefined) return; // cancelled
                            toggle.mutate({ weekNumber: w.weekNumber, status: "skipped", reason });
                          } else {
                            toggle.mutate({ weekNumber: w.weekNumber, status: "selected" });
                          }
                        }}
                      >
                        {isOn ? "Attending" : "Skipped"}
                      </Button>
                    )}
                    {w.reason && !isOn && (
                      <span className="text-xs text-amber-600 max-w-32 truncate">{w.reason}</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between border-t pt-3 text-sm">
              <span className="text-gray-500">
                {data.selectedWeeks} of {data.payableWeeks} weeks selected
              </span>
              {amount != null && (
                <span className="font-semibold">${amount} <span className="text-xs font-normal text-gray-400">inc GST</span></span>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
