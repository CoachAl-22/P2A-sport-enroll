import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import Navbar from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, User, Calendar, MapPin, FlaskConical } from "lucide-react";

export default function AdminTrials() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const { data: trials = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/trial-requests"],
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/admin/trial-requests/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trial-requests"] });
      toast({ title: "Trial approved", description: "Parent notified by SMS." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/admin/trial-requests/${id}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trial-requests"] });
      toast({ title: "Trial declined", description: "Parent notified by SMS." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (!authLoading && user?.role !== "admin") return <Redirect to="/" />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <FlaskConical className="w-6 h-6 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900">Free Trial Requests</h1>
          {!isLoading && (
            <Badge variant="secondary" className="ml-auto">
              {trials.length} pending
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : trials.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <FlaskConical className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No pending trial requests</p>
              <p className="text-sm mt-1">New requests will appear here when parents apply for a free trial session.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {trials.map((row: any) => {
              const enr = row.enrollment;
              const cls = row.class;
              const child = row.child;
              const parent = row.parent;
              const isApproving = approveMutation.isPending;
              const isRejecting = rejectMutation.isPending;

              return (
                <Card key={enr?.id} className="border-green-100">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500 shrink-0" />
                        <span>{child?.firstName} {child?.lastName}</span>
                        <Badge variant="outline" className="text-xs text-green-700 border-green-300">Trial</Badge>
                      </div>
                      <span className="text-xs text-gray-400 font-normal whitespace-nowrap">
                        {enr?.enrolledAt ? new Date(enr.enrolledAt).toLocaleDateString("en-AU") : ""}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid sm:grid-cols-2 gap-2 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span><strong>Class:</strong> {cls?.name ?? "—"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span><strong>Day:</strong> {cls?.dayOfWeek ?? "—"} {cls?.startTime ? `at ${cls.startTime}` : ""}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span><strong>Parent:</strong> {parent?.firstName} {parent?.lastName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">📱</span>
                        <span><strong>Mobile:</strong> {parent?.mobile ?? "—"}</span>
                      </div>
                    </div>
                    {enr?.notes && (
                      <p className="text-xs text-gray-500 bg-gray-50 rounded p-2">Notes: {enr.notes}</p>
                    )}
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white gap-1"
                        disabled={isApproving || isRejecting}
                        onClick={() => approveMutation.mutate(enr?.id)}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50 gap-1"
                        disabled={isApproving || isRejecting}
                        onClick={() => rejectMutation.mutate(enr?.id)}
                      >
                        <XCircle className="w-4 h-4" />
                        Decline
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
