"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, File } from "lucide-react";
import { toast } from "sonner";

interface SafeZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  description?: string;
}

interface FileUploadDialogProps {
  onFileUploaded: () => void;
}

export default function FileUploadDialog({ onFileUploaded }: FileUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string>("");
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchSafeZones();
  }, []);

  const fetchSafeZones = async () => {
    try {
      const response = await fetch("/api/safe-zones");
      if (response.ok) {
        const zones = await response.json();
        setSafeZones(zones);
      }
    } catch (error) {
      console.error("Error fetching safe zones:", error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // File size validation (50 MB limit)
      const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File too large! Maximum size is ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB. Please choose a smaller file.`);
        e.target.value = ''; // Clear the input
        setSelectedFile(null); // Clear selected file
        return;
      }

      // File type validation
      const ALLOWED_TYPES = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain', 'text/csv',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/zip', 'application/x-zip-compressed',
        'video/mp4', 'video/avi', 'video/mov', 'video/wmv',
        'audio/mp3', 'audio/wav', 'audio/mpeg'
      ];

      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`File type '${file.type}' is not supported. Please select an image, document, video, audio, or archive file.`);
        e.target.value = ''; // Clear the input
        setSelectedFile(null); // Clear selected file
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    if (!selectedZoneId) {
      toast.error("Please select a safe zone");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("safeZoneId", selectedZoneId);

      const response = await fetch("/api/files", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast.success("File uploaded successfully!");
        setOpen(false);
        setSelectedFile(null);
        setSelectedZoneId("");
        onFileUploaded();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to upload file");
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
          <Upload className="h-4 w-4 mr-2" />
          Upload File
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription>
            Upload a file and assign it to a safe zone. The file will be encrypted and only accessible within the selected zone.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Selection */}
          <div className="space-y-2">
            <Label htmlFor="file">Select File *</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileSelect}
                  className="flex-1"
                  required
                />
              </div>
              <div className="text-xs text-gray-500">
                <p>• Maximum file size: <strong>50 MB</strong></p>
                <p>• Supported formats: Images, Documents, Videos, Audio, Archives</p>
              </div>
            </div>
            {selectedFile && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <File className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    {selectedFile.name}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                  <div>
                    <span className="font-medium">Size:</span> 
                    <span className={`ml-1 ${selectedFile.size > 25 * 1024 * 1024 ? 'text-orange-600 font-semibold' : ''}`}>
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                    {selectedFile.size > 25 * 1024 * 1024 && (
                      <span className="ml-1 text-orange-600">⚠️ Large file</span>
                    )}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> {selectedFile.type}
                  </div>
                </div>
                <div className="mt-2 text-xs text-blue-600">
                  ✅ File meets size and type requirements
                </div>
              </div>
            )}
          </div>

          {/* Safe Zone Selection */}
          <div className="space-y-2">
            <Label htmlFor="safeZone">Safe Zone *</Label>
            <Select value={selectedZoneId} onValueChange={setSelectedZoneId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a safe zone" />
              </SelectTrigger>
              <SelectContent>
                {safeZones.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id}>
                    {zone.name} (Radius: {zone.radius}m)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedZoneId && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Selected Zone:</strong> {safeZones.find(z => z.id === selectedZoneId)?.name}
                </p>
                <p className="text-xs text-green-600">
                  This file will only be accessible within this safe zone
                </p>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-2 pt-4">
            <Button
              type="submit"
              className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90"
              disabled={!selectedFile || !selectedZoneId || isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {selectedFile && selectedFile.size > 10 * 1024 * 1024 ? "Uploading large file..." : "Uploading..."}
                </>
              ) : (
                "Upload File"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
