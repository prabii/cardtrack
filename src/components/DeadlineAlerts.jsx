import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  Calendar, 
  Bell, 
  X, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const DeadlineAlerts = ({ cardholders = [], onDismissAlert, onMarkAsUploaded }) => {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate deadline alerts
  const calculateDeadlineAlerts = () => {
    const currentDate = new Date();
    const alerts = [];

    cardholders.forEach(cardholder => {
      // Check if cardholder has any banks
      if (cardholder.banks && cardholder.banks.length > 0) {
        cardholder.banks.forEach(bank => {
          // Check if there's a deadline set for this bank
          if (bank.statementDeadline) {
            const deadline = new Date(bank.statementDeadline);
            const daysUntilDeadline = Math.ceil((deadline - currentDate) / (1000 * 60 * 60 * 24));
            
            // Check if statement has been uploaded for current month
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();
            const hasStatementForCurrentMonth = cardholder.statements?.some(statement => {
              const statementDate = new Date(statement.uploadedDate);
              return statementDate.getMonth() === currentMonth && 
                     statementDate.getFullYear() === currentYear &&
                     statement.bankId === bank._id;
            });

            if (!hasStatementForCurrentMonth) {
              let alertType = 'info';
              let priority = 'low';
              
              if (daysUntilDeadline < 0) {
                alertType = 'error';
                priority = 'high';
              } else if (daysUntilDeadline <= 3) {
                alertType = 'warning';
                priority = 'medium';
              }

              alerts.push({
                id: `${cardholder._id}-${bank._id}-${currentMonth}-${currentYear}`,
                cardholderId: cardholder._id,
                cardholderName: cardholder.name,
                bankId: bank._id,
                bankName: bank.bankName,
                deadline: deadline,
                daysUntilDeadline: daysUntilDeadline,
                alertType: alertType,
                priority: priority,
                month: currentMonth,
                year: currentYear,
                isOverdue: daysUntilDeadline < 0
              });
            }
          }
        });
      }
    });

    // Sort by priority and deadline
    return alerts.sort((a, b) => {
      if (a.priority !== b.priority) {
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return a.daysUntilDeadline - b.daysUntilDeadline;
    });
  };

  useEffect(() => {
    const calculatedAlerts = calculateDeadlineAlerts();
    setAlerts(calculatedAlerts);
    setIsLoading(false);
  }, [cardholders]);

  const getAlertIcon = (alertType) => {
    switch (alertType) {
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-blue-600" />;
    }
  };

  const getAlertColor = (alertType) => {
    switch (alertType) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[priority]}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  const handleDismiss = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    if (onDismissAlert) {
      onDismissAlert(alertId);
    }
  };

  const handleMarkAsUploaded = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    if (onMarkAsUploaded) {
      onMarkAsUploaded(alertId);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading deadline alerts...</span>
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">All Up to Date!</h3>
          <p className="text-gray-600">No pending statement deadline alerts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Bell className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Statement Deadline Alerts</h3>
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
              {alerts.length} Alert{alerts.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`border rounded-lg p-4 ${getAlertColor(alert.alertType)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getAlertIcon(alert.alertType)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold">
                        {alert.cardholderName} - {alert.bankName}
                      </h4>
                      {getPriorityBadge(alert.priority)}
                    </div>
                    
                    <p className="text-sm mb-2">
                      Statement for {new Date(alert.year, alert.month).toLocaleDateString('en-US', { 
                        month: 'long', 
                        year: 'numeric' 
                      })} not uploaded
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Deadline: {alert.deadline.toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span className={alert.isOverdue ? 'font-semibold text-red-600' : ''}>
                          {alert.isOverdue 
                            ? `${Math.abs(alert.daysUntilDeadline)} days overdue`
                            : `${alert.daysUntilDeadline} days remaining`
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleMarkAsUploaded(alert.id)}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                    title="Mark as uploaded"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDismiss(alert.id)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Dismiss alert"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="font-semibold text-gray-900">Overdue</span>
          </div>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {alerts.filter(a => a.isOverdue).length}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <span className="font-semibold text-gray-900">Due Soon</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600 mt-1">
            {alerts.filter(a => !a.isOverdue && a.daysUntilDeadline <= 3).length}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900">Upcoming</span>
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {alerts.filter(a => !a.isOverdue && a.daysUntilDeadline > 3).length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeadlineAlerts;
