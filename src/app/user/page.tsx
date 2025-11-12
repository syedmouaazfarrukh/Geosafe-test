"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MapPin, Download, Shield, AlertCircle, File } from "lucide-react";
import MapWrapper from "@/components/map/MapWrapper";
import Navbar from "@/components/navigation/Navbar";

interface AccessibleFile {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  safeZone: {
    name: string;
    description?: string;
  };
}

export default function UserDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationError] = useState<string | null>(null);
  const [accessibleFiles, setAccessibleFiles] = useState<AccessibleFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastLocationCheck, setLastLocationCheck] = useState<{ lat: number; lng: number } | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    
    if (session.user?.role === "ADMIN") {
      router.push("/admin");
      return;
    }
  }, [session, status, router]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);


  const fetchAccessibleFiles = async (lat: number, lng: number) => {
    // Clear existing debounce timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Throttle requests - only fetch if location changed significantly
    if (lastLocationCheck) {
      const distance = Math.sqrt(
        Math.pow(lat - lastLocationCheck.lat, 2) + 
        Math.pow(lng - lastLocationCheck.lng, 2)
      );
      
      // Only fetch if moved more than ~0.0001 degrees (roughly 10 meters)
      if (distance < 0.0001) {
        return;
      }
    }

    // Debounce the API call by 2 seconds
    const timer = setTimeout(async () => {
      setLastLocationCheck({ lat, lng });
      setLoading(true);
      
      try {
        const response = await fetch("/api/user/files", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ latitude: lat, longitude: lng }),
        });

        if (response.ok) {
          const files = await response.json();
          setAccessibleFiles(files);
        }
      } catch (error) {
        console.error("Error fetching files:", error);
      } finally {
        setLoading(false);
      }
    }, 2000);

    setDebounceTimer(timer);
  };

  const handleDownloadFile = async (fileId: string) => {
    if (!userLocation) {
      alert("Location required for file access");
      return;
    }

    try {
      const response = await fetch(`/api/files/${fileId}/access`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latitude: userLocation.lat,
          longitude: userLocation.lng,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = accessibleFiles.find(f => f.id === fileId)?.originalName || "file";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const error = await response.json();
        alert(error.message || "Access denied");
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Error downloading file");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-[#1E3A8A] mx-auto mb-4 animate-spin" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user?.role === "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
        <div className="mb-6 lg:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Your Files</h2>
          <p className="text-gray-600">Access your files when you&apos;re in a safe zone</p>
        </div>

        {/* Location Status */}
        <Card className="mb-4 lg:mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Location Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userLocation ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Location Retrieved
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Lat: {userLocation.lat.toFixed(6)}, Lng: {userLocation.lng.toFixed(6)}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {locationError && (
                  <div className="flex items-center space-x-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{locationError}</span>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  Allow location access to view available files and see your position on the map.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Files */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Available Files</h3>
          
          <Card>
            <CardHeader>
              <CardTitle>
                {loading ? "Loading files..." : `${accessibleFiles.length} files available`}
              </CardTitle>
              <CardDescription>
                Files accessible from your current location
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3A8A] mx-auto"></div>
                  <p className="mt-2 text-gray-500">Checking location and loading files...</p>
                </div>
              ) : accessibleFiles.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {userLocation 
                      ? "No files are available in your current safe zone."
                      : "Please enable location access to view available files."
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File Name</TableHead>
                        <TableHead>Safe Zone</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accessibleFiles.map((file) => (
                        <TableRow key={file.id}>
                          <TableCell className="font-medium flex items-center space-x-2">
                            <File className="h-4 w-4 text-gray-500" />
                            <span>{file.originalName}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{file.safeZone.name}</Badge>
                          </TableCell>
                          <TableCell>{(file.size / 1024 / 1024).toFixed(2)} MB</TableCell>
                          <TableCell>{file.mimeType}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => handleDownloadFile(file.id)}
                              className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Map View */}
        <div className="mt-6 lg:mt-8">
          <h3 className="text-lg sm:text-xl font-semibold mb-4">Your Location & Safe Zones</h3>
          <Card>
            <CardHeader>
              <CardTitle>Location Map</CardTitle>
              <CardDescription>
                View your current location and nearby safe zones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Click the location button on the map to get your current position
                  </p>
                </div>
                <div className="h-80 sm:h-96">
                  <MapWrapper 
                    safeZones={[]} // We'll need to fetch safe zones for display
                    userLocation={userLocation || undefined}
                    showCurrentLocation={false} // Disable auto-location detection
                    onLocationDetected={(lat, lng) => {
                      setUserLocation({ lat, lng });
                      fetchAccessibleFiles(lat, lng);
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Access History */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Access History</h3>
          <Card>
            <CardHeader>
              <CardTitle>No access attempts</CardTitle>
              <CardDescription>
                Your file access history will appear here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-gray-500">No access attempts recorded yet.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

