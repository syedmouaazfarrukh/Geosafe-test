import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { encryptFile, decryptFile } from "@/lib/encryption";
import { isAdmin } from "@/lib/auth-helpers";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!isAdmin(session)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { message: "Text content is required" },
        { status: 400 }
      );
    }

    console.log("Testing encryption with text:", text.substring(0, 50) + "...");

    // Convert text to buffer
    const originalBuffer = Buffer.from(text, 'utf8');
    console.log("Original buffer length:", originalBuffer.length);

    // Encrypt the buffer
    const encryptedData = encryptFile(originalBuffer);
    console.log("Encrypted data length:", encryptedData.length);
    console.log("Encrypted data preview:", encryptedData.substring(0, 100) + "...");

    // Decrypt the data
    const decryptedBuffer = decryptFile(encryptedData);
    console.log("Decrypted buffer length:", decryptedBuffer.length);

    // Convert back to text
    const decryptedText = decryptedBuffer.toString('utf8');
    console.log("Decrypted text preview:", decryptedText.substring(0, 50) + "...");

    // Compare results
    const isMatch = text === decryptedText;
    console.log("Text matches:", isMatch);

    return NextResponse.json({
      success: isMatch,
      message: isMatch ? "Encryption/Decryption successful" : "Encryption/Decryption failed",
      details: {
        originalLength: text.length,
        originalBufferLength: originalBuffer.length,
        encryptedLength: encryptedData.length,
        decryptedBufferLength: decryptedBuffer.length,
        decryptedLength: decryptedText.length,
        originalPreview: text.substring(0, 100),
        decryptedPreview: decryptedText.substring(0, 100),
        isMatch
      }
    });

  } catch (error) {
    console.error("Encryption test error:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Encryption test failed",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
