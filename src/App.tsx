/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Persona, Language, ProcurementCentre, BookingRecord, FarmerProfile, UserAccount } from './types';
import {
  getCentres,
  saveCentres,
  getBookings,
  saveBookings,
  addBooking,
  updateBooking,
  getProfiles,
  getActiveProfile,
  setActiveProfile,
  getCurrentUser,
  setCurrentUser,
  logoutUser,
  resetToDefaults,
} from './utils/storage';
import { AuthScreen } from './components/AuthScreen';
import { Navbar } from './components/Navbar';
import { FarmerPortal } from './components/FarmerPortal';
import { OperatorPortal } from './components/OperatorPortal';
import { AdminDashboard } from './components/AdminDashboard';
import { KisanMitraAI } from './components/KisanMitraAI';
import { DigitalPassModal } from './components/DigitalPassModal';
import { MyPassesDrawer } from './components/MyPassesDrawer';
import { CheckCircle2, ShieldCheck, PhoneCall } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUserState] = useState<UserAccount | null>(null);
  const [persona, setPersona] = useState<Persona>('farmer');
  const [lang, setLang] = useState<Language>('en');

  // Application Data States
  const [centres, setCentres] = useState<ProcurementCentre[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [profiles, setProfiles] = useState<FarmerProfile[]>([]);
  const [activeProfile, setActiveProfileState] = useState<FarmerProfile | null>(null);

  // Modals
  const [currentPassModal, setCurrentPassModal] = useState<BookingRecord | null>(null);
  const [myPassesOpen, setMyPassesOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load from Storage
  const loadState = () => {
    setCentres(getCentres());
    setBookings(getBookings());
    const prfs = getProfiles();
    setProfiles(prfs);

    const user = getCurrentUser();
    setCurrentUserState(user);

    if (user) {
      setPersona(user.role);
      if (user.role === 'farmer' && user.farmerProfile) {
        setActiveProfileState(user.farmerProfile);
      } else {
        setActiveProfileState(getActiveProfile());
      }
    } else {
      setActiveProfileState(getActiveProfile());
    }
  };

  useEffect(() => {
    loadState();

    const handleStorageChange = () => {
      loadState();
    };

    window.addEventListener('farmgain_storage_change', handleStorageChange);
    window.addEventListener('farmgain_auth_change', handleStorageChange);
    return () => {
      window.removeEventListener('farmgain_storage_change', handleStorageChange);
      window.removeEventListener('farmgain_auth_change', handleStorageChange);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUserState(user);
    setPersona(user.role);
    if (user.role === 'farmer' && user.farmerProfile) {
      setActiveProfileState(user.farmerProfile);
    }
    showToast(`Welcome back, ${user.name}! Switched to ${user.role.toUpperCase()} workspace.`);
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUserState(null);
    showToast('Logged out successfully. Returned to Demo Login screen.');
  };

  const handleSelectProfile = (id: string) => {
    setActiveProfile(id);
    const prf = profiles.find((p) => p.id === id);
    if (prf) {
      setActiveProfileState(prf);
      showToast(`Switched active farmer profile to ${prf.name}`);
    }
  };

  const handleBookPass = (record: BookingRecord) => {
    addBooking(record);
    setCurrentPassModal(record);
    showToast(`Gate Pass & Token ${record.id} successfully reserved!`);
  };

  const handleUpdateBooking = (updated: BookingRecord) => {
    updateBooking(updated);
    if (updated.status === 'SETTLED') {
      showToast(`DBT settlement of ₹${updated.finalPayoutInr?.toLocaleString('en-IN')} disbursed for ${updated.id}!`);
    } else {
      showToast(`Token ${updated.id} status updated to [${updated.status}]`);
    }
  };

  const handleUpdateCentre = (updatedCentre: ProcurementCentre) => {
    const nextCentres = centres.map((c) => (c.id === updatedCentre.id ? updatedCentre : c));
    saveCentres(nextCentres);
    setCentres(nextCentres);
  };

  const handleResetData = () => {
    resetToDefaults();
    showToast('Platform reset to original baseline seed data.');
  };

  // If user is not logged in, display the modern 3-Role One-Click Demo Login & Custom Auth screen!
  if (!currentUser) {
    return (
      <AuthScreen
        onLoginSuccess={handleLoginSuccess}
        lang={lang}
        onChangeLang={setLang}
      />
    );
  }

  if (!activeProfile || centres.length === 0) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-stone-600 font-medium">Loading FarmGain Agricultural Registry...</p>
        </div>
      </div>
    );
  }

  const farmerBookings = bookings.filter((b) => b.farmerId === activeProfile.id);

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 font-sans flex flex-col">
      {/* Top Persistent Navigation */}
      <Navbar
        currentUser={currentUser}
        currentPersona={persona}
        onChangePersona={(p) => {
          setPersona(p);
          showToast(`Switched workspace view to ${p.toUpperCase()}`);
        }}
        onLogout={handleLogout}
        currentLang={lang}
        onChangeLang={setLang}
        activePassesCount={farmerBookings.length}
        onOpenMyPasses={() => setMyPassesOpen(true)}
      />

      {/* Global Interactive Notification Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 max-w-md bg-stone-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-stone-700 flex items-center gap-3 animate-in slide-in-from-top-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium leading-snug">{toastMessage}</span>
        </div>
      )}

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {persona === 'farmer' && (
          <FarmerPortal
            centres={centres}
            farmerProfile={activeProfile}
            allProfiles={profiles}
            onSelectProfile={handleSelectProfile}
            onBookPass={handleBookPass}
            lang={lang}
          />
        )}

        {persona === 'operator' && (
          <OperatorPortal
            centres={centres}
            bookings={bookings}
            onUpdateCentre={handleUpdateCentre}
            onUpdateBooking={handleUpdateBooking}
            lang={lang}
          />
        )}

        {persona === 'admin' && (
          <AdminDashboard
            centres={centres}
            bookings={bookings}
            onUpdateCentre={handleUpdateCentre}
            onResetData={handleResetData}
            lang={lang}
          />
        )}
      </main>

      {/* Kisan Mitra AI Assistant Widget */}
      <KisanMitraAI
        centres={centres}
        bookings={bookings}
        lang={lang}
        currentUser={currentUser}
        activeProfile={activeProfile}
      />

      {/* Digital Pass Modal */}
      {currentPassModal && (
        <DigitalPassModal
          pass={currentPassModal}
          onClose={() => setCurrentPassModal(null)}
          lang={lang}
        />
      )}

      {/* My Active Passes Drawer */}
      <MyPassesDrawer
        isOpen={myPassesOpen}
        onClose={() => setMyPassesOpen(false)}
        bookings={farmerBookings}
        onSelectPass={(pass) => setCurrentPassModal(pass)}
        lang={lang}
      />

      {/* Subtle Rural Footer */}
      <footer className="bg-white border-t border-stone-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-900">FarmGain Agricultural Network</span>
            <span>·</span>
            <span>MSP Rate Assurance 2026</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-stone-600">
              <PhoneCall className="w-3.5 h-3.5 text-emerald-700" />
              Kisan Toll-Free Helpline: 1800-180-1551
            </span>
            <span>·</span>
            <span className="flex items-center gap-1 text-emerald-800 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              Direct APMC Certified
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
