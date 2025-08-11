import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import {
  Shield,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  GraduationCap,
  Bell,
  UserCheck,
  UserX,
  Trash2
} from "lucide-react";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("overview");

  // Queries
  const { data: allUsers, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
  });

  const { data: allNotes, isLoading: notesLoading } = useQuery({
    queryKey: ['/api/notes'],
  });

  const { data: moderationLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['/api/admin/moderation-logs'],
  });

  const { data: userApprovals, isLoading: approvalsLoading } = useQuery({
    queryKey: ['/api/admin/user-approvals'],
  });

  // Mutations
  const approveUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason?: string }) => {
      await apiRequest(`/api/admin/users/${userId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/user-approvals'] });
      toast({
        title: "User approved",
        description: "User has been successfully approved.",
      });
    }
  });

  const rejectUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      await apiRequest(`/api/admin/users/${userId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/user-approvals'] });
      toast({
        title: "User rejected",
        description: "User registration has been rejected.",
      });
    }
  });

  const deleteContentMutation = useMutation({
    mutationFn: async ({ contentType, contentId }: { contentType: string; contentId: string }) => {
      if (contentType === 'note') {
        await apiRequest(`/api/notes/${contentId}`, { method: 'DELETE' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      toast({
        title: "Content deleted",
        description: "Content has been successfully removed.",
      });
    }
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have admin privileges to access this page.</p>
          <Button onClick={() => setLocation('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  // Calculate stats
  const usersArray = Array.isArray(allUsers) ? allUsers : [];
  const notesArray = Array.isArray(allNotes) ? allNotes : [];
  const logsArray = Array.isArray(moderationLogs) ? moderationLogs : [];
  const approvalsArray = Array.isArray(userApprovals) ? userApprovals : [];

  const stats = {
    totalUsers: usersArray.length,
    teachers: usersArray.filter(u => u.role === 'teacher').length,
    students: usersArray.filter(u => u.role === 'student').length,
    totalNotes: notesArray.length,
    pendingApprovals: approvalsArray.filter(a => a.status === 'pending').length,
    flaggedContent: logsArray.filter(l => l.action === 'flagged').length,
  };

  // Filter users based on search
  const filteredUsers = usersArray.filter(u =>
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Shield className="text-red-600 h-8 w-8" />
              <span className="font-heading text-2xl font-bold">EduCollab Admin</span>
              <Badge className="bg-red-600 text-white">Administrator</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                {stats.pendingApprovals > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-600 text-white text-xs">
                    {stats.pendingApprovals}
                  </Badge>
                )}
              </Button>
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.profileImage || undefined} />
                  <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-gray-700 font-medium">{user.fullName}</span>
              </div>
              <Button onClick={logout} variant="ghost" size="sm">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Administration Dashboard</h1>
          <p className="text-gray-600">Monitor and manage the educational platform</p>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="content">Content Oversight</TabsTrigger>
            <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.teachers} teachers, {stats.students} students
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Educational Content</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalNotes}</div>
                  <p className="text-xs text-muted-foreground">Active learning materials</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {stats.pendingApprovals + stats.flaggedContent}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.pendingApprovals} approvals, {stats.flaggedContent} flagged
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    onClick={() => setSelectedTab("users")}
                    className="flex items-center space-x-2"
                  >
                    <UserCheck className="h-4 w-4" />
                    <span>Review User Registrations</span>
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setSelectedTab("content")}
                    className="flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Moderate Content</span>
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setSelectedTab("logs")}
                    className="flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>View Activity Logs</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">User Management</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-80"
                  />
                </div>
              </div>
            </div>

            {usersLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading users...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((u: any) => (
                  <Card key={u.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={u.profileImage || undefined} />
                            <AvatarFallback>{u.fullName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-lg">{u.fullName}</h3>
                            <p className="text-gray-600">{u.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge 
                                className={
                                  u.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                                  u.role === 'student' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }
                              >
                                {u.role}
                              </Badge>
                              {u.department && (
                                <span className="text-sm text-gray-500">{u.department}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            onClick={() => approveUserMutation.mutate({ userId: u.id })}
                            disabled={approveUserMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => rejectUserMutation.mutate({ 
                              userId: u.id, 
                              reason: "Account rejected by administrator" 
                            })}
                            disabled={rejectUserMutation.isPending}
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <h2 className="text-2xl font-bold">Content Oversight</h2>
            
            {notesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading content...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notesArray.map((note: any) => (
                  <Card key={note.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{note.title}</h3>
                          <p className="text-gray-600 mt-1">{note.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>By Teacher ID: {note.teacherId}</span>
                            <span>{note.viewCount || 0} views</span>
                            <span>Created {new Date(note.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteContentMutation.mutate({ 
                              contentType: 'note', 
                              contentId: note.id 
                            })}
                            disabled={deleteContentMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <h2 className="text-2xl font-bold">Activity Logs</h2>
            
            {logsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading logs...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {logsArray.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No activity logs yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  logsArray.map((log: any) => (
                    <Card key={log.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`p-2 rounded-full ${
                              log.action === 'approved' ? 'bg-green-100' :
                              log.action === 'rejected' ? 'bg-red-100' :
                              log.action === 'flagged' ? 'bg-yellow-100' :
                              'bg-gray-100'
                            }`}>
                              {log.action === 'approved' && <CheckCircle className="h-5 w-5 text-green-600" />}
                              {log.action === 'rejected' && <XCircle className="h-5 w-5 text-red-600" />}
                              {log.action === 'flagged' && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
                            </div>
                            <div>
                              <h3 className="font-semibold">
                                {log.contentType} {log.action}
                              </h3>
                              <p className="text-gray-600">{log.reason || 'No reason provided'}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(log.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}