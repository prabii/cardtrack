import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Breadcrumb from '../../components/ui/Breadcrumb';
import ContextualActionBar from '../../components/ui/ContextualActionBar';
import CardInformationSection from './components/CardInformationSection';
import BillingSection from './components/BillingSection';
import CardIdentificationSection from './components/CardIdentificationSection';
import SecurityIndicator from './components/SecurityIndicator';
import FormProgress from './components/FormProgress';
import ActionButtons from './components/ActionButtons';

const AddCreditCard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    cardType: '',
    billingDate: '',
    dueDate: '',
    creditLimit: '',
    nickname: '',
    bank: '',
    description: ''
  });

  const [errors, setErrors] = useState({});

  // Mock data for dropdowns
  const cardTypeOptions = [
    { value: 'visa', label: 'Visa' },
    { value: 'mastercard', label: 'Mastercard' },
    { value: 'amex', label: 'American Express' },
    { value: 'discover', label: 'Discover' },
    { value: 'diners', label: 'Diners Club' }
  ];

  const bankOptions = [
    { value: 'chase', label: 'Chase Bank' },
    { value: 'bofa', label: 'Bank of America' },
    { value: 'wells', label: 'Wells Fargo' },
    { value: 'citi', label: 'Citibank' },
    { value: 'capital', label: 'Capital One' },
    { value: 'amex', label: 'American Express' },
    { value: 'discover', label: 'Discover Bank' },
    { value: 'usbank', label: 'U.S. Bank' },
    { value: 'pnc', label: 'PNC Bank' },
    { value: 'td', label: 'TD Bank' }
  ];

  // Auto-detect card type from card number
  useEffect(() => {
    const cardNumber = formData?.cardNumber?.replace(/\s/g, '');
    let detectedType = '';

    if (cardNumber?.startsWith('4')) {
      detectedType = 'visa';
    } else if (cardNumber?.startsWith('5') || cardNumber?.startsWith('2')) {
      detectedType = 'mastercard';
    } else if (cardNumber?.startsWith('34') || cardNumber?.startsWith('37')) {
      detectedType = 'amex';
    } else if (cardNumber?.startsWith('6')) {
      detectedType = 'discover';
    } else if (cardNumber?.startsWith('30')) {
      detectedType = 'diners';
    }

    if (detectedType && detectedType !== formData?.cardType) {
      setFormData(prev => ({ ...prev, cardType: detectedType }));
    }
  }, [formData?.cardNumber]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors?.[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Card Information Validation
    if (!formData?.cardNumber || formData?.cardNumber?.replace(/\s/g, '')?.length < 13) {
      newErrors.cardNumber = 'Please enter a valid card number';
    }

    if (!formData?.expiryDate || !/^\d{2}\/\d{2}$/?.test(formData?.expiryDate)) {
      newErrors.expiryDate = 'Please enter expiry date in MM/YY format';
    } else {
      const [month, year] = formData?.expiryDate?.split('/');
      const currentDate = new Date();
      const currentYear = currentDate?.getFullYear() % 100;
      const currentMonth = currentDate?.getMonth() + 1;
      
      if (parseInt(month) < 1 || parseInt(month) > 12) {
        newErrors.expiryDate = 'Invalid month';
      } else if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
        newErrors.expiryDate = 'Card has expired';
      }
    }

    if (!formData?.cvv || formData?.cvv?.length < 3) {
      newErrors.cvv = 'Please enter a valid CVV';
    }

    if (!formData?.cardholderName?.trim()) {
      newErrors.cardholderName = 'Cardholder name is required';
    }

    if (!formData?.cardType) {
      newErrors.cardType = 'Please select card type';
    }

    // Billing Information Validation
    if (!formData?.billingDate || formData?.billingDate < 1 || formData?.billingDate > 31) {
      newErrors.billingDate = 'Please enter a valid billing date (1-31)';
    }

    if (!formData?.dueDate || formData?.dueDate < 1 || formData?.dueDate > 31) {
      newErrors.dueDate = 'Please enter a valid due date (1-31)';
    }

    if (!formData?.creditLimit || parseFloat(formData?.creditLimit) <= 0) {
      newErrors.creditLimit = 'Please enter a valid credit limit';
    }

    // Card Identification Validation
    if (!formData?.nickname?.trim()) {
      newErrors.nickname = 'Card nickname is required';
    }

    if (!formData?.bank) {
      newErrors.bank = 'Please select issuing bank';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const getCompletedFieldsCount = () => {
    const requiredFields = [
      'cardNumber', 'expiryDate', 'cvv', 'cardholderName', 'cardType',
      'billingDate', 'dueDate', 'creditLimit', 'nickname', 'bank'
    ];
    
    return requiredFields?.filter(field => {
      const value = formData?.[field];
      return value && value?.toString()?.trim() !== '';
    })?.length;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock success - in real app, this would be an API call
      console.log('Card added successfully:', formData);
      
      // Navigate to dashboard with success message
      navigate('/dashboard', { 
        state: { 
          message: `Credit card "${formData?.nickname}" has been added successfully!`,
          type: 'success'
        }
      });
    } catch (error) {
      console.error('Error adding card:', error);
      setErrors({ submit: 'Failed to add credit card. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: '',
      cardType: '',
      billingDate: '',
      dueDate: '',
      creditLimit: '',
      nickname: '',
      bank: '',
      description: ''
    });
    setErrors({});
    setCurrentStep(0);
  };

  const isFormValid = getCompletedFieldsCount() === 10; // 10 required fields
  const totalFields = 10;
  const completedFields = getCompletedFieldsCount();

  // Update current step based on form completion
  useEffect(() => {
    const cardInfoFields = ['cardNumber', 'expiryDate', 'cvv', 'cardholderName', 'cardType'];
    const billingFields = ['billingDate', 'dueDate', 'creditLimit'];
    const identityFields = ['nickname', 'bank'];

    const cardInfoComplete = cardInfoFields?.every(field => formData?.[field]);
    const billingComplete = billingFields?.every(field => formData?.[field]);
    const identityComplete = identityFields?.every(field => formData?.[field]);

    if (identityComplete) {
      setCurrentStep(3);
    } else if (billingComplete) {
      setCurrentStep(2);
    } else if (cardInfoComplete) {
      setCurrentStep(1);
    } else {
      setCurrentStep(0);
    }
  }, [formData]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb />
          <ContextualActionBar />

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Add Credit Card</h1>
            <p className="text-muted-foreground">
              Securely add your credit card information to start tracking expenses and managing payments.
            </p>
          </div>

          <SecurityIndicator />
          
          <FormProgress 
            currentStep={currentStep}
            totalSteps={3}
            completedFields={completedFields}
            totalFields={totalFields}
          />

          {/* Form Sections */}
          <div className="space-y-6">
            <CardInformationSection
              formData={formData}
              handleInputChange={handleInputChange}
              errors={errors}
              cardTypeOptions={cardTypeOptions}
            />

            <BillingSection
              formData={formData}
              handleInputChange={handleInputChange}
              errors={errors}
            />

            <CardIdentificationSection
              formData={formData}
              handleInputChange={handleInputChange}
              errors={errors}
              bankOptions={bankOptions}
            />

            {errors?.submit && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="text-destructive text-sm">{errors?.submit}</p>
              </div>
            )}

            <ActionButtons
              onSubmit={handleSubmit}
              isLoading={isLoading}
              isFormValid={isFormValid}
              onReset={handleReset}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AddCreditCard;