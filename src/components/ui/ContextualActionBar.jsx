import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from './Button';

const ContextualActionBar = ({ customActions = null }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const getDefaultActions = () => {
    const path = location?.pathname;

    switch (path) {
      case '/dashboard':
        return [
          {
            label: 'Add Credit Card',
            icon: 'CreditCard',
            variant: 'default',
            onClick: () => navigate('/add-credit-card')
          },
          {
            label: 'Add Transaction',
            icon: 'Plus',
            variant: 'outline',
            onClick: () => navigate('/add-transaction')
          }
        ];

      case '/card-details':
        return [
          {
            label: 'Edit Card',
            icon: 'Edit',
            variant: 'outline',
            onClick: () => {}
          },
          {
            label: 'Add Transaction',
            icon: 'Plus',
            variant: 'default',
            onClick: () => navigate('/add-transaction')
          },
          {
            label: 'View Statements',
            icon: 'FileText',
            variant: 'ghost',
            onClick: () => {}
          }
        ];

      case '/add-credit-card': case'/add-transaction':
        return [
          {
            label: 'Back to Dashboard',
            icon: 'ArrowLeft',
            variant: 'ghost',
            onClick: () => navigate('/dashboard')
          }
        ];

      default:
        return [];
    }
  };

  const actions = customActions || getDefaultActions();

  if (!actions || actions?.length === 0) {
    return null;
  }

  return (
    <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border mb-6">
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center space-x-2">
          {actions?.map((action, index) => (
            <Button
              key={index}
              variant={action?.variant || 'default'}
              size="sm"
              onClick={action?.onClick}
              iconName={action?.icon}
              iconPosition="left"
              iconSize={16}
              disabled={action?.disabled}
              className="transition-all duration-200 hover:scale-105"
            >
              {action?.label}
            </Button>
          ))}
        </div>

        {/* Quick Stats or Additional Info */}
        {location?.pathname === '/dashboard' && (
          <div className="hidden sm:flex items-center text-sm text-muted-foreground">
            <span>Last updated: {new Date()?.toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContextualActionBar;