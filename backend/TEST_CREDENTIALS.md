# Test Login Credentials

## 🔐 All User Roles - Login Credentials

Use these credentials to test different user roles and their capabilities.

---

## 👤 ADMIN
**Full Access - Manages Everything**

- **Email:** `admin@codershive.com`
- **Password:** `Admin@12345`
- **Name:** Alice Admin
- **Capabilities:**
  - Full system access
  - Manage all modules
  - Manage users
  - Company settings
  - All reports

---

## 👔 MANAGER
**Manages Members and Overall Operations**

- **Email:** `manager@codershive.com`
- **Password:** `Manager@12345`
- **Name:** Mark Manager
- **Capabilities:**
  - View/Create/Edit/Delete Cardholders
  - View/Create/Process Bill Payments
  - View Reports
  - Manage Statements
  - Bank Data access

---

## 🏦 GATEWAY MANAGER
**Manages Gateway Withdrawals and Bills**

- **Email:** `gateway@codershive.com`
- **Password:** `Gateway@12345`
- **Name:** Gary Gateway
- **Capabilities:**
  - View/Manage Gateways
  - Add Gateway Transactions (Withdrawals, Bills, Transfers, Deposits)
  - View/Process Bill Payments
  - View Reports
  - Bank Data access

---

## 👥 MEMBER
**Access to Cardholder Menu and Bill Payments**

- **Email:** `member@codershive.com`
- **Password:** `Member@12345`
- **Name:** Mia Member
- **Capabilities:**
  - View/Create/Edit Cardholders
  - Upload Statements
  - View/Create Bill Payment Requests
  - View Transactions
  - Classify Transactions
  - Verify Transactions

---

## ⚙️ OPERATOR
**Processes Payments and Verifies Transactions**

- **Email:** `operator@codershive.com`
- **Password:** `Operator@12345`
- **Name:** Oscar Operator
- **Capabilities:**
  - View Pending Bill Payments
  - Mark Payments as Paid
  - Select Payment Gateway (PayPoint/InstantMudra)
  - Verify Transactions
  - View Gateways (read-only)
  - View Reports (except Company)
  - Manage Alerts

---

## 📋 Quick Reference Table

| Role | Email | Password | Key Features |
|------|-------|----------|-------------|
| **Admin** | admin@codershive.com | Admin@12345 | Full access |
| **Manager** | manager@codershive.com | Manager@12345 | Manage operations |
| **Gateway Manager** | gateway@codershive.com | Gateway@12345 | Manage gateways |
| **Member** | member@codershive.com | Member@12345 | Create requests |
| **Operator** | operator@codershive.com | Operator@12345 | Process payments |

---

## 🧪 Testing Scenarios

### Test Manager Login
1. Login with `manager@codershive.com` / `Manager@12345`
2. Should see: Cardholders, Bill Payments, Reports, Statements, Bank Data
3. Should NOT see: Users, Company, Settings

### Test Gateway Manager Login
1. Login with `gateway@codershive.com` / `Gateway@12345`
2. Should see: Gateways, Bill Payments, Reports, Bank Data
3. Can add gateway transactions (Withdrawals, Bills, Transfers, Deposits)

### Test Operator Login
1. Login with `operator@codershive.com` / `Operator@12345`
2. Should see: Bill Payments (pending), Transactions, Gateways (view only), Reports (except Company)
3. Can mark bill payments as paid
4. Can select gateway (PayPoint/InstantMudra)

### Test Member Login
1. Login with `member@codershive.com` / `Member@12345`
2. Should see: Cardholders, Bill Payments, Statements, Bank Data
3. Can create bill payment requests
4. Can upload statements
5. Can classify transactions

---

## ⚠️ Important Notes

1. **Default Users:** These users are automatically created when the server starts (if they don't exist)
2. **Password Format:** All passwords follow pattern: `Role@12345`
3. **Email Domain:** All test emails use `@codershive.com`
4. **Case Sensitive:** Email is case-insensitive, but password is case-sensitive

---

## 🔄 Reset Users

If you need to reset these users, you can:
1. Delete them from the database
2. Restart the server - they will be recreated automatically

---

## 📝 Login URL

- **Local Development:** `http://localhost:5174/login` (or your frontend port)
- **Production:** Your production URL + `/login`

---

**Last Updated:** Based on `backend/server.js` default user seeding

