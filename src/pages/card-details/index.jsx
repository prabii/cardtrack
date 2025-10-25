import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Breadcrumb from '../../components/ui/Breadcrumb';
import ContextualActionBar from '../../components/ui/ContextualActionBar';
import CardHeader from './components/CardHeader';
import TransactionFilters from './components/TransactionFilters';
import TransactionTable from './components/TransactionTable';
import PaymentHistory from './components/PaymentHistory';
import CardInfoTab from './components/CardInfoTab';
import RecordPaymentModal from './components/RecordPaymentModal';
import Icon from '../../components/AppIcon';


const CardDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('transactions');
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Mock card data - in real app, this would come from props or API
  const mockCard = {
    id: "1",
    name: "Chase Sapphire Preferred",
    cardNumber: "4532123456789012",
    lastFour: "9012",
    type: "Visa",
    expiryDate: "12/26",
    cvv: "123",
    cardholderName: "John Michael Smith",
    currentBalance: 2847.50,
    creditLimit: 15000,
    nextDueDate: "2025-01-15",
    billingDate: 5,
    dueDate: 15,
    interestRate: 18.99,
    annualFee: 95,
    status: "due"
  };

  const mockTransactions = [
    {
      id: "1",
      date: "2025-01-10",
      description: "Amazon Purchase",
      merchant: "Amazon.com",
      category: "shopping",
      amount: -89.99
    },
    {
      id: "2",
      date: "2025-01-09",
      description: "Starbucks Coffee",
      merchant: "Starbucks #1234",
      category: "dining",
      amount: -12.45
    },
    {
      id: "3",
      date: "2025-01-08",
      description: "Shell Gas Station",
      merchant: "Shell #5678",
      category: "gas",
      amount: -45.20
    },
    {
      id: "4",
      date: "2025-01-07",
      description: "Whole Foods Market",
      merchant: "Whole Foods",
      category: "groceries",
      amount: -156.78
    },
    {
      id: "5",
      date: "2025-01-06",
      description: "Netflix Subscription",
      merchant: "Netflix.com",
      category: "entertainment",
      amount: -15.99
    },
    {
      id: "6",
      date: "2025-01-05",
      description: "Payment Received",
      merchant: "Online Payment",
      category: "other",
      amount: 500.00
    },
    {
      id: "7",
      date: "2025-01-04",
      description: "Target Purchase",
      merchant: "Target #9876",
      category: "shopping",
      amount: -78.34
    },
    {
      id: "8",
      date: "2025-01-03",
      description: "Uber Ride",
      merchant: "Uber Technologies",
      category: "travel",
      amount: -23.50
    }
  ];

  const mockPayments = [
    {
      id: "1",
      date: "2025-01-05T10:30:00Z",
      amount: 500.00,
      method: "Bank Transfer",
      status: "completed",
      confirmationNumber: "PAY123456789"
    },
    {
      id: "2",
      date: "2024-12-15T14:22:00Z",
      amount: 1200.00,
      method: "Online Banking",
      status: "completed",
      confirmationNumber: "PAY987654321"
    },
    {
      id: "3",
      date: "2024-11-15T09:15:00Z",
      amount: 850.00,
      method: "Auto Pay",
      status: "completed",
      confirmationNumber: "PAY456789123"
    },
    {
      id: "4",
      date: "2024-10-15T16:45:00Z",
      amount: 950.00,
      method: "Check",
      status: "completed",
      confirmationNumber: "CHK789123456"
    }
  ];

  useEffect(() => {
    setFilteredTransactions(mockTransactions);
  }, []);

  const handleFilterChange = (filters) => {
    let filtered = [...mockTransactions];

    // Search filter
    if (filters?.search) {
      filtered = filtered?.filter(transaction =>
        transaction?.description?.toLowerCase()?.includes(filters?.search?.toLowerCase()) ||
        transaction?.merchant?.toLowerCase()?.includes(filters?.search?.toLowerCase())
      );
    }

    // Category filter
    if (filters?.category) {
      filtered = filtered?.filter(transaction => transaction?.category === filters?.category);
    }

    // Date range filter
    if (filters?.dateFrom) {
      filtered = filtered?.filter(transaction => 
        new Date(transaction.date) >= new Date(filters.dateFrom)
      );
    }

    if (filters?.dateTo) {
      filtered = filtered?.filter(transaction => 
        new Date(transaction.date) <= new Date(filters.dateTo)
      );
    }

    // Amount range filter
    if (filters?.amountMin) {
      filtered = filtered?.filter(transaction => 
        Math.abs(transaction?.amount) >= parseFloat(filters?.amountMin)
      );
    }

    if (filters?.amountMax) {
      filtered = filtered?.filter(transaction => 
        Math.abs(transaction?.amount) <= parseFloat(filters?.amountMax)
      );
    }

    setFilteredTransactions(filtered);
  };

  const handleEditCard = () => {
    setActiveTab('card-info');
  };

  const handleRecordPayment = () => {
    setShowPaymentModal(true);
  };

  const handleAddTransaction = () => {
    navigate('/add-transaction', { 
      state: { 
        cardId: mockCard?.id, 
        cardName: mockCard?.name,
        returnTo: '/card-details'
      } 
    });
  };

  const handleEditTransaction = (transaction) => {
    navigate('/add-transaction', { 
      state: { 
        cardId: mockCard?.id, 
        cardName: mockCard?.name,
        editTransaction: transaction,
        returnTo: '/card-details'
      } 
    });
  };

  const handleDeleteTransaction = (transactionId) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      // In real app, this would make an API call
      console.log('Deleting transaction:', transactionId);
    }
  };

  const handleSaveCard = (cardData) => {
    // In real app, this would make an API call
    console.log('Saving card data:', cardData);
  };

  const handlePaymentSubmit = (paymentData) => {
    // In real app, this would make an API call
    console.log('Recording payment:', paymentData);
  };

  const tabs = [
    { id: 'transactions', label: 'Transactions', icon: 'CreditCard' },
    { id: 'payments', label: 'Payment History', icon: 'DollarSign' },
    { id: 'card-info', label: 'Card Information', icon: 'Info' }
  ];

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'Home' },
    { label: mockCard?.name, path: '/card-details', current: true }
  ];

  const contextualActions = [
    {
      label: 'Add Transaction',
      icon: 'Plus',
      variant: 'default',
      onClick: handleAddTransaction
    },
    {
      label: 'Record Payment',
      icon: 'DollarSign',
      variant: 'outline',
      onClick: handleRecordPayment
    },
    {
      label: 'Edit Card',
      icon: 'Edit',
      variant: 'ghost',
      onClick: handleEditCard
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb customItems={breadcrumbItems} />
          <ContextualActionBar customActions={contextualActions} />
          
          <CardHeader
            card={mockCard}
            onEditCard={handleEditCard}
            onRecordPayment={handleRecordPayment}
          />

          {/* Tabs */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {/* Tab Navigation */}
            <div className="border-b border-border">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {tabs?.map((tab) => (
                  <button
                    key={tab?.id}
                    onClick={() => setActiveTab(tab?.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      activeTab === tab?.id
                        ? 'border-primary text-primary' :'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                    }`}
                  >
                    <Icon name={tab?.icon} size={16} />
                    <span>{tab?.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'transactions' && (
                <div className="space-y-6">
                  <TransactionFilters
                    onFilterChange={handleFilterChange}
                    onAddTransaction={handleAddTransaction}
                  />
                  <TransactionTable
                    transactions={filteredTransactions}
                    onEditTransaction={handleEditTransaction}
                    onDeleteTransaction={handleDeleteTransaction}
                  />
                </div>
              )}

              {activeTab === 'payments' && (
                <PaymentHistory payments={mockPayments} />
              )}

              {activeTab === 'card-info' && (
                <CardInfoTab
                  card={mockCard}
                  onSaveCard={handleSaveCard}
                />
              )}
            </div>
          </div>
        </div>
      </main>
      <RecordPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onRecordPayment={handlePaymentSubmit}
        cardName={mockCard?.name}
      />
    </div>
  );
};

export default CardDetails;