import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRealtime } from '../../contexts/RealtimeContext';
import RealtimeDashboard from '../../components/RealtimeDashboard';
import OverallSummary from '../../components/OverallSummary';
import DeadlineAlerts from '../../components/DeadlineAlerts';
import { getDashboardData } from '../../utils/dashboardApi';
import { getCardholders } from '../../utils/cardholderApi';
import { getBanks } from '../../utils/bankApi';
import { getTransactions } from '../../utils/transactionApi';
import { 
  Users, 
  CreditCard, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Building2,
  BarChart3,
  Settings,
  Bell,
  Eye,
  Edit3
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, refreshUserPermissions } = useAuth();
  const { trackActivity, onlineUsers, userActivity, connected } = useRealtime();
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    activeUsers: [],
    recentActivity: [],
    alerts: []
  });
  const [cardholders, setCardholders] = useState([]);
  const [banks, setBanks] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch real dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await getDashboardData();
        setDashboardData(data);
        
        // Fetch additional data for overall summary and alerts
        if (user?.role !== 'member') {
          try {
            const [cardholdersResponse, banksResponse, transactionsResponse] = await Promise.all([
              getCardholders({ limit: 1000 }),
              getBanks({ limit: 1000 }),
              getTransactions({ limit: 1000 })
            ]);
            
            if (cardholdersResponse.success) {
              setCardholders(cardholdersResponse.data);
            }
            if (banksResponse.success) {
              setBanks(banksResponse.data);
            }
            if (transactionsResponse.success) {
              setAllTransactions(transactionsResponse.data);
            }
          } catch (error) {
            console.error('Error fetching additional dashboard data:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Provide fallback data for members or when API fails
        setDashboardData({
          stats: {
            cardholders: 0,
            statements: 0,
            banks: 0,
            billPayments: 0,
            gateways: 0,
            reports: 0,
            projects: 0
          },
          activeUsers: [],
          recentActivity: [],
          alerts: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.role]);

  // Track dashboard viewing activity - only once per session
  useEffect(() => {
    if (user) {
      // Only track activity once when dashboard loads
      trackActivity('dashboard', 'viewed', 'main', {
        userName: user.name,
        userRole: user.role
      });
    }
  }, []); // Empty dependency array - only run once

  // Navigation handlers
  const handleNavigate = (path) => {
    trackActivity('dashboard', 'navigated', path, {
      userName: user?.name,
      userRole: user?.role
    });
    navigate(path);
  };

  // Get real-time active users from online users
  const activeUsers = onlineUsers.length > 0 ? onlineUsers.map(onlineUser => ({
    id: onlineUser.userId,
    name: onlineUser.user?.name || 'Unknown User',
    role: onlineUser.user?.role || 'member',
    lastActivity: new Date(onlineUser.connectedAt).toLocaleString(),
    action: 'Currently online',
    isOnline: true
  })) : [];

  // Get recent activity from real-time context
  const recentActivity = userActivity.length > 0 ? userActivity.slice(0, 10).map((activity, index) => ({
    id: index,
    user: activity.user?.name || 'Unknown User',
    action: activity.action,
    resource: activity.resource,
    timestamp: new Date(activity.timestamp).toLocaleString(),
    type: activity.action.toLowerCase().includes('add') ? 'add' : 
          activity.action.toLowerCase().includes('edit') ? 'edit' :
          activity.action.toLowerCase().includes('delete') ? 'delete' : 'other'
  })) : [];

  // Debug logging for all users
  useEffect(() => {
    if (user) {
      console.log('Dashboard - Debug Info:', {
        user: user,
        userRole: user?.role,
        isAuthenticated: !!user,
        onlineUsers: onlineUsers.length,
        userActivity: userActivity.length,
        activeUsers: activeUsers.length,
        recentActivity: recentActivity.length,
        connected: connected,
        onlineUsersData: onlineUsers,
        userActivityData: userActivity
      });
      
      
      // Additional debug for online users
      if (onlineUsers.length === 0) {
        console.log('⚠️ No online users found. This might be a socket issue.');
      } else {
        console.log('✅ Online users found:', onlineUsers);
      }
    }
  }, [onlineUsers, userActivity, activeUsers, recentActivity, user, connected]);

  return (
    <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  CardTracker Pro Dashboard
                </h1>
                <p className="text-lg text-gray-600">
                  Welcome back, <span className="font-semibold text-blue-600">{user?.name || 'User'}</span>! 
                  {user?.role === 'member' 
                    ? ' Manage your assigned cardholders and bill payments efficiently.' 
                    : ' Manage your accounts and transactions efficiently.'
                  }
                </p>
              </div>
              
              {/* User Role Badge */}
              <div className="flex items-center space-x-4">
                <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  user?.role === 'admin' ? 'bg-red-100 text-red-800' :
                  user?.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                  user?.role === 'gateway' ? 'bg-purple-100 text-purple-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'Member'}
                </div>
                
                {/* Real-time Status */}
                {user?.role !== 'member' && (
                  <div className="flex items-center space-x-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className={`${connected ? 'text-green-600' : 'text-red-600'}`}>
                      {connected ? 'Live' : 'Offline'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Alerts Section */}
          {dashboardData.alerts && dashboardData.alerts.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Bell className="w-5 h-5 mr-2 text-amber-500" />
                  Alerts & Notifications
                </h2>
                <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                  {dashboardData.alerts.length} Alert{dashboardData.alerts.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {dashboardData.alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${
                      alert.type === 'warning' ? 'bg-amber-50 border-amber-400' :
                      alert.type === 'info' ? 'bg-blue-50 border-blue-400' :
                      'bg-green-50 border-green-400'
                    }`}
                  >
                    <div className="flex items-center">
                      <AlertTriangle className={`w-5 h-5 mr-2 ${
                        alert.type === 'warning' ? 'text-amber-500' :
                        alert.type === 'info' ? 'text-blue-500' :
                        'text-green-500'
                      }`} />
                      <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Modules Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {user?.role === 'member' ? 'Your Dashboard' : 'Management Modules'}
              </h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Available Modules</span>
                </div>
                {user?.role !== 'member' && (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Real-time Data</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className={`grid grid-cols-1 md:grid-cols-2 ${user?.role === 'member' ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-6`}>
            {/* Cardholders Module - Always visible */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
                 onClick={() => handleNavigate('/cardholders')}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <span className="text-sm text-gray-500">
                  {loading ? 'Loading...' : `Active: ${dashboardData.stats?.cardholders || 0}`}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Cardholders</h3>
              <p className="text-gray-600 mb-4">Manage cardholder details, statements, and bank data</p>
              <div className="flex items-center text-blue-600 font-medium">
                <span>View Details</span>
                <Eye className="w-4 h-4 ml-2" />
              </div>
            </div>

            {/* Bill Payments Module - Always visible */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
                 onClick={() => handleNavigate('/bill-payments')}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <DollarSign className="w-8 h-8 text-orange-600" />
                </div>
                <span className="text-sm text-gray-500">
                  {loading ? 'Loading...' : `Pending: ${dashboardData.stats?.billPayments || 0}`}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Bill Payments</h3>
              <p className="text-gray-600 mb-4">Process bill payment requests and track payments</p>
              <div className="flex items-center text-orange-600 font-medium">
                <span>View Details</span>
                <Eye className="w-4 h-4 ml-2" />
              </div>
            </div>

            {/* Upload Statement Module - Members Only */}
            {user?.role === 'member' && (
              <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
                   onClick={() => handleNavigate('/statements/upload')}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <FileText className="w-8 h-8 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-500">
                    Upload Required
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Statement</h3>
                <p className="text-gray-600 mb-4">Upload credit card statements with month, period, and card details</p>
                <div className="flex items-center text-green-600 font-medium">
                  <span>Upload Now</span>
                  <Eye className="w-4 h-4 ml-2" />
                </div>
              </div>
            )}

            {/* View Statements Module - Members Only */}
            {user?.role === 'member' && (
              <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
                   onClick={() => handleNavigate('/statements')}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FileText className="w-8 h-8 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-500">
                    {loading ? 'Loading...' : `Uploaded: ${dashboardData.stats?.statements || 0}`}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">View Statements</h3>
                <p className="text-gray-600 mb-4">View and manage uploaded statements</p>
                <div className="flex items-center text-blue-600 font-medium">
                  <span>View Details</span>
                  <Eye className="w-4 h-4 ml-2" />
                </div>
              </div>
            )}

                   {/* Statements Module - Admin/Manager Only */}
                   {user?.role !== 'member' && (
                     <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
                          onClick={() => handleNavigate('/statements')}>
                       <div className="flex items-center justify-between mb-4">
                         <div className="p-3 bg-green-100 rounded-lg">
                           <FileText className="w-8 h-8 text-green-600" />
                         </div>
                         <span className="text-sm text-gray-500">
                           {loading ? 'Loading...' : `Uploaded: ${dashboardData.stats?.statements || 0}`}
                         </span>
                       </div>
                       <h3 className="text-xl font-semibold text-gray-900 mb-2">Statements</h3>
                       <p className="text-gray-600 mb-4">Upload and manage credit card statements</p>
                       <div className="flex items-center text-green-600 font-medium">
                         <span>View Details</span>
                         <Eye className="w-4 h-4 ml-2" />
                       </div>
                     </div>
                   )}

                   {/* Bank Data Module - Admin/Manager/Gateway Only */}
                   {user?.role !== 'member' && (
                     <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
                          onClick={() => handleNavigate('/bank-data')}>
                       <div className="flex items-center justify-between mb-4">
                         <div className="p-3 bg-purple-100 rounded-lg">
                           <CreditCard className="w-8 h-8 text-purple-600" />
                         </div>
                         <span className="text-sm text-gray-500">
                           {loading ? 'Loading...' : `Banks: ${dashboardData.stats?.banks || 0}`}
                         </span>
                       </div>
                       <h3 className="text-xl font-semibold text-gray-900 mb-2">Bank Data</h3>
                       <p className="text-gray-600 mb-4">Manage individual bank accounts and transactions</p>
                       <div className="flex items-center text-purple-600 font-medium">
                         <span>View Details</span>
                         <Eye className="w-4 h-4 ml-2" />
                       </div>
                     </div>
                   )}

            {/* Gateway Module - Admin/Gateway Manager Only */}
            {user?.role !== 'member' && (
              <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
                   onClick={() => handleNavigate('/gateways')}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <CreditCard className="w-8 h-8 text-purple-600" />
                  </div>
                  <span className="text-sm text-gray-500">Gateways: 3</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Gateway Management</h3>
                <p className="text-gray-600 mb-4">Manage withdrawals, bills, transfers, and deposits</p>
                <div className="flex items-center text-purple-600 font-medium">
                  <span>View Details</span>
                  <Eye className="w-4 h-4 ml-2" />
                </div>
              </div>
            )}

            {/* Reports Module - Admin/Manager Only */}
            {user?.role !== 'member' && user?.role !== 'gateway_manager' && (
              <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
                   onClick={() => handleNavigate('/reports')}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <BarChart3 className="w-8 h-8 text-orange-600" />
                  </div>
                  <span className="text-sm text-gray-500">Reports: 12</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Reports & Analytics</h3>
                <p className="text-gray-600 mb-4">Generate comprehensive reports and analytics</p>
                <div className="flex items-center text-orange-600 font-medium">
                  <span>View Details</span>
                  <Eye className="w-4 h-4 ml-2" />
                </div>
              </div>
            )}

            {/* Company Module - Admin/Manager Only */}
            {user?.role !== 'member' && user?.role !== 'gateway_manager' && (
              <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
                   onClick={() => handleNavigate('/company')}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <Building2 className="w-8 h-8 text-indigo-600" />
                  </div>
                  <span className="text-sm text-gray-500">Active: 5</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Company Management</h3>
                <p className="text-gray-600 mb-4">Manage profits, FD cards, expenses, and projects</p>
                <div className="flex items-center text-indigo-600 font-medium">
                  <span>View Details</span>
                  <Eye className="w-4 h-4 ml-2" />
                </div>
              </div>
            )}

            {/* Settings Module */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
                 onClick={() => handleNavigate('/settings')}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Settings className="w-8 h-8 text-gray-600" />
                </div>
                <span className="text-sm text-gray-500">Configure</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Settings & Configuration</h3>
              <p className="text-gray-600 mb-4">Manage user roles, permissions, and system settings</p>
              <div className="flex items-center text-gray-600 font-medium">
                <span>View Details</span>
                <Eye className="w-4 h-4 ml-2" />
              </div>
            </div>
            </div>
          </div>

          {/* Debug Info - Admin Only */}
          {user?.role === 'admin' && (
            <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-yellow-800">Admin Debug Info</h3>
                <button
                  onClick={async () => {
                    const result = await refreshUserPermissions();
                    if (result.success) {
                      alert('Permissions refreshed successfully!');
                    } else {
                      alert('Failed to refresh permissions: ' + result.error);
                    }
                  }}
                  className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
                >
                  Refresh Permissions
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">User Role:</span>
                  <span className="ml-2 text-blue-600">{user?.role || 'Unknown'}</span>
                </div>
                <div>
                  <span className="font-medium">Connection:</span>
                  <span className={`ml-2 ${connected ? 'text-green-600' : 'text-red-600'}`}>
                    {connected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Online Users:</span>
                  <span className="ml-2 text-blue-600">{onlineUsers.length}</span>
                </div>
                <div>
                  <span className="font-medium">Activities:</span>
                  <span className="ml-2 text-blue-600">{userActivity.length}</span>
                </div>
              </div>
            </div>
          )}

          {/* Upload Statement Section - Members Only */}
          {user?.role === 'member' && (
            <div className="mt-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Upload Your Statement</h2>
                  <p className="text-green-100 mb-4">Upload your credit card statement with required details</p>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleNavigate('/statements/upload')}
                      className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center"
                    >
                      <FileText className="w-5 h-5 mr-2" />
                      Upload Statement
                    </button>
                    <button
                      onClick={() => handleNavigate('/statements')}
                      className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition-colors flex items-center"
                    >
                      <Eye className="w-5 h-5 mr-2" />
                      View Statements
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold">{dashboardData.stats?.statements || 0}</div>
                  <div className="text-green-100">Statements Uploaded</div>
                </div>
              </div>
            </div>
          )}

          {/* Overall Summary - Admin/Manager Only */}
          {user?.role !== 'member' && (
            <div className="mt-8">
              <OverallSummary 
                banks={banks}
                allTransactions={allTransactions}
                cardholders={cardholders}
              />
            </div>
          )}

          {/* Deadline Alerts - Admin/Manager Only */}
          {user?.role !== 'member' && (
            <div className="mt-8">
              <DeadlineAlerts 
                cardholders={cardholders}
                onDismissAlert={(alertId) => {
                  console.log('Dismissed alert:', alertId);
                  // TODO: Implement alert dismissal
                }}
                onMarkAsUploaded={(alertId) => {
                  console.log('Marked as uploaded:', alertId);
                  // TODO: Implement mark as uploaded
                }}
              />
            </div>
          )}

          {/* Real-time Dashboard - Admin Only */}
          {user?.role === 'admin' && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Real-time Activity</h2>
                  <p className="text-gray-600 mt-1">Live monitoring of user activities and system status</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className={`${connected ? 'text-green-600' : 'text-red-600'}`}>
                      {connected ? 'Live' : 'Offline'}
                    </span>
                  </div>
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {onlineUsers.length} Online
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Section - Activity and Users - Admin Only */}
          {user?.role === 'admin' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
                    Real-time Activity
                  </h3>
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={connected ? 'text-green-600' : 'text-red-600'}>
                      {connected ? 'Live' : 'Offline'}
                    </span>
                  </div>
                </div>
              <div className="space-y-4">
                {recentActivity.length > 0 ? recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'add' ? 'bg-green-500' :
                      activity.type === 'edit' ? 'bg-blue-500' :
                      activity.type === 'delete' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        <span className="font-semibold text-blue-600">{activity.user}</span> {activity.action}
                      </p>
                      <p className="text-xs text-gray-500">{activity.resource} • {activity.timestamp}</p>
                    </div>
                    <div className="flex items-center text-xs text-gray-400">
                      <Eye className="w-3 h-3 mr-1" />
                      Live
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>No recent activity</p>
                    <p className="text-sm">Activity will appear here in real-time</p>
                  </div>
                )}
              </div>
            </div>
            
              {/* Active Users */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-green-500" />
                    Active Users
                  </h3>
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={connected ? 'text-green-600' : 'text-red-600'}>
                      {connected ? 'Live' : 'Offline'}
                    </span>
                  </div>
                </div>
              <div className="space-y-4">
                {activeUsers.length > 0 ? activeUsers.map((activeUser) => (
                  <div key={activeUser.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="relative">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {activeUser.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        <span className="font-semibold text-green-600">{activeUser.name}</span>
                      </p>
                      <p className="text-sm text-gray-600">{activeUser.action}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500">{activeUser.lastActivity}</span>
                      <p className="text-xs text-blue-600 font-medium capitalize">{activeUser.role}</p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>No users online</p>
                    <p className="text-sm">Online users will appear here</p>
                  </div>
                )}
              </div>
              </div>
            </div>
          )}
    </div>
  );
};

export default Dashboard;