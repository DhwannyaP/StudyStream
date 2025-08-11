import { useState, useEffect } from 'react';
import { User } from '@shared/schema';

interface AuthState {
  user: User | null;
  sessionId: string | null;
  isLoading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    sessionId: localStorage.getItem('sessionId'),
    isLoading: true
  });

  useEffect(() => {
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${sessionId}`
        }
      })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(user => {
        setAuthState({
          user,
          sessionId,
          isLoading: false
        });
      })
      .catch(() => {
        localStorage.removeItem('sessionId');
        setAuthState({
          user: null,
          sessionId: null,
          isLoading: false
        });
      });
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const { user, sessionId } = await response.json();
    localStorage.setItem('sessionId', sessionId);
    setAuthState({ user, sessionId, isLoading: false });
    
    return user;
  };

  const register = async (userData: any) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const { user, sessionId } = await response.json();
    localStorage.setItem('sessionId', sessionId);
    setAuthState({ user, sessionId, isLoading: false });
    
    return user;
  };

  const logout = async () => {
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionId}`
          }
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    localStorage.removeItem('sessionId');
    setAuthState({ user: null, sessionId: null, isLoading: false });
  };

  return {
    user: authState.user,
    sessionId: authState.sessionId,
    isLoading: authState.isLoading,
    isAuthenticated: !!authState.user,
    login,
    register,
    logout
  };
}
