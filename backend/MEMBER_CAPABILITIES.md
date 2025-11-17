# Member Role Capabilities

## Overview
Members are regular users in the CardTracker Pro system with limited access compared to Admins and Managers. This document outlines what members **CAN** and **CANNOT** do.

---

## ✅ WHAT MEMBERS CAN DO

### 1. **CARDHOLDERS MODULE** 📋

#### View Cardholders
- ✅ View list of all cardholders (Name, Phone, Email)
- ✅ View individual cardholder details
- ✅ View cardholder dashboard with:
  - Personal information (DOB, Father's Name, Mother's Name, Address, Phone, Email)
  - Statements history
  - Bank data and transactions
  - Bank summaries
  - Overall summary

#### Create Cardholders
- ✅ Create new cardholder records
- ✅ Enter all mandatory fields:
  - Name
  - Email (must be unique)
  - Phone
  - Address
  - Date of Birth (must be 18+)
  - Father's Name
  - Mother's Name
  - Optional: Emergency Contact, Notes

#### Edit Cardholders
- ✅ Update cardholder information
- ✅ Modify personal details
- ✅ Update contact information

#### ❌ CANNOT:
- ❌ Delete cardholders (soft delete)
- ❌ Change cardholder status (active/pending/inactive/suspended)

---

### 2. **BILL PAYMENTS MODULE** 💳

#### View Bill Payments
- ✅ View list of bill payment requests
- ✅ View details of specific bill payments
- ✅ See status of their requests (pending, assigned, in_progress, completed, failed)

#### Create Bill Payment Requests
- ✅ **Raise bill payment requests** - This is a key capability!
- ✅ Enter payment details:
  - Amount
  - Biller name
  - Biller account
  - Biller category (utilities, telecom, insurance, credit_card, loan, other)
  - Payment method
  - Due date
- ✅ **Upload attachments** (images, PDFs, documents)
- ✅ Add notes and set priority

#### ❌ CANNOT:
- ❌ Process bill payments (assign to operators)
- ❌ Start processing
- ❌ Complete payments
- ❌ Verify payments
- ❌ Assign payments to other users
- ❌ Delete bill payments (only pending ones can be deleted by creator)

---

### 3. **STATEMENTS MODULE** 📄

#### View Statements
- ✅ View all statements
- ✅ View statement details
- ✅ See statement status (uploaded, processing, processed, failed)
- ✅ View statement deadlines
- ✅ See overdue statements

#### Upload Statements
- ✅ Upload PDF statements
- ✅ Enter required information:
  - Statement Month (e.g., Nov 2025)
  - Time Period (start date and end date)
  - Last 4 digits of card
  - Bank name
  - Card number
  - Deadline

#### ❌ CANNOT:
- ❌ Process statements (extract data from PDF)
- ❌ Delete statements
- ❌ Update statement status
- ❌ Reprocess statements

---

### 4. **BANK DATA MODULE** 🏦

#### View Bank Data
- ✅ View bank information
- ✅ View card details (Card Limit, Available Limit, Outstanding Amount)
- ✅ View bank summaries per bank
- ✅ View overall summary across all banks

#### View Transactions
- ✅ View all transactions
- ✅ Filter transactions by:
  - Cardholder
  - Bank
  - Statement
  - Category (Bills, Withdrawals, Orders, Fees, Personal Use)
  - Verification status
  - Date range
- ✅ See transaction details:
  - Date, Description, Amount
  - Category
  - Order subcategory (if Order)
  - Payout information (if Order)
  - Verification status and who verified

#### Classify Transactions
- ✅ Classify transactions into categories:
  - Bills
  - Withdrawals
  - Orders
  - Fees
  - Personal Use
- ✅ For Orders, further classify:
  - CB Won / REF / Loss / Running
  - Mark Payout Received (Yes/No)
  - Enter Payout Amount (if received)

#### Verify Transactions
- ✅ Verify transactions
- ✅ Add verification notes

#### ❌ CANNOT:
- ❌ Reject transactions
- ❌ Dispute transactions
- ❌ Delete transactions
- ❌ Bulk operations (bulk verify, bulk classify)

---

## ❌ WHAT MEMBERS CANNOT DO

### Restricted Modules
Members **CANNOT** access:
- ❌ **Reports Module** - No access to reports and analytics
- ❌ **Users Module** - Cannot manage users
- ❌ **Company Module** - Cannot manage company settings
- ❌ **Gateways Module** - Cannot manage payment gateways
- ❌ **Settings Module** - Cannot change system settings

### Restricted Actions
Members **CANNOT**:
- ❌ Delete cardholders
- ❌ Process bill payments
- ❌ Process statements
- ❌ Manage other users
- ❌ View system reports
- ❌ Access admin/manager features
- ❌ Change user roles or permissions

---

## 📊 Summary Table

| Feature | View | Create | Edit | Delete | Process |
|---------|------|--------|------|--------|---------|
| **Cardholders** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Bill Payments** | ✅ | ✅ | ❌ | ❌* | ❌ |
| **Statements** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Transactions** | ✅ | ❌ | ✅** | ❌ | ❌ |
| **Bank Data** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Reports** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Users** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Company** | ❌ | ❌ | ❌ | ❌ | ❌ |

\* Members can only delete their own pending bill payment requests  
\** Members can classify and verify transactions, but not edit core transaction data

---

## 🔑 Key Member Responsibilities

1. **Cardholder Management**
   - Create and maintain cardholder records
   - Ensure all mandatory information is accurate

2. **Bill Payment Requests**
   - Raise bill payment requests with complete details
   - Upload supporting documents/attachments
   - Track request status

3. **Statement Upload**
   - Upload statements before deadlines
   - Provide accurate statement information
   - Monitor overdue statements

4. **Transaction Classification**
   - Classify transactions accurately
   - Verify transactions
   - Provide proper order sub-classification
   - Track payout information for orders

---

## 🎯 Member Workflow Example

1. **Create Cardholder** → Enter all mandatory details
2. **Upload Statement** → Upload PDF with statement details
3. **View Transactions** → See transactions from uploaded statements
4. **Classify Transactions** → Categorize each transaction
5. **Raise Bill Payment** → Create request with amount and attachments
6. **Track Status** → Monitor bill payment and statement status

---

## 📝 Notes

- Members have **read and create** access to most modules
- Members have **limited edit** capabilities (mainly classification and verification)
- Members **cannot process** or **delete** most records
- Members focus on **data entry** and **request creation**
- Processing and management tasks are handled by Managers and Admins

---

## 🔄 Permission Updates

If you need to change member permissions, update:
1. `backend/models/User.js` - `getAccessibleModules()` method
2. `backend/routes/auth.js` - `getDefaultPermissions()` function
3. `cardtracker_pro/src/utils/permissions.js` - `getAccessibleModules()` function

