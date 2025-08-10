import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Loader2, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface InvoiceActionsProps {
  paymentId: string;
  className?: string;
}

interface InvoiceStatus {
  hasInvoice: boolean;
  invoiceNumber: string | null;
  paymentStatus: string;
}

export function InvoiceActions({ paymentId, className }: InvoiceActionsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check invoice status
  const { data: invoiceStatus, isLoading: statusLoading } = useQuery<InvoiceStatus>({
    queryKey: ["/api/payments", paymentId, "invoice-status"],
    enabled: !!paymentId,
  });

  // Generate invoice mutation
  const generateInvoiceMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/payments/${paymentId}/generate-invoice`);
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Invoice Generated",
        description: `Invoice ${data.invoiceNumber} has been created successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payments", paymentId, "invoice-status"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Download invoice function
  const downloadInvoice = async () => {
    try {
      const response = await fetch(`/api/payments/${paymentId}/invoice`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to download invoice');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceStatus?.invoiceNumber || paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download Complete",
        description: "Invoice PDF has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Unable to download invoice. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (statusLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="ml-2 text-sm text-muted-foreground">Loading invoice status...</span>
        </CardContent>
      </Card>
    );
  }

  const isPaid = invoiceStatus?.paymentStatus === 'completed';
  const hasInvoice = invoiceStatus?.hasInvoice;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Invoice
            </CardTitle>
            <CardDescription>
              {hasInvoice 
                ? `Invoice #${invoiceStatus.invoiceNumber}` 
                : "Professional invoice for your records"
              }
            </CardDescription>
          </div>
          <Badge variant={isPaid ? "default" : "secondary"}>
            {isPaid ? "Paid" : "Pending"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasInvoice ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              Invoice generated and ready for download
            </div>
            <Button
              onClick={downloadInvoice}
              className="w-full"
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF Invoice
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              {isPaid 
                ? "Generate a professional PDF invoice for your payment record."
                : "Invoice will be available after payment completion."
              }
            </div>
            <Button
              onClick={() => generateInvoiceMutation.mutate()}
              disabled={!isPaid || generateInvoiceMutation.isPending}
              className="w-full"
            >
              {generateInvoiceMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Invoice
                </>
              )}
            </Button>
          </div>
        )}
        
        {isPaid && (
          <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
            <strong>Professional Invoice Features:</strong>
            <ul className="mt-1 space-y-1">
              <li>• Power2ADAPT company branding</li>
              <li>• Detailed term and class information</li>
              <li>• GST breakdown and totals</li>
              <li>• Payment confirmation details</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}