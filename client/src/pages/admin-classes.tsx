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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/navbar";
import { PlusIcon, EditIcon, TrashIcon, ClockIcon, MapPinIcon, UsersIcon, CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Redirect } from "wouter";

const sportTypes = [
  "Basketball", "Soccer", "Rugby", "Tennis", "Athletics", "Swimming", "Cricket", "Netball"
];

const dayOptions = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" }
];

export default function AdminClasses() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [newClass, setNewClass] = useState({
    name: "",
    description: "",
    sportType: "",
    venueId: "",
    coachId: "",
    termConfigId: "",
    term: "",
    year: new Date().getFullYear(),
    dayOfWeek: "",
    startTime: "",
    endTime: "",
    minAge: "",
    maxAge: "",
    maxCapacity: "",
    pricePerTerm: ""
  });

  // Redirect if not admin
  if (!authLoading && (user as any)?.user?.role !== "admin") {
    return <Redirect to="/" />;
  }

  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ["/api/classes"],
    enabled: (user as any)?.user?.role === "admin",
  });

  const { data: venues } = useQuery({
    queryKey: ["/api/venues"],
    enabled: (user as any)?.user?.role === "admin",
  });

  const { data: coaches } = useQuery({
    queryKey: ["/api/coaches"],
    enabled: (user as any)?.user?.role === "admin",
  });

  const { data: termConfigs } = useQuery({
    queryKey: ["/api/term-configurations"],
    enabled: (user as any)?.user?.role === "admin",
  });

  const createClassMutation = useMutation({
    mutationFn: async (classData: any) => {
      return apiRequest("POST", "/api/classes", classData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      setIsAddDialogOpen(false);
      setNewClass({
        name: "", description: "", sportType: "", venueId: "", coachId: "", 
        termConfigId: "", term: "", year: new Date().getFullYear(), dayOfWeek: "", 
        startTime: "", endTime: "", minAge: "", maxAge: "", maxCapacity: "", pricePerTerm: ""
      });
      toast({
        title: "Success",
        description: "Class created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create class",
        variant: "destructive",
      });
    },
  });

  const updateClassMutation = useMutation({
    mutationFn: async ({ id, ...classData }: any) => {
      return apiRequest("PUT", `/api/classes/${id}`, classData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      setEditingClass(null);
      toast({
        title: "Success",
        description: "Class updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update class",
        variant: "destructive",
      });
    },
  });

  const deleteClassMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/classes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({
        title: "Success",
        description: "Class deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete class",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClass) {
      updateClassMutation.mutate({ ...editingClass, ...newClass });
    } else {
      createClassMutation.mutate({
        ...newClass,
        year: parseInt(newClass.year.toString()),
        dayOfWeek: parseInt(newClass.dayOfWeek),
        minAge: parseInt(newClass.minAge),
        maxAge: parseInt(newClass.maxAge),
        maxCapacity: parseInt(newClass.maxCapacity),
        pricePerTerm: parseFloat(newClass.pricePerTerm)
      });
    }
  };

  const handleEdit = (classItem: any) => {
    setEditingClass(classItem);
    setNewClass({
      name: classItem.name || "",
      description: classItem.description || "",
      sportType: classItem.sportType || "",
      venueId: classItem.venueId || "",
      coachId: classItem.coachId || "",
      termConfigId: classItem.termConfigId || "",
      term: classItem.term || "",
      year: classItem.year || new Date().getFullYear(),
      dayOfWeek: classItem.dayOfWeek?.toString() || "",
      startTime: classItem.startTime || "",
      endTime: classItem.endTime || "",
      minAge: classItem.minAge?.toString() || "",
      maxAge: classItem.maxAge?.toString() || "",
      maxCapacity: classItem.maxCapacity?.toString() || "",
      pricePerTerm: classItem.pricePerTerm?.toString() || ""
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this class?")) {
      deleteClassMutation.mutate(id);
    }
  };

  const getVenueName = (venueId: string) => {
    return venues?.find((v: any) => v.id === venueId)?.name || "Unknown Venue";
  };

  const getCoachName = (coachId: string) => {
    const coach = coaches?.find((c: any) => c.id === coachId);
    return coach ? `${coach.firstName} ${coach.lastName}` : "Unknown Coach";
  };

  const getDayName = (dayOfWeek: number) => {
    return dayOptions.find(d => d.value === dayOfWeek)?.label || "Unknown";
  };

  if (authLoading || classesLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-gray-900">
              Class Management
            </h1>
            <p className="text-gray-600 mt-2">
              Create and manage athletic program classes
            </p>
          </div>
          <Button 
            onClick={() => {
              setEditingClass(null);
              setNewClass({
                name: "", description: "", sportType: "", venueId: "", coachId: "", 
                termConfigId: "", term: "", year: new Date().getFullYear(), dayOfWeek: "", 
                startTime: "", endTime: "", minAge: "", maxAge: "", maxCapacity: "", pricePerTerm: ""
              });
              setIsAddDialogOpen(true);
            }}
            className="bg-primary-500 hover:bg-primary-600"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add New Class
          </Button>
        </div>

        {/* Classes Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class Name</TableHead>
                  <TableHead>Sport</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Coach</TableHead>
                  <TableHead>Enrollment</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes?.map((classItem: any) => (
                  <TableRow key={classItem.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{classItem.name}</div>
                        <div className="text-sm text-gray-500">
                          Ages {classItem.minAge}-{classItem.maxAge}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{classItem.sportType}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{getDayName(classItem.dayOfWeek)}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <ClockIcon className="w-4 h-4" />
                        <span>{classItem.startTime} - {classItem.endTime}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm">
                        <MapPinIcon className="w-4 h-4" />
                        <span>{getVenueName(classItem.venueId)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getCoachName(classItem.coachId)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <UsersIcon className="w-4 h-4" />
                        <span>{classItem.currentEnrollment || 0}/{classItem.maxCapacity}</span>
                      </div>
                    </TableCell>
                    <TableCell>${classItem.pricePerTerm}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={classItem.status === "active" ? "default" : "secondary"}
                      >
                        {classItem.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(classItem)}
                        >
                          <EditIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(classItem.id)}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add/Edit Class Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingClass ? "Edit Class" : "Add New Class"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Class Name</Label>
                  <Input
                    id="name"
                    value={newClass.name}
                    onChange={(e) => setNewClass(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="sportType">Sport Type</Label>
                  <Select 
                    value={newClass.sportType}
                    onValueChange={(value) => setNewClass(prev => ({ ...prev, sportType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sport" />
                    </SelectTrigger>
                    <SelectContent>
                      {sportTypes.map((sport) => (
                        <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newClass.description}
                  onChange={(e) => setNewClass(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="venue">Venue</Label>
                  <Select 
                    value={newClass.venueId}
                    onValueChange={(value) => setNewClass(prev => ({ ...prev, venueId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select venue" />
                    </SelectTrigger>
                    <SelectContent>
                      {venues?.map((venue: any) => (
                        <SelectItem key={venue.id} value={venue.id}>{venue.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="coach">Coach</Label>
                  <Select 
                    value={newClass.coachId}
                    onValueChange={(value) => setNewClass(prev => ({ ...prev, coachId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select coach" />
                    </SelectTrigger>
                    <SelectContent>
                      {coaches?.map((coach: any) => (
                        <SelectItem key={coach.id} value={coach.id}>
                          {coach.firstName} {coach.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="term">Term</Label>
                  <Select 
                    value={newClass.term}
                    onValueChange={(value) => setNewClass(prev => ({ ...prev, term: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Term 1">Term 1</SelectItem>
                      <SelectItem value="Term 2">Term 2</SelectItem>
                      <SelectItem value="Term 3">Term 3</SelectItem>
                      <SelectItem value="Term 4">Term 4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={newClass.year}
                    onChange={(e) => setNewClass(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dayOfWeek">Day of Week</Label>
                  <Select 
                    value={newClass.dayOfWeek}
                    onValueChange={(value) => setNewClass(prev => ({ ...prev, dayOfWeek: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {dayOptions.map((day) => (
                        <SelectItem key={day.value} value={day.value.toString()}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={newClass.startTime}
                    onChange={(e) => setNewClass(prev => ({ ...prev, startTime: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={newClass.endTime}
                    onChange={(e) => setNewClass(prev => ({ ...prev, endTime: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="minAge">Min Age</Label>
                  <Input
                    id="minAge"
                    type="number"
                    value={newClass.minAge}
                    onChange={(e) => setNewClass(prev => ({ ...prev, minAge: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="maxAge">Max Age</Label>
                  <Input
                    id="maxAge"
                    type="number"
                    value={newClass.maxAge}
                    onChange={(e) => setNewClass(prev => ({ ...prev, maxAge: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="maxCapacity">Max Capacity</Label>
                  <Input
                    id="maxCapacity"
                    type="number"
                    value={newClass.maxCapacity}
                    onChange={(e) => setNewClass(prev => ({ ...prev, maxCapacity: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="pricePerTerm">Price per Term ($)</Label>
                  <Input
                    id="pricePerTerm"
                    type="number"
                    step="0.01"
                    value={newClass.pricePerTerm}
                    onChange={(e) => setNewClass(prev => ({ ...prev, pricePerTerm: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createClassMutation.isPending || updateClassMutation.isPending}
                >
                  {editingClass ? "Update Class" : "Create Class"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}