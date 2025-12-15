import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/ui/Header';
import { 
  createCardholder, 
  updateCardholder,
  getCardholder,
  validateCardholderData, 
  formatCardholderData 
} from '../../utils/cardholderApi';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Users,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  CreditCard,
  Plus
} from 'lucide-react';

const AddCardholder = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [formData, setFormData] = useState({
    name: '',
    emails: [{ email: '', note: '' }],
    phones: [{ phone: '', note: '' }],
    address: '',
    dob: '',
    fatherName: '',
    motherName: '',
    panCardNumber: '',
    aadharNumber: '',
    notes: '',
    cards: []
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Load existing cardholder for edit mode
  useEffect(() => {
    const loadExisting = async () => {
      if (!isEdit) return;
      try {
        const resp = await getCardholder(id);
        if (resp.success) {
          const ch = resp.data.cardholder || resp.data;
          setFormData({
            name: ch.name || '',
            emails: ch.emails && ch.emails.length > 0 
              ? ch.emails 
              : (ch.email ? [{ email: ch.email, note: 'Primary' }] : [{ email: '', note: '' }]),
            phones: ch.phones && ch.phones.length > 0 
              ? ch.phones 
              : (ch.phone ? [{ phone: ch.phone, note: 'Primary' }] : [{ phone: '', note: '' }]),
            address: ch.address || '',
            dob: ch.dob ? String(ch.dob).slice(0, 10) : '',
            fatherName: ch.fatherName || '',
            motherName: ch.motherName || '',
            panCardNumber: ch.panCardNumber || '',
            aadharNumber: ch.aadharNumber || '',
            notes: ch.notes || '',
            cards: ch.banks || ch.cards || []
          });
        }
      } catch (e) {
        console.error('Failed to load cardholder for edit:', e);
      }
    };
    loadExisting();
  }, [id, isEdit]);

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Validate emails - at least one required
    const validEmails = formData.emails.filter(e => e.email && e.email.trim());
    if (validEmails.length === 0) {
      newErrors.emails = 'At least one email is required';
    } else {
      // Validate each email format
      formData.emails.forEach((emailObj, index) => {
        if (emailObj.email && emailObj.email.trim() && !/\S+@\S+\.\S+/.test(emailObj.email)) {
          newErrors[`email_${index}`] = 'Please enter a valid email address';
        }
      });
    }

    // Validate phones - at least one required
    const validPhones = formData.phones.filter(p => p.phone && p.phone.trim());
    if (validPhones.length === 0) {
      newErrors.phones = 'At least one phone number is required';
    } else {
      // Validate each phone format
      formData.phones.forEach((phoneObj, index) => {
        if (phoneObj.phone && phoneObj.phone.trim() && !/^\+?[\d\s\-\(\)]{10,}$/.test(phoneObj.phone)) {
          newErrors[`phone_${index}`] = 'Please enter a valid phone number';
        }
      });
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.dob) {
      newErrors.dob = 'Date of Birth is required';
    } else {
      const dobDate = new Date(formData.dob);
      const today = new Date();
      const age = today.getFullYear() - dobDate.getFullYear();
      if (age < 18) {
        newErrors.dob = 'Cardholder must be at least 18 years old';
      }
    }

    if (!formData.fatherName.trim()) {
      newErrors.fatherName = 'Father\'s name is required';
    }

    if (!formData.motherName.trim()) {
      newErrors.motherName = 'Mother\'s name is required';
    }

    // Validate PAN if provided
    if (formData.panCardNumber && formData.panCardNumber.trim()) {
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panCardNumber.toUpperCase())) {
        newErrors.panCardNumber = 'Please enter a valid PAN card number (e.g., ABCDE1234F)';
      }
    }

    // Validate Aadhar if provided
    if (formData.aadharNumber && formData.aadharNumber.trim()) {
      if (!/^\d{12}$/.test(formData.aadharNumber)) {
        newErrors.aadharNumber = 'Please enter a valid Aadhar number (12 digits)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle email array changes
  const handleEmailChange = (index, field, value) => {
    setFormData(prev => {
      const newEmails = [...prev.emails];
      newEmails[index] = { ...newEmails[index], [field]: value };
      return { ...prev, emails: newEmails };
    });
    if (errors[`email_${index}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`email_${index}`];
        return newErrors;
      });
    }
  };

  // Handle phone array changes
  const handlePhoneChange = (index, field, value) => {
    setFormData(prev => {
      const newPhones = [...prev.phones];
      newPhones[index] = { ...newPhones[index], [field]: value };
      return { ...prev, phones: newPhones };
    });
    if (errors[`phone_${index}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`phone_${index}`];
        return newErrors;
      });
    }
  };

  // Add new email
  const addEmail = () => {
    setFormData(prev => ({
      ...prev,
      emails: [...prev.emails, { email: '', note: '' }]
    }));
  };

  // Remove email
  const removeEmail = (index) => {
    if (formData.emails.length > 1) {
      setFormData(prev => ({
        ...prev,
        emails: prev.emails.filter((_, i) => i !== index)
      }));
    }
  };

  // Add new phone
  const addPhone = () => {
    setFormData(prev => ({
      ...prev,
      phones: [...prev.phones, { phone: '', note: '' }]
    }));
  };

  // Remove phone
  const removePhone = (index) => {
    if (formData.phones.length > 1) {
      setFormData(prev => ({
        ...prev,
        phones: prev.phones.filter((_, i) => i !== index)
      }));
    }
  };

  // Handle card changes
  const handleCardChange = (index, field, value) => {
    setFormData(prev => {
      const newCards = [...prev.cards];
      newCards[index] = { ...newCards[index], [field]: value };
      return { ...prev, cards: newCards };
    });
  };

  // Add new card
  const addCard = () => {
    setFormData(prev => ({
      ...prev,
      cards: [...prev.cards, {
        bankName: '',
        type: 'NORMAL',
        cardNumber: '',
        exp: '',
        cvv: '',
        cardLimit: '',
        statementDate: '',
        dueDate: ''
      }]
    }));
  };

  // Remove card
  const removeCard = (index) => {
    setFormData(prev => ({
      ...prev,
      cards: prev.cards.filter((_, i) => i !== index)
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    const validation = validateCardholderData(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Format data for API
      const formattedData = formatCardholderData(formData);

      let response;
      if (isEdit) {
        response = await updateCardholder(id, formattedData);
      } else {
        response = await createCardholder(formattedData);
      }

      if (response.success) {
        alert(isEdit ? 'Cardholder updated successfully!' : 'Cardholder added successfully!');
        navigate('/cardholders');
      }

    } catch (error) {
      console.error('Error adding cardholder:', error);
      const errorMessage = error.response?.data?.message || (isEdit ? 'Failed to update cardholder. Please try again.' : 'Failed to add cardholder. Please try again.');
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/cardholders');
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
                  <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
                    <User className="w-10 h-10 mr-3 text-blue-600" />
                    {isEdit ? 'Edit Cardholder' : 'Add New Cardholder'}
                  </h1>
                  <p className="text-lg text-gray-600">
                    {isEdit ? 'Update the cardholder information' : 'Enter the required cardholder information'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information Section */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <User className="w-6 h-6 mr-2 text-blue-600" />
                  Personal Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter full name"
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Multiple Emails */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Addresses * (At least 1 required)
                    </label>
                    {formData.emails.map((emailObj, index) => (
                      <div key={index} className="mb-3 flex gap-2">
                        <div className="flex-1 relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="email"
                            value={emailObj.email}
                            onChange={(e) => handleEmailChange(index, 'email', e.target.value)}
                            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              errors[`email_${index}`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter email address"
                          />
                        </div>
                        <input
                          type="text"
                          value={emailObj.note}
                          onChange={(e) => handleEmailChange(index, 'note', e.target.value)}
                          className="w-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Note (optional)"
                        />
                        {formData.emails.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEmail(index)}
                            className="px-3 py-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addEmail}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Another Email
                    </button>
                    {errors.emails && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.emails}
                      </p>
                    )}
                  </div>

                  {/* Multiple Phones */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Numbers * (At least 1 required)
                    </label>
                    {formData.phones.map((phoneObj, index) => (
                      <div key={index} className="mb-3 flex gap-2">
                        <div className="flex-1 relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="tel"
                            value={phoneObj.phone}
                            onChange={(e) => handlePhoneChange(index, 'phone', e.target.value)}
                            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              errors[`phone_${index}`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter phone number"
                          />
                        </div>
                        <input
                          type="text"
                          value={phoneObj.note}
                          onChange={(e) => handlePhoneChange(index, 'note', e.target.value)}
                          className="w-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Note (optional)"
                        />
                        {formData.phones.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePhone(index)}
                            className="px-3 py-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addPhone}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Another Phone
                    </button>
                    {errors.phones && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.phones}
                      </p>
                    )}
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.dob ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.dob && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.dob}
                      </p>
                    )}
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows={3}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.address ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter complete address"
                      />
                    </div>
                    {errors.address && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.address}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Family Information Section */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Users className="w-6 h-6 mr-2 text-green-600" />
                  Family Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Father's Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Father's Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        name="fatherName"
                        value={formData.fatherName}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.fatherName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter father's name"
                      />
                    </div>
                    {errors.fatherName && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.fatherName}
                      </p>
                    )}
                  </div>

                  {/* Mother's Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mother's Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        name="motherName"
                        value={formData.motherName}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.motherName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter mother's name"
                      />
                    </div>
                    {errors.motherName && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.motherName}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Information Section */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <User className="w-6 h-6 mr-2 text-purple-600" />
                  Additional Information (Optional)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* PAN Card Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PAN Card Number
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        name="panCardNumber"
                        value={formData.panCardNumber}
                        onChange={handleChange}
                        maxLength={10}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.panCardNumber ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="ABCDE1234F"
                        style={{ textTransform: 'uppercase' }}
                      />
                    </div>
                    {errors.panCardNumber && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.panCardNumber}
                      </p>
                    )}
                  </div>

                  {/* Aadhar Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Aadhar Number
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        name="aadharNumber"
                        value={formData.aadharNumber}
                        onChange={handleChange}
                        maxLength={12}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.aadharNumber ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="123456789012"
                      />
                    </div>
                    {errors.aadharNumber && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.aadharNumber}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Cards Section */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <CreditCard className="w-6 h-6 mr-2 text-green-600" />
                  Cards
                </h3>
                
                {formData.cards.map((card, index) => (
                  <div key={index} className="mb-6 p-6 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">Card {index + 1}</h4>
                      {formData.cards.length > 0 && (
                        <button
                          type="button"
                          onClick={() => removeCard(index)}
                          className="px-3 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-sm"
                        >
                          Remove Card
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bank *</label>
                        <input
                          type="text"
                          value={card.bankName || ''}
                          onChange={(e) => handleCardChange(index, 'bankName', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Bank Name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                        <select
                          value={card.type || 'NORMAL'}
                          onChange={(e) => handleCardChange(index, 'type', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="NORMAL">NORMAL</option>
                          <option value="FD">FD</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Card Number *</label>
                        <input
                          type="text"
                          value={card.cardNumber || ''}
                          onChange={(e) => handleCardChange(index, 'cardNumber', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Card Number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Expiry (MM/YY)</label>
                        <input
                          type="text"
                          value={card.exp || ''}
                          onChange={(e) => handleCardChange(index, 'exp', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="MM/YY"
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                        <input
                          type="text"
                          value={card.cvv || ''}
                          onChange={(e) => handleCardChange(index, 'cvv', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="CVV"
                          maxLength={4}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Limit *</label>
                        <input
                          type="number"
                          value={card.cardLimit || ''}
                          onChange={(e) => handleCardChange(index, 'cardLimit', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Card Limit"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Statement Date (Day of Month)</label>
                        <input
                          type="number"
                          value={card.statementDate || ''}
                          onChange={(e) => handleCardChange(index, 'statementDate', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="1-31"
                          min="1"
                          max="31"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Due Date (Day of Month)</label>
                        <input
                          type="number"
                          value={card.dueDate || ''}
                          onChange={(e) => handleCardChange(index, 'dueDate', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="1-31"
                          min="1"
                          max="31"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addCard}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center"
                >
                  <Plus className="w-5 h-5 mr-2 text-blue-600" />
                  Add Card
                </button>
              </div>

              {/* Additional Notes Section */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <AlertCircle className="w-6 h-6 mr-2 text-gray-600" />
                  Additional Notes (Optional)
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter any additional notes or comments"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isEdit ? 'Saving...' : 'Adding...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {isEdit ? 'Save Changes' : 'Add Cardholder'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Form Summary */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Required Information Summary
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <p className="font-medium">Personal Information:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Full Name</li>
                  <li>Email Address</li>
                  <li>Phone Number</li>
                  <li>Date of Birth (18+ years)</li>
                  <li>Complete Address</li>
                </ul>
              </div>
              <div>
                <p className="font-medium">Family Information:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Father's Name</li>
                  <li>Mother's Name</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AddCardholder;
