import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import * as claimService from '../../services/claimService';
import { toast } from 'react-toastify';
import { validateFile, formatFileSize } from '../../utils/fileHelper';

const SubmitClaim = () => {
  const [claimAmount, setClaimAmount] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileError, setFileError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Validate that we have a token and user data
    const token = localStorage.getItem('token');
    if (!token || !currentUser) {
      console.warn('No token or user data found on claim page load');
      setError('Please log in to submit a claim');
      setTimeout(() => {
        navigate('/login');
      }, 1000);
    }
  }, [currentUser, navigate]);
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFileError('');
    
    if (!selectedFile) {
      setFile(null);
      return;
    }
    
    console.log('Selected file type:', selectedFile.type);
    
    // Validate file using our utility function
    const validation = validateFile(selectedFile);
    
    if (!validation.valid) {
      setFileError(validation.error);
      return;
    }
    
    console.log('File selected:', {
      name: selectedFile.name,
      type: selectedFile.type,
      size: formatFileSize(selectedFile.size)
    });
    
    setFile(selectedFile);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset error state
    setError('');
    
    // Basic validation
    if (!file) {
      setError('Please upload a supporting document');
      return;
    }
    
    // Validate file again before submission
    const validation = validateFile(file);
    if (!validation.valid) {
      setFileError(validation.error);
      setError('Please check the file upload errors');
      return;
    }
    
    // Double check the file is still valid before submission
    console.log('Submitting with file:', {
      name: file.name,
      type: file.type,
      size: formatFileSize(file.size),
      lastModified: new Date(file.lastModified).toISOString()
    });
    
    if (!claimAmount || isNaN(parseFloat(claimAmount)) || parseFloat(claimAmount) <= 0) {
      setError('Please enter a valid claim amount');
      return;
    }
    
    if (!description) {
      setError('Please enter a description');
      return;
    }
    
    // Verify token before submission
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token missing. Please login again.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Current user data for the claim
      const claimData = {
        name: currentUser.name,
        email: currentUser.email,
        claimAmount,
        description
      };
      
      console.log('Submitting claim with data:', {
        ...claimData,
        fileIncluded: !!file,
        fileName: file?.name
      });
      
      const result = await claimService.createClaim(claimData, file);
      
      setSuccess(true);
      setError('');
      setClaimAmount('');
      setDescription('');
      setFile(null);
      
      // Navigate to my claims page after a delay
      setTimeout(() => {
        navigate('/patient/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Claim submission error:', error);
      
      // Error handling logic
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit claim';
      const errorDetails = error.response?.data?.details;
      
      // Handle file storage errors
      if (errorMessage.toLowerCase().includes('storage') || 
          (errorDetails && errorDetails.toLowerCase().includes('storage'))) {
        setError(`File storage error: ${errorMessage}. Please try a different file or contact support.`);
      }
      // Handle authentication errors  
      else if (errorMessage.toLowerCase().includes('please upload a document')) {
        setError('The document upload failed. Please select a different file and try again.');
      } else if (
        errorMessage.toLowerCase().includes('session') ||
        errorMessage.toLowerCase().includes('token') ||
        errorMessage.toLowerCase().includes('signature') ||
        errorMessage.toLowerCase().includes('authent')
      ) {
        setError('Authentication failed. Please login again.');
        // Clear token and redirect to login
        localStorage.removeItem('token');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        // Generic error
        setError(`Failed to submit claim: ${errorMessage}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Submit a New Claim</h1>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md mb-6 animate-pulse">
          <div className="flex items-center">
            <svg className="h-6 w-6 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-medium">{error}</p>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md shadow-md mb-6">
          <div className="flex items-center">
            <svg className="h-6 w-6 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="font-medium">Claim submitted successfully! Redirecting to your claims...</p>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-green-500 h-2.5 rounded-full animate-pulse" style={{ width: '100%' }}></div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        {/* Claim Amount */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="claimAmount">
            Claim Amount (₹)
          </label>
          <input
            type="number"
            id="claimAmount"
            value={claimAmount}
            onChange={(e) => setClaimAmount(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter claim amount"
            required
            disabled={isSubmitting}
          />
        </div>
        
        {/* Claim Description */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Describe your claim"
            rows="4"
            required
            disabled={isSubmitting}
          ></textarea>
        </div>
        
        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="document">
            Supporting Document
          </label>
          <input
            type="file"
            id="document"
            onChange={handleFileChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            required
            disabled={isSubmitting}
          />
          {file && (
            <p className="text-sm text-green-600 mt-1">
              File selected: {file.name}
            </p>
          )}
          {fileError && (
            <p className="text-sm text-red-600 mt-1">
              {fileError}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Accepted formats: PDF, DOC, DOCX, JPG, JPEG, PNG. Max size: 5MB.
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Claim'}
          </button>
          <button
            type="button"
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={() => navigate('/patient/dashboard')}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmitClaim; 