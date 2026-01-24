"use client";

import React, { useState, useEffect } from "react";
import { Download, FileJson, FileText, Clock, CheckCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useActionState } from "react";
import { exportUserData } from "@/actions/data-privacy";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";

export function DataExport() {
  const [lastExport, setLastExport] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [state, formAction, isPending] = useActionState(exportUserData, null);

  useEffect(() => {
    if (state) {
      if (state.success && state.downloadUrl) {
        setLastExport(new Date().toISOString());
        setDownloadUrl(state.downloadUrl);

        toast.success(state.message || "Data export successful", {
          description: "Click the download button to save your data",
          duration: 5000
        });
      } else if (state.error) {
        const message = isFirebaseError(state.error) ? firebaseError(state.error) : state.error || "Export failed";
        toast.error(message);
      }
    }
  }, [state]);

  const handleExport = (format: string) => {
    const formData = new FormData();
    formData.append("format", format);
    React.startTransition(() => {
      formAction(formData);
    });
  };
  const downloadFile = () => {
    if (!downloadUrl) return;

    const urlParts = downloadUrl.split("/");
    const suggestedFilename = urlParts[urlParts.length - 1].split("?")[0];
    const fileExtension = suggestedFilename.includes(".json") ? "json" : "csv";
    const filename = `user-data-export-${new Date().toISOString().split("T")[0]}.${fileExtension}`;

    try {
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", filename);
      link.setAttribute("target", "_blank"); // fallback for Safari, etc.
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Download started");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to start download.");
    }
  };

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader>
        <CardTitle>Export Your Data</CardTitle>
        <CardDescription>Download a copy of your personal data in various formats</CardDescription>
      </CardHeader>

      <CardContent>
        {state?.success && downloadUrl && (
          <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <div className="flex flex-col space-y-2 w-full">
              <AlertDescription>Your data is ready for download!</AlertDescription>
              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <Button onClick={downloadFile} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                  <Download className="mr-2 h-4 w-4" />
                  Download File
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-green-600 text-green-700"
                  onClick={() => window.open(downloadUrl, "_blank")}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in Browser
                </Button>
              </div>
            </div>
          </Alert>
        )}

        <Tabs defaultValue="json" className="w-full">
          <TabsList className="mb-4 w-full sm:w-auto">
            <TabsTrigger value="json" className="flex-1 sm:flex-initial px-4">
              JSON
            </TabsTrigger>
            <TabsTrigger value="csv" className="flex-1 sm:flex-initial px-4">
              CSV
            </TabsTrigger>
          </TabsList>

          <TabsContent value="json" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-lg border p-4">
              <div className="rounded-full bg-primary/10 p-2 w-fit">
                <FileJson className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">JSON Format</h3>
                <p className="text-sm text-muted-foreground">
                  Export your data in JSON format, suitable for importing into other applications.
                </p>
              </div>
            </div>
            <Button onClick={() => handleExport("json")} disabled={isPending} className="gap-2 w-full sm:w-auto">
              {isPending ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export as JSON
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="csv" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-lg border p-4">
              <div className="rounded-full bg-primary/10 p-2 w-fit">
                <FileText className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">CSV Format</h3>
                <p className="text-sm text-muted-foreground">
                  Export your data in CSV format, suitable for spreadsheet applications.
                </p>
              </div>
            </div>
            <Button onClick={() => handleExport("csv")} disabled={isPending} className="gap-2 w-full sm:w-auto">
              {isPending ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export as CSV
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>

      {lastExport && (
        <CardFooter className="text-sm text-muted-foreground">
          Last export: {new Date(lastExport).toLocaleString()}
        </CardFooter>
      )}
    </Card>
  );
}
