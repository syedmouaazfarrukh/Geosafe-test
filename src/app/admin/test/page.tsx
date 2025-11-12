"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Shield, Upload, Download, FileText, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface TestResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}

export default function EncryptionTestPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [testText, setTestText] = useState("This is a test file for encryption verification.");
  const [databaseStats, setDatabaseStats] = useState<{
    stats: {
      totalFiles: number;
      encryptedFiles: number;
      unencryptedFiles: number;
      totalSize: number;
      averageFileSize: number;
    };
    files: Array<{
      id: string;
      name: string;
      safeZone: string;
      size: number;
      isEncrypted: boolean;
      isBase64: boolean;
      encryptedDataPreview?: string;
    }>;
  } | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

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

  if (!session || session.user?.role !== "ADMIN") {
    router.push("/auth/signin");
    return null;
  }

  const addTestResult = (success: boolean, message: string, details?: Record<string, unknown>) => {
    setTestResults(prev => [...prev, { success, message, details }]);
  };

  const testEncryptionAPI = async () => {
    setIsTesting(true);
    setTestResults([]);

    try {
      // Test 1: Create a test file
      addTestResult(true, "Starting encryption tests...");

      const testBlob = new Blob([testText], { type: 'text/plain' });
      const testFile = new File([testBlob], 'encryption-test.txt', { type: 'text/plain' });

      // Test 2: Upload file
      addTestResult(true, "Uploading test file...");
      
      const formData = new FormData();
      formData.append('file', testFile);
      formData.append('name', 'Encryption Test File');
      formData.append('safeZoneId', 'test-zone'); // We'll need a real safe zone ID

      const uploadResponse = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        addTestResult(false, `Upload failed: ${errorData.message}`, errorData);
        return;
      }

      const uploadedFile = await uploadResponse.json();
      addTestResult(true, `File uploaded successfully with ID: ${uploadedFile.id}`, uploadedFile);

      // Test 3: Test file access with location
      addTestResult(true, "Testing file access with location...");
      
      const accessResponse = await fetch(`/api/files/${uploadedFile.id}/access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: 51.505,
          longitude: -0.09
        }),
      });

      if (!accessResponse.ok) {
        const errorData = await accessResponse.json();
        addTestResult(false, `File access failed: ${errorData.message}`, errorData);
        return;
      }

      // Test 4: Verify downloaded content
      const downloadedBlob = await accessResponse.blob();
      const downloadedText = await downloadedBlob.text();
      
      if (downloadedText === testText) {
        addTestResult(true, "✅ Encryption/Decryption working correctly! Downloaded content matches original.");
      } else {
        addTestResult(false, "❌ Encryption/Decryption failed! Downloaded content doesn't match original.", {
          original: testText,
          downloaded: downloadedText
        });
      }

    } catch (error) {
      const errorDetails: Record<string, unknown> = {
        message: error instanceof Error ? error.message : 'Unknown error',
        error: error instanceof Error ? error.toString() : String(error)
      };
      addTestResult(false, `Test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`, errorDetails);
    } finally {
      setIsTesting(false);
    }
  };

  const testEncryptionDirect = async () => {
    setIsTesting(true);
    setTestResults([]);

    try {
      // Test direct encryption/decryption
      addTestResult(true, "Testing direct encryption/decryption...");

      const response = await fetch('/api/test/encryption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: testText
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        addTestResult(false, `Direct encryption test failed: ${errorData.message}`, errorData);
        return;
      }

      const result = await response.json();
      
      if (result.success) {
        addTestResult(true, "✅ Direct encryption/decryption working correctly!", result);
      } else {
        addTestResult(false, "❌ Direct encryption/decryption failed!", result);
      }

    } catch (error) {
      const errorDetails: Record<string, unknown> = {
        message: error instanceof Error ? error.message : 'Unknown error',
        error: error instanceof Error ? error.toString() : String(error)
      };
      addTestResult(false, `Direct test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`, errorDetails);
    } finally {
      setIsTesting(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const loadDatabaseStats = async () => {
    setIsLoadingStats(true);
    try {
      const response = await fetch('/api/test/database');
      const data = await response.json();
      setDatabaseStats(data);
    } catch (error) {
      console.error('Failed to load database stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-[#1E3A8A]" />
            <h1 className="text-2xl font-bold text-[#1E3A8A]">Encryption Test Center</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => router.push("/admin")}>
              Back to Admin
            </Button>
            <Button variant="outline" onClick={() => router.push("/api/auth/signout")}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Encryption Testing</h2>
          <p className="text-gray-600">Test file encryption and decryption functionality</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Test Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#1E3A8A]" />
                Test Configuration
              </CardTitle>
              <CardDescription>
                Configure test parameters and run encryption tests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="test-text">Test Content</Label>
                <Textarea
                  id="test-text"
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  placeholder="Enter test content..."
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={testEncryptionDirect}
                  disabled={isTesting}
                  className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90"
                >
                  {isTesting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Testing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Test Direct Encryption
                    </>
                  )}
                </Button>

                <Button 
                  onClick={testEncryptionAPI}
                  disabled={isTesting}
                  variant="outline"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Test Full Flow
                </Button>
              </div>

              <Button 
                onClick={clearResults}
                variant="outline"
                className="w-full"
              >
                Clear Results
              </Button>
            </CardContent>
          </Card>

          {/* Test Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-[#1E3A8A]" />
                Test Results
              </CardTitle>
              <CardDescription>
                Results from encryption and decryption tests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No test results yet</p>
                  <p className="text-sm">Run a test to see results</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {testResults.map((result, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg border ${
                        result.success 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {result.success ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className={`font-medium ${
                            result.success ? 'text-green-800' : 'text-red-800'
                          }`}>
                            {result.message}
                          </p>
                          {result.details && (
                            <details className="mt-2">
                              <summary className="text-sm cursor-pointer text-gray-600 hover:text-gray-800">
                                View Details
                              </summary>
                              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                                {JSON.stringify(result.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Database Inspection */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Database Inspection</span>
              <Button 
                onClick={loadDatabaseStats}
                disabled={isLoadingStats}
                variant="outline"
                size="sm"
              >
                {isLoadingStats ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Check Database
                  </>
                )}
              </Button>
            </CardTitle>
            <CardDescription>
              Inspect files in the database to verify encryption status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {databaseStats ? (
              <div className="space-y-4">
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{databaseStats.stats.totalFiles}</div>
                    <div className="text-sm text-blue-800">Total Files</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{databaseStats.stats.encryptedFiles}</div>
                    <div className="text-sm text-green-800">Encrypted</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{databaseStats.stats.unencryptedFiles}</div>
                    <div className="text-sm text-red-800">Not Encrypted</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">
                      {(databaseStats.stats.totalSize / 1024 / 1024).toFixed(2)} MB
                    </div>
                    <div className="text-sm text-gray-800">Total Size</div>
                  </div>
                </div>

                {databaseStats.files.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">File Details</h4>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {databaseStats.files.map((file) => (
                        <div key={file.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{file.name}</div>
                              <div className="text-sm text-gray-600">
                                {file.safeZone} • {(file.size / 1024).toFixed(2)} KB
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {file.isEncrypted ? (
                                <Badge className="bg-green-100 text-green-800">Encrypted</Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-800">Not Encrypted</Badge>
                              )}
                              {file.isBase64 && (
                                <Badge className="bg-blue-100 text-blue-800">Base64</Badge>
                              )}
                            </div>
                          </div>
                          {file.encryptedDataPreview && (
                            <div className="mt-2 text-xs text-gray-500 font-mono">
                              {file.encryptedDataPreview}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Download className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Click &quot;Check Database&quot; to inspect files</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Tests */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Tests</CardTitle>
            <CardDescription>
              Run specific encryption tests to verify functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Button 
                onClick={() => {
                  setTestText("Simple test");
                  testEncryptionDirect();
                }}
                disabled={isTesting}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2"
              >
                <FileText className="h-6 w-6" />
                <span className="font-medium">Simple Text</span>
                <span className="text-xs text-gray-500">Test basic encryption</span>
              </Button>

              <Button 
                onClick={() => {
                  setTestText("This is a longer test with special characters: !@#$%^&*()_+-=[]{}|;':\",./<>? and unicode: 🚀🔒📁");
                  testEncryptionDirect();
                }}
                disabled={isTesting}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2"
              >
                <FileText className="h-6 w-6" />
                <span className="font-medium">Special Characters</span>
                <span className="text-xs text-gray-500">Test unicode & symbols</span>
              </Button>

              <Button 
                onClick={() => {
                  setTestText("A".repeat(1000));
                  testEncryptionDirect();
                }}
                disabled={isTesting}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2"
              >
                <FileText className="h-6 w-6" />
                <span className="font-medium">Large Content</span>
                <span className="text-xs text-gray-500">Test with 1000 chars</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
