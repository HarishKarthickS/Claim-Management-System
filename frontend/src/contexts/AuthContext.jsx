import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

// In development, use relative URLs to leverage Vite's proxy
// In production, use the absolute URL from environment variable
const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = isDevelopment ? '' : (import.meta.env.VITE_API_URL || '');

// Using environment variable or relative URLs to work with the Vite proxy
const api = axios.create({
  baseURL: apiUrl,  // Use API URL from environment
  withCredentials: true
});

// Add a request interceptor to include the token in all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to check if user is logged in
  const checkUserSession = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // If no token exists, consider user as not logged in
      if (!token) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }
      
      // Try to get user from local storage first
      const storedUserJSON = localStorage.getItem('currentUser');
      if (storedUserJSON) {
        try {
          const storedUser = JSON.parse(storedUserJSON);
          setCurrentUser(storedUser);
          setLoading(false);
          
          // Optional: Still verify with server in background
          api.get(`/api/auth/session`).catch(error => {
            console.warn('Session validation failed, user might need to login again:', error);
          });
          
          return;
        } catch (parseError) {
          console.error('Error parsing stored user:', parseError);
          // Continue with server validation if parsing fails
        }
      }
      
      // If no valid stored user, validate with server
      const response = await api.get(`/api/auth/session`);

      if (response.data && response.data.user) {
        setCurrentUser(response.data.user);
        // Update stored user data
        localStorage.setItem('currentUser', JSON.stringify(response.data.user));
      } else {
        // If the session check fails, remove the token
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        setCurrentUser(null);
      }
    } catch (error) {
      console.error("Session check error:", error);
      // If there's an authentication error, clear the token
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check user session on mount
    checkUserSession();
  }, []);

  const login = async (email, password) => {
    try {
      // Make the signin request
      const response = await api.post(
        `/api/auth/login`,
        { email, password },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.error) {
        toast.error(response.data.error);
        throw new Error(response.data.error);
      }

      // Store the token in localStorage
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }

      // Set the current user directly from the login response
      if (response.data.user) {
        setCurrentUser(response.data.user);
        // Also store user data in localStorage
        localStorage.setItem('currentUser', JSON.stringify(response.data.user));
        toast.success(`Welcome back!`);
        return response.data.user; // Return user from response directly
      }
      
      // If we don't have user data in response, fetch from session
      await checkUserSession();
      toast.success(`Welcome back!`);
      
      return currentUser;
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.response?.data?.message || 'Failed to login');
      throw error;
    }
  };

  const register = async (name, email, password, role = 'patient') => {
    try {
      const response = await api.post(
        `/api/auth/register`,
        { name, email, password, role }
      );

      if (response.data.error) {
        toast.error(response.data.error);
        throw new Error(response.data.error);
      }

      toast.success('Registration successful! Please log in.');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Registration failed';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      await api.post(`/api/auth/signout`, {});
      
      // Remove token and user data from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      
      setCurrentUser(null);
      toast.info('You have been logged out');
    } catch (error) {
      console.error("Logout error:", error);
      toast.error('Logout failed');
    }
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 