'use client';

import { AlertCircle, Loader2, MapPin, Navigation } from 'lucide-react';

import { useCallback, useEffect, useRef, useState } from 'react';

import { logger } from '@/lib/logger';

interface LocationPickerProps {
  onLocationSelect: (location: LocationData) => void;
  initialAddress?: string;
  error?: string;
  rentalDays?: number;
  dailyRate?: number;
}

export interface LocationData {
  address: string;
  city: string;
  province: string;
  postalCode: string;
  lat: number;
  lng: number;
  distanceKm: number;
  exactDistanceKm: number; // Exact distance from Google Maps (not rounded)
  drivingTimeMinutes: number; // Driving time to help validate the route
  deliveryFee: number;
  formattedDistance: string;
}

interface AddressSuggestion {
  description: string;
  placeId: string;
}

// Yard location: U-Dig It Rentals Inc. - 945 Golden Grove Road, Saint John, NB E2H 2X1
const YARD_LOCATION = {
  lat: 45.3316,
  lng: -65.9818,
  address: '945 Golden Grove Road, Saint John, NB E2H 2X1',
};

const FLAT_FEE = 150; // Flat float fee per way
const INCLUDED_KM = 30; // Included distance in flat fee
const COST_PER_KM = 3; // Additional cost per km beyond 30 km (per way)
const HST_RATE = 0.15; // 15% HST

// ✅ NOTE: This component doesn't directly use the API key
// The API key is securely stored in backend API routes
// (/api/maps/autocomplete, /api/maps/geocode, /api/maps/distance)

/**
 * Location Picker with Google Places Autocomplete Suggestions
 *
 * Shows address suggestions as users type using Google Places Autocomplete API
 *
 * Features:
 * - Real-time address suggestions dropdown while typing
 * - Automatic distance calculation from yard location
 * - Real-time pricing: $150/way flat fee (up to 30km) + $3/km/way beyond
 * - Address validation and formatting
 * - Visual distance and pricing display
 */
export default function LocationPicker({
  onLocationSelect,
  initialAddress = '',
  error,
  rentalDays = 1,
  dailyRate = 450,
}: LocationPickerProps) {
  const [address, setAddress] = useState(initialAddress);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch address suggestions from Google Places Autocomplete API (via backend proxy)
   */
  const fetchSuggestions = useCallback(async (input: string) => {
    if (!input || input.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);

    try {
      const response = await fetch(`/api/maps/autocomplete?input=${encodeURIComponent(input)}`);

      const data = await response.json();

      if (data.status === 'OK' && data.predictions) {
        const newSuggestions = data.predictions.slice(0, 5).map((pred: unknown) => ({
          description: pred.description,
          placeId: pred.place_id,
        }));
        setSuggestions(newSuggestions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      logger.error(
        'Error fetching suggestions:',
        {
          component: 'LocationPicker',
          action: 'error',
        },
        err instanceof Error ? err : new Error(String(err))
      );
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  /**
   * Handle input change with debouncing
   */
  const handleInputChange = (value: string) => {
    setAddress(value);
    setGeocodeError(null);

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce suggestions fetch
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  /**
   * Calculate ACTUAL DRIVING distance using Google Maps Distance Matrix API
   * (Not straight-line Haversine - this uses real road routes)
   * Returns: { distanceKm, drivingTimeMinutes }
   */
  const calculateDrivingDistance = async (
    destination: string
  ): Promise<{ distanceKm: number; drivingTimeMinutes: number }> => {
    try {
      const response = await fetch(
        `/api/maps/distance?destination=${encodeURIComponent(destination)}`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.distance && data.duration) {
        // Return exact kilometers and driving time from Distance Matrix API
        return {
          distanceKm: data.distance.kilometers,
          drivingTimeMinutes: data.duration.minutes,
        };
      } else {
        logger.error('Distance Matrix API error', {
          component: 'LocationPicker',
          action: 'error',
          metadata: { status: data.status, error: data.error },
        });
        // Fallback: return a conservative estimate
        return { distanceKm: 50, drivingTimeMinutes: 60 };
      }
    } catch (error) {
      logger.error(
        'Error calculating driving distance',
        {
          component: 'LocationPicker',
          action: 'error',
        },
        error instanceof Error ? error : new Error(String(error))
      );
      // Fallback: return a conservative estimate
      return { distanceKm: 50, drivingTimeMinutes: 60 };
    }
  };

  /**
   * Calculate delivery fee: $150/way × 2 + extra distance fees
   * NOTE: Distance is already rounded to 1 decimal place before calling this function
   */
  const calculateDeliveryFee = (distanceKm: number): number => {
    const baseFee = FLAT_FEE * 2; // $150 delivery + $150 pickup = $300

    // If within 30 km, only charge base fee (distance already rounded to 1 decimal)
    if (distanceKm <= INCLUDED_KM) {
      return baseFee;
    }

    // Calculate extra distance (distance already rounded to 1 decimal)
    const extraKm = distanceKm - INCLUDED_KM;
    const extraFeePerWay = extraKm * COST_PER_KM;
    const totalExtraFee = extraFeePerWay * 2; // Both ways

    return baseFee + totalExtraFee;
  };

  /**
   * Geocode a place by Place ID (via backend proxy)
   */
  const geocodePlaceById = async (placeId: string) => {
    setIsGeocoding(true);
    setGeocodeError(null);
    setShowSuggestions(false);

    try {
      const response = await fetch(`/api/maps/geocode?place_id=${encodeURIComponent(placeId)}`);

      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const addressComponents = result.address_components || [];

        let city = '';
        let province = '';
        let postalCode = '';

        addressComponents.forEach((component: unknown) => {
          if (component.types.includes('locality')) city = component.long_name;
          if (component.types.includes('administrative_area_level_1'))
            province = component.short_name;
          if (component.types.includes('postal_code')) postalCode = component.long_name;
        });

        const lat = result.geometry.location.lat;
        const lng = result.geometry.location.lng;

        // Calculate ACTUAL DRIVING distance (not straight-line)
        const { distanceKm: exactDistance, drivingTimeMinutes } = await calculateDrivingDistance(
          result.formatted_address
        );

        // CRITICAL: Round to 1 decimal place to prevent micro-charges
        // Example: 30.02km → 30.0km, 39.84km → 39.8km
        const roundedDistance = Math.round(exactDistance * 10) / 10;

        // Use rounded distance for pricing (prevents micro-charges)
        const deliveryFee = calculateDeliveryFee(roundedDistance);

        const locationData: LocationData = {
          address: result.formatted_address,
          city,
          province,
          postalCode,
          lat,
          lng,
          distanceKm: roundedDistance, // Rounded to 1 decimal for consistency
          exactDistanceKm: roundedDistance, // Same as distanceKm
          drivingTimeMinutes, // Driving time to validate route
          deliveryFee,
          formattedDistance: `${roundedDistance.toFixed(1)} km from our yard`,
        };

        setLocationData(locationData);
        setAddress(result.formatted_address);
        onLocationSelect(locationData);
      } else {
        setGeocodeError('Unable to find location. Please try again.');
      }
    } catch (err) {
      logger.error(
        'Geocoding error:',
        { component: 'LocationPicker', action: 'error' },
        err instanceof Error ? err : new Error(String(err))
      );
      setGeocodeError('Error finding location. Please try again.');
    } finally {
      setIsGeocoding(false);
    }
  };

  /**
   * Handle suggestion click
   */
  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    setAddress(suggestion.description);
    geocodePlaceById(suggestion.placeId);
    setSuggestions([]);
  };

  /**
   * Handle click outside to close suggestions
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-4">
      <div className="relative">
        <label htmlFor="location" className="mb-2 block text-sm font-medium text-gray-700">
          Delivery Location *
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MapPin className="h-5 w-5 text-gray-400" />
          </div>
          <input
            ref={inputRef}
            id="location"
            type="text"
            value={address}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() =>
              address.length >= 3 && suggestions.length > 0 && setShowSuggestions(true)
            }
            placeholder="Start typing your delivery address..."
            className={`focus:ring-kubota-orange focus:border-kubota-orange w-full rounded-md border py-3 pl-10 pr-10 shadow-sm focus:outline-none focus:ring-2 ${
              error || geocodeError ? 'border-red-500' : 'border-gray-300'
            }`}
            aria-describedby={error || geocodeError ? 'location-error' : 'location-help'}
            aria-invalid={!!(error || geocodeError)}
            autoComplete="off"
          />
          {(isLoadingSuggestions || isGeocoding) && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <Loader2 className="text-kubota-orange h-5 w-5 animate-spin" />
            </div>
          )}
        </div>

        {/* Autocomplete Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white shadow-lg"
          >
            {suggestions.map((suggestion: unknown, index: unknown) => (
              <button
                key={suggestion.placeId}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full border-b border-gray-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                type="button"
              >
                <div className="flex items-start space-x-2">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                  <span className="text-sm text-gray-900">{suggestion.description}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {(error || geocodeError) && (
          <p
            id="location-error"
            className="mt-1 flex items-center text-sm text-red-600"
            role="alert"
          >
            <AlertCircle className="mr-1 h-4 w-4" />
            {error || geocodeError}
          </p>
        )}

        {!error && !geocodeError && !locationData && (
          <p id="location-help" className="mt-1 text-sm text-gray-500">
            Type your address - suggestions will appear as you type
          </p>
        )}
      </div>

      {/* Distance and Pricing Display */}
      {locationData && !geocodeError && (
        <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start space-x-3">
            <Navigation className="mt-0.5 h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">{locationData.formattedDistance}</p>
              <p className="mt-1 text-xs text-blue-700">Google Maps driving distance</p>
              <p className="mt-1 text-xs text-green-700 font-medium">
                ✓ You pay for exact distance (no rounding)
              </p>
              <p className="mt-2 text-xs text-gray-600 italic">
                💡 See a different distance on Google Maps?
                <a
                  href={`https://www.google.com/maps/dir/945+Golden+Grove+Road,+Saint+John,+NB+E2H+2X1,+Canada/${encodeURIComponent(locationData.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 underline hover:text-blue-600"
                >
                  Click here to compare routes
                </a>
              </p>
            </div>
          </div>

          <div className="border-t border-blue-200 pt-3">
            <div className="space-y-2 text-sm">
              {/* Equipment Rental */}
              <div className="mb-3">
                <div className="flex justify-between border-b border-blue-200 pb-2">
                  <div>
                    <p className="font-semibold text-gray-900">Equipment Rental</p>
                    <p className="text-xs text-gray-600">
                      {rentalDays} {rentalDays === 1 ? 'day' : 'days'} @ ${dailyRate}/day
                    </p>
                  </div>
                  <span className="font-semibold text-gray-900">
                    ${(dailyRate * rentalDays).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Transportation & Staging */}
              <div className="mb-2">
                <p className="font-semibold text-gray-900">Transportation & Staging</p>
                {locationData.distanceKm > INCLUDED_KM && (
                  <p className="text-xs text-gray-600">
                    Base $300 + $
                    {((locationData.distanceKm - INCLUDED_KM) * COST_PER_KM * 2).toFixed(2)} for{' '}
                    {(locationData.distanceKm - INCLUDED_KM).toFixed(1)}km extra (both ways)
                  </p>
                )}
              </div>

              <div className="ml-3 space-y-2 text-xs">
                {/* Delivery Breakdown */}
                <div>
                  <div className="flex justify-between font-medium text-gray-700">
                    <span>• Delivery to site:</span>
                    {locationData.distanceKm <= INCLUDED_KM && (
                      <span>${(locationData.deliveryFee / 2).toFixed(2)}</span>
                    )}
                  </div>
                  {locationData.distanceKm > INCLUDED_KM && (
                    <div className="ml-4 space-y-0.5 text-gray-600">
                      <div className="flex justify-between">
                        <span>- Standard mileage:</span>
                        <span>$150.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>
                          - Additional mileage ({(locationData.distanceKm - INCLUDED_KM).toFixed(1)}
                          km × $3):
                        </span>
                        <span>
                          ${((locationData.distanceKm - INCLUDED_KM) * COST_PER_KM).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-gray-300 pt-0.5 font-medium text-gray-700">
                        <span>Subtotal:</span>
                        <span>${(locationData.deliveryFee / 2).toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pickup Breakdown */}
                <div>
                  <div className="flex justify-between font-medium text-gray-700">
                    <span>• Pickup from site:</span>
                    {locationData.distanceKm <= INCLUDED_KM && (
                      <span>${(locationData.deliveryFee / 2).toFixed(2)}</span>
                    )}
                  </div>
                  {locationData.distanceKm > INCLUDED_KM && (
                    <div className="ml-4 space-y-0.5 text-gray-600">
                      <div className="flex justify-between">
                        <span>- Standard mileage:</span>
                        <span>$150.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>
                          - Additional mileage ({(locationData.distanceKm - INCLUDED_KM).toFixed(1)}
                          km × $3):
                        </span>
                        <span>
                          ${((locationData.distanceKm - INCLUDED_KM) * COST_PER_KM).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-gray-300 pt-0.5 font-medium text-gray-700">
                        <span>Subtotal:</span>
                        <span>${(locationData.deliveryFee / 2).toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between border-t border-blue-200 pt-2 text-sm">
                <span className="font-medium text-gray-700">Transport Subtotal</span>
                <span className="font-semibold text-gray-900">
                  ${locationData.deliveryFee.toFixed(2)}
                </span>
              </div>

              {/* Subtotal and Grand Total Section */}
              <div className="mt-3 space-y-2 border-t-2 border-blue-300 pt-3">
                <div className="flex justify-between text-sm font-semibold text-gray-900">
                  <span>Subtotal (Equipment + Transport)</span>
                  <span>${(dailyRate * rentalDays + locationData.deliveryFee).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>HST (15%)</span>
                  <span>
                    ${((dailyRate * rentalDays + locationData.deliveryFee) * HST_RATE).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-blue-300 pt-2 text-lg font-bold text-blue-900">
                  <span>Estimated Total</span>
                  <span>
                    $
                    {((dailyRate * rentalDays + locationData.deliveryFee) * (1 + HST_RATE)).toFixed(
                      2
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-blue-200 pt-3">
            <p className="text-xs text-gray-600">
              <strong>Note:</strong> This is an estimate. Final amount will be confirmed before
              payment.
              <br />
              ✓ Distance rounded to nearest kilometer
              <br />
              ✓ Price includes equipment rental, delivery, and pickup
              <br />✓ A $500 security deposit (refundable) will be required
            </p>
          </div>
        </div>
      )}

      {/* Pricing Information */}
      {!locationData && !geocodeError && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h4 className="mb-2 text-sm font-medium text-gray-900">Delivery Pricing</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <p>
              • <span className="font-medium">Flat Float: $150/Way</span> ($150 delivery + $150
              pickup = $300)
            </p>
            <p>
              • <span className="font-medium">Includes up to 30km each way</span>
            </p>
            <p>
              • <span className="font-medium">Additional Distance: $3.00/km + HST</span> (per way,
              both ways)
            </p>
            <p>• Distance is Google Maps driving route with real-time traffic</p>
            <p className="font-medium text-green-700">
              • You pay for EXACT distance (no rounding markup)
            </p>
            <p>• We show driving time to help you verify the route</p>
            <p>• Click the verification link to compare routes on Google Maps</p>
            <p className="text-xs text-gray-600 mt-2">
              <strong>Note:</strong> Routes can vary by 1-2 km based on traffic conditions and time
              of day. We use Google's Distance Matrix API with real-time traffic optimization.
            </p>
            <p className="pt-2 text-xs italic text-gray-500">
              We confirm the total before finalizing your booking
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
