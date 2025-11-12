"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin, Upload, Shield, Trash2 } from "lucide-react";
import CreateSafeZoneDialog from "@/components/admin/CreateSafeZoneDialog";
import FileUploadDialog from "@/components/admin/FileUploadDialog";
import EditUserDialog from "@/components/admin/EditUserDialog";
import MapWrapper from "@/components/map/MapWrapper";
import Navbar from "@/components/navigation/Navbar";

interface SafeZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  description?: string;
  createdAt: string;
  creator: {
    name: string;
    email: string;
  };
  _count: {
    files: number;
  };
}

interface File {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  safeZone: {
    name: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  _count: {
    fileAccess: number;
  };
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    
    // Type assertion needed because NextAuth types don't include role by default
    const userRole = (session.user as { role?: string })?.role;
    if (userRole !== "ADMIN") {
      router.push("/user");
      return;
    }

    fetchData();
  }, [session, status, router]);

  const fetchData = async () => {
    try {
      const [zonesRes, filesRes, usersRes] = await Promise.all([
        fetch("/api/safe-zones"),
        fetch("/api/files"),
        fetch("/api/users")
      ]);

      if (zonesRes.ok) setSafeZones(await zonesRes.json());
      if (filesRes.ok) setFiles(await filesRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleZoneCreated = () => {
    fetchData();
  };

  const handleFileUploaded = () => {
    fetchData();
  };

  const handleDeleteZone = async (zoneId: string) => {
    if (!confirm("Are you sure you want to delete this safe zone?")) return;
    
    try {
      const response = await fetch(`/api/safe-zones/${zoneId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        setSafeZones(safeZones.filter((zone) => zone.id !== zoneId));
      }
    } catch (error) {
      console.error("Error deleting zone:", error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        setUsers(users.filter((user) => user.id !== userId));
      } else {
        const error = await response.json();
        alert(error.message || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
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

  const userRole = session?.user ? (session.user as { role?: string })?.role : undefined;
  if (!session || userRole !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
        <div className="mb-6 lg:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h2>
          <p className="text-gray-600">Manage users, safe zones, and files</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-4 lg:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm">Users</TabsTrigger>
            <TabsTrigger value="zones" className="text-xs sm:text-sm">Safe Zones</TabsTrigger>
            <TabsTrigger value="files" className="text-xs sm:text-sm">Files</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 lg:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users.length}</div>
                  <p className="text-xs text-muted-foreground">Active users</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Safe Zones</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{safeZones.length}</div>
                  <p className="text-xs text-muted-foreground">Active zones</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Files</CardTitle>
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{files.length}</div>
                  <p className="text-xs text-muted-foreground">Encrypted files</p>
                </CardContent>
              </Card>
            </div>

            {/* Map Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[#1E3A8A]" />
                  Safe Zones Map
                </CardTitle>
                <CardDescription>
                  Overview of all safe zones and their coverage areas. Click on circles for details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {safeZones.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        Showing {safeZones.length} safe zone{safeZones.length !== 1 ? 's' : ''} on the map
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="w-3 h-3 rounded-full bg-[#1E3A8A]"></div>
                        <span>Safe Zone</span>
                      </div>
                    </div>
                    <MapWrapper 
                      safeZones={safeZones} 
                      showCurrentLocation={false}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No safe zones created yet</p>
                    <p className="text-sm text-gray-400">Create your first safe zone to see it on the map</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Manage user accounts and permissions
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No users found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>File Access</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={user.role === "ADMIN" ? "default" : "secondary"}
                                className={user.role === "ADMIN" ? "bg-[#1E3A8A] text-white" : ""}
                              >
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{user._count.fileAccess} files</Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(user.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <EditUserDialog user={user} onUserUpdated={fetchData} />
                                {user.id !== session?.user?.id && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="zones" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Safe Zone Management</CardTitle>
                    <CardDescription>
                      Create and manage safe zones for file access
                    </CardDescription>
                  </div>
                  <CreateSafeZoneDialog onZoneCreated={handleZoneCreated} />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : safeZones.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No safe zones created yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Radius</TableHead>
                            <TableHead>Files</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                        {safeZones.map((zone) => (
                          <TableRow key={zone.id}>
                            <TableCell className="font-medium">{zone.name}</TableCell>
                            <TableCell>
                              {zone.latitude.toFixed(4)}, {zone.longitude.toFixed(4)}
                            </TableCell>
                            <TableCell>{zone.radius}m</TableCell>
                            <TableCell>
                              <Badge variant="outline">{zone._count.files} files</Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(zone.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteZone(zone.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>File Management</CardTitle>
                    <CardDescription>
                      Upload and manage encrypted files
                    </CardDescription>
                  </div>
                  <FileUploadDialog onFileUploaded={handleFileUploaded} />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : files.length === 0 ? (
                  <div className="text-center py-8">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No files uploaded yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>File Name</TableHead>
                            <TableHead>Safe Zone</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Uploaded</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                        {files.map((file) => (
                          <TableRow key={file.id}>
                            <TableCell className="font-medium">{file.originalName}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{file.safeZone.name}</Badge>
                            </TableCell>
                            <TableCell>{(file.size / 1024 / 1024).toFixed(2)} MB</TableCell>
                            <TableCell>{file.mimeType}</TableCell>
                            <TableCell>
                              {new Date(file.createdAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

