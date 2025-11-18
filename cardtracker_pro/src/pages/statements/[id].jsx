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
  deleteStatement,
  processStatement,
  reprocessStatement
} from '../../utils/statementApi';
import { 
  getStatementTransactions,
  formatAmount,
  formatDate,
  getCategoryColor,
  getCategoryLabel
} from '../../utils/transactionApi';
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
  RefreshCw,
  DollarSign,
  XCircle
} from 'lucide-react';

const StatementDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [statement, setStatement] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load statement data from API
  useEffect(() => {
    loadStatement();
  }, [id]);

  // Load transactions when statement is loaded or changes
  useEffect(() => {
    if (statement && (statement._id || statement.id)) {
      loadTransactions();
    }
  }, [statement?._id, statement?.id, id]);

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

  const loadTransactions = async () => {
    try {
      setIsLoadingTransactions(true);
      const statementId = statement?._id || statement?.id || id;
      console.log('Loading transactions for statement ID:', statementId);
      
      const response = await getStatementTransactions(statementId);
      console.log('Transactions response:', response);
      
      if (response.success && response.data) {
        // Handle both response formats
        if (response.data.transactions) {
          console.log(`Loaded ${response.data.transactions.length} transactions`);
          setTransactions(response.data.transactions);
        } else if (Array.isArray(response.data)) {
          console.log(`Loaded ${response.data.length} transactions`);
          setTransactions(response.data);
        } else {
          console.warn('Unexpected response format:', response.data);
          setTransactions([]);
        }
      } else {
        console.warn('No transactions found or response not successful:', response);
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      console.error('Error details:', error.response?.data);
      setTransactions([]);
      // Don't set error state for transactions, just log it
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const handleDownloadStatement = async () => {
    try {
      // Ensure statement is loaded
      if (!statement) {
        alert('Statement data not loaded. Please wait for the page to load completely.');
        return;
      }
      
      // Try multiple ID formats: _id, id, or use the URL param
      const statementId = statement._id || statement.id || id;
      
      if (!statementId) {
        alert('Statement ID is missing. Please refresh the page and try again.');
        console.error('Statement ID missing. Statement object:', statement);
        console.error('URL param id:', id);
        return;
      }
      
      // Use fileName from statement or fallback to a default name
      const fileName = statement.fileName || statement.filePath?.split('/').pop() || `statement-${statementId}.pdf`;
      
      console.log('Downloading statement:', {
        statementId,
        fileName,
        statement: statement
      });
      
      const blob = await downloadStatement(statementId);
      
      if (!blob || blob.size === 0) {
        alert('Downloaded file is empty');
        return;
      }
      
      downloadFileFromBlob(blob, fileName);
    } catch (error) {
      console.error('Error downloading statement:', error);
      console.error('Error details:', {
        statement: statement,
        id: id,
        error: error.response?.data || error.message,
        status: error.response?.status
      });
      
      let errorMessage = 'Failed to download statement';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`Failed to download statement: ${errorMessage}`);
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

  const handleProcessStatement = async () => {
    if (!statement) {
      setError('Statement data not loaded');
      return;
    }
    
    const statementId = statement._id || statement.id || id;
    if (!statementId) {
      setError('Statement ID is missing');
      return;
    }
    
    if (window.confirm('Process this statement to extract transactions and account data from the PDF?')) {
      try {
        setIsProcessing(true);
        setError('');
        console.log('Processing statement with ID:', statementId);
        const response = await processStatement(statementId);
        console.log('Process response:', response);
        
        if (response.success) {
          const transactionCount = response.transactions || response.data?.transactions || 0;
          alert(`Statement processed successfully! Found ${transactionCount} transactions.`);
          
          // Reload statement first - this will trigger useEffect to reload transactions
          await loadStatement();
          
          // Also explicitly reload transactions after a short delay to ensure they're saved
          setTimeout(() => {
            console.log('Reloading transactions after process...');
            loadTransactions();
          }, 1000);
        } else {
          setError(response.message || 'Failed to process statement');
        }
      } catch (error) {
        console.error('Error processing statement:', error);
        setError(error.response?.data?.message || error.message || 'Failed to process statement');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleReprocessStatement = async () => {
    if (!statement) {
      setError('Statement data not loaded');
      return;
    }
    
    const statementId = statement._id || statement.id || id;
    if (!statementId) {
      setError('Statement ID is missing');
      return;
    }
    
    if (window.confirm('Reprocess this statement? This will delete existing transactions and extract them again from the PDF.')) {
      try {
        setIsProcessing(true);
        setError('');
        console.log('Reprocessing statement with ID:', statementId);
        const response = await reprocessStatement(statementId);
        console.log('Reprocess response:', response);
        
        if (response.success) {
          const transactionCount = response.transactions || response.data?.transactions || 0;
          alert(`Statement reprocessed successfully! Found ${transactionCount} transactions.`);
          
          // Reload statement first - this will trigger useEffect to reload transactions
          await loadStatement();
          
          // Also explicitly reload transactions after a short delay to ensure they're saved
          setTimeout(() => {
            console.log('Reloading transactions after reprocess...');
            loadTransactions();
          }, 1000);
        } else {
          setError(response.message || 'Failed to reprocess statement');
        }
      } catch (error) {
        console.error('Error reprocessing statement:', error);
        console.error('Error details:', error.response?.data);
        setError(error.response?.data?.message || error.message || 'Failed to reprocess statement');
      } finally {
        setIsProcessing(false);
      }
    }
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
                {(statement.status === 'uploaded' || statement.status === 'failed') && (
                  <Button 
                    onClick={handleProcessStatement}
                    className="flex items-center bg-green-600 hover:bg-green-700 text-white"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Process Statement
                  </Button>
                )}
                {(statement.status === 'processed' || statement.status === 'failed') && (
                  <Button 
                    onClick={handleReprocessStatement}
                    className="flex items-center bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Reprocess
                  </Button>
                )}
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
                        <p className="font-medium text-gray-900">
                          {statement.fileName || statement.filePath?.split('/').pop() || 'Unknown file'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {statement.fileSize ? formatFileSize(statement.fileSize) : 'Size unknown'}
                        </p>
                        {statement._id && (
                          <p className="text-xs text-gray-400 mt-1">ID: {statement._id}</p>
                        )}
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
                    {Object.entries(statement.extractedData).map(([key, value]) => {
                      // Format currency amounts
                      const currency = statement.extractedData.currency || 'USD';
                      let displayValue = value;
                      
                      if (typeof value === 'number' && ['cardLimit', 'availableLimit', 'outstandingAmount', 'minimumPayment', 'totalAmount'].includes(key)) {
                        displayValue = formatAmount(value, currency);
                      } else if (typeof value === 'number') {
                        displayValue = value.toLocaleString();
                      } else if (key === 'dueDate' && value) {
                        displayValue = new Date(value).toLocaleDateString();
                      }
                      
                      return (
                        <div key={key} className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-600 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </p>
                          <p className="text-gray-900">
                            {displayValue}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Transactions Section */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Transactions</h3>
                  {transactions.length > 0 && (
                    <span className="text-sm text-gray-500">
                      {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                
                {isLoadingTransactions ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading transactions...</span>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No transactions found for this statement.</p>
                    {statement.status === 'uploaded' && (
                      <p className="text-sm mt-2">Process the statement to extract transactions.</p>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    {(() => {
                      const hasBalance = transactions.some(t => t.balance !== undefined && t.balance !== null);
                      return (
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Description
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Category
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              {hasBalance && (
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Balance
                                </th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {transactions.map((transaction) => (
                            <tr key={transaction._id} className="hover:bg-gray-50">
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div className="flex items-center">
                                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                  {formatDate(transaction.date)}
                                </div>
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-900">
                                <div className="max-w-xs truncate" title={transaction.description}>
                                  {transaction.description}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {formatAmount(transaction.amount, transaction.currency || statement?.extractedData?.currency || 'USD')}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(transaction.category)}`}>
                                  {getCategoryLabel(transaction.category)}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  {transaction.verified ? (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <XCircle className="w-5 h-5 text-gray-400" />
                                  )}
                                  <span className="ml-2 text-sm text-gray-900">
                                    {transaction.verified ? 'Verified' : 'Unverified'}
                                  </span>
                                </div>
                              </td>
                              {hasBalance && (
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {transaction.balance !== undefined && transaction.balance !== null 
                                    ? formatAmount(transaction.balance, transaction.currency || statement?.extractedData?.currency || 'USD') 
                                    : '-'}
                                </td>
                              )}
                            </tr>
                            ))}
                          </tbody>
                          {transactions.length > 0 && (
                            <tfoot className="bg-gray-50">
                              <tr>
                                <td colSpan={hasBalance ? 6 : 5} className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                                  Total: {formatAmount(transactions.reduce((sum, t) => sum + (t.amount || 0), 0), statement?.extractedData?.currency || transactions[0]?.currency || 'USD')}
                                </td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      );
                    })()}
                  </div>
                )}
              </div>
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
