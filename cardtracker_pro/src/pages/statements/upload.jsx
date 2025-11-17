import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import { 
  uploadStatement, 
  validateStatementData, 
  createStatementFormData,
  getMonthOptions,
  getYearOptions
} from '../../utils/statementApi';
import { getCardholders } from '../../utils/cardholderApi';
import { 
  Upload, 
  FileText, 
  User, 
  Calendar, 
  CreditCard, 
  Save, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle,
  X
} from 'lucide-react';

const UploadStatement = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    file: null,
    cardholder: '',
    month: '',
    year: new Date().getFullYear(),
    timePeriod: {
      startDate: '',
      endDate: ''
    },
    cardDigits: '',
    bankName: '',
    cardNumber: '',
    deadline: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cardholders, setCardholders] = useState([]);
  const [isLoadingCardholders, setIsLoadingCardholders] = useState(false);

  const monthOptions = getMonthOptions();
  const yearOptions = getYearOptions();

  // Load cardholders on component mount
  useEffect(() => {
    loadCardholders();
  }, []);

  const loadCardholders = async () => {
    try {
      setIsLoadingCardholders(true);
      const response = await getCardholders({ limit: 100 });
      if (response.success) {
        setCardholders(response.data);
      }
    } catch (error) {
      console.error('Error loading cardholders:', error);
      setErrors({ cardholder: 'Failed to load cardholders' });
    } finally {
      setIsLoadingCardholders(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({
      ...prev,
      file: file
    }));

    if (errors.file) {
      setErrors(prev => ({
        ...prev,
        file: ''
      }));
    }
  };

  const handleMonthChange = (e) => {
    const month = e.target.value;
    setFormData(prev => ({
      ...prev,
      month: month
    }));

    // Auto-calculate time period based on month and year
    if (month && formData.year) {
      const year = formData.year;
      const startDate = new Date(year, monthOptions.findIndex(m => m.value === month), 1);
      const endDate = new Date(year, monthOptions.findIndex(m => m.value === month) + 1, 0);
      
      setFormData(prev => ({
        ...prev,
        timePeriod: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }
      }));
    }
  };

  const handleYearChange = (e) => {
    const year = parseInt(e.target.value);
    setFormData(prev => ({
      ...prev,
      year: year
    }));

    // Auto-calculate time period based on month and year
    if (formData.month && year) {
      const startDate = new Date(year, monthOptions.findIndex(m => m.value === formData.month), 1);
      const endDate = new Date(year, monthOptions.findIndex(m => m.value === formData.month) + 1, 0);
      
      setFormData(prev => ({
        ...prev,
        timePeriod: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('=== FORM SUBMISSION START ===');
    console.log('Form submitted with data:', formData);
    console.log('File selected:', formData.file);
    console.log('File type:', formData.file?.type);
    console.log('File size:', formData.file?.size);
    
    // Test if form submission is working
    alert('Form submitted! Check console for details.');
    
    // Validate form data
    const validation = validateStatementData(formData);
    console.log('Validation result:', validation);
    
    if (!validation.isValid) {
      console.log('Validation errors:', validation.errors);
      setErrors(validation.errors);
      return;
    }

    console.log('Validation passed, starting upload...');
    setIsSubmitting(true);
    setErrors({});

    try {
      // Create form data for upload
      const uploadData = createStatementFormData(formData);
      console.log('Upload data created:', uploadData);
      console.log('FormData entries:');
      for (let [key, value] of uploadData.entries()) {
        console.log(`${key}:`, value);
      }
      
      // Upload statement
      console.log('Sending upload request...');
      const response = await uploadStatement(uploadData);
      console.log('Upload response:', response);
      
      if (response.success) {
        console.log('Upload successful!');
        const message = response.autoProcessed 
          ? `Statement uploaded and processed! Found ${response.transactionsFound || 0} transactions.`
          : 'Statement uploaded successfully! Please process it to extract transactions.';
        alert(message);
        navigate('/statements');
      } else {
        console.log('Upload failed:', response.message);
        setErrors({ submit: response.message || 'Upload failed' });
      }
      
    } catch (error) {
      console.error('=== UPLOAD ERROR ===');
      console.error('Error uploading statement:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload statement. Please try again.';
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
      console.log('=== FORM SUBMISSION END ===');
    }
  };

  const handleCancel = () => {
    navigate('/statements');
  };

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
                  onClick={handleCancel}
                  className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-6 h-6 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">Upload Statement</h1>
                  <p className="text-lg text-gray-600">Upload a new credit card statement</p>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center space-x-3">
              <AlertCircle className="w-5 h-5" />
              <span>{errors.submit}</span>
            </div>
          )}

          {/* Upload Form */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-8" noValidate>
              {/* File Upload Section */}
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Upload className="w-6 h-6 mr-2 text-blue-600" /> File Upload
                </h2>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    id="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="file" className="cursor-pointer">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      {formData.file ? formData.file.name : 'Click to upload PDF file'}
                    </p>
                    <p className="text-sm text-gray-500">
                      PDF files only, max 10MB
                    </p>
                  </label>
                </div>
                {errors.file && <p className="mt-2 text-sm text-red-600">{errors.file}</p>}
              </div>

              {/* Statement Information */}
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-6 h-6 mr-2 text-green-600" /> Statement Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="cardholder" className="block text-sm font-medium text-gray-700 mb-2">
                      Cardholder <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <select
                        id="cardholder"
                        name="cardholder"
                        value={formData.cardholder}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3 border ${errors.cardholder ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        disabled={isLoadingCardholders}
                      >
                        <option value="">Select cardholder</option>
                        {cardholders.map(cardholder => (
                          <option key={cardholder._id} value={cardholder._id}>
                            {cardholder.name} ({cardholder.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.cardholder && <p className="mt-1 text-sm text-red-600">{errors.cardholder}</p>}
                  </div>

                  <div>
                    <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-2">
                      Month <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <select
                        id="month"
                        name="month"
                        value={formData.month}
                        onChange={handleMonthChange}
                        className={`w-full pl-10 pr-4 py-3 border ${errors.month ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      >
                        <option value="">Select month</option>
                        {monthOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.month && <p className="mt-1 text-sm text-red-600">{errors.month}</p>}
                  </div>

                  <div>
                    <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                      Year <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <select
                        id="year"
                        name="year"
                        value={formData.year}
                        onChange={handleYearChange}
                        className={`w-full pl-10 pr-4 py-3 border ${errors.year ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      >
                        {yearOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.year && <p className="mt-1 text-sm text-red-600">{errors.year}</p>}
                  </div>

                  <div>
                    <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
                      Deadline <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="date"
                        id="deadline"
                        name="deadline"
                        value={formData.deadline}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3 border ${errors.deadline ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      />
                    </div>
                    {errors.deadline && <p className="mt-1 text-sm text-red-600">{errors.deadline}</p>}
                  </div>
                </div>
              </div>

              {/* Time Period (Auto-calculated) */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Time Period</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="timePeriod.startDate" className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      id="timePeriod.startDate"
                      name="timePeriod.startDate"
                      value={formData.timePeriod.startDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      readOnly
                    />
                  </div>
                  <div>
                    <label htmlFor="timePeriod.endDate" className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      id="timePeriod.endDate"
                      name="timePeriod.endDate"
                      value={formData.timePeriod.endDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Card Information */}
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                  <CreditCard className="w-6 h-6 mr-2 text-purple-600" /> Card Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        id="bankName"
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3 border ${errors.bankName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        placeholder="e.g., Chase Bank"
                      />
                    </div>
                    {errors.bankName && <p className="mt-1 text-sm text-red-600">{errors.bankName}</p>}
                  </div>

                  <div>
                    <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      Card Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        id="cardNumber"
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3 border ${errors.cardNumber ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        placeholder="e.g., 4532 1234 5678 9012"
                      />
                    </div>
                    {errors.cardNumber && <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>}
                  </div>

                  <div>
                    <label htmlFor="cardDigits" className="block text-sm font-medium text-gray-700 mb-2">
                      Last 4 Digits <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        id="cardDigits"
                        name="cardDigits"
                        value={formData.cardDigits}
                        onChange={handleInputChange}
                        maxLength="4"
                        className={`w-full pl-10 pr-4 py-3 border ${errors.cardDigits ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        placeholder="e.g., 4532"
                      />
                    </div>
                    {errors.cardDigits && <p className="mt-1 text-sm text-red-600">{errors.cardDigits}</p>}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                  <X size={20} className="mr-2" />
                  Cancel
                </Button>
                <button 
                  type="button" 
                  onClick={() => {
                    console.log('Test button clicked!');
                    alert('Test button works!');
                  }}
                  className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                  Test Button
                </button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Save size={20} className="mr-2" />
                      Upload Statement
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UploadStatement;
