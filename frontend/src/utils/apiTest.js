/**
 * Utility to test the connection with the backend API
 * This is used for development purposes to check if the integration is working
 */

import axios from 'axios';

/**
 * Tests the connection to the backend API
 * @returns {Promise<{success: boolean, message: string}>} Status of the connection test
 */
export const testBackendConnection = async () => {
  try {
    // Try to connect to the API health endpoint
    const response = await axios.get('/api/health', {
      timeout: 5000, // 5 second timeout
    });
    
    if (response.status === 200) {
      console.log('Backend connection successful:', response.data);
      return {
        success: true,
        message: 'Successfully connected to the backend API',
        data: response.data
      };
    } else {
      console.warn('Backend connection response not OK:', response.status);
      return {
        success: false,
        message: `Backend returned status: ${response.status}`,
      };
    }
  } catch (error) {
    console.error('Backend connection test failed:', error);
    return {
      success: false,
      message: `Failed to connect to backend: ${error.message}`,
      error
    };
  }
};

/**
 * Tests authentication with the backend
 * @param {Object} credentials User credentials
 * @returns {Promise<{success: boolean, message: string}>} Result of auth test
 */
export const testAuthentication = async (credentials = null) => {
  try {
    // If no credentials provided, try to use token in localStorage first
    const existingToken = localStorage.getItem('token');
    
    if (existingToken) {
      try {
        // Try to access a protected endpoint with existing token
        const tokenCheckResponse = await axios.get('/api/auth/session', {
          headers: {
            'Authorization': `Bearer ${existingToken}`
          }
        });
        
        return {
          success: true,
          message: 'Authentication test successful - existing token works',
          data: {
            sessionData: tokenCheckResponse.data
          }
        };
      } catch (tokenError) {
        console.warn('Existing token test failed, will try login:', tokenError.message);
        // Continue to login flow if token check failed
      }
    }
    
    // If no token or token failed, try login
    if (!credentials) {
      // These should be updated with valid test credentials
      credentials = { 
        email: 'test@example.com', 
        password: 'password123' 
      };
    }
    
    // Try the login endpoint
    const response = await axios.post('/api/auth/login', credentials, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data && response.data.token) {
      // Store the token
      localStorage.setItem('token', response.data.token);
      
      // If we have a token, try to access a protected endpoint with it
      try {
        const tokenCheckResponse = await axios.get('/api/claims', {
          headers: {
            'Authorization': `Bearer ${response.data.token}`
          }
        });
        
        return {
          success: true,
          message: 'Authentication test successful - login and token access work',
          data: {
            loginResponse: response.data,
            protectedEndpointTest: tokenCheckResponse.data
          }
        };
      } catch (protectedError) {
        // We got a token but protected endpoint failed
        return {
          success: false,
          message: `Login successful but protected endpoint access failed: ${protectedError.response?.data?.message || protectedError.message}`,
          partialSuccess: true,
          data: {
            loginResponse: response.data
          },
          error: protectedError
        };
      }
    }
    
    return {
      success: true,
      message: 'Authentication test successful',
      data: response.data
    };
  } catch (error) {
    console.error('Authentication test failed:', error);
    return {
      success: false,
      message: `Authentication failed: ${error.response?.data?.message || error.message}`,
      error
    };
  }
}; 