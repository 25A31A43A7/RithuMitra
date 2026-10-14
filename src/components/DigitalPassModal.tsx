import React, { useState } from 'react';
import { BookingRecord, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { ShieldCheck, Printer, MessageCircle, Smartphone, Check, X, QrCode, Building, Scale, Truck, Calendar, Clock } from 'lucide-react';

interface DigitalPassModalProps {
  pass: BookingRecord;
  onClose: () => void;
  lang: Language;
}

export const DigitalPassModal: React.FC<DigitalPassModalProps> = ({ pass, onClose, lang }) => {
  const t = TRANSLATIONS[lang];
  const [copied, setCopied] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    setNotificationMsg(`📲 WhatsApp Message Dispatched to ${pass.farmerPhone}: "RythuMitra Booking Confirmation: Token ${pass.id} confirmed for ${pass.commodityName} at ${pass.centreName}. Gate bay: ${pass.assignedBay}. Valid for ${pass.slotDate} (${pass.slotTime})"`);
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  const handleSendSMS = () => {
    setNotificationMsg(`📩 Official RythuMitra Mandi SMS Sent to +91-${pass.farmerPhone}: Token: ${pass.id} | Crop: ${pass.quintals} Qtl | Date: ${pass.slotDate} | Gate Bay: ${pass.assignedBay}. Present this at weighbridge entry.`);
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(pass.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8 print:shadow-none print:border-none print:m-0">
        
        {/* Top Header */}
        <div className="bg-emerald-800 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/80 border border-emerald-500/40 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-emerald-200 font-semibold block">
                Govt. Mandi e-Pass & Token
              </span>
              <h3 className="text-lg font-bold tracking-tight">
                {t.digitalPassTitle}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-emerald-900/50 hover:bg-emerald-900 text-emerald-100 flex items-center justify-center transition-colors print:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Temporary Alert Notification */}
        {notificationMsg && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 text-xs text-amber-900 flex items-start gap-2 animate-in fade-in">
            <Smartphone className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span className="font-medium">{notificationMsg}</span>
          </div>
        )}

        {/* Main Pass Content */}
        <div className="p-6 space-y-6">
          {/* Token ID Hero Pill */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
                {t.tokenId}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-2xl font-bold font-mono text-stone-900 tracking-tight">
                  {pass.id}
                </span>
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="px-2 py-1 text-[11px] font-medium bg-white border border-stone-300 rounded hover:bg-stone-100 text-stone-700 transition-colors print:hidden"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : 'Copy'}
                </button>
              </div>
              <span className="text-[11px] text-stone-500 mt-1 block">
                Issued for {pass.slotDate} · {pass.slotTime}
              </span>
            </div>

            {/* Simulated Clean SVG QR Code */}
            <div className="w-24 h-24 bg-white p-2 rounded-xl border border-stone-300 shadow-xs flex flex-col items-center justify-center shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full text-stone-900" fill="currentColor">
                {/* Clean QR Matrix visual pattern */}
                <rect x="0" y="0" width="30" height="30" fill="currentColor" rx="4" />
                <rect x="5" y="5" width="20" height="20" fill="white" rx="2" />
                <rect x="9" y="9" width="12" height="12" fill="currentColor" />
                
                <rect x="70" y="0" width="30" height="30" fill="currentColor" rx="4" />
                <rect x="75" y="5" width="20" height="20" fill="white" rx="2" />
                <rect x="79" y="9" width="12" height="12" fill="currentColor" />
                
                <rect x="0" y="70" width="30" height="30" fill="currentColor" rx="4" />
                <rect x="5" y="75" width="20" height="20" fill="white" rx="2" />
                <rect x="9" y="79" width="12" height="12" fill="currentColor" />
                
                <rect x="40" y="10" width="10" height="20" />
                <rect x="15" y="40" width="20" height="10" />
                <rect x="45" y="45" width="18" height="18" rx="2" />
                <rect x="70" y="45" width="15" height="10" />
                <rect x="40" y="75" width="15" height="15" />
                <rect x="65" y="75" width="25" height="10" />
              </svg>
              <span className="text-[8px] font-mono text-stone-400 mt-0.5 tracking-widest uppercase">FAST-GATE</span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <div className="flex items-center gap-1.5 text-stone-500 mb-1">
                <Building className="w-3.5 h-3.5" />
                <span className="font-medium">Designated Depot</span>
              </div>
              <p className="font-bold text-stone-900 text-sm">{pass.centreName}</p>
              <p className="text-emerald-700 font-semibold mt-0.5 text-[11px]">{pass.assignedBay}</p>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <div className="flex items-center gap-1.5 text-stone-500 mb-1">
                <Scale className="w-3.5 h-3.5" />
                <span className="font-medium">Declared Commodity</span>
              </div>
              <p className="font-bold text-stone-900 text-sm">{pass.commodityName}</p>
              <p className="text-stone-700 font-mono mt-0.5 text-[11px]">
                {pass.inputQuantity} {pass.inputUnit} ({pass.quintals} Qtl / {pass.metricTonnes} MT)
              </p>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <div className="flex items-center gap-1.5 text-stone-500 mb-1">
                <Truck className="w-3.5 h-3.5" />
                <span className="font-medium">Farmer & Vehicle</span>
              </div>
              <p className="font-bold text-stone-900">{pass.farmerName}</p>
              <p className="text-stone-600 text-[11px]">
                {pass.vehicleType} · <span className="font-mono font-medium">{pass.vehicleNumber}</span>
              </p>
              <p className="text-stone-500 text-[10px] mt-0.5">Khasra: {pass.khasraNumber} · {pass.village}</p>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <div className="flex items-center gap-1.5 text-stone-500 mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span className="font-medium">Arrival Schedule</span>
              </div>
              <p className="font-bold text-stone-900">{pass.slotDate}</p>
              <div className="flex items-center gap-1 text-emerald-800 font-medium text-[11px] mt-0.5">
                <Clock className="w-3 h-3" />
                <span>{pass.slotTime}</span>
              </div>
              <span className="text-stone-400 text-[10px]">Guaranteed weighbridge bay access</span>
            </div>
          </div>

          {/* Direct Benefit Transfer & Payout Notice */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-emerald-900">Estimated Total MSP Payout:</span>
              <span className="text-base font-bold font-mono text-emerald-800">
                ₹{pass.estimatedPayoutInr.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-emerald-700 text-[11px] leading-relaxed">
              Disbursal via Direct Benefit Transfer (DBT) directly into farmer's Aadhaar-seeded bank account upon tare weighment completion.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-stone-50 px-6 py-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-700" />
              <span>{t.sendWhatsapp}</span>
            </button>
            <button
              type="button"
              onClick={handleSendSMS}
              className="px-3 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-200 hover:bg-stone-100 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Smartphone className="w-4 h-4 text-stone-600" />
              <span>{t.sendSms}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 text-xs font-semibold text-stone-800 bg-stone-200 hover:bg-stone-300 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4 text-stone-700" />
              <span>{t.printPass}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-colors"
            >
              {t.closePass}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
