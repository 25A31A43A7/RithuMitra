import React, { useState } from 'react';
import { Language, Persona, UserAccount } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import {
  Sprout,
  User,
  Warehouse,
  Landmark,
  Globe,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface NavbarProps {
  currentUser: UserAccount;
  currentPersona: Persona;
  onChangePersona: (p: Persona) => void;
  onLogout: () => void;
  currentLang: Language;
  onChangeLang: (l: Language) => void;
  activePassesCount: number;
  onOpenMyPasses: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentPersona,
  onChangePersona,
  onLogout,
  currentLang,
  onChangeLang,
  activePassesCount,
  onOpenMyPasses,
}) => {
  const t = TRANSLATIONS[currentLang];
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  // Icon for active role
  const getRoleIcon = (role: Persona) => {
    switch (role) {
      case 'farmer':
        return '🌾';
      case 'operator':
        return '🏢';
      case 'admin':
        return '🛡️';
    }
  };

  const getRoleLabel = (role: Persona) => {
    switch (role) {
      case 'farmer':
        return t.farmerView;
      case 'operator':
        return t.operatorView;
      case 'admin':
        return t.adminView;
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-stone-900 font-sans">
                {t.appTitle}
              </span>
              <span className="hidden sm:inline-block text-[11px] font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                MSP 2026
              </span>
            </div>
            <p className="text-[11px] text-stone-500 hidden md:block">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Zone 2: Active User Banner + Switch Role Dropdown */}
        <div className="flex items-center gap-2">
          {/* Active User Pill with Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200/80 border border-stone-200 rounded-xl text-xs transition-colors"
            >
              <span className="text-base">{getRoleIcon(currentPersona)}</span>
              <div className="text-left hidden sm:block">
                <span className="font-bold text-stone-900 block leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-stone-500 block">
                  {getRoleLabel(currentPersona)}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
            </button>

            {/* Role Switcher Menu */}
            {roleDropdownOpen && (
              <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-stone-200 p-2 z-50 space-y-1 animate-in fade-in">
                <div className="px-3 py-1.5 border-b border-stone-100 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Switch Active Portal
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onChangePersona('farmer');
                    setRoleDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left transition-colors ${
                    currentPersona === 'farmer'
                      ? 'bg-emerald-50 text-emerald-900 font-bold'
                      : 'hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <span className="text-base">🌾</span>
                  <div>
                    <span className="block">{t.farmerView}</span>
                    <span className="text-[10px] text-stone-500 font-normal">Slot Discovery & Gate Passes</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onChangePersona('operator');
                    setRoleDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left transition-colors ${
                    currentPersona === 'operator'
                      ? 'bg-amber-50 text-amber-900 font-bold'
                      : 'hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <span className="text-base">🏢</span>
                  <div>
                    <span className="block">{t.operatorView}</span>
                    <span className="text-[10px] text-stone-500 font-normal">Gate Manifest & Weighbridge</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onChangePersona('admin');
                    setRoleDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left transition-colors ${
                    currentPersona === 'admin'
                      ? 'bg-blue-50 text-blue-900 font-bold'
                      : 'hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <span className="text-base">🛡️</span>
                  <div>
                    <span className="block">{t.adminView}</span>
                    <span className="text-[10px] text-stone-500 font-normal">Auditing & Badging</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Quick Segmented Persona Selector for rapid testing */}
          <nav aria-label="Portal Mode" className="hidden lg:flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button
              type="button"
              onClick={() => onChangePersona('farmer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentPersona === 'farmer'
                  ? 'bg-white text-emerald-900 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <User className="w-3.5 h-3.5 text-emerald-700" />
              <span>{t.farmerView}</span>
            </button>

            <button
              type="button"
              onClick={() => onChangePersona('operator')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentPersona === 'operator'
                  ? 'bg-white text-emerald-900 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Warehouse className="w-3.5 h-3.5 text-amber-600" />
              <span>{t.operatorView}</span>
            </button>

            <button
              type="button"
              onClick={() => onChangePersona('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentPersona === 'admin'
                  ? 'bg-white text-emerald-900 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Landmark className="w-3.5 h-3.5 text-blue-600" />
              <span>{t.adminView}</span>
            </button>
          </nav>
        </div>

        {/* Zone 3: Passes, Language & Logout */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Passes button for Farmer */}
          {currentPersona === 'farmer' && (
            <button
              type="button"
              onClick={onOpenMyPasses}
              className="relative px-3 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 border border-stone-200"
            >
              <span>{t.activePasses}</span>
              {activePassesCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center">
                  {activePassesCount}
                </span>
              )}
            </button>
          )}

          {/* Multilingual Switcher */}
          <div className="relative flex items-center bg-stone-100 rounded-lg p-0.5 border border-stone-200">
            <div className="px-1.5 text-stone-500">
              <Globe className="w-3.5 h-3.5" />
            </div>
            <button
              type="button"
              onClick={() => onChangeLang('en')}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                currentLang === 'en'
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
                currentLang === 'hi'
                  ? 'bg-white text-emerald-900 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              हिंदी
            </button>
            <button
              type="button"
              onClick={() => onChangeLang('te')}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                currentLang === 'te'
                  ? 'bg-white text-emerald-900 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              తెలుగు
            </button>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors whitespace-nowrap"
            title="Log out and return to One-Click Demo Access"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
