"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation"; // <-- 1. Import useSearchParams
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VerifyCertificationActions from "@/components/admin/verify-certification-actions";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { clientLogger } from "@/lib/utils/logger";

interface AdminCertification {
  userId: string;
  userName: string;
  certificationId: string;
  certificationName: string;
  issuingBody: string;
  fileUrl?: string | null;
  metadata?: Record<string, string | null>;
  verified: boolean;
  verification?: {
    method: string;
    reference?: { registrationNumber?: string | null; lookupUrl?: string | null };
  } | null;
  verifiedAt?: string | null;
}

export default function AdminCertificationsPage() {
  const [current, setCurrent] = useState<"pending" | "verified">("pending");
  const [data, setData] = useState<{ pending: AdminCertification[]; verified: AdminCertification[] }>({
    pending: [],
    verified: []
  });
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams(); // <-- 2. Initialize the hook

  const fetchData = async (status: "pending" | "verified") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/certifications?status=${status}`);
      if (!res.ok) throw new Error("Failed to fetch certifications");
      const json = await res.json();
      setData(prev => ({ ...prev, [status]: json.certifications || [] }));
    } catch (err) {
      clientLogger.error(err);
      setData(prev => ({ ...prev, [status]: [] }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(current);
  }, [current, searchParams]); // <-- 3. Add searchParams as a dependency

  const pending = data.pending;
  const verified = data.verified;

  const renderExpiry = (expiry?: string | null) => {
    if (!expiry) return "-";
    const date = new Date(expiry);
    const now = new Date();
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return <span className="text-red-600">{date.toLocaleDateString()} (expired)</span>;
    if (diff <= 30)
      return (
        <span className="text-yellow-600">
          {date.toLocaleDateString()} (in {diff}d)
        </span>
      );
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Certification Management"
        description="Review, verify, and manage uploaded certifications."
      />
      <Tabs value={current} onValueChange={v => setCurrent(v as "pending" | "verified")} className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="verified">Verified</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Certifications ({pending.length})</CardTitle>
              <CardDescription>Certifications awaiting admin review.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Certification</TableHead>
                    <TableHead>Issuing Body</TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : pending.length > 0 ? (
                    pending.map(cert => (
                      <TableRow key={`${cert.userId}-${cert.certificationId}`}>
                        <TableCell>{cert.userName}</TableCell>
                        <TableCell>{cert.certificationName || "-"}</TableCell>
                        <TableCell>{cert.issuingBody}</TableCell>
                        <TableCell>
                          {cert.fileUrl ? (
                            <Link href={cert.fileUrl} target="_blank" className="text-blue-600 underline">
                              View
                            </Link>
                          ) : (
                            "No file"
                          )}
                        </TableCell>
                        <TableCell>{renderExpiry(cert.metadata?.expiryDate)}</TableCell>
                        <TableCell>Pending</TableCell>
                        <TableCell className="text-right">
                          <VerifyCertificationActions userId={cert.userId} certId={cert.certificationId} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        All certifications are verified.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="verified">
          <Card>
            <CardHeader>
              <CardTitle>Verified Certifications ({verified.length})</CardTitle>
              <CardDescription>Previously approved certifications.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Certification</TableHead>
                    <TableHead>Issuing Body</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : verified.length > 0 ? (
                    verified.map(cert => (
                      <TableRow key={`${cert.userId}-${cert.certificationId}`}>
                        <TableCell>{cert.userName}</TableCell>
                        <TableCell>{cert.certificationName || "-"}</TableCell>
                        <TableCell>{cert.issuingBody}</TableCell>
                        <TableCell>
                          <div className="flex flex-col items-start">
                            <span>{cert.verification?.method || "-"}</span>
                            {cert.verification?.reference?.lookupUrl && (
                              <Link
                                href={cert.verification.reference.lookupUrl}
                                target="_blank"
                                className="text-blue-600 underline text-xs">
                                Lookup
                              </Link>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{renderExpiry(cert.metadata?.expiryDate)}</TableCell>
                        <TableCell className="text-right">
                          <VerifyCertificationActions
                            userId={cert.userId}
                            certId={cert.certificationId}
                            approveLabel="Re-check"
                            rejectLabel="Revoke"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No verified certifications.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
