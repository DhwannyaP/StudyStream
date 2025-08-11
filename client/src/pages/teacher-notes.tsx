import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, GraduationCap, Users, FileText, Image, FileSpreadsheet } from "lucide-react";

export default function TeacherNotes() {
  const { teacherId } = useParams();
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const { data: notes, isLoading: notesLoading } = useQuery({
    queryKey: ['/api/notes', { teacherId }],
  });

  const { data: teacher, isLoading: teacherLoading } = useQuery({
    queryKey: ['/api/users/teachers'],
    select: (data) => data?.find((t: any) => t.id === teacherId)
  });

  const { data: sessions } = useQuery({
    queryKey: ['/api/sessions'],
  });

  if (!user) return null;

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return <Image className="text-purple-600 h-6 w-6" />;
      case 'application':
        return <FileSpreadsheet className="text-green-600 h-6 w-6" />;
      default:
        return <FileText className="text-primary h-6 w-6" />;
    }
  };

  const getFileTypeColor = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return 'bg-purple-50';
      case 'application':
        return 'bg-green-50';
      default:
        return 'bg-blue-50';
    }
  };

  if (teacherLoading || notesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-edu-text-primary mb-2">Teacher Not Found</h1>
          <p className="text-edu-text-secondary">The teacher you're looking for doesn't exist.</p>
          <Button onClick={() => setLocation('/student/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const onlineCount = sessions?.filter((s: any) => s.isActive && s.noteId)?.length || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setLocation('/student/dashboard')}
                variant="ghost"
                size="sm"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <GraduationCap className="text-primary h-8 w-8" />
              <span className="font-heading text-2xl font-bold">EduCollab</span>
              <span className="text-edu-text-secondary">•</span>
              <span className="text-edu-text-primary font-medium">{teacher.fullName}'s Notes</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-edu-text-secondary">
                <Users className="h-4 w-4" />
                <span>{onlineCount} students online</span>
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
        {/* Teacher Info */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20 border-2 border-gray-200">
                <AvatarImage src={teacher.profileImage} alt={teacher.fullName} />
                <AvatarFallback className="text-xl font-medium">
                  {teacher.fullName.split(' ').map((n: string) => n.charAt(0)).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-heading text-2xl font-bold text-edu-text-primary">{teacher.fullName}</h1>
                <p className="text-edu-text-secondary">{teacher.department}</p>
                <p className="text-edu-text-secondary text-sm">{teacher.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Notes Grid */}
        {notes?.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-heading text-xl font-bold text-edu-text-primary mb-2">No Notes Available</h3>
              <p className="text-edu-text-secondary">This teacher hasn't uploaded any materials yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes?.map((note: any) => (
              <Card
                key={note.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setLocation(`/note/${note.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg ${getFileTypeColor(note.fileType)}`}>
                      {getFileIcon(note.fileType)}
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-edu-text-secondary">
                      <div className="w-2 h-2 bg-green-500 rounded-full online-indicator"></div>
                      <span>{Math.floor(Math.random() * 5)} online</span>
                    </div>
                  </div>
                  
                  <h3 className="font-heading text-lg font-bold text-edu-text-primary mb-2">
                    {note.title}
                  </h3>
                  
                  <p className="text-edu-text-secondary text-sm mb-4 line-clamp-3">
                    {note.description || 'No description available'}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-edu-text-secondary">
                    <span>Updated {new Date(note.updatedAt).toLocaleDateString()}</span>
                    <span>{note.fileType === 'application' ? 'Document' : 
                           note.fileType === 'image' ? 'Images' : 
                           `${Math.floor(Math.random() * 50)} pages`}</span>
                  </div>
                  
                  <div className="mt-4">
                    <Badge variant="secondary" className="text-xs">
                      {note.category || 'General'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
