import React, { useState } from "react";
import { Bell, Check, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  isRead: boolean;
  relatedId?: string | null;
  relatedType?: string | null;
  createdAt: string;
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const response = await fetch("/api/notifications", {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("sessionId"),
        },
      });
      if (!response.ok) throw new Error("Failed to fetch notifications");
      return response.json();
    },
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["/api/notifications/unread-count"],
    queryFn: async () => {
      const response = await fetch("/api/notifications/unread-count", {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("sessionId"),
        },
      });
      if (!response.ok) throw new Error("Failed to fetch unread count");
      const data = await response.json();
      return data.count;
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const url = "/api/notifications/" + notificationId + "/read";
      await apiRequest("POST", url, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/notifications/unread-count"],
      });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/notifications/read-all", undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/notifications/unread-count"],
      });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const url = "/api/notifications/" + notificationId;
      await apiRequest("DELETE", url, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/notifications/unread-count"],
      });
    },
  });

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDelete = (notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return "✅";
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      default:
        return "ℹ️";
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return diffInMinutes + "m ago";
    if (diffInMinutes < 1440) return Math.floor(diffInMinutes / 60) + "h ago";
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-accent text-white text-xs">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    disabled={markAllAsReadMutation.isPending}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <ScrollArea className="h-96">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              <div className="p-2">
                {notifications.map((notification: Notification) => (
                  <Card
                    key={notification.id}
                    className={cn(
                      "mb-2 cursor-pointer transition-colors",
                      notification.isRead
                        ? "bg-gray-50"
                        : "bg-blue-50 border-blue-200"
                    )}
                    onClick={() =>
                      !notification.isRead && handleMarkAsRead(notification.id)
                    }
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-lg">
                              {getNotificationIcon(notification.type)}
                            </span>
                            <h4
                              className={cn(
                                "font-medium text-sm",
                                notification.isRead
                                  ? "text-gray-600"
                                  : "text-gray-900"
                              )}
                            >
                              {notification.title}
                            </h4>
                          </div>
                          <p
                            className={cn(
                              "text-sm",
                              notification.isRead
                                ? "text-gray-500"
                                : "text-gray-700"
                            )}
                          >
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                            disabled={notification.isRead}
                            className="h-6 w-6 p-0"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(notification.id);
                            }}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
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
      )}
    </div>
  );
}


