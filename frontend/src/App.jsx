import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context & Providers
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts & Pages
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import ArticleList from './pages/ArticleList';
import ArticleForm from './pages/ArticleForm';
import InviteModerator from './pages/InviteModerator';

// Route guards
const ProtectedRoute = ({ children, roles }) => {
  const { currentUser, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(currentUser.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/onboard" element={<Onboarding />} />

          {/* Protected Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={['ADMIN', 'MODERATOR']}>
                <Dashboard />
             </ProtectedRoute>
            }
          />
          <Route
            path="/articles"
            element={
              <ProtectedRoute roles={['ADMIN', 'MODERATOR']}>
                <ArticleList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/articles/new"
            element={
              <ProtectedRoute roles={['MODERATOR']}>
                <ArticleForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/articles/edit/:id"
            element={
              <ProtectedRoute roles={['MODERATOR']}>
                <ArticleForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/invite"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <InviteModerator />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
