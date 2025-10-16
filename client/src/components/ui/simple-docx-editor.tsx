import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Save,
  Download,
  FileText,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SimpleDocxEditorProps {
  fileUrl: string;
  fileName: string;
  onSave?: (content: string) => void;
  onCancel?: () => void;
}

export default function SimpleDocxEditor({
  fileUrl,
  fileName,
  onSave,
  onCancel,
}: SimpleDocxEditorProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    const loadDocx = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Import mammoth dynamically
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
        setError(err.message || "Failed to load the DOCX file");
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

  const handleSave = async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      await onSave(content);
      toast({
        title: "Document saved",
        description: "Your changes have been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message || "Failed to save the document",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName.replace(".docx", ".html");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatText = (command: string) => {
    document.execCommand(command, false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-gray-600">
              Loading document for editing...
            </span>
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
              <FileText className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Error Loading Document
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex justify-center gap-2">
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Try Again
              </Button>
              {onCancel && <Button onClick={onCancel}>Cancel</Button>}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Editing: {fileName}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button onClick={handleDownload} size="sm" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export HTML
            </Button>
            {onCancel && (
              <Button onClick={onCancel} size="sm" variant="outline">
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Simple Toolbar */}
        <div className="flex items-center gap-1 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText("bold")}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText("italic")}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText("underline")}
            title="Underline"
          >
            <Underline className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText("insertUnorderedList")}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText("insertOrderedList")}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <div className="flex-1" />
          <Button onClick={handleSave} disabled={isSaving} size="sm">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <div className="h-full p-6">
          <div
            contentEditable
            className="prose prose-sm max-w-none h-full focus:outline-none border rounded p-4 min-h-[400px]"
            style={{
              fontFamily: "system-ui, -apple-system, sans-serif",
              lineHeight: "1.6",
            }}
            dangerouslySetInnerHTML={{ __html: content }}
            onInput={(e) => {
              const target = e.target as HTMLDivElement;
              setContent(target.innerHTML);
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

