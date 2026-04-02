import { useState } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Users from './pages/Users';
import Groups from './pages/Groups';
import Permissions from './pages/Permissions';
import Login from './pages/Login';
import Settings from './pages/Settings';
import DepartmentSetup from './pages/setup/DepartmentSetup';
import DesignationSetup from './pages/setup/DesignationSetup';
import EmployeeTypeSetup from './pages/setup/EmployeeTypeSetup';
import DutyShiftSetup from './pages/setup/DutyShiftSetup';
import BankSetup from './pages/setup/BankSetup';
import { AccessControlProvider } from './context/AccessControlContext';
import {
  clearAuthToken,
  clearStoredAuthState,
  getAuthToken,
  getStoredAuthState,
  setAuthToken,
  setStoredAuthState,
} from './lib/auth';

function ProtectedRoute({ isAuthenticated }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => getStoredAuthState() && !!getAuthToken());

  const handleLogin = (authData) => {
    setAuthToken(authData?.token || '');
    setIsAuthenticated(true);
    setStoredAuthState(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    clearAuthToken();
    clearStoredAuthState();
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />}
      />

      <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
        <Route
          element={
            <AccessControlProvider>
              <Layout onLogout={handleLogout} />
            </AccessControlProvider>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/users" element={<Users />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/permissions" element={<Permissions />} />
          <Route path="/setup/departments" element={<DepartmentSetup />} />
          <Route path="/setup/designations" element={<DesignationSetup />} />
          <Route path="/setup/employee-types" element={<EmployeeTypeSetup />} />
          <Route path="/setup/duty-shifts" element={<DutyShiftSetup />} />
          <Route path="/setup/banks" element={<BankSetup />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}
