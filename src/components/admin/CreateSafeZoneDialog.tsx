"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import MapWrapper from "@/components/map/MapWrapper";
import { toast } from "sonner";

interface CreateSafeZoneDialogProps {
  onZoneCreated: () => void;
}

export default function CreateSafeZoneDialog({ onZoneCreated }: CreateSafeZoneDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    radius: "100"
  });
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLocationSelect = (lat: number, lng: number) => {
    console.log('Location selected in dialog:', lat, lng);
    console.log('Setting selectedLocation state');
    setSelectedLocation({ lat, lng });
    console.log('selectedLocation state updated');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted with data:', { formData, selectedLocation });
    
    if (!selectedLocation) {
      toast.error("Please select a location on the map");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Please enter a zone name");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/safe-zones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          latitude: selectedLocation.lat,
          longitude: selectedLocation.lng,
          radius: parseFloat(formData.radius)
        }),
      });

      if (response.ok) {
        toast.success("Safe zone created successfully!");
        setOpen(false);
        setFormData({ name: "", description: "", radius: "100" });
        setSelectedLocation(null);
        onZoneCreated();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to create safe zone");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90">
          <Plus className="h-4 w-4 mr-2" />
          Create Safe Zone
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[100vw] w-[95vw] h-[90vh] max-h-[80vh] sm:max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Create Safe Zone</DialogTitle>
          <DialogDescription>
            Click on the map to select the center of your safe zone, then configure the details.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 flex-1 overflow-hidden min-h-0">
          {/* Map - Takes 2/3 of the space on desktop */}
          <div className="xl:col-span-2 space-y-2 sm:space-y-4 h-full flex flex-col">
            <h3 className="text-base sm:text-lg font-semibold">Select Location</h3>
            <div className="flex-1 min-h-[300px] sm:min-h-[400px]">
              <MapWrapper
                safeZones={[]}
                onLocationSelect={handleLocationSelect}
                isAdmin={true}
                selectedZone={selectedLocation ? {
                  id: 'temp',
                  name: 'Selected Location',
                  latitude: selectedLocation.lat,
                  longitude: selectedLocation.lng,
                  radius: parseFloat(formData.radius) || 100
                } : null}
              />
            </div>
            {selectedLocation && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Selected:</strong> {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </p>
              </div>
            )}
          </div>

          {/* Form - Takes 1/3 of the space on desktop */}
          <div className="space-y-3 sm:space-y-4 overflow-x-hidden sm:overflow-y-visible mobile-scrollbar h-full flex flex-col">
            <h3 className="text-base sm:text-lg font-semibold">Zone Details</h3>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 flex-1 flex flex-col">
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="name" className="text-sm sm:text-base">Zone Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Office Building"
                  required
                  className="text-sm sm:text-base"
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="description" className="text-sm sm:text-base">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description of the safe zone"
                  rows={2}
                  className="text-sm sm:text-base"
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="radius" className="text-sm sm:text-base">Radius (meters) *</Label>
                <Input
                  id="radius"
                  type="number"
                  value={formData.radius}
                  onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
                  placeholder="100"
                  min="10"
                  max="10000"
                  required
                  className="text-sm sm:text-base"
                />
                <p className="text-xs text-gray-500">
                  The radius in meters around the selected point. The circle on the map will update as you type.
                </p>
                {selectedLocation && (
                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    <strong>Coverage:</strong> {((Math.PI * parseFloat(formData.radius || '0') * parseFloat(formData.radius || '0')) / 1000000).toFixed(2)} km²
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-4 mt-auto">
                <Button
                  type="submit"
                  className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-sm sm:text-base"
                  disabled={!selectedLocation || isLoading}
                >
                  {isLoading ? "Creating..." : "Create Zone"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="text-sm sm:text-base"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
