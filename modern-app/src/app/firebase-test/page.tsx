import { testFirebaseConnection } from "@/lib/firebase/test-connection";
import { userService } from "@/lib/services/user-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Database, Shield, Info, HelpCircle } from "lucide-react";
import { requireSession } from "@/lib/auth/require-session";
import { isAdmin } from "@/lib/auth/roles";
import { notFound, redirect } from "next/navigation";

export default async function FirebaseTestPage() {
  // 1. Environment Check: Disable this page entirely in production.
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  // 2. Authentication & Authorization Check
  const session = await requireSession();
  if (!isAdmin(session.user.role)) {
    redirect("/dashboard");
  }

  // --- Original Page Logic (now secured) ---
  const connectionTest = await testFirebaseConnection();

  const serviceTest = {
    getAllUsers: false,
    error: null as string | null,
    userCount: 0
  };

  try {
    const users = await userService.getAllUsers();
    serviceTest.getAllUsers = true;
    serviceTest.userCount = users.length;
  } catch (error) {
    serviceTest.error = (error as Error).message;
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold text-foreground">Firebase Connection Test</h1>
          <p className="text-muted-foreground mt-2">Test your Firebase integration and service connectivity</p>
        </div>

        {/* Connection Status */}
        <Card className="border-border shadow-sm bg-card">
          <CardHeader className="bg-muted/50">
            <CardTitle className="flex items-center gap-3 text-card-foreground">
              {connectionTest.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Connection Status
              <Badge variant={connectionTest.success ? "default" : "destructive"}>{connectionTest.mode}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {connectionTest.mode === "mock" ? (
              <Alert className="border-primary/20 bg-primary/5">
                <Info className="h-4 w-4 text-primary" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Running in Mock Mode</p>
                    <p className="text-sm text-muted-foreground">
                      Set{" "}
                      <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                        NEXT_PUBLIC_APP_MODE=firebase
                      </code>{" "}
                      to test Firebase integration
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-6">
                {/* Connection Result */}
                {connectionTest.success ? (
                  <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-medium text-green-800 dark:text-green-200">
                          ✅ Firebase Connected Successfully!
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          All Firebase services are working correctly
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-medium">❌ Firebase Connection Failed</p>
                        <p className="text-sm">Check your environment variables and configuration</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Detailed Results */}
                {connectionTest.results && (
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h4 className="font-medium text-card-foreground mb-4 flex items-center gap-2">
                      <Database className="h-4 w-4 text-primary" />
                      Service Status
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        {connectionTest.results.adminAuth ? (
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        )}
                        <div>
                          <span className="font-medium text-card-foreground">Admin Auth</span>
                          <p className="text-xs text-muted-foreground">Firebase Authentication</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        {connectionTest.results.adminDb ? (
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        )}
                        <div>
                          <span className="font-medium text-card-foreground">Admin Firestore</span>
                          <p className="text-xs text-muted-foreground">Cloud Firestore Database</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Errors */}
                {connectionTest.results?.errors && connectionTest.results.errors.length > 0 && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-3">
                        <h4 className="font-medium">Connection Errors:</h4>
                        <ul className="text-sm space-y-2">
                          {connectionTest.results.errors.map((error, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-muted-foreground mt-1">•</span>
                              <span>{error}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Test */}
        <Card className="border-border shadow-sm bg-card">
          <CardHeader className="bg-muted/50">
            <CardTitle className="flex items-center gap-3 text-card-foreground">
              {serviceTest.getAllUsers ? (
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
              <Shield className="h-5 w-5 text-primary" />
              Auth Service Test
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {serviceTest.getAllUsers ? (
              <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium text-green-800 dark:text-green-200">✅ Auth Service Working</p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Found <span className="font-semibold">{serviceTest.userCount}</span> users in database
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">❌ Auth Service Error</p>
                    <p className="text-sm font-mono bg-muted p-2 rounded">{serviceTest.error}</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card className="border-border shadow-sm bg-card">
          <CardHeader className="bg-muted/50">
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <Info className="h-5 w-5 text-primary" />
              Setup Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Firebase Setup */}
            <Alert className="border-primary/20 bg-primary/5">
              <Database className="h-4 w-4 text-primary" />
              <AlertDescription>
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">To enable Firebase:</h4>
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside ml-4">
                    <li>
                      Create a Firebase project at <span className="font-semibold">Firebase Console</span>
                    </li>
                    <li>
                      Enable <span className="font-semibold">Authentication</span> and{" "}
                      <span className="font-semibold">Firestore</span>
                    </li>
                    <li>Get your configuration keys from project settings</li>
                    <li>
                      Update your <code className="bg-muted px-2 py-1 rounded text-xs font-mono">.env.local</code> file
                    </li>
                    <li>
                      Set{" "}
                      <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                        NEXT_PUBLIC_APP_MODE=firebase
                      </code>
                    </li>
                    <li>Restart your development server</li>
                  </ol>
                </div>
              </AlertDescription>
            </Alert>

            {/* Help Section */}
            <Alert className="border-secondary/20 bg-secondary/5">
              <HelpCircle className="h-4 w-4 text-secondary-foreground" />
              <AlertDescription>
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Need help?</h4>
                  <p className="text-sm text-muted-foreground">
                    Check the <code className="bg-muted px-2 py-1 rounded text-xs font-mono">FIREBASE_SETUP.md</code>{" "}
                    file for detailed setup instructions and troubleshooting tips.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
