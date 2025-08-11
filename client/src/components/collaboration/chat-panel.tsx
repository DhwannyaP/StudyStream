import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { X, Send, Paperclip, Smile, Bot } from "lucide-react";

interface Message {
  id: string;
  content: string;
  senderId: string;
  sender?: {
    id: string;
    fullName: string;
    role: string;
    profileImage?: string;
  };
  timestamp: string;
  moderationResult?: {
    isAppropriate: boolean;
    reason?: string;
  };
}

interface ChatPanelProps {
  noteId: string;
  messages: Message[];
  onSendMessage: (content: string, userId: string) => void;
  onClose: () => void;
}

export default function ChatPanel({ noteId, messages, onSendMessage, onClose }: ChatPanelProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setIsLoading(true);
    try {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`
        },
        body: JSON.stringify({
          noteId,
          content: newMessage.trim()
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const message = await response.json();
      
      // Check moderation result
      if (message.moderationResult && !message.moderationResult.isAppropriate) {
        toast({
          title: "Message blocked",
          description: message.moderationResult.reason || "Your message contains inappropriate content.",
          variant: "destructive",
        });
      } else {
        // Send via WebSocket for real-time delivery
        onSendMessage(newMessage.trim(), user.id);
        setNewMessage("");
        
        toast({
          title: "Message sent",
          description: "Your message has been delivered.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Chat Header */}
      <CardHeader className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <CardTitle className="font-heading font-bold text-edu-text-primary">Discussion</CardTitle>
          <Button onClick={onClose} variant="ghost" size="sm">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-edu-text-secondary mt-1">
          Real-time chat • AI Moderated
        </p>
      </CardHeader>
      
      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="flex items-start space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={message.sender?.profileImage} />
                <AvatarFallback className="text-xs">
                  {message.sender?.fullName?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-edu-text-primary text-sm">
                    {message.sender?.fullName || 'Unknown User'}
                  </span>
                  {message.sender?.role === 'teacher' && (
                    <Badge className="bg-primary text-white px-2 py-0.5 text-xs">
                      Teacher
                    </Badge>
                  )}
                  <span className="text-xs text-edu-text-secondary">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <div className="mt-1">
                  <p className="text-sm text-edu-text-primary chat-message">
                    {message.content}
                  </p>
                  {message.moderationResult && !message.moderationResult.isAppropriate && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      <Bot className="inline w-3 h-3 mr-1" />
                      Message flagged by AI moderator
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {messages.length === 0 && (
            <div className="text-center py-8">
              <p className="text-edu-text-secondary">No messages yet</p>
              <p className="text-sm text-edu-text-secondary mt-1">
                Start a discussion about this material
              </p>
            </div>
          )}
          
          {/* AI Moderation Notice */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <Bot className="text-primary h-4 w-4" />
                <span className="text-xs text-primary font-medium">AI Moderator</span>
              </div>
              <p className="text-xs text-primary mt-1">
                This conversation is monitored to ensure educational and respectful discussion.
              </p>
            </CardContent>
          </Card>
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      {/* Chat Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !newMessage.trim()}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" disabled>
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" disabled>
              <Smile className="h-4 w-4" />
            </Button>
          </div>
          <span className="text-xs text-edu-text-secondary">AI Moderated</span>
        </div>
      </div>
    </div>
  );
}
