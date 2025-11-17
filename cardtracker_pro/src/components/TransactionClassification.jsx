import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Edit3, 
  Save, 
  X,
  DollarSign,
  Calendar,
  User,
  FileText
} from 'lucide-react';

const TransactionClassification = ({ 
  transaction, 
  onUpdate, 
  onVerify, 
  onClassify,
  isVerifying = false,
  isClassifying = false 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    category: transaction.category || '',
    orderSubcategory: transaction.orderSubcategory || '',
    notes: transaction.notes || '',
    payoutReceived: transaction.payoutReceived || false,
    payoutAmount: transaction.payoutAmount || 0
  });

  const categories = [
    { value: 'bills', label: 'Bills', color: 'bg-red-100 text-red-800' },
    { value: 'withdrawals', label: 'Withdrawals', color: 'bg-blue-100 text-blue-800' },
    { value: 'orders', label: 'Orders', color: 'bg-green-100 text-green-800' },
    { value: 'fees', label: 'Fees', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'personal_use', label: 'Personal Use', color: 'bg-purple-100 text-purple-800' }
  ];

  const orderSubcategories = [
    { value: 'cb_won', label: 'CB Won' },
    { value: 'ref', label: 'REF' },
    { value: 'loss', label: 'Loss' },
    { value: 'running', label: 'Running' }
  ];

  const getOrderSubcategoryLabel = (value) => {
    const subcat = orderSubcategories.find(s => s.value === value);
    return subcat ? subcat.label : value;
  };

  const getCategoryColor = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.color : 'bg-gray-100 text-gray-800';
  };

  const getVerificationStatus = () => {
    if (transaction.verified) {
      return {
        icon: <CheckCircle className="w-4 h-4 text-green-600" />,
        text: 'Verified',
        color: 'text-green-600',
        verifiedBy: transaction.verifiedBy?.name || 'Unknown',
        verifiedAt: transaction.verifiedAt
      };
    } else if (transaction.pendingVerification) {
      return {
        icon: <Clock className="w-4 h-4 text-yellow-600" />,
        text: 'Pending Verification',
        color: 'text-yellow-600',
        verifiedBy: null,
        verifiedAt: null
      };
    } else {
      return {
        icon: <XCircle className="w-4 h-4 text-red-600" />,
        text: 'Not Verified',
        color: 'text-red-600',
        verifiedBy: null,
        verifiedAt: null
      };
    }
  };

  const handleSave = () => {
    onClassify(transaction._id, editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      category: transaction.category || '',
      orderSubcategory: transaction.orderSubcategory || '',
      notes: transaction.notes || '',
      payoutReceived: transaction.payoutReceived || false,
      payoutAmount: transaction.payoutAmount || 0
    });
    setIsEditing(false);
  };

  const verificationStatus = getVerificationStatus();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h4 className="font-semibold text-gray-900">
              {transaction.description || 'Transaction'}
            </h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(transaction.category)}`}>
              {transaction.category ? transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1).replace('_', ' ') : 'Unclassified'}
            </span>
            {transaction.category === 'orders' && transaction.orderSubcategory && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-200 text-green-900">
                {getOrderSubcategoryLabel(transaction.orderSubcategory)}
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 mr-1" />
              <span className="font-medium">${transaction.amount?.toLocaleString() || '0.00'}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              <span>{new Date(transaction.date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center">
              <FileText className="w-4 h-4 mr-1" />
              <span>{transaction.reference || 'N/A'}</span>
            </div>
            <div className="flex items-center">
              <User className="w-4 h-4 mr-1" />
              <span>{transaction.cardholder?.name || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Verification Status */}
          <div className={`flex items-center space-x-1 ${verificationStatus.color}`}>
            {verificationStatus.icon}
            <span className="text-sm font-medium">{verificationStatus.text}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1">
            {!transaction.verified && (
              <button
                onClick={() => onVerify(transaction._id)}
                disabled={isVerifying}
                className="p-1 text-green-600 hover:bg-green-50 rounded-md disabled:opacity-50"
                title="Verify Transaction"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded-md"
              title="Edit Classification"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Verification Details */}
      {verificationStatus.verifiedBy && (
        <div className="mb-4 p-3 bg-green-50 rounded-lg">
          <div className="text-sm text-green-800">
            <span className="font-medium">Verified by:</span> {verificationStatus.verifiedBy}
            {verificationStatus.verifiedAt && (
              <span className="ml-2">
                on {new Date(verificationStatus.verifiedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Payout Details for Orders */}
      {transaction.category === 'orders' && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-800">
            <div className="flex items-center justify-between">
              <span className="font-medium">Payout Status:</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                transaction.payoutReceived 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {transaction.payoutReceived ? 'Received' : 'Not Received'}
              </span>
            </div>
            {transaction.payoutAmount > 0 && (
              <div className="mt-1">
                <span className="font-medium">Amount:</span> ${transaction.payoutAmount.toLocaleString()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Form */}
      {isEditing && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={editData.category}
                onChange={(e) => setEditData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {editData.category === 'orders' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Sub-category *
                </label>
                <select
                  value={editData.orderSubcategory}
                  onChange={(e) => setEditData(prev => ({ ...prev, orderSubcategory: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Sub-category</option>
                  {orderSubcategories.map(subcat => (
                    <option key={subcat.value} value={subcat.value}>{subcat.label}</option>
                  ))}
                </select>
              </div>
            )}

            {editData.category === 'orders' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payout Amount
                  </label>
                  <input
                    type="number"
                    value={editData.payoutAmount}
                    onChange={(e) => setEditData(prev => ({ ...prev, payoutAmount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="payoutReceived"
                    checked={editData.payoutReceived}
                    onChange={(e) => setEditData(prev => ({ ...prev, payoutReceived: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="payoutReceived" className="ml-2 text-sm text-gray-700">
                    Payout Received
                  </label>
                </div>
              </>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={editData.notes}
                onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Additional notes about this transaction..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isClassifying || !editData.category || (editData.category === 'orders' && !editData.orderSubcategory)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-1" />
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionClassification;
