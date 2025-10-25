import React from 'react';
import Button from '../../../components/ui/Button';

const QuickActionsToolbar = ({ onAddCard, onBulkReminders }) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Credit Cards Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage your credit cards and track payments</p>
      </div>
      
      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onBulkReminders}
          iconName="Bell"
          iconPosition="left"
          iconSize={16}
        >
          Send Reminders
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={onAddCard}
          iconName="Plus"
          iconPosition="left"
          iconSize={16}
        >
          Add New Card
        </Button>
      </div>
    </div>
  );
};

export default QuickActionsToolbar;