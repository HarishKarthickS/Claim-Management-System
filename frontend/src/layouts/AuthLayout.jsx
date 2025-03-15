import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-primary">Aarogya Claims</h1>
            <p className="text-gray-600 mt-2">Insurance Claims Management</p>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout; 