import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import UploadModal from "@/components/modals/upload-modal";
import { useState } from "react";
import { GraduationCap, Bell, FileText, Users, Eye, MessageCircle, Plus, BarChart3, Edit, Trash2 } from "lucide-react";

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [showUploadModal, setShowUploadModal] = useState(false);

  const { data: notes, isLoading: notesLoading } = useQuery({
    queryKey: ['/api/notes'],
  });

  const { data: sessions } = useQuery({
    queryKey: ['/api/sessions'],
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionId}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      toast({
        title: "Note deleted",
        description: "The note has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting note",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  if (!user) return null;

  // Calculate stats - ensure notes is array
  const notesArray = Array.isArray(notes) ? notes : [];
  const totalNotes = notesArray.length;
  const totalViews = notesArray.reduce((sum: number, note: any) => sum + (note.viewCount || 0), 0);
  const sessionsArray = Array.isArray(sessions) ? sessions : [];
  const activeStudents = sessionsArray.filter((s: any) => s.isActive).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <GraduationCap className="text-primary h-8 w-8" />
              <span className="font-heading text-2xl font-bold">EduCollab</span>
              <Badge className="bg-primary text-white">Teacher</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-accent text-white text-xs">
                  3
                </Badge>
              </Button>
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.profileImage || undefined} />
                  <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-edu-text-primary font-medium">{user.fullName}</span>
              </div>
              <Button onClick={logout} variant="ghost" size="sm">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-edu-text-primary mb-2">
            Welcome back, {user.fullName}!
          </h1>
          <p className="text-edu-text-secondary">Manage your course materials and track student engagement.</p>
        </div>
        
        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-primary/10">
                  <FileText className="text-primary h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-edu-text-secondary text-sm">Total Notes</p>
                  <p className="text-2xl font-bold text-edu-text-primary">{totalNotes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-secondary/10">
                  <Users className="text-secondary h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-edu-text-secondary text-sm">Active Students</p>
                  <p className="text-2xl font-bold text-edu-text-primary">{activeStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-accent/10">
                  <Eye className="text-accent h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-edu-text-secondary text-sm">Total Views</p>
                  <p className="text-2xl font-bold text-edu-text-primary">{totalViews}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-500/10">
                  <MessageCircle className="text-yellow-600 h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-edu-text-secondary text-sm">Discussions</p>
                  <p className="text-2xl font-bold text-edu-text-primary">15</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Button 
            onClick={() => setShowUploadModal(true)}
            className="bg-primary text-white hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Upload New Material
          </Button>
          <Button className="bg-secondary text-white hover:bg-green-600">
            <Users className="mr-2 h-4 w-4" />
            Manage Study Groups
          </Button>
          <Button variant="outline">
            <BarChart3 className="mr-2 h-4 w-4" />
            View Analytics
          </Button>
        </div>
        
        {/* Recent Materials */}
        <Card>
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="font-heading text-xl font-bold text-edu-text-primary">Recent Materials</h2>
              <Button variant="link">View All</Button>
            </div>
          </div>
          <CardContent className="p-6">
            {notesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-edu-text-secondary mt-2">Loading notes...</p>
              </div>
            ) : notesArray.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-edu-text-secondary">No notes uploaded yet</p>
                <p className="text-sm text-edu-text-secondary">Upload your first material to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notesArray.map((note: any) => (
                  <div key={note.id} className="flex items-center justify-between py-4 border-b last:border-b-0">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 rounded-lg bg-blue-50">
                        <FileText className="text-primary h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-medium text-edu-text-primary">{note.title}</h4>
                        <p className="text-edu-text-secondary text-sm">{note.description}</p>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-edu-text-secondary">
                          <span>Uploaded {new Date(note.createdAt).toLocaleDateString()}</span>
                          <span>{note.viewCount || 0} views</span>
                          <span className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full online-indicator"></div>
                            <span>0 online</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="ghost">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => deleteNoteMutation.mutate(note.id)}
                        disabled={deleteNoteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <UploadModal 
        open={showUploadModal} 
        onOpenChange={setShowUploadModal} 
      />
    </div>
  );
}
