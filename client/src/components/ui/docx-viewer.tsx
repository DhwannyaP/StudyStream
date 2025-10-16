import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Edit3, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DocxViewerProps {
  fileUrl: string;
  fileName: string;
  onEdit?: () => void;
}

export default function DocxViewer({
  fileUrl,
  fileName,
  onEdit,
}: DocxViewerProps) {
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadDocx = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Import mammoth dynamically to avoid SSR issues
        const mammoth = await import("mammoth");

        // Fetch the DOCX file
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch document: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();

        // Convert DOCX to HTML
        const result = await mammoth.convertToHtml({ arrayBuffer });

        setContent(result.value);

        // Log any conversion messages
        if (result.messages.length > 0) {
          console.log("DOCX conversion messages:", result.messages);
        }
      } catch (err: any) {
        console.error("Error loading DOCX:", err);
        setError(err.message || "Failed to load document");
        toast({
          title: "Error loading document",
          description: err.message || "Failed to load the DOCX file",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (fileUrl) {
      loadDocx();
    }
  }, [fileUrl, toast]);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-gray-600">Loading document...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="text-red-500 mb-4">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Error Loading Document
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex justify-center gap-2">
              <Button onClick={handleDownload} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download Original
              </Button>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardContent className="p-0 h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            <span className="font-medium text-gray-900">{fileName}</span>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button onClick={onEdit} size="sm" variant="outline">
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            <Button onClick={handleDownload} size="sm" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {/* Document Content */}
        <div className="flex-1 overflow-auto">
          <div
            ref={containerRef}
            className="p-6 prose prose-sm max-w-none"
            style={{
              fontFamily: "system-ui, -apple-system, sans-serif",
              lineHeight: "1.6",
            }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

