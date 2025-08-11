import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useCursorTracking, useCollaboration } from "@/hooks/use-socket";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ChatPanel from "@/components/collaboration/chat-panel";
import VideoCall from "@/components/collaboration/video-call";
import LaserCursor from "@/components/collaboration/laser-cursor";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Highlighter, MousePointer, MessageCircle, Video, Users, Eye } from "lucide-react";

export default function NoteViewer() {
  const { noteId } = useParams();
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const [showChat, setShowChat] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [highlightMode, setHighlightMode] = useState(false);
  const [laserMode, setLaserMode] = useState(false);
  const [selectedText, setSelectedText] = useState<string>("");
  const contentRef = useRef<HTMLDivElement>(null);

  const { data: note, isLoading: noteLoading } = useQuery({
    queryKey: ['/api/notes', noteId],
  });

  const { data: sessions } = useQuery({
    queryKey: ['/api/sessions', { noteId }],
  });

  const { data: annotations } = useQuery({
    queryKey: ['/api/annotations', noteId],
  });

  const cursors = useCursorTracking(noteId || '', user?.id || '');
  const { highlights, messages, addHighlight, sendMessage } = useCollaboration(noteId || '');

  const createAnnotationMutation = useMutation({
    mutationFn: async (annotationData: any) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch('/api/annotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`
        },
        body: JSON.stringify(annotationData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      
      return response.json();
    },
    onSuccess: (annotation) => {
      queryClient.invalidateQueries({ queryKey: ['/api/annotations', noteId] });
      addHighlight(annotation);
      toast({
        title: "Highlight added",
        description: "Your highlight has been saved and shared.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error adding highlight",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  useEffect(() => {
    if (!noteId || !user) return;

    // Create session when viewing note
    const sessionId = localStorage.getItem('sessionId');
    fetch('/api/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionId}`
      },
      body: JSON.stringify({ noteId, userId: user.id })
    });
  }, [noteId, user]);

  const handleTextSelection = () => {
    if (!highlightMode) return;

    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const selectedText = selection.toString();
      const range = selection.getRangeAt(0);
      
      // Create highlight annotation
      const annotationData = {
        noteId: noteId!,
        type: 'highlight',
        content: selectedText,
        position: {
          start: range.startOffset,
          end: range.endOffset,
          containerText: range.commonAncestorContainer.textContent?.substring(0, 50)
        },
        color: '#FFEB3B'
      };

      createAnnotationMutation.mutate(annotationData);
      
      // Clear selection
      selection.removeAllRanges();
    }
  };

  const handleGoBack = () => {
    if (note && typeof note === 'object' && 'teacher' in note) {
      setLocation(`/teacher/${(note as any).teacher.id}/notes`);
    } else {
      setLocation('/student/dashboard');
    }
  };

  if (!user) return null;

  if (noteLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-edu-text-primary mb-2">Note Not Found</h1>
          <p className="text-edu-text-secondary">The note you're looking for doesn't exist.</p>
          <Button onClick={() => setLocation('/student/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const sessionsArray = Array.isArray(sessions) ? sessions : [];
  const onlineUsers = sessionsArray.filter((s: any) => s.isActive);
  const onlineCount = onlineUsers.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-full px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Button onClick={handleGoBack} variant="ghost" size="sm">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="font-heading text-lg font-bold text-edu-text-primary">{note && typeof note === 'object' && 'title' in note ? (note as any).title : 'Note'}</h1>
                <p className="text-sm text-edu-text-secondary">
                  {note && typeof note === 'object' && 'teacher' in note && (note as any).teacher ? `${(note as any).teacher.fullName} • ${(note as any).teacher.department}` : 'Loading...'}
                </p>
              </div>
            </div>
            
            {/* Collaboration Tools */}
            <div className="flex items-center space-x-4">
              {/* Online Users */}
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-2">
                  {onlineUsers.slice(0, 3).map((session: any, index: number) => (
                    <Avatar key={session.id} className="w-8 h-8 border-2 border-white">
                      <AvatarFallback className="text-xs">
                        {session.user?.fullName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {onlineCount > 3 && (
                    <div className="w-8 h-8 bg-primary text-white rounded-full border-2 border-white flex items-center justify-center text-xs font-medium">
                      +{onlineCount - 3}
                    </div>
                  )}
                </div>
                <span className="text-sm text-edu-text-secondary">{onlineCount} online</span>
              </div>
              
              {/* Tools */}
              <div className="flex items-center space-x-2 border-l pl-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHighlightMode(!highlightMode)}
                  className={highlightMode ? 'bg-yellow-50 text-yellow-600' : 'hover:bg-yellow-50 hover:text-yellow-600'}
                  title="Highlight Tool"
                >
                  <Highlighter className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLaserMode(!laserMode)}
                  className={laserMode ? 'bg-red-50 text-red-600' : 'hover:bg-red-50 hover:text-red-600'}
                  title="Laser Pointer"
                >
                  <MousePointer className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowChat(!showChat)}
                  className={showChat ? 'bg-blue-50 text-primary' : 'hover:bg-blue-50 hover:text-primary'}
                  title="Chat"
                >
                  <MessageCircle className="h-4 w-4" />
                  {messages.length > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-accent text-white text-xs">
                      {messages.length}
                    </Badge>
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVideoCall(!showVideoCall)}
                  className={showVideoCall ? 'bg-green-50 text-secondary' : 'hover:bg-green-50 hover:text-secondary'}
                  title="Video Call"
                >
                  <Video className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="flex h-screen">
        {/* Note Content Area */}
        <div className="flex-1 relative">
          {/* Laser Cursors */}
          {Array.from(cursors.entries()).map(([userId, position]) => (
            <LaserCursor
              key={userId}
              userId={userId}
              position={position}
              color={`hsl(${userId.charCodeAt(0) * 137.5 % 360}, 70%, 50%)`}
            />
          ))}
          
          {/* Note Content */}
          <div className="p-8 max-w-4xl mx-auto">
            <div
              ref={contentRef}
              className="bg-white rounded-lg shadow-sm border p-8 relative z-10"
              onMouseUp={handleTextSelection}
            >
              <article className="prose prose-lg max-w-none">
                <h1 className="font-heading text-3xl font-bold text-edu-text-primary mb-6">
                  {note && typeof note === 'object' && 'title' in note ? (note as any).title : 'Note'}
                </h1>
                
                {note && typeof note === 'object' && 'fileUrl' in note && (note as any).fileUrl ? (
                  <div className="mb-6">
                    {(note as any).fileType === 'image' ? (
                      <img 
                        src={`/${(note as any).fileUrl}`} 
                        alt={(note as any).title || 'Note'}
                        className="max-w-full h-auto rounded-lg"
                      />
                    ) : (note as any).fileType === 'application' ? (
                      <div className="border rounded-lg p-6 text-center">
                        <p className="text-edu-text-secondary mb-4">Document: {(note as any).fileName}</p>
                        <Button asChild>
                          <a href={`/${(note as any).fileUrl}`} download target="_blank">
                            Download Document
                          </a>
                        </Button>
                      </div>
                    ) : (
                      <iframe
                        src={`/${(note as any).fileUrl}`}
                        className="w-full h-96 border rounded-lg"
                        title={(note as any).title || 'Note'}
                      />
                    )}
                  </div>
                ) : (
                  <div className="prose-content">
                    {/* Sample educational content */}
                    <h2 className="font-heading text-2xl font-bold text-edu-text-primary mt-8 mb-4">
                      1. Introduction to Advanced Concepts
                    </h2>
                    
                    <p className="text-edu-text-primary leading-relaxed mb-4">
                      {(note && typeof note === 'object' && 'description' in note && (note as any).description) || "This educational material covers important concepts that are fundamental to understanding the subject matter. Students should pay careful attention to the key principles outlined in this section."}
                    </p>
                    
                    <div className="bg-gray-50 rounded-lg p-6 my-6">
                      <h4 className="font-bold text-edu-text-primary mb-3">Key Learning Objectives:</h4>
                      <ul className="list-disc list-inside text-edu-text-primary space-y-1">
                        <li>Understand the fundamental principles</li>
                        <li>Apply theoretical concepts to practical scenarios</li>
                        <li>Develop critical thinking skills</li>
                        <li>Master problem-solving techniques</li>
                      </ul>
                    </div>
                    
                    <h2 className="font-heading text-2xl font-bold text-edu-text-primary mt-8 mb-4">
                      2. Core Concepts
                    </h2>
                    
                    <p className="text-edu-text-primary leading-relaxed mb-4">
                      The following section explores the core concepts that form the foundation of this subject area. 
                      These principles are essential for building a comprehensive understanding.
                    </p>
                    
                    <div className="bg-blue-50 border-l-4 border-primary p-6 my-6">
                      <h4 className="font-bold text-primary mb-2">💡 Important Note:</h4>
                      <p className="text-edu-text-primary">
                        Pay special attention to the relationships between different concepts. 
                        Understanding these connections will help you grasp the bigger picture.
                      </p>
                    </div>
                    
                    <h2 className="font-heading text-2xl font-bold text-edu-text-primary mt-8 mb-4">
                      3. Practical Applications
                    </h2>
                    
                    <p className="text-edu-text-primary leading-relaxed mb-4">
                      Real-world applications demonstrate how theoretical knowledge can be applied in practice. 
                      This section provides examples and case studies that illustrate key concepts.
                    </p>
                    
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 my-6">
                      <h4 className="font-bold text-yellow-700 mb-2">⚠️ Study Tip:</h4>
                      <p className="text-yellow-700">
                        Work through the examples step by step. Try to understand not just what is happening, 
                        but why each step is necessary.
                      </p>
                    </div>
                    
                    <h2 className="font-heading text-2xl font-bold text-edu-text-primary mt-8 mb-4">
                      Conclusion
                    </h2>
                    
                    <p className="text-edu-text-primary leading-relaxed mb-4">
                      This material provides a comprehensive foundation for understanding the subject. 
                      Review the key concepts regularly and don't hesitate to ask questions during discussions.
                    </p>
                  </div>
                )}
                
                {/* Render existing highlights */}
                {Array.isArray(annotations) && annotations.map((annotation: any) => (
                  <div
                    key={annotation.id}
                    className="highlight-selection inline"
                    style={{ backgroundColor: annotation.color + '50' }}
                    title={`Highlighted by ${annotation.user?.fullName || 'Unknown'}`}
                  >
                    {annotation.content}
                  </div>
                ))}
              </article>
            </div>
          </div>
        </div>
        
        {/* Chat Sidebar */}
        {showChat && (
          <ChatPanel
            noteId={noteId!}
            messages={messages}
            onSendMessage={sendMessage}
            onClose={() => setShowChat(false)}
          />
        )}
      </div>

      {/* Video Call Modal */}
      {showVideoCall && (
        <VideoCall
          noteId={noteId!}
          participants={onlineUsers}
          onClose={() => setShowVideoCall(false)}
        />
      )}
    </div>
  );
}
