import React, { useState, useEffect } from 'react';
import {
  CommodityId,
  UnitType,
  Language,
  ProcurementCentre,
  FarmerProfile,
  BookingRecord,
  VehicleType,
} from '../types';
import { COMMODITIES, UNIT_LABELS, convertUnits, calculateEstimatedPayout } from '../utils/units';
import { TRANSLATIONS } from '../utils/translations';
import { QUICK_CITIES, QuickCity, MANDAL_LOCATIONS, RAJAHMUNDRY_DEFAULT_COORDS } from '../utils/storage';
import { calculateDistanceKm, getClosestRegion } from '../utils/geodesic';
import { MapView } from './MapView';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  MapPin,
  Scale,
  Sparkles,
  ArrowRight,
  TrendingDown,
  UserCheck,
  Phone,
  CheckCircle2,
  ChevronRight,
  ArrowUpDown,
  Navigation,
  Crosshair,
  Search,
  Building,
} from 'lucide-react';

interface FarmerPortalProps {
  centres: ProcurementCentre[];
  farmerProfile: FarmerProfile;
  allProfiles: FarmerProfile[];
  onSelectProfile: (id: string) => void;
  onBookPass: (record: BookingRecord) => void;
  lang: Language;
}

export const FarmerPortal: React.FC<FarmerPortalProps> = ({
  centres: initialCentres,
  farmerProfile,
  allProfiles,
  onSelectProfile,
  onBookPass,
  lang,
}) => {
  const t = TRANSLATIONS[lang];

  // Geolocation & Manual Pinning State
  const [farmerCoords, setFarmerCoords] = useState<[number, number]>(
    farmerProfile.coords || RAJAHMUNDRY_DEFAULT_COORDS
  );
  const [isDragPinMode, setIsDragPinMode] = useState<boolean>(false);
  const [gpsStatus, setGpsStatus] = useState<'IDLE' | 'ACQUIRING' | 'SUCCESS'>('IDLE');
  const [locationStatusMessage, setLocationStatusMessage] = useState<string>(
    'Location: Rajahmundry (East Godavari)'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Commodity & Unit Inputs
  const [selectedCrop, setSelectedCrop] = useState<CommodityId>('paddy_grade_a');
  const [quantityInput, setQuantityInput] = useState<number>(120);
  const [selectedUnit, setSelectedUnit] = useState<UnitType>('bag');

  // Filters
  const [filterCrop, setFilterCrop] = useState<CommodityId | 'all'>('paddy_grade_a');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [radiusKm, setRadiusKm] = useState<number>(30);

  // Selection & Slot Booking
  const [selectedCentreId, setSelectedCentreId] = useState<string>('centre-kadiyam-pacs');
  const [slotDate, setSlotDate] = useState<string>('Today (14 Oct)');
  const [slotTime, setSlotTime] = useState<string>('10:00 - 12:00 PM');
  const [customVehicleNumber, setCustomVehicleNumber] = useState(farmerProfile.vehicleNumber);
  const [customVehicleType, setCustomVehicleType] = useState<VehicleType>(farmerProfile.vehicleType);
  const [profileSwitchOpen, setProfileSwitchOpen] = useState(false);

  // Heuristic Rerouting Alert Modal
  const [rerouteAlert, setRerouteAlert] = useState<{
    show: boolean;
    congestedCentre: ProcurementCentre;
    recommendedCentre: ProcurementCentre;
    savingsInr: number;
  } | null>(null);

  // Scope filter: default to 'city' as required by prompt
  const [viewScope, setViewScope] = useState<'city' | 'all'>('city');

  // Accuracy in meters from device GPS or fallback
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(35);

  // 1. Robust Geolocation with IP Fallback (NEVER stuck on GPS Denied)
  const acquireLocationWithIpFallback = () => {
    setGpsStatus('ACQUIRING');
    setLocationStatusMessage(
      lang === 'te'
        ? 'GPS ద్వారా ఖచ్చితమైన స్థానాన్ని గుర్తిస్తోంది...'
        : lang === 'hi'
        ? 'जीपीएस द्वारा सटीक स्थान प्राप्त किया जा रहा है...'
        : 'Acquiring high-accuracy GPS coordinates...'
    );

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      // First attempt: High accuracy with 8s timeout
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
          const acc = position.coords.accuracy || 25;
          setFarmerCoords(coords);
          setAccuracyMeters(acc);
          setGpsStatus('SUCCESS');
          const detectedRegion = getClosestRegion(coords);
          const localCentres = initialCentres.filter((c) => c.region === detectedRegion);
          if (localCentres.length > 0) {
            const green = localCentres.find((c) => c.status === 'GREEN' && !c.emergencyFull);
            setSelectedCentreId(green ? green.id : localCentres[0].id);
          }
          const accStr = acc ? ` (±${Math.round(acc)}m)` : '';
          setLocationStatusMessage(
            `📍 Live GPS: [${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}]${accStr}`
          );
        },
        () => {
          // Second attempt: Normal accuracy with cached position allowed
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
              const acc = pos.coords.accuracy || 60;
              setFarmerCoords(coords);
              setAccuracyMeters(acc);
              setGpsStatus('SUCCESS');
              const detectedRegion = getClosestRegion(coords);
              const localCentres = initialCentres.filter((c) => c.region === detectedRegion);
              if (localCentres.length > 0) {
                const green = localCentres.find((c) => c.status === 'GREEN' && !c.emergencyFull);
                setSelectedCentreId(green ? green.id : localCentres[0].id);
              }
              setLocationStatusMessage(
                `📍 Live GPS: [${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}] (±${Math.round(acc)}m)`
              );
            },
            () => {
              // Geolocation blocked or denied -> Auto-detect via network IP with instant manual pin drag
              fallbackToIpGeolocation();
            },
            { timeout: 5000, enableHighAccuracy: false, maximumAge: 300000 }
          );
        },
        { timeout: 7000, enableHighAccuracy: true, maximumAge: 60000 }
      );
    } else {
      fallbackToIpGeolocation();
    }
  };

  const fallbackToIpGeolocation = () => {
    setLocationStatusMessage(
      lang === 'te'
        ? 'నెట్‌వర్క్ IP ద్వారా స్థానాన్ని లెక్కిస్తోంది (ipapi.co)...'
        : lang === 'hi'
        ? 'नेटवर्क आईपी द्वारा स्थान का पता लगाया जा रहा है (ipapi.co)...'
        : 'Browser GPS blocked. Auto-detecting via network IP (ipapi.co)...'
    );

    // Primary fallback: ipapi.co -> secondary: ipwho.is -> default
    fetch('https://ipapi.co/json/')
      .then((res) => {
        if (!res.ok) throw new Error('IP API error');
        return res.json();
      })
      .then((data) => {
        const rawLat = data.latitude;
        const rawLng = data.longitude;
        const lat = typeof rawLat === 'string' ? parseFloat(rawLat) : Number(rawLat);
        const lng = typeof rawLng === 'string' ? parseFloat(rawLng) : Number(rawLng);

        if (!isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
          const coords: [number, number] = [lat, lng];
          setFarmerCoords(coords);
          setAccuracyMeters(2000); // Approximate IP accuracy
          setGpsStatus('SUCCESS');
          const detectedRegion = getClosestRegion(coords);
          const localCentres = initialCentres.filter((c) => c.region === detectedRegion);
          if (localCentres.length > 0) {
            const green = localCentres.find((c) => c.status === 'GREEN' && !c.emergencyFull);
            setSelectedCentreId(green ? green.id : localCentres[0].id);
          }
          setLocationStatusMessage(
            `🌐 Network Located: ${data.city || 'AP Agro Belt'} [${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}]`
          );
        } else {
          fallbackToSecondaryIpApi();
        }
      })
      .catch(() => {
        fallbackToSecondaryIpApi();
      });
  };

  const fallbackToSecondaryIpApi = () => {
    fetch('https://ipwho.is/')
      .then((res) => {
        if (!res.ok) throw new Error('ipwho error');
        return res.json();
      })
      .then((data) => {
        if (data && data.success && data.latitude && data.longitude) {
          const coords: [number, number] = [Number(data.latitude), Number(data.longitude)];
          setFarmerCoords(coords);
          setAccuracyMeters(2500);
          setGpsStatus('SUCCESS');
          const detectedRegion = getClosestRegion(coords);
          const localCentres = initialCentres.filter((c) => c.region === detectedRegion);
          if (localCentres.length > 0) {
            const green = localCentres.find((c) => c.status === 'GREEN' && !c.emergencyFull);
            setSelectedCentreId(green ? green.id : localCentres[0].id);
          }
          setLocationStatusMessage(
            `🌐 Network Located: ${data.city || 'AP Agro Belt'} [${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}]`
          );
        } else {
          fallbackToDefaultRajahmundry();
        }
      })
      .catch(() => {
        fallbackToDefaultRajahmundry();
      });
  };

  const fallbackToDefaultRajahmundry = () => {
    setFarmerCoords(RAJAHMUNDRY_DEFAULT_COORDS);
    setAccuracyMeters(null);
    setGpsStatus('IDLE');
    setLocationStatusMessage(
      lang === 'te'
        ? '📍 డిఫాల్ట్ ప్రాంతం: రాజమహేంద్రవరం (తూర్పు గోదావరి) · మాన్యువల్ పిన్ యాక్టివ్'
        : lang === 'hi'
        ? '📍 डिफ़ॉल्ट क्षेत्र: राजमहेंद्रवरम (पूर्वी गोदावरी) · पिन खींचकर स्थान चुनें'
        : '📍 Default Region: Rajahmundry (East Godavari) · Drag pin or click map to adjust'
    );
    const localCentres = initialCentres.filter((c) => c.region === 'rajahmundry');
    if (localCentres.length > 0) {
      const green = localCentres.find((c) => c.status === 'GREEN' && !c.emergencyFull);
      setSelectedCentreId(green ? green.id : localCentres[0].id);
    }
  };

  // Run on mount
  useEffect(() => {
    acquireLocationWithIpFallback();
  }, []);

  // Quick City Click Handler
  const handleSelectQuickCity = (city: QuickCity) => {
    setFarmerCoords(city.coords);
    setLocationStatusMessage(`📍 Pinned: ${city.name} (${city.nameTe}) · Distances & Mandis Updated`);
    setSearchQuery('');

    // Dynamically auto-select the best depot in this city so the card & booking form immediately reflect the new city
    const localCentres = initialCentres.filter((c) => c.region === city.region);
    if (localCentres.length > 0) {
      const green = localCentres.find((c) => c.status === 'GREEN' && !c.emergencyFull);
      setSelectedCentreId(green ? green.id : localCentres[0].id);
    }
  };

  // Search Input Handler (City / Mandal / Pincode)
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    // Check matching cities or aliases
    const matchedCity = QUICK_CITIES.find(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.nameTe.toLowerCase().includes(query) ||
        c.aliases.some((a) => query.includes(a) || a.includes(query))
    );

    if (matchedCity) {
      handleSelectQuickCity(matchedCity);
      return;
    }

    // Check mandal locations
    const matchedMandal = MANDAL_LOCATIONS.find(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.nameTe.toLowerCase().includes(query)
    );

    if (matchedMandal) {
      setFarmerCoords(matchedMandal.coords);
      const newRegion = getClosestRegion(matchedMandal.coords);
      const localCentres = initialCentres.filter((c) => c.region === newRegion);
      if (localCentres.length > 0) {
        const green = localCentres.find((c) => c.status === 'GREEN' && !c.emergencyFull);
        setSelectedCentreId(green ? green.id : localCentres[0].id);
      }
      setLocationStatusMessage(`📍 Farm Located: ${matchedMandal.name} [${matchedMandal.coords[0].toFixed(4)}, ${matchedMandal.coords[1].toFixed(4)}]`);
      setSearchQuery('');
      return;
    }

    // Pincode lookups
    if (query.startsWith('533')) {
      handleSelectQuickCity(QUICK_CITIES[0]); // Rajahmundry
      return;
    } else if (query.startsWith('517')) {
      handleSelectQuickCity(QUICK_CITIES[1]); // Tirupati
      return;
    } else if (query.startsWith('520')) {
      handleSelectQuickCity(QUICK_CITIES[2]); // Vijayawada
      return;
    } else if (query.startsWith('522')) {
      handleSelectQuickCity(QUICK_CITIES[3]); // Guntur
      return;
    }

    // Check if coordinates were entered (e.g. "17.0005, 81.8040")
    const coordParts = query.split(',').map((p) => parseFloat(p.trim()));
    if (coordParts.length === 2 && !isNaN(coordParts[0]) && !isNaN(coordParts[1])) {
      const customCoords: [number, number] = [coordParts[0], coordParts[1]];
      setFarmerCoords(customCoords);
      const newRegion = getClosestRegion(customCoords);
      const localCentres = initialCentres.filter((c) => c.region === newRegion);
      if (localCentres.length > 0) {
        setSelectedCentreId(localCentres[0].id);
      }
      setLocationStatusMessage(`📍 Custom Pin Position: [${customCoords[0].toFixed(4)}, ${customCoords[1].toFixed(4)}]`);
      setSearchQuery('');
      return;
    }

    // Default gentle feedback
    setLocationStatusMessage(`Search: "${searchQuery}" · Nearest mandis calculated`);
  };

  // Handle manual map drag/click coordinate update
  const handleUpdateFarmerCoords = (coords: [number, number]) => {
    setFarmerCoords(coords);
    setLocationStatusMessage(`📍 Farm Pin Positioned: [${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}]`);
  };

  // 3. Dynamic Procurement Centres based on Active City / Region
  const activeRegion = getClosestRegion(farmerCoords);

  // Auto-synchronize selectedCentreId if it belongs to another region and user moved regions
  useEffect(() => {
    const localCentres = initialCentres.filter((c) => c.region === activeRegion);
    if (localCentres.length > 0) {
      const belongsToRegion = localCentres.some((c) => c.id === selectedCentreId);
      if (!belongsToRegion) {
        const green = localCentres.find((c) => c.status === 'GREEN' && !c.emergencyFull);
        setSelectedCentreId(green ? green.id : localCentres[0].id);
      }
    }
  }, [activeRegion, initialCentres, selectedCentreId]);

  // Recalculate dynamic geodesic distances for all centres from current farmerCoords
  const centresWithDynamicDistance: ProcurementCentre[] = initialCentres.map((centre) => {
    const distanceKm = calculateDistanceKm(farmerCoords, centre.coords);
    return {
      ...centre,
      distanceKm,
    };
  });

  // Dynamic regional centres (Active City Mandis)
  const regionalCentres = centresWithDynamicDistance.filter((c) => c.region === activeRegion);
  const otherCentres = centresWithDynamicDistance.filter((c) => c.region !== activeRegion);
  
  // Base centres according to viewScope ('city' shows active city mandis, 'all' shows statewide)
  const baseCentres = viewScope === 'city'
    ? regionalCentres
    : [...regionalCentres, ...otherCentres].sort((a, b) => a.distanceKm - b.distanceKm);

  // Conversions
  const converted = convertUnits(quantityInput, selectedUnit);
  const commodity = COMMODITIES[selectedCrop] || COMMODITIES.paddy_grade_a;
  const estimatedPayout = calculateEstimatedPayout(selectedCrop, converted.qtl);

  // Filtered list for display & map
  const filteredCentres = baseCentres.filter((c) => {
    if (verifiedOnly && !c.govtVerified) return false;
    if (filterCrop !== 'all' && !c.acceptedCommodities.includes(filterCrop)) return false;
    return true;
  });

  // Active selected centre
  const selectedCentre =
    filteredCentres.find((c) => c.id === selectedCentreId) ||
    filteredCentres[0] ||
    regionalCentres[0] ||
    centresWithDynamicDistance[0];

  // Region Title for Header & Map Legend
  const regionTitles: Record<string, string> = {
    rajahmundry: 'Rajamahendravaram / East Godavari Mandis',
    tirupati: 'Tirupati & Rayalaseema PACS Mandis',
    vijayawada: 'Vijayawada / Krishna APMC Mandis',
    guntur: 'Guntur Central Mandi Yards',
  };

  // Handle Centre Selection with Congestion Heuristic Check
  const handleSelectCentre = (centre: ProcurementCentre) => {
    if (centre.status === 'RED' || centre.emergencyFull || centre.queueHours >= 4.0) {
      // Find optimal green or lower congestion centre in the same city region
      const optimal =
        regionalCentres.find(
          (c) => c.id !== centre.id && c.status === 'GREEN' && !c.emergencyFull
        ) ||
        regionalCentres.find(
          (c) => c.id !== centre.id && c.status !== 'RED'
        ) ||
        regionalCentres.find((c) => c.id !== centre.id) ||
        centresWithDynamicDistance.find((c) => c.id !== centre.id && c.status === 'GREEN');

      if (optimal && optimal.id !== centre.id) {
        const savedHours = Math.max(1, (centre.queueHours || 5) - (optimal.queueHours || 0.5));
        const savingsInr = Math.round(savedHours * 450);

        setRerouteAlert({
          show: true,
          congestedCentre: centre,
          recommendedCentre: optimal,
          savingsInr,
        });
        return;
      }
    }
    setSelectedCentreId(centre.id);
  };

  const handleConfirmReroute = () => {
    if (rerouteAlert) {
      setSelectedCentreId(rerouteAlert.recommendedCentre.id);
      setRerouteAlert(null);
    }
  };

  const handleDismissReroute = () => {
    if (rerouteAlert) {
      setSelectedCentreId(rerouteAlert.congestedCentre.id);
      setRerouteAlert(null);
    }
  };

  const slotOptions = [
    { window: '08:00 - 10:00 AM', remaining: 4, total: 10 },
    { window: '10:00 - 12:00 PM', remaining: 6, total: 10 },
    { window: '12:00 - 02:00 PM', remaining: 8, total: 10 },
    { window: '02:00 - 04:00 PM', remaining: 5, total: 10 },
    { window: '04:00 - 06:00 PM', remaining: 7, total: 10 },
  ];

  const handleBookNow = () => {
    const randomBayNum = Math.floor(Math.random() * (selectedCentre.baysCount || 4)) + 1;
    const regionCode = activeRegion.substring(0, 3).toUpperCase();
    const tokenRecord: BookingRecord = {
      id: `RM-${regionCode}-${selectedCrop === 'paddy_grade_a' || selectedCrop === 'paddy_common' ? 'PDY' : selectedCrop === 'maize' ? 'MZ' : 'BG'}-${Math.floor(100 + Math.random() * 900)}`,
      centreId: selectedCentre.id,
      centreName: selectedCentre.name,
      farmerId: farmerProfile.id,
      farmerName: farmerProfile.name,
      farmerPhone: farmerProfile.phone,
      village: `${farmerProfile.village}, ${activeRegion.toUpperCase()}`,
      khasraNumber: farmerProfile.khasraNumber,
      vehicleType: customVehicleType,
      vehicleNumber: customVehicleNumber,
      commodityId: selectedCrop,
      commodityName: commodity.name[lang] || commodity.name.en,
      inputQuantity: quantityInput,
      inputUnit: selectedUnit,
      quintals: converted.qtl,
      kg: converted.kg,
      metricTonnes: converted.ton,
      bags: converted.bag,
      maunds: converted.maund,
      estimatedPayoutInr: estimatedPayout,
      slotDate,
      slotTime,
      assignedBay: `Bay ${randomBayNum} (Weighbridge Scale)`,
      createdAt: new Date().toISOString(),
      status: 'BOOKED',
    };

    onBookPass(tokenRecord);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Visual Banner & Title */}
      <div className="relative rounded-3xl overflow-hidden bg-stone-900 text-white shadow-xl border border-stone-800">
        <div className="absolute inset-0 z-0 opacity-40 mix-blend-luminosity">
          <img
            src="/src/assets/images/farmgain_hero_depot_1791977338696.jpg"
            alt="Procurement depot weighbridge yard"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/95 via-stone-900/80 to-transparent z-0" />

        <div className="relative z-10 px-6 py-8 sm:px-10 sm:py-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3 border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Assisted Agricultural Procurement Discovery & Slot Gateway</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-2 font-sans">
            {t.farmerPortalTitle}
          </h1>
          <p className="text-stone-300 text-sm sm:text-base leading-relaxed mb-6">
            Locate authorized grain procurement centres with real-time wait times and guaranteed weighbridge bay slots.
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-stone-300">
            <span className="flex items-center gap-1.5 bg-stone-800/80 px-3 py-1.5 rounded-lg border border-stone-700">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Direct APMC & PACS Centres
            </span>
            <span className="flex items-center gap-1.5 bg-stone-800/80 px-3 py-1.5 rounded-lg border border-stone-700">
              <TrendingDown className="w-4 h-4 text-amber-400" />
              Dynamic Queue Spillover Protection
            </span>
            <span className="flex items-center gap-1.5 bg-stone-800/80 px-3 py-1.5 rounded-lg border border-stone-700">
              <Scale className="w-4 h-4 text-blue-400" />
              Calibrated Weighbridge Scales
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Farmer Profile + Multi-Unit Crop Declaration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Section 1: Farmer Profile & Rythu Bharosa Details (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
                {t.farmerLoginCard}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setProfileSwitchOpen(!profileSwitchOpen)}
              className="text-xs text-emerald-700 font-semibold hover:underline"
            >
              {profileSwitchOpen ? 'Close' : t.switchProfile}
            </button>
          </div>

          {/* Quick Profile Switcher Dropdown */}
          {profileSwitchOpen && (
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
              <span className="text-[11px] font-semibold text-stone-500 block">Select Demo Farmer Account:</span>
              {allProfiles.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onSelectProfile(p.id);
                    setCustomVehicleNumber(p.vehicleNumber);
                    setCustomVehicleType(p.vehicleType);
                    if (p.coords) {
                      setFarmerCoords(p.coords);
                    }
                    setProfileSwitchOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-xl text-xs transition-colors flex items-center justify-between ${
                    p.id === farmerProfile.id ? 'bg-emerald-700 text-white font-bold' : 'bg-white hover:bg-stone-100 text-stone-800'
                  }`}
                >
                  <div>
                    <span className="block">{p.name} ({p.village})</span>
                    <span className="text-[10px] opacity-75 font-mono">{p.vehicleType} · {p.vehicleNumber}</span>
                  </div>
                  {p.id === farmerProfile.id && <CheckCircle2 className="w-4 h-4" />}
                </button>
              ))}
            </div>
          )}

          {/* Verified Profile Card */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-base font-bold text-stone-900 block">{farmerProfile.name}</span>
                <span className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3" /> +91-{farmerProfile.phone}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Rythu Bharosa Verified
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200 text-xs">
              <div>
                <span className="text-[10px] text-stone-400 uppercase font-semibold block">{t.village}</span>
                <span className="font-medium text-stone-800">{farmerProfile.village}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 uppercase font-semibold block">{t.khasraNo}</span>
                <span className="font-mono font-semibold text-stone-800">{farmerProfile.khasraNumber}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-200 text-xs">
              <span className="text-[10px] text-stone-400 uppercase font-semibold block">{t.vehicleType}</span>
              <div className="flex items-center justify-between mt-1">
                <span className="font-semibold text-stone-800">{farmerProfile.vehicleType}</span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-stone-300 text-stone-700">
                  {farmerProfile.vehicleNumber}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Direct Benefit Transfer (DBT) linked to Aadhaar for instant grain payout.</span>
          </div>
        </div>

        {/* Section 2: Commodity & Dynamic Multi-Unit Converter (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
            <div>
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Scale className="w-5 h-5 text-emerald-700" />
                <span>{t.cropDeclaration}</span>
              </h2>
              <p className="text-xs text-stone-500">
                Calibrated multi-unit engine automatically synchronizes Bags, Quintals, Tonnes, and Maunds.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-stone-400 block">{t.officialMspRate}</span>
              <span className="text-sm font-bold font-mono text-emerald-800">
                ₹{commodity.mspPerQtl}/qtl (₹{commodity.mspPerKg}/kg)
              </span>
            </div>
          </div>

          {/* Crop Selector Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(Object.keys(COMMODITIES) as CommodityId[]).map((cid) => {
              const comm = COMMODITIES[cid];
              const isSelected = selectedCrop === cid;
              return (
                <button
                  key={cid}
                  type="button"
                  onClick={() => {
                    setSelectedCrop(cid);
                    setFilterCrop(cid);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all relative ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-600/20'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <span className="text-xl block mb-1">{comm.icon}</span>
                  <span className="text-xs font-bold text-stone-900 block leading-tight">
                    {comm.name[lang] || comm.name.en}
                  </span>
                  <span className="text-[11px] text-stone-500 font-mono mt-1 block">
                    MSP: ₹{comm.mspPerQtl}
                  </span>
                  <span className="text-[10px] text-stone-400 block mt-0.5">
                    Max Moisture: {comm.maxMoisture}%
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quantity Input + Unit Dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-6">
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                {t.enterQuantity}
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={quantityInput}
                onChange={(e) => setQuantityInput(Math.max(0, Number(e.target.value) || 0))}
                className="w-full h-12 px-4 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:border-emerald-600 focus:outline-none text-lg font-bold font-mono text-stone-900 shadow-xs"
              />
            </div>

            <div className="sm:col-span-6">
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                {t.selectUnit}
              </label>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value as UnitType)}
                className="w-full h-12 px-3 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:border-emerald-600 focus:outline-none text-sm font-semibold text-stone-800 shadow-xs"
              >
                <option value="bag">{UNIT_LABELS.bag[lang]} (50 kg)</option>
                <option value="qtl">{UNIT_LABELS.qtl[lang]} (100 kg)</option>
                <option value="ton">{UNIT_LABELS.ton[lang]} (1,000 kg)</option>
                <option value="kg">{UNIT_LABELS.kg[lang]} (1 kg)</option>
                <option value="maund">{UNIT_LABELS.maund[lang]} (40 kg)</option>
              </select>
            </div>
          </div>

          {/* Dynamic Multi-Unit Synchronized Converter Display */}
          <div className="p-4 rounded-2xl bg-stone-900 text-white shadow-inner space-y-3">
            <div className="flex items-center justify-between text-xs text-stone-400 border-b border-stone-800 pb-2">
              <span className="flex items-center gap-1.5 font-semibold text-stone-300">
                <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400" />
                {t.liveConversion}
              </span>
              <span>1 Qtl = 100 kg = 2 Bags (Kattalu) = 2.5 Maunds = 0.1 MT</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-stone-800/80 border border-stone-700">
                <span className="text-[10px] text-stone-400 block uppercase font-mono">Bags / Kattalu</span>
                <span className="text-lg font-extrabold font-mono text-amber-400">{converted.bag}</span>
                <span className="text-[10px] text-stone-400 block">50kg Jute Bori</span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-800/80 border border-stone-700">
                <span className="text-[10px] text-stone-400 block uppercase font-mono">Quintals (qtl)</span>
                <span className="text-lg font-extrabold font-mono text-emerald-400">{converted.qtl}</span>
                <span className="text-[10px] text-stone-400 block">MSP Basis</span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-800/80 border border-stone-700">
                <span className="text-[10px] text-stone-400 block uppercase font-mono">Tonnes (MT)</span>
                <span className="text-lg font-extrabold font-mono text-blue-400">{converted.ton}</span>
                <span className="text-[10px] text-stone-400 block">Metric Tonnes</span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-800/80 border border-stone-700">
                <span className="text-[10px] text-stone-400 block uppercase font-mono">Kilograms (kg)</span>
                <span className="text-lg font-extrabold font-mono text-stone-200">{converted.kg.toLocaleString()}</span>
                <span className="text-[10px] text-stone-400 block">Base Weight</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between pt-2 border-t border-stone-800 text-xs gap-2">
              <div className="text-stone-300">
                <span className="text-stone-400">Entered: </span>
                <strong className="text-white">{quantityInput} {UNIT_LABELS[selectedUnit].short}</strong>
                <span className="text-stone-400"> ➔ Equivalent to: </span>
                <strong className="text-emerald-400">{converted.maund} Maunds (Mann)</strong>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-stone-400 block">{t.estimatedPayout}</span>
                <span className="text-xl font-black font-mono text-emerald-400">
                  ₹{estimatedPayout.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Discovery & Map View with Location Search & Quick Picker Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Region: {activeRegion.toUpperCase()}
              </span>
              <span className="text-xs text-stone-500 font-mono">
                {regionalCentres.length} Local Mandis Active
              </span>
            </div>
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2 mt-1">
              <MapPin className="w-5 h-5 text-emerald-700" />
              <span>{t.discoveryTitle}</span>
            </h2>
          </div>

          {/* Map Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <select
                value={filterCrop}
                onChange={(e) => setFilterCrop(e.target.value as any)}
                className="text-xs font-semibold px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-stone-800"
              >
                <option value="all">{t.allCrops}</option>
                <option value="paddy_grade_a">Paddy (Grade A)</option>
                <option value="paddy_common">Paddy (Common)</option>
                <option value="maize">Maize (Makka)</option>
                <option value="black_gram">Black Gram (Urad)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              className={`text-xs font-semibold px-3 py-2 rounded-xl border flex items-center gap-1.5 transition-colors ${
                verifiedOnly
                  ? 'bg-blue-50 border-blue-300 text-blue-900'
                  : 'bg-stone-50 border-stone-200 text-stone-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>{t.verifiedOnly}</span>
            </button>
          </div>
        </div>

        {/* 2. PROMINENT LOCATION SEARCH & QUICK PICKER BAR */}
        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
          {/* Top Search Line */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Enter City, Mandal, or Pincode (e.g. Rajahmundry, Tirupati, Vijayawada, Guntur, 533101)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-stone-300 bg-white text-xs font-medium focus:outline-none focus:border-emerald-600 shadow-xs"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 px-3 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Search
              </button>
            </form>

            {/* Drag Pin Toggle */}
            <button
              type="button"
              onClick={() => setIsDragPinMode(!isDragPinMode)}
              className={`px-3 py-2 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors border shrink-0 ${
                isDragPinMode
                  ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5 text-amber-700" />
              <span>{isDragPinMode ? t.dragPinActive : t.dragPinMode}</span>
            </button>
          </div>

          {/* Quick Search Suggestions */}
          <div className="flex items-center gap-1.5 text-[11px] text-stone-500 overflow-x-auto pb-1">
            <span className="font-semibold text-stone-400 shrink-0">Try searching:</span>
            {['Rajahmundry', 'Kadiyam', 'Tirupati', 'Renigunta', 'Chandragiri', 'Vijayawada', 'Guntur', '533101', '517501'].map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => {
                  setSearchQuery(suggestion);
                  // Trigger search with this suggestion
                  const query = suggestion.trim().toLowerCase();
                  const matchedCity = QUICK_CITIES.find(
                    (c) =>
                      c.name.toLowerCase().includes(query) ||
                      c.aliases.some((a) => query.includes(a) || a.includes(query))
                  );
                  if (matchedCity) {
                    handleSelectQuickCity(matchedCity);
                    return;
                  }
                  const matchedMandal = MANDAL_LOCATIONS.find(
                    (m) => m.name.toLowerCase().includes(query) || m.nameTe.toLowerCase().includes(query)
                  );
                  if (matchedMandal) {
                    setFarmerCoords(matchedMandal.coords);
                    const newRegion = getClosestRegion(matchedMandal.coords);
                    const localCentres = initialCentres.filter((c) => c.region === newRegion);
                    if (localCentres.length > 0) {
                      const green = localCentres.find((c) => c.status === 'GREEN' && !c.emergencyFull);
                      setSelectedCentreId(green ? green.id : localCentres[0].id);
                    }
                    setLocationStatusMessage(`📍 Farm Located: ${matchedMandal.name}`);
                    setSearchQuery('');
                  }
                }}
                className="px-2 py-0.5 rounded-md bg-stone-200/70 hover:bg-stone-300 text-stone-700 font-medium whitespace-nowrap transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* Quick Location Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-stone-200/80">
            <span className="text-[11px] font-semibold text-stone-500 mr-1">Quick Agro Regions:</span>

            {/* My Current Location Trigger */}
            <button
              type="button"
              onClick={acquireLocationWithIpFallback}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                gpsStatus === 'SUCCESS'
                  ? 'bg-blue-600 text-white'
                  : gpsStatus === 'ACQUIRING'
                  ? 'bg-amber-500 text-white animate-pulse'
                  : 'bg-white hover:bg-stone-100 text-stone-800 border border-stone-300'
              }`}
              title="Use GPS or fallback to approximate network IP"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>📍 My Current Location</span>
            </button>

            {/* City Chips */}
            {QUICK_CITIES.map((c) => {
              const isActive = activeRegion === c.region;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelectQuickCity(c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                    isActive
                      ? 'bg-emerald-700 text-white border-emerald-700 font-bold shadow-xs ring-2 ring-emerald-500/30'
                      : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                  }`}
                >
                  <span>📍 {c.name}</span>
                  <span className="text-[10px] opacity-80 ml-1 font-normal">({c.nameTe})</span>
                </button>
              );
            })}
          </div>

          {/* Live Status readout */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-stone-500 pt-1 font-mono gap-1">
            <span className="flex items-center gap-1.5 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              {locationStatusMessage}
            </span>
            <span className="shrink-0 text-stone-500">
              Active Agro Zone: <strong className="text-emerald-800 uppercase font-bold">{activeRegion}</strong> ({regionTitles[activeRegion] || 'AP Mandis'})
            </span>
          </div>
        </div>

        {/* Leaflet Geospatial Map View */}
        <MapView
          farmerCoords={farmerCoords}
          onUpdateFarmerCoords={handleUpdateFarmerCoords}
          isDragPinMode={isDragPinMode}
          onToggleDragPinMode={() => setIsDragPinMode(!isDragPinMode)}
          centres={filteredCentres}
          selectedCentreId={selectedCentre.id}
          onSelectCentre={handleSelectCentre}
          radiusKm={radiusKm}
          highlightRerouteFromId={rerouteAlert ? rerouteAlert.congestedCentre.id : null}
          highlightRerouteToId={rerouteAlert ? rerouteAlert.recommendedCentre.id : null}
          locationStatusText={locationStatusMessage}
          regionTitle={regionTitles[activeRegion] || `${activeRegion.toUpperCase()} Mandis`}
          accuracyMeters={accuracyMeters}
          currentLang={lang}
          onRecenterGps={acquireLocationWithIpFallback}
          onSelectCity={handleSelectQuickCity}
        />

        {/* Procurement Centre Cards List with Live Calculated Geodesic Distances */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                Procurement Centres in {activeRegion.toUpperCase()} Zone:
              </span>
              <p className="text-[11px] text-stone-500">
                {regionTitles[activeRegion] || 'Regional AP Mandis'} · Distances calculated from your farm pin
              </p>
            </div>

            {/* Scope Filter: Active City vs All Mandis */}
            <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200">
              <button
                type="button"
                onClick={() => setViewScope('city')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  viewScope === 'city'
                    ? 'bg-white text-emerald-800 shadow-xs border border-stone-200'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                📍 {activeRegion.toUpperCase()} Mandis ({regionalCentres.length})
              </button>
              <button
                type="button"
                onClick={() => setViewScope('all')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  viewScope === 'all'
                    ? 'bg-white text-emerald-800 shadow-xs border border-stone-200'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                🌐 All State Mandis ({centresWithDynamicDistance.length})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredCentres.map((c) => {
              const isSelected = c.id === selectedCentre.id;
              const isRed = c.status === 'RED' || c.emergencyFull;
              const isYellow = c.status === 'YELLOW';

              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectCentre(c)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/40 shadow-md ring-2 ring-emerald-600/20'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  {/* Badge Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-stone-900 text-sm">{c.name}</h3>
                        {c.govtVerified ? (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 flex items-center gap-0.5">
                            <ShieldCheck className="w-3 h-3 text-blue-600" />
                            Govt. Verified
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Unverified
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">{c.address}</p>
                    </div>

                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 shrink-0 border border-emerald-300">
                      {c.distanceKm} km
                    </span>
                  </div>

                  {/* Queue & Capacity stats */}
                  <div className="space-y-2 py-2 border-y border-stone-100 my-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        {t.estWaitTime}:
                      </span>
                      <span className={`font-bold font-mono ${isRed ? 'text-red-600' : isYellow ? 'text-amber-600' : 'text-emerald-700'}`}>
                        {c.queueTimeStr} {isRed && '(Heavy Queue)'}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-stone-500">{t.depotCapacity}:</span>
                        <span className="font-mono font-bold text-stone-800">
                          {c.currentProcuredTonnes} / {c.dailyLimitTonnes} MT ({c.currentCapacityPct}%)
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isRed ? 'bg-red-600' : isYellow ? 'bg-amber-500' : 'bg-emerald-600'
                          }`}
                          style={{ width: `${Math.min(100, c.currentCapacityPct)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Accepted Crops & Selection indicator */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-stone-500 text-[11px]">
                      Region: <strong className="text-stone-700 capitalize">{c.region}</strong>
                    </span>
                    <span className={`text-[11px] font-bold ${isSelected ? 'text-emerald-700' : 'text-stone-400'}`}>
                      {isSelected ? '✓ ' + t.currentlySelected : t.selectAndBook}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Heuristic Rerouting Alert Modal */}
      {rerouteAlert && rerouteAlert.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-2xl space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {t.congestionWarning}
                </span>
                <span className="text-xs font-mono text-red-600 font-bold">
                  {rerouteAlert.congestedCentre.currentCapacityPct}% Saturation
                </span>
              </div>
              <h3 className="text-xl font-bold text-stone-900 mt-2">
                Heavy Waiting Queue at {rerouteAlert.congestedCentre.name}
              </h3>
              <p className="text-stone-600 text-sm mt-2 leading-relaxed">
                ⚠️ <strong>{rerouteAlert.congestedCentre.name}</strong> is operating near saturation (wait time {rerouteAlert.congestedCentre.queueTimeStr}). FarmGain recommends <strong>{rerouteAlert.recommendedCentre.name}</strong> ({rerouteAlert.recommendedCentre.distanceKm} km away, {rerouteAlert.recommendedCentre.currentCapacityPct}% capacity, wait: {rerouteAlert.recommendedCentre.queueTimeStr}).
              </p>
            </div>

            {/* Savings & Comparison Box */}
            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 text-sm font-bold">
                <TrendingDown className="w-4 h-4 text-emerald-700" />
                <span>Diverting saves approximately ₹{rerouteAlert.savingsInr.toLocaleString('en-IN')} in idle tractor hire charges.</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                  <span className="text-stone-500 block">Congested Facility</span>
                  <span className="text-base font-bold text-red-600 font-mono">
                    {rerouteAlert.congestedCentre.queueTimeStr} wait
                  </span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                  <span className="text-stone-500 block">Recommended Facility</span>
                  <span className="text-base font-bold text-emerald-700 font-mono">
                    {rerouteAlert.recommendedCentre.queueTimeStr} wait
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleConfirmReroute}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <span>{t.acceptReroute}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleDismissReroute}
                className="w-full sm:w-auto py-3 px-4 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold text-xs transition-colors"
              >
                {t.stayHere}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deterministic Slot Reservation & Vehicle Confirmation */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-stone-100">
          <div>
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-700" />
              <span>{t.slotReservation}</span>
            </h2>
            <p className="text-xs text-stone-500">
              Guaranteed lane entry for: <strong className="text-stone-800">{selectedCentre.name}</strong> ({selectedCentre.distanceKm} km from your farm)
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 self-start sm:self-auto">
            {selectedCentre.baysCount} Active Weighbridge Scales
          </span>
        </div>

        {/* Date Selector */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-2">
            {t.selectDate}
          </label>
          <div className="grid grid-cols-3 gap-3 max-w-md">
            {['Today (14 Oct)', 'Tomorrow (15 Oct)', '16 Oct (Harvest Peak)'].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setSlotDate(d)}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-colors ${
                  slotDate === d
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Time Window Slots with Live Quota Tracker */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-2">
            {t.selectTimeWindow} (Live Quota Tracker)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {slotOptions.map((opt) => {
              const isSelected = slotTime === opt.window;
              const isAlmostFull = opt.remaining <= 3;

              return (
                <button
                  key={opt.window}
                  type="button"
                  onClick={() => setSlotTime(opt.window)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50 shadow-xs ring-2 ring-emerald-600/20'
                      : 'border-stone-200 bg-stone-50 hover:bg-stone-100'
                  }`}
                >
                  <span className="text-xs font-bold text-stone-900 block font-mono">{opt.window}</span>
                  <div className="flex items-center justify-between mt-2 text-[11px]">
                    <span className={`${isAlmostFull ? 'text-amber-600 font-bold' : 'text-stone-500'}`}>
                      {opt.remaining} of {opt.total} slots left
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Vehicle Registration & Dispatch Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Transport Vehicle Type
            </label>
            <select
              value={customVehicleType}
              onChange={(e) => setCustomVehicleType(e.target.value as VehicleType)}
              className="w-full h-11 px-3 rounded-xl border border-stone-300 bg-stone-50 text-xs font-semibold text-stone-800"
            >
              <option value="Tractor-Trolley">Tractor-Trolley (Standard 10-Tonne Hook)</option>
              <option value="Mini-Truck">Mini-Truck (Tata Ace / Mahindra Bolero Maxi)</option>
              <option value="Pickup Van">Pickup Van (2-Tonne)</option>
              <option value="Auto-Trolley">Auto-Trolley (Local Rural Access)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Vehicle License / Registration Number
            </label>
            <input
              type="text"
              value={customVehicleNumber}
              onChange={(e) => setCustomVehicleNumber(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-stone-300 bg-stone-50 text-xs font-mono font-bold text-stone-900 uppercase"
            />
          </div>
        </div>

        {/* Booking Summary Strip & Submit Button */}
        <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Booking Summary:
              </span>
              <span className="text-xs text-stone-600">
                {quantityInput} {selectedUnit} ({converted.qtl} Qtl) {commodity.name[lang] || commodity.name.en}
              </span>
            </div>
            <p className="text-xs text-stone-500">
              At <strong>{selectedCentre.name}</strong> on <strong>{slotDate}</strong> ({slotTime})
            </p>
          </div>

          <button
            type="button"
            onClick={handleBookNow}
            className="w-full md:w-auto px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>{t.confirmBookingBtn}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
