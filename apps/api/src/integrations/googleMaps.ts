import { env } from '../config/env';
import { logger } from '../config/logger';

interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  if (!env.GOOGLE_MAPS_API_KEY) {
    logger.warn('[Google Maps not configured] Skipping geocode lookup');
    return null;
  }

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', address);
  url.searchParams.set('key', env.GOOGLE_MAPS_API_KEY);

  const response = await fetch(url.toString());
  const body = (await response.json()) as {
    status: string;
    results: Array<{
      formatted_address: string;
      geometry: { location: { lat: number; lng: number } };
    }>;
  };

  if (body.status !== 'OK' || body.results.length === 0) {
    return null;
  }

  const [result] = body.results;
  return {
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    formattedAddress: result.formatted_address,
  };
}

interface DistanceResult {
  distanceMeters: number;
  durationSeconds: number;
}

export async function getDrivingDistance(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<DistanceResult | null> {
  if (!env.GOOGLE_MAPS_API_KEY) {
    logger.warn('[Google Maps not configured] Skipping distance lookup');
    return null;
  }

  const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
  url.searchParams.set('origins', `${origin.lat},${origin.lng}`);
  url.searchParams.set('destinations', `${destination.lat},${destination.lng}`);
  url.searchParams.set('key', env.GOOGLE_MAPS_API_KEY);

  const response = await fetch(url.toString());
  const body = (await response.json()) as {
    rows: Array<{ elements: Array<{ distance?: { value: number }; duration?: { value: number } }> }>;
  };

  const element = body.rows?.[0]?.elements?.[0];
  if (!element?.distance || !element.duration) return null;

  return { distanceMeters: element.distance.value, durationSeconds: element.duration.value };
}
