import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const QuickActions = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      id: 1,
      title: 'View Dashboard',
      description: 'Return to main dashboard',
      icon: 'LayoutDashboard',
      action: () => navigate('/dashboard'),
      variant: 'outline'
    },
    {
      id: 2,
      title: 'Add Credit Card',
      description: 'Register a new credit card',
      icon: 'CreditCard',
      action: () => navigate('/add-credit-card'),
      variant: 'ghost'
    },
    {
      id: 3,
      title: 'Card Details',
      description: 'View existing card information',
      icon: 'FileText',
      action: () => navigate('/card-details'),
      variant: 'ghost'
    }
  ];

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center mb-4">
        <div className="flex items-center justify-center w-8 h-8 bg-secondary/10 rounded-lg mr-3">
          <Icon name="Zap" size={16} className="text-secondary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
      </div>
      <div className="space-y-3">
        {quickActions?.map((action) => (
          <div
            key={action?.id}
            className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors duration-150"
          >
            <div className="flex items-center flex-1">
              <div className="flex items-center justify-center w-10 h-10 bg-muted rounded-lg mr-3">
                <Icon name={action?.icon} size={18} className="text-muted-foreground" />
              </div>
              
              <div className="flex-1">
                <h4 className="font-medium text-foreground">{action?.title}</h4>
                <p className="text-sm text-muted-foreground">{action?.description}</p>
              </div>
            </div>

            <Button
              variant={action?.variant}
              size="sm"
              onClick={action?.action}
              iconName="ArrowRight"
              iconPosition="right"
              iconSize={16}
            >
              Go
            </Button>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-center text-sm text-muted-foreground">
          <Icon name="Navigation" size={16} className="mr-2" />
          <span>Navigate to other sections</span>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;