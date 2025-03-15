import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = ({ role }) => {
  const { currentUser, loading } = useAuth();
  
  // If auth is still loading, show nothing (or could show a spinner)
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // If no user or wrong role, redirect to login
  if (!currentUser || currentUser.role !== role) {
    return <Navigate to="/login" replace />;
  }
  
  // Otherwise, render the protected route
  return <Outlet />;
};

export default PrivateRoute; 