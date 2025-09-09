// Utility functions for geo location capture during image uploads

interface GeoLocationData {
  latitude: number;
  longitude: number;
  address?: string;
  pincode?: string;
  timestamp: string;
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

/**
 * Get current geo location using browser's Geolocation API
 */
export const getCurrentLocation = (options: GeolocationOptions = {}): Promise<GeoLocationData> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    const defaultOptions: GeolocationOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      ...options
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Get address details using reverse geocoding
          const addressData = await reverseGeocode(latitude, longitude);
          
          resolve({
            latitude,
            longitude,
            address: addressData.address,
            pincode: addressData.pincode,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          // Even if reverse geocoding fails, return basic location data
          resolve({
            latitude,
            longitude,
            timestamp: new Date().toISOString()
          });
        }
      },
      (error) => {
        let errorMessage = 'Failed to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        reject(new Error(errorMessage));
      },
      defaultOptions
    );
  });
};

/**
 * Reverse geocode coordinates to get address and pincode
 */
export const reverseGeocode = (latitude: number, longitude: number): Promise<{ address?: string; pincode?: string }> => {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.maps) {
      reject(new Error('Google Maps API not loaded'));
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    const latlng = { lat: latitude, lng: longitude };

    geocoder.geocode({ location: latlng }, (results: any, status: string) => {
      if (status === 'OK' && results && results[0]) {
        const result = results[0];
        const addressComponents = result.address_components;
        
        let pincode = '';
        
        // Extract pincode from address components
        for (const component of addressComponents) {
          if (component.types.includes('postal_code')) {
            pincode = component.long_name;
            break;
          }
        }

        resolve({
          address: result.formatted_address,
          pincode: pincode || undefined
        });
      } else {
        reject(new Error(`Geocoder failed: ${status}`));
      }
    });
  });
};

/**
 * Format geo location data for display
 */
export const formatGeoLocation = (geoData: GeoLocationData): string => {
  const { latitude, longitude, address, pincode } = geoData;
  
  let formatted = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  
  if (address) {
    formatted += ` - ${address}`;
  }
  
  if (pincode) {
    formatted += ` (${pincode})`;
  }
  
  return formatted;
};

/**
 * Check if geolocation is supported and permission is granted
 */
export const checkGeolocationSupport = async (): Promise<boolean> => {
  if (!navigator.geolocation) {
    return false;
  }

  try {
    const permission = await navigator.permissions.query({ name: 'geolocation' });
    return permission.state === 'granted' || permission.state === 'prompt';
  } catch (error) {
    // Fallback: assume supported if permission query fails
    return true;
  }
};

declare global {
  interface Window {
    google: any;
  }
}