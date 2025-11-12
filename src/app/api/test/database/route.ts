import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth-helpers";

// Type for file with safe zone relation
type FileWithSafeZone = {
  id: string;
  name: string;
  originalName: string;
  encryptedData: string;
  mimeType: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
  safeZoneId: string;
  safeZone: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    radius: number;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
  } | null;
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!isAdmin(session)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get all files with their encryption status
    const files = await prisma.file.findMany({
      include: {
        safeZone: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const fileAnalysis = files.map((file: FileWithSafeZone) => ({
      id: file.id,
      name: file.originalName,
      size: file.size,
      mimeType: file.mimeType,
      createdAt: file.createdAt,
      safeZone: file.safeZone?.name || 'No Safe Zone',
      encryptedDataLength: file.encryptedData?.length || 0,
      isEncrypted: !!file.encryptedData,
      encryptedDataPreview: file.encryptedData ? 
        file.encryptedData.substring(0, 100) + '...' : 
        'No encrypted data',
      // Check if encrypted data looks like base64
      isBase64: file.encryptedData ? 
        /^[A-Za-z0-9+/]*={0,2}$/.test(file.encryptedData) : 
        false
    }));

    // Get database stats
    const stats = {
      totalFiles: files.length,
      encryptedFiles: files.filter((f: FileWithSafeZone) => f.encryptedData).length,
      unencryptedFiles: files.filter((f: FileWithSafeZone) => !f.encryptedData).length,
      totalSize: files.reduce((sum: number, f: FileWithSafeZone) => sum + f.size, 0),
      averageFileSize: files.length > 0 ? files.reduce((sum: number, f: FileWithSafeZone) => sum + f.size, 0) / files.length : 0
    };

    return NextResponse.json({
      success: true,
      stats,
      files: fileAnalysis,
      message: `Found ${files.length} files in database`
    });

  } catch (error) {
    console.error("Database inspection error:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Database inspection failed",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
