import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './contexts/AuthContext';

// Layouts
import PatientLayout from './layouts/PatientLayout';
import InsurerLayout from './layouts/InsurerLayout';
import AuthLayout from './layouts/AuthLayout';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Patient Pages
import PatientDashboard from './pages/patient/Dashboard';
import SubmitClaim from './pages/patient/SubmitClaim';
import PatientClaimDetails from './pages/patient/ClaimDetails';

// Insurer Pages
import InsurerDashboard from './pages/insurer/Dashboard';
import InsurerClaimDetails from './pages/insurer/ClaimDetails';

// Utils
import PrivateRoute from './utils/PrivateRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Patient Routes */}
          <Route element={<PrivateRoute role="patient" />}>
            <Route element={<PatientLayout />}>
              <Route path="/patient/dashboard" element={<PatientDashboard />} />
              <Route path="/patient/submit-claim" element={<SubmitClaim />} />
              <Route path="/patient/claims/:id" element={<PatientClaimDetails />} />
            </Route>
          </Route>

          {/* Insurer Routes */}
          <Route element={<PrivateRoute role="insurer" />}>
            <Route element={<InsurerLayout />}>
              <Route path="/insurer/dashboard" element={<InsurerDashboard />} />
              <Route path="/insurer/claims/:id" element={<InsurerClaimDetails />} />
            </Route>
          </Route>

          {/* Redirect to login for any other path */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
      </AuthProvider>
    </Router>
  );
}

export default App;
