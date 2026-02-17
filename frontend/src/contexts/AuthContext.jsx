import { createContext, useState, useContext, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const data = await authApi.getMe();
      setUser(data.user);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setError(null);
      const data = await authApi.login(credentials);
      setUser(data.user);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Greide ikke logge inn';
      setError(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const data = await authApi.register(userData);
      return { success: true, message: data.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Greide ikke registrere';
      setError(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
      setUser(null);
      return { success: true };
    } catch (error) {
      console.error('Logg ut error:', error);
      // Clear user anyway
      setUser(null);
      return { success: true };
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const isApproved = user?.status === 'approved';

  const value = {
    user,
    setUser,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated,
    isAdmin,
    isApproved,
    checkAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
