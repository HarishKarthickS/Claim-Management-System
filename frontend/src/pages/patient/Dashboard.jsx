import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getClaims } from '../../services/claimService';

// Status badge component
const StatusBadge = ({ status }) => {
  const getStatusClasses = () => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'approved':
        return (
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'rejected':
        return (
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <span className={`px-2.5 py-1.5 rounded-full text-xs font-medium border flex items-center w-fit ${getStatusClasses()}`}>
      {getStatusIcon()}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const Dashboard = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const claimsData = await getClaims(currentUser.role);
        setClaims(claimsData);
      } catch (err) {
        setError('Failed to fetch claims');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchClaims();
    }
  }, [currentUser]);

  // Calculate claim statistics
  const getClaimStats = () => {
    if (!claims.length) return { total: 0, approved: 0, rejected: 0, pending: 0 };
    
    return claims.reduce((stats, claim) => {
      stats.total += 1;
      stats[claim.status] += 1;
      return stats;
    }, { total: 0, approved: 0, rejected: 0, pending: 0 });
  };

  const claimStats = getClaimStats();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md">
        <div className="flex items-center">
          <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome, {currentUser?.name}</h1>
        <p className="opacity-90">Manage your health insurance claims in one place</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center">
          <div className="text-gray-500 text-sm uppercase font-semibold mb-1">Total Claims</div>
          <div className="text-3xl font-bold text-blue-600">{claimStats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center">
          <div className="text-gray-500 text-sm uppercase font-semibold mb-1">Approved</div>
          <div className="text-3xl font-bold text-green-600">{claimStats.approved}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center">
          <div className="text-gray-500 text-sm uppercase font-semibold mb-1">Pending</div>
          <div className="text-3xl font-bold text-yellow-600">{claimStats.pending}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center">
          <div className="text-gray-500 text-sm uppercase font-semibold mb-1">Rejected</div>
          <div className="text-3xl font-bold text-red-600">{claimStats.rejected}</div>
        </div>
      </div>

      {/* Claims Section Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">My Claims</h2>
        <Link 
          to="/patient/submit-claim" 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow flex items-center transition-all duration-200"
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Submit New Claim
        </Link>
      </div>

      {claims.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="mb-4">
            <svg className="h-16 w-16 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">No claims found</h3>
          <p className="text-gray-500 mb-6">Submit your first claim to get started</p>
          <Link 
            to="/patient/submit-claim" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow inline-flex items-center transition-all duration-200"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Submit New Claim
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Claim ID
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {claims.map((claim) => (
                  <tr key={claim._id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="py-4 px-4 whitespace-nowrap font-medium">
                      #{claim._id.slice(-6)}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm">
                      {new Date(claim.submissionDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap font-medium">
                      ₹{claim.claimAmount.toFixed(2)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-700 max-w-xs truncate">
                        {claim.description}
                      </div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <StatusBadge status={claim.status} />
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <Link
                        to={`/patient/claims/${claim._id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center transition-colors duration-150"
                      >
                        <span>View</span>
                        <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 