import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ApiConnectionTest from '../components/ApiConnectionTest';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showApiTest, setShowApiTest] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const user = await login(email, password);
      
      // Redirect based on user role - add null checks
      if (user && user.role === 'patient') {
        navigate('/patient/dashboard');
      } else if (user && user.role === 'insurer') {
        navigate('/insurer/dashboard');
      } else {
        // If user or role is missing, navigate to home
        console.warn('User or role missing after login:', user);
        navigate('/');
      }
    } catch (err) {
      setError('Failed to login. Please check your credentials.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
      
      {error && (
        <div className="bg-danger/10 text-danger p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            required
          />
        </div>
        
        <div>
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>
      </form>
      
      <div className="mt-6 text-center text-sm">
        <p className="text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary font-medium hover:underline">
            Register
          </Link>
        </p>
        
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <p className="text-gray-500 mb-2">Demo Accounts:</p>
          <div className="text-xs text-left space-y-1">
            <p><strong>Patient:</strong> patient@example.com / password</p>
            <p><strong>Insurer:</strong> insurer@example.com / password</p>
          </div>
        </div>
        
        {/* API Test Toggle Button */}
        <div className="mt-4">
          <button 
            onClick={() => setShowApiTest(!showApiTest)}
            className="text-xs text-primary underline"
          >
            {showApiTest ? 'Hide API Test' : 'Debug API Connection'}
          </button>
        </div>
        
        {/* API Connection Test Tool */}
        {showApiTest && <ApiConnectionTest />}
      </div>
    </div>
  );
};

export default Login; 