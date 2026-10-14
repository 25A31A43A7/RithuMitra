import React, { useState } from 'react';
import {
  ProcurementCentre,
  BookingRecord,
  Language,
} from '../types';
import { COMMODITIES, calculateSettlementPayout } from '../utils/units';
import { TRANSLATIONS } from '../utils/translations';
import {
  Warehouse,
  AlertOctagon,
  QrCode,
  CheckCircle,
  Truck,
  Scale,
  Droplets,
  CreditCard,
  Search,
  Check,
  RefreshCw,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface OperatorPortalProps {
  centres: ProcurementCentre[];
  bookings: BookingRecord[];
  onUpdateCentre: (centre: ProcurementCentre) => void;
  onUpdateBooking: (booking: BookingRecord) => void;
  lang: Language;
}

export const OperatorPortal: React.FC<OperatorPortalProps> = ({
  centres,
  bookings,
  onUpdateCentre,
  onUpdateBooking,
  lang,
}) => {
  const t = TRANSLATIONS[lang];

  // Selected Depot being managed
  const [selectedDepotId, setSelectedDepotId] = useState<string>(centres[0]?.id || 'centre-apmc-rjy');
  const currentDepot = centres.find((c) => c.id === selectedDepotId) || centres[0];

  // Search & Active Token loaded in the 5-Stage Pipeline
  const [tokenSearchInput, setTokenSearchInput] = useState<string>('RM-RJY-PDY-104');
  const [activeTokenId, setActiveTokenId] = useState<string>('RM-RJY-PDY-104');

  // Filter for Manifest Table
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Pipeline form temporary states
  const activeBooking = bookings.find((b) => b.id === activeTokenId) || bookings[0];

  const [grossInput, setGrossInput] = useState<number>(
    activeBooking?.grossWeightKg || (activeBooking?.kg ? activeBooking.kg + 3200 : 8200)
  );
  const [moistureInput, setMoistureInput] = useState<number>(
    activeBooking?.moisturePct || 14.5
  );
  const [tareInput, setTareInput] = useState<number>(
    activeBooking?.tareWeightKg || 3200
  );

  // Settlement Calculation
  const cropInfo = activeBooking && COMMODITIES[activeBooking.commodityId]
    ? COMMODITIES[activeBooking.commodityId]
    : COMMODITIES.paddy_grade_a;
  const netWeightKg = Math.max(0, grossInput - tareInput);
  const settlement = calculateSettlementPayout(
    activeBooking?.commodityId || 'paddy_grade_a',
    netWeightKg,
    moistureInput
  );

  // Filter bookings for current depot
  const depotBookings = bookings.filter((b) => b.centreId === currentDepot.id);
  const filteredBookings = depotBookings.filter((b) => {
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
    return true;
  });

  // Emergency full toggle
  const handleToggleEmergencyFull = () => {
    const updated = {
      ...currentDepot,
      emergencyFull: !currentDepot.emergencyFull,
      status: !currentDepot.emergencyFull ? ('RED' as const) : ('GREEN' as const),
      currentCapacityPct: !currentDepot.emergencyFull ? 98 : 45,
      queueTimeStr: !currentDepot.emergencyFull ? '~6.5 hrs' : '~30 mins',
    };
    onUpdateCentre(updated);
  };

  // Pipeline actions
  const handleStage1Arrive = () => {
    if (!activeBooking) return;
    const updated: BookingRecord = {
      ...activeBooking,
      status: 'IN_YARD',
      arrivedAt: new Date().toISOString(),
    };
    onUpdateBooking(updated);
  };

  const handleStage2Gross = () => {
    if (!activeBooking) return;
    const updated: BookingRecord = {
      ...activeBooking,
      status: 'GROSS_WEIGHED',
      grossWeightKg: grossInput,
      grossLoggedAt: new Date().toISOString(),
    };
    onUpdateBooking(updated);
  };

  const handleStage3Moisture = () => {
    if (!activeBooking) return;
    const updated: BookingRecord = {
      ...activeBooking,
      status: 'ASSAYED',
      moisturePct: moistureInput,
      moistureStatus: settlement.moistureStatus,
    };
    onUpdateBooking(updated);
  };

  const handleStage4Tare = () => {
    if (!activeBooking) return;
    const updated: BookingRecord = {
      ...activeBooking,
      status: 'ASSAYED',
      tareWeightKg: tareInput,
      tareLoggedAt: new Date().toISOString(),
      netWeightKg,
      netQuintals: settlement.netQuintals,
      netBags: settlement.netBags,
    };
    onUpdateBooking(updated);
  };

  const handleStage5DisburseDBT = () => {
    if (!activeBooking) return;
    const dbtRef = `DBT-AP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const updated: BookingRecord = {
      ...activeBooking,
      status: 'SETTLED',
      grossWeightKg: grossInput,
      tareWeightKg: tareInput,
      netWeightKg,
      netQuintals: settlement.netQuintals,
      netBags: settlement.netBags,
      moisturePct: moistureInput,
      moistureStatus: settlement.moistureStatus,
      moistureDeductionPct: settlement.moistureDeductionPct,
      finalPayoutInr: settlement.finalPayout,
      dbtReferenceId: dbtRef,
      dbtDisbursedAt: new Date().toISOString(),
    };
    onUpdateBooking(updated);

    // Also update depot procured tonnage
    const addedTonnes = Number((netWeightKg / 1000).toFixed(2));
    const nextProcured = Number((currentDepot.currentProcuredTonnes + addedTonnes).toFixed(1));
    const nextPct = Math.round((nextProcured / currentDepot.dailyLimitTonnes) * 100);
    onUpdateCentre({
      ...currentDepot,
      currentProcuredTonnes: nextProcured,
      currentCapacityPct: Math.min(100, nextPct),
    });
  };

  // Helper for quick selection of token from search
  const handleSelectToken = (id: string) => {
    setActiveTokenId(id);
    const b = bookings.find((item) => item.id === id);
    if (b) {
      setGrossInput(b.grossWeightKg || b.kg + 3850);
      setTareInput(b.tareWeightKg || 3850);
      setMoistureInput(b.moisturePct || 11.5);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header & Depot Selector */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Depot Master Console
              </span>
              <span className="text-xs text-stone-500 font-mono">
                APMC Weighbridge Automation v2.4
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 mt-1">
              {t.operatorTitle}
            </h1>
            <p className="text-xs text-stone-500">
              {t.operatorSubtitle}
            </p>
          </div>

          {/* Depot Facility Selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-stone-600 whitespace-nowrap">
              {t.selectDepot}:
            </span>
            <select
              value={selectedDepotId}
              onChange={(e) => setSelectedDepotId(e.target.value)}
              className="text-xs font-bold px-3 py-2 rounded-xl border border-stone-300 bg-stone-50 text-stone-900"
            >
              {centres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.currentCapacityPct}% - {c.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Real-Time Yard Manifest & Quota Control Gauge */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-700">{t.intakeProgress}:</span>
              <span className="font-mono font-bold text-stone-900">
                {currentDepot.currentProcuredTonnes} / {currentDepot.dailyLimitTonnes} MT ({currentDepot.currentCapacityPct}%)
              </span>
            </div>
            <div className="w-full bg-stone-100 rounded-full h-3.5 overflow-hidden border border-stone-200">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  currentDepot.emergencyFull || currentDepot.status === 'RED'
                    ? 'bg-red-600'
                    : currentDepot.status === 'YELLOW'
                    ? 'bg-amber-500'
                    : 'bg-emerald-600'
                }`}
                style={{ width: `${Math.min(100, currentDepot.currentCapacityPct)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
              <span>Remaining Capacity: {Math.max(0, currentDepot.dailyLimitTonnes - currentDepot.currentProcuredTonnes).toFixed(1)} MT</span>
              <span className="font-semibold text-stone-700">Estimated Gate Wait: {currentDepot.queueTimeStr}</span>
            </div>
          </div>

          {/* Emergency Spillover Switch */}
          <div className="md:col-span-4 p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <AlertOctagon className={`w-5 h-5 ${currentDepot.emergencyFull ? 'text-red-600' : 'text-stone-400'}`} />
                <span className="text-xs font-bold text-stone-800">
                  {t.emergencyFullToggle}
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleEmergencyFull}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  currentDepot.emergencyFull ? 'bg-red-600' : 'bg-stone-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    currentDepot.emergencyFull ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="text-[10px] text-stone-500 leading-tight">
              {currentDepot.emergencyFull
                ? t.emergencyFullNotice
                : 'Turn ON to halt incoming bookings and advise farmers to alternate green mandis.'}
            </p>
          </div>
        </div>
      </div>

      {/* Gate Intake QR Scanner Simulator & 5-Stage Processing Pipeline */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-700" />
              <span>{t.scannerSimulator}</span>
            </h2>
            <p className="text-xs text-stone-500">
              {t.scannerPrompt}
            </p>
          </div>

          {/* Token Search Bar */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search Token (e.g. RM-2026-WHT-984)"
                value={tokenSearchInput}
                onChange={(e) => setTokenSearchInput(e.target.value)}
                className="pl-9 pr-3 py-2 text-xs font-mono font-bold rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-stone-900"
              />
            </div>
            <button
              type="button"
              onClick={() => handleSelectToken(tokenSearchInput)}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-stone-900 text-white hover:bg-stone-800"
            >
              Load Token
            </button>
          </div>
        </div>

        {/* Currently Loaded Vehicle Dossier */}
        {activeBooking ? (
          <div className="space-y-6">
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-stone-900 text-white flex items-center justify-center font-mono font-bold text-sm">
                  {activeBooking.assignedBay.split(' ')[1] || 'BAY'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-stone-900 font-mono">{activeBooking.id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      activeBooking.status === 'SETTLED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : activeBooking.status === 'BOOKED'
                        ? 'bg-stone-200 text-stone-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {activeBooking.status}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 mt-0.5">
                    Farmer: <strong>{activeBooking.farmerName}</strong> · Vehicle: <span className="font-mono">{activeBooking.vehicleNumber}</span> ({activeBooking.vehicleType})
                  </p>
                </div>
              </div>

              <div className="text-right text-xs">
                <span className="text-stone-400 block">Declared Commodity</span>
                <span className="text-sm font-bold text-stone-900">
                  {activeBooking.commodityName}
                </span>
                <span className="text-stone-600 font-mono block">
                  {activeBooking.inputQuantity} {activeBooking.inputUnit} ({activeBooking.quintals} Qtl)
                </span>
              </div>
            </div>

            {/* 5-Stage Pipeline Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {/* STAGE 1: Arrived at Gate */}
              <div className={`p-4 rounded-2xl border text-xs flex flex-col justify-between ${
                activeBooking.status !== 'BOOKED'
                  ? 'border-emerald-300 bg-emerald-50/50'
                  : 'border-stone-200 bg-white'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-stone-800">{t.stage1Arrive}</span>
                    {activeBooking.status !== 'BOOKED' ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-stone-400" />
                    )}
                  </div>
                  <p className="text-stone-500 text-[11px] mb-3">
                    Verify gate permit and authorize tractor entry to bay.
                  </p>
                </div>
                {activeBooking.status === 'BOOKED' ? (
                  <button
                    type="button"
                    onClick={handleStage1Arrive}
                    className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-[11px] transition-colors"
                  >
                    Mark Arrived
                  </button>
                ) : (
                  <span className="text-[10px] text-emerald-700 font-bold block bg-emerald-100/60 p-1 rounded text-center">
                    Vehicle In Yard
                  </span>
                )}
              </div>

              {/* STAGE 2: Gross Weighment */}
              <div className={`p-4 rounded-2xl border text-xs flex flex-col justify-between ${
                activeBooking.grossWeightKg
                  ? 'border-emerald-300 bg-emerald-50/50'
                  : 'border-stone-200 bg-white'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-stone-800">{t.stage2Gross}</span>
                    <Scale className="w-4 h-4 text-stone-400" />
                  </div>
                  <label className="block text-[11px] text-stone-500 mb-1">{t.grossWeightLabel}</label>
                  <input
                    type="number"
                    value={grossInput}
                    onChange={(e) => setGrossInput(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 bg-stone-50 font-mono font-bold text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleStage2Gross}
                  className="mt-3 w-full py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-lg text-[11px] transition-colors"
                >
                  Log Gross Scale
                </button>
              </div>

              {/* STAGE 3: Moisture Assaying */}
              <div className={`p-4 rounded-2xl border text-xs flex flex-col justify-between ${
                activeBooking.moisturePct
                  ? 'border-emerald-300 bg-emerald-50/50'
                  : 'border-stone-200 bg-white'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-stone-800">{t.stage3Moisture}</span>
                    <Droplets className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-stone-500">Moisture:</span>
                    <span className="font-bold font-mono text-stone-900">{moistureInput}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="22"
                    step="0.5"
                    value={moistureInput}
                    onChange={(e) => setMoistureInput(Number(e.target.value))}
                    className="w-full accent-emerald-600 mb-1"
                  />
                  <div className="text-[10px]">
                    {settlement.moistureStatus === 'PASS' ? (
                      <span className="text-emerald-700 font-bold block">✓ PASS (&le; {cropInfo.maxMoisture}%)</span>
                    ) : (
                      <span className="text-amber-700 font-bold block">⚠️ Excess (-{settlement.moistureDeductionPct}%)</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleStage3Moisture}
                  className="mt-3 w-full py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-lg text-[11px] transition-colors"
                >
                  Confirm Assaying
                </button>
              </div>

              {/* STAGE 4: Tare Weighment */}
              <div className={`p-4 rounded-2xl border text-xs flex flex-col justify-between ${
                activeBooking.tareWeightKg
                  ? 'border-emerald-300 bg-emerald-50/50'
                  : 'border-stone-200 bg-white'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-stone-800">{t.stage4Tare}</span>
                    <Truck className="w-4 h-4 text-stone-400" />
                  </div>
                  <label className="block text-[11px] text-stone-500 mb-1">{t.tareWeightLabel}</label>
                  <input
                    type="number"
                    value={tareInput}
                    onChange={(e) => setTareInput(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 bg-stone-50 font-mono font-bold text-xs"
                  />
                  <div className="mt-2 text-[10px] text-stone-600">
                    Net: <strong className="font-mono text-stone-900">{netWeightKg} kg</strong> ({settlement.netQuintals} Qtl)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleStage4Tare}
                  className="mt-3 w-full py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-lg text-[11px] transition-colors"
                >
                  Log Tare Scale
                </button>
              </div>

              {/* STAGE 5: Issue Receipt & Disburse DBT */}
              <div className={`p-4 rounded-2xl border text-xs flex flex-col justify-between ${
                activeBooking.status === 'SETTLED'
                  ? 'border-emerald-400 bg-emerald-50'
                  : 'border-stone-200 bg-white'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-stone-800">{t.stage5Settle}</span>
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-[10px] text-stone-400 block">Final MSP Payout:</span>
                  <span className="text-base font-extrabold font-mono text-emerald-800 block">
                    ₹{settlement.finalPayout.toLocaleString('en-IN')}
                  </span>
                  {activeBooking.dbtReferenceId && (
                    <span className="text-[9px] font-mono text-emerald-700 block mt-1">
                      Ref: {activeBooking.dbtReferenceId}
                    </span>
                  )}
                </div>
                {activeBooking.status !== 'SETTLED' ? (
                  <button
                    type="button"
                    onClick={handleStage5DisburseDBT}
                    className="mt-3 w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-[11px] transition-colors shadow-xs"
                  >
                    Disburse DBT
                  </button>
                ) : (
                  <span className="text-[10px] text-emerald-800 font-bold block bg-emerald-100 p-1.5 rounded text-center mt-3">
                    ✓ Paid via DBT
                  </span>
                )}
              </div>
            </div>

            {/* Simulated Live DBT Settlement Alert if Settled */}
            {activeBooking.status === 'SETTLED' && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs text-emerald-950 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-sm block">Direct Benefit Transfer (DBT) Transferred!</span>
                    <span>
                      UTR Ref: <code className="font-mono font-bold text-emerald-800">{activeBooking.dbtReferenceId}</code> · ₹{activeBooking.finalPayoutInr?.toLocaleString('en-IN')} deposited to {activeBooking.farmerName}'s bank account.
                    </span>
                  </div>
                </div>
                <span className="font-mono text-[11px] text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                  NPCI ACH Cleared
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-stone-500 text-xs">
            No booking token loaded. Select from the manifest table below to begin processing.
          </div>
        )}
      </div>

      {/* Live Intake Manifest Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <h2 className="text-base font-bold text-stone-900">
              {t.manifestTableTitle} ({depotBookings.length} Vehicles Scheduled)
            </h2>
            <p className="text-xs text-stone-500">
              Real-time gate arrivals and weighbridge queue for {currentDepot.name}.
            </p>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs overflow-x-auto">
            {['ALL', 'BOOKED', 'IN_YARD', 'GROSS_WEIGHED', 'SETTLED'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-stone-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">Token ID</th>
                <th className="py-3 px-4">Farmer Details</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Commodity & Quantity</th>
                <th className="py-3 px-4">Slot Time</th>
                <th className="py-3 px-4">Assigned Bay</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-sans">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-400">
                    No scheduled arrivals match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const isCurrentActive = b.id === activeTokenId;
                  return (
                    <tr
                      key={b.id}
                      className={`hover:bg-stone-50 transition-colors ${
                        isCurrentActive ? 'bg-emerald-50/40 font-medium' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-stone-900">
                        {b.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-stone-900">{b.farmerName}</div>
                        <div className="text-[11px] text-stone-500">{b.village}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-stone-800">{b.vehicleNumber}</div>
                        <div className="text-[10px] text-stone-400">{b.vehicleType}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-stone-800">{b.commodityName.split(' ')[0]}</div>
                        <div className="text-[11px] text-stone-500 font-mono">
                          {b.inputQuantity} {b.inputUnit} ({b.quintals} Qtl)
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-stone-600">
                        {b.slotTime}
                      </td>
                      <td className="py-3 px-4 text-stone-700">
                        {b.assignedBay}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          b.status === 'SETTLED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.status === 'BOOKED'
                            ? 'bg-stone-100 text-stone-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleSelectToken(b.id)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-stone-900 text-white hover:bg-stone-800 transition-colors"
                        >
                          Process
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
