"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, RefreshCw, Users, Info, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { clientLogger } from "@/lib/utils/logger";

interface User {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  role: string;
  createdAt: string;
}

export default function ClientDebugPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/debug/users");
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      } else {
        toast.error("Failed to fetch users", { description: data.error });
      }
    } catch (error) {
      clientLogger.error("Failed to fetch users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const clearUsers = async () => {
    setDeleting(true);
    try {
      const response = await fetch("/api/debug/users", { method: "DELETE" });
      const data = await response.json();
      if (data.success) {
        await fetchUsers(); // Refresh the list
        toast.success(data.message);
      } else {
        toast.error("Failed to clear users", { description: data.error });
      }
    } catch (error) {
      clientLogger.error("Failed to clear users:", error);
      toast.error("Failed to clear users");
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Debug Panel</h1>
            <p className="text-muted-foreground">Manage mock users and debug the system</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={fetchUsers}
              disabled={loading}
              variant="secondary"
              className="border-border hover:bg-accent hover:text-accent-foreground">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={clearUsers} disabled={deleting} variant="danger">
              <Trash2 className="h-4 w-4 mr-2" />
              {deleting ? "Clearing..." : "Clear Users"}
            </Button>
          </div>
        </div>

        {/* Users List */}
        <Card className="border-border shadow-sm bg-card">
          <CardHeader className="bg-muted/50">
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <Users className="h-5 w-5 text-primary" />
              Mock Users ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">No users found</p>
                <p className="text-muted-foreground text-sm">Users will appear here after registration</p>
              </div>
            ) : (
              <div className="space-y-4">
                {users.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      {/* Avatar */}
                      <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center shadow-md">
                        <span className="text-sm font-semibold text-primary-foreground">
                          {user.name
                            ? user.name
                                .split(" ")
                                .map(n => n[0])
                                .join("")
                                .toUpperCase()
                            : user.email[0].toUpperCase()}
                        </span>
                      </div>

                      {/* User Info */}
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium text-card-foreground">{user.name || "No name"}</h3>
                          <Badge
                            variant={
                              user.role === "admin"
                                ? "destructive"
                                : user.role === "tradesperson"
                                  ? "secondary"
                                  : user.role === "business_owner"
                                    ? "outline"
                                    : "default"
                            }>
                            {user.role}
                          </Badge>
                          <Badge variant={user.emailVerified ? "default" : "secondary"}>
                            {user.emailVerified ? "Verified" : "Unverified"}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="font-medium">{user.email}</div>
                          <div className="text-xs">
                            ID: <span className="font-mono">{user.id}</span>
                          </div>
                          <div className="text-xs">Created: {new Date(user.createdAt).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-border shadow-sm bg-card">
          <CardHeader className="bg-muted/50">
            <CardTitle className="text-card-foreground">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="secondary"
                onClick={() => window.open("/register", "_blank")}
                className="border-border hover:bg-accent hover:text-accent-foreground justify-between">
                Test Registration
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                onClick={() => window.open("/login", "_blank")}
                className="border-border hover:bg-accent hover:text-accent-foreground justify-between">
                Test Login
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                onClick={() => window.open("/test", "_blank")}
                className="border-border hover:bg-accent hover:text-accent-foreground justify-between">
                View Test Page
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                onClick={() => window.open("/dashboard", "_blank")}
                className="border-border hover:bg-accent hover:text-accent-foreground justify-between">
                Go to Dashboard
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Debug Info */}
        <Alert className="border-primary/20 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription>
            <div className="space-y-3">
              <h4 className="font-medium text-foreground mb-2">Debug Information</h4>
              <div className="text-sm text-muted-foreground space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Mode:</span>
                  <span>Mock (Development)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Storage:</span>
                  <span>In-memory (resets on server restart)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Default Users:</span>
                  <span>user@example.com, admin@example.com</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Console:</span>
                  <span>Check browser console and server logs</span>
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
