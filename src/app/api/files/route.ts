import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptFile } from "@/lib/encryption";
import { isAdmin } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const files = await prisma.file.findMany({
      include: {
        safeZone: {
          select: {
            name: true,
            latitude: true,
            longitude: true,
            radius: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json(files);
  } catch (error) {
    console.error("Error fetching files:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!isAdmin(session)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const safeZoneId = formData.get("safeZoneId") as string;

    if (!file || !safeZoneId) {
      return NextResponse.json(
        { message: "Missing file or safe zone" },
        { status: 400 }
      );
    }

    // Verify safe zone exists
    const safeZone = await prisma.safeZone.findUnique({
      where: { id: safeZoneId }
    });

    if (!safeZone) {
      return NextResponse.json(
        { message: "Safe zone not found" },
        { status: 404 }
      );
    }

    // Read file buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Encrypt file
    const encryptedData = encryptFile(fileBuffer);

    // Save to database
    const savedFile = await prisma.file.create({
      data: {
        name: file.name,
        originalName: file.name,
        encryptedData,
        mimeType: file.type,
        size: file.size,
        safeZoneId
      }
    });

    return NextResponse.json(savedFile, { status: 201 });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

