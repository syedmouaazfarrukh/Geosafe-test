"use client";

import { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface SafeZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  description?: string;
}

interface LeafletMapProps {
  safeZones: SafeZone[];
  userLocation?: { lat: number; lng: number };
  onLocationSelect?: (lat: number, lng: number) => void;
  isAdmin?: boolean;
  selectedZone?: SafeZone | null;
  showCurrentLocation?: boolean;
  onLocationDetected?: (lat: number, lng: number) => void;
}

export default function LeafletMap({
  safeZones,
  userLocation,
  onLocationSelect,
  isAdmin = false,
  selectedZone,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showCurrentLocation = false,
  onLocationDetected
}: LeafletMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([51.505, -0.09]);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (userLocation) {
      setMapCenter([userLocation.lat, userLocation.lng]);
    }
  }, [userLocation]);

  useEffect(() => {
    if (!isClient || !mapRef.current) return;

    const initializeMap = async () => {
      try {
        // Small delay to ensure container is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Double-check mapRef is still available after async delay
        if (!mapRef.current) return;
        
        const L = await import('leaflet');
        
        // Fix for default markers
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        // Clear any existing map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
        }

        // Initialize map - mapRef.current is guaranteed to be non-null here
        console.log('Initializing map with center:', mapCenter);
        const map = L.map(mapRef.current, {
          center: mapCenter,
          zoom: 15,
          zoomControl: true,
          preferCanvas: false
        });
        
        // Add admin mode class for cursor styling
        if (isAdmin) {
          map.getContainer().classList.add('admin-mode');
        }
        
        console.log('Map initialized successfully');

        // Add tile layer
        console.log('Adding tile layer...');
        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
          minZoom: 1,
          updateWhenIdle: true,
          updateWhenZooming: false
        });
        
        tileLayer.addTo(map);
        console.log('Tile layer added successfully');

        mapInstanceRef.current = map;

        // Add safe zones with enhanced styling
        safeZones.forEach((zone, index) => {
          console.log(`Adding safe zone: ${zone.name} at ${zone.latitude}, ${zone.longitude} with radius ${zone.radius}m`);
          
          // Create circle with enhanced styling
          const circle = L.circle([zone.latitude, zone.longitude], {
            color: selectedZone?.id === zone.id ? '#ef4444' : '#1E3A8A',
            fillColor: selectedZone?.id === zone.id ? '#fecaca' : '#3b82f6',
            fillOpacity: 0.4,
            weight: 3,
            radius: zone.radius
          }).addTo(map);

          // Add center marker for better visibility
          const centerMarker = L.marker([zone.latitude, zone.longitude], {
            icon: L.divIcon({
              className: 'safe-zone-center',
              html: `<div style="
                background-color: ${selectedZone?.id === zone.id ? '#ef4444' : '#1E3A8A'};
                color: white;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                border: 3px solid white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 14px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              ">${index + 1}</div>`,
              iconSize: [30, 30],
              iconAnchor: [15, 15]
            })
          }).addTo(map);

          // Enhanced popup with more information
          const popupContent = `
            <div class="p-3 min-w-[200px]">
              <div class="flex items-center gap-2 mb-2">
                <div class="w-3 h-3 rounded-full" style="background-color: ${selectedZone?.id === zone.id ? '#ef4444' : '#1E3A8A'}"></div>
                <h3 class="font-semibold text-lg">${zone.name}</h3>
              </div>
              <div class="space-y-1 text-sm">
                <p class="text-gray-600"><strong>Location:</strong> ${zone.latitude.toFixed(6)}, ${zone.longitude.toFixed(6)}</p>
                <p class="text-gray-600"><strong>Radius:</strong> ${zone.radius}m</p>
                <p class="text-gray-600"><strong>Coverage:</strong> ${(Math.PI * zone.radius * zone.radius / 1000000).toFixed(2)} km²</p>
                ${zone.description ? `<p class="text-gray-700 mt-2"><strong>Description:</strong> ${zone.description}</p>` : ''}
              </div>
            </div>
          `;

          circle.bindPopup(popupContent);
          centerMarker.bindPopup(popupContent);
        });

        // Add selected zone if it exists (for admin mode)
        if (selectedZone && isAdmin) {
          console.log('Adding selected zone marker:', selectedZone);
          
          L.marker([selectedZone.latitude, selectedZone.longitude], {
            icon: L.divIcon({
              className: 'selected-zone-marker',
              html: `
                <div style="
                  background-color: #1E3A8A;
                  color: white;
                  width: 40px;
                  height: 40px;
                  border-radius: 50%;
                  border: 4px solid white;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: bold;
                  font-size: 18px;
                  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.4);
                  z-index: 1000;
                ">📍</div>
              `,
              iconSize: [40, 40],
              iconAnchor: [20, 20]
            })
          }).addTo(map);

          L.circle([selectedZone.latitude, selectedZone.longitude], {
            color: '#1E3A8A',
            fillColor: '#3b82f6',
            fillOpacity: 0.2,
            weight: 2,
            radius: selectedZone.radius,
            className: 'selected-zone-circle'
          }).addTo(map);

          console.log('Selected zone marker and circle added');
        }

        // Add user location marker
        if (userLocation) {
          const userMarker = L.marker([userLocation.lat, userLocation.lng]).addTo(map);
          userMarker.bindPopup(`
            <div class="p-2">
              <h3 class="font-semibold text-lg">Your Location</h3>
              <p class="text-sm text-gray-600">
                ${userLocation.lat.toFixed(6)}, ${userLocation.lng.toFixed(6)}
              </p>
            </div>
          `);
        }

        // Add current location marker
        if (currentLocation) {
          const currentMarker = L.marker([currentLocation.lat, currentLocation.lng]).addTo(map);
          currentMarker.bindPopup(`
            <div class="p-2">
              <h3 class="font-semibold text-lg text-green-600">📍 Current Location</h3>
              <p class="text-sm text-gray-600">
                ${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}
              </p>
              <p class="text-xs text-gray-500 mt-1">
                Detected at ${new Date().toLocaleTimeString()}
              </p>
            </div>
          `);
        }

        // Add click handler for admin with enhanced visual feedback
        if (isAdmin && onLocationSelect) {
          console.log('Adding click handler for admin');
          
          // Store references to current markers for cleanup
          let currentMarker: L.Marker | null = null;
          let currentCircle: L.Circle | null = null;
          
          map.on('click', (e: L.LeafletMouseEvent) => {
            const { lat, lng } = e.latlng;
            console.log('Map clicked:', lat, lng);
            console.log('Calling onLocationSelect with:', lat, lng);
            
            // Remove previous markers if they exist
            if (currentMarker) {
              console.log('Removing previous marker');
              map.removeLayer(currentMarker);
            }
            if (currentCircle) {
              console.log('Removing previous circle');
              map.removeLayer(currentCircle);
            }
            
            // Add a prominent marker to show the selected location
            currentMarker = L.marker([lat, lng], {
              icon: L.divIcon({
                className: 'selected-location-marker',
                html: `
                  <div style="
                    background-color: #1E3A8A;
                    color: white;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    border: 4px solid white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 18px;
                    box-shadow: 0 4px 12px rgba(30, 58, 138, 0.4);
                    z-index: 1000;
                  ">📍</div>
                `,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
              })
            }).addTo(map);
            
            console.log('Added marker to map');
            
            // Add a circle to show the radius preview
            const radius = 100; // Default radius for preview
            currentCircle = L.circle([lat, lng], {
              color: '#1E3A8A',
              fillColor: '#3b82f6',
              fillOpacity: 0.2,
              weight: 2,
              radius: radius
            }).addTo(map);
            
            console.log('Added circle to map');
            
            // Store references in the map instance for persistence
            map._selectedMarker = currentMarker;
            map._selectedCircle = currentCircle;
            
            // Call the location select callback
            console.log('Calling onLocationSelect callback');
            onLocationSelect(lat, lng);
          });
          
          // Add hover effect for better UX
          map.on('mouseover', () => {
            if (isAdmin) {
              map.getContainer().style.cursor = 'crosshair';
            }
          });
          
          map.on('mouseout', () => {
            map.getContainer().style.cursor = 'grab';
          });
        }

      } catch (error) {
        console.error('Failed to initialize map:', error);
      }
    };

    initializeMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isClient, mapCenter, safeZones, userLocation, currentLocation, isAdmin, onLocationSelect, selectedZone]);

  // Handle current location updates without reinitializing the map
  useEffect(() => {
    if (!mapInstanceRef.current || !currentLocation) return;

    const updateCurrentLocation = async () => {
      try {
        // Store reference to avoid null checks after async
        const mapInstance = mapInstanceRef.current;
        if (!mapInstance) return;
        
        const L = await import('leaflet');
        
        // Remove any existing current location markers
        mapInstance.eachLayer((layer) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const layerOptions = (layer as any).options;
          if (layerOptions && layerOptions.className === 'current-location-marker') {
            mapInstance.removeLayer(layer);
          }
        });

        // Add current location marker
        const currentMarker = L.marker([currentLocation.lat, currentLocation.lng], {
          icon: L.divIcon({
            className: 'current-location-marker',
            html: `
              <div style="
                background-color: #10b981;
                color: white;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                border: 3px solid white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 14px;
                box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
              ">📍</div>
            `,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          })
        }).addTo(mapInstanceRef.current);

        currentMarker.bindPopup(`
          <div class="p-2">
            <h3 class="font-semibold text-lg text-green-600">📍 Current Location</h3>
            <p class="text-sm text-gray-600">
              ${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}
            </p>
            <p class="text-xs text-gray-500 mt-1">
              Detected at ${new Date().toLocaleTimeString()}
            </p>
          </div>
        `);

        console.log('Current location marker added');
      } catch (error) {
        console.error('Failed to update current location:', error);
      }
    };

    updateCurrentLocation();
  }, [currentLocation]);

  const handleLocationDetected = (lat: number, lng: number) => {
    setCurrentLocation({ lat, lng });
    setIsLocating(false);
    // Always update map center to show the detected location
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
        <div className="absolute top-16 left-4 z-[1000] bg-green-100 border border-green-300 rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-800">Location Found</span>
          </div>
          <p className="text-xs text-green-600 mt-1">
            {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
          </p>
        </div>
      )}

      {/* Safe Zone Legend */}
      {safeZones.length > 0 && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-white border border-gray-300 rounded-lg p-3 shadow-lg max-w-xs">
          <h4 className="font-semibold text-sm text-gray-800 mb-2">Safe Zones</h4>
          <div className="space-y-2">
            {safeZones.map((zone) => (
              <div key={zone.id} className="flex items-center gap-2 text-xs">
                <div 
                  className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: '#3b82f6' }}
                ></div>
                <span className="text-gray-700">{zone.name}</span>
                <span className="text-gray-500">({zone.radius}m)</span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Click on circles for details
            </p>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div 
        ref={mapRef}
        className="h-full w-full"
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  );
}
