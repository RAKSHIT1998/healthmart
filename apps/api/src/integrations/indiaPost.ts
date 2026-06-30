import { logger } from '../config/logger';

interface IndiaPostOffice {
  Name: string;
  District: string;
  State: string;
  Pincode: string;
}

interface IndiaPostResponse {
  Status: string;
  PostOffice: IndiaPostOffice[] | null;
}

export interface CityPincodeResult {
  pincode: string;
  area: string;
  district: string;
  state: string;
  /** True when the post office's district matches the searched city — a strong signal it's the
   * right place and not a same-named post office elsewhere in India (India Post's API matches by
   * post office name, not strictly by city, so e.g. searching "Jammu" also returns an unrelated
   * "Jammu" branch post office in Andhra Pradesh). */
  districtMatch: boolean;
}

/** Looks up serviceable pincodes for a city via India Post's public API, deduped by pincode. */
export async function lookupPincodesByCity(city: string): Promise<CityPincodeResult[]> {
  const response = await fetch(`https://api.postalpincode.in/postoffice/${encodeURIComponent(city)}`, {
    signal: AbortSignal.timeout(10_000),
  }).catch((err) => {
    logger.error({ err }, 'India Post API request failed');
    throw new Error('Could not reach the pincode lookup service. Please try again.');
  });

  if (!response.ok) {
    throw new Error('Could not reach the pincode lookup service. Please try again.');
  }

  const data = (await response.json()) as IndiaPostResponse[];
  const offices = data?.[0]?.PostOffice ?? [];

  const cityLower = city.trim().toLowerCase();
  const byPincode = new Map<string, CityPincodeResult>();

  for (const office of offices) {
    if (!office.Pincode || byPincode.has(office.Pincode)) continue;
    byPincode.set(office.Pincode, {
      pincode: office.Pincode,
      area: office.Name,
      district: office.District,
      state: office.State,
      districtMatch: office.District?.toLowerCase() === cityLower,
    });
  }

  return Array.from(byPincode.values()).sort((a, b) => Number(b.districtMatch) - Number(a.districtMatch));
}
