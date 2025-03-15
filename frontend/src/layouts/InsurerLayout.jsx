import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const InsurerLayout = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary">Aarogya Claims</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Welcome, {currentUser?.name}
              </span>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-primary transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full md:w-64 shrink-0">
            <div className="bg-white rounded-lg shadow-card overflow-hidden">
              <div className="p-4 bg-secondary text-white">
                <h2 className="font-semibold text-lg">Insurer Dashboard</h2>
              </div>
              <nav className="p-4">
                <ul className="space-y-2">
                  <li>
                    <NavLink
                      to="/insurer/dashboard"
                      className={({ isActive }) =>
                        `block p-2 rounded-md transition-colors ${
                          isActive
                            ? 'bg-secondary/10 text-secondary font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`
                      }
                    >
                      Claims Dashboard
                    </NavLink>
                  </li>
                </ul>
              </nav>
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 bg-white rounded-lg shadow-card p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsurerLayout; 