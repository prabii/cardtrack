import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Breadcrumb from '../../components/ui/Breadcrumb';
import ContextualActionBar from '../../components/ui/ContextualActionBar';
import TransactionForm from './components/TransactionForm';
import RecentTransactions from './components/RecentTransactions';
import QuickActions from './components/QuickActions';
import TransactionTips from './components/TransactionTips';
import Icon from '../../components/AppIcon';

const AddTransaction = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Get pre-selected card ID from navigation state
  const selectedCardId = location?.state?.cardId || null;

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  const handleTransactionSubmit = async (transactionData) => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Transaction submitted:', transactionData);
      
      // Show success message
      setShowSuccessMessage(true);
      
      // Hide success message and navigate after delay
      setTimeout(() => {
        setShowSuccessMessage(false);
        
        // Navigate back to the originating screen
        if (selectedCardId) {
          navigate('/card-details', { 
            state: { cardId: selectedCardId, showTransactionAdded: true }
          });
        } else {
          navigate('/dashboard', { 
            state: { showTransactionAdded: true }
          });
        }
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting transaction:', error);
      // Handle error state here
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Navigate back to the originating screen
    if (selectedCardId) {
      navigate('/card-details', { state: { cardId: selectedCardId } });
    } else {
      navigate('/dashboard');
    }
  };

  const customBreadcrumbs = [
    { label: 'Dashboard', path: '/dashboard', icon: 'Home' },
    { label: 'Add Transaction', path: '/add-transaction', current: true }
  ];

  const customActions = [
    {
      label: 'Back to Dashboard',
      icon: 'ArrowLeft',
      variant: 'ghost',
      onClick: () => navigate('/dashboard')
    },
    {
      label: 'View Cards',
      icon: 'CreditCard',
      variant: 'outline',
      onClick: () => navigate('/card-details')
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb customItems={customBreadcrumbs} />
          <ContextualActionBar customActions={customActions} />

          {/* Success Message */}
          {showSuccessMessage && (
            <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-lg">
              <div className="flex items-center">
                <Icon name="CheckCircle" size={20} className="text-success mr-3" />
                <div>
                  <h4 className="font-medium text-success">Transaction Added Successfully!</h4>
                  <p className="text-sm text-success/80 mt-1">
                    Your transaction has been recorded and your card balance has been updated.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mr-4">
                <Icon name="Plus" size={24} className="text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Add Transaction</h1>
                <p className="text-muted-foreground mt-1">
                  Record your spending activity with detailed categorization
                </p>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form - Left Column (2/3 width on desktop) */}
            <div className="lg:col-span-2">
              <TransactionForm
                onSubmit={handleTransactionSubmit}
                onCancel={handleCancel}
                selectedCardId={selectedCardId}
                isLoading={isLoading}
              />
            </div>

            {/* Sidebar - Right Column (1/3 width on desktop) */}
            <div className="space-y-6">
              {/* Recent Transactions */}
              <RecentTransactions />
              
              {/* Quick Actions */}
              <QuickActions />
              
              {/* Transaction Tips */}
              <TransactionTips />
            </div>
          </div>

          {/* Mobile-optimized spacing */}
          <div className="h-8 lg:h-16"></div>
        </div>
      </main>
    </div>
  );
};

export default AddTransaction;