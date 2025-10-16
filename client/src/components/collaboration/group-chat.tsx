import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send, Bot, Paperclip } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSocketManager } from "@/lib/socket";

interface GroupChatProps {
  groupId: string;
  onClose: () => void;
}

export default function GroupChat({ groupId, onClose }: GroupChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const [wsMessages, setWsMessages] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socket = useRef(getSocketManager()).current;

  const { data: messages = [] } = useQuery({
    queryKey: ["/api/messages", { groupId }],
    queryFn: async () => {
      const sessionId = localStorage.getItem("sessionId");
      const res = await fetch(`/api/messages?groupId=${groupId}`, {
        headers: { Authorization: `Bearer ${sessionId}` },
      });
      if (!res.ok) throw new Error("Failed to load messages");
      return res.json();
    },
  });

  useEffect(() => {
    socket.joinGroup(groupId);

    const handleGroupMessage = (data: any) => {
      if (data.message?.groupId === groupId) {
        setWsMessages((prev) => [...prev, data.message]);
      }
    };

    socket.on("group_chat_message", handleGroupMessage);

    return () => {
      socket.off("group_chat_message", handleGroupMessage);
    };
  }, [groupId, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, wsMessages]);

  const handleSend = async () => {
    if (!user || !newMessage.trim()) return;
    try {
      const sessionId = localStorage.getItem("sessionId");
      const form = new FormData();
      form.append("groupId", groupId);
      form.append("content", newMessage.trim());
      if (selectedFile) form.append("file", selectedFile);
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
        body: form,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to send");
      }
      // Optimistic: send via WS for instant delivery
      socket.sendGroupChatMessage(newMessage.trim(), user.id, groupId);
      setNewMessage("");
      setSelectedFile(null);
      // Refresh history
      queryClient.invalidateQueries({
        queryKey: ["/api/messages", { groupId }],
      });
    } catch (e: any) {
      toast({
        title: "Send failed",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  const combined = [...messages, ...wsMessages];

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full">
      <CardHeader className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <CardTitle className="font-heading font-bold">Group Chat</CardTitle>
          <Button onClick={onClose} variant="ghost" size="sm">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-edu-text-secondary">
          Group discussion • AI moderated
        </p>
      </CardHeader>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {combined.map((m: any) => (
            <div key={m.id} className="flex items-start space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={m.sender?.profileImage} />
                <AvatarFallback className="text-xs">
                  {m.sender?.fullName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm">
                    {m.sender?.fullName || "User"}
                  </span>
                  <span className="text-xs text-edu-text-secondary">
                    {new Date(m.timestamp || Date.now()).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-edu-text-primary">{m.content}</p>
                {m.fileUrl && (
                  <div className="mt-2 text-sm">
                    <a
                      href={m.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline"
                    >
                      {m.fileName || "Attachment"}
                    </a>
                  </div>
                )}
                {m.moderationResult && !m.moderationResult.isAppropriate && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    <Bot className="inline w-3 h-3 mr-1" />
                    Message flagged by AI moderator
                  </div>
                )}
              </div>
            </div>
          ))}
          {combined.length === 0 && (
            <div className="text-center py-8 text-edu-text-secondary">
              No messages yet
            </div>
          )}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <Bot className="text-primary h-4 w-4" />
                <span className="text-xs text-primary font-medium">
                  AI Moderator
                </span>
              </div>
              <p className="text-xs text-primary mt-1">
                This conversation is monitored to ensure respectful discussion.
              </p>
            </CardContent>
          </Card>
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2 items-center">
          <label className="cursor-pointer" title="Attach file">
            <input
              type="file"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-md border hover:bg-gray-50">
              <Paperclip className="h-4 w-4" />
            </span>
          </label>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!newMessage.trim() && !selectedFile}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {selectedFile && (
          <div className="mt-2 text-xs text-edu-text-secondary">
            Attached: {selectedFile.name}
          </div>
        )}
      </div>
    </div>
  );
}
