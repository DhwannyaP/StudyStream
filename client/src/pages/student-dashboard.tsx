import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import StudyGroupsModal from "@/components/modals/study-groups-modal";
import { useState } from "react";
import { GraduationCap, Bell, Users, Bookmark, History, Search, ChevronRight } from "lucide-react";

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [showStudyGroups, setShowStudyGroups] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: teachers, isLoading: teachersLoading } = useQuery({
    queryKey: ['/api/users/teachers'],
  });

  const { data: notes } = useQuery({
    queryKey: ['/api/notes'],
  });

  if (!user) return null;

  // Filter teachers based on search - ensure teachers is array
  const teachersArray = Array.isArray(teachers) ? teachers : [];
  const filteredTeachers = teachersArray.filter((teacher: any) =>
    teacher.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get notes count and online students for each teacher
  const notesArray = Array.isArray(notes) ? notes : [];
  const teachersWithStats = filteredTeachers.map((teacher: any) => {
    const teacherNotes = notesArray.filter((note: any) => note.teacherId === teacher.id);
    return {
      ...teacher,
      notesCount: teacherNotes.length,
      onlineStudents: Math.floor(Math.random() * 10), // Mock online count
    };
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <GraduationCap className="text-primary h-8 w-8" />
              <span className="font-heading text-2xl font-bold">EduCollab</span>
              <Badge className="bg-secondary text-white">Student</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-accent text-white text-xs">
                  2
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
            Hello, {user.fullName.split(' ')[0]}!
          </h1>
          <p className="text-edu-text-secondary">Explore course materials and collaborate with your peers.</p>
        </div>
        
        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Button
            onClick={() => setShowStudyGroups(true)}
            className="bg-white hover:bg-gray-50 text-left h-auto p-6 flex-col items-start shadow-sm border"
            variant="outline"
          >
            <div className="flex items-center mb-4 w-full">
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="text-primary h-6 w-6" />
              </div>
              <h3 className="font-heading text-lg font-bold text-edu-text-primary ml-4">Study Groups</h3>
            </div>
            <p className="text-edu-text-secondary text-sm">Join or create study groups for collaborative learning</p>
          </Button>
          
          <Button
            className="bg-white hover:bg-gray-50 text-left h-auto p-6 flex-col items-start shadow-sm border"
            variant="outline"
          >
            <div className="flex items-center mb-4 w-full">
              <div className="p-3 rounded-full bg-secondary/10">
                <Bookmark className="text-secondary h-6 w-6" />
              </div>
              <h3 className="font-heading text-lg font-bold text-edu-text-primary ml-4">My Bookmarks</h3>
            </div>
            <p className="text-edu-text-secondary text-sm">Access your saved notes and materials</p>
          </Button>
          
          <Button
            className="bg-white hover:bg-gray-50 text-left h-auto p-6 flex-col items-start shadow-sm border"
            variant="outline"
          >
            <div className="flex items-center mb-4 w-full">
              <div className="p-3 rounded-full bg-accent/10">
                <History className="text-accent h-6 w-6" />
              </div>
              <h3 className="font-heading text-lg font-bold text-edu-text-primary ml-4">Recent Activity</h3>
            </div>
            <p className="text-edu-text-secondary text-sm">View your recent learning activities</p>
          </Button>
        </div>
        
        {/* Teachers List */}
        <Card>
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="font-heading text-xl font-bold text-edu-text-primary">Your Teachers</h2>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Input
                    type="search"
                    placeholder="Search teachers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-4 py-2 pr-10"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
          <CardContent className="p-6">
            {teachersLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-edu-text-secondary mt-2">Loading teachers...</p>
              </div>
            ) : teachersWithStats?.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-edu-text-secondary">No teachers found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {teachersWithStats?.map((teacher: any) => (
                  <div
                    key={teacher.id}
                    className="flex items-center justify-between py-4 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 rounded-lg px-4 transition-colors"
                    onClick={() => setLocation(`/teacher/${teacher.id}/notes`)}
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-16 w-16 border-2 border-gray-200">
                        <AvatarImage src={teacher.profileImage} alt={teacher.fullName} />
                        <AvatarFallback className="text-lg font-medium">
                          {teacher.fullName.split(' ').map((n: string) => n.charAt(0)).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-edu-text-primary text-lg">{teacher.fullName}</h4>
                        <p className="text-edu-text-secondary">{teacher.department}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-edu-text-secondary">
                          <span>{teacher.notesCount} notes</span>
                          <span className="flex items-center space-x-1">
                            <div className={`w-2 h-2 rounded-full ${
                              teacher.onlineStudents > 0 ? 'bg-green-500 online-indicator' : 'bg-gray-400'
                            }`}></div>
                            <span>{teacher.onlineStudents} students online</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={
                        teacher.onlineStudents > 0 
                          ? "bg-primary/10 text-primary" 
                          : "bg-gray-100 text-edu-text-secondary"
                      }>
                        {teacher.onlineStudents > 0 ? 'Active' : 'Offline'}
                      </Badge>
                      <ChevronRight className="text-edu-text-secondary h-5 w-5" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <StudyGroupsModal 
        open={showStudyGroups} 
        onOpenChange={setShowStudyGroups} 
      />
    </div>
  );
}
