# Role-Based UI Restrictions

This document outlines all the UI components and buttons that are hidden/shown based on user roles.

---

## Summary of Changes

All UI components now respect role-based permissions. Users will only see buttons and options they are allowed to use.

---

## 1. Cardholders Page (`/cardholders`)

### Add Cardholder Button
- **Visible to:** Admin, Manager, Member
- **Hidden from:** Operator, Gateway Manager
- **Implementation:** Uses `hasPermission(PERMISSIONS.CREATE_CARDHOLDERS, user)`

### Edit Button
- **Visible to:** Admin, Manager, Member, Operator (if they have `edit_cardholders` permission)
- **Hidden from:** Gateway Manager (no access to cardholders)
- **Implementation:** Uses `hasPermission(PERMISSIONS.EDIT_CARDHOLDERS, user)`

### Delete Button
- **Visible to:** Admin, Manager
- **Hidden from:** Operator, Member, Gateway Manager
- **Implementation:** Uses `hasPermission(PERMISSIONS.DELETE_CARDHOLDERS, user)`

### Status Dropdown
- **Visible to:** Admin, Manager, Operator (if they have `edit_cardholders` permission)
- **Hidden from:** Member, Gateway Manager
- **Implementation:** Uses `hasPermission(PERMISSIONS.EDIT_CARDHOLDERS, user)`

---

## 2. Bill Payments Page (`/bill-payments`)

### Add Bill Payment Button
- **Visible to:** Admin, Manager, Member
- **Hidden from:** Operator, Gateway Manager
- **Implementation:** Uses `hasPermission(PERMISSIONS.CREATE_BILL_PAYMENTS, user)`

### Edit Button
- **Visible to:** 
  - Members (can edit their own)
  - Admin, Manager (can edit any)
- **Hidden from:** Operator, Gateway Manager
- **Implementation:** 
  ```javascript
  {(user?.role === 'member' || hasPermission(PERMISSIONS.CREATE_BILL_PAYMENTS, user)) && user?.role !== 'operator'}
  ```

### Delete Button
- **Visible to:** 
  - Members (can delete their own pending requests only)
  - Admin, Manager (can delete any pending request)
- **Hidden from:** Operator, Gateway Manager
- **Implementation:**
  ```javascript
  {((user?.role === 'member' && billPayment.status === 'pending' && billPayment.requestDetails?.requestedBy === user?.id) || 
    (hasPermission(PERMISSIONS.CREATE_BILL_PAYMENTS, user) && billPayment.status === 'pending' && user?.role !== 'operator'))}
  ```

### Mark as Paid Button
- **Visible to:** Admin, Manager, Operator
- **Hidden from:** Member, Gateway Manager
- **Implementation:** Already implemented in bill payment detail page

---

## 3. Transactions Page (`/transactions`)

### Category Dropdown (Classify)
- **Visible to:** Admin, Manager, Gateway Manager
- **Hidden from:** Operator, Member
- **Implementation:** 
  ```javascript
  {user?.role === 'operator' ? (
    <span>...</span>  // Read-only display
  ) : (
    <select>...</select>  // Editable dropdown
  )}
  ```

### Verify/Unverify Button
- **Visible to:** Admin, Manager, Operator
- **Hidden from:** Member, Gateway Manager
- **Implementation:** 
  ```javascript
  {['operator', 'manager', 'admin'].includes(user?.role)}
  ```

### Bulk Categorize Option
- **Visible to:** Admin, Manager, Gateway Manager
- **Hidden from:** Operator
- **Implementation:**
  ```javascript
  {user?.role !== 'operator' && (
    <option value="categorize">Categorize Selected</option>
  )}
  ```

---

## 4. Statements Page (`/statements`)

### Upload Statement Button
- **Visible to:** Admin, Manager, Member
- **Hidden from:** Operator, Gateway Manager
- **Implementation:**
  ```javascript
  {user?.role !== 'operator' && (
    <Button>Upload Statement</Button>
  )}
  ```

---

## 5. Gateways Page (`/gateways`)

### Add Transaction Buttons
- **Status:** Currently not implemented in UI
- **When implemented:** Should be visible only to Admin and Gateway Manager
- **Hidden from:** Operator (read-only access)

---

## 6. Navigation Menu (Header)

Navigation items are filtered based on role:

| Menu Item | Admin | Manager | Gateway Manager | Member | Operator |
|-----------|:-----:|:-------:|:--------------:|:------:|:--------:|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Cardholders | ✅ | ✅ | ❌ | ✅ | ✅ |
| Bill Payments | ✅ | ✅ | ✅ | ✅ | ✅ |
| Bank Data | ✅ | ✅ | ✅ | ❌ | ❌ |
| Statements | ✅ | ✅ | ❌ | ✅ | ❌ |
| Transactions | ✅ | ✅ | ✅ | ❌ | ✅ |
| Bank Summaries | ✅ | ✅ | ✅ | ❌ | ❌ |
| Gateways | ✅ | ❌ | ✅ | ❌ | ✅ |
| Users | ✅ | ✅ | ❌ | ❌ | ❌ |
| Reports | ✅ | ✅ | ❌ | ❌ | ✅ |
| Alerts | ✅ | ✅ | ❌ | ❌ | ✅ |
| Company | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 7. Permission Constants

All permissions are defined in `cardtracker_pro/src/utils/permissions.js`:

```javascript
export const PERMISSIONS = {
  VIEW_CARDHOLDERS: 'view_cardholders',
  CREATE_CARDHOLDERS: 'create_cardholders',
  EDIT_CARDHOLDERS: 'edit_cardholders',
  DELETE_CARDHOLDERS: 'delete_cardholders',
  
  VIEW_BILL_PAYMENTS: 'view_bill_payments',
  CREATE_BILL_PAYMENTS: 'create_bill_payments',
  PROCESS_BILL_PAYMENTS: 'process_bill_payments',
  
  VIEW_GATEWAYS: 'view_gateways',
  MANAGE_GATEWAYS: 'manage_gateways',
  
  VIEW_REPORTS: 'view_reports',
  MANAGE_COMPANY: 'manage_company',
  MANAGE_USERS: 'manage_users',
  VIEW_ALL_DATA: 'view_all_data'
};
```

---

## 8. Role-Based Access Summary

### Operator
- ✅ Can view cardholders
- ✅ Can edit cardholder details
- ✅ Can change cardholder status
- ✅ Can view bill payments
- ✅ Can mark bill payments as paid
- ✅ Can verify transactions
- ✅ Can view gateways (read-only)
- ✅ Can view reports (except Company)
- ✅ Can manage alerts
- ❌ Cannot create cardholders
- ❌ Cannot delete cardholders
- ❌ Cannot create bill payments
- ❌ Cannot edit/delete bill payments
- ❌ Cannot classify transactions
- ❌ Cannot upload statements

### Member
- ✅ Can view cardholders
- ✅ Can create cardholders
- ✅ Can edit cardholders
- ✅ Can view bill payments
- ✅ Can create bill payments
- ✅ Can edit their own bill payments
- ✅ Can delete their own pending bill payments
- ✅ Can upload statements
- ❌ Cannot delete cardholders
- ❌ Cannot classify transactions
- ❌ Cannot verify transactions
- ❌ Cannot mark bill payments as paid

### Manager
- ✅ Full access to all modules (except Gateway management)
- ✅ Can create/edit/delete cardholders
- ✅ Can create/edit/delete bill payments
- ✅ Can classify transactions
- ✅ Can verify transactions
- ✅ Can upload statements
- ✅ Can manage users
- ✅ Can manage company
- ❌ Cannot manage gateways (add transactions)

### Admin
- ✅ Full access to everything
- ✅ All permissions enabled

### Gateway Manager
- ✅ Can view gateways
- ✅ Can manage gateways (add transactions)
- ✅ Can view bill payments
- ✅ Can process bill payments
- ✅ Can view transactions
- ✅ Can view bank data
- ✅ Can view bank summaries
- ❌ Cannot access cardholders
- ❌ Cannot upload statements
- ❌ Cannot manage users
- ❌ Cannot manage company

---

## 9. Implementation Details

### Using Permission Checks

```javascript
import { hasPermission, PERMISSIONS } from '../../utils/permissions';

// Check if user has permission
{hasPermission(PERMISSIONS.CREATE_CARDHOLDERS, user) && (
  <button>Add Cardholder</button>
)}
```

### Using Role Checks

```javascript
// Check specific role
{user?.role !== 'operator' && (
  <button>Upload Statement</button>
)}

// Check multiple roles
{['admin', 'manager'].includes(user?.role) && (
  <button>Delete</button>
)}
```

---

## 10. Testing Checklist

- [ ] Operator cannot see "Add Cardholder" button
- [ ] Operator cannot see "Add Bill Payment" button
- [ ] Operator cannot see "Edit" button on bill payments
- [ ] Operator cannot see "Delete" button on bill payments
- [ ] Operator cannot see category dropdown in transactions (read-only)
- [ ] Operator cannot see "Upload Statement" button
- [ ] Member cannot see "Delete Cardholder" button
- [ ] Member can only delete their own pending bill payments
- [ ] Gateway Manager cannot see cardholders menu
- [ ] Gateway Manager cannot see statements menu
- [ ] All navigation items are filtered correctly

---

## Summary

All UI components now respect role-based permissions. Users will only see buttons and options they are allowed to use, providing a cleaner and more secure user experience.

