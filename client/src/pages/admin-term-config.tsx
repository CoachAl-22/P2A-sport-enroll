import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, PlusIcon, EditIcon, TrashIcon, DollarSignIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const termConfigSchema = z.object({
  term: z.enum(["term_1", "term_2", "term_3", "term_4"]),
  year: z.number().min(2024).max(2030),
  name: z.string().min(1, "Name is required"),
  startDate: z.string(),
  endDate: z.string(),
  weeksCount: z.number().min(1).max(20),
  enrollmentOpenDate: z.string().optional(),
  enrollmentCloseDate: z.string().optional(),
  pricePerWeek: z.number().min(0),
  gstRate: z.number().min(0).max(1).default(0.10),
  active: z.boolean().default(true),
});

type TermConfigFormData = z.infer<typeof termConfigSchema>;

export default function AdminTermConfig() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>(null);
  const [priceCalculation, setPriceCalculation] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: termConfigs, isLoading } = useQuery({
    queryKey: ["/api/term-configurations"],
  });

  const form = useForm<TermConfigFormData>({
    resolver: zodResolver(termConfigSchema),
    defaultValues: {
      term: "term_1",
      year: new Date().getFullYear(),
      name: "",
      startDate: "",
      endDate: "",
      weeksCount: 10,
      pricePerWeek: 30,
      gstRate: 0.10,
      active: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: TermConfigFormData) => apiRequest("POST", "/api/term-configurations", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/term-configurations"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Term configuration created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create term configuration",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TermConfigFormData> }) =>
      apiRequest("PUT", `/api/term-configurations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/term-configurations"] });
      setEditingConfig(null);
      toast({
        title: "Success",
        description: "Term configuration updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update term configuration",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/term-configurations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/term-configurations"] });
      toast({
        title: "Success",
        description: "Term configuration deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete term configuration",
        variant: "destructive",
      });
    },
  });

  const calculatePriceMutation = useMutation({
    mutationFn: (data: { termConfigId: string; classesPerWeek: number }) =>
      apiRequest("POST", "/api/term-configurations/calculate-price", data),
    onSuccess: (data) => {
      setPriceCalculation(data);
    },
  });

  const onSubmit = (data: TermConfigFormData) => {
    if (editingConfig) {
      updateMutation.mutate({ id: editingConfig.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (config: any) => {
    setEditingConfig(config);
    form.reset({
      term: config.term,
      year: config.year,
      name: config.name,
      startDate: format(new Date(config.startDate), "yyyy-MM-dd"),
      endDate: format(new Date(config.endDate), "yyyy-MM-dd"),
      weeksCount: config.weeksCount,
      enrollmentOpenDate: config.enrollmentOpenDate 
        ? format(new Date(config.enrollmentOpenDate), "yyyy-MM-dd") 
        : "",
      enrollmentCloseDate: config.enrollmentCloseDate 
        ? format(new Date(config.enrollmentCloseDate), "yyyy-MM-dd") 
        : "",
      pricePerWeek: Number(config.pricePerWeek),
      gstRate: Number(config.gstRate),
      active: config.active,
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this term configuration?")) {
      deleteMutation.mutate(id);
    }
  };

  const calculateSamplePrice = (config: any) => {
    calculatePriceMutation.mutate({
      termConfigId: config.id,
      classesPerWeek: 1,
    });
  };

  const getTermDisplayName = (term: string) => {
    return term.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Term Configuration Management</h1>
            <p className="text-gray-600 mt-2">Manage school terms, dates, and pricing structures</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingConfig(null); form.reset(); }}>
                <PlusIcon className="w-4 h-4 mr-2" />
                Create Term Config
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingConfig ? "Edit Term Configuration" : "Create Term Configuration"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="term"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Term</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="term_1">Term 1</SelectItem>
                              <SelectItem value="term_2">Term 2</SelectItem>
                              <SelectItem value="term_3">Term 3</SelectItem>
                              <SelectItem value="term_4">Term 4</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Term 1 2025" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="enrollmentOpenDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Enrollment Opens</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="enrollmentCloseDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Enrollment Closes</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="weeksCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weeks Count</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pricePerWeek"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price per Week ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gstRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GST Rate</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                      {editingConfig ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Term Configurations</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Term</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(termConfigs || []).map((config: any) => (
                  <TableRow key={config.id}>
                    <TableCell className="font-medium">
                      {getTermDisplayName(config.term)}
                    </TableCell>
                    <TableCell>{config.year}</TableCell>
                    <TableCell>{config.weeksCount} weeks</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{format(new Date(config.startDate), "MMM dd")} - {format(new Date(config.endDate), "MMM dd, yyyy")}</div>
                        {config.enrollmentOpenDate && (
                          <div className="text-gray-500 text-xs">
                            Enrollment: {format(new Date(config.enrollmentOpenDate), "MMM dd")}
                            {config.enrollmentCloseDate && ` - ${format(new Date(config.enrollmentCloseDate), "MMM dd")}`}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>${Number(config.pricePerWeek).toFixed(2)}/week</div>
                        <div className="text-gray-500 text-xs">
                          Total: ${(Number(config.pricePerWeek) * config.weeksCount * 1.1).toFixed(2)} inc. GST
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.active ? "default" : "secondary"}>
                        {config.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => calculateSamplePrice(config)}
                        >
                          <DollarSignIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(config)}
                        >
                          <EditIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(config.id)}
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

        {priceCalculation && (
          <Card>
            <CardHeader>
              <CardTitle>Price Calculation Example</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">${priceCalculation.basePrice}</div>
                  <div className="text-sm text-gray-600">Base Price</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">${priceCalculation.gstAmount}</div>
                  <div className="text-sm text-gray-600">GST</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">${priceCalculation.totalPrice}</div>
                  <div className="text-sm text-gray-600">Total Inc. GST</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{priceCalculation.weeksCount}</div>
                  <div className="text-sm text-gray-600">Weeks</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}