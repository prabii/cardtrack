# Cardholder Status, Transactions, and Outstanding Amounts

## Overview
This document explains how cardholder status management, transactions, and outstanding amounts work in the CardTracker system.

---

## 1. Cardholder Status Management

### Status Values
Cardholders can have one of four statuses:
- **`pending`** (default) - Newly created cardholder, awaiting activation
- **`active`** - Cardholder is active and can have transactions
- **`inactive`** - Cardholder is temporarily inactive
- **`suspended`** - Cardholder is suspended (cannot use cards)

### Who Can Change Status?
Only users with `edit_cardholders` permission can change cardholder status:
- **Admin** ✅
- **Manager** ✅
- **Operator** ✅
- **Member** ❌
- **Gateway Manager** ❌

### How to Change Status

#### Backend API
```http
PUT /api/cardholders/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "active"  // or "pending", "inactive", "suspended"
}
```

#### Frontend UI
1. Navigate to **Cardholders** page (`/cardholders`)
2. In the **Status** column, click the dropdown (if you have permission)
3. Select the new status
4. Status updates automatically

### Status Workflow
```
New Cardholder Created
    ↓
Status: "pending" (default)
    ↓
Admin/Manager/Operator activates
    ↓
Status: "active"
    ↓
[Can upload statements and have transactions]
```

---

## 2. How Transactions Work

### Transaction Flow

#### Step 1: Add Bank Account
1. Navigate to a cardholder's dashboard (`/cardholders/:id`)
2. Click **"Add Bank Card"** button
3. Fill in bank details:
   - Bank Name
   - Card Number
   - Card Limit
   - Card Type
   - Other details

#### Step 2: Upload Statement
1. Navigate to **Statements** → **Upload Statement** (`/statements/upload`)
2. Select the cardholder
3. Upload PDF statement
4. Fill in required fields:
   - **Statement Month** (e.g., "Nov 2025")
   - **Time Period** (Start Date - End Date)
   - **Last 4 digits of card**
   - **Bank Name**
   - **Card Number**
   - **Deadline** (for alerts)

#### Step 3: Process Statement
- The statement is stored with status `uploaded`
- Transactions are extracted from the PDF (manually or automatically)
- Each transaction is linked to:
  - The statement
  - The bank (by matching `cardDigits` and `bankName`)
  - The cardholder

#### Step 4: Classify Transactions
1. Navigate to **Transactions** page (`/transactions`)
2. View transactions from uploaded statements
3. Classify each transaction:
   - **Bills** - Bill payments
   - **Withdrawals** - Cash withdrawals
   - **Orders** - Order transactions (with sub-classifications)
   - **Fees** - Bank fees
   - **Personal Use** - Personal expenses

#### Step 5: Verify Transactions
- Operators, Managers, and Admins can verify transactions
- Verified transactions show who verified them and when

### Transaction Categories

#### Top-Level Categories
- `bills` - Bill payments
- `withdrawals` - Cash withdrawals
- `orders` - Order transactions
- `fees` - Bank fees
- `personal_use` - Personal expenses

#### Order Sub-Classification
If a transaction is classified as `orders`, it requires:
- **Order Type**: CB Won / REF / Loss / Running
- **Payout Received?**: Yes/No
- **Payout Amount**: (if Yes)

---

## 3. Outstanding Amount Calculation

### How Outstanding Amounts Work

#### Bank Level
Each bank account has:
- **Card Limit** - Maximum credit limit
- **Available Limit** - Remaining credit available
- **Outstanding Amount** - Amount owed on the card

**Formula:**
```
Available Limit = Card Limit - Outstanding Amount
```

#### Cardholder Level
Each cardholder has:
- **Total Outstanding** - Sum of outstanding amounts from all banks

**Formula:**
```
Total Outstanding = Sum of all bank.outstandingAmount
```

### Where Outstanding Amounts Come From

#### Source 1: Statement Upload
When a statement is uploaded and processed:
- The PDF contains the current outstanding balance
- This is extracted and stored in `statement.extractedData.outstandingAmount`
- The bank's `outstandingAmount` is updated from the latest statement

#### Source 2: Transaction Calculation
Outstanding amounts can also be calculated from transactions:
```
Outstanding Amount = 
  Sum of all transaction amounts (debits) - 
  Sum of all payments/credits
```

### Current Status
- **Outstanding amounts show $0** because:
  1. No bank accounts have been added yet
  2. No statements have been uploaded yet
  3. No transactions exist yet

### To Get Outstanding Amounts:

1. **Add Bank Accounts**
   - Go to cardholder dashboard
   - Click "Add Bank Card"
   - Enter bank details including card limit

2. **Upload Statements**
   - Upload PDF statements
   - The system extracts outstanding amount from the statement
   - Bank's outstanding amount is updated

3. **View Outstanding**
   - Cardholder list shows `Total Outstanding` per cardholder
   - Cardholder dashboard shows per-bank outstanding amounts
   - Overall summary shows total outstanding across all banks

---

## 4. Complete Workflow Example

### Scenario: Activate a Cardholder and Get Transactions

1. **Create Cardholder** (if not exists)
   - Status: `pending` (default)

2. **Activate Cardholder**
   - Admin/Manager changes status to `active`
   - Cardholder can now have transactions

3. **Add Bank Account**
   - Navigate to cardholder dashboard
   - Click "Add Bank Card"
   - Enter: Bank Name, Card Number, Card Limit, etc.

4. **Upload Statement**
   - Go to Statements → Upload
   - Select cardholder and bank
   - Upload PDF statement
   - Enter statement details (month, time period, card digits, etc.)

5. **Process Statement**
   - System extracts transactions from PDF
   - Transactions are linked to the bank and cardholder

6. **Classify Transactions**
   - Go to Transactions page
   - Classify each transaction (Bills, Orders, etc.)
   - Verify transactions (if operator/manager/admin)

7. **View Outstanding**
   - Cardholder dashboard shows:
     - Per-bank outstanding amounts
     - Total outstanding across all banks
   - Cardholder list shows total outstanding per cardholder

---

## 5. API Endpoints

### Update Cardholder Status
```http
PUT /api/cardholders/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "active"
}
```

### Upload Statement
```http
POST /api/statements
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "statement": <PDF file>,
  "cardholder": "<cardholder_id>",
  "month": "Nov",
  "year": 2025,
  "timePeriod": {
    "startDate": "2025-11-01",
    "endDate": "2025-11-30"
  },
  "cardDigits": "1234",
  "bankName": "Bank Name",
  "cardNumber": "1234-5678-9012-3456",
  "deadline": "2025-12-05"
}
```

### Get Cardholder Dashboard
```http
GET /api/cardholders/:id
Authorization: Bearer <token>
```

Returns:
- Cardholder details
- All statements
- All transactions (grouped by bank)
- Per-bank summaries (including outstanding amounts)
- Overall summary (total outstanding)

---

## 6. Permissions Matrix

| Action | Admin | Manager | Operator | Member | Gateway Manager |
|--------|-------|---------|----------|--------|-----------------|
| Change Status | ✅ | ✅ | ✅ | ❌ | ❌ |
| Add Bank | ✅ | ✅ | ✅ | ❌ | ❌ |
| Upload Statement | ✅ | ✅ | ✅ | ❌ | ❌ |
| Classify Transactions | ✅ | ✅ | ❌ | ❌ | ❌ |
| Verify Transactions | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Outstanding | ✅ | ✅ | ✅ | ✅* | ✅* |

*Members and Gateway Managers can only view their own data (if applicable)

---

## 7. Troubleshooting

### Q: Why are all cardholders showing "pending"?
**A:** Cardholders start as "pending" by default. An Admin, Manager, or Operator needs to change the status to "active".

### Q: Why are there no transactions?
**A:** Transactions come from uploaded statements. You need to:
1. Add a bank account for the cardholder
2. Upload a PDF statement
3. Process the statement to extract transactions

### Q: Why is outstanding amount $0?
**A:** Outstanding amounts come from:
1. Statement uploads (extracted from PDF)
2. Bank accounts (if manually entered)
3. Transaction calculations

If no statements or banks exist, outstanding will be $0.

### Q: Who can change cardholder status?
**A:** Only users with `edit_cardholders` permission:
- Admin ✅
- Manager ✅
- Operator ✅
- Member ❌
- Gateway Manager ❌

---

## Summary

1. **Status**: Cardholders start as "pending". Admins/Managers/Operators can change to "active".
2. **Transactions**: Come from uploaded PDF statements. Statements must be processed to extract transactions.
3. **Outstanding**: Calculated from statement data or transaction sums. Shows $0 until statements/banks are added.

