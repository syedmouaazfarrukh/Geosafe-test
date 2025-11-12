import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Lock, Users } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/navigation/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-8 sm:py-12 lg:py-16 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
          Secure File Access
          <span className="text-[#1E3A8A]"> Based on Location</span>
        </h2>
        <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto">
          Protect your sensitive files with location-based access control. 
          Files are only accessible when you&apos;re in designated safe zones.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/signup">
            <Button size="lg" className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 w-full sm:w-auto">
              Get Started
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="w-full sm:w-auto">
            Learn More
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
        <h3 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">How It Works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          <Card className="text-center">
            <CardHeader>
              <MapPin className="h-12 w-12 text-[#1E3A8A] mx-auto mb-4" />
              <CardTitle>Define Safe Zones</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Administrators can create safe zones by specifying latitude, longitude, and radius. 
                Files are only accessible within these designated areas.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Lock className="h-12 w-12 text-[#1E3A8A] mx-auto mb-4" />
              <CardTitle>Encrypted Storage</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                All files are encrypted using AES-256-GCM encryption before storage. 
                Files are automatically decrypted when accessed from safe zones.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-[#1E3A8A] mx-auto mb-4" />
              <CardTitle>Role-Based Access</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Simple role system with admin and user roles. Admins manage zones and files, 
                while users can only access files when in safe zones.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2025 GeoSafe. Secure file access based on location.</p>
        </div>
      </footer>
    </div>
  );
}
