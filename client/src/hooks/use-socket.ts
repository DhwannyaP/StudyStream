import { useEffect, useRef, useState } from "react";
import { getSocketManager } from "@/lib/socket";

export function useSocket() {
  const socketRef = useRef(getSocketManager());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = socketRef.current;

    const handleOpen = () => setIsConnected(true);
    const handleClose = () => setIsConnected(false);

    // Note: These event handlers are managed internally by SocketManager
    // This is just for tracking connection state in the component
    socket.on("room_joined", handleOpen);

    return () => {
      // Don't disconnect the socket when component unmounts
      // as it might be used by other components
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
  };
}

export function useCursorTracking(
  noteId: string,
  userId: string,
  enabled = true
) {
  const { socket } = useSocket();
  const [cursors, setCursors] = useState<Map<string, { x: number; y: number }>>(
    new Map()
  );
  const lastSentRef = useRef<number>(0);
  const throttleMs = 50; // reduce network spam

  useEffect(() => {
    if (!noteId || !userId) return;

    socket.joinRoom(noteId, userId);

    const handleCursorUpdate = (data: any) => {
      if (data.noteId === noteId && data.userId !== userId) {
        setCursors((prev) => new Map(prev.set(data.userId, data.position)));
      }
    };

    socket.on("cursor_update", handleCursorUpdate);

    const handleMouseMove = (e: MouseEvent) => {
      if (!enabled) return;
      const now = Date.now();
      if (now - lastSentRef.current < throttleMs) return;
      lastSentRef.current = now;
      const position = { x: e.clientX, y: e.clientY };
      socket.sendCursorMove(userId, position, noteId);
    };

    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      socket.off("cursor_update", handleCursorUpdate);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [noteId, userId, enabled, socket]);

  return cursors;
}

export function useCollaboration(noteId: string) {
  const { socket } = useSocket();
  const [highlights, setHighlights] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!noteId) return;

    socket.joinRoom(noteId);

    const handleHighlightAdded = (data: any) => {
      if (data.noteId === noteId) {
        setHighlights((prev) => [...prev, data.annotation]);
      }
    };

    const handleChatMessage = (data: any) => {
      if (data.message.noteId === noteId) {
        setMessages((prev) => [...prev, data.message]);
      }
    };

    socket.on("highlight_added", handleHighlightAdded);
    socket.on("chat_message", handleChatMessage);

    return () => {
      socket.off("highlight_added", handleHighlightAdded);
      socket.off("chat_message", handleChatMessage);
    };
  }, [noteId, socket]);

  const addHighlight = (annotation: any) => {
    socket.sendHighlight(annotation, noteId);
    setHighlights((prev) => [...prev, annotation]);
  };

  const sendMessage = (content: string, userId: string) => {
    socket.sendChatMessage(content, userId, noteId);
  };

  return {
    highlights,
    messages,
    addHighlight,
    sendMessage,
  };
}
