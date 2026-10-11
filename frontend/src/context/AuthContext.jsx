import React, { createContext, useContext, useState, useEffect } from 'react';
import API, { getAuthToken, clearAuthSession } from '../services/api';

const AuthContext = createContext();

const getStoredUser = () => {
  const saved = sessionStorage.getItem('eduquiz_user') || localStorage.getItem('eduquiz_user');
  try {
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const res = await API.get('/auth/me');
          setUser(res.data.data);
          sessionStorage.setItem('eduquiz_user', JSON.stringify(res.data.data));
          localStorage.setItem('eduquiz_user', JSON.stringify(res.data.data));
        } catch (error) {
          logout();
        }
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    const { token, ...userData } = res.data.data;
    // Set in tab-isolated sessionStorage so refreshing doesn't overwrite other tabs
    sessionStorage.setItem('eduquiz_token', token);
    sessionStorage.setItem('eduquiz_user', JSON.stringify(userData));
    // Also save in localStorage for persistence across new tabs
    localStorage.setItem('eduquiz_token', token);
    localStorage.setItem('eduquiz_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password, role) => {
    const res = await API.post('/auth/register', { name, email, password, role });
    const { token, ...userData } = res.data.data;
    sessionStorage.setItem('eduquiz_token', token);
    sessionStorage.setItem('eduquiz_user', JSON.stringify(userData));
    localStorage.setItem('eduquiz_token', token);
    localStorage.setItem('eduquiz_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    clearAuthSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
