import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  History,
  FileText,
  Users,
  Calendar,
  Clock,
  TrendingUp,
} from "lucide-react";

export default function RecentActivityPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: notes = [] } = useQuery({
    queryKey: ["/api/notes"],
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["/api/sessions"],
  });

  const { data: studyGroups = [] } = useQuery({
    queryKey: ["/api/study-groups"],
  });

  if (!user || user.role !== "student") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-4">
            You don't have student privileges to access this page.
          </p>
          <Button onClick={() => setLocation("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  // Get recent activity (last 30 days)
  const lastMonth = new Date();
  lastMonth.setDate(lastMonth.getDate() - 30);

  // Filter recent notes
  const notesArray = Array.isArray(notes) ? notes : [];
  const recentNotes = notesArray.filter(
    (note: any) => new Date(note.createdAt) > lastMonth
  );

  // Filter recent sessions
  const sessionsArray = Array.isArray(sessions) ? sessions : [];
  const recentSessions = sessionsArray.filter(
    (session: any) =>
      session.userId === user.id && new Date(session.createdAt) > lastMonth
  );

  // Filter recent study group activities
  const groupsArray = Array.isArray(studyGroups) ? studyGroups : [];
  const recentGroups = groupsArray.filter(
    (group: any) => new Date(group.createdAt) > lastMonth
  );

  const getDashboardPath = () => {
    if (user?.role === "teacher") return "/teacher/dashboard";
    if (user?.role === "student") return "/student/dashboard";
    return "/";
  };

  // Generate mock activity data for demonstration
  const mockActivities = [
    {
      id: 1,
      type: "note_view",
      title: "Viewed Mathematics Notes",
      description: "You viewed Advanced Calculus notes by Dr. Smith",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      id: 2,
      type: "study_group",
      title: "Joined Study Group",
      description: "You joined the 'Physics Study Group'",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      id: 3,
      type: "note_download",
      title: "Downloaded Chemistry Notes",
      description: "You downloaded Organic Chemistry notes by Dr. Johnson",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      icon: FileText,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      id: 4,
      type: "collaboration",
      title: "Collaborated on Project",
      description: "You worked on a group project with 3 other students",
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setLocation(getDashboardPath())}
                variant="ghost"
                size="sm"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <History className="text-primary h-8 w-8" />
              <span className="font-heading text-2xl font-bold">
                Recent Activity
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Recent Activity
          </h1>
          <p className="text-gray-600">
            Track your recent learning activities and progress
          </p>
        </div>

        {/* Activity Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Notes Viewed
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentNotes.length}</div>
              <p className="text-xs text-muted-foreground">
                In the last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Study Sessions
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentSessions.length}</div>
              <p className="text-xs text-muted-foreground">
                Active learning sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Groups Joined
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentGroups.length}</div>
              <p className="text-xs text-muted-foreground">New study groups</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Activity Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {mockActivities.map((activity, index) => {
                const IconComponent = activity.icon;
                return (
                  <div key={activity.id} className="flex items-start space-x-4">
                    <div className={`p-3 rounded-full ${activity.bgColor}`}>
                      <IconComponent className={`h-5 w-5 ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">
                          {activity.title}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {activity.timestamp.toLocaleDateString()}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {activity.timestamp.toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Learning Insights */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Learning Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="font-semibold mb-3">Most Active Subjects</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium">Mathematics</span>
                    <span className="text-sm text-blue-600 font-semibold">
                      5 sessions
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium">Physics</span>
                    <span className="text-sm text-green-600 font-semibold">
                      3 sessions
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium">Chemistry</span>
                    <span className="text-sm text-purple-600 font-semibold">
                      2 sessions
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Study Patterns</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm font-medium">Peak Study Time</span>
                    <span className="text-sm text-yellow-600 font-semibold">
                      2 PM - 4 PM
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
                    <span className="text-sm font-medium">Average Session</span>
                    <span className="text-sm text-indigo-600 font-semibold">
                      45 minutes
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-pink-50 rounded-lg">
                    <span className="text-sm font-medium">Weekly Goal</span>
                    <span className="text-sm text-pink-600 font-semibold">
                      80% Complete
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Continue Learning</h3>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setLocation("/student/dashboard")}
              className="bg-primary text-white hover:bg-blue-700"
            >
              Browse Notes
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/study-groups")}
            >
              Join Study Groups
            </Button>
            <Button variant="outline" onClick={() => setLocation("/bookmarks")}>
              View Bookmarks
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
