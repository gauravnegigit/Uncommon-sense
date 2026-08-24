import React from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import OfflineSyncBadge from './components/OfflineSyncBadge';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import TriagePortal from './pages/TriagePortal';
import DoctorDashboard from './pages/DoctorDashboard';
import ClinicLocator from './pages/ClinicLocator';
import PatientHistory from './pages/PatientHistory';
import EmergencySOS from './pages/EmergencySOS';
import { Heart, PhoneCall, ShieldCheck, MapPin } from 'lucide-react';
import { useAuth } from './context/AuthContext';

// Protected Route Guard for Patient Dashboard
const ProtectedPatientRoute = ({ children }) => {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (role !== 'patient') {
    return <Navigate to="/doctor" replace />;
  }
  return children;
};

// Protected Route Guard for Doctor Dashboard
const ProtectedDoctorRoute = ({ children }) => {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (role !== 'doctor') {
    return <Navigate to="/triage" replace />;
  }
  return children;
};

const App = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF7] font-sans text-[#26302E]">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route 
            path="/triage" 
            element={
              <ProtectedPatientRoute>
                <TriagePortal />
              </ProtectedPatientRoute>
            } 
          />
          <Route 
            path="/doctor" 
            element={
              <ProtectedDoctorRoute>
                <DoctorDashboard />
              </ProtectedDoctorRoute>
            } 
          />
          
          <Route path="/clinics" element={<ClinicLocator />} />
          <Route path="/records" element={<PatientHistory />} />
          <Route path="/emergency" element={<EmergencySOS />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global Offline Sync Pill */}
      <OfflineSyncBadge />

      {/* Footer */}
      <footer className="bg-[#164E4A] text-white pt-12 pb-8 px-4 sm:px-6 lg:px-8 mt-12 border-t-2 border-[#BFDCD2]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-xs">
          
          {/* Col 1: Brand & Mission */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <img 
                src="/assets/logo.png" 
                alt="GraminHealth" 
                className="w-8 h-8 rounded-xl object-cover border border-[#BFDCD2]"
                onError={(e) => { e.target.src = '/assets/logo.png'; }}
              />
              <span className="font-extrabold text-base text-white tracking-tight">
                Gramin<span className="text-[#2E8B83]">Health</span>
              </span>
            </div>
            <p className="text-[#BFDCD2] leading-relaxed">
              Multilingual, voice-first rural health triage and care referral network. Safe deterministic classification without disease diagnosis.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-[#E7D88A] font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Ayushman Bharat Digital Mission (ABDM) Standard</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Portals & Tools</h4>
            <ul className="space-y-1.5 text-[#BFDCD2]">
              <li><Link to="/" className="hover:text-white">🏠 Home</Link></li>
              <li><Link to="/clinics" className="hover:text-white">🗺️ Rural PHC Locator Map</Link></li>
              <li><Link to="/login" className="hover:text-white">👤 Patient Sign In / Sign Up</Link></li>
              <li><Link to="/login" className="hover:text-white">🩺 Doctor Clinical Access</Link></li>
            </ul>
          </div>

          {/* Col 3: Clinical Safety Notice */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Safety Disclaimer</h4>
            <p className="text-[#BFDCD2] leading-relaxed text-[11px]">
              ⚠️ GraminHealth is a <strong>care referral & urgency triage assistant</strong>. It does not provide medical diagnoses or replace clinical examination by a registered medical doctor.
            </p>
          </div>

          {/* Col 4: Emergency Helplines */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Emergency 24x7</h4>
            <div className="p-3 bg-white/10 rounded-2xl border border-white/20 text-white space-y-1">
              <p className="font-extrabold text-xs flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-[#E7D88A]" />
                <span>108 Ambulance SOS</span>
              </p>
              <p className="text-[11px] text-[#BFDCD2]">Toll-free 24-hour emergency medical response</p>
            </div>
            <p className="text-[11px] text-[#BFDCD2]">
              National Health Helpline: <strong>104</strong> | Child Helpline: <strong>1098</strong>
            </p>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-[#BFDCD2]">
          <p>© {new Date().getFullYear()} GraminHealth. Rural Medical Assistance Platform.</p>
          <p className="text-[11px]">Designed with Deep Teal (#164E4A), Primary Teal (#2E8B83), Light Mint (#BFDCD2).</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
