"use client";

import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';

interface SafeZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  description?: string;
}

interface SimpleMapProps {
  safeZones: SafeZone[];
  userLocation?: { lat: number; lng: number };
  onLocationSelect?: (lat: number, lng: number) => void;
  isAdmin?: boolean;
  selectedZone?: SafeZone | null;
  showCurrentLocation?: boolean;
  onLocationDetected?: (lat: number, lng: number) => void;
}

export default function SimpleMap({
  userLocation,
  onLocationDetected
}: SimpleMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([51.505, -0.09]);
  const [mapInstance] = useState<unknown>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (userLocation) {
      setMapCenter([userLocation.lat, userLocation.lng]);
    }
  }, [userLocation]);

  const handleLocationDetected = (lat: number, lng: number) => {
    setCurrentLocation({ lat, lng });
    setIsLocating(false);
    setMapCenter([lat, lng]);
    onLocationDetected?.(lat, lng);
  };

  const handleGetLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser.");
      return;
    }

    setIsLocating(true);
    console.log("Requesting location...");
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("Location detected:", latitude, longitude);
        handleLocationDetected(latitude, longitude);
      },
      (error) => {
        console.error("Error getting location:", error);
        setIsLocating(false);
        
        if (error.code === 1) {
          alert("Location access denied. Please enable location services in your browser settings.");
        } else if (error.code === 3) {
          alert("Location request timed out. Please try again.");
        } else {
          alert("Unable to get your location. Please check your browser settings.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  if (!isClient) {
    return (
      <div className="h-96 w-full rounded-lg border flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-96 overflow-hidden rounded-lg border bg-gray-100">
      {/* Manual Location Button */}
      <div className="absolute top-4 right-4 z-[1000]">
        <button
          onClick={handleGetLocation}
          disabled={isLocating}
          className="bg-[#1E3A8A] text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-800 disabled:opacity-50 flex items-center gap-2 transition-all duration-200"
        >
          {isLocating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Getting Location...
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4" />
              Get Location
            </>
          )}
        </button>
      </div>

      {/* Location Status Indicator */}
      {currentLocation && (
        <div className="absolute top-4 left-4 z-[1000] bg-green-100 border border-green-300 rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-800">Location Found</span>
          </div>
          <p className="text-xs text-green-600 mt-1">
            {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
          </p>
        </div>
      )}

      {/* Map Container */}
      <div 
        id="map" 
        className="h-full w-full"
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  );
}
