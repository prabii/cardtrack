import React from 'react';
import CreditCardSummary from './CreditCardSummary';

const CreditCardGrid = ({ cards, onViewDetails, onAddTransaction, onMarkPaid }) => {
  if (!cards || cards?.length === 0) {
    return (
      <div className="bg-card rounded-lg p-8 border border-border text-center">
        <p className="text-muted-foreground">No credit cards added yet.</p>
        <p className="text-sm text-muted-foreground mt-2">Add your first credit card to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards?.map((card) => (
        <CreditCardSummary
          key={card?.id}
          card={card}
          onViewDetails={onViewDetails}
          onAddTransaction={onAddTransaction}
          onMarkPaid={onMarkPaid}
        />
      ))}
    </div>
  );
};

export default CreditCardGrid;