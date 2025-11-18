import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import { getCardholders } from '../../utils/cardholderApi';
import { createBank, validateBankData } from '../../utils/bankApi';
import {
  CreditCard,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  User,
  Building,
  DollarSign,
  Loader2
} from 'lucide-react';

const AddBank = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    cardholder: '',
    bankName: '',
    customBankName: '', // For custom bank name
    cardNumber: '',
    cardType: '',
    cardLimit: '',
    availableLimit: '',
    outstandingAmount: '0',
    currency: 'INR', // Default to Indian Rupees
    customCurrency: '' // For custom currency codes
  });
  const [cardholders, setCardholders] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadCardholders();
    // Check if cardholder is passed via query params
    const urlParams = new URLSearchParams(window.location.search);
    const cardholderId = urlParams.get('cardholder');
    if (cardholderId) {
      setFormData(prev => ({ ...prev, cardholder: cardholderId }));
    }
  }, []);

  const loadCardholders = async () => {
    try {
      const response = await getCardholders({ limit: 100 });
      if (response.success) {
        setCardholders(response.data);
      }
    } catch (err) {
      console.error('Error loading cardholders:', err);
      setMessage({ type: 'error', text: 'Failed to load cardholders for selection.' });
    }
  };

  // Function to get currency symbol
  const getCurrencySymbol = (currencyCode) => {
    const currencySymbols = {
      'INR': '₹',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'CAD': '$',
      'AUD': '$',
      'JPY': '¥',
      'CNY': '¥',
      'SGD': '$',
      'HKD': '$',
      'AED': 'د.إ',
      'SAR': '﷼',
      'CHF': 'CHF',
      'NZD': '$',
      'MXN': '$',
      'BRL': 'R$',
      'ZAR': 'R',
      'KRW': '₩',
      'THB': '฿',
      'MYR': 'RM',
      'PHP': '₱',
      'IDR': 'Rp',
      'VND': '₫',
      'PKR': '₨',
      'BDT': '৳',
      'LKR': '₨',
      'NPR': '₨',
      'MMK': 'K',
      'KWD': 'د.ك',
      'QAR': '﷼',
      'OMR': '﷼',
      'BHD': '.د.ب',
      'JOD': 'د.ا',
      'ILS': '₪',
      'TRY': '₺',
      'RUB': '₽',
      'PLN': 'zł',
      'SEK': 'kr',
      'NOK': 'kr',
      'DKK': 'kr',
      'CZK': 'Kč',
      'HUF': 'Ft',
      'RON': 'lei',
      'BGN': 'лв',
      'HRK': 'kn',
      'RSD': 'дин.',
      'EGP': '£',
      'NGN': '₦',
      'KES': 'KSh',
      'ETB': 'Br',
      'GHS': '₵',
      'TZS': 'TSh',
      'UGX': 'USh',
      'XOF': 'CFA',
      'XAF': 'FCFA',
      'ARS': '$',
      'CLP': '$',
      'COP': '$',
      'PEN': 'S/',
      'UYU': '$U',
      'BOB': 'Bs.',
      'PYG': '₲',
      'CRC': '₡',
      'GTQ': 'Q',
      'HNL': 'L',
      'NIO': 'C$',
      'PAB': 'B/.',
      'DOP': 'RD$',
      'JMD': '$',
      'TTD': 'TT$',
      'BBD': '$',
      'BZD': '$',
      'BSD': '$',
      'BMD': '$',
      'KYD': '$',
      'XCD': '$',
      'AWG': 'ƒ',
      'ANG': 'ƒ',
      'SRD': '$',
      'GYD': '$',
      'FJD': '$',
      'PGK': 'K',
      'SBD': '$',
      'VUV': 'Vt',
      'WST': 'T',
      'TOP': 'T$',
      'XPF': '₣'
    };
    
    // Get currency code (handle custom currency)
    const code = currencyCode === 'OTHER' 
      ? (formData.customCurrency?.toUpperCase() || 'INR')
      : (currencyCode || 'INR');
    
    return currencySymbols[code] || code; // Return symbol or code if not found
  };

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

    // Auto-calculate available limit when card limit or outstanding amount changes
    if (name === 'cardLimit' || name === 'outstandingAmount') {
      const cardLimit = name === 'cardLimit' ? parseFloat(value) || 0 : parseFloat(formData.cardLimit) || 0;
      const outstandingAmount = name === 'outstandingAmount' ? parseFloat(value) || 0 : parseFloat(formData.outstandingAmount) || 0;
      const availableLimit = cardLimit - outstandingAmount;
      
      setFormData(prev => ({
        ...prev,
        availableLimit: availableLimit.toString()
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form data
    const validation = validateBankData(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setMessage({ type: 'error', text: 'Please correct the errors in the form.' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setMessage({ type: '', text: '' });

    try {
      // Prepare data for API
      // Use customCurrency if OTHER is selected, otherwise use selected currency
      const finalCurrency = formData.currency === 'OTHER' 
        ? (formData.customCurrency?.toUpperCase().trim() || 'INR')
        : (formData.currency || 'INR');
      
      // Use customBankName if CUSTOM is selected, otherwise use selected bankName
      const finalBankName = formData.bankName === 'CUSTOM'
        ? (formData.customBankName?.trim() || '')
        : (formData.bankName || '');
      
      // Remove spaces from card number before sending to API
      const cleanCardNumber = formData.cardNumber.replace(/\s/g, '');
      
      const bankData = {
        cardholder: formData.cardholder,
        bankName: finalBankName,
        cardNumber: cleanCardNumber,
        cardType: formData.cardType,
        cardLimit: parseFloat(formData.cardLimit),
        availableLimit: parseFloat(formData.availableLimit),
        outstandingAmount: parseFloat(formData.outstandingAmount),
        currency: finalCurrency // Use final currency (custom or selected)
      };

      const response = await createBank(bankData);

      if (response.success) {
        setMessage({ type: 'success', text: 'Bank added successfully!' });
        setTimeout(() => navigate('/bank-data'), 2000);
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to add bank.' });
      }
    } catch (err) {
      console.error('Error adding bank:', err);
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to add bank. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/bank-data');
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
                  className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors"
                  disabled={isSubmitting}
                >
                  <ArrowLeft size={24} className="text-gray-700" />
                </button>
                <h1 className="text-4xl font-bold text-gray-900">Add New Bank</h1>
              </div>
            </div>
          </div>

          {message.text && (
            <div
              className={`p-4 mb-6 rounded-lg flex items-center space-x-3 ${
                message.type === 'success'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span>{message.text}</span>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Bank Information */}
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Building className="w-6 h-6 mr-2 text-blue-600" /> Bank Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="cardholder" className="block text-sm font-medium text-gray-700 mb-2">
                      Select Cardholder <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <select
                        id="cardholder"
                        name="cardholder"
                        value={formData.cardholder}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 border ${errors.cardholder ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        disabled={isSubmitting}
                      >
                        <option value="">Select a cardholder</option>
                        {cardholders.map(ch => (
                          <option key={ch._id} value={ch._id}>{ch.name}</option>
                        ))}
                      </select>
                    </div>
                    {errors.cardholder && <p className="mt-1 text-sm text-red-600">{errors.cardholder}</p>}
                  </div>

                  <div>
                    <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <select
                        id="bankName"
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 border ${errors.bankName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        disabled={isSubmitting}
                      >
                        <option value="">Select a bank</option>
                        <optgroup label="Indian Banks">
                          <option value="State Bank of India">State Bank of India (SBI)</option>
                          <option value="HDFC Bank">HDFC Bank</option>
                          <option value="ICICI Bank">ICICI Bank</option>
                          <option value="Axis Bank">Axis Bank</option>
                          <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                          <option value="Punjab National Bank">Punjab National Bank (PNB)</option>
                          <option value="Bank of Baroda">Bank of Baroda</option>
                          <option value="Canara Bank">Canara Bank</option>
                          <option value="Union Bank of India">Union Bank of India</option>
                          <option value="Indian Bank">Indian Bank</option>
                          <option value="Indian Overseas Bank">Indian Overseas Bank</option>
                          <option value="Bank of India">Bank of India</option>
                          <option value="Central Bank of India">Central Bank of India</option>
                          <option value="IDBI Bank">IDBI Bank</option>
                          <option value="Yes Bank">Yes Bank</option>
                          <option value="Federal Bank">Federal Bank</option>
                          <option value="South Indian Bank">South Indian Bank</option>
                          <option value="Karur Vysya Bank">Karur Vysya Bank</option>
                          <option value="City Union Bank">City Union Bank</option>
                          <option value="DCB Bank">DCB Bank</option>
                          <option value="RBL Bank">RBL Bank</option>
                          <option value="Bandhan Bank">Bandhan Bank</option>
                          <option value="AU Small Finance Bank">AU Small Finance Bank</option>
                          <option value="Equitas Small Finance Bank">Equitas Small Finance Bank</option>
                          <option value="Ujjivan Small Finance Bank">Ujjivan Small Finance Bank</option>
                        </optgroup>
                        <optgroup label="International Banks">
                          <option value="Chase Bank">Chase Bank (JPMorgan Chase)</option>
                          <option value="Bank of America">Bank of America</option>
                          <option value="Wells Fargo">Wells Fargo</option>
                          <option value="Citibank">Citibank</option>
                          <option value="HSBC">HSBC</option>
                          <option value="Standard Chartered">Standard Chartered</option>
                          <option value="Barclays">Barclays</option>
                          <option value="Deutsche Bank">Deutsche Bank</option>
                          <option value="BNP Paribas">BNP Paribas</option>
                          <option value="Credit Suisse">Credit Suisse</option>
                          <option value="UBS">UBS</option>
                          <option value="Royal Bank of Canada">Royal Bank of Canada</option>
                          <option value="TD Bank">TD Bank</option>
                          <option value="Scotiabank">Scotiabank</option>
                          <option value="Bank of Montreal">Bank of Montreal</option>
                          <option value="CIBC">CIBC</option>
                          <option value="Commonwealth Bank">Commonwealth Bank (Australia)</option>
                          <option value="ANZ Bank">ANZ Bank</option>
                          <option value="Westpac">Westpac</option>
                          <option value="National Australia Bank">National Australia Bank</option>
                          <option value="DBS Bank">DBS Bank (Singapore)</option>
                          <option value="OCBC Bank">OCBC Bank (Singapore)</option>
                          <option value="UOB Bank">UOB Bank (Singapore)</option>
                          <option value="Maybank">Maybank (Malaysia)</option>
                          <option value="CIMB Bank">CIMB Bank</option>
                          <option value="Public Bank">Public Bank</option>
                          <option value="Bangkok Bank">Bangkok Bank</option>
                          <option value="Kasikorn Bank">Kasikorn Bank</option>
                          <option value="Siam Commercial Bank">Siam Commercial Bank</option>
                          <option value="Bank of China">Bank of China</option>
                          <option value="Industrial and Commercial Bank of China">Industrial and Commercial Bank of China</option>
                          <option value="China Construction Bank">China Construction Bank</option>
                          <option value="Agricultural Bank of China">Agricultural Bank of China</option>
                          <option value="Mizuho Bank">Mizuho Bank (Japan)</option>
                          <option value="Sumitomo Mitsui Banking Corporation">Sumitomo Mitsui Banking Corporation</option>
                          <option value="MUFG Bank">MUFG Bank</option>
                        </optgroup>
                        <option value="CUSTOM">Other / Custom Bank</option>
                      </select>
                    </div>
                    {errors.bankName && <p className="mt-1 text-sm text-red-600">{errors.bankName}</p>}
                    {formData.bankName === 'CUSTOM' && (
                      <div className="mt-2">
                        <input
                          type="text"
                          id="customBankName"
                          name="customBankName"
                          value={formData.customBankName}
                          onChange={(e) => setFormData(prev => ({ ...prev, customBankName: e.target.value }))}
                          className={`w-full px-4 py-2 border ${errors.customBankName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                          placeholder="Enter custom bank name"
                          disabled={isSubmitting}
                        />
                        {errors.customBankName && <p className="mt-1 text-sm text-red-600">{errors.customBankName}</p>}
                      </div>
                    )}
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
                        onChange={(e) => {
                          // Remove all non-digit characters
                          const value = e.target.value.replace(/\D/g, '');
                          // Format as XXXX XXXX XXXX XXXX (16 digits max)
                          let formatted = value;
                          if (value.length > 0) {
                            formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                            // Limit to 19 characters (16 digits + 3 spaces)
                            if (formatted.length > 19) {
                              formatted = formatted.substring(0, 19);
                            }
                          }
                          setFormData(prev => ({ ...prev, cardNumber: formatted }));
                          // Clear error when user starts typing
                          if (errors.cardNumber) {
                            setErrors(prev => ({ ...prev, cardNumber: '' }));
                          }
                        }}
                        className={`w-full pl-10 pr-4 py-3 border ${errors.cardNumber ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono`}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        disabled={isSubmitting}
                      />
                    </div>
                    {errors.cardNumber && <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>}
                    <p className="mt-1 text-xs text-gray-500">Enter 16-digit card number (spaces will be added automatically)</p>
                  </div>

                  <div>
                    <label htmlFor="cardType" className="block text-sm font-medium text-gray-700 mb-2">
                      Card Type <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <select
                        id="cardType"
                        name="cardType"
                        value={formData.cardType}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 border ${errors.cardType ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        disabled={isSubmitting}
                      >
                        <option value="">Select card type</option>
                        <option value="Credit">Credit</option>
                        <option value="Debit">Debit</option>
                        <option value="Prepaid">Prepaid</option>
                      </select>
                    </div>
                    {errors.cardType && <p className="mt-1 text-sm text-red-600">{errors.cardType}</p>}
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                  <DollarSign className="w-6 h-6 mr-2 text-green-600" /> Financial Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                      Currency <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <select
                        id="currency"
                        name="currency"
                        value={formData.currency}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 border ${errors.currency ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        disabled={isSubmitting}
                      >
                        <option value="INR">Indian Rupee (₹) - INR</option>
                        <option value="USD">US Dollar ($) - USD</option>
                        <option value="EUR">Euro (€) - EUR</option>
                        <option value="GBP">British Pound (£) - GBP</option>
                        <option value="CAD">Canadian Dollar ($) - CAD</option>
                        <option value="AUD">Australian Dollar ($) - AUD</option>
                        <option value="JPY">Japanese Yen (¥) - JPY</option>
                        <option value="CNY">Chinese Yuan (¥) - CNY</option>
                        <option value="SGD">Singapore Dollar ($) - SGD</option>
                        <option value="HKD">Hong Kong Dollar ($) - HKD</option>
                        <option value="AED">UAE Dirham (د.إ) - AED</option>
                        <option value="SAR">Saudi Riyal (﷼) - SAR</option>
                        <option value="CHF">Swiss Franc (CHF) - CHF</option>
                        <option value="NZD">New Zealand Dollar ($) - NZD</option>
                        <option value="MXN">Mexican Peso ($) - MXN</option>
                        <option value="BRL">Brazilian Real (R$) - BRL</option>
                        <option value="ZAR">South African Rand (R) - ZAR</option>
                        <option value="KRW">South Korean Won (₩) - KRW</option>
                        <option value="THB">Thai Baht (฿) - THB</option>
                        <option value="MYR">Malaysian Ringgit (RM) - MYR</option>
                        <option value="PHP">Philippine Peso (₱) - PHP</option>
                        <option value="IDR">Indonesian Rupiah (Rp) - IDR</option>
                        <option value="VND">Vietnamese Dong (₫) - VND</option>
                        <option value="PKR">Pakistani Rupee (₨) - PKR</option>
                        <option value="BDT">Bangladeshi Taka (৳) - BDT</option>
                        <option value="LKR">Sri Lankan Rupee (₨) - LKR</option>
                        <option value="NPR">Nepalese Rupee (₨) - NPR</option>
                        <option value="MMK">Myanmar Kyat (K) - MMK</option>
                        <option value="KWD">Kuwaiti Dinar (د.ك) - KWD</option>
                        <option value="QAR">Qatari Riyal (﷼) - QAR</option>
                        <option value="OMR">Omani Rial (﷼) - OMR</option>
                        <option value="BHD">Bahraini Dinar (.د.ب) - BHD</option>
                        <option value="JOD">Jordanian Dinar (د.ا) - JOD</option>
                        <option value="ILS">Israeli Shekel (₪) - ILS</option>
                        <option value="TRY">Turkish Lira (₺) - TRY</option>
                        <option value="RUB">Russian Ruble (₽) - RUB</option>
                        <option value="PLN">Polish Zloty (zł) - PLN</option>
                        <option value="SEK">Swedish Krona (kr) - SEK</option>
                        <option value="NOK">Norwegian Krone (kr) - NOK</option>
                        <option value="DKK">Danish Krone (kr) - DKK</option>
                        <option value="CZK">Czech Koruna (Kč) - CZK</option>
                        <option value="HUF">Hungarian Forint (Ft) - HUF</option>
                        <option value="RON">Romanian Leu (lei) - RON</option>
                        <option value="BGN">Bulgarian Lev (лв) - BGN</option>
                        <option value="HRK">Croatian Kuna (kn) - HRK</option>
                        <option value="RSD">Serbian Dinar (дин.) - RSD</option>
                        <option value="EGP">Egyptian Pound (£) - EGP</option>
                        <option value="NGN">Nigerian Naira (₦) - NGN</option>
                        <option value="KES">Kenyan Shilling (KSh) - KES</option>
                        <option value="ETB">Ethiopian Birr (Br) - ETB</option>
                        <option value="GHS">Ghanaian Cedi (₵) - GHS</option>
                        <option value="TZS">Tanzanian Shilling (TSh) - TZS</option>
                        <option value="UGX">Ugandan Shilling (USh) - UGX</option>
                        <option value="XOF">West African CFA Franc (CFA) - XOF</option>
                        <option value="XAF">Central African CFA Franc (FCFA) - XAF</option>
                        <option value="ARS">Argentine Peso ($) - ARS</option>
                        <option value="CLP">Chilean Peso ($) - CLP</option>
                        <option value="COP">Colombian Peso ($) - COP</option>
                        <option value="PEN">Peruvian Sol (S/) - PEN</option>
                        <option value="UYU">Uruguayan Peso ($U) - UYU</option>
                        <option value="BOB">Bolivian Boliviano (Bs.) - BOB</option>
                        <option value="PYG">Paraguayan Guaraní (₲) - PYG</option>
                        <option value="CRC">Costa Rican Colón (₡) - CRC</option>
                        <option value="GTQ">Guatemalan Quetzal (Q) - GTQ</option>
                        <option value="HNL">Honduran Lempira (L) - HNL</option>
                        <option value="NIO">Nicaraguan Córdoba (C$) - NIO</option>
                        <option value="PAB">Panamanian Balboa (B/.) - PAB</option>
                        <option value="DOP">Dominican Peso (RD$) - DOP</option>
                        <option value="JMD">Jamaican Dollar ($) - JMD</option>
                        <option value="TTD">Trinidad and Tobago Dollar (TT$) - TTD</option>
                        <option value="BBD">Barbadian Dollar ($) - BBD</option>
                        <option value="BZD">Belize Dollar ($) - BZD</option>
                        <option value="BSD">Bahamian Dollar ($) - BSD</option>
                        <option value="BMD">Bermudian Dollar ($) - BMD</option>
                        <option value="KYD">Cayman Islands Dollar ($) - KYD</option>
                        <option value="XCD">East Caribbean Dollar ($) - XCD</option>
                        <option value="AWG">Aruban Florin (ƒ) - AWG</option>
                        <option value="ANG">Netherlands Antillean Guilder (ƒ) - ANG</option>
                        <option value="SRD">Surinamese Dollar ($) - SRD</option>
                        <option value="GYD">Guyanese Dollar ($) - GYD</option>
                        <option value="FJD">Fijian Dollar ($) - FJD</option>
                        <option value="PGK">Papua New Guinean Kina (K) - PGK</option>
                        <option value="SBD">Solomon Islands Dollar ($) - SBD</option>
                        <option value="VUV">Vanuatu Vatu (Vt) - VUV</option>
                        <option value="WST">Samoan Tala (T) - WST</option>
                        <option value="TOP">Tongan Paʻanga (T$) - TOP</option>
                        <option value="XPF">CFP Franc (₣) - XPF</option>
                        <option value="OTHER">Other Currency - Enter code manually</option>
                      </select>
                    </div>
                    {errors.currency && <p className="mt-1 text-sm text-red-600">{errors.currency}</p>}
                    <p className="mt-1 text-xs text-gray-500">Select currency or choose "Other" to enter a custom currency code</p>
                  </div>
                  {formData.currency === 'OTHER' && (
                    <div>
                      <label htmlFor="customCurrency" className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Currency Code <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          id="customCurrency"
                          name="customCurrency"
                          value={formData.customCurrency || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, customCurrency: e.target.value.toUpperCase() }))}
                          className={`w-full pl-10 pr-4 py-3 border ${errors.customCurrency ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                          placeholder="Enter 3-letter currency code (e.g., BTC, ETH)"
                          maxLength={10}
                          disabled={isSubmitting}
                        />
                      </div>
                      {errors.customCurrency && <p className="mt-1 text-sm text-red-600">{errors.customCurrency}</p>}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="cardLimit" className="block text-sm font-medium text-gray-700 mb-2">
                      Card Limit <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-medium text-lg">
                        {getCurrencySymbol(formData.currency)}
                      </span>
                      <input
                        type="number"
                        id="cardLimit"
                        name="cardLimit"
                        value={formData.cardLimit}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        className={`w-full ${getCurrencySymbol(formData.currency).length > 1 ? 'pl-12' : 'pl-10'} pr-4 py-3 border ${errors.cardLimit ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        placeholder="0.00"
                        disabled={isSubmitting}
                      />
                    </div>
                    {errors.cardLimit && <p className="mt-1 text-sm text-red-600">{errors.cardLimit}</p>}
                  </div>

                  <div>
                    <label htmlFor="outstandingAmount" className="block text-sm font-medium text-gray-700 mb-2">
                      Outstanding Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-medium text-lg">
                        {getCurrencySymbol(formData.currency)}
                      </span>
                      <input
                        type="number"
                        id="outstandingAmount"
                        name="outstandingAmount"
                        value={formData.outstandingAmount}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        className={`w-full ${getCurrencySymbol(formData.currency).length > 1 ? 'pl-12' : 'pl-10'} pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        placeholder="0.00"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="availableLimit" className="block text-sm font-medium text-gray-700 mb-2">
                      Available Limit (Auto-calculated)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-medium text-lg">
                        {getCurrencySymbol(formData.currency)}
                      </span>
                      <input
                        type="number"
                        id="availableLimit"
                        name="availableLimit"
                        value={formData.availableLimit}
                        readOnly
                        className={`w-full ${getCurrencySymbol(formData.currency).length > 1 ? 'pl-12' : 'pl-10'} pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600`}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  disabled={isSubmitting}
                >
                  <ArrowLeft size={20} />
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin w-5 h-5" />
                  ) : (
                    <Save size={20} />
                  )}
                  <span>Add Bank</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AddBank;
