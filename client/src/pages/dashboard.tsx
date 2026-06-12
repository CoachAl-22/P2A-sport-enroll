import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/navbar";
import { Plus, Calendar, ChevronDown, ChevronUp, Clock, MapPin, User, CreditCard, CheckCircle2, AlertCircle, Hourglass, Receipt } from "lucide-react";
import { Link } from "wouter";
import { InvoiceActions } from "@/components/InvoiceActions";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function termLabel(term: string, year: number) {
  return `${year} Term ${term?.replace("term_", "")}`;
}

function formatTime(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

function getAge(dob: string) {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string; icon: any }> = {
    active: { label: "Active", className: "bg-green-100 text-green-800", icon: CheckCircle2 },
    pending_payment: { label: "Payment Due", className: "bg-amber-100 text-amber-800", icon: AlertCircle },
    waitlist: { label: "Waitlisted", className: "bg-blue-100 text-blue-800", icon: Hourglass },
    completed: { label: "Completed", className: "bg-gray-100 text-gray-600", icon: CheckCircle2 },
    cancelled: { label: "Cancelled", className: "bg-red-100 text-red-600", icon: null },
  };
  const cfg = map[status] || { label: status, className: "bg-gray-100 text-gray-600", icon: null };
  const Icon = cfg.icon;
  return (
    <Badge className={`${cfg.className} border-0 text-xs flex items-center gap-1 font-medium`}>
      {Icon && <Icon className="w-3 h-3" />}
      {cfg.label}
    </Badge>
  );
}

const ACTIVE_STATUSES = ["active", "pending_payment", "waitlist"];

export default function Dashboard() {
  const { user } = useAuth();
  const [expandedPast, setExpandedPast] = useState<Record<string, boolean>>({});

  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery<any[]>({
    queryKey: ["/api/enrollments"],
  });
  const { data: children = [] } = useQuery<any[]>({
    queryKey: ["/api/children"],
  });

  // Group enrollments by child
  const byChild = useMemo(() => {
    const map: Record<string, { active: any[]; past: any[] }> = {};
    for (const e of enrollments) {
      const cid = e.child?.id;
      if (!cid) continue;
      if (!map[cid]) map[cid] = { active: [], past: [] };
      if (ACTIVE_STATUSES.includes(e.enrollment?.status)) {
        map[cid].active.push(e);
      } else {
        map[cid].past.push(e);
      }
    }
    return map;
  }, [enrollments]);

  // Weekly schedule: next 7 days with class dots
  const weekSchedule = useMemo(() => {
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    });
    return days.map(d => {
      const jsDow = d.getDay(); // 0=Sun … 6=Sat
      // Our dayOfWeek: 1=Mon … 7=Sun
      const p2aDow = jsDow === 0 ? 7 : jsDow;
      const classes = enrollments
        .filter(e => ACTIVE_STATUSES.includes(e.enrollment?.status) && e.class?.dayOfWeek === p2aDow)
        .map(e => e.class);
      return { date: d, classes };
    });
  }, [enrollments]);

  const activeCount = enrollments.filter(e => e.enrollment?.status === "active").length;
  const pendingCount = enrollments.filter(e => e.enrollment?.status === "pending_payment").length;

  const getDayName = (dow: number) =>
    ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dow] || "?";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b">
          <div>
            <h1 className="text-3xl font-heading font-bold text-gray-900 mb-1">
              Welcome back{user?.firstName ? `, ${user.firstName}` : ""}!
            </h1>
            <p className="text-gray-500">Your family's athletic journey at a glance</p>
          </div>
          <div className="mt-3 md:mt-0 flex items-center gap-3">
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                <AlertCircle className="w-4 h-4" />
                {pendingCount} payment{pendingCount > 1 ? "s" : ""} due
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <CheckCircle2 className="w-4 h-4" />
              {activeCount} active enrolment{activeCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Link href="/classes">
            <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary-300">
              <CardContent className="p-5 text-center">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-2">
                  <Plus className="w-5 h-5 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">Find Programs</h3>
                <p className="text-xs text-gray-500 mt-0.5">Browse & enrol in classes</p>
              </CardContent>
            </Card>
          </Link>

          <a href="#weekly-schedule">
            <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-orange-300">
              <CardContent className="p-5 text-center">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-2">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">This Week</h3>
                <p className="text-xs text-gray-500 mt-0.5">See upcoming sessions</p>
              </CardContent>
            </Card>
          </a>

          <a href="#payments">
            <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-green-300">
              <CardContent className="p-5 text-center">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">Payments</h3>
                <p className="text-xs text-gray-500 mt-0.5">Invoices & history</p>
              </CardContent>
            </Card>
          </a>
        </div>

        {/* Weekly Schedule */}
        <Card className="mb-8" id="weekly-schedule">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              This Week's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            {enrollmentsLoading ? (
              <div className="h-16 flex items-center justify-center">
                <div className="animate-spin w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {weekSchedule.map(({ date, classes }, i) => {
                  const isToday = i === 0;
                  const hasClasses = classes.length > 0;
                  return (
                    <div
                      key={i}
                      className={`rounded-lg p-2 text-center border transition-colors ${
                        isToday ? "border-primary-300 bg-primary-50" :
                        hasClasses ? "border-orange-200 bg-orange-50" : "border-gray-100 bg-white"
                      }`}
                    >
                      <div className={`text-xs font-medium mb-1 ${isToday ? "text-primary-700" : "text-gray-500"}`}>
                        {DAYS[date.getDay()]}
                      </div>
                      <div className={`text-lg font-bold mb-1 ${isToday ? "text-primary-700" : "text-gray-800"}`}>
                        {date.getDate()}
                      </div>
                      {hasClasses ? (
                        <div className="space-y-0.5">
                          {classes.slice(0, 2).map((cls: any, j: number) => (
                            <div key={j} className="text-[10px] bg-orange-500 text-white rounded px-1 py-0.5 leading-tight truncate">
                              {formatTime(cls.startTime)}
                            </div>
                          ))}
                          {classes.length > 2 && (
                            <div className="text-[10px] text-orange-600">+{classes.length - 2}</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-[10px] text-gray-300">—</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {!enrollmentsLoading && enrollments.filter(e => ACTIVE_STATUSES.includes(e.enrollment?.status)).length === 0 && (
              <p className="text-sm text-gray-500 text-center mt-3">
                No active enrolments yet.{" "}
                <Link href="/classes" className="text-primary-600 font-medium hover:underline">Browse programs →</Link>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Per-child enrollment sections */}
        {enrollmentsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : children.length === 0 ? (
          <Card className="mb-6">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">No athletes added yet</h3>
              <p className="text-gray-500 text-sm mb-4">Add your child to get started with enrolments</p>
              <Link href="/classes">
                <Button><Plus className="w-4 h-4 mr-2" />Find a Program</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          children.map((child: any) => {
            const childData = byChild[child.id] || { active: [], past: [] };
            const age = getAge(child.dateOfBirth);
            const showPast = expandedPast[child.id];

            return (
              <Card key={child.id} className="mb-6">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-700 text-sm">
                        {child.firstName?.[0]}{child.lastName?.[0]}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{child.firstName} {child.lastName}</CardTitle>
                        {age !== null && (
                          <p className="text-sm text-gray-500">Age {age}{child.grade ? ` · ${child.grade}` : ""}</p>
                        )}
                      </div>
                    </div>
                    <Link href="/classes">
                      <Button size="sm" variant="outline" className="text-primary-600 border-primary-200 hover:bg-primary-50">
                        <Plus className="w-3.5 h-3.5 mr-1" /> Enrol in a class
                      </Button>
                    </Link>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Active enrolments */}
                  {childData.active.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      <p className="text-sm text-gray-500">No current enrolments</p>
                      <Link href="/classes">
                        <Button size="sm" className="mt-3">Browse programs</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {childData.active.map((e: any) => (
                        <EnrolmentCard key={e.enrollment.id} e={e} />
                      ))}
                    </div>
                  )}

                  {/* Past enrolments toggle */}
                  {childData.past.length > 0 && (
                    <div className="mt-4">
                      <button
                        onClick={() => setExpandedPast(prev => ({ ...prev, [child.id]: !prev[child.id] }))}
                        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        {showPast ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {showPast ? "Hide" : "Show"} past enrolments ({childData.past.length})
                      </button>

                      {showPast && (
                        <div className="mt-3 space-y-2 pl-2 border-l-2 border-gray-100">
                          {childData.past.map((e: any) => (
                            <PastEnrolmentRow key={e.enrollment.id} e={e} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}

        {/* Payments & Invoices */}
        <Card id="payments" className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="w-5 h-5 text-green-600" />
              Payments & Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {enrollments.filter(e => e.enrollment?.status === "active" && e.payment).length > 0 ? (
              <div className="space-y-3">
                {enrollments
                  .filter(e => e.enrollment?.status === "active" && e.payment)
                  .map((e: any) => (
                    <div key={e.enrollment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{e.class?.name}</div>
                        <div className="text-xs text-gray-500">
                          {e.child?.firstName} · {termLabel(e.class?.term, e.class?.year)}
                        </div>
                      </div>
                      <InvoiceActions paymentId={e.payment.id} />
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                Paid invoices will appear here once you have active enrolments.
              </p>
            )}
            {enrollments.filter(e => e.enrollment?.status === "pending_payment").map((e: any) => (
              <div key={e.enrollment.id} className="mt-3 flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div>
                  <div className="font-medium text-sm">{e.class?.name}</div>
                  <div className="text-xs text-amber-700">Payment required to confirm enrolment</div>
                </div>
                <Link href={`/checkout/${e.enrollment.id}`}>
                  <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">Pay Now</Button>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

function EnrolmentCard({ e }: { e: any }) {
  const cls = e.class;
  const venue = e.venue;
  const coach = e.coach;
  const enrollment = e.enrollment;

  const getDayName = (dow: number) =>
    ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dow] || "?";

  function formatTime(t: string) {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-primary-200 transition-colors">
      <div className="flex-1">
        <div className="flex items-start gap-2 flex-wrap">
          <h5 className="font-semibold text-gray-900">{cls?.name || "Unknown Class"}</h5>
          <StatusBadge status={enrollment?.status} />
        </div>
        <div className="mt-1.5 space-y-0.5 text-sm text-gray-500">
          {cls && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {getDayName(cls.dayOfWeek)}s · {formatTime(cls.startTime)} – {formatTime(cls.endTime)}
              {cls.term && <span className="ml-1 text-xs">· {termLabel(cls.term, cls.year)}</span>}
            </div>
          )}
          {venue && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {venue.name}
            </div>
          )}
          {coach && (
            <div className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              Coach {coach.firstName} {coach.lastName}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {enrollment?.status === "pending_payment" && (
          <Link href={`/checkout/${enrollment.id}`}>
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
              Pay Now
            </Button>
          </Link>
        )}
        {enrollment?.status === "active" && e.payment && (
          <InvoiceActions paymentId={e.payment.id} />
        )}
        {enrollment?.status === "waitlist" && (
          <span className="text-xs text-blue-600 font-medium">
            Position #{enrollment.waitlistPosition || "—"}
          </span>
        )}
      </div>
    </div>
  );
}

function PastEnrolmentRow({ e }: { e: any }) {
  const cls = e.class;
  const enrollment = e.enrollment;

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 text-sm">
      <div>
        <span className="font-medium text-gray-700">{cls?.name || "Class"}</span>
        {cls?.term && (
          <span className="ml-2 text-xs text-gray-400">{termLabel(cls.term, cls.year)}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {enrollment?.status === "active" && e.payment && (
          <Link href="/classes">
            <Button size="sm" variant="outline" className="text-xs h-7">Re-enrol</Button>
          </Link>
        )}
        <StatusBadge status={enrollment?.status} />
      </div>
    </div>
  );
}
