import fs from 'fs';
import path from 'path';

interface SessionData {
  user: any;
  createdAt: number;
  lastAccessed: number;
}

class SessionManager {
  private sessions = new Map<string, SessionData>();
  private readonly SESSION_FILE = './sessions.json';
  private saveInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.loadSessions();
    this.startAutoSave();
    this.setupCleanup();
  }

  private loadSessions() {
    try {
      if (fs.existsSync(this.SESSION_FILE)) {
        const data = JSON.parse(fs.readFileSync(this.SESSION_FILE, 'utf8'));
        Object.entries(data).forEach(([sessionId, sessionData]) => {
          this.sessions.set(sessionId, sessionData as SessionData);
        });
        console.log(`Loaded ${this.sessions.size} existing sessions`);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  }

  private saveSessions() {
    try {
      const data = Object.fromEntries(this.sessions.entries());
      fs.writeFileSync(this.SESSION_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving sessions:', error);
    }
  }

  private startAutoSave() {
    this.saveInterval = setInterval(() => {
      this.saveSessions();
    }, 30000); // Save every 30 seconds
  }

  private setupCleanup() {
    // Clean up expired sessions (older than 24 hours)
    setInterval(() => {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      
      for (const [sessionId, sessionData] of this.sessions.entries()) {
        if (now - sessionData.lastAccessed > oneDay) {
          this.sessions.delete(sessionId);
        }
      }
    }, 60 * 60 * 1000); // Check every hour
  }

  createSession(user: any): string {
    const sessionId = Math.random().toString(36);
    const now = Date.now();
    
    this.sessions.set(sessionId, {
      user,
      createdAt: now,
      lastAccessed: now
    });
    
    return sessionId;
  }

  getSession(sessionId: string): any {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastAccessed = Date.now();
      return session.user;
    }
    return null;
  }

  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  cleanup() {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
    }
    this.saveSessions();
  }
}

export const sessionManager = new SessionManager();

// Handle process exit
process.on('SIGINT', () => {
  sessionManager.cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  sessionManager.cleanup();
  process.exit(0);
});
