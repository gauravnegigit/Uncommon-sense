import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Heart, User, Stethoscope, ArrowRight, 
  CheckCircle2, AlertCircle, ShieldAlert, KeyRound, Phone, MapPin, Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';

const Login = () => {
  const { login, signup, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'signup'
  const [loginRole, setLoginRole] = useState('patient'); // 'patient' | 'doctor'

  // Login form state
  const [identifier, setIdentifier] = useState('+91 98765 43210');
  const [password, setPassword] = useState('password123');

  // Sign up form state (Patient only)
  const [suName, setSuName] = useState('');
  const [suContact, setSuContact] = useState('');
  const [suVillage, setSuVillage] = useState('');
  const [suPincode, setSuPincode] = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [suConfirmPassword, setSuConfirmPassword] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('482910');

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotContact, setForgotContact] = useState('+91 98765 43210');
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotOtp, setForgotOtp] = useState('559201');
  const [forgotNewPwd, setForgotNewPwd] = useState('newPass@123');

  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('mode') === 'signup') {
      setActiveTab('signup');
    }
  }, [location]);

  const handleRoleChange = (role) => {
    setLoginRole(role);
    setErrorMsg(null);
    if (role === 'doctor') {
      setIdentifier('dr.ananya@health.gov.in');
    } else {
      setIdentifier('+91 98765 43210');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      setErrorMsg('Please provide your Mobile/Email and Password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    const res = await login({ identifier, password, role: loginRole });
    setLoading(false);

    if (res.success) {
      if (loginRole === 'doctor') {
        navigate('/doctor');
      } else {
        navigate('/triage');
      }
    } else {
      setErrorMsg(res.message || 'Authentication failed.');
    }
  };

  const handleSignupProceed = (e) => {
    e.preventDefault();
    if (!suName || !suContact || !suVillage || !suPincode || !suPassword) {
      setErrorMsg('Please fill in all mandatory registration fields.');
      return;
    }
    if (suPassword !== suConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setErrorMsg(null);
    setOtpStep(true);
  };

  const handleVerifyAndCreateAccount = async () => {
    if (!enteredOtp || enteredOtp.length < 4) {
      setErrorMsg('Please enter a valid 6-digit OTP.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    const res = await signup({
      name: suName,
      contact: suContact,
      village: suVillage,
      pincode: suPincode,
      password: suPassword
    });
    setLoading(false);

    if (res.success) {
      navigate('/triage');
    } else {
      setErrorMsg(res.message || 'Account registration failed.');
    }
  };

  const handleSendResetOtp = async () => {
    if (!forgotContact) {
      setErrorMsg('Please enter your registered Mobile or Email.');
      return;
    }
    await authService.sendResetOtp(forgotContact);
    setForgotStep(2);
  };

  const handleResetPassword = async () => {
    await authService.resetPassword(forgotContact, forgotOtp, forgotNewPwd);
    setShowForgotModal(false);
    setSuccessMsg('Password updated successfully. Please Sign In.');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#F8FAF7]">
      <div className="w-full max-w-lg bg-white rounded-3xl border-2 border-[#BFDCD2] shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#164E4A] text-white p-8 text-center relative">
          <img 
            src="/assets/logo.png" 
            alt="GraminHealth" 
            className="w-14 h-14 rounded-2xl mx-auto mb-3 object-cover border-2 border-[#BFDCD2] shadow-md"
            onError={(e) => { e.target.src = '/assets/logo.png'; }}
          />
          <h2 className="text-2xl font-black tracking-tight">GraminHealth Access Portal</h2>
          <p className="text-xs text-[#BFDCD2] mt-1 max-w-xs mx-auto">
            Safety-First Rural Health AI Triage & Teleconsultation Network
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div className="grid grid-cols-2 border-b border-[#BFDCD2] bg-[#F8FAF7] text-xs font-bold text-[#26302E]">
          <button
            onClick={() => { setActiveTab('login'); setErrorMsg(null); }}
            className={`py-3.5 text-center transition-all border-b-2 ${
              activeTab === 'login' 
                ? 'border-[#2E8B83] text-[#164E4A] bg-white font-extrabold shadow-xs' 
                : 'border-transparent hover:text-[#164E4A]'
            }`}
          >
            Sign In (लॉग इन)
          </button>
          <button
            onClick={() => { setActiveTab('signup'); setErrorMsg(null); }}
            className={`py-3.5 text-center transition-all border-b-2 ${
              activeTab === 'signup' 
                ? 'border-[#2E8B83] text-[#164E4A] bg-white font-extrabold shadow-xs' 
                : 'border-transparent hover:text-[#164E4A]'
            }`}
          >
            New Patient Sign Up (नया खाता)
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: SIGN IN */}
          {activeTab === 'login' && (
            <div className="space-y-4">
              {/* Role Toggle: Patient vs Doctor */}
              <div className="flex gap-2 p-1 bg-[#F8FAF7] rounded-full border border-[#BFDCD2]">
                <button
                  type="button"
                  onClick={() => handleRoleChange('patient')}
                  className={`flex-1 py-2 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5 ${
                    loginRole === 'patient' ? 'bg-[#164E4A] text-white shadow-xs' : 'text-[#26302E] hover:text-[#164E4A]'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>👤 Patient Login</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange('doctor')}
                  className={`flex-1 py-2 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5 ${
                    loginRole === 'doctor' ? 'bg-[#164E4A] text-white shadow-xs' : 'text-[#26302E] hover:text-[#164E4A]'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>🩺 Doctor Login</span>
                </button>
              </div>

              {loginRole === 'doctor' && (
                <div className="p-3 bg-[#FEFCE8] border border-[#E7D88A] rounded-2xl text-[11px] text-[#164E4A] leading-relaxed">
                  🛡️ <strong>Hospital Doctor Access:</strong> Doctor accounts are provisioned directly by Hospital Administration and District CMO. Sign Up is disabled for doctors.
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-extrabold text-[#164E4A] block mb-1">
                    Mobile Number or Email Address
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={loginRole === 'doctor' ? 'dr.ananya@health.gov.in' : '+91 98765 43210'}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAF7] border border-[#BFDCD2] rounded-xl text-xs font-bold text-[#26302E] focus:outline-none focus:border-[#2E8B83] focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-extrabold text-[#164E4A]">Password / Security PIN</label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-[11px] font-bold text-[#2E8B83] hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-[#F8FAF7] border border-[#BFDCD2] rounded-xl text-xs font-bold text-[#26302E] focus:outline-none focus:border-[#2E8B83] focus:bg-white"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#2E8B83] hover:bg-[#164E4A] text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-98"
                >
                  {loading ? 'Authenticating...' : 'Sign In with Secure Auth →'}
                </button>
              </form>

              {loginRole === 'patient' && (
                <div className="pt-3 border-t border-[#BFDCD2] text-center text-xs text-[#26302E]">
                  New to GraminHealth?{' '}
                  <button
                    onClick={() => setActiveTab('signup')}
                    className="font-extrabold text-[#2E8B83] hover:underline"
                  >
                    Create a Free Patient Account
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SIGN UP (PATIENTS ONLY) */}
          {activeTab === 'signup' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl text-[11px] text-[#1E40AF] leading-relaxed">
                ℹ️ <strong>Citizen Registration:</strong> Public sign-up is open to rural patients. Registered Doctors are pre-authorized by their affiliated Hospital / PHC Administration.
              </div>

              {!otpStep ? (
                <form onSubmit={handleSignupProceed} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-extrabold text-[#164E4A] block mb-1">Full Name (पूरा नाम) *</label>
                      <input
                        type="text"
                        value={suName}
                        onChange={(e) => setSuName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full px-3 py-2 bg-[#F8FAF7] border border-[#BFDCD2] rounded-xl text-xs font-bold text-[#26302E] focus:outline-none focus:border-[#2E8B83]"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-extrabold text-[#164E4A] block mb-1">Mobile / Email *</label>
                      <input
                        type="text"
                        value={suContact}
                        onChange={(e) => setSuContact(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3 py-2 bg-[#F8FAF7] border border-[#BFDCD2] rounded-xl text-xs font-bold text-[#26302E] focus:outline-none focus:border-[#2E8B83]"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-extrabold text-[#164E4A] block mb-1">Village / Town Address *</label>
                      <input
                        type="text"
                        value={suVillage}
                        onChange={(e) => setSuVillage(e.target.value)}
                        placeholder="e.g. Sonapur, Block B"
                        className="w-full px-3 py-2 bg-[#F8FAF7] border border-[#BFDCD2] rounded-xl text-xs font-bold text-[#26302E] focus:outline-none focus:border-[#2E8B83]"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-extrabold text-[#164E4A] block mb-1">PIN Code *</label>
                      <input
                        type="text"
                        value={suPincode}
                        onChange={(e) => setSuPincode(e.target.value)}
                        placeholder="721101"
                        maxLength={6}
                        className="w-full px-3 py-2 bg-[#F8FAF7] border border-[#BFDCD2] rounded-xl text-xs font-bold text-[#26302E] focus:outline-none focus:border-[#2E8B83]"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-extrabold text-[#164E4A] block mb-1">Password *</label>
                      <input
                        type="password"
                        value={suPassword}
                        onChange={(e) => setSuPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        minLength={6}
                        className="w-full px-3 py-2 bg-[#F8FAF7] border border-[#BFDCD2] rounded-xl text-xs font-bold text-[#26302E] focus:outline-none focus:border-[#2E8B83]"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-extrabold text-[#164E4A] block mb-1">Confirm Password *</label>
                      <input
                        type="password"
                        value={suConfirmPassword}
                        onChange={(e) => setSuConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        minLength={6}
                        className="w-full px-3 py-2 bg-[#F8FAF7] border border-[#BFDCD2] rounded-xl text-xs font-bold text-[#26302E] focus:outline-none focus:border-[#2E8B83]"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#2E8B83] hover:bg-[#164E4A] text-white font-extrabold text-xs rounded-xl shadow-md transition-all"
                  >
                    Verify Mobile & Complete Registration →
                  </button>
                </form>
              ) : (
                <div className="bg-[#F8FAF7] p-5 rounded-2xl border border-[#BFDCD2] text-center space-y-3 animate-in fade-in">
                  <h4 className="text-sm font-extrabold text-[#164E4A]">📲 Mobile / Email Verification</h4>
                  <p className="text-xs text-[#26302E]">
                    Enter the 6-digit OTP code sent to <strong>{suContact}</strong>:
                  </p>
                  <input
                    type="text"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value)}
                    maxLength={6}
                    className="w-40 mx-auto px-3 py-2 text-center text-lg font-black tracking-widest bg-white border border-[#2E8B83] rounded-xl"
                  />
                  <div className="flex justify-center gap-2 pt-2">
                    <button
                      onClick={handleVerifyAndCreateAccount}
                      disabled={loading}
                      className="px-5 py-2.5 bg-[#2E8B83] hover:bg-[#164E4A] text-white text-xs font-extrabold rounded-xl shadow-xs"
                    >
                      {loading ? 'Creating ABHA Profile...' : '✓ Verify & Enter Dashboard'}
                    </button>
                    <button
                      onClick={() => setOtpStep(false)}
                      className="px-4 py-2.5 bg-white border border-[#BFDCD2] text-[#164E4A] text-xs font-extrabold rounded-xl"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-[#BFDCD2] text-center text-xs text-[#26302E]">
                Already registered?{' '}
                <button
                  onClick={() => setActiveTab('login')}
                  className="font-extrabold text-[#2E8B83] hover:underline"
                >
                  Sign In here
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-[#164E4A]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full p-6 rounded-3xl border-2 border-[#BFDCD2] shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#BFDCD2] pb-3">
              <h3 className="font-extrabold text-sm text-[#164E4A]">Reset Password</h3>
              <button
                onClick={() => setShowForgotModal(false)}
                className="w-7 h-7 rounded-full bg-[#F8FAF7] text-[#164E4A] font-black text-xs"
              >
                ✕
              </button>
            </div>

            {forgotStep === 1 ? (
              <div className="space-y-3">
                <p className="text-xs text-[#26302E]">
                  Enter your registered mobile number or email address:
                </p>
                <input
                  type="text"
                  value={forgotContact}
                  onChange={(e) => setForgotContact(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAF7] border border-[#BFDCD2] rounded-xl text-xs font-bold"
                />
                <button
                  onClick={handleSendResetOtp}
                  className="w-full py-2.5 bg-[#2E8B83] text-white text-xs font-extrabold rounded-xl"
                >
                  Send OTP Code →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-[#26302E]">Enter the 6-digit OTP and your new password:</p>
                <input
                  type="text"
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value)}
                  placeholder="OTP"
                  maxLength={6}
                  className="w-full px-3 py-2 bg-[#F8FAF7] border border-[#BFDCD2] rounded-xl text-xs font-bold"
                />
                <input
                  type="password"
                  value={forgotNewPwd}
                  onChange={(e) => setForgotNewPwd(e.target.value)}
                  placeholder="New Password"
                  className="w-full px-3 py-2 bg-[#F8FAF7] border border-[#BFDCD2] rounded-xl text-xs font-bold"
                />
                <button
                  onClick={handleResetPassword}
                  className="w-full py-2.5 bg-[#2E8B83] text-white text-xs font-extrabold rounded-xl"
                >
                  Update Password & Login →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Login;
