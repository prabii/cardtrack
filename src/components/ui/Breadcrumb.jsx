import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';

const Breadcrumb = ({ customItems = null }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const getDefaultBreadcrumbs = () => {
    const path = location?.pathname;
    const breadcrumbs = [
      { label: 'Dashboard', path: '/dashboard', icon: 'Home' }
    ];

    switch (path) {
      case '/dashboard':
        return [{ label: 'Dashboard', path: '/dashboard', icon: 'Home', current: true }];
      
      case '/add-credit-card':
        breadcrumbs?.push({ label: 'Add Credit Card', path: '/add-credit-card', current: true });
        break;
      
      case '/card-details':
        breadcrumbs?.push({ label: 'Card Details', path: '/card-details', current: true });
        break;
      
      case '/add-transaction':
        breadcrumbs?.push({ label: 'Add Transaction', path: '/add-transaction', current: true });
        break;
      
      default:
        breadcrumbs?.push({ label: 'Page', path: path, current: true });
    }

    return breadcrumbs;
  };

  const breadcrumbs = customItems || getDefaultBreadcrumbs();

  if (breadcrumbs?.length <= 1 && breadcrumbs?.[0]?.current) {
    return null;
  }

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
      {breadcrumbs?.map((item, index) => (
        <div key={item?.path} className="flex items-center">
          {index > 0 && (
            <Icon name="ChevronRight" size={16} className="mx-2 text-muted-foreground" />
          )}
          
          {item?.current ? (
            <span className="flex items-center text-foreground font-medium">
              {item?.icon && (
                <Icon name={item?.icon} size={16} className="mr-1.5" />
              )}
              {item?.label}
            </span>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleNavigation(item?.path)}
              className="h-auto p-1 text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              <div className="flex items-center">
                {item?.icon && (
                  <Icon name={item?.icon} size={16} className="mr-1.5" />
                )}
                {item?.label}
              </div>
            </Button>
          )}
        </div>
      ))}
    </nav>
  );
};

export default Breadcrumb;