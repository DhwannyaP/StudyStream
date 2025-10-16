import { useEffect, useMemo, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GroupChat from "@/components/collaboration/group-chat";
import VideoCall from "@/components/collaboration/video-call";
import CollaborativeEditor from "@/components/collaboration/collaborative-editor";
import {
  Upload,
  ArrowLeft,
  FileText,
  Video as VideoIcon,
  Edit3,
  MessageSquare,
} from "lucide-react";

export default function GroupConsole() {
  const [, params] = useRoute("/groups/:groupId/console");
  const groupId = params?.groupId as string;
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [showChat, setShowChat] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const [activeTab, setActiveTab] = useState("documents");

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["/api/groups/notes", { groupId }],
    queryFn: async () => {
      const sessionId = localStorage.getItem("sessionId");
      const res = await fetch(`/api/groups/${groupId}/notes`, {
        headers: { Authorization: `Bearer ${sessionId}` },
      });
      if (!res.ok) throw new Error("Failed to load group notes");
      return res.json();
    },
    enabled: !!groupId,
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) {
        throw new Error("Please enter a title");
      }
      if (!file) {
        throw new Error("Please choose a file to upload");
      }
      const sessionId = localStorage.getItem("sessionId");
      const form = new FormData();
      if (title) form.append("title", title);
      if (file) form.append("file", file);
      const res = await fetch(`/api/groups/${groupId}/notes`, {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionId}` },
        body: form,
      });
      const contentType = res.headers.get("content-type") || "";
      if (!res.ok) {
        if (contentType.includes("application/json")) {
          const err = await res.json();
          throw new Error(err.message || `Upload failed (${res.status})`);
        } else {
          const text = await res.text();
          throw new Error(text || `Upload failed (${res.status})`);
        }
      }
      if (contentType.includes("application/json")) {
        return res.json();
      } else {
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch {
          return { ok: true };
        }
      }
    },
    onSuccess: () => {
      setTitle("");
      setFile(null);
      queryClient.invalidateQueries({
        queryKey: ["/api/groups/notes", { groupId }],
      });
      toast({
        title: "Upload successful",
        description: "Your document is now available to group members.",
      });
    },
    onError: (e: any) => {
      toast({
        title: "Upload failed",
        description: e.message,
        variant: "destructive",
      });
    },
  });

  const saveDocumentMutation = useMutation({
    mutationFn: async (content: string) => {
      const sessionId = localStorage.getItem("sessionId");
      const res = await fetch(`/api/groups/${groupId}/documents`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionId}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save document");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Document saved",
        description: "Your collaborative document has been saved.",
      });
    },
    onError: (e: any) => {
      toast({
        title: "Save failed",
        description: e.message,
        variant: "destructive",
      });
    },
  });

  if (!groupId || !user) return null;

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/study-groups")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <span className="font-heading text-2xl font-bold">
                Group Console
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.profileImage || undefined} />
                <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{user.fullName}</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowVideo(true)}
              >
                <VideoIcon className="h-4 w-4 mr-2" />
                Start Call
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="h-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                  value="documents"
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Documents
                </TabsTrigger>
                <TabsTrigger
                  value="collaborate"
                  className="flex items-center gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  Collaborate
                </TabsTrigger>
              </TabsList>

              <TabsContent value="documents" className="space-y-6 mt-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <Label>Title</Label>
                        <Input
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Document title"
                        />
                      </div>
                      <div>
                        <Label>File</Label>
                        <Input
                          type="file"
                          accept=".pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png,.gif"
                          onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                      </div>
                      <Button
                        onClick={() => uploadMutation.mutate()}
                        disabled={uploadMutation.isPending}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadMutation.isPending ? "Uploading..." : "Upload"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    {isLoading ? (
                      <div className="text-gray-500">Loading notes…</div>
                    ) : notes.length === 0 ? (
                      <div className="text-gray-500">No documents yet</div>
                    ) : (
                      <div className="space-y-4">
                        {notes.map((note: any) => (
                          <div
                            key={note.id}
                            className="flex items-center justify-between py-3 border-b last:border-0"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-primary" />
                              <div>
                                <div className="font-medium">{note.title}</div>
                                <div className="text-sm text-gray-500">
                                  {new Date(note.createdAt).toLocaleString()}
                                </div>
                              </div>
                            </div>
                            {note.fileUrl && (
                              <Button asChild variant="outline" size="sm">
                                <a
                                  href={`/${String(note.fileUrl)
                                    .replace(/^\\\\/g, "")
                                    .replace(/^\/?/, "")}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Open
                                </a>
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="collaborate" className="mt-6 h-[600px]">
                <CollaborativeEditor
                  documentId="main"
                  groupId={groupId}
                  onSave={(content) => saveDocumentMutation.mutate(content)}
                />
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-1">
            {showChat && (
              <div className="sticky top-6">
                <GroupChat
                  groupId={groupId}
                  onClose={() => setShowChat(false)}
                />
              </div>
            )}
            {!showChat && (
              <Button className="w-full" onClick={() => setShowChat(true)}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Open Chat
              </Button>
            )}
          </div>
        </div>
      </div>

      {showVideo && (
        <VideoCall
          // Reuse VideoCall with groupId as the room identifier and enable in-call chat
          noteId={groupId}
          groupId={groupId}
          participants={[
            {
              id: user.id,
              user: {
                id: user.id,
                fullName: user.fullName,
                role: user.role,
                profileImage: user.profileImage || undefined,
              },
            },
          ]}
          onClose={() => setShowVideo(false)}
        />
      )}
    </div>
  );
}
