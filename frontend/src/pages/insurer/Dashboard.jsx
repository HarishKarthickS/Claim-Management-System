import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getClaims, updateClaim } from '../../services/claimService';
import { toast } from 'react-toastify';

// Status badge component
const StatusBadge = ({ status }) => {
  const getStatusClasses = () => {
    switch (status) {
      case 'approved':
        return 'bg-success/10 text-success';
      case 'rejected':
        return 'bg-danger/10 text-danger';
      case 'pending':
        return 'bg-warning/10 text-warning';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClasses()}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Statistics Card Component
const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-semibold mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

// Function to sort claims based on sort criteria
const sortClaims = (claims, sortBy, sortOrder) => {
  return [...claims].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'id':
        comparison = a._id.localeCompare(b._id);
        break;
      case 'patient':
        comparison = (a.patient?.name || '').localeCompare(b.patient?.name || '');
        break;
      case 'date':
        comparison = new Date(a.submissionDate) - new Date(b.submissionDate);
        break;
      case 'amount':
        comparison = a.claimAmount - b.claimAmount;
        break;
      case 'status':
        comparison = (a.status || '').localeCompare(b.status || '');
        break;
      default:
        comparison = new Date(b.submissionDate) - new Date(a.submissionDate); // Default sort by date desc
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });
};

// Confirmation Dialog Component
const ConfirmationDialog = ({ isOpen, action, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  
  const title = action === 'approved' ? 'Approve Claim' : 'Reject Claim';
  const message = action === 'approved' 
    ? 'Are you sure you want to approve this claim? This action cannot be undone.'
    : 'Are you sure you want to reject this claim? This action cannot be undone.';
  const confirmBtnClass = action === 'approved' 
    ? 'bg-green-600 hover:bg-green-700'
    : 'bg-red-600 hover:bg-red-700';
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
        <h3 className="text-lg font-bold mb-4">{title}</h3>
        <p className="mb-6 text-gray-700">{message}</p>
        <div className="flex justify-end space-x-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-md ${confirmBtnClass} transition-colors`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    claimId: null,
    action: null,
    amount: null
  });
  const [filters, setFilters] = useState({
    status: '',
    minAmount: '',
    maxAmount: '',
    searchTerm: '',
    dateRange: 'all',
    sortBy: 'date',
    sortOrder: 'desc'
  });
  const [stats, setStats] = useState({
    totalClaims: 0,
    pendingClaims: 0,
    totalAmount: 0,
    approvedAmount: 0
  });
  // currentUser is used for role-based UI in other components
  // eslint-disable-next-line no-unused-vars
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchClaims();
  }, [filters]);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      
      // Fetch all claims without filtering at the API level
      console.log('Fetching all claims');
      const claimsData = await getClaims('insurer', {});
      
      // Store all claims in state - filtering will be done at render time
      setClaims(claimsData);
      console.log(claimsData);
      
      // Calculate statistics based on all claims
      setStats({
        totalClaims: claimsData.length,
        pendingClaims: claimsData.filter(claim => claim.status === 'pending').length,
        totalAmount: claimsData.reduce((sum, claim) => sum + claim.claimAmount, 0),
        approvedAmount: claimsData.reduce((sum, claim) => sum + (claim.approvedAmount || 0), 0)
      });
    } catch (err) {
      setErrorMessage('Failed to fetch claims');
      console.error(err);
      toast.error('Failed to fetch claims');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (claimId, newStatus, approvedAmount = null) => {
    if (newStatus === 'approved' || newStatus === 'rejected') {
      // Open confirmation dialog instead of immediately updating
      setConfirmDialog({
        isOpen: true,
        claimId,
        action: newStatus,
        amount: approvedAmount
      });
    }
  };
  
  // Handle confirmed status update
  const handleConfirmedUpdate = async () => {
    try {
      const { claimId, action, amount } = confirmDialog;
      
      await updateClaim(claimId, {
        status: action,
        approvedAmount: amount
      });
      
      toast.success(`Claim ${action} successfully`);
      fetchClaims(); // Refresh the claims list
      
      // Close the dialog
      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    } catch (err) {
      console.error('Error updating claim:', err);
      toast.error('Failed to update claim status');
    }
  };
  
  // Close confirmation dialog
  const closeConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSort = (sortBy) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredClaims = claims.filter(claim => {
    // Apply status filter
    if (filters.status && claim.status !== filters.status) {
      return false;
    }
    
    // Apply amount filters
    if (filters.minAmount && claim.claimAmount < parseFloat(filters.minAmount)) {
      return false;
    }
    
    if (filters.maxAmount && claim.claimAmount > parseFloat(filters.maxAmount)) {
      return false;
    }
    
    // Apply date range filter
    if (filters.dateRange && filters.dateRange !== 'all') {
      const claimDate = new Date(claim.submissionDate);
      const now = new Date();
      let startDate;
      
      switch (filters.dateRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          if (claimDate < startDate) return false;
          break;
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          if (claimDate < startDate) return false;
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          if (claimDate < startDate) return false;
          break;
        case 'year':
          startDate = new Date(now);
          startDate.setFullYear(now.getFullYear() - 1);
          if (claimDate < startDate) return false;
          break;
        default:
          // 'all' - no date filters
          break;
      }
    }
    
    // Apply search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      return (
        claim.name?.toLowerCase().includes(searchLower) ||
        claim.email?.toLowerCase().includes(searchLower) ||
        claim.description?.toLowerCase().includes(searchLower) ||
        claim._id.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  // Apply sorting to filtered claims
  const sortedAndFilteredClaims = sortClaims(filteredClaims, filters.sortBy, filters.sortOrder);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Claims Management</h1>
        <div className="flex gap-4">
          <div className="relative">
            <input
              type="text"
              name="searchTerm"
              value={filters.searchTerm}
              onChange={handleFilterChange}
              placeholder="Search claims..."
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Display Error Message if any */}
      {errorMessage && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md mb-6">
          <div className="flex items-center">
            <svg className="h-6 w-6 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-medium">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Claims"
          value={stats.totalClaims}
          icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
          color="bg-primary"
        />
        <StatCard
          title="Pending Claims"
          value={stats.pendingClaims}
          icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          color="bg-warning"
        />
        <StatCard
          title="Total Amount"
          value={`₹${stats.totalAmount.toFixed(2)}`}
          icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          color="bg-success"
        />
        <StatCard
          title="Approved Amount"
          value={`₹${stats.approvedAmount.toFixed(2)}`}
          icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          color="bg-info"
        />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              name="dateRange"
              value={filters.dateRange}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount</label>
            <input
              type="number"
              name="minAmount"
              value={filters.minAmount}
              onChange={handleFilterChange}
              placeholder="Min amount"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount</label>
            <input
              type="number"
              name="maxAmount"
              value={filters.maxAmount}
              onChange={handleFilterChange}
              placeholder="Max amount"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Claims Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('id')}
                >
                  Claim ID {filters.sortBy === 'id' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('patient')}
                >
                  Patient {filters.sortBy === 'patient' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('date')}
                >
                  Date {filters.sortBy === 'date' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('amount')}
                >
                  Amount {filters.sortBy === 'amount' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  Status {filters.sortBy === 'status' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedAndFilteredClaims.map((claim) => (
                <tr key={claim._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      #{claim._id.slice(-6)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{claim.name}</div>
                    <div className="text-sm text-gray-500">{claim.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(claim.submissionDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                    ₹{claim.claimAmount.toFixed(2)}
                    </div>
                    {claim.approvedAmount && (
                      <div className="text-sm text-success">
                        Approved: ₹{claim.approvedAmount.toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={claim.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Link
                      to={`/insurer/claims/${claim._id}`}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors duration-200"
                      title="View claim details"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </Link>
                    {claim.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(claim._id, 'approved', claim.claimAmount)}
                          className="inline-flex items-center px-3 py-1 mr-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors duration-200"
                          title="Approve this claim"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Approve
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(claim._id, 'rejected')}
                          className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors duration-200"
                          title="Reject this claim"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {sortedAndFilteredClaims.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg">
          <h3 className="text-lg font-medium text-gray-900">No claims found</h3>
          <p className="mt-2 text-sm text-gray-500">
            Try adjusting your filters to see more results
          </p>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        action={confirmDialog.action}
        onConfirm={handleConfirmedUpdate}
        onCancel={closeConfirmDialog}
      />
    </div>
  );
};

export default Dashboard; 