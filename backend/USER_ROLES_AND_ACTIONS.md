# User Roles and Actions Guide

Complete guide to what each user role can see and do in CardTracker Pro.

---

## 📋 Table of Contents

1. [Operator Role](#-operator-role)
2. [Admin Role](#-admin-role)
3. [Manager Role](#-manager-role)
4. [Gateway Manager Role](#-gateway-manager-role)
5. [Member Role](#-member-role)
6. [Quick Reference Table](#-quick-reference-table)
7. [Permission Matrix](#-permission-matrix)

---

## ⚙️ OPERATOR ROLE

**Email:** `operator@codershive.com`  
**Password:** `Operator@12345`  
**Purpose:** Process payments and verify transactions

### ✅ What Operators CAN See:

#### 1. **Dashboard** 📊
- ✅ View dashboard with statistics
- ✅ View pending bill payments count
- ✅ View recent activity
- ✅ View alerts

#### 2. **Cardholders Module** 👥
- ✅ View list of all cardholders (Name, Phone, Email)
- ✅ View cardholder details
- ✅ View cardholder dashboard
- ✅ View cardholder statements
- ✅ View cardholder transactions
- ✅ View bank summaries

#### 3. **Bill Payments Module** 💳
- ✅ View all bill payment requests
- ✅ View pending bill payments
- ✅ View bill payment details
- ✅ View payment history
- ✅ Filter by status (pending, assigned, in_progress, completed, failed)
- ✅ View payment gateway information

#### 4. **Transactions Module** 📝
- ✅ View all transactions
- ✅ View transaction details
- ✅ Filter transactions by category, status, date
- ✅ View verification status

#### 5. **Gateways Module** 🏦
- ✅ View gateway dashboard
- ✅ View PayPoint transactions
- ✅ View InstantMudra transactions
- ✅ View gateway summaries
- ✅ View available funds
- ✅ View transaction history

#### 6. **Reports Module** 📈
- ✅ Generate transaction reports
- ✅ Generate bill payment reports
- ✅ Generate gateway reports
- ✅ Generate cardholder reports
- ✅ Generate withdrawal reports
- ✅ Generate statement missing reports
- ✅ Generate tally required reports
- ❌ **CANNOT** generate Company reports

#### 7. **Alerts Module** 🔔
- ✅ View all alerts
- ✅ View bill payment due alerts
- ✅ View tally alerts
- ✅ View withdrawal alerts

### ✅ What Operators CAN Do:

#### 1. **Cardholders Actions** 👥
- ✅ **Edit** cardholder details (DOB, Father's Name, Mother's Name, Address, Phone, Email)
- ✅ **Upload** statements for cardholders
- ❌ **CANNOT** create new cardholders
- ❌ **CANNOT** delete cardholders

#### 2. **Bill Payments Actions** 💳
- ✅ **Mark as Paid** - Mark bill payments as completed
- ✅ **Select Payment Gateway** - Choose PayPoint or InstantMudra
- ✅ **Add Payment Notes** - Add processing notes
- ✅ **Update Payment Status** - Change status to completed
- ✅ **Record Transaction Reference** - Add transaction ID/reference
- ❌ **CANNOT** create bill payment requests
- ❌ **CANNOT** edit bill payment details (amount, due date, etc.)
- ❌ **CANNOT** delete bill payments

#### 3. **Transactions Actions** 📝
- ✅ **Verify Transactions** - Mark transactions as verified
- ✅ **Stamp Who Verified** - Record who verified the transaction
- ✅ **Add Verification Notes** - Add notes about verification
- ❌ **CANNOT** classify transactions (Bills, Withdrawals, Orders, Fees, Personal Use)
- ❌ **CANNOT** reject transactions
- ❌ **CANNOT** dispute transactions
- ❌ **CANNOT** delete transactions

#### 4. **Gateways Actions** 🏦
- ✅ **View** all gateway information (read-only)
- ❌ **CANNOT** add gateway transactions
- ❌ **CANNOT** modify gateway settings
- ❌ **CANNOT** delete gateway transactions

#### 5. **Alerts Actions** 🔔
- ✅ **Set Tally Dates** - Configure alert dates
- ✅ **Manage Alert Settings** - Update alert configurations
- ✅ **View Alert History** - See past alerts

### ❌ What Operators CANNOT Do:

- ❌ Create bill payment requests
- ❌ Create cardholders
- ❌ Delete cardholders
- ❌ Delete bill payments
- ❌ Add gateway transactions
- ❌ Manage users
- ❌ Access Company module
- ❌ Access Settings module
- ❌ Generate Company reports
- ❌ Classify transactions
- ❌ Reject/dispute transactions

---

## 👤 ADMIN ROLE

**Email:** `admin@codershive.com`  
**Password:** `Admin@12345`  
**Purpose:** Full system access and management

### ✅ What Admins CAN See & Do:

- ✅ **Everything** - Full access to all modules
- ✅ Manage all users (create, edit, delete)
- ✅ Manage company settings
- ✅ Access all reports including Company reports
- ✅ Manage gateways
- ✅ Manage cardholders
- ✅ Process bill payments
- ✅ Classify transactions
- ✅ Manage system settings

---

## 👔 MANAGER ROLE

**Email:** `manager@codershive.com`  
**Password:** `Manager@12345`  
**Purpose:** Manage operations and members

### ✅ What Managers CAN See & Do:

#### Can Access:
- ✅ Dashboard
- ✅ Cardholders (View, Create, Edit, Delete)
- ✅ Bill Payments (View, Create, Process)
- ✅ Bank Data (View, Add, Edit)
- ✅ Statements (View, Upload)
- ✅ Transactions (View, Classify)
- ✅ Bank Summaries
- ✅ Reports (All except Company)
- ✅ Company Management
- ✅ Users Management

#### Cannot Access:
- ❌ Gateway Management (cannot add transactions)
- ❌ System Settings

---

## 🏦 GATEWAY MANAGER ROLE

**Email:** `gateway@codershive.com`  
**Password:** `Gateway@12345`  
**Purpose:** Manage gateway transactions

### ✅ What Gateway Managers CAN See & Do:

#### Can Access:
- ✅ Dashboard
- ✅ Gateways (Full management)
- ✅ Bill Payments (View, Process)
- ✅ Bank Data (View)
- ✅ Transactions (View)
- ✅ Bank Summaries
- ✅ Reports (View)

#### Can Do:
- ✅ Add Gateway Transactions:
  - Withdrawals
  - Bills
  - Transfers
  - Deposits
- ✅ View Gateway Summaries
- ✅ Process Bill Payments

#### Cannot Access:
- ❌ Cardholders (cannot view/edit)
- ❌ Statements
- ❌ Users Management
- ❌ Company Management

---

## 👥 MEMBER ROLE

**Email:** `member@codershive.com`  
**Password:** `Member@12345`  
**Purpose:** Create requests and manage cardholders

### ✅ What Members CAN See & Do:

#### Can Access:
- ✅ Dashboard
- ✅ Cardholders (View, Create, Edit)
- ✅ Bill Payments (View, Create)
- ✅ Statements (View, Upload)
- ✅ Bank Data (View only)

#### Can Do:
- ✅ Create bill payment requests
- ✅ Upload statements
- ✅ Create cardholders
- ✅ Edit cardholders
- ✅ View transactions

#### Cannot Access:
- ❌ Transactions (cannot classify/verify)
- ❌ Bank Summaries
- ❌ Gateways
- ❌ Reports
- ❌ Users
- ❌ Company

---

## 📊 Quick Reference Table

| Feature | Admin | Manager | Gateway Manager | Member | Operator |
|---------|:-----:|:-------:|:---------------:|:------:|:--------:|
| **Dashboard** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Cardholders** | | | | | |
| - View | ✅ | ✅ | ❌ | ✅ | ✅ |
| - Create | ✅ | ✅ | ❌ | ✅ | ❌ |
| - Edit | ✅ | ✅ | ❌ | ✅ | ✅ |
| - Delete | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Bill Payments** | | | | | |
| - View | ✅ | ✅ | ✅ | ✅ | ✅ |
| - Create | ✅ | ✅ | ❌ | ✅ | ❌ |
| - Process | ✅ | ✅ | ✅ | ❌ | ✅ |
| - Delete | ✅ | ✅ | ❌ | ✅* | ❌ |
| **Transactions** | | | | | |
| - View | ✅ | ✅ | ✅ | ✅ | ✅ |
| - Classify | ✅ | ✅ | ❌ | ❌ | ❌ |
| - Verify | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Gateways** | | | | | |
| - View | ✅ | ❌ | ✅ | ❌ | ✅ |
| - Manage | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Reports** | | | | | |
| - All Reports | ✅ | ✅** | ✅** | ❌ | ✅** |
| - Company Reports | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Users** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Company** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Alerts** | ✅ | ✅ | ❌ | ❌ | ✅ |

\* Members can only delete their own pending requests  
\** Cannot access Company reports

---

## 🔐 Permission Matrix

### Operator Permissions:

```javascript
[
  'view_cardholders',
  'edit_cardholders',
  'view_bill_payments',
  'process_bill_payments',
  'view_transactions',
  'verify_transactions',
  'view_gateways',
  'view_reports',
  'manage_alerts'
]
```

### Admin Permissions:

```javascript
[
  'view_cardholders',
  'create_cardholders',
  'edit_cardholders',
  'delete_cardholders',
  'view_bill_payments',
  'create_bill_payments',
  'process_bill_payments',
  'view_gateways',
  'manage_gateways',
  'view_reports',
  'manage_company',
  'manage_users',
  'view_all_data'
]
```

### Manager Permissions:

```javascript
[
  'view_cardholders',
  'create_cardholders',
  'edit_cardholders',
  'delete_cardholders',
  'view_bill_payments',
  'create_bill_payments',
  'process_bill_payments',
  'view_reports',
  'view_all_data'
]
```

### Gateway Manager Permissions:

```javascript
[
  'view_gateways',
  'manage_gateways',
  'view_bill_payments',
  'process_bill_payments',
  'view_reports',
  'view_all_data'
]
```

### Member Permissions:

```javascript
[
  'view_cardholders',
  'create_cardholders',
  'edit_cardholders',
  'view_bill_payments',
  'create_bill_payments'
]
```

---

## 🎯 Operator Workflow Example

1. **Login** → Access dashboard
2. **View Pending Bill Payments** → Check requests awaiting processing
3. **Select Bill Payment** → Open payment details
4. **Choose Gateway** → Select PayPoint or InstantMudra
5. **Mark as Paid** → Complete payment processing
6. **Add Transaction Reference** → Record payment ID
7. **Verify Transactions** → Verify processed transactions
8. **Set Alerts** → Configure alert dates
9. **Generate Reports** → Create reports (except Company)

---

## 📝 Key Differences Summary

### Operator vs Member:
- **Operator:** Can process payments, verify transactions, but cannot create requests
- **Member:** Can create requests, but cannot process payments

### Operator vs Manager:
- **Operator:** Can verify transactions, but cannot classify them
- **Manager:** Can classify transactions, manage cardholders fully

### Operator vs Gateway Manager:
- **Operator:** Can view gateways, but cannot add transactions
- **Gateway Manager:** Can add gateway transactions (withdrawals, bills, transfers, deposits)

---

## 🔄 Updating Permissions

To update role permissions, modify these files:

1. **Backend:**
   - `backend/models/User.js` - `getAccessibleModules()` method
   - `backend/routes/auth.js` - `getDefaultPermissions()` function
   - `backend/routes/users.js` - `getDefaultPermissions()` function

2. **Frontend:**
   - `cardtracker_pro/src/utils/permissions.js` - `getAccessibleModules()` function
   - `cardtracker_pro/src/Routes.jsx` - Route protection with `RoleBasedRoute`

---

**Last Updated:** Based on current implementation  
**Version:** 1.0

