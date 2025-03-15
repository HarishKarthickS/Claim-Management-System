import { useState } from 'react';
import { testBackendConnection, testAuthentication } from '../utils/apiTest';

/**
 * A component that tests the API connection between frontend and backend
 */
const ApiConnectionTest = () => {
  const [healthStatus, setHealthStatus] = useState(null);
  const [authStatus, setAuthStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const result = await testBackendConnection();
      setHealthStatus(result);
    } catch (error) {
      setHealthStatus({
        success: false,
        message: `Error: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = async () => {
    setLoading(true);
    try {
      const result = await testAuthentication();
      setAuthStatus(result);
    } catch (error) {
      setAuthStatus({
        success: false,
        message: `Error: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-card p-4 my-4">
      <h2 className="text-xl font-semibold mb-4">API Connection Test</h2>
      
      <div className="space-y-4">
        <div>
          <button 
            onClick={checkHealth}
            disabled={loading}
            className="btn btn-primary mr-2"
          >
            Test API Health
          </button>
          
          {healthStatus && (
            <div className={`mt-2 p-2 rounded ${healthStatus.success ? 'bg-success/10' : 'bg-danger/10'}`}>
              <p className={`font-medium ${healthStatus.success ? 'text-success' : 'text-danger'}`}>
                {healthStatus.success ? 'Connection Successful' : 'Connection Failed'}
              </p>
              <p className="text-sm">{healthStatus.message}</p>
              {healthStatus.data && (
                <pre className="text-xs bg-gray-100 p-2 mt-2 rounded overflow-auto">
                  {JSON.stringify(healthStatus.data, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
        
        <div>
          <button 
            onClick={checkAuth}
            disabled={loading}
            className="btn btn-secondary"
          >
            Test Authentication
          </button>
          
          {authStatus && (
            <div className={`mt-2 p-2 rounded ${authStatus.success ? 'bg-success/10' : 'bg-danger/10'}`}>
              <p className={`font-medium ${authStatus.success ? 'text-success' : 'text-danger'}`}>
                {authStatus.success ? 'Authentication Successful' : 'Authentication Failed'}
              </p>
              <p className="text-sm">{authStatus.message}</p>
              {authStatus.data && (
                <pre className="text-xs bg-gray-100 p-2 mt-2 rounded overflow-auto">
                  {JSON.stringify(authStatus.data, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiConnectionTest; 