import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import { useAuth } from '../../contexts/AuthContext';
import { useRealtime } from '../../contexts/RealtimeContext';
import { getCardholders, getStatusColor, deleteCardholder, updateCardholderStatus } from '../../utils/cardholderApi';
import { hasPermission, PERMISSIONS } from '../../utils/permissions';
import { formatAmount } from '../../utils/transactionApi';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit3, 
  Trash2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  User,
  CreditCard,
  FileText,
  AlertTriangle
} from 'lucide-react';

const Cardholders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trackActivity, trackViewing, startEditing, userActivity } = useRealtime();
  const [cardholders, setCardholders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCardholder, setSelectedCardholder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({});

  // Load cardholders from API
  useEffect(() => {
    loadCardholders();
  }, [searchTerm, filterStatus]);


  // Track cardholders page viewing
  useEffect(() => {
    if (trackViewing && trackActivity) {
      try {
        trackViewing('cardholders', 'list', 'viewing');
        trackActivity('cardholders', 'viewed', 'list', {
          searchTerm,
          filterStatus
        });
      } catch (error) {
        console.error('Error tracking activity:', error);
      }
    }
  }, [trackViewing, trackActivity, searchTerm, filterStatus]);

  const loadCardholders = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await getCardholders({
        search: searchTerm,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        page: 1,
        limit: 50
      });
      
      if (response.success) {
        const cardholdersData = response.data || [];
        console.log('Cardholders loaded:', cardholdersData.length);
        console.log('Outstanding amounts:', cardholdersData.map(c => ({ 
          name: c.name, 
          outstanding: c.totalOutstanding || c.outstandingAmount,
          currency: c.currency || 'USD',
          banks: c.cardCount || 0
        })));
        console.log('Stats from backend:', response.stats);
        console.log('Total outstanding from backend:', response.stats?.totalOutstanding);
        setCardholders(cardholdersData);
        setStats(response.stats || {});
      } else {
        setError(response.message || 'Failed to load cardholders');
      }
    } catch (error) {
      console.error('Error loading cardholders:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load cardholders');
    } finally {
      setIsLoading(false);
    }
  };

  // Use cardholders directly since filtering is done by API
  const filteredCardholders = cardholders;

  const handleAddCardholder = () => {
    try {
      if (trackActivity) {
        trackActivity('cardholders', 'navigated', 'add', {
          cardholderName: 'New Cardholder'
        });
      }
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
    navigate('/cardholders/add');
  };

  const handleViewCardholder = (cardholder) => {
    try {
      if (trackActivity) {
        trackActivity('cardholders', 'viewed', cardholder._id || cardholder.id, {
          cardholderName: cardholder.name,
          cardholderEmail: cardholder.email
        });
      }
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
    navigate(`/cardholders/${cardholder._id || cardholder.id}`);
  };

  const handleEditCardholder = (cardholder) => {
    const cardholderId = cardholder._id || cardholder.id;
    
    // Track editing activity
    try {
      if (startEditing) {
        startEditing('cardholder', cardholderId);
      }
      if (trackActivity) {
        trackActivity('cardholders', 'navigated', 'edit', {
          cardholderName: cardholder.name,
          cardholderEmail: cardholder.email
        });
      }
    } catch (error) {
      console.error('Error tracking edit activity:', error);
    }
    navigate(`/cardholders/${cardholderId}/edit`);
  };

  const handleDeleteCardholder = async (cardholder) => {
    if (window.confirm(`Are you sure you want to delete ${cardholder.name || 'this cardholder'}?`)) {
      try {
        if (trackActivity) {
          trackActivity('cardholders', 'deleted', cardholder._id || cardholder.id, {
            cardholderName: cardholder.name,
            cardholderEmail: cardholder.email
          });
        }
        const response = await deleteCardholder(cardholder._id || cardholder.id);
        if (response.success) {
          loadCardholders();
        } else {
          setError(response.message || 'Failed to delete cardholder');
        }
      } catch (error) {
        console.error('Error deleting cardholder:', error);
        setError(error.response?.data?.message || 'Failed to delete cardholder');
      }
    }
  };

  const handleStatusChange = async (cardholder, newStatus) => {
    try {
      if (trackActivity) {
        trackActivity('cardholders', 'status_updated', cardholder._id || cardholder.id, {
          cardholderName: cardholder.name,
          oldStatus: cardholder.status,
          newStatus
        });
      }
      const response = await updateCardholderStatus(cardholder._id || cardholder.id, newStatus);
      if (response.success) {
        loadCardholders(); // Reload to get updated status
      } else {
        setError(response.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setError(error.response?.data?.message || 'Failed to update status');
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
                  <Users className="w-10 h-10 mr-3 text-blue-600" />
                  Cardholders
                </h1>
                <p className="text-lg text-gray-600">
                  Manage cardholder details, statements, and bank data
                </p>
                {/* Real-time Activity Indicator - Admin Only */}
                {user?.role === 'admin' && (
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    <span>Live updates enabled</span>
                    {userActivity && Array.isArray(userActivity) && userActivity.filter(activity => activity.resource === 'cardholders').length > 0 && (
                      <span className="ml-4 text-blue-600">
                        {userActivity.filter(activity => activity.resource === 'cardholders').length} recent activities
                      </span>
                    )}
                  </div>
                )}
              </div>
              {hasPermission(PERMISSIONS.CREATE_CARDHOLDERS, user) && (
                <button
                  onClick={handleAddCardholder}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Cardholder
                </button>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              <span>{error}</span>
              <button
                onClick={() => setError('')}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-lg text-gray-700">Loading cardholders...</span>
            </div>
          )}

          {/* Main Content - Only show when not loading */}
          {!isLoading && (
            <>
              {/* Search and Filter Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
                <button className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  More Filters
                </button>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Cardholders</p>
                  <p className="text-3xl font-bold text-gray-900">{cardholders.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-3xl font-bold text-green-600">
                    {cardholders.filter(c => c.status === 'active').length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {cardholders.filter(c => c.status === 'pending').length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Outstanding</p>
                  <p className="text-3xl font-bold text-red-600">
                    {(() => {
                      // Use backend calculated total if available, otherwise calculate from cardholders
                      const backendTotal = stats?.totalOutstanding;
                      const calculatedTotal = cardholders.reduce((sum, c) => sum + (c.totalOutstanding || c.outstandingAmount || 0), 0);
                      const totalOutstanding = backendTotal !== undefined ? backendTotal : calculatedTotal;
                      
                      // Detect currency - use INR if any cardholder has INR, otherwise USD
                      const currencies = cardholders
                        .map(c => c.currency || 'USD')
                        .filter((c, i, arr) => arr.indexOf(c) === i); // unique currencies
                      const currency = currencies.includes('INR') ? 'INR' : (currencies[0] || 'USD');
                      
                      console.log('Total Outstanding calculation:', {
                        backendTotal,
                        calculatedTotal,
                        finalTotal: totalOutstanding,
                        currency,
                        cardholdersCount: cardholders.length
                      });
                      
                      return formatAmount(totalOutstanding, currency);
                    })()}
                  </p>
                </div>
                <CreditCard className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>

          {/* Cardholders Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Cardholder List</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cardholder
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cards
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Outstanding
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Statement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCardholders.map((cardholder, index) => (
                    <tr key={cardholder._id || cardholder.id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                            {(cardholder.name || 'N/A').split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{cardholder.name || 'N/A'}</div>
                            <div className="text-sm text-gray-500">ID: {cardholder._id || cardholder.id || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{cardholder.email || 'N/A'}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {cardholder.phone || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {hasPermission(PERMISSIONS.EDIT_CARDHOLDERS, user) ? (
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              cardholder.status === 'active' ? 'bg-green-500' : 
                              cardholder.status === 'pending' ? 'bg-yellow-500' : 
                              cardholder.status === 'suspended' ? 'bg-red-500' :
                              'bg-gray-400'
                            }`}></div>
                            <select
                              value={cardholder.status || 'pending'}
                              onChange={(e) => handleStatusChange(cardholder, e.target.value)}
                              className={`text-xs font-semibold rounded-md px-2 py-1 border border-gray-300 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${getStatusColor(cardholder.status)}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="pending">Pending</option>
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                              <option value="suspended">Suspended</option>
                            </select>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              cardholder.status === 'active' ? 'bg-green-500' : 
                              cardholder.status === 'pending' ? 'bg-yellow-500' : 
                              'bg-gray-400'
                            }`}></div>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(cardholder.status)}`}>
                              {cardholder.status || 'pending'}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {cardholder.cardCount || cardholder.banks?.length || cardholder.cardsCount || 0} cards
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(() => {
                          const outstanding = cardholder.totalOutstanding || cardholder.outstandingAmount || 0;
                          // Try to detect currency from cardholder's banks or statements
                          // Default to INR, but could be USD if statements have USD currency
                          const currency = cardholder.currency || 'INR';
                          console.log(`Cardholder ${cardholder.name}: outstanding=${outstanding}, currency=${currency}`);
                          return formatAmount(outstanding, currency);
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {cardholder.lastStatementDate ? (
                          <span className="flex items-center text-gray-700">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(cardholder.lastStatementDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="flex items-center text-gray-500">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            <span className="text-xs">No statement</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/statements/upload?cardholder=${cardholder._id || cardholder.id}`);
                              }}
                              className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
                              title="Upload Statement"
                            >
                              Upload
                            </button>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewCardholder(cardholder)}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </button>
                          {hasPermission(PERMISSIONS.EDIT_CARDHOLDERS, user) && (
                            <button
                              onClick={() => handleEditCardholder(cardholder)}
                              className="text-green-600 hover:text-green-900 flex items-center"
                            >
                              <Edit3 className="w-4 h-4 mr-1" />
                              Edit
                            </button>
                          )}
                          {hasPermission(PERMISSIONS.DELETE_CARDHOLDERS, user) && (
                            <button
                              onClick={() => handleDeleteCardholder(cardholder)}
                              className="text-red-600 hover:text-red-900 flex items-center"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Empty State */}
          {filteredCardholders.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No cardholders found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by adding your first cardholder.'
                }
              </p>
              {(!searchTerm && filterStatus === 'all') && (
                <button
                  onClick={handleAddCardholder}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add First Cardholder
                </button>
              )}
            </div>
          )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Cardholders;
