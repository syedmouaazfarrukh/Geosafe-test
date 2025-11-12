import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isWithinSafeZone } from "@/lib/geo";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { latitude, longitude } = await request.json();

    if (!latitude || !longitude) {
      return NextResponse.json(
        { message: "Location coordinates required" },
        { status: 400 }
      );
    }

    // Get all files with their safe zones
    const allFiles = await prisma.file.findMany({
      include: {
        safeZone: true
      }
    });

    // Filter files where user is within safe zone
    const accessibleFiles = allFiles.filter((file) => 
      isWithinSafeZone(
        latitude,
        longitude,
        file.safeZone.latitude,
        file.safeZone.longitude,
        file.safeZone.radius
      )
    );

    // Return file info without encrypted data
    const fileInfo = accessibleFiles.map((file) => ({
      id: file.id,
      name: file.name,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      createdAt: file.createdAt,
      safeZone: {
        name: file.safeZone.name,
        description: file.safeZone.description
      }
    }));

    return NextResponse.json(fileInfo);
  } catch (error) {
    console.error("Error fetching user files:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

