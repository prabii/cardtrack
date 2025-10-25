import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import { 
  getStatement, 
  getStatusColor, 
  formatFileSize,
  downloadStatement,
  downloadFileFromBlob,
  deleteStatement
} from '../../utils/statementApi';
import { 
  FileText, 
  ArrowLeft, 
  Download, 
  Trash2,
  Calendar,
  User,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  Eye,
  Edit3,
  RefreshCw
} from 'lucide-react';

const StatementDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [statement, setStatement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Load statement data from API
  useEffect(() => {
    loadStatement();
  }, [id]);

  const loadStatement = async () => {
    try {
      setIsLoading(true);
      setError('');
      console.log('Loading statement with ID:', id);
      
      const response = await getStatement(id);
      console.log('Statement response:', response);
      
      if (response.success) {
        setStatement(response.data);
      } else {
        setError(response.message || 'Failed to load statement');
      }
    } catch (error) {
      console.error('Error loading statement:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.response?.status === 404) {
        setError('Statement not found');
      } else if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (error.response?.status === 403) {
        setError('Access denied. You do not have permission to view this statement.');
      } else if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        setError('Unable to connect to server. Please check if the backend server is running.');
      } else {
        setError(error.response?.data?.message || error.message || 'Failed to load statement');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadStatement = async () => {
    try {
      const blob = await downloadStatement(statement._id);
      downloadFileFromBlob(blob, statement.fileName);
    } catch (error) {
      console.error('Error downloading statement:', error);
      alert('Failed to download statement');
    }
  };

  const handleDeleteStatement = async () => {
    if (window.confirm('Are you sure you want to delete this statement? This action cannot be undone.')) {
      try {
        setIsDeleting(true);
        await deleteStatement(statement._id);
        alert('Statement deleted successfully');
        navigate('/statements');
      } catch (error) {
        console.error('Error deleting statement:', error);
        alert('Failed to delete statement');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleBack = () => {
    navigate('/statements');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading statement details...</p>
        </div>
      </div>
    );
  }

  if (error && !statement) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <div className="flex space-x-4 justify-center">
            <Button onClick={loadStatement} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
            <Button onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Statements
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!statement) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Statement not found</p>
          <Button onClick={handleBack} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Statements
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <main className="pt-16">
        <div className="max-w-4xl mx-auto px-4 lg:px-6 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={handleBack}
                  className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-6 h-6 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">Statement Details</h1>
                  <p className="text-lg text-gray-600">
                    {statement.month} {statement.year} - {statement.bankName}
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button 
                  onClick={handleDownloadStatement}
                  variant="outline"
                  className="flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button 
                  onClick={handleDeleteStatement}
                  variant="outline"
                  className="text-red-600 hover:bg-red-50 flex items-center"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Delete
                </Button>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              <span className="flex-1">{error}</span>
              <button
                onClick={() => setError('')}
                className="text-yellow-500 hover:text-yellow-700"
              >
                ×
              </button>
            </div>
          )}

          {/* Statement Information */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Statement Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <User className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Cardholder</p>
                        <p className="text-gray-900">{statement.cardholder?.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{statement.cardholder?.email || ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Period</p>
                        <p className="text-gray-900">{statement.month} {statement.year}</p>
                        {statement.timePeriod?.startDate && statement.timePeriod?.endDate && (
                          <p className="text-sm text-gray-500">
                            {new Date(statement.timePeriod.startDate).toLocaleDateString()} - {new Date(statement.timePeriod.endDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <CreditCard className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Bank & Card</p>
                        <p className="text-gray-900">{statement.bankName}</p>
                        <p className="text-sm text-gray-500">****{statement.cardDigits}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Status</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(statement.status)}`}>
                          {statement.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* File Information */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">File Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <FileText className="w-8 h-8 text-blue-600 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">{statement.fileName}</p>
                        <p className="text-sm text-gray-500">{formatFileSize(statement.fileSize)}</p>
                      </div>
                    </div>
                    <Button 
                      onClick={handleDownloadStatement}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>

              {/* Extracted Data */}
              {statement.extractedData && Object.keys(statement.extractedData).length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Extracted Data</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(statement.extractedData).map(([key, value]) => (
                      <div key={key} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-600 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <p className="text-gray-900">
                          {typeof value === 'number' ? value.toLocaleString() : value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">File Size</span>
                    <span className="font-medium">{formatFileSize(statement.fileSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Upload Date</span>
                    <span className="font-medium">
                      {new Date(statement.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Uploaded By</span>
                    <span className="font-medium">{statement.uploadedBy?.name || 'Unknown'}</span>
                  </div>
                  {statement.deadline && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Deadline</span>
                      <span className="font-medium">
                        {new Date(statement.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Processing Information */}
              {statement.processedBy && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Info</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Processed By</span>
                      <span className="font-medium">{statement.processedBy.name}</span>
                    </div>
                    {statement.processedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Processed At</span>
                        <span className="font-medium">
                          {new Date(statement.processedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error Information */}
              {statement.processingError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-red-900 mb-2">Processing Error</h3>
                  <p className="text-red-700 text-sm">{statement.processingError}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StatementDetail;
