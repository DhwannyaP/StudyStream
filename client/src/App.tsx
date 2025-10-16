import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";

import Landing from "@/pages/landing";
import TeacherDashboard from "@/pages/teacher-dashboard";
import StudentDashboard from "@/pages/student-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import TeacherNotes from "@/pages/teacher-notes";
import NoteViewer from "@/pages/note-viewer";
import GroupConsole from "@/pages/group-console";
import StudyGroupsPage from "@/pages/study-groups";
import AnalyticsPage from "@/pages/analytics";
import BookmarksPage from "@/pages/bookmarks";
import RecentActivityPage from "@/pages/recent-activity";
import NotFound from "@/pages/not-found";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/teacher/dashboard">
        {user?.role === "teacher" ? <TeacherDashboard /> : <Landing />}
      </Route>
      <Route path="/student/dashboard">
        {user?.role === "student" ? <StudentDashboard /> : <Landing />}
      </Route>
      <Route path="/admin/dashboard">
        {user?.role === "admin" ? <AdminDashboard /> : <Landing />}
      </Route>
      <Route path="/teacher/:teacherId/notes">
        {user?.role === "student" ? <TeacherNotes /> : <Landing />}
      </Route>
      <Route path="/groups/:groupId/console">
        {user ? <GroupConsole /> : <Landing />}
      </Route>
      <Route path="/study-groups">
        {user ? <StudyGroupsPage /> : <Landing />}
      </Route>
      <Route path="/analytics">
        {user?.role === "teacher" ? <AnalyticsPage /> : <Landing />}
      </Route>
      <Route path="/bookmarks">
        {user?.role === "student" ? <BookmarksPage /> : <Landing />}
      </Route>
      <Route path="/recent-activity">
        {user?.role === "student" ? <RecentActivityPage /> : <Landing />}
      </Route>
      <Route path="/note/:noteId">{user ? <NoteViewer /> : <Landing />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
