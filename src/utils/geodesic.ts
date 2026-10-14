/**
 * Haversine Formula for real geodesic distance in kilometers between two GPS coordinates
 */
export function calculateDistanceKm(
  point1: [number, number],
  point2: [number, number]
): number {
  const [lat1, lon1] = point1;
  const [lat2, lon2] = point2;

  const R = 6371; // Earth's mean radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  return Number(d.toFixed(1));
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export const CITY_COORDS: Record<'rajahmundry' | 'tirupati' | 'vijayawada' | 'guntur', [number, number]> = {
  rajahmundry: [17.0005, 81.8040],
  tirupati: [13.6288, 79.4192],
  vijayawada: [16.5062, 80.6480],
  guntur: [16.3067, 80.4365],
};

/**
 * Determines which of the 4 main AP agro regions is closest to the given coordinates
 */
export function getClosestRegion(coords: [number, number]): 'rajahmundry' | 'tirupati' | 'vijayawada' | 'guntur' {
  let closestRegion: 'rajahmundry' | 'tirupati' | 'vijayawada' | 'guntur' = 'rajahmundry';
  let minDistance = Infinity;

  (Object.keys(CITY_COORDS) as Array<'rajahmundry' | 'tirupati' | 'vijayawada' | 'guntur'>).forEach((region) => {
    const dist = calculateDistanceKm(coords, CITY_COORDS[region]);
    if (dist < minDistance) {
      minDistance = dist;
      closestRegion = region;
    }
  });

  return closestRegion;
}
