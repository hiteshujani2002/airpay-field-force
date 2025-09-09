import React, { useEffect, useState } from 'react';
import { MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { checkGeolocationSupport } from '@/lib/geoLocationUtils';

interface GeoLocationStatusProps {
  onLocationRequest?: () => void;
}

export const GeoLocationStatus: React.FC<GeoLocationStatusProps> = ({ onLocationRequest }) => {
  const [locationSupported, setLocationSupported] = useState<boolean | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');

  useEffect(() => {
    const checkSupport = async () => {
      try {
        const supported = await checkGeolocationSupport();
        setLocationSupported(supported);
        
        if (supported && navigator.permissions) {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          setPermissionStatus(permission.state);
          
          permission.onchange = () => {
            setPermissionStatus(permission.state);
          };
        }
      } catch (error) {
        console.warn('Error checking geolocation support:', error);
        setLocationSupported(false);
      }
    };
    
    checkSupport();
  }, []);

  if (locationSupported === null) {
    return null; // Loading
  }

  if (!locationSupported) {
    return (
      <Alert className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Geolocation is not supported by your browser. Images will be uploaded without location data.
        </AlertDescription>
      </Alert>
    );
  }

  if (permissionStatus === 'denied') {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Location access has been denied. Please enable location permissions in your browser settings to capture geo coordinates with images.
        </AlertDescription>
      </Alert>
    );
  }

  if (permissionStatus === 'granted') {
    return (
      <Alert className="mb-4 border-green-500 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <MapPin className="inline h-4 w-4 mr-1" />
          Location access enabled. Images will be captured with geo coordinates.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="mb-4">
      <MapPin className="h-4 w-4" />
      <AlertDescription>
        Location access is available but not yet granted. 
        {onLocationRequest && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onLocationRequest}
            className="ml-2"
          >
            Enable Location
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};