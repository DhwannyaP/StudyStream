import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Users,
  Save,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface CollaborativeEditorProps {
  documentId: string;
  groupId: string;
  onSave?: (content: string) => void;
}

interface User {
  name: string;
  color: string;
  avatar?: string;
}

export default function CollaborativeEditor({
  documentId,
  groupId,
  onSave,
}: CollaborativeEditorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<User[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);

  // Generate a unique color for this user
  const userColor = useRef(`hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // Disable built-in history since we're using collaboration
      }),
      Collaboration.configure({
        document: ydocRef.current,
      }),
      CollaborationCursor.configure({
        provider: providerRef.current,
        user: {
          name: user?.fullName || "Anonymous",
          color: userColor.current,
        },
      }),
    ],
    content: "",
    editable: true,
  });

  useEffect(() => {
    if (!documentId || !groupId || !user) return;

    // Create Y.Doc instance
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // Create WebSocket provider
    const wsUrl = `ws://localhost:${
      window.location.port || 5000
    }/yjs?doc=document-${groupId}-${documentId}`;
    const provider = new WebsocketProvider(
      wsUrl,
      `document-${groupId}-${documentId}`,
      ydoc
    );
    providerRef.current = provider;

    // Handle connection status
    provider.on("status", (event: any) => {
      setIsConnected(event.status === "connected");
    });

    // Handle awareness (connected users)
    provider.awareness.on("change", () => {
      const users: User[] = [];
      provider.awareness.getStates().forEach((state: any, clientId: number) => {
        if (state.user) {
          users.push({
            name: state.user.name,
            color: state.user.color,
            avatar: state.user.avatar,
          });
        }
      });
      setConnectedUsers(users);
    });

    // Update editor when Y.Doc changes
    const updateEditor = () => {
      if (editor && ydoc) {
        const yXmlFragment = ydoc.getXmlFragment("prosemirror");
        editor.commands.setContent(yXmlFragment.toString());
      }
    };

    ydoc.on("update", updateEditor);

    // Cleanup function
    return () => {
      provider.destroy();
      ydoc.destroy();
    };
  }, [documentId, groupId, user, editor]);

  const handleSave = async () => {
    if (!editor || !onSave) return;

    setIsSaving(true);
    try {
      const content = editor.getHTML();
      await onSave(content);
      toast({
        title: "Document saved",
        description: "Your changes have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save the document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!editor) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Collaborative Document</CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="text-sm text-gray-600">
                {connectedUsers.length} online
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-xs text-gray-500">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>
        </div>

        {/* Connected Users */}
        {connectedUsers.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-gray-600">Active users:</span>
            <div className="flex items-center gap-1">
              {connectedUsers.map((user, index) => (
                <div key={index} className="flex items-center gap-1">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback
                      className="text-xs"
                      style={{ backgroundColor: user.color }}
                    >
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-gray-600">{user.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center gap-1 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive("bold") ? "bg-gray-200" : ""}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive("italic") ? "bg-gray-200" : ""}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive("underline") ? "bg-gray-200" : ""}
          >
            <Underline className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive("bulletList") ? "bg-gray-200" : ""}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive("orderedList") ? "bg-gray-200" : ""}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive("blockquote") ? "bg-gray-200" : ""}
          >
            <Quote className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="h-4 w-4" />
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
          <EditorContent
            editor={editor}
            className="prose prose-sm max-w-none h-full focus:outline-none"
          />
        </div>
      </CardContent>
    </Card>
  );
}
