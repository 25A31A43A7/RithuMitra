import React, { useState } from 'react';
import { ProcurementCentre, BookingRecord, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import {
  Landmark,
  ShieldCheck,
  AlertTriangle,
  Scale,
  CreditCard,
  Building,
  RotateCcw,
  CheckCircle,
  TrendingUp,
  Activity,
  Sliders,
} from 'lucide-react';

interface AdminDashboardProps {
  centres: ProcurementCentre[];
  bookings: BookingRecord[];
  onUpdateCentre: (centre: ProcurementCentre) => void;
  onResetData: () => void;
  lang: Language;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  centres,
  bookings,
  onUpdateCentre,
  onResetData,
  lang,
}) => {
  const t = TRANSLATIONS[lang];
  const [auditLog, setAuditLog] = useState<string[]>([]);

  // Compute District-Wide KPIs
  const totalMandis = centres.length;
  const verifiedMandis = centres.filter((c) => c.govtVerified).length;

  const totalSlottedTonnes = bookings.reduce((sum, b) => sum + (b.metricTonnes || 0), 0);
  const totalProcuredTonnes = centres.reduce((sum, c) => sum + (c.currentProcuredTonnes || 0), 0);

  const avgSaturation = Math.round(
    centres.reduce((sum, c) => sum + c.currentCapacityPct, 0) / (centres.length || 1)
  );

  const totalDbtDisbursed = bookings.reduce(
    (sum, b) => (b.status === 'SETTLED' ? sum + (b.finalPayoutInr || 0) : sum),
    0
  );

  const handleToggleVerification = (centre: ProcurementCentre) => {
    const nextState = !centre.govtVerified;
    const updated = {
      ...centre,
      govtVerified: nextState,
    };
    onUpdateCentre(updated);

    const logEntry = `${new Date().toLocaleTimeString()} — ${nextState ? 'GRANTED' : 'REVOKED'} Govt. Verified Badge for "${centre.name}". Public map updated immediately.`;
    setAuditLog((prev) => [logEntry, ...prev.slice(0, 9)]);
  };

  const handleAdjustLimit = (centre: ProcurementCentre, newLimit: number) => {
    const safeLimit = Math.max(50, newLimit);
    const newPct = Math.round((centre.currentProcuredTonnes / safeLimit) * 100);
    const updated = {
      ...centre,
      dailyLimitTonnes: safeLimit,
      currentCapacityPct: Math.min(100, newPct),
    };
    onUpdateCentre(updated);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Govt. Directorate of Food & Civil Supplies
              </span>
              <span className="text-xs text-stone-500 font-mono">
                East Godavari District (Rajahmundry) · Regulatory Audit Portal
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 mt-1">
              {t.adminTitle}
            </h1>
            <p className="text-xs text-stone-500">
              {t.adminSubtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onResetData}
            className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors self-start md:self-auto border border-stone-200"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Baseline</span>
          </button>
        </div>

        {/* District-wide KPI Stats Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
            <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
              <span>{t.kpiTotalMandis}</span>
              <Building className="w-4 h-4 text-stone-400" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-stone-900">
              {totalMandis}
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
              {verifiedMandis} of {totalMandis} Authorized & Verified
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
            <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
              <span>{t.kpiProcuredTonnage}</span>
              <Scale className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-emerald-800">
              {totalProcuredTonnes.toFixed(1)} MT
            </div>
            <span className="text-[11px] text-stone-500 mt-1 block font-mono">
              Slotted: {totalSlottedTonnes.toFixed(1)} MT
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
            <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
              <span>{t.kpiSaturationIndex}</span>
              <Activity className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-stone-900">
              {avgSaturation}%
            </div>
            <span className={`text-[11px] font-semibold mt-1 block ${avgSaturation > 70 ? 'text-amber-600' : 'text-emerald-700'}`}>
              {avgSaturation > 70 ? 'Approaching Peak Harvest Load' : 'Balanced Regional Flow'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
            <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
              <span>{t.kpiTotalDbt}</span>
              <CreditCard className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-emerald-800">
              ₹{totalDbtDisbursed.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
              100% Direct Account Settlement
            </span>
          </div>
        </div>
      </div>

      {/* Centre Regulatory Auditing & Badging List */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
          <div>
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-700" />
              <span>{t.regulatoryAuditing}</span>
            </h2>
            <p className="text-xs text-stone-500">
              Grant or revoke the official blue shield badge. Revoking immediately updates the public farmer map with an unverified warning to protect growers against illegal commission deductions.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {centres.map((c) => {
            return (
              <div
                key={c.id}
                className="p-5 rounded-2xl border border-stone-200 bg-stone-50/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-stone-900 text-sm">{c.name}</h3>
                    {c.govtVerified ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                        {t.badgeGranted}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                        {t.badgeRevoked} (Under Review)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500">{c.address} · Contact: {c.contactPhone}</p>
                  <div className="flex items-center gap-4 text-xs text-stone-600 font-mono pt-1">
                    <span>Capacity: <strong>{c.currentProcuredTonnes} / {c.dailyLimitTonnes} MT ({c.currentCapacityPct}%)</strong></span>
                    <span>Wait: <strong>{c.queueTimeStr}</strong></span>
                    <span>Bays: <strong>{c.baysCount} Scales</strong></span>
                  </div>
                </div>

                {/* Quota Ceiling Adjuster */}
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-stone-200 shrink-0 text-xs">
                  <Sliders className="w-4 h-4 text-stone-400" />
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-semibold block">Ceiling Limit</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <input
                        type="number"
                        min="100"
                        max="2000"
                        step="50"
                        value={c.dailyLimitTonnes}
                        onChange={(e) => handleAdjustLimit(c, Number(e.target.value))}
                        className="w-18 px-1.5 py-0.5 rounded border border-stone-300 font-mono font-bold text-xs"
                      />
                      <span className="text-stone-500 font-mono">MT</span>
                    </div>
                  </div>
                </div>

                {/* Verification Toggle Button */}
                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleVerification(c)}
                    className={`w-full lg:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
                      c.govtVerified
                        ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                        : 'bg-blue-700 hover:bg-blue-800 text-white shadow-xs'
                    }`}
                  >
                    {c.govtVerified ? (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                        <span>{t.revokeBadge}</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-white" />
                        <span>{t.grantBadge}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Audit Log / Event Trail */}
        {auditLog.length > 0 && (
          <div className="mt-6 pt-4 border-t border-stone-200 space-y-2">
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
              Recent Regulatory Audit Trail:
            </span>
            <div className="bg-stone-900 text-emerald-400 p-3 rounded-xl text-xs font-mono space-y-1 max-h-36 overflow-y-auto">
              {auditLog.map((log, idx) => (
                <div key={idx} className="leading-relaxed">
                  &gt; {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
