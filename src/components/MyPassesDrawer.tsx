import React from 'react';
import { BookingRecord, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { X, QrCode, Clock, MapPin, Truck, ChevronRight } from 'lucide-react';

interface MyPassesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: BookingRecord[];
  onSelectPass: (pass: BookingRecord) => void;
  lang: Language;
}

export const MyPassesDrawer: React.FC<MyPassesDrawerProps> = ({
  isOpen,
  onClose,
  bookings,
  onSelectPass,
  lang,
}) => {
  const t = TRANSLATIONS[lang];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-stone-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold">{t.activePasses}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {bookings.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-xs">
              No active passes booked yet. Select a depot and reserve a slot to generate your gate pass.
            </div>
          ) : (
            bookings.map((pass) => (
              <div
                key={pass.id}
                onClick={() => {
                  onSelectPass(pass);
                  onClose();
                }}
                className="p-4 rounded-2xl border border-stone-200 hover:border-emerald-600 bg-stone-50 hover:bg-emerald-50/30 cursor-pointer transition-all space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-stone-900 text-sm">{pass.id}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      pass.status === 'SETTLED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : pass.status === 'BOOKED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {pass.status}
                  </span>
                </div>

                <div className="text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-stone-700 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{pass.centreName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-stone-500">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>{pass.slotDate} · {pass.slotTime}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-stone-500">
                    <Truck className="w-3.5 h-3.5 text-stone-400" />
                    <span>
                      {pass.commodityName.split(' ')[0]}: {pass.inputQuantity} {pass.inputUnit} ({pass.quintals} Qtl)
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-200/80 flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-emerald-700">
                    ₹{pass.estimatedPayoutInr.toLocaleString('en-IN')}
                  </span>
                  <span className="text-emerald-700 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-0.5 text-[11px]">
                    View Pass <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
