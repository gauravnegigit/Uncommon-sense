import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Heart, Activity, Stethoscope, MapPin, 
  Globe, Wifi, WifiOff, LogOut, ShieldAlert, Menu, X, UserPlus, LogIn
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useOfflineQueue } from '../context/OfflineQueueContext';
import EmergencySOSModal from './EmergencySOSModal';

const Navbar = () => {
  const { user, role, logout, isAuthenticated } = useAuth();
  const { language, changeLanguage } = useLanguage();
  const { isOnline, toggleSimulatedOffline, pendingCount } = useOfflineQueue();
  const location = useLocation();
  const navigate = useNavigate();

  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Dynamic Navigation Links strictly matching Auth state
  const navLinks = [
    { path: '/', label: '🏠 Home', icon: Heart, show: true },
    { path: '/triage', label: '👤 Patient Dashboard', icon: Activity, show: isAuthenticated && role === 'patient' },
    { path: '/doctor', label: '🩺 Doctor Dashboard', icon: Stethoscope, show: isAuthenticated && role === 'doctor' },
    { path: '/clinics', label: 'Nearby Facilities', icon: MapPin, show: true }
  ].filter(link => link.show);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#BFDCD2] shadow-xs">
        {/* Top Emergency & Status Ticker */}
        <div className="bg-[#164E4A] text-white text-xs px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#E7D88A] animate-pulse" />
            <span className="font-semibold tracking-wide">
              108 Emergency Ambulance Active • Safety-First Deterministic Triage
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Offline Simulation Toggle */}
            <button
              onClick={toggleSimulatedOffline}
              title="Toggle network simulation"
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                isOnline ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30' : 'bg-amber-500/30 text-amber-200 border border-amber-400/40'
              }`}
            >
              {isOnline ? <Wifi className="w-3 h-3 text-emerald-300" /> : <WifiOff className="w-3 h-3 text-amber-300" />}
              <span>{isOnline ? 'Online' : `Offline (${pendingCount} queued)`}</span>
            </button>

            {/* Language Selection */}
            <div className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded border border-white/20 text-[11px]">
              <Globe className="w-3 h-3 text-[#BFDCD2]" />
              <select
                value={language}
                onChange={(e) => changeLanguage(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="en" className="text-slate-900">English</option>
                <option value="hi" className="text-slate-900">हिंदी (Hindi)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo & Brand */}
            <Link to="/" className="flex items-center gap-3 group">
              <img 
                src="/assets/logo.png" 
                alt="GraminHealth Logo" 
                className="w-10 h-10 rounded-xl object-cover border border-[#BFDCD2] shadow-xs group-hover:scale-105 transition-transform duration-200"
                onError={(e) => { e.target.src = '/assets/logo.png'; }}
              />
              <div>
                <span className="font-extrabold text-lg text-[#164E4A] tracking-tight flex items-center gap-1">
                  Gramin<span className="text-[#2E8B83]">Health</span>
                </span>
                <span className="block text-[10px] text-[#2E8B83] font-bold tracking-wider uppercase -mt-0.5">
                  Rural Medical Assistance
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 bg-[#F8FAF7] p-1 rounded-full border border-[#BFDCD2]">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-150 ${
                      isActive
                        ? 'bg-[#2E8B83] text-white shadow-xs'
                        : 'text-[#26302E] hover:text-[#164E4A] hover:bg-[#BFDCD2]/40'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Action Buttons & Auth State */}
            <div className="hidden lg:flex items-center gap-2.5">
              {/* Live Map Link */}
              <Link
                to="/clinics"
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#BFDCD2]/50 hover:bg-[#2E8B83] hover:text-white text-[#164E4A] border border-[#2E8B83] text-xs font-bold rounded-full transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>🗺️ Live Map</span>
              </Link>

              {/* 108 Emergency SOS Button */}
              <button
                onClick={() => setIsSOSOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#d9383a] hover:bg-rose-700 text-white text-xs font-extrabold rounded-full shadow-xs transition-all active:scale-95"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>🚨 108 SOS</span>
              </button>

              {/* Authenticated Profile or Guest Sign In/Up */}
              {isAuthenticated && user ? (
                <div className="flex items-center gap-2 pl-2 border-l border-[#BFDCD2]">
                  <div className="bg-[#BFDCD2]/40 text-[#164E4A] px-3 py-1 rounded-full text-xs font-bold">
                    {role === 'doctor' ? '🩺 ' : '👤 '} {user.name}
                  </div>
                  <button
                    onClick={() => { logout(); navigate('/'); }}
                    title="Sign Out"
                    className="flex items-center gap-1 px-3 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-full text-xs font-bold transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="flex items-center gap-1 px-3.5 py-1.5 bg-[#164E4A] hover:bg-[#0d3835] text-white text-xs font-bold rounded-full shadow-xs transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </Link>
                  <Link
                    to="/login?mode=signup"
                    className="flex items-center gap-1 px-3.5 py-1.5 bg-[#2E8B83] hover:bg-[#164E4A] text-white text-xs font-bold rounded-full shadow-xs transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Sign Up</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => setIsSOSOpen(true)}
                className="p-2 bg-[#d9383a] text-white rounded-full text-xs font-bold"
              >
                <ShieldAlert className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-xl text-[#164E4A] hover:bg-[#BFDCD2]/30"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-[#BFDCD2] px-4 pt-2 pb-5 space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold ${
                    isActive ? 'bg-[#BFDCD2] text-[#164E4A]' : 'text-[#26302E] hover:bg-[#F8FAF7]'
                  }`}
                >
                  <Icon className="w-4 h-4 text-[#2E8B83]" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <div className="pt-3 border-t border-[#BFDCD2] flex flex-col gap-2">
              {isAuthenticated && user ? (
                <button
                  onClick={() => { logout(); setIsMobileMenuOpen(false); navigate('/'); }}
                  className="w-full py-2 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out ({user.name})</span>
                </button>
              ) : (
                <div className="flex gap-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex-1 py-2 bg-[#164E4A] text-white text-center text-xs font-bold rounded-xl"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/login?mode=signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex-1 py-2 bg-[#2E8B83] text-white text-center text-xs font-bold rounded-xl"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Emergency SOS Modal */}
      {isSOSOpen && <EmergencySOSModal onClose={() => setIsSOSOpen(false)} />}
    </>
  );
};

export default Navbar;
