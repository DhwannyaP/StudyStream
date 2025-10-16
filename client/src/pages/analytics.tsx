import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  FileText,
  Eye,
  Users,
  TrendingUp,
  Calendar,
} from "lucide-react";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: notes = [] } = useQuery({
    queryKey: ["/api/notes"],
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["/api/sessions"],
  });

  if (!user || user.role !== "teacher") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-4">
            You don't have teacher privileges to access this page.
          </p>
          <Button onClick={() => setLocation("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  // Filter notes for current teacher
  const notesArray = Array.isArray(notes) ? notes : [];
  const teacherNotes = notesArray.filter(
    (note: any) => note.teacherId === user.id
  );

  // Calculate analytics
  const totalViews = teacherNotes.reduce(
    (sum: number, note: any) => sum + (note.viewCount || 0),
    0
  );
  const totalNotes = teacherNotes.length;
  const sessionsArray = Array.isArray(sessions) ? sessions : [];
  const activeStudents = sessionsArray.filter(
    (session: any) =>
      session.isActive &&
      teacherNotes.some((note: any) => note.id === session.noteId)
  ).length;

  // Get recent activity (last 7 days)
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  const recentViews = teacherNotes
    .filter((note: any) => new Date(note.updatedAt) > lastWeek)
    .reduce((sum: number, note: any) => sum + (note.viewCount || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setLocation("/teacher/dashboard")}
                variant="ghost"
                size="sm"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <TrendingUp className="text-primary h-8 w-8" />
              <span className="font-heading text-2xl font-bold">Analytics</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Teaching Analytics
          </h1>
          <p className="text-gray-600">
            Track your content performance and student engagement
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalNotes}</div>
              <p className="text-xs text-muted-foreground">
                Educational materials uploaded
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalViews}</div>
              <p className="text-xs text-muted-foreground">
                Combined content views
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Students
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeStudents}</div>
              <p className="text-xs text-muted-foreground">
                Currently viewing content
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Recent Views
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentViews}</div>
              <p className="text-xs text-muted-foreground">
                Views in last 7 days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Content Performance */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Content Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {teacherNotes.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No notes uploaded yet</p>
                <p className="text-sm text-gray-500">
                  Upload your first material to see analytics
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {teacherNotes.map((note: any) => (
                  <div
                    key={note.id}
                    className="flex items-center justify-between py-4 border-b last:border-b-0"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-3 rounded-lg bg-blue-50">
                        <FileText className="text-primary h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {note.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {note.description}
                        </p>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          <span>
                            Uploaded{" "}
                            {new Date(note.createdAt).toLocaleDateString()}
                          </span>
                          <span>{note.viewCount || 0} views</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {note.viewCount || 0}
                      </div>
                      <div className="text-xs text-gray-500">total views</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Engagement Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="font-semibold mb-3">Most Popular Content</h3>
                {teacherNotes.length > 0 ? (
                  <div className="space-y-2">
                    {teacherNotes
                      .sort(
                        (a: any, b: any) =>
                          (b.viewCount || 0) - (a.viewCount || 0)
                      )
                      .slice(0, 3)
                      .map((note: any, index: number) => (
                        <div
                          key={note.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <span className="font-medium">{note.title}</span>
                          </div>
                          <span className="text-sm text-gray-600">
                            {note.viewCount || 0} views
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No content to analyze</p>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-3">Activity Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium">
                      Content Engagement
                    </span>
                    <span className="text-sm text-green-600 font-semibold">
                      {totalViews > 0 ? "High" : "Low"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium">Student Reach</span>
                    <span className="text-sm text-blue-600 font-semibold">
                      {activeStudents > 0 ? "Active" : "Quiet"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium">
                      Content Freshness
                    </span>
                    <span className="text-sm text-purple-600 font-semibold">
                      {teacherNotes.length > 0 ? "Good" : "Needs Content"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
