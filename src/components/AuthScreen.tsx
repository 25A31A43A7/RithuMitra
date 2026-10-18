import React, { useState } from 'react';
import { Language, UserAccount, UserRole, VehicleType } from '../types';
import { DEMO_USERS, authenticateUser, registerUser } from '../utils/storage';
import { TRANSLATIONS } from '../utils/translations';
import {
  Sprout,
  User,
  Warehouse,
  ShieldCheck,
  Zap,
  Lock,
  Phone,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  AlertCircle,
  Globe,
} from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (user: UserAccount) => void;
  lang: Language;
  onChangeLang: (l: Language) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
  lang,
  onChangeLang,
}) => {
  const t = TRANSLATIONS[lang];

  // Auth Tab: 'login' | 'signup'
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  // Sign In Form States
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Sign Up Form States
  const [signupRole, setSignupRole] = useState<UserRole>('farmer');
  const [signupName, setSignupName] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Farmer specific signup fields
  const [signupPhone, setSignupPhone] = useState('');
  const [signupVillage, setSignupVillage] = useState('Kadiyam, Rajahmundry Rural');
  const [signupLandRecord, setSignupLandRecord] = useState('AP-EG-RYT-5510');
  const [signupVehicleType, setSignupVehicleType] = useState<VehicleType>('Tractor-Trolley');
  const [signupVehicleNumber, setSignupVehicleNumber] = useState('AP-05-TR-2026');

  // Depot Manager specific signup fields
  const [signupFacilityName, setSignupFacilityName] = useState('');
  const [signupOperatorName, setSignupOperatorName] = useState('');
  const [signupLicenseId, setSignupLicenseId] = useState('');

  // Govt Verifier specific signup fields
  const [signupOfficerName, setSignupOfficerName] = useState('');
  const [signupDepartment, setSignupDepartment] = useState('District Agriculture & Civil Supplies (East Godavari)');
  const [signupGovId, setSignupGovId] = useState('');

  const [signupError, setSignupError] = useState<string | null>(null);

  // Instant 1-Click Demo Login Handlers
  const handleInstantDemoLogin = (demoUser: UserAccount) => {
    const logged = authenticateUser(demoUser.loginId, demoUser.password);
    if (logged) {
      onLoginSuccess(logged);
    }
  };

  // Standard Login Submit
  const handleStandardLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginId.trim() || !password.trim()) {
      setLoginError('Please enter both your Phone / Login ID and password.');
      return;
    }

    const user = authenticateUser(loginId, password);
    if (user) {
      onLoginSuccess(user);
    } else {
      setLoginError('Invalid credentials. Check your Login ID/password or use the 1-Click Instant Demo Login above.');
    }
  };

  // Standard Registration Submit
  const handleStandardSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);

    if (signupRole === 'farmer') {
      if (!signupName.trim() || !signupPhone.trim() || !signupVillage.trim() || !signupLandRecord.trim() || !signupPassword.trim()) {
        setSignupError('Please fill out all farmer registration fields.');
        return;
      }
      if (signupPhone.replace(/\D/g, '').length < 10) {
        setSignupError('Please provide a valid 10-digit mobile number.');
        return;
      }

      const farmerId = `farmer-${Date.now()}`;
      const newFarmerUser: UserAccount = {
        id: `user-${farmerId}`,
        role: 'farmer',
        name: signupName.trim(),
        loginId: signupPhone.trim(),
        password: signupPassword,
        phone: signupPhone.trim(),
        badge: `Registered Farmer (${signupVillage.trim()})`,
        title: `Rythu Bharosa Holder · ${signupLandRecord.trim()}`,
        villageOrFacility: signupVillage.trim(),
        khasraOrLicense: signupLandRecord.trim(),
        farmerProfile: {
          id: farmerId,
          name: signupName.trim(),
          phone: signupPhone.trim(),
          village: signupVillage.trim(),
          mandal: 'Rajahmundry Rural',
          district: 'East Godavari',
          khasraNumber: signupLandRecord.trim(),
          vehicleType: signupVehicleType,
          vehicleNumber: signupVehicleNumber.trim() || 'AP-05-TR-2026',
          aadhaarLast4: String(Math.floor(1000 + Math.random() * 9000)),
          bankName: 'Andhra Pragathi Grameena Bank',
          bankAccLast4: String(Math.floor(1000 + Math.random() * 9000)),
          coords: [17.0005, 81.8040],
        },
        createdAt: new Date().toISOString(),
      };

      const registered = registerUser(newFarmerUser);
      onLoginSuccess(registered);
    } else if (signupRole === 'operator') {
      if (!signupFacilityName.trim() || !signupOperatorName.trim() || !signupLicenseId.trim() || !signupPassword.trim()) {
        setSignupError('Please fill out all depot manager fields.');
        return;
      }

      const newOperatorUser: UserAccount = {
        id: `user-operator-${Date.now()}`,
        role: 'operator',
        name: signupOperatorName.trim(),
        loginId: signupLicenseId.trim().toLowerCase(),
        password: signupPassword,
        badge: `Depot Operator (${signupFacilityName.trim()})`,
        title: `Licensed APMC Operator · ${signupLicenseId.trim()}`,
        villageOrFacility: signupFacilityName.trim(),
        khasraOrLicense: signupLicenseId.trim(),
        createdAt: new Date().toISOString(),
      };

      const registered = registerUser(newOperatorUser);
      onLoginSuccess(registered);
    } else {
      // verifier
      if (!signupOfficerName.trim() || !signupDepartment.trim() || !signupGovId.trim() || !signupPassword.trim()) {
        setSignupError('Please fill out all verifier officer credentials.');
        return;
      }

      const newVerifierUser: UserAccount = {
        id: `user-verifier-${Date.now()}`,
        role: 'admin',
        name: signupOfficerName.trim(),
        loginId: signupGovId.trim().toLowerCase(),
        password: signupPassword,
        badge: `Govt Verifier (${signupDepartment.trim()})`,
        title: `Authorized District Inspector · ${signupGovId.trim()}`,
        department: signupDepartment.trim(),
        govId: signupGovId.trim(),
        createdAt: new Date().toISOString(),
      };

      const registered = registerUser(newVerifierUser);
      onLoginSuccess(registered);
    }
  };

  const farmerDemo = DEMO_USERS[0];
  const operatorDemo = DEMO_USERS[1];
  const adminDemo = DEMO_USERS[2];

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-between">
      {/* Top Brand Bar */}
      <header className="bg-white border-b border-stone-200 py-3.5 px-4 sm:px-8 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-stone-900 font-sans">
                  {t.appTitle}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  East Godavari · Rajahmundry
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block">
                {t.tagline}
              </p>
            </div>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center bg-stone-100 rounded-lg p-0.5 border border-stone-200">
            <div className="px-2 text-stone-500">
              <Globe className="w-3.5 h-3.5" />
            </div>
            <button
              type="button"
              onClick={() => onChangeLang('te')}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                lang === 'te'
                  ? 'bg-white text-emerald-900 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              తెలుగు
            </button>
            <button
              type="button"
              onClick={() => onChangeLang('en')}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                lang === 'en'
                  ? 'bg-white text-emerald-900 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => onChangeLang('hi')}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                lang === 'hi'
                  ? 'bg-white text-emerald-900 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              हिंदी
            </button>
          </div>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full space-y-8">
        
        {/* SECTION A: ONE-CLICK DEMO ACCESS (FOR HACKATHON JUDGES & EVALUATORS) */}
        <section aria-labelledby="evaluator-access-heading" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/80 pb-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>FOR EVALUATORS & JUDGES</span>
              </div>
              <h2 id="evaluator-access-heading" className="text-xl sm:text-2xl font-bold text-stone-900 mt-1">
                One-Click Instant Role Demo Access
              </h2>
            </div>
            <p className="text-xs text-stone-500 max-w-md sm:text-right">
              Select any role below to bypass manual entry and test live gate bookings, weighbridge intake, or district regulatory auditing in East Godavari.
            </p>
          </div>

          {/* 3 Prominent Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Farmer Card */}
            <div className="bg-white rounded-3xl p-5 border-2 border-emerald-600 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-0 pointer-events-none group-hover:scale-110 transition-transform" />
              
              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xl shadow-xs">
                    🌾
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Role: Farmer
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    🌾 Farmer (Ravi Kumar - Rajahmundry)
                  </h3>
                  <p className="text-xs text-emerald-800 font-semibold mt-0.5">
                    {farmerDemo.badge}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Village: Katheru · Tractor AP-05-TR-4912 · Rythu Bharosa: AP-EG-RYT-9941
                  </p>
                </div>

                {/* Demo Credentials Pill */}
                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono text-stone-700 space-y-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-stone-400 font-sans">Phone:</span>
                    <strong className="text-stone-900">{farmerDemo.loginId}</strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-stone-400 font-sans">Password:</span>
                    <strong className="text-stone-900">{farmerDemo.password}</strong>
                  </div>
                </div>
              </div>

              <div className="relative z-10 pt-2">
                <button
                  type="button"
                  onClick={() => handleInstantDemoLogin(farmerDemo)}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Zap className="w-4 h-4 text-emerald-300" />
                  <span>⚡ Instant Demo Login as Farmer</span>
                </button>
              </div>
            </div>

            {/* 2. Depot Manager Card */}
            <div className="bg-white rounded-3xl p-5 border-2 border-amber-600 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -z-0 pointer-events-none group-hover:scale-110 transition-transform" />

              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xl shadow-xs">
                    🏢
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    Role: Depot Manager
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    🏢 Depot Manager (APMC Rajahmundry)
                  </h3>
                  <p className="text-xs text-amber-800 font-semibold mt-0.5">
                    {operatorDemo.badge}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Facility: Rajamahendravaram APMC Central Market Yard · 6 Weighbridges · Live Manifest
                  </p>
                </div>

                {/* Demo Credentials Pill */}
                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono text-stone-700 space-y-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-stone-400 font-sans">ID:</span>
                    <strong className="text-stone-900">{operatorDemo.loginId}</strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-stone-400 font-sans">Password:</span>
                    <strong className="text-stone-900">{operatorDemo.password}</strong>
                  </div>
                </div>
              </div>

              <div className="relative z-10 pt-2">
                <button
                  type="button"
                  onClick={() => handleInstantDemoLogin(operatorDemo)}
                  className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Zap className="w-4 h-4 text-amber-200" />
                  <span>⚡ Instant Demo Login as Operator</span>
                </button>
              </div>
            </div>

            {/* 3. Govt Verifier Card */}
            <div className="bg-white rounded-3xl p-5 border-2 border-blue-600 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-0 pointer-events-none group-hover:scale-110 transition-transform" />

              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xl shadow-xs">
                    🛡️
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                    Role: Govt Verifier
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    🛡️ Govt Verifier (Joint Director of Agriculture, E.G. Dist)
                  </h3>
                  <p className="text-xs text-blue-800 font-semibold mt-0.5">
                    {adminDemo.badge}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Dept: Agriculture & Civil Supplies, East Godavari · Regulatory Auditing & Badging
                  </p>
                </div>

                {/* Demo Credentials Pill */}
                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono text-stone-700 space-y-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-stone-400 font-sans">ID:</span>
                    <strong className="text-stone-900">{adminDemo.loginId}</strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-stone-400 font-sans">Password:</span>
                    <strong className="text-stone-900">{adminDemo.password}</strong>
                  </div>
                </div>
              </div>

              <div className="relative z-10 pt-2">
                <button
                  type="button"
                  onClick={() => handleInstantDemoLogin(adminDemo)}
                  className="w-full py-3 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Zap className="w-4 h-4 text-blue-300" />
                  <span>⚡ Instant Demo Login as Govt Verifier</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION B: STANDARD LOGIN & REAL REGISTRATION (SIGN UP) */}
        <section aria-labelledby="custom-auth-heading" className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
            <div>
              <h2 id="custom-auth-heading" className="text-lg font-bold text-stone-900">
                Custom Authentication & Registration
              </h2>
              <p className="text-xs text-stone-500">
                Sign in with existing credentials or register a new custom profile saved to LocalStorage.
              </p>
            </div>

            {/* Tabs Segmented Control */}
            <div className="flex items-center bg-stone-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setLoginError(null);
                  setSignupError(null);
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
                  activeTab === 'login'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Existing Account Login</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('signup');
                  setLoginError(null);
                  setSignupError(null);
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
                  activeTab === 'signup'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create New Account (Sign Up)</span>
              </button>
            </div>
          </div>

          {/* TAB 1: EXISTING ACCOUNT LOGIN */}
          {activeTab === 'login' && (
            <form onSubmit={handleStandardLogin} className="max-w-md mx-auto space-y-4 pt-2">
              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Mobile Number / Login ID / Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="e.g. 9876543210 or depot_rajahmundry"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs font-mono font-medium focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter account password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs focus:outline-none focus:border-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to Dashboard</span>
              </button>

              <div className="text-center text-[11px] text-stone-500 pt-2">
                Tip: You can use demo credentials (e.g. <code className="bg-stone-100 px-1 py-0.5 rounded font-mono">9876543210 / farmer@123</code>) or any custom account you registered.
              </div>
            </form>
          )}

          {/* TAB 2: CREATE NEW ACCOUNT (REAL REGISTRATION) */}
          {activeTab === 'signup' && (
            <form onSubmit={handleStandardSignUp} className="space-y-5 pt-2 max-w-2xl mx-auto">
              {signupError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <span>{signupError}</span>
                </div>
              )}

              {/* Role Selector Segment */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-2">
                  Select User Role for Registration
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setSignupRole('farmer')}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      signupRole === 'farmer'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-xs'
                        : 'border-stone-200 bg-stone-50 text-stone-700'
                    }`}
                  >
                    <span className="text-lg block mb-0.5">🌾</span>
                    <span className="text-xs block">Farmer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSignupRole('operator')}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      signupRole === 'operator'
                        ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold shadow-xs'
                        : 'border-stone-200 bg-stone-50 text-stone-700'
                    }`}
                  >
                    <span className="text-lg block mb-0.5">🏢</span>
                    <span className="text-xs block">Depot Manager</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSignupRole('admin')}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      signupRole === 'admin'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-xs'
                        : 'border-stone-200 bg-stone-50 text-stone-700'
                    }`}
                  >
                    <span className="text-lg block mb-0.5">🛡️</span>
                    <span className="text-xs block">Govt Verifier</span>
                  </button>
                </div>
              </div>

              {/* Form fields based on Role */}
              {signupRole === 'farmer' && (
                <div className="space-y-4 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide block">
                    Farmer Identity & Rythu Bharosa Details (East Godavari)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Full Name (as per Aadhaar / Rythu Bharosa)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Venkata Rao"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        10-Digit Mobile Number (Login ID)
                      </label>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="e.g. 9849012345"
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Village / Mandal (Rajahmundry Area)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Kadiyam, Rajahmundry Rural"
                        value={signupVillage}
                        onChange={(e) => setSignupVillage(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Rythu Bharosa / Pattadar Passbook ID
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. AP-EG-RYT-5510"
                        value={signupLandRecord}
                        onChange={(e) => setSignupLandRecord(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-mono uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Transport Vehicle Type
                      </label>
                      <select
                        value={signupVehicleType}
                        onChange={(e) => setSignupVehicleType(e.target.value as VehicleType)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-medium"
                      >
                        <option value="Tractor-Trolley">Tractor-Trolley</option>
                        <option value="Mini-Truck">Mini-Truck</option>
                        <option value="Pickup Van">Pickup Van</option>
                        <option value="Auto-Trolley">Auto-Trolley</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Vehicle Reg. Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. AP-05-TR-2026"
                        value={signupVehicleNumber}
                        onChange={(e) => setSignupVehicleNumber(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>
              )}

              {signupRole === 'operator' && (
                <div className="space-y-4 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wide block">
                    Procurement Depot & Weighbridge Operator Details
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Facility / Mandi Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Rajamahendravaram APMC Yard"
                        value={signupFacilityName}
                        onChange={(e) => setSignupFacilityName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Operator Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. K. Narayana"
                        value={signupOperatorName}
                        onChange={(e) => setSignupOperatorName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        APMC Weighbridge License ID (Login ID)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. APMC-LIC-RJY-01"
                        value={signupLicenseId}
                        onChange={(e) => setSignupLicenseId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>
              )}

              {signupRole === 'admin' && (
                <div className="space-y-4 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                  <span className="text-xs font-bold text-blue-800 uppercase tracking-wide block">
                    Govt Regulatory Verifier Credentials
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Officer Full Name & Designation
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. P. Ramana, Joint Director"
                        value={signupOfficerName}
                        onChange={(e) => setSignupOfficerName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. District Agriculture Authority, East Godavari"
                        value={signupDepartment}
                        onChange={(e) => setSignupDepartment(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Official Government ID (Login ID)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. GOV-AP-EG-010"
                        value={signupGovId}
                        onChange={(e) => setSignupGovId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Password for Signup */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Create Account Password
                </label>
                <div className="relative">
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    placeholder="Set a secure password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 bg-white text-xs pr-10 focus:outline-none focus:border-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-3 top-3 text-stone-400 hover:text-stone-600"
                  >
                    {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Register & Enter Dashboard</span>
              </button>
            </form>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-4 text-center text-xs text-stone-500">
        FarmGain Agricultural Procurement & Slot Management Platform · Andhra Pradesh State Edition
      </footer>
    </div>
  );
};
