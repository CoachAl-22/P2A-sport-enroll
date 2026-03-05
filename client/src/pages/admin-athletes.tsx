import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/layout/navbar";
import { PlusIcon, EditIcon, TrashIcon, Trophy, Target, TrendingUp, Search, ChevronDown, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Redirect } from "wouter";

const recordTypes = [
  { value: "100m_sprint", label: "100m Sprint", unit: "seconds" },
  { value: "200m_sprint", label: "200m Sprint", unit: "seconds" },
  { value: "400m_run", label: "400m Run", unit: "seconds" },
  { value: "800m_run", label: "800m Run", unit: "seconds" },
  { value: "1500m_run", label: "1500m Run", unit: "seconds" },
  { value: "long_jump", label: "Long Jump", unit: "meters" },
  { value: "high_jump", label: "High Jump", unit: "meters" },
  { value: "triple_jump", label: "Triple Jump", unit: "meters" },
  { value: "shot_put", label: "Shot Put", unit: "meters" },
  { value: "discus", label: "Discus", unit: "meters" },
  { value: "javelin", label: "Javelin", unit: "meters" },
  { value: "hurdles", label: "Hurdles", unit: "seconds" },
  { value: "relay", label: "Relay", unit: "seconds" },
  { value: "vertical_jump", label: "Vertical Jump", unit: "cm" },
  { value: "agility_test", label: "Agility Test", unit: "seconds" },
  { value: "beep_test", label: "Beep Test", unit: "level" },
];

const goalCategories = [
  { value: "speed", label: "Speed" },
  { value: "strength", label: "Strength" },
  { value: "technique", label: "Technique" },
  { value: "endurance", label: "Endurance" },
  { value: "flexibility", label: "Flexibility" },
  { value: "agility", label: "Agility" },
];

export default function AdminAthletes() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("records");
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [isAddAthleteOpen, setIsAddAthleteOpen] = useState(false);
  const [newAthlete, setNewAthlete] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    grade: "",
    parentId: "",
    medicalInfo: "",
    emergencyContact: "",
  });

  const [newRecord, setNewRecord] = useState({
    recordType: "",
    value: "",
    unit: "",
    recordDate: new Date().toISOString().split("T")[0],
    notes: "",
    isPersonalBest: false,
  });

  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    targetValue: "",
    targetUnit: "",
    currentValue: "",
    targetDate: "",
    status: "active",
    priority: "medium",
    category: "speed",
  });

  const { data: children = [], isLoading: childrenLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/all-children"],
  });

  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/customers"],
  });

  const createAthleteMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/children", data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-children"] });
      setIsAddAthleteOpen(false);
      setNewAthlete({ firstName: "", lastName: "", dateOfBirth: "", grade: "", parentId: "", medicalInfo: "", emergencyContact: "" });
      toast({ title: "Athlete added successfully" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const { data: records = [], isLoading: recordsLoading } = useQuery<any[]>({
    queryKey: ["/api/performance-records", selectedChildId],
    queryFn: () => fetch(`/api/performance-records/${selectedChildId}`).then(r => r.json()),
    enabled: !!selectedChildId,
  });

  const { data: goals = [], isLoading: goalsLoading } = useQuery<any[]>({
    queryKey: ["/api/training-goals", selectedChildId],
    queryFn: () => fetch(`/api/training-goals/${selectedChildId}`).then(r => r.json()),
    enabled: !!selectedChildId,
  });

  const createRecordMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/performance-records", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/performance-records", selectedChildId] });
      setIsAddRecordOpen(false);
      resetRecordForm();
      toast({ title: "Record added successfully" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateRecordMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PUT", `/api/performance-records/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/performance-records", selectedChildId] });
      setEditingRecord(null);
      toast({ title: "Record updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteRecordMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/performance-records/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/performance-records", selectedChildId] });
      toast({ title: "Record deleted" });
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/training-goals", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-goals", selectedChildId] });
      setIsAddGoalOpen(false);
      resetGoalForm();
      toast({ title: "Goal added successfully" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PUT", `/api/training-goals/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-goals", selectedChildId] });
      setEditingGoal(null);
      toast({ title: "Goal updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/training-goals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-goals", selectedChildId] });
      toast({ title: "Goal deleted" });
    },
  });

  const resetRecordForm = () => {
    setNewRecord({ recordType: "", value: "", unit: "", recordDate: new Date().toISOString().split("T")[0], notes: "", isPersonalBest: false });
  };

  const resetGoalForm = () => {
    setNewGoal({ title: "", description: "", targetValue: "", targetUnit: "", currentValue: "", targetDate: "", status: "active", priority: "medium", category: "speed" });
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user || user.role !== "admin") return <Redirect to="/login" />;

  const filteredChildren = children.filter((c: any) =>
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedChild = children.find((c: any) => c.id === selectedChildId);
  const getRecordLabel = (type: string) => recordTypes.find(r => r.value === type)?.label || type;

  const handleSubmitRecord = () => {
    if (!newRecord.recordType || !newRecord.value) {
      toast({ title: "Missing fields", description: "Please fill in the event type and value", variant: "destructive" });
      return;
    }
    createRecordMutation.mutate({
      childId: selectedChildId,
      recordType: newRecord.recordType,
      value: newRecord.value,
      unit: newRecord.unit || recordTypes.find(r => r.value === newRecord.recordType)?.unit || "units",
      recordDate: new Date(newRecord.recordDate).toISOString(),
      notes: newRecord.notes || null,
      isPersonalBest: newRecord.isPersonalBest,
    });
  };

  const handleSubmitGoal = () => {
    if (!newGoal.title) {
      toast({ title: "Missing fields", description: "Please fill in the goal title", variant: "destructive" });
      return;
    }
    createGoalMutation.mutate({
      childId: selectedChildId,
      title: newGoal.title,
      description: newGoal.description || null,
      targetValue: newGoal.targetValue || null,
      targetUnit: newGoal.targetUnit || null,
      currentValue: newGoal.currentValue || null,
      targetDate: newGoal.targetDate ? new Date(newGoal.targetDate).toISOString() : null,
      status: newGoal.status,
      priority: newGoal.priority,
      category: newGoal.category,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-gray-900">Athlete Performance Manager</h1>
          <p className="text-gray-600 mt-1">Add records, set goals, and track athlete progress</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Athlete Selector Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Athletes</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => setIsAddAthleteOpen(true)} className="gap-1">
                    <UserPlus className="w-4 h-4" /> Add
                  </Button>
                </div>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search athletes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent className="max-h-[60vh] overflow-y-auto space-y-1">
                {childrenLoading ? (
                  <p className="text-sm text-gray-500">Loading athletes...</p>
                ) : filteredChildren.length === 0 ? (
                  <p className="text-sm text-gray-500">No athletes found</p>
                ) : (
                  filteredChildren.map((child: any) => (
                    <button
                      key={child.id}
                      onClick={() => setSelectedChildId(child.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors text-sm ${
                        selectedChildId === child.id
                          ? "bg-primary-500 text-white font-medium"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      <div className="font-medium">{child.firstName} {child.lastName}</div>
                      {child.grade && <div className={`text-xs ${selectedChildId === child.id ? "text-white/70" : "text-gray-400"}`}>{child.grade}</div>}
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {!selectedChildId ? (
              <Card className="flex items-center justify-center min-h-[400px]">
                <div className="text-center text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <h3 className="text-lg font-medium">Select an athlete</h3>
                  <p className="text-sm">Choose an athlete from the list to manage their records and goals</p>
                </div>
              </Card>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedChild?.firstName} {selectedChild?.lastName}</h2>
                    {selectedChild?.grade && <p className="text-sm text-gray-500">{selectedChild.grade}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-primary-500 border-primary-200">
                      <Trophy className="w-3 h-3 mr-1" />
                      {records.filter((r: any) => r.isPersonalBest).length} PBs
                    </Badge>
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      <Target className="w-3 h-3 mr-1" />
                      {goals.filter((g: any) => g.status === "active").length} Active Goals
                    </Badge>
                  </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="records" className="gap-1"><TrendingUp className="w-4 h-4" /> Performance Records</TabsTrigger>
                    <TabsTrigger value="goals" className="gap-1"><Target className="w-4 h-4" /> Training Goals</TabsTrigger>
                  </TabsList>

                  {/* PERFORMANCE RECORDS TAB */}
                  <TabsContent value="records">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Performance Records</CardTitle>
                        <Button onClick={() => setIsAddRecordOpen(true)} size="sm">
                          <PlusIcon className="w-4 h-4 mr-1" /> Add Record
                        </Button>
                      </CardHeader>
                      <CardContent>
                        {recordsLoading ? (
                          <p className="text-gray-500">Loading records...</p>
                        ) : records.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <TrendingUp className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                            <p>No records yet. Add the first performance record.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {records.map((record: any) => (
                              <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                                <div className="flex items-center gap-4">
                                  {record.isPersonalBest && <Trophy className="w-5 h-5 text-yellow-500" />}
                                  <div>
                                    <div className="font-medium text-gray-900">{getRecordLabel(record.recordType)}</div>
                                    <div className="text-sm text-gray-500">
                                      {new Date(record.recordDate).toLocaleDateString()}
                                      {record.notes && ` — ${record.notes}`}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <span className="text-lg font-bold text-primary-500">{record.value}</span>
                                    <span className="text-sm text-gray-500 ml-1">{record.unit}</span>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => {
                                        setEditingRecord(record);
                                        setNewRecord({
                                          recordType: record.recordType,
                                          value: record.value,
                                          unit: record.unit,
                                          recordDate: new Date(record.recordDate).toISOString().split("T")[0],
                                          notes: record.notes || "",
                                          isPersonalBest: record.isPersonalBest || false,
                                        });
                                      }}
                                    >
                                      <EditIcon className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-red-500 hover:text-red-700"
                                      onClick={() => {
                                        if (confirm("Delete this record?")) deleteRecordMutation.mutate(record.id);
                                      }}
                                    >
                                      <TrashIcon className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* TRAINING GOALS TAB */}
                  <TabsContent value="goals">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Training Goals</CardTitle>
                        <Button onClick={() => setIsAddGoalOpen(true)} size="sm">
                          <PlusIcon className="w-4 h-4 mr-1" /> Add Goal
                        </Button>
                      </CardHeader>
                      <CardContent>
                        {goalsLoading ? (
                          <p className="text-gray-500">Loading goals...</p>
                        ) : goals.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <Target className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                            <p>No goals yet. Set the first training goal.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {goals.map((goal: any) => {
                              const progress = goal.targetValue && goal.currentValue
                                ? Math.min(100, Math.round((parseFloat(goal.currentValue) / parseFloat(goal.targetValue)) * 100))
                                : 0;
                              return (
                                <div key={goal.id} className="p-4 bg-gray-50 rounded-lg border">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-gray-900">{goal.title}</h4>
                                        <Badge variant={goal.status === "active" ? "default" : goal.status === "achieved" ? "secondary" : "outline"} className="text-xs">
                                          {goal.status}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs capitalize">{goal.priority}</Badge>
                                        {goal.category && <Badge variant="outline" className="text-xs capitalize">{goal.category}</Badge>}
                                      </div>
                                      {goal.description && <p className="text-sm text-gray-500 mt-1">{goal.description}</p>}
                                    </div>
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => {
                                          setEditingGoal(goal);
                                          setNewGoal({
                                            title: goal.title,
                                            description: goal.description || "",
                                            targetValue: goal.targetValue || "",
                                            targetUnit: goal.targetUnit || "",
                                            currentValue: goal.currentValue || "",
                                            targetDate: goal.targetDate ? new Date(goal.targetDate).toISOString().split("T")[0] : "",
                                            status: goal.status || "active",
                                            priority: goal.priority || "medium",
                                            category: goal.category || "speed",
                                          });
                                        }}
                                      >
                                        <EditIcon className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-500 hover:text-red-700"
                                        onClick={() => {
                                          if (confirm("Delete this goal?")) deleteGoalMutation.mutate(goal.id);
                                        }}
                                      >
                                        <TrashIcon className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  {goal.targetValue && (
                                    <div className="mt-3">
                                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                                        <span>Current: {goal.currentValue || 0} {goal.targetUnit}</span>
                                        <span>Target: {goal.targetValue} {goal.targetUnit}</span>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                          className={`h-2 rounded-full transition-all ${progress >= 100 ? "bg-green-500" : "bg-primary-500"}`}
                                          style={{ width: `${progress}%` }}
                                        />
                                      </div>
                                      <div className="text-right text-xs text-gray-400 mt-1">{progress}%</div>
                                    </div>
                                  )}
                                  {goal.targetDate && (
                                    <p className="text-xs text-gray-400 mt-2">Target date: {new Date(goal.targetDate).toLocaleDateString()}</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ADD / EDIT RECORD DIALOG */}
      <Dialog open={isAddRecordOpen || !!editingRecord} onOpenChange={(open) => { if (!open) { setIsAddRecordOpen(false); setEditingRecord(null); resetRecordForm(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRecord ? "Edit Record" : "Add Performance Record"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Event Type *</Label>
              <Select value={newRecord.recordType} onValueChange={(v) => {
                const rt = recordTypes.find(r => r.value === v);
                setNewRecord({ ...newRecord, recordType: v, unit: rt?.unit || newRecord.unit });
              }}>
                <SelectTrigger><SelectValue placeholder="Select event..." /></SelectTrigger>
                <SelectContent>
                  {recordTypes.map(rt => (
                    <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Value *</Label>
                <Input type="number" step="0.001" placeholder="e.g. 12.45" value={newRecord.value} onChange={(e) => setNewRecord({ ...newRecord, value: e.target.value })} />
              </div>
              <div>
                <Label>Unit</Label>
                <Input value={newRecord.unit} onChange={(e) => setNewRecord({ ...newRecord, unit: e.target.value })} placeholder="seconds, meters..." />
              </div>
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={newRecord.recordDate} onChange={(e) => setNewRecord({ ...newRecord, recordDate: e.target.value })} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea placeholder="Any observations..." value={newRecord.notes} onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="pb" checked={newRecord.isPersonalBest} onChange={(e) => setNewRecord({ ...newRecord, isPersonalBest: e.target.checked })} className="w-4 h-4 accent-yellow-500" />
              <Label htmlFor="pb" className="flex items-center gap-1 cursor-pointer"><Trophy className="w-4 h-4 text-yellow-500" /> Personal Best</Label>
            </div>
            <Button
              className="w-full"
              disabled={createRecordMutation.isPending || updateRecordMutation.isPending}
              onClick={() => {
                if (editingRecord) {
                  updateRecordMutation.mutate({
                    id: editingRecord.id,
                    recordType: newRecord.recordType,
                    value: newRecord.value,
                    unit: newRecord.unit,
                    recordDate: new Date(newRecord.recordDate).toISOString(),
                    notes: newRecord.notes || null,
                    isPersonalBest: newRecord.isPersonalBest,
                  });
                } else {
                  handleSubmitRecord();
                }
              }}
            >
              {createRecordMutation.isPending || updateRecordMutation.isPending ? "Saving..." : editingRecord ? "Update Record" : "Add Record"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ADD / EDIT GOAL DIALOG */}
      <Dialog open={isAddGoalOpen || !!editingGoal} onOpenChange={(open) => { if (!open) { setIsAddGoalOpen(false); setEditingGoal(null); resetGoalForm(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingGoal ? "Edit Goal" : "Add Training Goal"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Goal Title *</Label>
              <Input placeholder="e.g. Improve 100m Sprint Time" value={newGoal.title} onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea placeholder="Details about this goal..." value={newGoal.description} onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Current Value</Label>
                <Input type="number" step="0.001" placeholder="e.g. 12.45" value={newGoal.currentValue} onChange={(e) => setNewGoal({ ...newGoal, currentValue: e.target.value })} />
              </div>
              <div>
                <Label>Target Value</Label>
                <Input type="number" step="0.001" placeholder="e.g. 11.50" value={newGoal.targetValue} onChange={(e) => setNewGoal({ ...newGoal, targetValue: e.target.value })} />
              </div>
              <div>
                <Label>Unit</Label>
                <Input placeholder="seconds" value={newGoal.targetUnit} onChange={(e) => setNewGoal({ ...newGoal, targetUnit: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Target Date</Label>
              <Input type="date" value={newGoal.targetDate} onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={newGoal.category} onValueChange={(v) => setNewGoal({ ...newGoal, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {goalCategories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={newGoal.priority} onValueChange={(v) => setNewGoal({ ...newGoal, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={newGoal.status} onValueChange={(v) => setNewGoal({ ...newGoal, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="achieved">Achieved</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              className="w-full"
              disabled={createGoalMutation.isPending || updateGoalMutation.isPending}
              onClick={() => {
                if (editingGoal) {
                  updateGoalMutation.mutate({
                    id: editingGoal.id,
                    title: newGoal.title,
                    description: newGoal.description || null,
                    targetValue: newGoal.targetValue || null,
                    targetUnit: newGoal.targetUnit || null,
                    currentValue: newGoal.currentValue || null,
                    targetDate: newGoal.targetDate ? new Date(newGoal.targetDate).toISOString() : null,
                    status: newGoal.status,
                    priority: newGoal.priority,
                    category: newGoal.category,
                  });
                } else {
                  handleSubmitGoal();
                }
              }}
            >
              {createGoalMutation.isPending || updateGoalMutation.isPending ? "Saving..." : editingGoal ? "Update Goal" : "Add Goal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ADD ATHLETE DIALOG */}
      <Dialog open={isAddAthleteOpen} onOpenChange={(open) => { if (!open) { setIsAddAthleteOpen(false); setNewAthlete({ firstName: "", lastName: "", dateOfBirth: "", grade: "", parentId: "", medicalInfo: "", emergencyContact: "" }); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Athlete</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>First Name *</Label>
                <Input placeholder="First name" value={newAthlete.firstName} onChange={(e) => setNewAthlete({ ...newAthlete, firstName: e.target.value })} />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input placeholder="Last name" value={newAthlete.lastName} onChange={(e) => setNewAthlete({ ...newAthlete, lastName: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Date of Birth *</Label>
              <Input type="date" value={newAthlete.dateOfBirth} onChange={(e) => setNewAthlete({ ...newAthlete, dateOfBirth: e.target.value })} />
            </div>
            <div>
              <Label>Grade / Year Level</Label>
              <Select value={newAthlete.grade || "N/A"} onValueChange={(v) => setNewAthlete({ ...newAthlete, grade: v })}>
                <SelectTrigger><SelectValue placeholder="Select grade..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="N/A">N/A</SelectItem>
                  <SelectItem value="Prep">Prep</SelectItem>
                  <SelectItem value="Year 1">Year 1</SelectItem>
                  <SelectItem value="Year 2">Year 2</SelectItem>
                  <SelectItem value="Year 3">Year 3</SelectItem>
                  <SelectItem value="Year 4">Year 4</SelectItem>
                  <SelectItem value="Year 5">Year 5</SelectItem>
                  <SelectItem value="Year 6">Year 6</SelectItem>
                  <SelectItem value="Year 7">Year 7</SelectItem>
                  <SelectItem value="Year 8">Year 8</SelectItem>
                  <SelectItem value="Year 9">Year 9</SelectItem>
                  <SelectItem value="Year 10">Year 10</SelectItem>
                  <SelectItem value="Year 11">Year 11</SelectItem>
                  <SelectItem value="Year 12">Year 12</SelectItem>
                  <SelectItem value="Adult">Adult</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Parent / Guardian</Label>
              <Select value={newAthlete.parentId || "N/A"} onValueChange={(v) => setNewAthlete({ ...newAthlete, parentId: v })}>
                <SelectTrigger><SelectValue placeholder="Select parent..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="N/A">N/A (No parent linked)</SelectItem>
                  {customers.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Emergency Contact</Label>
              <Input placeholder="Phone number" value={newAthlete.emergencyContact} onChange={(e) => setNewAthlete({ ...newAthlete, emergencyContact: e.target.value })} />
            </div>
            <div>
              <Label>Medical Information</Label>
              <Textarea placeholder="Allergies, conditions, etc." value={newAthlete.medicalInfo} onChange={(e) => setNewAthlete({ ...newAthlete, medicalInfo: e.target.value })} />
            </div>
            <Button
              className="w-full"
              disabled={createAthleteMutation.isPending}
              onClick={() => {
                if (!newAthlete.firstName || !newAthlete.lastName || !newAthlete.dateOfBirth) {
                  toast({ title: "Missing fields", description: "Please fill in first name, last name, and date of birth", variant: "destructive" });
                  return;
                }
                const parentValue = (!newAthlete.parentId || newAthlete.parentId === "N/A") ? user?.id : newAthlete.parentId;
                const gradeValue = (!newAthlete.grade || newAthlete.grade === "N/A") ? null : newAthlete.grade;
                createAthleteMutation.mutate({
                  firstName: newAthlete.firstName,
                  lastName: newAthlete.lastName,
                  dateOfBirth: new Date(newAthlete.dateOfBirth).toISOString(),
                  grade: gradeValue,
                  parentId: parentValue,
                  medicalInfo: newAthlete.medicalInfo || null,
                  emergencyContact: newAthlete.emergencyContact || null,
                });
              }}
            >
              {createAthleteMutation.isPending ? "Adding..." : "Add Athlete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
