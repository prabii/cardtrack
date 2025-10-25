import React, { useState } from 'react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';


const TransactionFilters = ({ onFilterChange, onAddTransaction }) => {
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: ''
  });

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'groceries', label: 'Groceries' },
    { value: 'dining', label: 'Dining' },
    { value: 'gas', label: 'Gas & Fuel' },
    { value: 'shopping', label: 'Shopping' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'travel', label: 'Travel' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'other', label: 'Other' }
  ];

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      category: '',
      dateFrom: '',
      dateTo: '',
      amountMin: '',
      amountMax: ''
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const hasActiveFilters = Object.values(filters)?.some(value => value !== '');

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <h3 className="text-lg font-medium text-foreground">Transaction Filters</h3>
        
        <Button
          variant="default"
          size="sm"
          onClick={onAddTransaction}
          iconName="Plus"
          iconPosition="left"
          iconSize={16}
        >
          Add Transaction
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Search */}
        <div className="xl:col-span-2">
          <Input
            type="search"
            placeholder="Search transactions..."
            value={filters?.search}
            onChange={(e) => handleFilterChange('search', e?.target?.value)}
            className="w-full"
          />
        </div>

        {/* Category */}
        <Select
          placeholder="Category"
          options={categoryOptions}
          value={filters?.category}
          onChange={(value) => handleFilterChange('category', value)}
        />

        {/* Date From */}
        <Input
          type="date"
          placeholder="From date"
          value={filters?.dateFrom}
          onChange={(e) => handleFilterChange('dateFrom', e?.target?.value)}
        />

        {/* Date To */}
        <Input
          type="date"
          placeholder="To date"
          value={filters?.dateTo}
          onChange={(e) => handleFilterChange('dateTo', e?.target?.value)}
        />

        {/* Amount Range */}
        <div className="flex space-x-2">
          <Input
            type="number"
            placeholder="Min $"
            value={filters?.amountMin}
            onChange={(e) => handleFilterChange('amountMin', e?.target?.value)}
            className="w-full"
          />
          <Input
            type="number"
            placeholder="Max $"
            value={filters?.amountMax}
            onChange={(e) => handleFilterChange('amountMax', e?.target?.value)}
            className="w-full"
          />
        </div>
      </div>
      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex justify-end mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            iconName="X"
            iconPosition="left"
            iconSize={14}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default TransactionFilters;