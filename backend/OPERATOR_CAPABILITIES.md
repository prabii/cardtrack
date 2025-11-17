# Operator Role Capabilities

## Overview
Operators are users responsible for processing bill payments and managing gateway transactions. This document outlines what operators **CAN** and **CANNOT** do.

---

## ✅ WHAT OPERATORS CAN DO

### 1. **BILL PAYMENTS MODULE** 💳

#### View Bill Payments
- ✅ View pending bill payment requests
- ✅ View all bill payment requests
- ✅ View details of specific bill payments
- ✅ Filter by status (pending, assigned, in_progress, completed, failed)

#### Process Bill Payments
- ✅ **Mark as Paid** - Mark bill payments as completed
- ✅ **Select Source** - Choose payment gateway (PayPoint, InstantMudra)
- ✅ Update payment status
- ✅ Add processing notes
- ✅ View payment history

#### ❌ CANNOT:
- ❌ Create bill payment requests (only members can create)
- ❌ Delete bill payments
- ❌ Change bill payment details (amount, due date, etc.)

---

### 2. **GATEWAY MODULE** 🏦

#### View Gateways
- ✅ View gateway dashboard
- ✅ View PayPoint transactions
- ✅ View InstantMudra transactions
- ✅ View gateway summaries

#### View Gateway Transactions
- ✅ View all transactions (Withdrawals, Bills, Transfers, Deposits)
- ✅ Filter by gateway (PayPoint, InstantMudra)
- ✅ Filter by transaction type
- ✅ View transaction details

#### ❌ CANNOT:
- ❌ Add gateway transactions (only gateway managers can add)
- ❌ Delete gateway transactions
- ❌ Modify gateway settings

---

### 3. **CARDHOLDERS MODULE** 📋

#### View Cardholders
- ✅ View list of all cardholders
- ✅ View cardholder details
- ✅ View cardholder dashboard

#### Edit Cardholders
- ✅ Edit cardholder details
- ✅ Upload statements

#### ❌ CANNOT:
- ❌ Create new cardholders
- ❌ Delete cardholders

---

### 4. **TRANSACTIONS MODULE** 📊

#### Verify Transactions
- ✅ Verify transactions
- ✅ **Stamp who verified** - Record verification details
- ✅ Add verification notes

#### ❌ CANNOT:
- ❌ Classify transactions
- ❌ Reject transactions
- ❌ Dispute transactions
- ❌ Delete transactions

---

### 5. **REPORTS MODULE** 📈

#### Generate Reports
- ✅ Generate all reports **except Company reports**
- ✅ View transaction reports
- ✅ View bill payment reports
- ✅ View gateway reports

#### ❌ CANNOT:
- ❌ Generate Company reports
- ❌ Access Company module

---

### 6. **ALERTS MODULE** 🔔

#### Manage Alerts
- ✅ **Set tally dates** - Configure alert dates
- ✅ View all alerts
- ✅ Manage alert settings

---

## ❌ WHAT OPERATORS CANNOT DO

### Restricted Modules
Operators **CANNOT** access:
- ❌ **Users Module** - Cannot manage users
- ❌ **Company Module** - Cannot manage company settings
- ❌ **Settings Module** - Cannot change system settings

### Restricted Actions
Operators **CANNOT**:
- ❌ Create bill payment requests
- ❌ Create cardholders
- ❌ Delete cardholders
- ❌ Delete bill payments
- ❌ Add gateway transactions
- ❌ Manage other users
- ❌ View Company reports
- ❌ Access admin/manager features

---

## 📊 Summary Table

| Feature | View | Create | Edit | Delete | Process |
|---------|------|--------|------|--------|---------|
| **Cardholders** | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Bill Payments** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Transactions** | ✅ | ❌ | ✅* | ❌ | ❌ |
| **Gateways** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Reports** | ✅** | ❌ | ❌ | ❌ | ❌ |
| **Alerts** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Users** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Company** | ❌ | ❌ | ❌ | ❌ | ❌ |

\* Operators can verify transactions (stamp who verified)  
\** Operators can generate all reports except Company reports

---

## 🔑 Key Operator Responsibilities

1. **Bill Payment Processing**
   - Review pending bill payment requests
   - Mark payments as paid
   - Select appropriate payment gateway (PayPoint/InstantMudra)
   - Record payment completion details

2. **Transaction Verification**
   - Verify transactions accurately
   - Record who verified each transaction
   - Add verification notes

3. **Gateway Monitoring**
   - Monitor gateway transactions
   - View gateway summaries
   - Track payment flows

4. **Alert Management**
   - Set tally dates for alerts
   - Monitor and respond to alerts

---

## 🎯 Operator Workflow Example

1. **View Pending Requests** → Check bill payment requests awaiting processing
2. **Select Gateway** → Choose PayPoint or InstantMudra
3. **Process Payment** → Mark as paid and record details
4. **Verify Transactions** → Verify processed transactions
5. **Set Alerts** → Configure alert dates
6. **Generate Reports** → Create reports (except Company)

---

## 📝 Notes

- Operators focus on **processing** and **verification** tasks
- Operators have **read and process** access to bill payments
- Operators can **verify** transactions but not classify them
- Operators can **view** gateways but not manage them
- Operators have **limited edit** capabilities (mainly verification and alerts)

---

## 🔄 Permission Updates

If you need to change operator permissions, update:
1. `backend/models/User.js` - `getAccessibleModules()` method
2. `backend/routes/auth.js` - `getDefaultPermissions()` function
3. `cardtracker_pro/src/utils/permissions.js` - `getAccessibleModules()` function

