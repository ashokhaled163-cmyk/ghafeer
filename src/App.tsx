import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import ClientSignup from './pages/ClientSignup';
import DriverSignup from './pages/DriverSignup';
import FamilySignup from './pages/FamilySignup';
import Login from './pages/Login';
import Agreement from './pages/Agreement';
import ClientDashboard from './pages/ClientDashboard';
import DriverDashboard from './pages/DriverDashboard';
import AdminDashboard from './pages/AdminDashboard';
import TripPage from './pages/TripPage';
import WalkieTalkie from './pages/WalkieTalkie';
import SparePartsShops from './pages/SparePartsShops';
import RepairShops from './pages/RepairShops';
import ERPDashboard from './pages/ERPDashboard';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <img src="/images/logo.png" className="w-20 h-20 mx-auto mb-4 rounded-full animate-pulse" />
        <p className="text-gray-400 font-semibold">جاري التحميل...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup/client" element={<ClientSignup />} />
      <Route path="/signup/driver" element={<DriverSignup />} />
      <Route path="/signup/family" element={<FamilySignup />} />
      <Route path="/agreement" element={<Agreement />} />
      <Route path="/client" element={<ProtectedRoute roles={['client','family']}><ClientDashboard /></ProtectedRoute>} />
      <Route path="/driver" element={<ProtectedRoute roles={['driver']}><DriverDashboard /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute roles={['super_admin','area_manager','supervisor','street_monitor']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/trip" element={<ProtectedRoute><TripPage /></ProtectedRoute>} />
      <Route path="/walkie" element={<ProtectedRoute><WalkieTalkie /></ProtectedRoute>} />
      <Route path="/shops/parts" element={<SparePartsShops />} />
      <Route path="/shops/repair" element={<RepairShops />} />
      <Route path="/erp" element={<ProtectedRoute roles={['super_admin','area_manager']}><ERPDashboard /></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
