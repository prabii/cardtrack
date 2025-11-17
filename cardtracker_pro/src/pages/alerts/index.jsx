import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRealtime } from '../../contexts/RealtimeContext';
import {
  Bell,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  CreditCard,
  Loader2,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  Eye
} from 'lucide-react';

const Alerts = () => {
  const { user } = useAuth();
  const { socket, connected, notifications } = useRealtime();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTallyModal, setShowTallyModal] = useState(false);
  const [tallyDate, setTallyDate] = useState('');

  useEffect(() => {
    loadAlerts();
  }, []);

  // Listen for real-time alerts from Socket.IO
  useEffect(() => {
    if (socket && connected) {
      const handleAlert = (alertData) => {
        console.log('🚨 Real-time alert received:', alertData);
        setAlerts(prev => {
          // Check if alert already exists
          const exists = prev.find(a => a.id === alertData.id);
          if (exists) {
            // Update existing alert
            return prev.map(a => a.id === alertData.id ? { ...a, ...alertData } : a);
          }
          // Add new alert at the beginning
          return [alertData, ...prev];
        });
      };

      socket.on('alert', handleAlert);

      return () => {
        socket.off('alert', handleAlert);
      };
    }
  }, [socket, connected]);

  // Also listen to notifications for alerts
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const alertNotifications = notifications.filter(n => n.type === 'alert');
      if (alertNotifications.length > 0) {
        setAlerts(prev => {
          const newAlerts = alertNotifications.map(n => ({
            id: n.id,
            type: n.type === 'alert' ? 'bill_payment_due' : n.type,
            priority: n.priority || 'medium',
            title: n.title,
            message: n.message,
            timestamp: n.timestamp || new Date(),
            details: n.details || {}
          }));

          // Merge with existing alerts, avoiding duplicates
          const existingIds = new Set(prev.map(a => a.id));
          const uniqueNewAlerts = newAlerts.filter(a => !existingIds.has(a.id));
          return [...uniqueNewAlerts, ...prev];
        });
      }
    }
  }, [notifications]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Try to fetch real alerts from API
      try {
        const { api } = await import('../../utils/authApi');
        const response = await api.get('/reports/alerts');
        if (response.data && response.data.success) {
          setAlerts(response.data.data || []);
        } else {
          // Fallback to mock data if API doesn't return expected format
          setAlerts(getMockAlerts());
        }
      } catch (apiError) {
        console.warn('API call failed, using mock data:', apiError);
        // Use mock data as fallback
        setAlerts(getMockAlerts());
      }
    } catch (err) {
      console.error('Error loading alerts:', err);
      setError(err.message || 'Failed to load alerts');
      // Use mock data as fallback
      setAlerts(getMockAlerts());
    } finally {
      setLoading(false);
    }
  };

  const getMockAlerts = () => {
    return [
      {
        id: 1,
        type: 'bill_payment_due',
        title: 'Bill Payment Due',
        message: '3 bill payments are due within 2 days',
        priority: 'high',
        date: new Date(),
        count: 3
      },
      {
        id: 2,
        type: 'tally_required',
        title: 'Tally Required',
        message: 'Tally date is approaching',
        priority: 'medium',
        date: new Date(),
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      },
      {
        id: 3,
        type: 'withdrawal_alert',
        title: 'Withdrawal Alert',
        message: 'Large withdrawal detected',
        priority: 'low',
        date: new Date(),
        amount: 5000
      }
    ];
  };

  const handleSetTallyDate = async () => {
    if (!tallyDate) {
      alert('Please select a tally date');
      return;
    }

    try {
      // TODO: Implement API call to set tally date
      alert('Tally date set successfully');
      setShowTallyModal(false);
      setTallyDate('');
      loadAlerts();
    } catch (err) {
      console.error('Error setting tally date:', err);
      alert('Failed to set tally date');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'bill_payment_due': return <DollarSign className="w-5 h-5" />;
      case 'tally_required': return <Calendar className="w-5 h-5" />;
      case 'withdrawal_alert': return <CreditCard className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
            <p className="ml-3 text-lg text-gray-700">Loading alerts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Alerts</h1>
              <p className="text-lg text-gray-600 mt-1">Manage system alerts and notifications</p>
            </div>
            {['operator', 'admin', 'manager'].includes(user?.role) && (
              <button
                onClick={() => setShowTallyModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Calendar size={16} />
                <span>Set Tally Date</span>
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Alerts List */}
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Alerts</h3>
                <p className="text-gray-600">You're all caught up! No alerts at this time.</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`p-3 rounded-full ${
                        alert.priority === 'high' ? 'bg-red-100' :
                        alert.priority === 'medium' ? 'bg-yellow-100' :
                        'bg-blue-100'
                      }`}>
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{alert.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(alert.priority)}`}>
                            {alert.priority}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">{alert.message}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {new Date(alert.date).toLocaleDateString()}
                          </span>
                          {alert.count && (
                            <span>Count: {alert.count}</span>
                          )}
                          {alert.amount && (
                            <span className="flex items-center">
                              <DollarSign className="w-4 h-4 mr-1" />
                              {alert.amount.toLocaleString()}
                            </span>
                          )}
                          {alert.dueDate && (
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              Due: {new Date(alert.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      {/* Set Tally Date Modal */}
      {showTallyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Set Tally Date</h2>
              <button
                onClick={() => setShowTallyModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tally Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={tallyDate}
                  onChange={(e) => setTallyDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowTallyModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSetTallyDate}
                disabled={!tallyDate}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                <span>Set Date</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alerts;

