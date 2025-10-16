import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Calendar, Circle, Plus, X } from "lucide-react";

interface StudyGroupsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function StudyGroupsModal({
  open,
  onOpenChange,
}: StudyGroupsModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    schedule: "",
  });

  const { data: studyGroups, isLoading } = useQuery({
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
        title: "Joined study group!",
        description: "You've successfully joined the study group.",
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

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Group name required",
        description: "Please enter a name for your study group.",
        variant: "destructive",
      });
      return;
    }

    createGroupMutation.mutate(formData);
  };

  const handleJoinGroup = (groupId: string) => {
    joinGroupMutation.mutate(groupId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-bold text-edu-text-primary">
            Study Groups
          </DialogTitle>
          <p className="text-edu-text-secondary mt-2">
            Join existing groups or create your own study community
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create Group Button/Form */}
          {!showCreateForm ? (
            <Button onClick={() => setShowCreateForm(true)} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Create New Study Group
            </Button>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-heading text-lg font-bold text-edu-text-primary">
                    Create Study Group
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowCreateForm(false);
                      resetForm();
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <form onSubmit={handleCreateGroup} className="space-y-4">
                  <div>
                    <Label htmlFor="groupName">Group Name *</Label>
                    <Input
                      id="groupName"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="e.g., React Study Circle"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="groupDescription">Description</Label>
                    <Textarea
                      id="groupDescription"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="What will your group focus on?"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="groupSchedule">Schedule</Label>
                    <Input
                      id="groupSchedule"
                      value={formData.schedule}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          schedule: e.target.value,
                        }))
                      }
                      placeholder="e.g., Mon, Wed 7PM"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setShowCreateForm(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={createGroupMutation.isPending}
                    >
                      {createGroupMutation.isPending
                        ? "Creating..."
                        : "Create Group"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Study Groups List */}
          <div>
            <h3 className="font-heading text-lg font-bold text-edu-text-primary mb-4">
              Available Study Groups
            </h3>

            <ScrollArea className="h-96">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-edu-text-secondary mt-2">
                    Loading study groups...
                  </p>
                </div>
              ) : (studyGroups as any[])?.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-edu-text-secondary">
                    No study groups available
                  </p>
                  <p className="text-sm text-edu-text-secondary mt-1">
                    Be the first to create a study group!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(studyGroups as any[])?.map((group: any) => (
                    <Card
                      key={group.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-heading text-lg font-bold text-edu-text-primary mb-2">
                              {group.name}
                            </h4>
                            <p className="text-edu-text-secondary text-sm mb-3">
                              {group.description || "No description available"}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-edu-text-secondary">
                              <span className="flex items-center space-x-1">
                                <Users className="h-4 w-4" />
                                <span>{group.memberCount || 0} members</span>
                              </span>
                              {group.schedule && (
                                <span className="flex items-center space-x-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{group.schedule}</span>
                                </span>
                              )}
                              <span className="flex items-center space-x-1">
                                <Circle
                                  className={`h-2 w-2 rounded-full ${
                                    group.onlineNow > 0
                                      ? "bg-green-500"
                                      : "bg-gray-400"
                                  }`}
                                />
                                <span>{group.onlineNow || 0} online now</span>
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {group.isActive && (
                              <Badge variant="secondary">Active</Badge>
                            )}
                            <Button
                              onClick={() => handleJoinGroup(group.id)}
                              variant="secondary"
                              disabled={joinGroupMutation.isPending}
                            >
                              {joinGroupMutation.isPending
                                ? "Joining..."
                                : "Join Group"}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
