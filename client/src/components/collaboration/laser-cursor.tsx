import { useEffect, useState } from "react";

interface LaserCursorProps {
  userId: string;
  position: { x: number; y: number };
  color: string;
  userName?: string;
}

export default function LaserCursor({ userId, position, color, userName }: LaserCursorProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastMoveTime, setLastMoveTime] = useState(Date.now());

  useEffect(() => {
    setLastMoveTime(Date.now());
    setIsVisible(true);

    // Hide cursor after 3 seconds of inactivity
    const timeout = setTimeout(() => {
      setIsVisible(false);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [position]);

  if (!isVisible) return null;

  return (
    <div
      className="laser-cursor fixed pointer-events-none z-50 transition-all duration-100 ease-out"
      style={{
        left: position.x - 6,
        top: position.y - 6,
        backgroundColor: color,
        opacity: 0.8,
      }}
    >
      {/* Cursor dot */}
      <div
        className="w-3 h-3 rounded-full shadow-lg"
        style={{ backgroundColor: color }}
      />
      
      {/* User name label */}
      {userName && (
        <div
          className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 rounded text-xs text-white whitespace-nowrap shadow-lg"
          style={{ backgroundColor: color }}
        >
          {userName}
        </div>
      )}
      
      {/* Trailing effect */}
      <div
        className="absolute inset-0 rounded-full animate-ping"
        style={{ backgroundColor: color, opacity: 0.3 }}
      />
    </div>
  );
}
