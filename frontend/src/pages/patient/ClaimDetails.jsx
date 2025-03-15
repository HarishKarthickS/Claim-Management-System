import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getClaim, getDocumentUrl } from '../../services/claimService';
import { toast } from 'react-hot-toast';

// Status badge component
const StatusBadge = ({ status }) => {
  const getStatusClasses = () => {
    switch (status) {
      case 'approved':
        return 'bg-success/10 text-success';
      case 'rejected':
        return 'bg-danger/10 text-danger';
      default:
        return 'bg-warning/10 text-warning';
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClasses()}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const ClaimDetails = () => {
  const { id } = useParams();
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchClaim = async () => {
      try {
        const claimData = await getClaim(id);
        setClaim(claimData);
      } catch (err) {
        setError('Failed to fetch claim details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchClaim();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !claim) {
    return (
      <div className="bg-danger/10 text-danger p-4 rounded-md">
        {error || 'Claim not found'}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Claim Details</h1>
        <Link to="/patient/dashboard" className="text-primary hover:underline">
          Back to Claims
        </Link>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold">Claim #{claim.id}</h2>
            <p className="text-gray-500 text-sm">
              Submitted on {new Date(claim.submissionDate).toLocaleDateString()}
            </p>
          </div>
          <StatusBadge status={claim.status} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Claim Amount</h3>
            <p className="text-lg font-semibold">${claim.claimAmount.toFixed(2)}</p>
          </div>

          {claim.status === 'approved' && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Approved Amount</h3>
              <p className="text-lg font-semibold text-success">${claim.approvedAmount.toFixed(2)}</p>
            </div>
          )}

          <div className="md:col-span-2">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
            <p className="text-gray-800">{claim.description}</p>
          </div>

          {claim.insurerComments && (
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Insurer Comments</h3>
              <div className="bg-white p-3 rounded border border-gray-200">
                <p className="text-gray-800">{claim.insurerComments}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {claim.documentUrl && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-3">Supporting Document</h3>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Attached Document</span>
              <a
                href={getDocumentUrl(claim._id)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm font-medium"
                onClick={(e) => {
                  if (!getDocumentUrl(claim._id)) {
                    e.preventDefault();
                    toast.error('Could not load document: Authentication required');
                  }
                }}
              >
                Open in New Tab
              </a>
            </div>
            <div className="p-4 bg-white">
              {claim.documentUrl.toLowerCase().endsWith('.pdf') ? (
                <div className="h-[600px] relative">
                  {!getDocumentUrl(claim._id) ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500">
                      <p>Authentication required to view document</p>
                    </div>
                  ) : (
                    <iframe
                      src={getDocumentUrl(claim._id)}
                      className="w-full h-full border-0"
                      title="Document Preview"
                      onError={(e) => {
                        console.error('Error loading document iframe:', e);
                        e.target.style.display = 'none';
                        e.target.parentNode.innerHTML += '<div class="p-4 text-red-500">Failed to load document. Please try opening in a new tab.</div>';
                      }}
                    />
                  )}
                </div>
              ) : (
                <div className="flex items-center">
                  <svg
                    className="h-8 w-8 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="ml-2 text-sm text-gray-700">
                    {claim.documentUrl.split('/').pop()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {claim.status === 'rejected' && (
        <div className="mt-8 bg-danger/5 border border-danger/20 rounded-lg p-4">
          <h3 className="text-danger font-medium mb-2">Claim Rejected</h3>
          <p className="text-gray-700">
            Your claim has been rejected. Please review the insurer's comments for more information.
          </p>
        </div>
      )}

      {claim.status === 'pending' && (
        <div className="mt-8 bg-warning/5 border border-warning/20 rounded-lg p-4">
          <h3 className="text-warning font-medium mb-2">Claim Under Review</h3>
          <p className="text-gray-700">
            Your claim is currently being reviewed by our team. We'll notify you once a decision has been made.
          </p>
        </div>
      )}
    </div>
  );
};

export default ClaimDetails; 