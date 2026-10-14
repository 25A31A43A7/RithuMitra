import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { ProcurementCentre } from '../types';

interface MapViewProps {
  farmerCoords: [number, number];
  onUpdateFarmerCoords: (coords: [number, number]) => void;
  isDragPinMode: boolean;
  centres: ProcurementCentre[];
  selectedCentreId: string | null;
  onSelectCentre: (centre: ProcurementCentre) => void;
  radiusKm: number;
  highlightRerouteFromId?: string | null;
  highlightRerouteToId?: string | null;
  locationStatusText?: string;
  regionTitle?: string;
}

export const MapView: React.FC<MapViewProps> = ({
  farmerCoords,
  onUpdateFarmerCoords,
  isDragPinMode,
  centres,
  selectedCentreId,
  onSelectCentre,
  radiusKm,
  highlightRerouteFromId,
  highlightRerouteToId,
  locationStatusText,
  regionTitle,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const farmerMarkerRef = useRef<L.Marker | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const reroutePolylineRef = useRef<L.Polyline | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: farmerCoords,
        zoom: 12,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      // Handle map click to reposition farm pin if in drag/reposition mode
      map.on('click', (e: L.LeafletMouseEvent) => {
        onUpdateFarmerCoords([e.latlng.lat, e.latlng.lng]);
      });

      mapInstanceRef.current = map;

      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    }
  }, []);

  // Update Farmer Pin & Map Viewport when farmerCoords or isDragPinMode change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Fly map smoothly to new farmer coords
    map.flyTo(farmerCoords, 12, { duration: 0.9 });
    setTimeout(() => {
      map.invalidateSize();
    }, 300);

    // Remove old farmer marker
    if (farmerMarkerRef.current) {
      farmerMarkerRef.current.remove();
    }

    const farmerIconHtml = `
      <div class="relative flex flex-col items-center cursor-pointer group">
        <div class="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-blue-600 text-white shadow-xl border-2 border-white ring-4 ${
          isDragPinMode ? 'ring-amber-400 animate-bounce' : 'ring-blue-400/40'
        } transition-transform">
          <span class="text-xl">📍</span>
        </div>
        <div class="mt-1 whitespace-nowrap bg-blue-900/95 text-[10px] text-white font-bold px-2 py-0.5 rounded-md shadow border border-blue-400/30">
          ${isDragPinMode ? '👇 Drag Pin / Click Map' : '🌾 Your Farm Location'}
        </div>
      </div>
    `;

    const farmerIcon = L.divIcon({
      className: 'custom-farmer-pin',
      html: farmerIconHtml,
      iconSize: [44, 60],
      iconAnchor: [22, 54],
    });

    const marker = L.marker(farmerCoords, {
      icon: farmerIcon,
      draggable: true,
    }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      onUpdateFarmerCoords([pos.lat, pos.lng]);
    });

    marker.bindPopup(`
      <div class="p-1.5 text-xs font-sans">
        <p class="font-bold text-blue-950 text-sm">📍 Your Farm Location</p>
        <p class="text-stone-600 mt-0.5">GPS: [${farmerCoords[0].toFixed(4)}, ${farmerCoords[1].toFixed(4)}]</p>
        <p class="text-emerald-700 font-medium text-[11px] mt-1">
          ${isDragPinMode ? 'Drag this marker or click anywhere on the map to relocate.' : 'Geodesic distances are calculated dynamically from this pin.'}
        </p>
      </div>
    `);

    farmerMarkerRef.current = marker;

    // Update Radius Circle
    if (radiusCircleRef.current) {
      radiusCircleRef.current.remove();
    }
    radiusCircleRef.current = L.circle(farmerCoords, {
      radius: radiusKm * 1000,
      color: '#15803d',
      fillColor: '#22c55e',
      fillOpacity: 0.06,
      weight: 1.5,
      dashArray: '4, 6',
    }).addTo(map);

  }, [farmerCoords, isDragPinMode, radiusKm, onUpdateFarmerCoords]);

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
      });

      const popupHtml = `
        <div class="p-2 min-w-[220px] text-xs font-sans">
          <div class="flex items-center gap-1.5 mb-1">
            <span class="font-bold text-stone-900 text-sm">${centre.name}</span>
            ${
              centre.govtVerified
                ? '<span class="text-blue-600 font-semibold text-[10px]">🛡️ Verified</span>'
                : '<span class="text-amber-600 text-[10px]">⚠️ Unverified</span>'
            }
          </div>
          <p class="text-stone-600 mb-2">${centre.address}</p>
          <div class="grid grid-cols-2 gap-1.5 py-1.5 border-y border-stone-200 text-stone-700">
            <div>
              <span class="text-[10px] text-stone-400 block">Queue Wait</span>
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
  }, [centres, selectedCentreId, farmerCoords, highlightRerouteFromId, highlightRerouteToId, onSelectCentre]);

  return (
    <div className="relative w-full h-[470px] rounded-3xl overflow-hidden border border-stone-200 shadow-sm bg-stone-100">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Location Status Tag */}
      {locationStatusText && (
        <div className="absolute top-3 left-3 z-[400] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-stone-200 shadow-sm text-xs flex items-center gap-2 pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          <span className="font-medium text-stone-800">{locationStatusText}</span>
        </div>
      )}

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-stone-200 shadow-md text-xs pointer-events-auto">
        <div className="font-semibold text-stone-800 mb-1.5 flex items-center justify-between gap-4">
          <span>Depot Wait Times</span>
          <span className="text-[10px] text-stone-500 font-mono">{regionTitle || 'Regional AP Mandis'}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-stone-700">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <span>&lt; 45m (Optimal)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>1–3 hrs (Moderate)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
            <span>&gt; 5 hrs (Choked)</span>
          </div>
        </div>
      </div>

      {/* Quick Action Badges */}
      <div className="absolute top-3 right-3 z-[400] flex items-center gap-2 pointer-events-auto">
        <button
          type="button"
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.flyTo(farmerCoords, 12, { duration: 0.8 });
            }
          }}
          className="bg-white/95 hover:bg-white text-stone-800 px-2.5 py-1.5 rounded-xl border border-stone-200 shadow-sm text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Snap map view to farm location"
        >
          <span>🎯</span>
          <span>Snap to Farm</span>
        </button>
        <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-stone-200 shadow-sm text-xs flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          <span className="font-medium text-stone-700">Filter Radius: {radiusKm} km</span>
        </div>
      </div>
    </div>
  );
};
