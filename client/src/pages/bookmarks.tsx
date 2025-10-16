import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Bookmark,
  FileText,
  Search,
  Calendar,
  Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";

export default function BookmarksPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: notes = [] } = useQuery({
    queryKey: ["/api/notes"],
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

  // For now, we'll show all notes as "bookmarked" since we don't have a bookmark system yet
  // In a real implementation, you'd have a separate bookmarks table/API
  const notesArray = Array.isArray(notes) ? notes : [];
  const bookmarkedNotes = notesArray;

  const getDashboardPath = () => {
    if (user?.role === "teacher") return "/teacher/dashboard";
    if (user?.role === "student") return "/student/dashboard";
    return "/";
  };

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
              <Bookmark className="text-primary h-8 w-8" />
              <span className="font-heading text-2xl font-bold">
                My Bookmarks
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Bookmarks
          </h1>
          <p className="text-gray-600">Access your saved notes and materials</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search bookmarks..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Bookmarks List */}
        {bookmarkedNotes.length === 0 ? (
          <div className="text-center py-8">
            <Bookmark className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No bookmarks yet</p>
            <p className="text-sm text-gray-500">
              Start bookmarking notes to see them here
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bookmarkedNotes.map((note: any) => (
              <Card key={note.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{note.title}</span>
                    <Badge variant="secondary">
                      {note.subject || "General"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {note.description || "No description provided"}
                  </p>
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      <span>
                        Uploaded by {note.teacherName || "Unknown Teacher"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-2" />
                      <span>{note.viewCount || 0} views</span>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => setLocation(`/note/${note.id}`)}
                    >
                      View Note
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Remove Bookmark
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => setLocation("/student/dashboard")}
            >
              Browse All Notes
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/study-groups")}
            >
              Join Study Groups
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/recent-activity")}
            >
              View Recent Activity
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
