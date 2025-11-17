import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import { getCardholder } from '../../utils/cardholderApi';
import { useRealtime } from '../../contexts/RealtimeContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Users,
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Edit3,
  Upload,
  Eye,
  CheckCircle,
  X,
  Plus,
  BarChart3,
  Clock,
  Banknote
} from 'lucide-react';

const CardholderDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { trackActivity, trackViewing, getViewingUsers, getEditingUsers, startEditing, stopEditing, joinRoom, leaveRoom, socket, connected } = useRealtime();
  const { user } = useAuth();
  const [cardholder, setCardholder] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [transactions, setTransactions] = useState([]);
  const [bankData, setBankData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);


  // Load cardholder data from API
  useEffect(() => {
    loadCardholderData();
  }, [id]);

  // Join module room and track viewing activity
  useEffect(() => {
    if (cardholder && socket && connected) {
      // Join the cardholder module room to receive real-time updates
      joinRoom(`module_cardholder`);
      
      // Initial tracking
      trackViewing('cardholder', id, 'viewing');
      trackActivity('cardholder', 'viewed', id, {
        cardholderName: cardholder.name,
        cardholderEmail: cardholder.email
      });

      // Set up periodic viewing updates (every 30 seconds)
      const viewingInterval = setInterval(() => {
        trackViewing('cardholder', id, 'viewing');
      }, 30000);

      return () => {
        clearInterval(viewingInterval);
        // Leave room when component unmounts
        leaveRoom(`module_cardholder`);
      };
    }
  }, [cardholder, id, socket, connected, trackViewing, trackActivity, joinRoom, leaveRoom]);

  // Get viewing and editing users - update when socket receives new data
  const viewingUsers = getViewingUsers('cardholder', id);
  const editingUsers = getEditingUsers('cardholder', id);
  
  // Filter out current user from viewing/editing lists
  const otherViewingUsers = viewingUsers.filter(u => {
    const userId = u.userId || u.user?.id || u.user?._id;
    const currentUserId = user?.id || user?._id;
    return userId !== currentUserId;
  });
  const otherEditingUsers = editingUsers.filter(u => {
    const userId = u.userId || u.user?.id || u.user?._id;
    const currentUserId = user?.id || user?._id;
    return userId !== currentUserId;
  });

  // Track editing when edit button is clicked
  const handleEditClick = () => {
    setIsEditing(true);
    startEditing('cardholder', id);
    navigate(`/cardholders/${id}/edit`);
  };

  // Cleanup editing indicator on unmount
  useEffect(() => {
    return () => {
      if (isEditing) {
        stopEditing('cardholder', id);
      }
      // Stop viewing when component unmounts
      // Note: viewing will automatically timeout on backend
    };
  }, [isEditing, id, stopEditing]);

  const loadCardholderData = async () => {
    try {
      setIsLoading(true);
      setError('');
      console.log('Loading cardholder data for ID:', id);
      const response = await getCardholder(id);
      console.log('Cardholder response:', response);
      
      if (response.success) {
        const data = response.data;
        setCardholder(data.cardholder || data);
        // Load transactions from API
        setTransactions(data.transactions || data.recentTransactions || []);
        // Load banks from API
        setBankData(data.bankSummaries || data.banks || []);
      } else {
        throw new Error(response.message || 'Failed to load cardholder');
      }
    } catch (error) {
      console.error('Error loading cardholder data:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load cardholder data');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'bank-data', label: 'Bank Data', icon: CreditCard },
    { id: 'transactions', label: 'Transactions', icon: BarChart3 }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Bills': return 'bg-red-100 text-red-800';
      case 'Withdrawals': return 'bg-blue-100 text-blue-800';
      case 'Orders': return 'bg-green-100 text-green-800';
      case 'Fees': return 'bg-yellow-100 text-yellow-800';
      case 'Personal': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cardholder details...</p>
        </div>
      </div>
    );
  }

  if (error && !cardholder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/cardholders')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Cardholders
          </button>
        </div>
      </div>
    );
  }

  if (!cardholder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Cardholder not found</p>
          <button
            onClick={() => navigate('/cardholders')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mt-4"
          >
            Back to Cardholders
          </button>
        </div>
      </div>
    );
  }

  // Safety check to prevent rendering with invalid data
  if (!cardholder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cardholder details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
          {/* Real-time Activity Indicators */}
          {(otherViewingUsers.length > 0 || otherEditingUsers.length > 0) && (
            <div className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 flex items-center space-x-4 shadow-sm">
              {otherEditingUsers.length > 0 && (
                <div className="flex items-center space-x-2 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                  <Edit3 className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium text-gray-800">
                    {otherEditingUsers.map((u, idx) => (
                      <span key={u.userId || u.user?.id || idx}>
                        <span className="font-semibold text-orange-600">👤 {u.user?.name || u.name || 'Someone'}</span>
                        {idx < otherEditingUsers.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                    {otherEditingUsers.length === 1 ? ' is editing' : ' are editing'}
                  </span>
                </div>
              )}
              {otherViewingUsers.length > 0 && (
                <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                  <Eye className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-800">
                    {otherViewingUsers.map((u, idx) => (
                      <span key={u.userId || u.user?.id || idx}>
                        <span className="font-semibold text-blue-600">👁️ {u.user?.name || u.name || 'Someone'}</span>
                        {idx < otherViewingUsers.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                    {otherViewingUsers.length === 1 ? ' is viewing' : ' are viewing'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => navigate('/cardholders')}
                  className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mr-4">
                    {(cardholder?.name || 'N/A').split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">{cardholder?.name || 'Cardholder'}</h1>
                    <p className="text-lg text-gray-600">Cardholder Dashboard</p>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button 
                  onClick={handleEditClick}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </button>
                <button 
                  onClick={() => navigate(`/statements/upload?cardholder=${id}`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Statement
                </button>
              </div>
            </div>
          </div>

          {/* Error Banner - Show if there's an error but data still loaded */}
          {error && cardholder && (
            <div className="mb-6 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              <span>Warning: {error}. Showing mock data for development.</span>
              <button
                onClick={() => setError('')}
                className="ml-auto text-yellow-500 hover:text-yellow-700"
              >
                ×
              </button>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Cards</p>
                  <p className="text-3xl font-bold text-gray-900">{bankData.length}</p>
                </div>
                <CreditCard className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Outstanding Amount</p>
                  <p className="text-3xl font-bold text-red-600">
                    ${bankData.reduce((sum, bank) => sum + bank.outstandingAmount, 0).toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <div className="flex items-center mt-1">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      cardholder.status === 'active' ? 'bg-green-500' : 
                      cardholder.status === 'pending' ? 'bg-yellow-500' : 
                      'bg-gray-400'
                    }`}></div>
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(cardholder.status)}`}>
                      {cardholder.status || 'pending'}
                    </span>
                  </div>
                </div>
                {cardholder.status === 'active' ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : (
                  <Clock className="w-8 h-8 text-yellow-600" />
                )}
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="bg-white rounded-xl shadow-lg mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className="w-5 h-5 mr-2" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <Mail className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">Email</p>
                            <p className="text-gray-900">{cardholder.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Phone className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">Phone</p>
                            <p className="text-gray-900">{cardholder.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">Date of Birth</p>
                            <p className="text-gray-900">{new Date(cardholder.dob).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">Address</p>
                            <p className="text-gray-900">{cardholder.address}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Users className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">Father's Name</p>
                            <p className="text-gray-900">{cardholder.fatherName}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Users className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">Mother's Name</p>
                            <p className="text-gray-900">{cardholder.motherName}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bank Summary */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Bank Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {bankData.map((bank, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">{bank.bankName}</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Card:</span>
                              <span className="font-medium">{bank.cardNumber}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Limit:</span>
                              <span className="font-medium">${bank.cardLimit.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Available:</span>
                              <span className="font-medium text-green-600">${bank.availableLimit.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Outstanding:</span>
                              <span className="font-medium text-red-600">${bank.outstandingAmount.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}


              {/* Bank Data Tab */}
              {activeTab === 'bank-data' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900">Bank Cards</h3>
                  
                  {bankData.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {bankData.map((bank, index) => (
                        <div key={bank._id || index} className="group">
                          {/* Credit Card */}
                          <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-6 text-white shadow-2xl transform transition-all duration-500 hover:scale-105 hover:rotate-1 hover:shadow-3xl">
                            {/* Card Background Pattern */}
                            <div className="absolute inset-0 rounded-2xl overflow-hidden">
                              <div className="absolute -top-4 -right-4 w-24 h-24 bg-white opacity-10 rounded-full"></div>
                              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-white opacity-5 rounded-full"></div>
                              <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white opacity-5 rounded-full"></div>
                            </div>
                            
                            {/* Card Content */}
                            <div className="relative z-10">
                              {/* Bank Logo */}
                              <div className="flex justify-between items-start mb-8">
                                <div className="text-2xl font-bold">{bank.bankName}</div>
                                <div className="text-right">
                                  <div className="text-sm opacity-80">Credit Card</div>
                                  <div className="text-xs opacity-60">{bank.cardType || 'Credit'}</div>
                                </div>
                              </div>
                              
                              {/* Card Number */}
                              <div className="mb-6">
                                <div className="text-sm opacity-80 mb-2">Card Number</div>
                                <div className="text-2xl font-mono tracking-wider">{bank.cardNumber || '**** **** **** ****'}</div>
                              </div>
                              
                              {/* Card Details */}
                              <div className="flex justify-between items-end">
                                <div>
                                  <div className="text-sm opacity-80 mb-1">Card Limit</div>
                                  <div className="text-lg font-semibold">${(bank.cardLimit || 0).toLocaleString()}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm opacity-80 mb-1">Available</div>
                                  <div className="text-lg font-semibold">${(bank.availableLimit || 0).toLocaleString()}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Card Stats */}
                          <div className="mt-4 bg-white rounded-xl p-4 shadow-lg border border-gray-100">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-red-600">${(bank.outstandingAmount || 0).toLocaleString()}</div>
                                <div className="text-sm text-gray-600">Outstanding</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                  {bank.cardLimit > 0 ? Math.round(((bank.cardLimit - (bank.availableLimit || 0)) / bank.cardLimit) * 100) : 0}%
                                </div>
                                <div className="text-sm text-gray-600">Used</div>
                              </div>
                            </div>
                            
                            {/* Usage Bar */}
                            <div className="mt-4">
                              <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Usage</span>
                                <span>{bank.cardLimit > 0 ? Math.round(((bank.cardLimit - (bank.availableLimit || 0)) / bank.cardLimit) * 100) : 0}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-green-500 to-red-500 h-2 rounded-full transition-all duration-1000"
                                  style={{ 
                                    width: `${bank.cardLimit > 0 ? Math.min(((bank.cardLimit - (bank.availableLimit || 0)) / bank.cardLimit) * 100, 100) : 0}%` 
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CreditCard className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Bank Cards</h3>
                      <p className="text-gray-600 mb-6">This cardholder doesn't have any bank cards yet.</p>
                      <button 
                        onClick={() => navigate(`/bank-data/add?cardholder=${id}`)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Bank Card
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Transactions Tab */}
              {activeTab === 'transactions' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900">Recent Transactions</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verified</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.length > 0 ? (
                          transactions.map((transaction) => (
                            <tr key={transaction.id || transaction._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(transaction.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {transaction.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${transaction.amount.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(transaction.category)}`}>
                                {transaction.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {transaction.verified ? (
                                <span className="inline-flex items-center text-green-600">
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Verified
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-yellow-600">
                                  <Clock className="w-4 h-4 mr-1" />
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button className="text-blue-600 hover:text-blue-900 flex items-center">
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </button>
                            </td>
                          </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="px-6 py-12 text-center">
                              <div className="flex flex-col items-center justify-center">
                                <BarChart3 className="w-12 h-12 text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions</h3>
                                <p className="text-gray-600 mb-4">
                                  No transactions found for this cardholder. Upload statements to see transactions.
                                </p>
                                <button
                                  onClick={() => navigate('/statements/upload')}
                                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                                >
                                  <Upload className="w-4 h-4 mr-2" />
                                  Upload Statement
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CardholderDashboard;

