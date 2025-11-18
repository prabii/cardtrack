import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getStatements, 
  getStatusColor, 
  getStatusOptions,
  getMonthOptions,
  getYearOptions,
  formatFileSize,
  downloadStatement,
  downloadFileFromBlob
} from '../../utils/statementApi';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Download, 
  Trash2,
  Calendar,
  User,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  ExternalLink
} from 'lucide-react';

const Statements = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [statements, setStatements] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({});
  const [selectedStatements, setSelectedStatements] = useState([]);

  // Load statements from API
  useEffect(() => {
    loadStatements();
  }, [searchTerm, filterStatus, filterMonth, filterYear]);

  const loadStatements = async () => {
    try {
      setIsLoading(true);
      setError('');
      const params = {
        page: 1,
        limit: 50
      };

      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterMonth !== 'all') params.month = filterMonth;
      if (filterYear !== 'all') params.year = parseInt(filterYear);

      console.log('Loading statements with params:', params);
      const response = await getStatements(params);
      console.log('Statements response:', response);
      
      if (response.success) {
        const statementsData = response.data || [];
        // Ensure all statements have _id
        const validStatements = statementsData.map(stmt => ({
          ...stmt,
          _id: stmt._id || stmt.id
        })).filter(stmt => stmt._id); // Filter out any without ID
        
        console.log(`Loaded ${validStatements.length} statements`);
        setStatements(validStatements);
        setStats(response.stats || {});
      } else {
        setError(response.message || 'Failed to load statements');
      }
    } catch (error) {
      console.error('Error loading statements:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      
      if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (error.response?.status === 403) {
        setError('Access denied. You do not have permission to view statements.');
      } else if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        setError('Unable to connect to server. Please check if the backend server is running.');
      } else {
        setError(error.response?.data?.message || error.message || 'Failed to load statements');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadStatement = () => {
    navigate('/statements/upload');
  };

  const handleViewStatement = (statement, e) => {
    if (!statement || !statement._id) {
      alert('Invalid statement data');
      return;
    }

    const statementId = statement._id || statement.id;
    if (!statementId) {
      alert('Statement ID is missing');
      return;
    }

    // Open in new tab if Ctrl/Cmd key is pressed, otherwise navigate normally
    if (e?.ctrlKey || e?.metaKey) {
      window.open(`/statements/${statementId}`, '_blank');
    } else {
      navigate(`/statements/${statementId}`);
    }
  };

  const handleDownloadStatement = async (statement) => {
    if (!statement || !statement._id) {
      alert('Invalid statement data');
      return;
    }

    try {
      const statementId = statement._id || statement.id;
      const fileName = statement.fileName || statement.filePath?.split('/').pop() || `statement-${statementId}.pdf`;
      
      console.log('Downloading statement:', statementId, fileName);
      const blob = await downloadStatement(statementId);
      
      if (!blob || blob.size === 0) {
        alert('Downloaded file is empty');
        return;
      }
      
      downloadFileFromBlob(blob, fileName);
    } catch (error) {
      console.error('Error downloading statement:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to download statement';
      alert(`Failed to download statement: ${errorMessage}`);
    }
  };

  const handleDeleteStatement = async (statement) => {
    if (!statement || !statement._id) {
      alert('Invalid statement data');
      return;
    }

    if (window.confirm('Are you sure you want to delete this statement? This action cannot be undone.')) {
      try {
        const { deleteStatement } = await import('../../utils/statementApi');
        await deleteStatement(statement._id);
        alert('Statement deleted successfully');
        loadStatements();
      } catch (error) {
        console.error('Error deleting statement:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to delete statement';
        alert(`Failed to delete statement: ${errorMessage}`);
      }
    }
  };

  const handleSelectStatement = (statementId) => {
    setSelectedStatements(prev => 
      prev.includes(statementId) 
        ? prev.filter(id => id !== statementId)
        : [...prev, statementId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStatements.length === statements.length) {
      setSelectedStatements([]);
    } else {
      setSelectedStatements(statements.map(s => s._id));
    }
  };

  const statusOptions = getStatusOptions();
  const monthOptions = getMonthOptions();
  const yearOptions = getYearOptions();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Statements Management</h1>
                <p className="text-lg text-gray-600">Upload and manage credit card statements</p>
              </div>
              {/* Only show Upload button for Members, Admin, and Manager (not Operator) */}
              {user?.role !== 'operator' && (
                <Button onClick={handleUploadStatement} className="flex items-center space-x-2">
                  <Plus size={20} />
                  <span>Upload Statement</span>
                </Button>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              <span className="flex-1">{error}</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={loadStatements}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Retry
                </button>
                <button
                  onClick={() => setError('')}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Statements</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.byStatus?.reduce((sum, stat) => sum + stat.count, 0) || 0}
                </p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Processed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.byStatus?.find(s => s._id === 'processed')?.count || 0}
                </p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Processing</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.byStatus?.find(s => s._id === 'processing')?.count || 0}
                </p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Overdue</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.overdueCount || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search statements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Months</option>
                {monthOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Years</option>
                {yearOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <Button 
                variant="outline" 
                onClick={loadStatements}
                className="flex items-center justify-center space-x-2"
              >
                <Filter size={16} />
                <span>Apply</span>
              </Button>
            </div>
          </div>

          {/* Statements Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Statements</h3>
                {selectedStatements.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {selectedStatements.length} selected
                    </span>
                    <Button variant="outline" size="sm">
                      Bulk Actions
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedStatements.length === statements.length && statements.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cardholder
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Month/Year
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bank/Card
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deadline
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uploaded
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span className="ml-2 text-gray-600">Loading statements...</span>
                        </div>
                      </td>
                    </tr>
                  ) : statements.length > 0 ? (
                    statements.map((statement) => (
                      <tr key={statement._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedStatements.includes(statement._id)}
                            onChange={() => handleSelectStatement(statement._id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="w-5 h-5 mr-2 text-gray-500" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {statement.cardholder?.name || 'Unknown'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {statement.cardholder?.email || ''}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="w-5 h-5 mr-2 text-gray-500" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {statement.month} {statement.year}
                              </div>
                              <div className="text-sm text-gray-500">
                                {statement.timePeriod?.startDate && statement.timePeriod?.endDate
                                  ? `${new Date(statement.timePeriod.startDate).toLocaleDateString()} - ${new Date(statement.timePeriod.endDate).toLocaleDateString()}`
                                  : 'N/A'
                                }
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <CreditCard className="w-5 h-5 mr-2 text-gray-500" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {statement.bankName}
                              </div>
                              <div className="text-sm text-gray-500">
                                ****{statement.cardDigits}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(statement.status)}`}>
                            {statement.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>
                            <div className="font-medium">{statement.fileName}</div>
                            <div>{formatFileSize(statement.fileSize)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {statement.deadline ? new Date(statement.deadline).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>
                            <div>{new Date(statement.createdAt).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-400">
                              by {statement.uploadedBy?.name || 'Unknown'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={(e) => handleViewStatement(statement, e)}
                              title="View Statement (Ctrl+Click to open in new tab)"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`/statements/${statement._id}`, '_blank');
                              }}
                              title="Open in new tab"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDownloadStatement(statement)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteStatement(statement)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center justify-center py-8">
                          <FileText className="w-12 h-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No statements found</h3>
                          <p className="text-gray-600 mb-4">
                            {searchTerm || filterStatus !== 'all' || filterMonth !== 'all' || filterYear !== 'all'
                              ? 'Try adjusting your search or filter criteria.'
                              : 'Get started by uploading your first statement.'
                            }
                          </p>
                          {!searchTerm && filterStatus === 'all' && filterMonth === 'all' && filterYear === 'all' && (
                            <Button onClick={handleUploadStatement} className="flex items-center space-x-2">
                              <Plus size={16} />
                              <span>Upload Statement</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Statements;
