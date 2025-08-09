import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/navbar";
import { CSVUploader } from "@/components/CSVUploader";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  Download, 
  FileText, 
  Users, 
  Baby, 
  AlertCircle, 
  CheckCircle,
  Database,
  ArrowRight
} from "lucide-react";

export default function Import() {
  const [uploadedFile, setUploadedFile] = useState<string>("");
  const [previewData, setPreviewData] = useState<any>(null);
  const { toast } = useToast();

  // Mutation to preview CSV data
  const previewMutation = useMutation({
    mutationFn: async (uploadURL: string) => {
      const response = await apiRequest("POST", "/api/csv-preview", { uploadURL });
      return response.json();
    },
    onSuccess: (data) => {
      setPreviewData(data);
      toast({
        title: "CSV Preview Generated",
        description: "Review the data mapping below before importing.",
      });
    },
    onError: (error) => {
      toast({
        title: "Preview Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to import CSV data
  const importMutation = useMutation({
    mutationFn: async (uploadURL: string) => {
      const response = await apiRequest("POST", "/api/csv-import", { uploadURL });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Import Successful",
        description: `Imported ${data.customersImported} customers and ${data.studentsImported} students.`,
      });
      setPreviewData(null);
      setUploadedFile("");
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (uploadURL: string) => {
    setUploadedFile(uploadURL);
    previewMutation.mutate(uploadURL);
  };

  const handleImport = () => {
    if (uploadedFile) {
      importMutation.mutate(uploadedFile);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">
            Data Import
          </h1>
          <p className="text-gray-600">
            Import your existing customer and student data from CSV files
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Upload CSV File
              </CardTitle>
              <CardDescription>
                Upload your customer and student data file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CSVUploader
                onComplete={handleFileUpload}
                title="Choose CSV File"
                description="Upload your customer and student data CSV file (max 10MB)"
                buttonClassName="w-full"
              />
              
              {uploadedFile && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    File uploaded successfully. Review the preview below.
                  </AlertDescription>
                </Alert>
              )}

              {/* CSV Format Help */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Expected CSV Format
                </h4>
                <div className="text-sm text-blue-800 space-y-2">
                  <p><strong>Customer columns:</strong></p>
                  <p className="text-xs font-mono bg-white px-2 py-1 rounded">
                    email, mobile, firstName, lastName, address, suburb, postcode, emergencyContact
                  </p>
                  <p><strong>Student columns:</strong></p>
                  <p className="text-xs font-mono bg-white px-2 py-1 rounded">
                    parentEmail, studentFirstName, studentLastName, dateOfBirth, medicalInfo, emergencyContact
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview Section */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-5 h-5 mr-2" />
                Data Preview
              </CardTitle>
              <CardDescription>
                Review your data before importing
              </CardDescription>
            </CardHeader>
            <CardContent>
              {previewMutation.isPending && (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-gray-500">Analyzing CSV file...</p>
                </div>
              )}

              {previewData && (
                <div className="space-y-6">
                  {/* Statistics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-600">Customers Found</p>
                          <p className="text-2xl font-bold text-green-900">
                            {previewData.customersPreview?.length || 0}
                          </p>
                        </div>
                        <Users className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-600">Students Found</p>
                          <p className="text-2xl font-bold text-blue-900">
                            {previewData.studentsPreview?.length || 0}
                          </p>
                        </div>
                        <Baby className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  {/* Validation Issues */}
                  {previewData.issues && previewData.issues.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          <p className="font-semibold">Data Issues Found:</p>
                          {previewData.issues.slice(0, 5).map((issue: string, index: number) => (
                            <p key={index} className="text-sm">• {issue}</p>
                          ))}
                          {previewData.issues.length > 5 && (
                            <p className="text-sm">... and {previewData.issues.length - 5} more issues</p>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Sample Data Preview */}
                  {previewData.customersPreview && previewData.customersPreview.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Sample Customer Data</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Suburb</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {previewData.customersPreview.slice(0, 3).map((customer: any, index: number) => (
                              <tr key={index}>
                                <td className="px-3 py-2 text-sm">{customer.firstName} {customer.lastName}</td>
                                <td className="px-3 py-2 text-sm">{customer.email}</td>
                                <td className="px-3 py-2 text-sm">{customer.mobile}</td>
                                <td className="px-3 py-2 text-sm">{customer.suburb}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Import Button */}
                  <div className="flex justify-end pt-4 border-t">
                    <Button 
                      onClick={handleImport}
                      disabled={importMutation.isPending || (previewData.issues && previewData.issues.length > 0)}
                      className="flex items-center"
                    >
                      {importMutation.isPending ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                          Importing...
                        </>
                      ) : (
                        <>
                          Import Data
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {!previewData && !previewMutation.isPending && (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Upload a CSV file to preview your data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}