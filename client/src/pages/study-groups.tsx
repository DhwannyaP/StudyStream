import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Users,
  Calendar,
  Plus,
  Search,
  Circle,
  MessageCircle,
} from "lucide-react";
import GroupChat from "@/components/collaboration/group-chat";

export default function StudyGroupsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeChatGroupId, setActiveChatGroupId] = useState<string | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    schedule: "",
  });

  const { data: studyGroups = [], isLoading } = useQuery({
    queryKey: ["/api/study-groups"],
  });

  const createGroupMutation = useMutation({
    mutationFn: async (groupData: any) => {
      const sessionId = localStorage.getItem("sessionId");
      const response = await fetch("/api/study-groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionId}`,
        },
        body: JSON.stringify(groupData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study-groups"] });
      toast({
        title: "Study group created!",
        description: "Your study group has been created successfully.",
      });
      setShowCreateForm(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create group",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const sessionId = localStorage.getItem("sessionId");
      const response = await fetch(`/api/study-groups/${groupId}/join`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study-groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my/study-groups"] });
      toast({
        title: "Joined group!",
        description: "You have successfully joined the study group.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to join group",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      schedule: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createGroupMutation.mutate({
      ...formData,
      creatorId: user?.id,
    });
  };

  const groupsArray = Array.isArray(studyGroups) ? studyGroups : [];
  const filteredGroups = groupsArray.filter(
    (group: any) =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <Users className="text-primary h-8 w-8" />
              <span className="font-heading text-2xl font-bold">
                Study Groups
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-primary text-white hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Group
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Study Groups
          </h1>
          <p className="text-gray-600">
            Join or create study groups for collaborative learning
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search study groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Study Groups List */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading study groups...</p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No study groups found</p>
            <p className="text-sm text-gray-500">
              Create the first study group to get started
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredGroups.map((group: any) => (
              <Card
                key={group.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{group.name}</span>
                    <Badge variant="secondary">
                      {group.memberCount || 0} members
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {group.description || "No description provided"}
                  </p>
                  {group.schedule && (
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <Calendar className="h-4 w-4 mr-2" />
                      {group.schedule}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <Circle className="h-3 w-3 mr-1" />
                      {group.isActive ? "Active" : "Inactive"}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => joinGroupMutation.mutate(group.id)}
                      disabled={joinGroupMutation.isPending}
                    >
                      Join Group
                    </Button>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveChatGroupId(group.id)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Open Chat
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setLocation(`/groups/${group.id}/console`)}
                    >
                      Open Console
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {activeChatGroupId && (
        <div className="fixed inset-y-0 right-0 z-50">
          <GroupChat
            groupId={activeChatGroupId}
            onClose={() => setActiveChatGroupId(null)}
          />
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Create Study Group</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Group Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="schedule">Schedule (Optional)</Label>
                <Input
                  id="schedule"
                  value={formData.schedule}
                  onChange={(e) =>
                    setFormData({ ...formData, schedule: e.target.value })
                  }
                  placeholder="e.g., Every Monday at 2 PM"
                />
              </div>
              <div className="flex space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createGroupMutation.isPending}
                  className="flex-1"
                >
                  {createGroupMutation.isPending
                    ? "Creating..."
                    : "Create Group"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
