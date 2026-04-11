import { useEffect, useState } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Users from './pages/Users';
import Groups from './pages/Groups';
import Permissions from './pages/Permissions';
import Login from './pages/Login';
import Settings from './pages/Settings';
import AccessDenied from './pages/AccessDenied';
import DepartmentSetup from './pages/setup/DepartmentSetup';
import DesignationSetup from './pages/setup/DesignationSetup';
import EmployeeTypeSetup from './pages/setup/EmployeeTypeSetup';
import DutyShiftSetup from './pages/setup/DutyShiftSetup';
import BankSetup from './pages/setup/BankSetup';
import ItemTypesSetup from './pages/setup/ItemTypesSetup';
import CategoriesSetup from './pages/setup/CategoriesSetup';
import SubCategoriesSetup from './pages/setup/SubCategoriesSetup';
import ManufacturersSetup from './pages/setup/ManufacturersSetup';
import UnitsSetup from './pages/setup/UnitsSetup';
import LocationsSetup from './pages/setup/LocationsSetup';
import SuppliersSetup from './pages/setup/SuppliersSetup';
import CompanySetup from './pages/setup/CompanySetup';
import ItemDefinition from './pages/stock/ItemDefinition';
import OpeningStock from './pages/stock/OpeningStock';
import ServicesProducts from './pages/stock/ServicesProducts';
import ItemReport from './pages/reports/ItemReport';
import PublicProductView from './pages/PublicProductView';
import { AccessControlProvider } from './context/AccessControlContext';
import { authService } from './services/auth.service';
import {
  clearAuthSession,
  extractPermissionsFromAuthData,
  extractTokenFromAuthData,
  getReadPermissionsForPath,
  getAuthToken,
  getStoredAuthState,
  hasAnyPermission,
  redirectToLoginOnSessionExpiry,
  setAuthToken,
  setStoredPermissions,
  setStoredAuthState,
  setStoredUser,
} from './lib/auth';

function ProtectedRoute({ isAuthenticated }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function PermissionRoute({ requiredPermissions }) {
  const location = useLocation();

  const hasAccess = hasAnyPermission(requiredPermissions);

  if (!hasAccess) {
    return <Navigate to="/access-denied" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => getStoredAuthState() && !!getAuthToken());

  const handleLogin = (authData) => {
    setAuthToken(extractTokenFromAuthData(authData));
    setStoredPermissions(extractPermissionsFromAuthData(authData));
    setStoredUser(authData);
    setIsAuthenticated(true);
    setStoredAuthState(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    clearAuthSession();
  };

  useEffect(() => {
    let isActive = true;

    if (!isAuthenticated || !getAuthToken()) {
      return undefined;
    }

    const validateToken = async () => {
      try {
        await authService.checkToken();
      } catch (error) {
        if (!isActive) return;

        if (error?.status === 401 && error?.payload?.error?.isExpired) {
          setIsAuthenticated(false);
          redirectToLoginOnSessionExpiry();
        }
      }
    };

    validateToken();

    return () => {
      isActive = false;
    };
  }, [isAuthenticated]);

  return (
    <Routes>
      <Route path="/product/:barcode" element={<PublicProductView />} />

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
          <Route element={<PermissionRoute requiredPermissions={getReadPermissionsForPath('/employees')} />}>
            <Route path="/employees" element={<Employees />} />
          </Route>
          <Route path="/access-denied" element={<AccessDenied />} />
          <Route element={<PermissionRoute requiredPermissions={getReadPermissionsForPath('/users')} />}>
            <Route path="/users" element={<Users />} />
          </Route>
          <Route element={<PermissionRoute requiredPermissions={getReadPermissionsForPath('/groups')} />}>
            <Route path="/groups" element={<Groups />} />
          </Route>
          <Route element={<PermissionRoute requiredPermissions={getReadPermissionsForPath('/permissions')} />}>
            <Route path="/permissions" element={<Permissions />} />
          </Route>
          <Route element={<PermissionRoute requiredPermissions={getReadPermissionsForPath('/setup/departments')} />}>
            <Route path="/setup/departments" element={<DepartmentSetup />} />
          </Route>
          <Route element={<PermissionRoute requiredPermissions={getReadPermissionsForPath('/setup/designations')} />}>
            <Route path="/setup/designations" element={<DesignationSetup />} />
          </Route>
          <Route element={<PermissionRoute requiredPermissions={getReadPermissionsForPath('/setup/employee-types')} />}>
            <Route path="/setup/employee-types" element={<EmployeeTypeSetup />} />
          </Route>
          <Route element={<PermissionRoute requiredPermissions={getReadPermissionsForPath('/setup/duty-shifts')} />}>
            <Route path="/setup/duty-shifts" element={<DutyShiftSetup />} />
          </Route>
          <Route element={<PermissionRoute requiredPermissions={getReadPermissionsForPath('/setup/banks')} />}>
            <Route path="/setup/banks" element={<BankSetup />} />
          </Route>
          <Route element={<PermissionRoute requiredPermissions={getReadPermissionsForPath('/setup/company')} />}>
            <Route path="/setup/company" element={<CompanySetup />} />
          </Route>
          <Route element={<PermissionRoute requiredPermissions={getReadPermissionsForPath('/setup/items/item-types')} />}>
            <Route path="/setup/items/item-types" element={<ItemTypesSetup />} />
          </Route>
          <Route element={<PermissionRoute requiredPermissions={getReadPermissionsForPath('/setup/items/categories')} />}>
            <Route path="/setup/items/categories" element={<CategoriesSetup />} />
          </Route>
          <Route element={<PermissionRoute requiredPermissions={getReadPermissionsForPath('/setup/items/sub-categories')} />}>
            <Route path="/setup/items/sub-categories" element={<SubCategoriesSetup />} />
          </Route>
          <Route element={<PermissionRoute requiredPermissions={getReadPermissionsForPath('/setup/items/manufacturers')} />}>
            <Route path="/setup/items/manufacturers" element={<ManufacturersSetup />} />
          </Route>
          <Route element={<PermissionRoute requiredPermissions={getReadPermissionsForPath('/setup/items/units')} />}>
            <Route path="/setup/items/units" element={<UnitsSetup />} />
          </Route>
          <Route element={<PermissionRoute requiredPermissions={getReadPermissionsForPath('/setup/items/locations')} />}>
            <Route path="/setup/items/locations" element={<LocationsSetup />} />
          </Route>
          <Route element={<PermissionRoute requiredPermissions={getReadPermissionsForPath('/setup/items/suppliers')} />}>
            <Route path="/setup/items/suppliers" element={<SuppliersSetup />} />
          </Route>
          <Route element={<PermissionRoute requiredPermissions={getReadPermissionsForPath('/stock/item-definition')} />}>
            <Route path="/stock/item-definition" element={<ItemDefinition />} />
          </Route>
          <Route element={<PermissionRoute requiredPermissions={getReadPermissionsForPath('/stock/opening-stock')} />}>
            <Route path="/stock/opening-stock" element={<OpeningStock />} />
          </Route>
          <Route element={<PermissionRoute requiredPermissions={getReadPermissionsForPath('/services-products')} />}>
            <Route path="/services-products" element={<ServicesProducts />} />
          </Route>
          <Route element={<PermissionRoute requiredPermissions={getReadPermissionsForPath('/reports/item-report')} />}>
            <Route path="/reports/item-report" element={<ItemReport />} />
          </Route>
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}
