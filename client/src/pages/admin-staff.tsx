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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Navbar from "@/components/layout/navbar";
import { PlusIcon, EditIcon, TrashIcon, MailIcon, PhoneIcon, UserIcon, AwardIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Redirect } from "wouter";

const sportSpecializations = [
  "foundation_prep_year2",
  "emerging_year3_6", 
  "junior_development",
  "team_sport_athletes",
  "team_sport_speed",
  "senior_squad",
  "competition_ready",
  "empowered_athlete_program",
  "basketball",
  "soccer",
  "tennis",
  "swimming",
  "athletics",
  "netball",
  "cricket",
  "volleyball",
  "multi_sport"
];

const roleOptions = [
  { value: "coach", label: "Coach" },
  { value: "admin", label: "Admin" },
  { value: "parent", label: "Parent" }
];

// Helper function to convert enum values to display names
const getDisplayName = (value: string): string => {
  const displayMap: { [key: string]: string } = {
    "foundation_prep_year2": "Foundation Prep-Year 2",
    "emerging_year3_6": "Emerging Year 3-6",
    "junior_development": "Junior Development",
    "team_sport_athletes": "Team Sport Athletes",
    "team_sport_speed": "Team Sport Speed",
    "senior_squad": "Senior Squad",
    "competition_ready": "Competition Ready",
    "empowered_athlete_program": "Empowered Athlete Program",
    "basketball": "Basketball",
    "soccer": "Soccer",
    "tennis": "Tennis",
    "swimming": "Swimming",
    "athletics": "Athletics",
    "netball": "Netball",
    "cricket": "Cricket",
    "volleyball": "Volleyball",
    "multi_sport": "Multi Sport"
  };
  return displayMap[value] || value;
};

export default function AdminStaff() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [newStaff, setNewStaff] = useState({
    // User fields
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    userId: "",
    password: "",
    role: "coach",
    // Coach-specific fields
    specializations: [] as string[],
    qualifications: [] as string[],
    experience: "",
    bio: "",
    active: true
  });

  // Redirect if not admin
  if (!authLoading && (user as any)?.user?.role !== "admin") {
    return <Redirect to="/" />;
  }

  const { data: staff = [], isLoading: staffLoading } = useQuery<any[]>({
    queryKey: ["/api/staff"],
    enabled: (user as any)?.user?.role === "admin",
  });

  const { data: coaches = [] } = useQuery<any[]>({
    queryKey: ["/api/coaches"],
    enabled: (user as any)?.user?.role === "admin",
  });

  const createStaffMutation = useMutation({
    mutationFn: async (staffData: any) => {
      return apiRequest("POST", "/api/staff", staffData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coaches"] });
      setIsAddDialogOpen(false);
      setNewStaff({
        firstName: "", lastName: "", email: "", mobile: "", userId: "", password: "",
        role: "coach", specializations: [], qualifications: [], experience: "", bio: "", active: true
      });
      toast({
        title: "Success",
        description: "Staff member created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create staff member",
        variant: "destructive",
      });
    },
  });

  const updateStaffMutation = useMutation({
    mutationFn: async ({ id, ...staffData }: any) => {
      return apiRequest("PUT", `/api/staff/${id}`, staffData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coaches"] });
      setEditingStaff(null);
      toast({
        title: "Success",
        description: "Staff member updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update staff member",
        variant: "destructive",
      });
    },
  });

  const deleteStaffMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/staff/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coaches"] });
      toast({
        title: "Success",
        description: "Staff member deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete staff member",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStaff) {
      updateStaffMutation.mutate({ ...editingStaff, ...newStaff });
    } else {
      createStaffMutation.mutate(newStaff);
    }
  };

  const handleEdit = (staffMember: any) => {
    setEditingStaff(staffMember);
    setNewStaff({
      firstName: staffMember.firstName || "",
      lastName: staffMember.lastName || "",
      email: staffMember.email || "",
      mobile: staffMember.mobile || "",
      userId: staffMember.userId || "",
      password: "", // Don't pre-fill password for security
      role: staffMember.role || "coach",
      specializations: staffMember.specializations || [],
      qualifications: staffMember.qualifications || [],
      experience: staffMember.experience || "",
      bio: staffMember.bio || "",
      active: staffMember.active !== false
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this staff member?")) {
      deleteStaffMutation.mutate(id);
    }
  };

  const addSpecialization = (specialization: string) => {
    if (!newStaff.specializations.includes(specialization)) {
      setNewStaff(prev => ({
        ...prev,
        specializations: [...prev.specializations, specialization]
      }));
    }
  };

  const removeSpecialization = (specialization: string) => {
    setNewStaff(prev => ({
      ...prev,
      specializations: prev.specializations.filter(s => s !== specialization)
    }));
  };

  const addQualification = () => {
    const qualification = prompt("Enter qualification:");
    if (qualification && !newStaff.qualifications.includes(qualification)) {
      setNewStaff(prev => ({
        ...prev,
        qualifications: [...prev.qualifications, qualification]
      }));
    }
  };

  const removeQualification = (qualification: string) => {
    setNewStaff(prev => ({
      ...prev,
      qualifications: prev.qualifications.filter(q => q !== qualification)
    }));
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (authLoading || staffLoading) {
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
              Staff Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage coaches, administrators, and staff members
            </p>
          </div>
          <Button 
            onClick={() => {
              setEditingStaff(null);
              setNewStaff({
                firstName: "", lastName: "", email: "", mobile: "", userId: "", password: "",
                role: "coach", specializations: [], qualifications: [], experience: "", bio: "", active: true
              });
              setIsAddDialogOpen(true);
            }}
            className="bg-primary-500 hover:bg-primary-600"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Staff Member
          </Button>
        </div>

        {/* Staff Statistics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{staff?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Coaches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {coaches?.filter((c: any) => c.active).length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Administrators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {staff?.filter((s: any) => s.role === "admin").length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">New This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {staff?.filter((s: any) => {
                  const created = new Date(s.createdAt);
                  const now = new Date();
                  return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                }).length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Staff Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Staff Members</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Specializations</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff?.map((staffMember: any) => (
                  <TableRow key={staffMember.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(staffMember.firstName, staffMember.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {staffMember.firstName} {staffMember.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {staffMember.userId || "Not set"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={staffMember.role === "admin" ? "default" : "secondary"}
                      >
                        {staffMember.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {staffMember.email && (
                          <div className="flex items-center space-x-1 text-sm">
                            <MailIcon className="w-4 h-4" />
                            <span>{staffMember.email}</span>
                          </div>
                        )}
                        {staffMember.mobile && (
                          <div className="flex items-center space-x-1 text-sm">
                            <PhoneIcon className="w-4 h-4" />
                            <span>{staffMember.mobile}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {staffMember.specializations?.slice(0, 2).map((spec: string) => (
                          <Badge key={spec} variant="outline" className="text-xs">
                            {getDisplayName(spec)}
                          </Badge>
                        ))}
                        {staffMember.specializations?.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{staffMember.specializations.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={staffMember.active !== false ? "default" : "secondary"}
                      >
                        {staffMember.active !== false ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(staffMember)}
                        >
                          <EditIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(staffMember.id)}
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

        {/* Add/Edit Staff Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-medium mb-4">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={newStaff.firstName}
                      onChange={(e) => setNewStaff(prev => ({ ...prev, firstName: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={newStaff.lastName}
                      onChange={(e) => setNewStaff(prev => ({ ...prev, lastName: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-medium mb-4">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newStaff.email}
                      onChange={(e) => setNewStaff(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="mobile">Mobile</Label>
                    <Input
                      id="mobile"
                      value={newStaff.mobile}
                      onChange={(e) => setNewStaff(prev => ({ ...prev, mobile: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div>
                <h3 className="text-lg font-medium mb-4">Account Information</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="userId">User ID</Label>
                    <Input
                      id="userId"
                      value={newStaff.userId}
                      onChange={(e) => setNewStaff(prev => ({ ...prev, userId: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newStaff.password}
                      onChange={(e) => setNewStaff(prev => ({ ...prev, password: e.target.value }))}
                      required={!editingStaff}
                      placeholder={editingStaff ? "Leave blank to keep current" : ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select 
                      value={newStaff.role}
                      onValueChange={(value) => setNewStaff(prev => ({ ...prev, role: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Coach-specific fields */}
              {newStaff.role === "coach" && (
                <>
                  <div>
                    <h3 className="text-lg font-medium mb-4">Coach Information</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <Label>Sport Specializations</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {newStaff.specializations.map((spec) => (
                            <Badge key={spec} variant="secondary" className="cursor-pointer" 
                                   onClick={() => removeSpecialization(spec)}>
                              {getDisplayName(spec)} ×
                            </Badge>
                          ))}
                        </div>
                        <Select onValueChange={addSpecialization}>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Add specialization" />
                          </SelectTrigger>
                          <SelectContent>
                            {sportSpecializations
                              .filter(sport => !newStaff.specializations.includes(sport))
                              .map((sport) => (
                                <SelectItem key={sport} value={sport}>{getDisplayName(sport)}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Qualifications</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {newStaff.qualifications.map((qual) => (
                            <Badge key={qual} variant="secondary" className="cursor-pointer" 
                                   onClick={() => removeQualification(qual)}>
                              {qual} ×
                            </Badge>
                          ))}
                        </div>
                        <Button type="button" variant="outline" onClick={addQualification} className="mt-2">
                          <AwardIcon className="w-4 h-4 mr-2" />
                          Add Qualification
                        </Button>
                      </div>

                      <div>
                        <Label htmlFor="experience">Experience</Label>
                        <Textarea
                          id="experience"
                          value={newStaff.experience}
                          onChange={(e) => setNewStaff(prev => ({ ...prev, experience: e.target.value }))}
                          rows={3}
                          placeholder="Describe coaching experience..."
                        />
                      </div>

                      <div>
                        <Label htmlFor="bio">Biography</Label>
                        <Textarea
                          id="bio"
                          value={newStaff.bio}
                          onChange={(e) => setNewStaff(prev => ({ ...prev, bio: e.target.value }))}
                          rows={4}
                          placeholder="Coach biography and background..."
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

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
                  disabled={createStaffMutation.isPending || updateStaffMutation.isPending}
                >
                  {editingStaff ? "Update Staff Member" : "Create Staff Member"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}