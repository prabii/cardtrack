import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import ProtectedRoute, { PublicRoute } from "components/ProtectedRoute";
import RoleBasedRoute from "components/RoleBasedRoute";
import NotFound from "pages/NotFound";
import Login from './pages/login';
import Signup from './pages/signup';
import Profile from './pages/profile';
import ResetPassword from './pages/reset-password';
import AdminLogin from './pages/auth/AdminLogin';
import ManagerLogin from './pages/auth/ManagerLogin';
import GatewayLogin from './pages/auth/GatewayLogin';
import CardDetails from './pages/card-details';
import AddCreditCard from './pages/add-credit-card';
import Dashboard from './pages/dashboard';
import AddTransaction from './pages/add-transaction';
import Cardholders from './pages/cardholders';
import AddCardholder from './pages/cardholders/add';
import CardholderDashboard from './pages/cardholders/[id]';
import Statements from './pages/statements';
import StatementDetail from './pages/statements/[id]';
import UploadStatement from './pages/statements/upload';
import Transactions from './pages/transactions';
import BankSummaries from './pages/bank-summaries';
import BankData from './pages/bank-data';
import BankDashboard from './pages/bank-data/[id]';
import AddBank from './pages/bank-data/add';
import BillPayments from './pages/bill-payments';
import BillPaymentDetail from './pages/bill-payments/[id]';
import AddBillPayment from './pages/bill-payments/add';
import Users from './pages/users/index';
import Reports from './pages/reports/index';
import CompanyDashboard from './pages/company/index';
import CompanyProfits from './pages/company/profits';

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <RouterRoutes>
          {/* Public Routes (Authentication) */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/signup" 
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            } 
          />
          <Route 
            path="/reset-password" 
            element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            } 
          />
          <Route 
            path="/admin-login" 
            element={
              <PublicRoute>
                <AdminLogin />
              </PublicRoute>
            } 
          />
          <Route 
            path="/manager-login" 
            element={
              <PublicRoute>
                <ManagerLogin />
              </PublicRoute>
            } 
          />
          <Route 
            path="/gateway-login" 
            element={
              <PublicRoute>
                <GatewayLogin />
              </PublicRoute>
            } 
          />

          {/* Protected Routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/card-details" 
            element={
              <ProtectedRoute>
                <CardDetails />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/add-credit-card" 
            element={
              <ProtectedRoute>
                <AddCreditCard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/add-transaction" 
            element={
              <ProtectedRoute>
                <AddTransaction />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/cardholders" 
            element={
              <ProtectedRoute>
                <Cardholders />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/cardholders/add" 
            element={
              <ProtectedRoute>
                <AddCardholder />
              </ProtectedRoute>
            } 
          />
                 <Route
                   path="/cardholders/:id"
                   element={
                     <ProtectedRoute>
                       <CardholderDashboard />
                     </ProtectedRoute>
                   }
                 />
                 <Route
                   path="/cardholders/:id/edit"
                   element={
                     <ProtectedRoute>
                       <AddCardholder />
                     </ProtectedRoute>
                   }
                 />
                 <Route
                   path="/statements"
                   element={
                     <ProtectedRoute>
                       <Statements />
                     </ProtectedRoute>
                   }
                 />
                 <Route
                   path="/statements/:id"
                   element={
                     <ProtectedRoute>
                       <StatementDetail />
                     </ProtectedRoute>
                   }
                 />
                 <Route
                   path="/statements/upload"
                   element={
                     <ProtectedRoute>
                       <RoleBasedRoute allowedRoles={['admin', 'manager', 'member']}>
                         <UploadStatement />
                       </RoleBasedRoute>
                     </ProtectedRoute>
                   }
                 />
                 <Route
                   path="/bill-payments"
                   element={
                     <ProtectedRoute>
                       <BillPayments />
                     </ProtectedRoute>
                   }
                 />
                 <Route
                   path="/bill-payments/:id"
                   element={
                     <ProtectedRoute>
                       <BillPaymentDetail />
                     </ProtectedRoute>
                   }
                 />
                 <Route
                   path="/bill-payments/add"
                   element={
                     <ProtectedRoute>
                       <AddBillPayment />
                     </ProtectedRoute>
                   }
                 />
                 <Route
                   path="/transactions"
                   element={
                     <ProtectedRoute>
                       <RoleBasedRoute allowedRoles={['admin', 'manager', 'gateway_manager']}>
                         <Transactions />
                       </RoleBasedRoute>
                     </ProtectedRoute>
                   }
                 />
                 <Route
                   path="/bank-summaries"
                   element={
                     <ProtectedRoute>
                       <RoleBasedRoute allowedRoles={['admin', 'manager', 'gateway_manager']}>
                         <BankSummaries />
                       </RoleBasedRoute>
                     </ProtectedRoute>
                   }
                 />
                 <Route
                   path="/bank-data"
                   element={
                     <ProtectedRoute>
                       <RoleBasedRoute allowedRoles={['admin', 'manager', 'gateway_manager']}>
                         <BankData />
                       </RoleBasedRoute>
                     </ProtectedRoute>
                   }
                 />
                 <Route
                   path="/bank-data/add"
                   element={
                     <ProtectedRoute>
                       <RoleBasedRoute allowedRoles={['admin', 'manager', 'gateway_manager']}>
                         <AddBank />
                       </RoleBasedRoute>
                     </ProtectedRoute>
                   }
                 />
                 <Route
                   path="/bank-data/:id"
                   element={
                     <ProtectedRoute>
                       <RoleBasedRoute allowedRoles={['admin', 'manager', 'gateway_manager']}>
                         <BankDashboard />
                       </RoleBasedRoute>
                     </ProtectedRoute>
                   }
                 />
                 <Route
                   path="/bill-payments"
                   element={
                     <ProtectedRoute>
                       <BillPayments />
                     </ProtectedRoute>
                   }
                 />
                 <Route
                   path="/bill-payments/add"
                   element={
                     <ProtectedRoute>
                       <AddBillPayment />
                     </ProtectedRoute>
                   }
                 />
                 <Route
                   path="/users"
                   element={
                     <ProtectedRoute>
                       <RoleBasedRoute allowedRoles={['admin', 'manager']}>
                         <Users />
                       </RoleBasedRoute>
                     </ProtectedRoute>
                   }
                 />
                 <Route
                   path="/reports"
                   element={
                     <ProtectedRoute>
                       <RoleBasedRoute allowedRoles={['admin', 'manager']}>
                         <Reports />
                       </RoleBasedRoute>
                     </ProtectedRoute>
                   }
                 />
                 <Route
                   path="/company"
                   element={
                     <ProtectedRoute>
                       <RoleBasedRoute allowedRoles={['admin', 'manager']}>
                         <CompanyDashboard />
                       </RoleBasedRoute>
                     </ProtectedRoute>
                   }
                 />
                 <Route
                   path="/company/profits"
                   element={
                     <ProtectedRoute>
                       <RoleBasedRoute allowedRoles={['admin', 'manager']}>
                         <CompanyProfits />
                       </RoleBasedRoute>
                     </ProtectedRoute>
                   }
                 />

                 {/* 404 Route */}
                 <Route path="*" element={<NotFound />} />
        </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
