import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import ProtectedRoute, { PublicRoute } from "components/ProtectedRoute";
import RoleBasedRoute from "components/RoleBasedRoute";
import Layout from "components/Layout";
import NotFound from "pages/NotFound";
import Login from './pages/login';
import Signup from './pages/signup';
import Profile from './pages/profile';
import ResetPassword from './pages/reset-password';
import AdminLogin from './pages/auth/AdminLogin';
import ManagerLogin from './pages/auth/ManagerLogin';
import GatewayLogin from './pages/auth/GatewayLogin';
import AdminPortalLogin from './pages/admin/AdminLogin';
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
import EditBank from './pages/bank-data/[id]/edit';
import BillPayments from './pages/bill-payments';
import BillPaymentDetail from './pages/bill-payments/[id]';
import AddBillPayment from './pages/bill-payments/add';
import EditBillPayment from './pages/bill-payments/[id]/edit';
import Users from './pages/users/index';
import AddUser from './pages/users/add';
import Reports from './pages/reports/index';
import CompanyDashboard from './pages/company/index';
import CompanyProfits from './pages/company/profits';
import Gateways from './pages/gateways/index';
import Alerts from './pages/alerts/index';

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
              <PublicRoute allowAuthenticated={true}>
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
            path="/admin" 
            element={
              <PublicRoute>
                <AdminPortalLogin />
              </PublicRoute>
            } 
          />
          <Route 
            path="/admin-portal" 
            element={
              <PublicRoute>
                <AdminPortalLogin />
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

          {/* Root Route - Redirect to Login */}
          <Route 
            path="/" 
            element={
              <PublicRoute allowAuthenticated={true}>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <RoleBasedRoute allowedRoles={['admin', 'manager', 'member', 'gateway_manager', 'operator']}>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </RoleBasedRoute>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/card-details" 
            element={
              <ProtectedRoute>
                <RoleBasedRoute allowedRoles={['admin', 'manager', 'member']}>
                  <Layout>
                    <CardDetails />
                  </Layout>
                </RoleBasedRoute>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/add-credit-card" 
            element={
              <ProtectedRoute>
                <RoleBasedRoute allowedRoles={['admin', 'manager', 'member']}>
                  <Layout>
                    <AddCreditCard />
                  </Layout>
                </RoleBasedRoute>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/add-transaction" 
            element={
              <ProtectedRoute>
                <RoleBasedRoute allowedRoles={['admin', 'manager', 'member']}>
                  <Layout>
                    <AddTransaction />
                  </Layout>
                </RoleBasedRoute>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <RoleBasedRoute allowedRoles={['admin', 'manager', 'member', 'gateway_manager', 'operator']}>
                  <Layout>
                    <Profile />
                  </Layout>
                </RoleBasedRoute>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/cardholders" 
            element={
              <ProtectedRoute>
                <RoleBasedRoute allowedRoles={['admin', 'manager', 'member', 'operator']}>
                  <Layout>
                    <Cardholders />
                  </Layout>
                </RoleBasedRoute>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/cardholders/add" 
            element={
              <ProtectedRoute>
                <RoleBasedRoute allowedRoles={['admin', 'manager', 'member']}>
                  <Layout>
                    <AddCardholder />
                  </Layout>
                </RoleBasedRoute>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/cardholders/:id/edit" 
            element={
              <ProtectedRoute>
                <RoleBasedRoute allowedRoles={['admin', 'manager', 'member', 'operator']}>
                  <Layout>
                    <AddCardholder />
                  </Layout>
                </RoleBasedRoute>
              </ProtectedRoute>
            } 
          />
                 <Route
                   path="/cardholders/:id"
                   element={
                     <ProtectedRoute>
                       <RoleBasedRoute allowedRoles={['admin', 'manager', 'member', 'operator']}>
                         <Layout>
                           <CardholderDashboard />
                         </Layout>
                       </RoleBasedRoute>
                     </ProtectedRoute>
                   }
                 />
                 <Route
                   path="/statements"
                   element={
                     <ProtectedRoute>
                       <RoleBasedRoute allowedRoles={['admin', 'manager', 'member']}>
                         <Layout>
                           <Statements />
                         </Layout>
                       </RoleBasedRoute>
                     </ProtectedRoute>
                   }
                 />
                 <Route
                   path="/statements/:id"
                   element={
                     <ProtectedRoute>
                       <RoleBasedRoute allowedRoles={['admin', 'manager', 'member']}>
                         <Layout>
                           <StatementDetail />
                         </Layout>
                       </RoleBasedRoute>
                     </ProtectedRoute>
                   }
                 />
                 <Route
                   path="/statements/upload"
                   element={
                     <ProtectedRoute>
                       <RoleBasedRoute allowedRoles={['admin', 'manager', 'member']}>
                         <Layout>
                           <UploadStatement />
                         </Layout>
                       </RoleBasedRoute>
                     </ProtectedRoute>
                   }
                 />
                 <Route
                   path="/bill-payments"
                   element={
                     <ProtectedRoute>
                       <RoleBasedRoute allowedRoles={['admin', 'manager', 'member', 'gateway_manager', 'operator']}>
                         <Layout>
                           <BillPayments />
                         </Layout>
                       </RoleBasedRoute>
                     </ProtectedRoute>
                   }
                 />
                 <Route
                   path="/bill-payments/:id"
                   element={
                     <ProtectedRoute>
                       <RoleBasedRoute allowedRoles={['admin', 'manager', 'member', 'gateway_manager', 'operator']}>
                         <Layout>
                           <BillPaymentDetail />
                         </Layout>
                       </RoleBasedRoute>
                     </ProtectedRoute>
                   }
                 />
                 <Route
                   path="/bill-payments/:id/edit"
                   element={
                     <ProtectedRoute>
                       <RoleBasedRoute allowedRoles={['admin', 'manager', 'member']}>
                         <Layout>
                           <EditBillPayment />
                         </Layout>
                       </RoleBasedRoute>
                     </ProtectedRoute>
                   }
                 />
                 <Route
                   path="/bill-payments/add"
                   element={
                     <ProtectedRoute>
                       <RoleBasedRoute allowedRoles={['admin', 'manager', 'member']}>
                         <Layout>
                           <AddBillPayment />
                         </Layout>
                       </RoleBasedRoute>
                     </ProtectedRoute>
                   }
                 />
                 <Route
                   path="/transactions"
                   element={
                     <ProtectedRoute>
                       <RoleBasedRoute allowedRoles={['admin', 'manager', 'gateway_manager', 'operator']}>
                         <Layout>
                           <Transactions />
                         </Layout>
                       </RoleBasedRoute>
                     </ProtectedRoute>
                   }
                 />
                 <Route
                   path="/bank-summaries"
                   element={
                     <ProtectedRoute>
                       <RoleBasedRoute allowedRoles={['admin', 'manager', 'gateway_manager']}>
                         <Layout>
                           <BankSummaries />
                         </Layout>
                       </RoleBasedRoute>
                     </ProtectedRoute>
                   }
                 />
                 <Route
                   path="/bank-data"
                   element={
                     <ProtectedRoute>
                       <RoleBasedRoute allowedRoles={['admin', 'manager', 'gateway_manager']}>
                         <Layout>
                           <BankData />
                         </Layout>
                       </RoleBasedRoute>
                     </ProtectedRoute>
                   }
                 />
                 <Route
                   path="/bank-data/add"
                   element={
                     <ProtectedRoute>
                       <RoleBasedRoute allowedRoles={['admin', 'manager', 'gateway_manager']}>
                         <Layout>
                           <AddBank />
                         </Layout>
                       </RoleBasedRoute>
                     </ProtectedRoute>
                   }
                 />
                 <Route
                   path="/bank-data/:id"
                   element={
                     <ProtectedRoute>
                       <RoleBasedRoute allowedRoles={['admin', 'manager', 'gateway_manager']}>
                         <Layout>
                           <BankDashboard />
                         </Layout>
                       </RoleBasedRoute>
                     </ProtectedRoute>
                   }
                 />
                 <Route
                   path="/bank-data/:id/edit"
                   element={
                     <ProtectedRoute>
                       <RoleBasedRoute allowedRoles={['admin', 'manager', 'gateway_manager']}>
                         <Layout>
                           <EditBank />
                         </Layout>
                       </RoleBasedRoute>
                     </ProtectedRoute>
                   }
                 />
                 <Route
                   path="/gateways"
                   element={
                     <ProtectedRoute>
                       <RoleBasedRoute allowedRoles={['admin', 'gateway_manager', 'operator']}>
                         <Layout>
                           <Gateways />
                         </Layout>
                       </RoleBasedRoute>
                     </ProtectedRoute>
                   }
                 />
                 <Route
                   path="/alerts"
                   element={
                     <ProtectedRoute>
                       <RoleBasedRoute allowedRoles={['admin', 'manager', 'operator']}>
                         <Layout>
                           <Alerts />
                         </Layout>
                       </RoleBasedRoute>
                     </ProtectedRoute>
                   }
                 />
                 <Route
                   path="/users"
                   element={
                     <ProtectedRoute>
                       <RoleBasedRoute allowedRoles={['admin', 'manager']}>
                         <Layout>
                           <Users />
                         </Layout>
                       </RoleBasedRoute>
                     </ProtectedRoute>
                   }
                 />
                 <Route
                   path="/users/add"
                   element={
                     <ProtectedRoute>
                       <RoleBasedRoute allowedRoles={['admin']}>
                         <Layout>
                           <AddUser />
                         </Layout>
                       </RoleBasedRoute>
                     </ProtectedRoute>
                   }
                 />
                 <Route
                   path="/reports"
                   element={
                     <ProtectedRoute>
                       <RoleBasedRoute allowedRoles={['admin', 'manager', 'member', 'operator']}>
                         <Layout>
                           <Reports />
                         </Layout>
                       </RoleBasedRoute>
                     </ProtectedRoute>
                   }
                 />
                 <Route
                   path="/company"
                   element={
                     <ProtectedRoute>
                       <RoleBasedRoute allowedRoles={['admin', 'manager']}>
                         <Layout>
                           <CompanyDashboard />
                         </Layout>
                       </RoleBasedRoute>
                     </ProtectedRoute>
                   }
                 />
                 <Route
                   path="/company/profits"
                   element={
                     <ProtectedRoute>
                       <RoleBasedRoute allowedRoles={['admin', 'manager']}>
                         <Layout>
                           <CompanyProfits />
                         </Layout>
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
