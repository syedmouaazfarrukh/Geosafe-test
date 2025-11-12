import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptFile } from "@/lib/encryption";
import { isWithinSafeZone } from "@/lib/geo";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Await params before using
    const { id } = await params;

    // Get file with safe zone info
    const file = await prisma.file.findUnique({
      where: { id },
      include: {
        safeZone: true
      }
    });

    if (!file) {
      return NextResponse.json(
        { message: "File not found" },
        { status: 404 }
      );
    }

    // Check if user is within safe zone
    const isInSafeZone = isWithinSafeZone(
      latitude,
      longitude,
      file.safeZone.latitude,
      file.safeZone.longitude,
      file.safeZone.radius
    );

    // Log access attempt
    await prisma.fileAccess.create({
      data: {
        userId: session.user.id,
        fileId: file.id,
        latitude,
        longitude,
        granted: isInSafeZone
      }
    });

    if (!isInSafeZone) {
      return NextResponse.json(
        { 
          message: "Access denied. You must be within the safe zone to access this file.",
          granted: false
        },
        { status: 403 }
      );
    }

    // Decrypt file
    const decryptedBuffer = decryptFile(file.encryptedData);

    // Return file data - convert Buffer to Uint8Array for NextResponse
    return new NextResponse(new Uint8Array(decryptedBuffer), {
      headers: {
        'Content-Type': file.mimeType,
        'Content-Disposition': `attachment; filename="${file.originalName}"`,
        'Content-Length': decryptedBuffer.length.toString()
      }
    });
  } catch (error) {
    console.error("Error accessing file:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

