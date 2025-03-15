import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClaim, updateClaim, getDocumentUrl } from '../../services/claimService';
import { toast } from 'react-toastify';

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
  const navigate = useNavigate();
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [approvedAmount, setApprovedAmount] = useState('');
  const [comments, setComments] = useState('');

  useEffect(() => {
    fetchClaimDetails();
  }, [id]);

  const fetchClaimDetails = async () => {
    try {
      setLoading(true);
      const claimData = await getClaim(id);
      setClaim(claimData);
      setApprovedAmount(claimData.claimAmount.toString());
    } catch (err) {
      setError('Failed to fetch claim details');
      console.error(err);
      toast.error('Failed to fetch claim details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      setProcessing(true);
      await updateClaim(id, {
        status: newStatus,
        approvedAmount: newStatus === 'approved' ? parseFloat(approvedAmount) : null,
        insurerComments: comments
      });
      toast.success(`Claim ${newStatus} successfully`);
      navigate('/insurer/dashboard');
    } catch (err) {
      console.error('Error updating claim:', err);
      toast.error('Failed to update claim status');
    } finally {
      setProcessing(false);
    }
  };

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Claim Details</h1>
        <button
          onClick={() => navigate('/insurer/dashboard')}
          className="text-gray-600 hover:text-gray-800"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Patient Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{claim.patient?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{claim.patient?.email}</p>
              </div>
            </div>
          </div>

          {/* Claim Details */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Claim Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Claim ID</p>
                <p className="font-medium">#{claim._id.slice(-6)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Submission Date</p>
                <p className="font-medium">
                  {new Date(claim.submissionDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Claim Amount</p>
                <p className="font-medium">₹{claim.claimAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  claim.status === 'approved' ? 'bg-success/10 text-success' :
                  claim.status === 'rejected' ? 'bg-danger/10 text-danger' :
                  'bg-warning/10 text-warning'
                }`}>
                  {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{claim.description}</p>
          </div>

          {/* Document */}
          {claim.documentUrl && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Supporting Document</h2>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Attached Document</span>
                  <a
                    href={getDocumentUrl(claim._id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary-dark text-sm font-medium"
                  >
                    Open in New Tab
                  </a>
                </div>
                <div className="p-4 bg-white">
                  {claim.documentUrl.toLowerCase().endsWith('.pdf') ? (
                    <iframe
                      src={getDocumentUrl(claim._id)}
                      className="w-full h-[600px] border-0"
                      title="Document Preview"
                    />
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

          {/* Claim Processing Form */}
          {claim.status === 'pending' && (
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Process Claim</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Approved Amount
                  </label>
                  <input
                    type="number"
                    value={approvedAmount}
                    onChange={(e) => setApprovedAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comments
                  </label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    rows="4"
                    placeholder="Add any comments about the claim decision..."
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleStatusUpdate('approved')}
                    disabled={processing}
                    className="btn btn-success"
                  >
                    Approve Claim
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('rejected')}
                    disabled={processing}
                    className="btn btn-danger"
                  >
                    Reject Claim
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Previous Processing Information */}
          {claim.status !== 'pending' && (
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Processing Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {claim.approvedAmount && (
                  <div>
                    <p className="text-sm text-gray-500">Approved Amount</p>
                    <p className="font-medium">₹{claim.approvedAmount.toFixed(2)}</p>
                  </div>
                )}
                {claim.insurerComments && (
                  <div>
                    <p className="text-sm text-gray-500">Comments</p>
                    <p className="font-medium whitespace-pre-wrap">{claim.insurerComments}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClaimDetails; 