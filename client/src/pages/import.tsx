import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
  FileText,
  Users,
  Baby,
  AlertCircle,
  CheckCircle,
  Database,
  ArrowRight,
  Info,
  UserX,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function Import() {
  const [uploadedFile, setUploadedFile] = useState<string>("");
  const [previewData, setPreviewData] = useState<any>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [includeInactive, setIncludeInactive] = useState(false);
  const { toast } = useToast();

  const previewMutation = useMutation({
    mutationFn: async (uploadURL: string) => {
      const response = await apiRequest("POST", "/api/csv-preview", { uploadURL });
      return response.json();
    },
    onSuccess: (data) => {
      setPreviewData(data);
    },
    onError: (error: any) => {
      toast({
        title: "Preview Failed",
        description: error.message || "Could not read the CSV file. Make sure it is a SportsBiz Student Export.",
        variant: "destructive",
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (uploadURL: string) => {
      const response = await apiRequest("POST", "/api/csv-import", { uploadURL, includeInactive });
      return response.json();
    },
    onSuccess: (data) => {
      setImportResult(data);
      toast({
        title: "Import Complete",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (uploadURL: string) => {
    setUploadedFile(uploadURL);
    setImportResult(null);
    previewMutation.mutate(uploadURL);
  };

  const handleImport = () => {
    if (uploadedFile) importMutation.mutate(uploadedFile);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">Import from SportsBiz</h1>
          <p className="text-gray-600">
            Upload your SportsBiz Student Export to create parent accounts and student profiles automatically.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upload + format guide */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Upload CSV
              </CardTitle>
              <CardDescription>SportsBiz Student Export file</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CSVUploader
                onComplete={handleFileUpload}
                title="Choose CSV File"
                description="Upload your SportsBiz Student Export CSV (max 10 MB)"
                buttonClassName="w-full"
              />

              {uploadedFile && !previewMutation.isPending && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>File uploaded — reviewing data below.</AlertDescription>
                </Alert>
              )}

              {/* Include inactive toggle */}
              <div className="border rounded-lg p-3 bg-amber-50 border-amber-200">
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="include-inactive" className="font-medium text-amber-900 cursor-pointer flex items-center gap-1">
                    <UserX className="w-4 h-4" /> Include inactive records
                  </Label>
                  <Switch
                    id="include-inactive"
                    checked={includeInactive}
                    onCheckedChange={(val) => { setIncludeInactive(val); setImportResult(null); }}
                  />
                </div>
                <p className="text-xs text-amber-700">
                  When on, inactive students and their parents are also imported — marked as inactive. You can activate them individually from the Customers page if they re-enrol.
                </p>
              </div>

              {/* Format reference */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-1">
                  <Info className="w-4 h-4" /> Expected file format
                </h4>
                <p className="text-blue-800 mb-2">
                  <strong>File:</strong> SportsBiz → Reports → Student Export
                </p>
                <p className="text-blue-800 mb-1 font-medium">Key columns used:</p>
                <ul className="text-blue-800 text-xs space-y-0.5 list-disc list-inside">
                  <li>First Name, Last Name (student)</li>
                  <li>DOB (DD/MM/YYYY)</li>
                  <li>Active (must be TRUE)</li>
                  <li>Gender</li>
                  <li>Medical Conditions</li>
                  <li>Program, School, Year Level</li>
                  <li>Customer First Name, Customer Last Name</li>
                  <li>Customer Email (parent login)</li>
                  <li>Customer Mobile Phone 1</li>
                </ul>
                <p className="text-blue-700 text-xs mt-2">
                  Siblings are handled automatically — one parent account is created per unique email/mobile.
                </p>
                <p className="text-blue-700 text-xs mt-1">
                  Default password: <code className="bg-white px-1 rounded">Power2ADAPT2024!</code>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Preview + results */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-5 h-5 mr-2" />
                {importResult ? "Import Results" : "Data Preview"}
              </CardTitle>
              <CardDescription>
                {importResult ? "Summary of what was imported" : "Review your data before importing"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {previewMutation.isPending && (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-gray-500">Analysing CSV file…</p>
                </div>
              )}

              {importMutation.isPending && (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-gray-500">Importing records — this may take a moment…</p>
                </div>
              )}

              {/* Import results */}
              {importResult && !importMutation.isPending && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-600">New parents created</p>
                      <p className="text-3xl font-bold text-green-900">{importResult.customersImported}</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-600">New students created</p>
                      <p className="text-3xl font-bold text-blue-900">{importResult.studentsImported}</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Existing parents skipped</p>
                      <p className="text-3xl font-bold text-gray-700">{importResult.parentsExisting}</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Existing students skipped</p>
                      <p className="text-3xl font-bold text-gray-700">{importResult.studentsExisting}</p>
                    </div>
                  </div>

                  {importResult.errors > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <p className="font-semibold mb-1">{importResult.errors} row(s) had errors:</p>
                        {importResult.errorDetails?.slice(0, 5).map((e: string, i: number) => (
                          <p key={i} className="text-sm">• {e}</p>
                        ))}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{importResult.message}</AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Preview */}
              {previewData && !importResult && !previewMutation.isPending && !importMutation.isPending && (
                <div className="space-y-5">
                  {/* Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                      <p className="text-xs text-blue-600 mb-1">Total rows</p>
                      <p className="text-2xl font-bold text-blue-900">{previewData.totalRows}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                      <p className="text-xs text-green-600 mb-1">Active students</p>
                      <p className="text-2xl font-bold text-green-900">{previewData.activeRows}</p>
                    </div>
                    {previewData.inactiveRows > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                        <p className="text-xs text-amber-600 mb-1">Inactive students</p>
                        <p className="text-2xl font-bold text-amber-900">{previewData.inactiveRows}</p>
                      </div>
                    )}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                      <p className="text-xs text-purple-600 mb-1">Unique parents</p>
                      <p className="text-2xl font-bold text-purple-900">{previewData.uniqueParents}</p>
                    </div>
                  </div>

                  {/* Warnings */}
                  {previewData.issues && previewData.issues.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <p className="font-semibold mb-1">Data warnings ({previewData.issues.length}):</p>
                        {previewData.issues.slice(0, 5).map((issue: string, i: number) => (
                          <p key={i} className="text-sm">• {issue}</p>
                        ))}
                        {previewData.issues.length > 5 && (
                          <p className="text-sm text-gray-500">…and {previewData.issues.length - 5} more</p>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Sample rows */}
                  {previewData.studentsPreview && previewData.studentsPreview.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 text-sm text-gray-700">
                        Sample records (first {previewData.studentsPreview.length} of {previewData.activeRows} active)
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200 rounded-lg text-xs">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wide">Student</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wide">DOB</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wide">Program</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wide">Parent</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wide">Parent Email</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wide">Medical</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {previewData.studentsPreview.map((s: any, i: number) => (
                              <tr key={i} className="hover:bg-gray-50">
                                <td className="px-3 py-2 font-medium">{s.studentName}</td>
                                <td className="px-3 py-2 text-gray-600">{s.dob}</td>
                                <td className="px-3 py-2">
                                  {s.program ? (
                                    <Badge variant="outline" className="text-xs">{s.program.split(' ')[0]}</Badge>
                                  ) : '—'}
                                </td>
                                <td className="px-3 py-2 text-gray-700">{s.parentName}</td>
                                <td className="px-3 py-2 text-gray-500">{s.parentEmail || s.parentMobile || '—'}</td>
                                <td className="px-3 py-2">
                                  {s.medical ? (
                                    <Badge variant="destructive" className="text-xs">Yes</Badge>
                                  ) : (
                                    <span className="text-gray-400">None</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-2 border-t">
                    <Button onClick={handleImport} disabled={importMutation.isPending} className="flex items-center gap-2">
                      Import {includeInactive ? previewData.totalRows : previewData.activeRows} students
                      {includeInactive && previewData.inactiveRows > 0 && (
                        <span className="text-xs opacity-75">(incl. {previewData.inactiveRows} inactive)</span>
                      )}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {!previewData && !importResult && !previewMutation.isPending && !importMutation.isPending && (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium">Upload your SportsBiz Student Export to begin</p>
                  <p className="text-sm mt-1">A preview will appear here so you can check the data before importing.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
