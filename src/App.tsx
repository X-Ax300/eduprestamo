import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import LoginForm from './components/Auth/LoginForm';
import Layout from './components/Layout/Layout';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import TeacherDashboard from './components/Dashboard/TeacherDashboard';
import StudentDashboard from './components/Dashboard/StudentDashboard';
import InventoryPage from './components/Admin/InventoryPage';
import UsersPage from './components/Admin/UsersPage';
import LoansPage from './components/Admin/LoansPage';
import ReturnsPage from './components/Admin/ReturnsPage';
import SettingsPage from './components/Admin/SettingsPage';
import EquipmentPage from './components/Student/EquipmentPage';
import MyLoansPage from './components/Student/MyLoansPage';
import ApprovalsPage from './components/Teacher/ApprovalsPage';
import StudentsPage from './components/Common/StudentsPage';
import ReportsPage from './components/Common/ReportsPage';
import NotificationsPage from './components/Common/NotificationsPage';
import ProfilePage from './components/Profile/ProfilePage';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'student':
      return <StudentDashboard />;
    default:
      return <div>Rol no reconocido</div>;
  }
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4 mx-auto animate-pulse">
            <span className="text-white font-bold text-xl">EP</span>
          </div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <Routes>
      <Route path="/" element={<Layout><Dashboard /></Layout>} />
      
      {/* Admin routes */}
      {user?.role === 'admin' && (
        <>
          <Route path="/inventory" element={<Layout><InventoryPage /></Layout>} />
          <Route path="/users" element={<Layout><UsersPage /></Layout>} />
          <Route path="/loans" element={<Layout><LoansPage /></Layout>} />
          <Route path="/returns" element={<Layout><ReturnsPage /></Layout>} />
          <Route path="/settings" element={<Layout><SettingsPage /></Layout>} />
        </>
      )}
      
      {/* Teacher routes */}
      {user?.role === 'teacher' && (
        <>
          <Route path="/approvals" element={<Layout><ApprovalsPage /></Layout>} />
          <Route path="/loans" element={<Layout><LoansPage /></Layout>} />
        </>
      )}
      
      {/* Student routes */}
      {user?.role === 'student' && (
        <>
          <Route path="/equipment" element={<Layout><EquipmentPage /></Layout>} />
          <Route path="/my-loans" element={<Layout><MyLoansPage /></Layout>} />
        </>
      )}
      
      {/* Common routes for admin and teacher */}
      {(user?.role === 'admin' || user?.role === 'teacher') && (
        <>
          <Route path="/students" element={<Layout><StudentsPage /></Layout>} />
          <Route path="/reports" element={<Layout><ReportsPage /></Layout>} />
        </>
      )}
      
      {/* Common routes for all users */}
      <Route path="/notifications" element={<Layout><NotificationsPage /></Layout>} />
      <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />
      
      {/* Redirect unknown routes */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <AppRoutes />
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;