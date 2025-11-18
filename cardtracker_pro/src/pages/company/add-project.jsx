import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { createProject } from '../../utils/companyApi';
import { getCompanies } from '../../utils/companyApi';
import { useRealtime } from '../../contexts/RealtimeContext';

const AddProject = () => {
  const navigate = useNavigate();
  const { trackActivity } = useRealtime();
  const [companies, setCompanies] = useState([]);
  const [formData, setFormData] = useState({
    company: '',
    name: '',
    description: '',
    projectCode: '',
    status: 'planning',
    priority: 'medium',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    estimatedDuration: '',
    budget: '',
    actualCost: '0',
    progress: '0',
    client: {
      name: '',
      email: '',
      phone: '',
      company: ''
    },
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const response = await getCompanies({ limit: 100 });
      if (response.success) {
        setCompanies(response.data.companies || []);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      setMessage({ type: 'error', text: 'Failed to load companies' });
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('client.')) {
      const clientField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        client: {
          ...prev.client,
          [clientField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setMessage({ type: '', text: '' });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.company) {
      newErrors.company = 'Company is required';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }
    if (!formData.projectCode.trim()) {
      newErrors.projectCode = 'Project code is required';
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    if (formData.endDate && formData.startDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    if (formData.budget && parseFloat(formData.budget) < 0) {
      newErrors.budget = 'Budget cannot be negative';
    }
    if (formData.progress && (parseFloat(formData.progress) < 0 || parseFloat(formData.progress) > 100)) {
      newErrors.progress = 'Progress must be between 0 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setMessage({ type: 'error', text: 'Please fix the errors before submitting' });
      return;
    }

    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const cleanedData = {
        company: formData.company,
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        projectCode: formData.projectCode.trim(),
        status: formData.status,
        priority: formData.priority,
        startDate: formData.startDate,
        actualCost: parseFloat(formData.actualCost) || 0,
        progress: parseFloat(formData.progress) || 0
      };

      if (formData.endDate) cleanedData.endDate = formData.endDate;
      if (formData.estimatedDuration) cleanedData.estimatedDuration = parseInt(formData.estimatedDuration);
      if (formData.budget) cleanedData.budget = parseFloat(formData.budget);
      if (formData.notes) cleanedData.notes = formData.notes.trim();

      // Add client info if any field is filled
      const hasClientInfo = Object.values(formData.client).some(val => val.trim() !== '');
      if (hasClientInfo) {
        cleanedData.client = {};
        if (formData.client.name.trim()) cleanedData.client.name = formData.client.name.trim();
        if (formData.client.email.trim()) cleanedData.client.email = formData.client.email.trim();
        if (formData.client.phone.trim()) cleanedData.client.phone = formData.client.phone.trim();
        if (formData.client.company.trim()) cleanedData.client.company = formData.client.company.trim();
      }

      // Remove empty optional fields
      if (!cleanedData.description) delete cleanedData.description;
      if (!cleanedData.endDate) delete cleanedData.endDate;
      if (!cleanedData.estimatedDuration) delete cleanedData.estimatedDuration;
      if (!cleanedData.budget) delete cleanedData.budget;
      if (!cleanedData.notes) delete cleanedData.notes;
      if (!hasClientInfo) delete cleanedData.client;

      const response = await createProject(cleanedData);
      
      if (response.success) {
        setMessage({ type: 'success', text: 'Project created successfully!' });
        trackActivity('company', 'created', 'project', { projectId: response.data._id });
        
        setTimeout(() => {
          navigate('/company');
        }, 1500);
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to create project' });
      }
    } catch (error) {
      console.error('Create project error:', error);
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const validationErrors = {};
        error.response.data.errors.forEach((err) => {
          const field = err.param || err.path;
          if (field) {
            validationErrors[field] = err.msg || err.message;
          }
        });
        setErrors(validationErrors);
        setMessage({ 
          type: 'error', 
          text: `Validation failed: ${error.response.data.errors.map(e => e.msg).join('; ')}` 
        });
      } else {
        const errorMessage = error.response?.data?.message || 
                            'Failed to create project. Please try again.';
        setMessage({ type: 'error', text: errorMessage });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/company')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Company Management
        </button>
        <div className="flex items-center gap-3">
          <FolderIcon className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add New Project</h1>
            <p className="text-gray-600 mt-2">Create a new project for a company</p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircleIcon className="h-5 w-5" />
          ) : (
            <XCircleIcon className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                  Company <span className="text-red-500">*</span>
                </label>
                <select
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.company ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Select a company</option>
                  {companies.map(company => (
                    <option key={company._id} value={company._id}>
                      {company.name}
                    </option>
                  ))}
                </select>
                {errors.company && (
                  <p className="mt-1 text-sm text-red-600">{errors.company}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Project Name"
                    required
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="projectCode" className="block text-sm font-medium text-gray-700 mb-1">
                    Project Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="projectCode"
                    name="projectCode"
                    value={formData.projectCode}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.projectCode ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="PROJ-001"
                    required
                  />
                  {errors.projectCode && (
                    <p className="mt-1 text-sm text-red-600">{errors.projectCode}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Project description"
                />
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.startDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
                )}
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.endDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
                )}
              </div>

              <div>
                <label htmlFor="estimatedDuration" className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Duration (days)
                </label>
                <input
                  type="number"
                  id="estimatedDuration"
                  name="estimatedDuration"
                  value={formData.estimatedDuration}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Days"
                />
              </div>

              <div>
                <label htmlFor="progress" className="block text-sm font-medium text-gray-700 mb-1">
                  Progress (%)
                </label>
                <input
                  type="number"
                  id="progress"
                  name="progress"
                  value={formData.progress}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.progress ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                />
                {errors.progress && (
                  <p className="mt-1 text-sm text-red-600">{errors.progress}</p>
                )}
              </div>
            </div>
          </div>

          {/* Budget Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Budget Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
                  Budget
                </label>
                <input
                  type="number"
                  id="budget"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.budget ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.budget && (
                  <p className="mt-1 text-sm text-red-600">{errors.budget}</p>
                )}
              </div>

              <div>
                <label htmlFor="actualCost" className="block text-sm font-medium text-gray-700 mb-1">
                  Actual Cost
                </label>
                <input
                  type="number"
                  id="actualCost"
                  name="actualCost"
                  value={formData.actualCost}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Information (Optional)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="client.name" className="block text-sm font-medium text-gray-700 mb-1">
                  Client Name
                </label>
                <input
                  type="text"
                  id="client.name"
                  name="client.name"
                  value={formData.client.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Client Name"
                />
              </div>

              <div>
                <label htmlFor="client.email" className="block text-sm font-medium text-gray-700 mb-1">
                  Client Email
                </label>
                <input
                  type="email"
                  id="client.email"
                  name="client.email"
                  value={formData.client.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="client@example.com"
                />
              </div>

              <div>
                <label htmlFor="client.phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Client Phone
                </label>
                <input
                  type="tel"
                  id="client.phone"
                  name="client.phone"
                  value={formData.client.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label htmlFor="client.company" className="block text-sm font-medium text-gray-700 mb-1">
                  Client Company
                </label>
                <input
                  type="text"
                  id="client.company"
                  name="client.company"
                  value={formData.client.company}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Client Company"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes about this project"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/company')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddProject;

