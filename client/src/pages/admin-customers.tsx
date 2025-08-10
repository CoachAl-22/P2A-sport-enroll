import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/layout/navbar";
import { Users, UserCheck, Baby, Search, Mail, Phone, MapPin, Calendar } from "lucide-react";
import { Redirect } from "wouter";
import { useState } from "react";

export default function AdminCustomers() {
  const { user, isLoading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all customers with their children
  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ["/api/admin/customers"],
    enabled: (user as any)?.user?.role === "admin",
  });

  // Fetch all students with their parents
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["/api/admin/students"],
    enabled: (user as any)?.user?.role === "admin",
  });

  // Redirect if not admin
  if (!authLoading && (user as any)?.user?.role !== "admin") {
    return <Redirect to="/" />;
  }

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

  // Use the fetched data directly
  const allCustomers = customers || [];
  const allStudents = students || [];

  // Filter functions
  const filteredCustomers = allCustomers.filter((customer: any) =>
    customer.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.mobile?.includes(searchTerm)
  );

  const filteredStudents = allStudents.filter((student: any) =>
    student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.parent?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.parent?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
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
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">
            Customers & Students Management
          </h1>
          <p className="text-gray-600">
            Complete overview of all registered families and their children
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search customers or students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Total Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{allCustomers.length}</div>
              <p className="text-xs text-gray-500 mt-1">Active parent accounts</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Baby className="h-4 w-4 mr-2" />
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{allStudents.length}</div>
              <p className="text-xs text-gray-500 mt-1">Registered children</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <UserCheck className="h-4 w-4 mr-2" />
                Active Enrollments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {allStudents.reduce((sum: number, student: any) => sum + (student.activeEnrollments || 0), 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Currently enrolled</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                New This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {allCustomers.filter((c: any) => {
                  const created = new Date(c.createdAt);
                  const now = new Date();
                  return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                }).length}
              </div>
              <p className="text-xs text-gray-500 mt-1">New families</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Customers and Students */}
        <Tabs defaultValue="customers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="customers">Customers ({filteredCustomers.length})</TabsTrigger>
            <TabsTrigger value="students">Students ({filteredStudents.length})</TabsTrigger>
          </TabsList>

          {/* Customers Tab */}
          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <CardTitle>All Customers (Parents/Guardians)</CardTitle>
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
                        <TableHead>Account Info</TableHead>
                        <TableHead>Children</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((customer: any) => {
                        const customerChildren = customer.children || [];
                        return (
                          <TableRow key={customer.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{customer.firstName} {customer.lastName}</div>
                                <div className="text-sm text-gray-500">ID: {customer.userId || customer.id}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {customer.email && (
                                  <div className="flex items-center text-sm">
                                    <Mail className="h-3 w-3 mr-1 text-gray-400" />
                                    {customer.email}
                                  </div>
                                )}
                                {customer.mobile && (
                                  <div className="flex items-center text-sm">
                                    <Phone className="h-3 w-3 mr-1 text-gray-400" />
                                    {customer.mobile}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>Role: <Badge variant="secondary">{customer.role}</Badge></div>
                                <div className="text-gray-500 mt-1">
                                  Joined: {formatDate(customer.createdAt)}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-medium">{customerChildren.length} child(ren)</div>
                                {customerChildren.slice(0, 2).map((child: any, idx: number) => (
                                  <div key={idx} className="text-gray-500">
                                    {child.firstName} {child.lastName}
                                  </div>
                                ))}
                                {customerChildren.length > 2 && (
                                  <div className="text-gray-400">+{customerChildren.length - 2} more</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                Active
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
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
                <CardTitle>All Students (Children)</CardTitle>
              </CardHeader>
              <CardContent>
                {studentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Age & Grade</TableHead>
                        <TableHead>Parent/Guardian</TableHead>
                        <TableHead>Enrollments</TableHead>
                        <TableHead>Medical Info</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student: any) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{student.firstName} {student.lastName}</div>
                              <div className="text-sm text-gray-500">
                                DOB: {formatDate(student.dateOfBirth)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{getAge(student.dateOfBirth)} years old</div>
                              {student.grade && (
                                <div className="text-sm text-gray-500">Grade: {student.grade}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {student.parent?.firstName} {student.parent?.lastName}
                              </div>
                              {student.parent?.email && (
                                <div className="text-sm text-gray-500">{student.parent.email}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex space-x-2">
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                  {student.activeEnrollments} Active
                                </Badge>
                                <Badge variant="secondary">
                                  {student.totalEnrollments} Total
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm max-w-xs">
                              {student.medicalInfo ? (
                                <div className="truncate" title={student.medicalInfo}>
                                  {student.medicalInfo}
                                </div>
                              ) : (
                                <span className="text-gray-400">None specified</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}