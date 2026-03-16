import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/auth';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Charger l'utilisateur au démarrage
    const user = authService.getUser();
    setUser(user);
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const success = await authService.login(email, password);
    if (success) {
      setUser(authService.getUser());
    }
    return success;
  };

  const register = async (name: string, email: string, password: string) => {
    const success = await authService.register(name, email, password);
    if (success) {
      setUser(authService.getUser());
    }
    return success;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: authService.isAuthenticated(),
      isAdmin: authService.isAdmin(),
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};