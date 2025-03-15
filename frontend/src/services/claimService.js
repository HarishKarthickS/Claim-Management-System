import axios from 'axios';

// In development, use relative URLs to leverage Vite's proxy
// In production, use the absolute URL from environment variable
const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = isDevelopment ? '' : (import.meta.env.VITE_API_URL || '');

// Initialize Axios instance with default configuration
const api = axios.create({
  baseURL: `${apiUrl}/api`,  // Using environment variable or relative URL
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies/auth
});

// Add request interceptor for authentication token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      // Ensure Authorization header is set consistently
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`
      };
      
      // Log request info for debugging (remove in production)
      console.log(`API Request to: ${config.url}`);
      console.log(`With auth token? ${!!token}`);
    } else {
      console.warn('No token available for request to:', config.url);
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response;
  }, 
  (error) => {
    // Handle authentication errors
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.error('Authentication error:', error.response.data);
      
      // If there's an invalid signature or token expired message
      if (error.response.data.message && 
          (error.response.data.message.includes('signature') || 
           error.response.data.message.includes('expired'))) {
        console.warn('Clearing invalid token');
        localStorage.removeItem('token');
      }
    }
    return Promise.reject(error);
  }
);

// Store for last polled timestamps and data
const dataCache = {
  claims: {
    data: null,
    lastPolled: null,
    expiryTime: 10000 // 10 seconds cache validity
  },
  singleClaim: {
    data: {},
    lastPolled: {},
    expiryTime: 5000 // 5 seconds cache validity for individual claims
  }
};

// Helper to check if cache is valid
const isCacheValid = (cacheKey, id = null) => {
  const cache = id ? dataCache.singleClaim : dataCache[cacheKey];
  const timestamp = id ? cache.lastPolled[id] : cache.lastPolled;
  const expiryTime = cache.expiryTime;
  
  if (!timestamp) return false;
  
  const now = Date.now();
  return (now - timestamp) < expiryTime;
};

// Get all claims (filtered by user role)
const getClaims = async (role, forceRefresh = false) => {
  try {
    // Check if we have cached data and it's not expired, unless force refresh is requested
    if (!forceRefresh && isCacheValid('claims') && dataCache.claims.data) {
      console.log('Using cached claims data');
      return dataCache.claims.data;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    // In the Next.js API, there's a single claims endpoint that filters based on the authenticated user
    let endpoint = '/claims';
    
    // Only add role parameter if provided 
    // (we're not doing server-side filtering anymore - just client-side)
    if (role) {
      const queryParams = new URLSearchParams();
      queryParams.append('role', role);
      endpoint = `${endpoint}?${queryParams.toString()}`;
    }
    
    console.log(`Fetching all claims from ${endpoint}`);
    
    const response = await api.get(endpoint);
    
    // Update cache
    dataCache.claims.data = response.data;
    dataCache.claims.lastPolled = Date.now();
    
    return response.data;
  } catch (error) {
    console.error('Error fetching claims:', error);
    // Extract the error message from the response if available
    const errorMessage = error.response?.data?.message || 'Failed to fetch claims';
    throw new Error(errorMessage);
  }
};

// Get a single claim by ID
const getClaim = async (claimId, forceRefresh = false) => {
  try {
    // Check cache for this specific claim
    if (!forceRefresh && isCacheValid('singleClaim', claimId) && dataCache.singleClaim.data[claimId]) {
      console.log(`Using cached data for claim ${claimId}`);
      return dataCache.singleClaim.data[claimId];
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    if (!claimId) {
      throw new Error('Claim ID is required');
    }
    
    console.log(`Fetching claim ${claimId} with auth token? ${!!token}`);
    
    const response = await api.get(`/claims/${claimId}`);
    
    // Update cache for this specific claim
    dataCache.singleClaim.data[claimId] = response.data;
    dataCache.singleClaim.lastPolled[claimId] = Date.now();
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching claim ${claimId}:`, error);
    // Enhanced error message with more details from the response
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch claim details';
    throw new Error(errorMessage);
  }
};

// Create a new claim
const createClaim = async (claimData, file) => {
  try {
    // Auth check
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found. Please log in again.");
    }

    // Create FormData object
    const formData = new FormData();
    
    // Log for debugging
    console.log('Creating claim with data:', { 
      claimAmount: claimData.claimAmount,
      description: claimData.description,
      hasFile: !!file
    });
    
    // Get current user data from localStorage
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
      throw new Error("User data not found. Please log in again.");
    }
    
    console.log('User data for claim:', {
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role
    });
    
    // Append claim data with the correct field names expected by backend
    formData.append("name", currentUser.name || "User");
    formData.append("email", currentUser.email || "");
    formData.append("claimAmount", claimData.claimAmount);
    formData.append("description", claimData.description);
    
    // Handle file upload
    if (file) {
      console.log('Attaching file:', {
        name: file.name,
        type: file.type,
        size: file.size
      });
      formData.append("document", file, file.name);
    } else {
      console.warn('No file attached to claim');
    }
    
    // Log FormData entries for debugging
    for (const pair of formData.entries()) {
      console.log(`FormData contains: ${pair[0]}: ${pair[1]}`);
    }

    // Use the same apiUrl logic for consistency
    const response = await axios.post(`${apiUrl}/api/claims`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        // Let the browser set the content-type with boundary parameter
      }
    });
    
    // Invalidate cache to ensure fresh data on next fetch
    dataCache.claims.lastPolled = null;
    
    console.log('Claim submission successful:', response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating claim:", error.response?.data || error.message);
    throw error;
  }
};

// Update a claim (for insurers to approve/reject)
const updateClaim = async (claimId, updateData) => {
  try {
    // Validate inputs
    if (!claimId) {
      throw new Error('Claim ID is required for updates');
    }
    
    if (!updateData || Object.keys(updateData).length === 0) {
      throw new Error('Update data is required');
    }
    
    console.log(`Updating claim ${claimId} with data:`, updateData);
    
    const response = await api.patch(`/claims/${claimId}/status`, updateData);
    
    // Invalidate both caches to ensure fresh data on next fetch
    dataCache.claims.lastPolled = null;
    if (dataCache.singleClaim.data[claimId]) {
      dataCache.singleClaim.lastPolled[claimId] = null;
    }
    
    console.log('Claim update successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating claim:', error);
    // Enhanced error message with more details
    const errorMessage = error.response?.data?.message || error.message || 'Failed to update claim';
    throw new Error(errorMessage);
  }
};

// Delete a claim
const deleteClaim = async (claimId) => {
  try {
    if (!claimId) {
      throw new Error('Claim ID is required for deletion');
    }
    
    console.log(`Deleting claim ${claimId}`);
    
    const response = await api.delete(`/claims/${claimId}`);
    
    // Invalidate cache
    dataCache.claims.lastPolled = null;
    if (dataCache.singleClaim.data[claimId]) {
      delete dataCache.singleClaim.data[claimId];
      delete dataCache.singleClaim.lastPolled[claimId];
    }
    
    console.log('Claim deleted successfully');
    return response.data;
  } catch (error) {
    console.error('Error deleting claim:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to delete claim';
    throw new Error(errorMessage);
  }
};

// Helper function to get authenticated document URL
const getDocumentUrl = (claimId) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.error('No authentication token found for document access');
    return null;
  }
  
  // Add debugging logs
  console.log(`Generating document URL for claim: ${claimId}`);
  
  // Make sure claimId is valid
  if (!claimId) {
    console.error('Invalid claim ID for document URL');
    return null;
  }
  
  // Construct the full URL to the document endpoint
  const documentUrl = `/api/claims/${claimId}/document?token=${encodeURIComponent(token)}`;
  console.log('Document URL:', documentUrl);
  
  return documentUrl;
};

// Check if data needs to be refreshed (has changed since last poll)
const hasDataChanged = (newData, oldData) => {
  if (!oldData) return true;
  
  // For arrays (like claims list), compare lengths and last updated timestamps
  if (Array.isArray(newData) && Array.isArray(oldData)) {
    if (newData.length !== oldData.length) return true;
    
    // Check if any claim in the new data has a newer lastUpdated timestamp
    for (const newClaim of newData) {
      const oldClaim = oldData.find(claim => claim._id === newClaim._id);
      if (!oldClaim) return true;
      
      const newLastUpdated = new Date(newClaim.lastUpdated).getTime();
      const oldLastUpdated = new Date(oldClaim.lastUpdated).getTime();
      
      if (newLastUpdated > oldLastUpdated) return true;
    }
    return false;
  }
  
  // For single objects (like a claim), compare lastUpdated timestamps
  if (newData._id && oldData._id && newData._id === oldData._id) {
    const newLastUpdated = new Date(newData.lastUpdated).getTime();
    const oldLastUpdated = new Date(oldData.lastUpdated).getTime();
    return newLastUpdated > oldLastUpdated;
  }
  
  // Default to true if we can't determine
  return true;
};

// Manually refresh all claim data in cache
const refreshClaimData = async () => {
  console.log('Manually refreshing all claim data');
  
  // Clear cache
  dataCache.claims.lastPolled = null;
  dataCache.claims.data = null;
  dataCache.singleClaim.data = {};
  dataCache.singleClaim.lastPolled = {};
  
  // Re-fetch claims list
  try {
    await getClaims(null, {}, true);
    return true;
  } catch (error) {
    console.error('Error refreshing claim data:', error);
    return false;
  }
};

export { 
  getClaims, 
  getClaim, 
  createClaim, 
  updateClaim,
  deleteClaim,
  getDocumentUrl, 
  refreshClaimData,
  hasDataChanged
}; 