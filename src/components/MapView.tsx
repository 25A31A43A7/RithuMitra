import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ProcurementCentre, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';

export interface QuickCityItem {
  id: string;
  name: string;
  nameTe: string;
  nameHi: string;
  region: 'rajahmundry' | 'tirupati' | 'vijayawada' | 'guntur';
  coords: [number, number];
  zoneLabel: string;
  zoneLabelTe: string;
  aliases: string[];
}

export const QUICK_CITIES: QuickCityItem[] = [
  {
    id: 'rajahmundry',
    name: 'Rajahmundry',
    nameTe: 'రాజమండ్రి',
    nameHi: 'राजमुंदरी',
    region: 'rajahmundry',
    coords: [17.0005, 81.804],
    zoneLabel: 'East Godavari',
    zoneLabelTe: 'తూర్పు గోదావరి',
    aliases: ['kadiyam', 'godavari', 'east godavari', 'kakinada', 'rajamahindravaram', '533101', '533102', '533103'],
  },
  {
    id: 'tirupati',
    name: 'Tirupati',
    nameTe: 'తిరుపతి',
    nameHi: 'तिरुपति',
    region: 'tirupati',
    coords: [13.6288, 79.4192],
    zoneLabel: 'Rayalaseema',
    zoneLabelTe: 'రాయలసీమ',
    aliases: ['chandragiri', 'renigunta', 'chittoor', 'rayalaseema', 'tirumala', '517501', '517502', '517507'],
  },
  {
    id: 'vijayawada',
    name: 'Vijayawada',
    nameTe: 'విజయవాడ',
    nameHi: 'विजयवाड़ा',
    region: 'vijayawada',
    coords: [16.5062, 80.648],
    zoneLabel: 'Krishna Delta',
    zoneLabelTe: 'కృష్ణా డెల్టా',
    aliases: ['gannavaram', 'krishna', 'amaravati', 'benz circle', '520001', '520002', '520010'],
  },
  {
    id: 'guntur',
    name: 'Guntur',
    nameTe: 'గుంటూరు',
    nameHi: 'गुंटूर',
    region: 'guntur',
    coords: [16.3067, 80.4365],
    zoneLabel: 'Mirchi Hub',
    zoneLabelTe: 'మిర్చి యార్డ్',
    aliases: ['tenali', 'mangalagiri', 'mirchi yard', 'nallapadu', 'bapatla', '522001', '522002', '522004'],
  },
];

export const MANDALS_LIST = [
  { name: 'Kadiyam', nameTe: 'కడియం', coords: [16.9167, 81.8333] as [number, number] },
  { name: 'Rajahmundry Rural', nameTe: 'రాజమండ్రి రూరల్', coords: [17.02, 81.79] as [number, number] },
  { name: 'Korukonda', nameTe: 'కోరుకొండ', coords: [17.1667, 81.8333] as [number, number] },
  { name: 'Anaparthi', nameTe: 'అనపర్తి', coords: [16.9333, 81.95] as [number, number] },
  { name: 'Chandragiri', nameTe: 'చంద్రగిరి', coords: [13.5833, 79.3167] as [number, number] },
  { name: 'Renigunta', nameTe: 'రేణిగుంట', coords: [13.65, 79.5167] as [number, number] },
  { name: 'Yerpedu', nameTe: 'ఏర్పేడు', coords: [13.6833, 79.6] as [number, number] },
  { name: 'Gannavaram', nameTe: 'గన్నవరం', coords: [16.5417, 80.8] as [number, number] },
  { name: 'Kankipadu', nameTe: 'కంకిపాడు', coords: [16.4167, 80.75] as [number, number] },
  { name: 'Mangalagiri', nameTe: 'మంగళగిరి', coords: [16.4333, 80.5667] as [number, number] },
  { name: 'Tenali', nameTe: 'తెనాలి', coords: [16.243, 80.64] as [number, number] },
  { name: 'Tadikonda', nameTe: 'తాడికొండ', coords: [16.4167, 80.45] as [number, number] },
];

interface MapViewProps {
  farmerCoords: [number, number];
  onUpdateFarmerCoords: (coords: [number, number]) => void;
  isDragPinMode: boolean;
  onToggleDragPinMode?: () => void;
  centres: ProcurementCentre[];
  selectedCentreId: string | null;
  onSelectCentre: (centre: ProcurementCentre) => void;
  radiusKm: number;
  highlightRerouteFromId?: string | null;
  highlightRerouteToId?: string | null;
  locationStatusText?: string;
  regionTitle?: string;
  accuracyMeters?: number | null;
  currentLang?: Language;
  onRecenterGps?: () => void;
  onSelectCity?: (city: QuickCityItem) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  farmerCoords,
  onUpdateFarmerCoords,
  isDragPinMode,
  onToggleDragPinMode,
  centres,
  selectedCentreId,
  onSelectCentre,
  radiusKm,
  highlightRerouteFromId,
  highlightRerouteToId,
  locationStatusText,
  regionTitle,
  accuracyMeters,
  currentLang = 'en',
  onRecenterGps,
  onSelectCity,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const farmerMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const reroutePolylineRef = useRef<L.Polyline | null>(null);

  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [internalLocationStatus, setInternalLocationStatus] = useState<string | null>(null);
  const [internalAccuracy, setInternalAccuracy] = useState<number | null>(accuracyMeters ?? null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  // Sync internal accuracy if parent prop updates
  useEffect(() => {
    if (accuracyMeters !== undefined) {
      setInternalAccuracy(accuracyMeters);
    }
  }, [accuracyMeters]);

  // Determine which quick city is closest to farmerCoords
  const activeClosestCity = React.useMemo(() => {
    let minD = Infinity;
    let closest = QUICK_CITIES[0];
    for (const c of QUICK_CITIES) {
      const d = Math.hypot(farmerCoords[0] - c.coords[0], farmerCoords[1] - c.coords[1]);
      if (d < minD) {
        minD = d;
        closest = c;
      }
    }
    return closest;
  }, [farmerCoords]);

  // Robust location strategy:
  // 1. First attempt navigator.geolocation.getCurrentPosition
  // 2. If it fails or returns PERMISSION_DENIED, automatically trigger a fallback fetch from https://ipapi.co/json/
  // 3. Retrieve approximate coordinates and consistently center the map on the user's location
  const executeLocationStrategy = () => {
    setIsLocating(true);
    setInternalLocationStatus(
      currentLang === 'te'
        ? 'GPS ద్వారా ఖచ్చితమైన స్థానాన్ని గుర్తిస్తోంది...'
        : currentLang === 'hi'
        ? 'जीपीएस द्वारा सटीक स्थान प्राप्त किया जा रहा है...'
        : 'Acquiring GPS location...'
    );

    const fallbackToIpApi = async (reason?: string) => {
      setInternalLocationStatus(
        currentLang === 'te'
          ? 'నెట్‌వర్క్ IP ద్వారా స్థానాన్ని పొందుతోంది (ipapi.co)...'
          : currentLang === 'hi'
          ? 'नेटवर्क आईपी द्वारा स्थान प्राप्त किया जा रहा है (ipapi.co)...'
          : 'GPS unavailable. Falling back to IP location (ipapi.co)...'
      );

      try {
        const res = await fetch('https://ipapi.co/json/');
        if (!res.ok) throw new Error(`ipapi.co HTTP ${res.status}`);
        const data = await res.json();

        const rawLat = data.latitude;
        const rawLng = data.longitude;
        const lat = typeof rawLat === 'string' ? parseFloat(rawLat) : Number(rawLat);
        const lng = typeof rawLng === 'string' ? parseFloat(rawLng) : Number(rawLng);

        if (!isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
          const ipCoords: [number, number] = [lat, lng];
          onUpdateFarmerCoords(ipCoords);
          setInternalAccuracy(2500); // Approximate IP accuracy
          const locName = data.city ? `${data.city}${data.region ? `, ${data.region}` : ''}` : 'Network Location';
          setInternalLocationStatus(
            currentLang === 'te'
              ? `నెట్‌వర్క్ స్థానం: ${locName}`
              : currentLang === 'hi'
              ? `नेटवर्क स्थान: ${locName}`
              : `📍 IP Location: ${locName}`
          );

          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo(ipCoords, 14, {
              animate: true,
              duration: 1.0,
            });
          }
          return;
        }
        throw new Error('Invalid coordinates received from ipapi.co');
      } catch (ipErr) {
        console.warn('Fallback fetch from https://ipapi.co/json/ failed, trying auxiliary lookup:', ipErr);
        try {
          const altRes = await fetch('https://ipwho.is/');
          if (altRes.ok) {
            const altData = await altRes.json();
            if (altData && altData.success && altData.latitude && altData.longitude) {
              const altCoords: [number, number] = [Number(altData.latitude), Number(altData.longitude)];
              onUpdateFarmerCoords(altCoords);
              setInternalAccuracy(2500);
              if (mapInstanceRef.current) {
                mapInstanceRef.current.flyTo(altCoords, 14, { animate: true, duration: 1.0 });
              }
              return;
            }
          }
        } catch (altErr) {
          console.warn('Auxiliary IP lookup failed:', altErr);
        }

        setInternalLocationStatus(
          currentLang === 'te'
            ? 'డిఫాల్ట్ ప్రాంతం లోడ్ అయింది (తూర్పు గోదావరి)'
            : currentLang === 'hi'
            ? 'डिफ़ॉल्ट क्षेत्र लोड हुआ (पूर्वी गोदावरी)'
            : 'Default region loaded. Tap pin to reposition.'
        );
      } finally {
        setIsLocating(false);
      }
    };

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const gpsCoords: [number, number] = [latitude, longitude];
          onUpdateFarmerCoords(gpsCoords);
          const acc = accuracy ? Math.round(accuracy) : 35;
          setInternalAccuracy(acc);
          setInternalLocationStatus(
            currentLang === 'te'
              ? `ఖచ్చితమైన GPS స్థానం (±${acc}m)`
              : currentLang === 'hi'
              ? `सटीक जीपीएस स्थान (±${acc}m)`
              : `🎯 GPS Live (±${acc}m)`
          );
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo(gpsCoords, 16, {
              animate: true,
              duration: 1.1,
            });
          }
          setIsLocating(false);
        },
        (error) => {
          console.warn(
            `navigator.geolocation failed or PERMISSION_DENIED (code: ${error.code}). Triggering fallback fetch from https://ipapi.co/json/...`
          );
          fallbackToIpApi(error.code === 1 ? 'PERMISSION_DENIED' : error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 6000,
          maximumAge: 60000,
        }
      );
    } else {
      fallbackToIpApi('Geolocation API unsupported');
    }
  };

  // Quick City Chip Click handler
  const handleCityChipClick = (city: QuickCityItem) => {
    const feedback =
      currentLang === 'te'
        ? `${city.nameTe}కి మ్యాప్ రీసెంటర్ చేయబడింది`
        : currentLang === 'hi'
        ? `${city.nameHi} पर केंद्रित किया गया`
        : `Centered: ${city.name}`;
    setSearchFeedback(feedback);

    onUpdateFarmerCoords(city.coords);
    if (onSelectCity) {
      onSelectCity(city);
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(city.coords, 14, {
        animate: true,
        duration: 1.0,
      });
    }

    setTimeout(() => setSearchFeedback(null), 4000);
  };

  // Search Submit Handler (City, Mandal, Pincode, or Coords)
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;

    // 1. Check quick cities or their aliases
    const matchedCity = QUICK_CITIES.find(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.nameTe.toLowerCase().includes(q) ||
        c.nameHi.toLowerCase().includes(q) ||
        c.aliases.some((a) => q.includes(a) || a.includes(q))
    );

    if (matchedCity) {
      handleCityChipClick(matchedCity);
      setSearchQuery('');
      return;
    }

    // 2. Check mandals
    const matchedMandal = MANDALS_LIST.find(
      (m) => m.name.toLowerCase().includes(q) || m.nameTe.toLowerCase().includes(q)
    );

    if (matchedMandal) {
      onUpdateFarmerCoords(matchedMandal.coords);
      setSearchFeedback(`📍 ${matchedMandal.name} (${matchedMandal.nameTe})`);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo(matchedMandal.coords, 15, { animate: true, duration: 1.0 });
      }
      setSearchQuery('');
      setTimeout(() => setSearchFeedback(null), 4000);
      return;
    }

    // 3. Pincodes
    if (q.startsWith('533')) {
      handleCityChipClick(QUICK_CITIES[0]); // Rajahmundry
      setSearchQuery('');
      return;
    } else if (q.startsWith('517')) {
      handleCityChipClick(QUICK_CITIES[1]); // Tirupati
      setSearchQuery('');
      return;
    } else if (q.startsWith('520')) {
      handleCityChipClick(QUICK_CITIES[2]); // Vijayawada
      setSearchQuery('');
      return;
    } else if (q.startsWith('522')) {
      handleCityChipClick(QUICK_CITIES[3]); // Guntur
      setSearchQuery('');
      return;
    }

    // 4. Coordinates format "lat, lng"
    const parts = q.split(',').map((p) => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const customCoords: [number, number] = [parts[0], parts[1]];
      onUpdateFarmerCoords(customCoords);
      setSearchFeedback(`📍 [${customCoords[0].toFixed(4)}, ${customCoords[1].toFixed(4)}]`);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo(customCoords, 15, { animate: true, duration: 1.0 });
      }
      setSearchQuery('');
      setTimeout(() => setSearchFeedback(null), 4000);
      return;
    }

    // Friendly fallback
    setSearchFeedback(`Search: "${searchQuery}"`);
    setTimeout(() => setSearchFeedback(null), 4000);
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize at street level (zoom 15) centered directly on farmerCoords
      const map = L.map(mapContainerRef.current, {
        center: farmerCoords,
        zoom: 15,
        zoomControl: false,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Handle map click to reposition farm pin
      map.on('click', (e: L.LeafletMouseEvent) => {
        onUpdateFarmerCoords([e.latlng.lat, e.latlng.lng]);
      });

      mapInstanceRef.current = map;

      // Invalidate size to ensure proper tiling in container
      setTimeout(() => {
        map.invalidateSize();
      }, 250);

      // Automatically trigger robust location strategy on map mount
      executeLocationStrategy();
    }
  }, []);

  // Update Farmer Pin, Accuracy Circle, Radius Circle & Map Viewport when farmerCoords or isDragPinMode change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Smoothly fly map to farmer coords at street level
    const targetZoom = Math.max(map.getZoom(), 14);
    map.flyTo(farmerCoords, targetZoom, {
      animate: true,
      duration: 0.9,
      easeLinearity: 0.25,
    });

    setTimeout(() => {
      map.invalidateSize();
    }, 300);

    // Remove old farmer marker
    if (farmerMarkerRef.current) {
      farmerMarkerRef.current.remove();
    }

    const pinStatusLabel = isDragPinMode
      ? (currentLang === 'te' ? '👇 పిన్ లాగండి / క్లిక్ చేయండి' : currentLang === 'hi' ? '👇 पिन खींचें / क्लिक करें' : '👇 Drag Pin / Click Map')
      : (currentLang === 'te' ? '🌾 మీ ఖచ్చితమైన స్థానం' : currentLang === 'hi' ? '🌾 आपका सटीक स्थान' : '🌾 Your Exact Location');

    const farmerIconHtml = `
      <div class="relative flex flex-col items-center cursor-grab active:cursor-grabbing group">
        <div class="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-blue-600 text-white shadow-2xl border-2 border-white ring-4 ${
          isDragPinMode ? 'ring-amber-400 animate-bounce' : 'ring-blue-400/50'
        } transition-transform">
          <span class="text-xl">📍</span>
          <span class="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full animate-ping"></span>
        </div>
        <div class="mt-1 whitespace-nowrap bg-blue-950/95 text-[11px] text-white font-bold px-2.5 py-1 rounded-lg shadow-lg border border-blue-400/40">
          ${pinStatusLabel}
        </div>
      </div>
    `;

    const farmerIcon = L.divIcon({
      className: 'custom-farmer-pin',
      html: farmerIconHtml,
      iconSize: [46, 62],
      iconAnchor: [23, 56],
    });

    const marker = L.marker(farmerCoords, {
      icon: farmerIcon,
      draggable: true,
    }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      onUpdateFarmerCoords([pos.lat, pos.lng]);
    });

    const popupTitle = currentLang === 'te' ? '📍 మీ ఖచ్చితమైన వ్యవసాయ స్థానం' : currentLang === 'hi' ? '📍 आपका सटीक खेत स्थान' : '📍 Your Accurate Farm Location';
    const popupHelp = currentLang === 'te'
      ? 'పిన్‌ను లాగండి లేదా మార్చడానికి మ్యాప్‌పై ఎక్కడైనా క్లిక్ చేయండి.'
      : currentLang === 'hi'
      ? 'स्थान बदलने के लिए पिन खींचें या मानचित्र पर कहीं भी क्लिक करें।'
      : 'Drag this marker or click anywhere on the map to accurately reposition.';

    const displayAccuracy = internalAccuracy ?? accuracyMeters;

    marker.bindPopup(`
      <div class="p-2 text-xs font-sans">
        <p class="font-bold text-blue-950 text-sm">${popupTitle}</p>
        <p class="text-stone-600 mt-0.5 font-mono">GPS: [${farmerCoords[0].toFixed(5)}, ${farmerCoords[1].toFixed(5)}]</p>
        ${
          displayAccuracy
            ? `<div class="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[10px] border border-blue-200">
                <span>🎯</span>
                <span>${t.gpsAccuracyLabel || 'GPS Accuracy'}: ±${Math.round(displayAccuracy)}m</span>
              </div>`
            : ''
        }
        <p class="text-emerald-700 font-medium text-[11px] mt-1.5">
          ${popupHelp}
        </p>
      </div>
    `);

    farmerMarkerRef.current = marker;

    // Render GPS Accuracy Circle
    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.remove();
      accuracyCircleRef.current = null;
    }

    const radiusMeters = displayAccuracy ? Math.max(displayAccuracy, 25) : 40;
    accuracyCircleRef.current = L.circle(farmerCoords, {
      radius: radiusMeters,
      color: '#2563eb',
      fillColor: '#3b82f6',
      fillOpacity: 0.16,
      weight: 1.5,
      dashArray: '3, 4',
    }).addTo(map);

    // Update Radius Circle (Green Mandi Filter Radius)
    if (radiusCircleRef.current) {
      radiusCircleRef.current.remove();
    }
    radiusCircleRef.current = L.circle(farmerCoords, {
      radius: radiusKm * 1000,
      color: '#15803d',
      fillColor: '#22c55e',
      fillOpacity: 0.04,
      weight: 1.5,
      dashArray: '6, 8',
    }).addTo(map);
  }, [farmerCoords, isDragPinMode, radiusKm, internalAccuracy, accuracyMeters, currentLang, onUpdateFarmerCoords]);

  // Update Centre Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old centre markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    centres.forEach((centre) => {
      const isSelected = centre.id === selectedCentreId;
      const isRed = centre.status === 'RED' || centre.emergencyFull;
      const isYellow = centre.status === 'YELLOW';

      let bgClass = 'bg-emerald-600';
      let borderClass = 'border-emerald-200';
      let glowClass = '';

      if (isRed) {
        bgClass = 'bg-red-600';
        borderClass = 'border-red-200';
        glowClass = 'animate-pulse';
      } else if (isYellow) {
        bgClass = 'bg-amber-500';
        borderClass = 'border-amber-200';
      }

      const shieldBadgeHtml = centre.govtVerified
        ? `<div class="absolute -top-1 -right-1 bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] shadow" title="Govt. Verified">🛡️</div>`
        : `<div class="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] shadow" title="Pending Verification">⚠️</div>`;

      const displayName = currentLang === 'te' ? centre.nameTe : currentLang === 'hi' ? centre.nameHi : centre.name;

      const iconHtml = `
        <div class="relative flex flex-col items-center cursor-pointer group">
          <div class="w-10 h-10 rounded-xl ${bgClass} text-white flex items-center justify-center shadow-md border-2 ${
            isSelected ? 'border-amber-400 scale-110 ring-4 ring-amber-400/30' : borderClass
          } ${glowClass} transition-transform">
            <span class="text-sm font-bold font-mono">${centre.currentCapacityPct}%</span>
            ${shieldBadgeHtml}
          </div>
          <div class="mt-1 bg-stone-900/90 text-white text-[10px] font-medium px-2 py-0.5 rounded shadow whitespace-nowrap">
            ${centre.distanceKm} km · ${centre.queueTimeStr}
          </div>
        </div>
      `;

      const centreIcon = L.divIcon({
        className: 'custom-centre-pin',
        html: iconHtml,
        iconSize: [40, 56],
        iconAnchor: [20, 28],
      });

      const marker = L.marker(centre.coords, { icon: centreIcon }).addTo(map);

      marker.on('click', () => {
        onSelectCentre(centre);
        // Smoothly pan camera to show both farmer and selected depot
        if (mapInstanceRef.current) {
          const bounds = L.latLngBounds([farmerCoords, centre.coords]);
          mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
        }
      });

      const popupHtml = `
        <div class="p-2 min-w-[220px] text-xs font-sans">
          <div class="flex items-center gap-1.5 mb-1">
            <span class="font-bold text-stone-900 text-sm">${displayName}</span>
            ${
              centre.govtVerified
                ? '<span class="text-blue-600 font-semibold text-[10px]">🛡️ Verified</span>'
                : '<span class="text-amber-600 text-[10px]">⚠️ Unverified</span>'
            }
          </div>
          <p class="text-stone-600 mb-2">${centre.address}</p>
          <div class="grid grid-cols-2 gap-1.5 py-1.5 border-y border-stone-200 text-stone-700">
            <div>
              <span class="text-[10px] text-stone-400 block">${t.estWaitTime || 'Queue Wait'}</span>
              <span class="font-semibold ${isRed ? 'text-red-600' : 'text-stone-800'}">${centre.queueTimeStr}</span>
            </div>
            <div>
              <span class="text-[10px] text-stone-400 block">Distance</span>
              <span class="font-semibold font-mono text-emerald-800">${centre.distanceKm} km</span>
            </div>
          </div>
          <div class="mt-2 text-[11px] text-stone-600">
            <span>Capacity: </span>
            <strong class="text-stone-800">${centre.currentProcuredTonnes} / ${centre.dailyLimitTonnes} MT (${centre.currentCapacityPct}%)</strong>
          </div>
        </div>
      `;
      marker.bindPopup(popupHtml);

      markersRef.current[centre.id] = marker;
    });

    // Render Reroute Polyline
    if (reroutePolylineRef.current) {
      reroutePolylineRef.current.remove();
      reroutePolylineRef.current = null;
    }

    if (highlightRerouteFromId && highlightRerouteToId) {
      const fromCentre = centres.find((c) => c.id === highlightRerouteFromId);
      const toCentre = centres.find((c) => c.id === highlightRerouteToId);
      if (fromCentre && toCentre) {
        reroutePolylineRef.current = L.polyline(
          [farmerCoords, fromCentre.coords, toCentre.coords],
          {
            color: '#15803d',
            weight: 3.5,
            dashArray: '6, 8',
            opacity: 0.9,
          }
        ).addTo(map);
      }
    }
  }, [centres, selectedCentreId, farmerCoords, highlightRerouteFromId, highlightRerouteToId, currentLang, onSelectCentre, t]);

  // Map Controls Handlers
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const handleFitAllBounds = () => {
    if (mapInstanceRef.current && centres.length > 0) {
      const allPoints: [number, number][] = [farmerCoords, ...centres.map((c) => c.coords)];
      const bounds = L.latLngBounds(allPoints);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  const activeStatusText = internalLocationStatus || locationStatusText;
  const activeAccuracy = internalAccuracy ?? accuracyMeters;

  return (
    <div className="relative w-full h-[540px] sm:h-[580px] rounded-3xl overflow-hidden border border-stone-200 shadow-sm bg-stone-100">
      {/* Leaflet Map Surface */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Navigation Control Bar across the top of Map Component */}
      <div className="absolute top-3 inset-x-2.5 sm:inset-x-4 z-[410] pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-stone-200/90 shadow-xl p-2.5 sm:p-3 space-y-2">
          {/* Row 1: Search Input for Cities/Mandals + Use Live GPS Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
              <span className="absolute left-3 top-2.5 text-stone-400 text-xs select-none">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  t.searchCityOrMandalPlaceholder ||
                  'Search City, Mandal, or Pincode (e.g. Rajahmundry, Tirupati, Vijayawada, Guntur)...'
                }
                className="w-full pl-8 pr-20 py-2 rounded-xl border border-stone-300 bg-white text-xs font-medium focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-stone-800 placeholder:text-stone-400 shadow-xs"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 px-3 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                {t.searchBtn || 'Search'}
              </button>
            </form>

            {/* 'Use Live GPS' Button */}
            <button
              type="button"
              onClick={() => {
                executeLocationStrategy();
                if (onRecenterGps) onRecenterGps();
              }}
              disabled={isLocating}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0 border ${
                isLocating
                  ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700 ring-2 ring-blue-500/20'
              }`}
              title={t.useLiveGpsBtn || 'Use Live GPS'}
            >
              <span className="text-xs">{isLocating ? '⏳' : '📍'}</span>
              <span className="whitespace-nowrap">
                {isLocating
                  ? (currentLang === 'te' ? 'గుర్తిస్తోంది...' : currentLang === 'hi' ? 'खोज रहे हैं...' : 'Acquiring GPS...')
                  : (t.useLiveGpsBtn || 'Use Live GPS')}
              </span>
            </button>
          </div>

          {/* Row 2: Quick-Location Chips (Rajahmundry, Tirupati, Vijayawada, Guntur) */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-stone-200/80">
            <span className="text-[11px] font-bold text-stone-600 mr-1 flex items-center gap-1 shrink-0">
              <span>🧭</span>
              <span>{t.quickLocationsLabel || 'Quick Locations:'}</span>
            </span>

            {QUICK_CITIES.map((city) => {
              const isActive = activeClosestCity.id === city.id;
              const displayName = currentLang === 'te' ? city.nameTe : currentLang === 'hi' ? city.nameHi : city.name;
              const subLabel = currentLang === 'te' ? city.zoneLabelTe : city.zoneLabel;

              return (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => handleCityChipClick(city)}
                  className={`px-2.5 py-1 rounded-xl text-xs transition-all border cursor-pointer flex items-center gap-1 ${
                    isActive
                      ? 'bg-emerald-700 text-white border-emerald-700 font-bold shadow-xs ring-2 ring-emerald-500/30 scale-102'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-300'
                  }`}
                  title={`Center map on ${city.name} (${subLabel})`}
                >
                  <span className="text-[11px]">🌾</span>
                  <span className="font-semibold">{displayName}</span>
                  <span className={`text-[10px] ${isActive ? 'text-emerald-100 font-normal' : 'text-stone-400'}`}>
                    ({subLabel})
                  </span>
                </button>
              );
            })}

            {/* Live Search or Location Feedback Toast */}
            {searchFeedback && (
              <span className="ml-auto text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 hidden md:inline-flex items-center gap-1 animate-fadeIn">
                <span>✓</span>
                <span>{searchFeedback}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Controls on Map Overlay (Right Edge below navigation bar) */}
      <div className="absolute right-3 top-32 sm:top-28 z-[400] flex flex-col items-end gap-2 pointer-events-auto">
        {/* Zoom In & Zoom Out Control Group */}
        <div className="flex flex-col bg-white/95 backdrop-blur-md rounded-2xl border border-stone-200 shadow-md overflow-hidden">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2.5 text-stone-700 hover:bg-stone-100 hover:text-stone-900 border-b border-stone-200 text-sm font-bold flex items-center justify-center transition-colors cursor-pointer"
            title={t.zoomInBtn || 'Zoom In'}
            aria-label="Zoom In"
          >
            ➕
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2.5 text-stone-700 hover:bg-stone-100 hover:text-stone-900 text-sm font-bold flex items-center justify-center transition-colors cursor-pointer"
            title={t.zoomOutBtn || 'Zoom Out'}
            aria-label="Zoom Out"
          >
            ➖
          </button>
        </div>

        {/* Fit All Depots Button */}
        <button
          type="button"
          onClick={handleFitAllBounds}
          className="bg-white/95 hover:bg-white text-stone-800 p-2.5 rounded-2xl border border-stone-200 shadow-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          title={t.fitAllCentres || 'Show All Depots'}
        >
          <span>🌐</span>
          <span className="hidden sm:inline text-[11px]">{t.fitAllCentres || 'Show All'}</span>
        </button>

        {/* Instant Pin Drag Switch */}
        {onToggleDragPinMode && (
          <button
            type="button"
            onClick={onToggleDragPinMode}
            className={`p-2.5 rounded-2xl border shadow-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isDragPinMode
                ? 'bg-amber-100 text-amber-900 border-amber-400 font-bold ring-2 ring-amber-300'
                : 'bg-white/95 hover:bg-white text-stone-700 border-stone-200'
            }`}
            title={isDragPinMode ? 'Exit Pin Drag Mode' : 'Reposition Pin by Clicking / Dragging'}
          >
            <span>📌</span>
            <span className="hidden sm:inline text-[11px]">
              {isDragPinMode
                ? (currentLang === 'te' ? 'పిన్ మూవ్ ఆన్' : currentLang === 'hi' ? 'पिन मूव चालू' : 'Move Pin: ON')
                : (currentLang === 'te' ? 'పిన్ మార్చు' : currentLang === 'hi' ? 'पिन बदलें' : 'Move Pin')}
            </span>
          </button>
        )}
      </div>

      {/* Map Legend Overlay (Bottom Left) */}
      <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-stone-200 shadow-lg text-xs pointer-events-auto max-w-[280px] sm:max-w-none">
        <div className="font-bold text-stone-900 mb-1.5 flex items-center justify-between gap-4">
          <span>{t.depotWaitTimes || 'Depot Wait Times'}</span>
          <span className="text-[10px] text-stone-500 font-mono">{regionTitle || 'Regional AP Mandis'}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-700">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shadow-xs"></span>
            <span>{t.optimalWait || '< 45m (Optimal)'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs"></span>
            <span>{t.moderateWait || '1–3 hrs (Moderate)'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-xs"></span>
            <span>{t.chokedWait || '> 5 hrs (Choked)'}</span>
          </div>
        </div>
        <div className="mt-2 pt-1.5 border-t border-stone-200/80 flex items-center justify-between text-[10px] text-stone-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full border border-blue-600 bg-blue-200"></span>
            <span>
              {activeAccuracy
                ? `±${Math.round(activeAccuracy)}m ${t.gpsAccuracyLabel || 'GPS Area'}`
                : 'GPS Circle'}
            </span>
          </span>
          <span className="font-mono text-emerald-700 font-semibold">
            {t.filterRadiusKm?.replace('{radius}', String(radiusKm)) || `Radius: ${radiusKm} km`}
          </span>
        </div>
      </div>
    </div>
  );
};
