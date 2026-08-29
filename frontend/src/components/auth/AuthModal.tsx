import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle, Lock, Phone, Mail, User as UserIcon, MapPin, KeyRound, Smartphone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    pendingSignupData,
    resetContact,
    setResetContact,
    login,
    initiateSignup,
    verifySignup,
    forgotPassword,
    resetPassword,
  } = useAuth();

  const { t, isHindi } = useLanguage();

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotContact, setForgotContact] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const resetForm = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setPhoneOtp('');
    setEmailOtp('');
    setResetOtp('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      await login({
        identifier: identifier.trim(),
        password,
        role: 'PATIENT',
      });
      setSuccessMsg(t('loginSuccessMsg'));
      setTimeout(() => {
        setIsAuthModalOpen(false);
        resetForm();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || t('invalidUserError'));
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const hasPhone = !!phone.trim();
    const hasEmail = !!email.trim();

    // Validation: At least one of email and phone must be filled
    if (!hasPhone && !hasEmail) {
      setErrorMsg(t('enterPhoneOrEmailError'));
      return;
    }

    setLoading(true);

    try {
      const res = await initiateSignup({
        name: name.trim(),
        contact: hasPhone ? phone.trim() : '',
        email: hasEmail ? email.trim() : null,
        password,
        address: address.trim() || undefined,
        pincode: pincode.trim() || undefined,
        role: 'PATIENT',
      });
      setSuccessMsg(res.message || t('otpSentMsg'));
      setAuthModalMode('OTP');
    } catch (err: any) {
      setErrorMsg(err.message || t('userExistsError'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const targetPhone = pendingSignupData?.phone || phone.trim();
    const targetEmail = pendingSignupData?.email || email.trim();

    // Validate phone OTP if phone was registered
    if (targetPhone && (!phoneOtp.trim() || phoneOtp.trim().length !== 6)) {
      setErrorMsg(isHindi ? 'कृपया 6-अंकीय मोबाइल SMS OTP दर्ज करें।' : 'Please enter the 6-digit phone SMS OTP code.');
      return;
    }

    // Validate email OTP if email was registered
    if (targetEmail && (!emailOtp.trim() || emailOtp.trim().length !== 6)) {
      setErrorMsg(isHindi ? 'कृपया 6-अंकीय ईमेल सत्यापन OTP दर्ज करें।' : 'Please enter the 6-digit email verification OTP code.');
      return;
    }

    setLoading(true);

    try {
      const res = await verifySignup({
        phone: targetPhone || undefined,
        phone_otp: targetPhone ? phoneOtp.trim() : undefined,
        email: targetEmail || undefined,
        email_otp: targetEmail ? emailOtp.trim() : undefined,
      });

      setSuccessMsg(res.message || t('signupSuccessMsg'));
      setTimeout(() => {
        setIsAuthModalOpen(false);
        resetForm();
      }, 800);
    } catch (err: any) {
      setErrorMsg(err.message || t('invalidOtpError'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await forgotPassword({
        contact: forgotContact.trim(),
      });
      setSuccessMsg(res.message || t('otpSentMsg'));
      setAuthModalMode('RESET');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const target = resetContact || forgotContact.trim();
      const res = await resetPassword({
        contact: target,
        otp: resetOtp.trim(),
        new_password: newPassword,
      });
      setSuccessMsg(res.message || t('resetSuccessMsg'));
      setTimeout(() => {
        setAuthModalMode('LOGIN');
        setErrorMsg(null);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || t('invalidOtpError'));
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = () => {
    setIsAuthModalOpen(false);
    resetForm();
  };

  // Determine which OTP fields to show
  const requiresPhoneOtp = !!(pendingSignupData?.phone || phone.trim());
  const requiresEmailOtp = !!(pendingSignupData?.email || email.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase tracking-wide border border-emerald-200">
              {isHindi ? 'मरीज पोर्टल' : 'Patient Portal'}
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
              {authModalMode === 'LOGIN' && t('loginTitle')}
              {authModalMode === 'SIGNUP' && t('signupTitle')}
              {authModalMode === 'OTP' && t('otpTitle')}
              {authModalMode === 'FORGOT' && t('forgotTitle')}
              {authModalMode === 'RESET' && t('resetTitle')}
            </h3>
          </div>
          <button
            onClick={() => {
              setIsAuthModalOpen(false);
              resetForm();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert Banner */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-50 border-2 border-red-300 text-red-700 text-xs font-bold flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <span className="block font-black uppercase text-[10px] text-red-800">
                {isHindi ? 'त्रुटि / Error' : 'Error'}
              </span>
              {errorMsg}
            </div>
          </div>
        )}

        {/* Success Alert Banner */}
        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-800 text-xs font-bold flex items-start gap-2.5 animate-fadeIn">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{successMsg}</div>
          </div>
        )}

        {/* 1. LOGIN FORM */}
        {authModalMode === 'LOGIN' && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {t('identifierLabel')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={identifier}
                  onChange={(e) => {
                    setErrorMsg(null);
                    setIdentifier(e.target.value);
                  }}
                  placeholder={t('identifierPlaceholder')}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white bg-slate-50 transition-all"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700">
                  {t('passwordLabel')}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setAuthModalMode('FORGOT');
                  }}
                  className="text-[11px] font-bold text-emerald-700 hover:underline"
                >
                  {t('toForgot')}
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => {
                    setErrorMsg(null);
                    setPassword(e.target.value);
                  }}
                  placeholder={t('passwordPlaceholder')}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white bg-slate-50 transition-all"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>{isHindi ? 'सत्यापित किया जा रहा है...' : 'Signing in...'}</span>
                </>
              ) : (
                <span>{t('loginButton')}</span>
              )}
            </button>

            <div className="pt-2 flex justify-between items-center text-xs">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setAuthModalMode('SIGNUP');
                }}
                className="text-emerald-700 font-bold hover:underline"
              >
                {t('toSignup')}
              </button>
            </div>
          </form>
        )}

        {/* 2. SIGNUP FORM (Register via Phone, Email, or Both) */}
        {authModalMode === 'SIGNUP' && (
          <form onSubmit={handleInitiateSignup} className="space-y-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                {t('nameLabel')} *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={name}
                  onChange={(e) => {
                    setErrorMsg(null);
                    setName(e.target.value);
                  }}
                  placeholder={t('namePlaceholder')}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                />
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Explanatory Help Text for Phone / Email */}
            <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-200 text-[10px] text-emerald-800 font-semibold leading-tight">
              ℹ️ {t('phoneOrEmailHelp')}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  {t('phoneLabel')}
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    disabled={loading}
                    value={phone}
                    onChange={(e) => {
                      setErrorMsg(null);
                      setPhone(e.target.value);
                    }}
                    placeholder={t('phonePlaceholder')}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  {t('emailLabel')}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    disabled={loading}
                    value={email}
                    onChange={(e) => {
                      setErrorMsg(null);
                      setEmail(e.target.value);
                    }}
                    placeholder={t('emailPlaceholder')}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  {t('addressLabel')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled={loading}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={t('addressPlaceholder')}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  {t('pincodeLabel')}
                </label>
                <input
                  type="text"
                  disabled={loading}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder={t('pincodePlaceholder')}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                {t('passwordLabel')} *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => {
                    setErrorMsg(null);
                    setPassword(e.target.value);
                  }}
                  placeholder={t('passwordPlaceholder')}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md mt-1 flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>{isHindi ? 'OTP भेजा जा रहा है...' : 'Sending OTP...'}</span>
                </>
              ) : (
                <span>{t('signupButton')}</span>
              )}
            </button>

            <div className="text-center text-xs pt-1">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setAuthModalMode('LOGIN');
                }}
                className="text-emerald-700 font-bold hover:underline"
              >
                {t('toLogin')}
              </button>
            </div>
          </form>
        )}

        {/* 3. OTP VERIFICATION FORM (Accepts Phone OTP, Email OTP, or Both) */}
        {authModalMode === 'OTP' && (
          <form onSubmit={handleVerifySignup} className="space-y-3.5">
            <p className="text-xs text-slate-600 font-hindi leading-relaxed">
              {isHindi
                ? `सत्यापन कोड ${
                    requiresPhoneOtp && requiresEmailOtp
                      ? 'आपके मोबाइल नंबर और ईमेल पते'
                      : requiresPhoneOtp
                      ? 'आपके मोबाइल नंबर'
                      : 'आपके ईमेल पते'
                  } पर भेजा गया है।`
                : `Enter the 6-digit OTP verification code sent to your ${
                    requiresPhoneOtp && requiresEmailOtp
                      ? 'mobile phone and email address'
                      : requiresPhoneOtp
                      ? 'mobile phone'
                      : 'email address'
                  }.`}
            </p>

            {/* Phone SMS OTP Field */}
            {requiresPhoneOtp && (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t('phoneOtpLabel')}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    ({pendingSignupData?.phone || phone})
                  </span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  autoFocus={!requiresEmailOtp}
                  disabled={loading}
                  value={phoneOtp}
                  onChange={(e) => {
                    setErrorMsg(null);
                    setPhoneOtp(e.target.value.replace(/\D/g, ''));
                  }}
                  placeholder={t('phoneOtpPlaceholder')}
                  className="w-full text-center text-xl tracking-[0.25em] font-mono px-3.5 py-2.5 rounded-xl border-2 border-emerald-500 text-slate-900 font-bold focus:ring-2 focus:ring-emerald-600 bg-slate-50"
                />
              </div>
            )}

            {/* Email Verification OTP Field */}
            {requiresEmailOtp && (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-teal-600" />
                  <span>{t('emailOtpLabel')}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    ({pendingSignupData?.email || email})
                  </span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  autoFocus={!requiresPhoneOtp}
                  disabled={loading}
                  value={emailOtp}
                  onChange={(e) => {
                    setErrorMsg(null);
                    setEmailOtp(e.target.value.replace(/\D/g, ''));
                  }}
                  placeholder={t('emailOtpPlaceholder')}
                  className="w-full text-center text-xl tracking-[0.25em] font-mono px-3.5 py-2.5 rounded-xl border-2 border-teal-500 text-slate-900 font-bold focus:ring-2 focus:ring-teal-600 bg-slate-50"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={
                loading ||
                (requiresPhoneOtp && phoneOtp.length < 6) ||
                (requiresEmailOtp && emailOtp.length < 6)
              }
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-black shadow-md flex items-center justify-center gap-2 transition-all mt-2"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>{isHindi ? 'सत्यापित हो रहा है...' : 'Verifying codes...'}</span>
                </>
              ) : (
                <span>{t('verifyButton')}</span>
              )}
            </button>

            <div className="text-center text-xs pt-1">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setAuthModalMode('SIGNUP');
                }}
                className="text-slate-500 font-bold hover:underline"
              >
                ← {isHindi ? 'वापस जाएं (विवरण बदलें)' : 'Back (Edit Details)'}
              </button>
            </div>
          </form>
        )}

        {/* 4. FORGOT PASSWORD FORM */}
        {authModalMode === 'FORGOT' && (
          <form onSubmit={handleForgotPassword} className="space-y-3.5">
            <p className="text-xs text-slate-600 font-hindi">
              {isHindi
                ? 'अपना पंजीकृत मोबाइल नंबर या ईमेल पता दर्ज करें। हम आपको 6-अंकीय पासवर्ड रीसेट OTP भेजेंगे।'
                : 'Enter your registered phone number or email to receive a 6-digit password reset OTP.'}
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {t('contactLabel')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={forgotContact}
                  onChange={(e) => {
                    setErrorMsg(null);
                    setForgotContact(e.target.value);
                  }}
                  placeholder={t('contactPlaceholder')}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !forgotContact.trim()}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>{isHindi ? 'OTP भेजा जा रहा है...' : 'Sending OTP...'}</span>
                </>
              ) : (
                <span>{t('forgotButton')}</span>
              )}
            </button>

            <div className="text-center text-xs pt-1">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setAuthModalMode('LOGIN');
                }}
                className="text-emerald-700 font-bold hover:underline"
              >
                {t('toLogin')}
              </button>
            </div>
          </form>
        )}

        {/* 5. RESET PASSWORD FORM */}
        {authModalMode === 'RESET' && (
          <form onSubmit={handleResetPassword} className="space-y-3">
            <p className="text-xs text-slate-600 font-hindi">
              {isHindi
                ? 'प्राप्त OTP कोड और नया पासवर्ड दर्ज करें।'
                : 'Enter the OTP code received and set your new password.'}
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {t('otpLabel')}
              </label>
              <input
                type="text"
                required
                maxLength={6}
                disabled={loading}
                value={resetOtp}
                onChange={(e) => {
                  setErrorMsg(null);
                  setResetOtp(e.target.value.replace(/\D/g, ''));
                }}
                placeholder={t('otpPlaceholder')}
                className="w-full text-center text-xl tracking-widest font-mono px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {t('newPasswordLabel')}
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  disabled={loading}
                  value={newPassword}
                  onChange={(e) => {
                    setErrorMsg(null);
                    setNewPassword(e.target.value);
                  }}
                  placeholder={t('newPasswordPlaceholder')}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || resetOtp.length < 6 || !newPassword}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>{isHindi ? 'पासवर्ड बदला जा रहा है...' : 'Resetting password...'}</span>
                </>
              ) : (
                <span>{t('resetButton')}</span>
              )}
            </button>

            <div className="text-center text-xs pt-1">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setAuthModalMode('LOGIN');
                }}
                className="text-emerald-700 font-bold hover:underline"
              >
                {t('toLogin')}
              </button>
            </div>
          </form>
        )}

        {/* Guest Mode Instant Continuation */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleGuestMode}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
          >
            {t('guestAccess')}
          </button>
        </div>
      </div>
    </div>
  );
};
