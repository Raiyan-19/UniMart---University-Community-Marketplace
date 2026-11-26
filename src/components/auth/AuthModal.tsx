import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  ShoppingBag,
  Users,
  Briefcase,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  Mail,
  Lock,
  ArrowRight,
  User as UserIcon,
  Phone,
  Building,
  BookOpen,
  X,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUniversity } from '../../context/UniversityContext';
import { useToast } from '../../context/ToastContext';
import { validateRegistration } from '../../utils/validation';

export type AuthMode = 'login' | 'register' | 'verify' | 'verified_success' | 'forgot_password';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const { login, register, verifyEmail, resendVerificationCode, requiresEmailVerification, unverifiedUser, user } = useAuth();
  const { universities, departments, getDepartmentsForUniversity } = useUniversity();
  const { success, error, info } = useToast();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [name, setName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [selectedUnivId, setSelectedUnivId] = useState('univ-baust');
  const [selectedDeptId, setSelectedDeptId] = useState('dept-baust-cse');
  const [studentId, setStudentId] = useState('');
  const [designation, setDesignation] = useState('Lecturer');
  const [phone, setPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);

  // OTP Verification state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpHint, setOtpHint] = useState<string | null>(null);
  const [emailNotice, setEmailNotice] = useState<{ sent: boolean; error?: string } | null>(null);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');

  useEffect(() => {
    if (isOpen && !requiresEmailVerification && initialMode) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode, requiresEmailVerification]);

  useEffect(() => {
    if (requiresEmailVerification) {
      setMode('verify');
    }
  }, [requiresEmailVerification]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Countdown timer for OTP
  useEffect(() => {
    let interval: any;
    if (mode === 'verify' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode, resendTimer]);

  // Ensure selected university and department remain valid as data loads
  useEffect(() => {
    if (universities.length > 0 && !universities.some((u) => u.id === selectedUnivId)) {
      setSelectedUnivId(universities[0].id);
    }
  }, [universities, selectedUnivId]);

  useEffect(() => {
    const availableDepts = getDepartmentsForUniversity(selectedUnivId);
    if (availableDepts.length > 0 && !availableDepts.some((d) => d.id === selectedDeptId)) {
      setSelectedDeptId(availableDepts[0].id);
    }
  }, [selectedUnivId, departments, selectedDeptId, getDepartmentsForUniversity]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      error('Missing credentials', 'Please enter both university email and password.');
      return;
    }

    setIsSubmitting(true);
    const res = await login({
      email: loginEmail,
      password: loginPassword,
      rememberMe,
    });
    setIsSubmitting(false);

    if (res.success) {
      if (!res.requiresEmailVerification) {
        onClose();
      } else {
        setEmailNotice(null);
        setOtpHint(null);
        setOtp(['', '', '', '', '', '']);
        setResendTimer(0);
        setMode('verify');
      }
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedTerms) {
      error('Terms Agreement Required', 'Please agree to the Terms & Conditions and Privacy Policy.');
      return;
    }
    if (regPassword !== confirmPassword) {
      error('Password Mismatch', 'The passwords you entered do not match.');
      return;
    }

    const payload = {
      name: name.trim(),
      email: regEmail.trim(),
      password: regPassword,
      role,
      universityId: selectedUnivId,
      departmentId: selectedDeptId,
      phone: phone.trim(),
      studentId: role === 'student' ? studentId.trim() : undefined,
      designation: role === 'teacher' ? designation.trim() : undefined,
    };

    const validation = validateRegistration(payload);
    if (!validation.isValid) {
      const firstMsg = Object.values(validation.errors)[0] || 'Please check your registration details.';
      error('Invalid Registration Details', firstMsg);
      return;
    }

    setIsSubmitting(true);
    const res = await register(payload);
    setIsSubmitting(false);

    if (res.success) {
      if (res.otpPreview) {
        setOtpHint(res.otpPreview);
      } else {
        setOtpHint(null);
      }
      if (res.emailSent !== undefined) {
        setEmailNotice({ sent: res.emailSent, error: res.emailDeliveryError });
      }
      setOtp(['', '', '', '', '', '']);
      setResendTimer(60);
      setMode('verify');
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const cleaned = val.replace(/\D/g, '');
    if (!cleaned && val !== '') return;

    const newOtp = [...otp];
    newOtp[index] = cleaned.slice(-1);
    setOtp(newOtp);

    // Auto-focus next field
    if (cleaned && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`) as HTMLInputElement;
      nextInput?.focus();
      nextInput?.select();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>, startIndex: number = 0) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    if (!pastedData) return;

    const digits = pastedData.slice(0, 6).split('');
    const newOtp = [...otp];

    const start = digits.length === 6 ? 0 : startIndex;
    digits.forEach((digit, i) => {
      if (start + i < 6) {
        newOtp[start + i] = digit;
      }
    });

    setOtp(newOtp);

    // Focus next empty or last input
    const nextEmpty = newOtp.findIndex((d) => !d);
    const targetIdx = nextEmpty !== -1 ? nextEmpty : 5;
    const targetInput = document.getElementById(`otp-input-${targetIdx}`) as HTMLInputElement;
    targetInput?.focus();
    targetInput?.select();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        e.preventDefault();
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        const prevInput = document.getElementById(`otp-input-${index - 1}`) as HTMLInputElement;
        prevInput?.focus();
        prevInput?.select();
      } else if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      const prevInput = document.getElementById(`otp-input-${index - 1}`) as HTMLInputElement;
      prevInput?.focus();
      prevInput?.select();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      const nextInput = document.getElementById(`otp-input-${index + 1}`) as HTMLInputElement;
      nextInput?.focus();
      nextInput?.select();
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = otp.join('');
    if (fullCode.length !== 6) {
      error('Incomplete Code', 'Please enter all 6 digits of your verification code.');
      return;
    }

    setIsSubmitting(true);
    const ok = await verifyEmail(fullCode, activeEmail);
    setIsSubmitting(false);

    if (ok) {
      onClose();
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const newOtp = await resendVerificationCode();
      if (newOtp) {
        setOtpHint(newOtp);
      }
      setEmailNotice({ sent: true });
      setOtp(['', '', '', '', '', '']);
      setResendTimer(60);
      const firstInput = document.getElementById('otp-input-0') as HTMLInputElement;
      firstInput?.focus();
    } catch (err: any) {
      setEmailNotice({ sent: false, error: err.message || 'Failed to dispatch email' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeEmail = unverifiedUser?.email || user?.email || regEmail || loginEmail || 'raiyan19@student.baust.edu.bd';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-md lg:max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-20 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-0 lg:min-h-[580px]">
          {/* Left Decorative & Brand Column (Visible on Desktop lg+) */}
          <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-b from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 sm:p-8 flex-col justify-between relative overflow-hidden">
            {/* Background architectural glow */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-600/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              {/* Logo */}
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                  <GraduationCap className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <span className="text-xl font-bold tracking-tight text-white">UniMart</span>
                  <p className="text-[10px] text-emerald-200 font-medium">University Community Marketplace</p>
                </div>
              </div>

              {/* Main Headline */}
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                  Same Campus.<br />
                  <span className="text-emerald-300">Bigger Opportunities.</span>
                </h2>
                <p className="text-xs text-emerald-100/90 leading-relaxed max-w-xs">
                  Buy, sell, and access services within your university community. A trusted marketplace for students and teachers.
                </p>
              </div>

              {/* Feature Matrix matching mockups */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
                  <ShoppingBag className="w-4 h-4 text-emerald-300 mb-1.5" />
                  <p className="text-xs font-bold text-white">Buy & Sell</p>
                  <p className="text-[10px] text-emerald-100/75">Find what you need</p>
                </div>

                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
                  <Users className="w-4 h-4 text-emerald-300 mb-1.5" />
                  <p className="text-xs font-bold text-white">Trusted Community</p>
                  <p className="text-[10px] text-emerald-100/75">Only university members</p>
                </div>

                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
                  <Briefcase className="w-4 h-4 text-emerald-300 mb-1.5" />
                  <p className="text-xs font-bold text-white">Access Services</p>
                  <p className="text-[10px] text-emerald-100/75">Get help & share skills</p>
                </div>

                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
                  <ShieldCheck className="w-4 h-4 text-emerald-300 mb-1.5" />
                  <p className="text-xs font-bold text-white">Safe & Verified</p>
                  <p className="text-[10px] text-emerald-100/75">Secure and reliable</p>
                </div>
              </div>
            </div>

            {/* Campus Photo Card & Quote matching mockup */}
            <div className="relative z-10 pt-6 mt-4 border-t border-white/15">
              <div className="rounded-xl overflow-hidden relative shadow-lg aspect-video mb-3">
                <img
                  src="/assets/aistudio/WhatsApp_Image_2026-11-02_at_9.18.14_PM_ef1b6a72.jpeg"
                  alt="University Campus Building"
                  className="w-full h-full object-cover object-left"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-3">
                  <p className="text-[11px] font-bold text-white tracking-wide uppercase">
                    Knowledge Connects People
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-emerald-200/90 italic">
                &ldquo;A Stronger University Community Together&rdquo;
              </p>
            </div>
          </div>

          {/* Right Interactive Form Column */}
          <div className="lg:col-span-7 p-4 sm:p-8 lg:p-10 flex flex-col bg-white overflow-y-auto max-h-[85vh]">
            <div className="my-auto w-full">
            {/* 1. LOGIN MODE */}
            {mode === 'login' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome to UniMart</h3>
                  <p className="text-xs text-slate-500 mt-1">Log in to your account</p>
                </div>

                {/* Role badge card */}
                <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-950">Student / Teacher</p>
                    <p className="text-[11px] text-emerald-700">Buy, sell and access campus services</p>
                  </div>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Enter your university email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="raiyan19@student.baust.edu.bd"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Enter your password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                      />
                      <span>Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot_password')}
                      className="text-emerald-700 font-semibold hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-900/10 hover:shadow-lg disabled:opacity-60 cursor-pointer"
                  >
                    <span>{isSubmitting ? 'Logging in...' : 'Log In'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* Quick login tester presets */}
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
                    Quick Demo Credentials
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginEmail('raiyan19@student.baust.edu.bd');
                        setLoginPassword('password123');
                      }}
                      className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-700 font-medium text-center"
                    >
                      Student Raiyan
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginEmail('aminul@baust.edu.bd');
                        setLoginPassword('password123');
                      }}
                      className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-700 font-medium text-center"
                    >
                      Teacher Dr. Amin
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginEmail('admin@unimart.edu.bd');
                        setLoginPassword('admin123');
                      }}
                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 text-emerald-800 font-bold text-center"
                    >
                      Admin Sara
                    </button>
                  </div>
                </div>

                <div className="text-center pt-2 text-xs text-slate-600">
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="text-emerald-700 font-bold hover:underline cursor-pointer"
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            )}

            {/* 2. REGISTER MODE (STUDENT & TEACHER TOGGLE) */}
            {mode === 'register' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Create Your UniMart Account</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Join your university community marketplace</p>
                </div>

                {/* Role Switcher Cards matching mockups */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                      role === 'student'
                        ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      role === 'student' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">Student</span>
                        {role === 'student' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                      </div>
                      <p className="text-[10px] text-slate-500">Buy, sell and access services</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('teacher')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                      role === 'teacher'
                        ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      role === 'teacher' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">Teacher</span>
                        {role === 'teacher' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                      </div>
                      <p className="text-[10px] text-slate-500">Teach, support and share</p>
                    </div>
                  </button>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Sultan Raiyan"
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">University Email *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="yourname@baust.edu.bd"
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">University *</label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                          value={selectedUnivId}
                          onChange={(e) => setSelectedUnivId(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                        >
                          {universities.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.shortName} - {u.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
                      <div className="relative">
                        <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                          value={selectedDeptId}
                          onChange={(e) => setSelectedDeptId(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                        >
                          {departments
                            .filter((d) => d.universityId === selectedUnivId)
                            .map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.code} - {d.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {role === 'student' ? (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Student ID *</label>
                        <input
                          type="text"
                          required
                          value={studentId}
                          onChange={(e) => setStudentId(e.target.value)}
                          placeholder="e.g. 20221015"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Designation *</label>
                        <input
                          type="text"
                          required
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          placeholder="e.g. Assistant Professor, Lecturer"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="01XXXXXXXXX"
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Create password"
                          className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm password"
                          className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                        >
                          {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-1">
                    <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-600">
                      <input
                        type="checkbox"
                        required
                        checked={agreedTerms}
                        onChange={(e) => setAgreedTerms(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 mt-0.5"
                      />
                      <span>
                        I agree to the{' '}
                        <a
                          href="#terms"
                          onClick={(e) => {
                            e.preventDefault();
                            info('Terms & Conditions', 'Trade honestly within your campus community and verify items in person before payment.');
                          }}
                          className="text-emerald-700 underline font-semibold"
                        >
                          Terms &amp; Conditions
                        </a>{' '}
                        and{' '}
                        <a
                          href="#privacy"
                          onClick={(e) => {
                            e.preventDefault();
                            info('Privacy Policy', 'Your email and campus profile are used only for UniMart verification and buyer-seller communication.');
                          }}
                          className="text-emerald-700 underline font-semibold"
                        >
                          Privacy Policy
                        </a>
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-900/10 cursor-pointer disabled:opacity-60"
                  >
                    <span>{isSubmitting ? 'Creating Account...' : 'Create Account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="text-center pt-2 text-xs text-slate-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-emerald-700 font-bold hover:underline cursor-pointer"
                  >
                    Log In
                  </button>
                </div>
              </div>
            )}

            {/* 3. VERIFY EMAIL (6-DIGIT OTP) MODE */}
            {mode === 'verify' && (
              <div className="space-y-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                  <Mail className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Verify Your Email</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    We&apos;ve sent a 6-digit verification code to
                  </p>
                  <p className="text-xs font-bold text-emerald-800 mt-0.5">{activeEmail}</p>
                </div>

                {otpHint && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold">
                    🔑 Verification Code Preview: <span className="font-mono text-sm tracking-widest">{otpHint}</span>
                  </div>
                )}

                {emailNotice?.sent === false && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 text-left">
                    <div className="font-bold flex items-center gap-1.5 mb-1">
                      <span>⚠️</span> Email Delivery Warning
                    </div>
                    <div className="text-[11px] leading-relaxed text-amber-800">
                      Could not reach your email inbox ({emailNotice.error}). Configure <strong>GMAIL_USER</strong> &amp; <strong>GMAIL_APP_PASSWORD</strong>, <strong>BREVO_API_KEY</strong>, or <strong>RESEND_API_KEY</strong> in your environment variables, then click <strong>Resend Code</strong> to retry.
                    </div>
                  </div>
                )}

                <form onSubmit={handleVerifySubmit} className="space-y-6">
                  {/* 6 input boxes with full paste, individual edit, and keyboard navigation */}
                  <div className="flex justify-center gap-2 sm:gap-3">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        id={`otp-input-${i}`}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern="\d*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        onPaste={(e) => handleOtpPaste(e, i)}
                        onFocus={(e) => e.target.select()}
                        className="w-11 h-14 sm:w-12 sm:h-16 text-center text-xl font-bold bg-white border-2 border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 rounded-xl focus:outline-none transition-all shadow-xs"
                      />
                    ))}
                  </div>

                  <p className="text-xs text-slate-500">
                    Enter the 6-digit code sent to your email.
                  </p>

                  <button
                    type="submit"
                    disabled={isSubmitting || otp.join('').length !== 6}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-900/10 disabled:opacity-60 cursor-pointer"
                  >
                    <span>{isSubmitting ? 'Verifying...' : 'Verify Email'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="space-y-2 text-xs">
                  <p className="text-slate-500">
                    {resendTimer > 0 ? (
                      <span>Resend code in 00:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={isSubmitting}
                        className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${isSubmitting ? 'animate-spin' : ''}`} /> Resend Code
                      </button>
                    )}
                  </p>
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register');
                        setOtp(['', '', '', '', '', '']);
                        setOtpHint(null);
                        setEmailNotice(null);
                      }}
                      className="text-slate-500 hover:text-slate-700 underline cursor-pointer"
                    >
                      Change Email
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl flex items-center gap-2 text-left">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <p className="text-[11px] text-emerald-900">
                    Your university email helps us keep UniMart safe and trusted for everyone.
                  </p>
                </div>
              </div>
            )}

            {/* 4. VERIFIED SUCCESS MODE */}
            {mode === 'verified_success' && (
              <div className="space-y-6 text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                  <CheckCircle2 className="w-12 h-12" />
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Email Verified Successfully!</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Your UniMart account has been created and your email has been verified.
                  </p>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-950">You&apos;re now one step closer to your campus community.</p>
                    <p className="text-[11px] text-emerald-700">Let&apos;s get you started!</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-900/10 cursor-pointer"
                >
                  <span>Continue to UniMart</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-center">
                  <div>
                    <Users className="w-5 h-5 text-emerald-700 mx-auto mb-1" />
                    <p className="text-xs font-bold text-slate-800">Connect</p>
                    <p className="text-[10px] text-slate-500">with campus peers</p>
                  </div>
                  <div>
                    <ShoppingBag className="w-5 h-5 text-emerald-700 mx-auto mb-1" />
                    <p className="text-xs font-bold text-slate-800">Buy & Sell</p>
                    <p className="text-[10px] text-slate-500">books & electronics</p>
                  </div>
                  <div>
                    <Briefcase className="w-5 h-5 text-emerald-700 mx-auto mb-1" />
                    <p className="text-xs font-bold text-slate-800">Services</p>
                    <p className="text-[10px] text-slate-500">share your skills</p>
                  </div>
                </div>
              </div>
            )}

            {/* 5. FORGOT PASSWORD MODE */}
            {mode === 'forgot_password' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Forgot Password</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter your university email to receive a password reset link.
                  </p>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setIsSubmitting(true);
                    try {
                      const res = await (await import('../../services/api')).authApi.forgotPassword(forgotEmail);
                      if (res.success) {
                        success('Reset Link Sent', 'Please check your university inbox.');
                        setMode('login');
                      }
                    } catch (err: any) {
                      error('Error', err.message);
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      University Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="yourname@baust.edu.bd"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-900/10 cursor-pointer"
                  >
                    <span>{isSubmitting ? 'Sending...' : 'Send Reset Link'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="text-center text-xs">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-emerald-700 font-bold hover:underline cursor-pointer"
                  >
                    ← Back to Login
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
