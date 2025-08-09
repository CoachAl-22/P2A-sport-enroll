import { useState } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";
import { Upload, FileText } from "lucide-react";

interface CSVUploaderProps {
  onComplete?: (uploadURL: string) => void;
  buttonClassName?: string;
  title?: string;
  description?: string;
}

/**
 * A CSV file upload component that renders as a button and provides a modal interface for
 * file management specifically for CSV imports.
 */
export function CSVUploader({
  onComplete,
  buttonClassName,
  title = "Upload CSV File",
  description = "Select your customer and student data CSV file"
}: CSVUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles: 1,
        maxFileSize: 10485760, // 10MB
        allowedFileTypes: ['.csv', 'text/csv', 'application/csv'],
      },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: async () => {
          setIsUploading(true);
          const response = await fetch('/api/csv-upload-url', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            throw new Error('Failed to get upload URL');
          }
          
          const data = await response.json();
          return {
            method: 'PUT' as const,
            url: data.uploadURL,
          };
        },
      })
      .on("complete", (result) => {
        setIsUploading(false);
        setShowModal(false);
        if (result.successful && result.successful.length > 0) {
          const uploadURL = result.successful[0].uploadURL;
          if (uploadURL) {
            onComplete?.(uploadURL);
          }
        }
      })
      .on("error", () => {
        setIsUploading(false);
      })
  );

  return (
    <div>
      <Button 
        onClick={() => setShowModal(true)} 
        className={buttonClassName}
        disabled={isUploading}
      >
        <Upload className="w-4 h-4 mr-2" />
        {isUploading ? "Uploading..." : title}
      </Button>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
        note={description}
        plugins={['Webcam']}
        metaFields={[
          { id: 'name', name: 'File name', placeholder: 'customer-data.csv' },
          { id: 'description', name: 'Description', placeholder: 'Customer and student data import' }
        ]}
      />
    </div>
  );
}