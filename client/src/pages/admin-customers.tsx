import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/layout/navbar";
import { Users, UserCheck, Baby, Search, Mail, Phone, Calendar, Plus, UserX, ChevronDown, ChevronRight, BookOpen } from "lucide-react";
import { Redirect } from "wouter";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const addChildSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  grade: z.string().optional(),
  medicalInfo: z.string().optional(),
  schoolName: z.string().optional(),
});

type AddChildForm = z.infer<typeof addChildSchema>;

export default function AdminCustomers() {
  const { user, isLoading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [selectedParent, setSelectedParent] = useState<any>(null);
  const [isAddChildOpen, setIsAddChildOpen] = useState(false);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ["/api/admin/customers"],
    enabled: user?.role === "admin",
  });

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["/api/admin/students"],
    enabled: user?.role === "admin",
  });

  const { data: childrenMaj = [] } = useQuery<any[]>({ queryKey: ["/api/admin/children-maj"] });
  const majByChild = new Map((childrenMaj as any[]).map((r) => [r.childId, r]));

  if (!authLoading && user?.role !== "admin") return <Redirect to="/" />;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  const allCustomers = Array.isArray(customers) ? customers : [];
  const allStudents = Array.isArray(students) ? students : [];

  const activeCustomers = allCustomers.filter((c: any) => c.active !== false);
  const inactiveCustomers = allCustomers.filter((c: any) => c.active === false);
  const activeStudents = allStudents.filter((s: any) => s.active !== false);
  const inactiveStudents = allStudents.filter((s: any) => s.active === false);

  const displayedCustomers = (showInactive ? allCustomers : activeCustomers).filter((c: any) =>
    c.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.mobile?.includes(searchTerm)
  );

  const displayedStudents = (showInactive ? allStudents : activeStudents).filter((s: any) =>
    s.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.parent?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.parent?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString('en-AU');
  };

  const getAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 'Unknown';
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const form = useForm<AddChildForm>({
    resolver: zodResolver(addChildSchema),
    defaultValues: { firstName: "", lastName: "", dateOfBirth: "", grade: "", medicalInfo: "", schoolName: "" },
  });

  const addChildMutation = useMutation({
    mutationFn: async (data: AddChildForm & { parentId: string }) => {
      const response = await fetch('/api/admin/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed to add child');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/students"] });
      toast({ title: "Success", description: "Child added successfully" });
      setIsAddChildOpen(false);
      form.reset();
      setSelectedParent(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add child", variant: "destructive" });
    },
  });

  const toggleUserActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${id}/active`, { active });
      return res.json();
    },
    onSuccess: (_, { active }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/students"] });
      toast({ title: active ? "Account activated" : "Account deactivated", description: active ? "Parent account is now active." : "Parent account has been set to inactive." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleChildActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/children/${id}/active`, { active });
      return res.json();
    },
    onSuccess: (_, { active }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/students"] });
      toast({ title: active ? "Student activated" : "Student deactivated", description: active ? "Student is now active." : "Student has been set to inactive." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleMaj = useMutation({
    mutationFn: async ({ majAthleteId, enabled }: { majAthleteId: string; enabled: boolean }) => {
      const res = await apiRequest("PATCH", `/api/maj/athletes/${majAthleteId}`, { enabled });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/children-maj"] }),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const createMaj = useMutation({
    mutationFn: async (childId: string) => {
      const res = await apiRequest("POST", `/api/admin/children/${childId}/maj-access`, {});
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/children-maj"] }),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const resetMajPassword = useMutation({
    mutationFn: async ({ majAthleteId, password }: { majAthleteId: string; password: string }) => {
      const res = await apiRequest("PATCH", `/api/maj/athletes/${majAthleteId}`, { password });
      return res.json();
    },
    onSuccess: () => { toast({ title: "Password updated" }); queryClient.invalidateQueries({ queryKey: ["/api/admin/children-maj"] }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleAddChild = (data: AddChildForm) => {
    if (!selectedParent) return;
    addChildMutation.mutate({ ...data, parentId: selectedParent.id });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">Customers & Students</h1>
          <p className="text-gray-600">Manage all registered families, toggle active status, and add children.</p>
        </div>

        {/* Search + Show Inactive toggle */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch id="show-inactive" checked={showInactive} onCheckedChange={setShowInactive} />
            <Label htmlFor="show-inactive" className="cursor-pointer text-sm text-gray-600">
              Show inactive records
            </Label>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Users className="h-4 w-4 mr-2" /> Active Parents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{activeCustomers.length}</div>
              {inactiveCustomers.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">{inactiveCustomers.length} inactive</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Baby className="h-4 w-4 mr-2" /> Active Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeStudents.length}</div>
              {inactiveStudents.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">{inactiveStudents.length} inactive</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <UserCheck className="h-4 w-4 mr-2" /> Active Enrollments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {allStudents.reduce((sum: number, s: any) => sum + (s.activeEnrollments || 0), 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Currently enrolled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Calendar className="h-4 w-4 mr-2" /> New This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {allCustomers.filter((c: any) => {
                  const d = new Date(c.createdAt);
                  const n = new Date();
                  return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
                }).length}
              </div>
              <p className="text-xs text-gray-500 mt-1">New families</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="customers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="customers">Parents ({displayedCustomers.length})</TabsTrigger>
            <TabsTrigger value="students">Students ({displayedStudents.length})</TabsTrigger>
          </TabsList>

          {/* Parents Tab */}
          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <CardTitle>All Parents / Guardians</CardTitle>
              </CardHeader>
              <CardContent>
                {customersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Children</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedCustomers.map((customer: any) => {
                        const isActive = customer.active !== false;
                        const customerChildren = customer.children || [];
                        return (
                          <TableRow key={customer.id} className={!isActive ? "opacity-60 bg-gray-50" : ""}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{customer.firstName} {customer.lastName}</div>
                                <div className="text-xs text-gray-400">ID: {customer.userId || customer.id?.slice(0, 8)}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 text-sm">
                                {customer.email && (
                                  <div className="flex items-center">
                                    <Mail className="h-3 w-3 mr-1 text-gray-400" /> {customer.email}
                                  </div>
                                )}
                                {customer.mobile && (
                                  <div className="flex items-center">
                                    <Phone className="h-3 w-3 mr-1 text-gray-400" /> {customer.mobile}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-medium">{customerChildren.length} child(ren)</div>
                                {customerChildren.slice(0, 2).map((child: any, idx: number) => (
                                  <div key={idx} className="text-gray-500 text-xs">{child.firstName} {child.lastName}</div>
                                ))}
                                {customerChildren.length > 2 && (
                                  <div className="text-gray-400 text-xs">+{customerChildren.length - 2} more</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {isActive ? (
                                <Badge className="bg-green-100 text-green-800">Active</Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                  <UserX className="h-3 w-3 mr-1" /> Inactive
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => { setSelectedParent(customer); setIsAddChildOpen(true); }}
                                  className="flex items-center gap-1"
                                >
                                  <Plus className="h-3 w-3" /> Add Child
                                </Button>
                                <Button
                                  variant={isActive ? "outline" : "default"}
                                  size="sm"
                                  disabled={toggleUserActive.isPending}
                                  onClick={() => toggleUserActive.mutate({ id: customer.id, active: !isActive })}
                                >
                                  {isActive ? "Deactivate" : "Activate"}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {displayedCustomers.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                            No parents found. {!showInactive && inactiveCustomers.length > 0 && "Toggle \"Show inactive\" to see inactive records."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>All Students</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {studentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-6"></TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Age & Grade</TableHead>
                        <TableHead>Parent</TableHead>
                        <TableHead>Enrolments</TableHead>
                        <TableHead>Medical</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedStudents.map((student: any) => {
                        const isActive = student.active !== false;
                        const isExpanded = expandedStudentId === student.id;
                        const enrollments: any[] = student.enrollments || [];
                        const activeEnrs = enrollments.filter((e: any) => e.enrollment?.status === 'active' || e.enrollment?.status === 'pending_payment' || e.enrollment?.status === 'waitlist');
                        const pastEnrs = enrollments.filter((e: any) => !['active','pending_payment','waitlist'].includes(e.enrollment?.status));

                        const statusColor = (s: string) => {
                          if (s === 'active') return 'bg-green-100 text-green-800';
                          if (s === 'pending_payment') return 'bg-amber-100 text-amber-800';
                          if (s === 'waitlist') return 'bg-blue-100 text-blue-800';
                          return 'bg-gray-100 text-gray-600';
                        };

                        const termStr = (e: any) => {
                          const t = e.class?.term?.replace('term_', 'T') || '';
                          const y = e.class?.year || '';
                          return t && y ? `${y} ${t.replace('T','Term ')}` : '';
                        };

                        const dayStr = (e: any) => {
                          const days = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                          return days[e.class?.dayOfWeek] || '';
                        };

                        return (
                          <>
                            <TableRow
                              key={student.id}
                              className={`${!isActive ? "opacity-60 bg-gray-50" : ""} cursor-pointer hover:bg-gray-50`}
                              onClick={() => setExpandedStudentId(isExpanded ? null : student.id)}
                            >
                              <TableCell className="py-3 pl-3 pr-0">
                                {isExpanded
                                  ? <ChevronDown className="h-4 w-4 text-gray-400" />
                                  : <ChevronRight className="h-4 w-4 text-gray-400" />}
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{student.firstName} {student.lastName}</div>
                                <div className="text-xs text-gray-400">DOB: {formatDate(student.dateOfBirth)}</div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium text-sm">{getAge(student.dateOfBirth)} yrs</div>
                                {student.grade && <div className="text-xs text-gray-500">{student.grade}</div>}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm font-medium">
                                  {student.parent?.firstName} {student.parent?.lastName}
                                </div>
                                {student.parent?.email && (
                                  <div className="text-xs text-gray-500">{student.parent.email}</div>
                                )}
                              </TableCell>
                              <TableCell onClick={e => e.stopPropagation()}>
                                <div className="flex gap-1 flex-wrap">
                                  <Badge className="bg-green-100 text-green-800 text-xs border-0">{student.activeEnrollments} Active</Badge>
                                  <Badge variant="secondary" className="text-xs">{student.totalEnrollments} Total</Badge>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm max-w-xs">
                                {student.medicalInfo ? (
                                  <span className="truncate block text-xs" title={student.medicalInfo}>{student.medicalInfo}</span>
                                ) : (
                                  <span className="text-gray-400 text-xs">None</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {isActive ? (
                                  <Badge className="bg-green-100 text-green-800 border-0">Active</Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                    <UserX className="h-3 w-3 mr-1" /> Inactive
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell onClick={e => e.stopPropagation()}>
                                <Button
                                  variant={isActive ? "outline" : "default"}
                                  size="sm"
                                  disabled={toggleChildActive.isPending}
                                  onClick={() => toggleChildActive.mutate({ id: student.id, active: !isActive })}
                                >
                                  {isActive ? "Deactivate" : "Activate"}
                                </Button>
                              </TableCell>
                              <TableCell onClick={e => e.stopPropagation()}>
                                {(() => {
                                  const maj = majByChild.get(student.id);
                                  if (!maj || !maj.majAthleteId) {
                                    return (
                                      <Button size="sm" variant="outline" onClick={() => createMaj.mutate(student.id)} disabled={createMaj.isPending}>
                                        Create MAJ access
                                      </Button>
                                    );
                                  }
                                  return (
                                    <div className="flex items-center gap-2 text-xs">
                                      <Switch checked={!!maj.enabled} onCheckedChange={(v) => toggleMaj.mutate({ majAthleteId: maj.majAthleteId, enabled: v })} />
                                      <span className="text-gray-600">{maj.username}</span>
                                      <span className="text-gray-400">· {maj.displayPassword}</span>
                                      <Button size="sm" variant="ghost" onClick={() => { const p = window.prompt("New password", maj.displayPassword ?? ""); if (p) resetMajPassword.mutate({ majAthleteId: maj.majAthleteId, password: p }); }}>
                                        Reset
                                      </Button>
                                    </div>
                                  );
                                })()}
                              </TableCell>
                            </TableRow>

                            {/* Expanded enrolment history */}
                            {isExpanded && (
                              <TableRow key={`${student.id}-expanded`} className="bg-blue-50/40">
                                <TableCell colSpan={8} className="p-0">
                                  <div className="px-8 py-4">
                                    <div className="flex items-center gap-2 mb-3">
                                      <BookOpen className="h-4 w-4 text-primary-600" />
                                      <span className="font-semibold text-sm text-gray-800">
                                        Enrolment History for {student.firstName} {student.lastName}
                                      </span>
                                    </div>

                                    {enrollments.length === 0 ? (
                                      <p className="text-sm text-gray-400 italic">No enrolments on record.</p>
                                    ) : (
                                      <div className="space-y-4">
                                        {activeEnrs.length > 0 && (
                                          <div>
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Current / Active</p>
                                            <div className="space-y-1.5">
                                              {activeEnrs.map((e: any) => (
                                                <div key={e.enrollment?.id} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-gray-200 text-sm">
                                                  <span className="font-medium flex-1">{e.class?.name || '—'}</span>
                                                  <span className="text-xs text-gray-400">{termStr(e)}</span>
                                                  {dayStr(e) && <span className="text-xs text-gray-400">{dayStr(e)} {e.class?.startTime}</span>}
                                                  {e.venue && <span className="text-xs text-gray-400 hidden md:inline">{e.venue.name}</span>}
                                                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusColor(e.enrollment?.status)}`}>
                                                    {e.enrollment?.status?.replace('_', ' ')}
                                                  </span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {pastEnrs.length > 0 && (
                                          <div>
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Past</p>
                                            <div className="space-y-1.5">
                                              {pastEnrs.map((e: any) => (
                                                <div key={e.enrollment?.id} className="flex items-center gap-3 bg-white/60 rounded-lg px-3 py-2 border border-gray-100 text-sm opacity-75">
                                                  <span className="font-medium flex-1 text-gray-600">{e.class?.name || '—'}</span>
                                                  <span className="text-xs text-gray-400">{termStr(e)}</span>
                                                  {dayStr(e) && <span className="text-xs text-gray-400">{dayStr(e)}</span>}
                                                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusColor(e.enrollment?.status)}`}>
                                                    {e.enrollment?.status || '—'}
                                                  </span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        );
                      })}
                      {displayedStudents.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                            No students found. {!showInactive && inactiveStudents.length > 0 && "Toggle \"Show inactive\" to see inactive records."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Child Dialog */}
      <Dialog open={isAddChildOpen} onOpenChange={setIsAddChildOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Child to {selectedParent?.firstName} {selectedParent?.lastName}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddChild)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="firstName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl><Input placeholder="First name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl><Input placeholder="Last name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="grade" render={({ field }) => (
                <FormItem>
                  <FormLabel>Grade (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="prep">Prep</SelectItem>
                      {["1","2","3","4","5","6"].map(g => <SelectItem key={g} value={g}>Grade {g}</SelectItem>)}
                      {["7","8","9","10","11","12"].map(g => <SelectItem key={g} value={g}>Year {g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="schoolName" render={({ field }) => (
                <FormItem>
                  <FormLabel>School (Optional)</FormLabel>
                  <FormControl><Input placeholder="School name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="medicalInfo" render={({ field }) => (
                <FormItem>
                  <FormLabel>Medical Information (Optional)</FormLabel>
                  <FormControl><Input placeholder="Any medical conditions or allergies" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddChildOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={addChildMutation.isPending}>
                  {addChildMutation.isPending ? "Adding..." : "Add Child"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
