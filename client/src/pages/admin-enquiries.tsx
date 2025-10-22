import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Eye, Mail, Phone, MessageSquare, Calendar, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient as globalQueryClient } from "@/lib/queryClient";
import { Redirect } from "wouter";
import { format } from "date-fns";
import type { ContactEnquiry } from "@shared/schema";

export default function AdminEnquiries() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEnquiry, setSelectedEnquiry] = useState<ContactEnquiry | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [enquiryStatus, setEnquiryStatus] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // Redirect if not admin
  if (!authLoading && user?.role !== "admin") {
    return <Redirect to="/" />;
  }

  const { data: enquiries, isLoading: enquiriesLoading } = useQuery<ContactEnquiry[]>({
    queryKey: ["/api/contact-enquiries"],
    enabled: user?.role === "admin",
  });

  const updateEnquiryMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ContactEnquiry> }) => {
      return await apiRequest("PUT", `/api/contact-enquiries/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contact-enquiries"] });
      toast({
        title: "Success",
        description: "Enquiry updated successfully",
      });
      setIsViewDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update enquiry",
        variant: "destructive",
      });
    },
  });

  const handleViewEnquiry = (enquiry: ContactEnquiry) => {
    setSelectedEnquiry(enquiry);
    setEnquiryStatus(enquiry.status);
    setAdminNotes(enquiry.adminNotes || "");
    setIsViewDialogOpen(true);
  };

  const handleUpdateEnquiry = () => {
    if (!selectedEnquiry) return;

    updateEnquiryMutation.mutate({
      id: selectedEnquiry.id,
      updates: {
        status: enquiryStatus as any,
        adminNotes,
      },
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      new: "bg-blue-100 text-blue-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      contacted: "bg-purple-100 text-purple-800",
      resolved: "bg-green-100 text-green-800",
      closed: "bg-gray-100 text-gray-800",
    };
    const statusLabels = {
      new: "New",
      in_progress: "In Progress",
      contacted: "Contacted",
      resolved: "Resolved",
      closed: "Closed",
    };
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </Badge>
    );
  };

  const getContactMethodIcon = (method: string) => {
    switch (method) {
      case "phone":
        return <Phone className="w-4 h-4" />;
      case "email":
        return <Mail className="w-4 h-4" />;
      case "video":
        return <MessageSquare className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const filteredEnquiries = enquiries?.filter((enquiry) =>
    searchTerm === "" ||
    enquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enquiry.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || enquiriesLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const newEnquiriesCount = enquiries?.filter(e => e.status === "new").length || 0;
  const inProgressCount = enquiries?.filter(e => e.status === "in_progress").length || 0;
  const resolvedCount = enquiries?.filter(e => e.status === "resolved").length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-gray-900">Contact Enquiries</h1>
          <p className="text-gray-600 mt-2">Manage and respond to customer enquiries</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Enquiries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{enquiries?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">New</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{newEnquiriesCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{inProgressCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Resolved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{resolvedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Enquiries</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search by name, email, or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
              data-testid="input-search-enquiries"
            />
          </CardContent>
        </Card>

        {/* Enquiries Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Enquiries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEnquiries && filteredEnquiries.length > 0 ? (
                    filteredEnquiries.map((enquiry) => (
                      <TableRow key={enquiry.id} data-testid={`row-enquiry-${enquiry.id}`}>
                        <TableCell className="text-sm text-gray-600">
                          {enquiry.createdAt ? format(new Date(enquiry.createdAt), "MMM dd, yyyy") : "N/A"}
                        </TableCell>
                        <TableCell className="font-medium">{enquiry.name}</TableCell>
                        <TableCell className="text-sm">
                          <div>{enquiry.email}</div>
                          {enquiry.phone && <div className="text-gray-600">{enquiry.phone}</div>}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getContactMethodIcon(enquiry.contactMethod)}
                            <span className="capitalize text-sm">{enquiry.contactMethod}</span>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize text-sm">
                          {enquiry.subject.replace(/-/g, ' ')}
                        </TableCell>
                        <TableCell>{getStatusBadge(enquiry.status)}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewEnquiry(enquiry)}
                            data-testid={`button-view-enquiry-${enquiry.id}`}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No enquiries found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* View/Edit Enquiry Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Enquiry Details</DialogTitle>
            </DialogHeader>
            {selectedEnquiry && (
              <div className="space-y-6">
                {/* Contact Information */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">Name</Label>
                      <p className="font-medium">{selectedEnquiry.name}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Email</Label>
                      <p className="font-medium">{selectedEnquiry.email}</p>
                    </div>
                    {selectedEnquiry.phone && (
                      <div>
                        <Label className="text-gray-600">Phone</Label>
                        <p className="font-medium">{selectedEnquiry.phone}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-gray-600">Preferred Contact</Label>
                      <p className="font-medium capitalize flex items-center gap-2">
                        {getContactMethodIcon(selectedEnquiry.contactMethod)}
                        {selectedEnquiry.contactMethod}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Enquiry Details */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-gray-600">Subject</Label>
                    <p className="font-medium capitalize">{selectedEnquiry.subject.replace(/-/g, ' ')}</p>
                  </div>
                  {selectedEnquiry.performanceTestType && (
                    <div>
                      <Label className="text-gray-600">Performance Test Type</Label>
                      <p className="font-medium capitalize">{selectedEnquiry.performanceTestType}</p>
                    </div>
                  )}
                  {selectedEnquiry.assessmentType && (
                    <div>
                      <Label className="text-gray-600">Assessment Type</Label>
                      <p className="font-medium capitalize">{selectedEnquiry.assessmentType}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-gray-600">Message</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded border border-gray-200">
                      <p className="whitespace-pre-wrap">{selectedEnquiry.message}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-600">Received On</Label>
                    <p className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4" />
                      {selectedEnquiry.createdAt ? format(new Date(selectedEnquiry.createdAt), "PPpp") : "N/A"}
                    </p>
                  </div>
                </div>

                {/* Update Section */}
                <div className="border-t pt-6 space-y-4">
                  <h3 className="font-semibold text-gray-900">Update Enquiry</h3>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={enquiryStatus} onValueChange={setEnquiryStatus}>
                      <SelectTrigger data-testid="select-enquiry-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="adminNotes">Admin Notes</Label>
                    <Textarea
                      id="adminNotes"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes about this enquiry..."
                      rows={4}
                      data-testid="input-admin-notes"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleUpdateEnquiry}
                      disabled={updateEnquiryMutation.isPending}
                      className="flex-1"
                      data-testid="button-update-enquiry"
                    >
                      {updateEnquiryMutation.isPending ? "Updating..." : "Update Enquiry"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsViewDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
