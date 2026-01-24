import type { Certification } from "@/lib/types/certification";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Award } from "lucide-react";
import Link from "next/link";

interface DashboardCertificationListProps {
  certifications: Certification[];
}

function getStatus(cert: Certification) {
  if (cert.verified) return "verified" as const;
  if (cert.verified === false && cert.verifiedAt) return "rejected" as const;
  return "pending" as const;
}

const STATUS_META = {
  pending: {
    label: "Pending",
    className:
      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800",
  },
  verified: {
    label: "Verified",
    className:
      "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800",
  },
  rejected: {
    label: "Rejected",
    className:
      "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800",
  },
};

export default function DashboardCertificationList({
  certifications,
}: DashboardCertificationListProps) {
  if (!certifications || certifications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Certifications & Qualifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You haven’t uploaded any certifications yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Certifications & Qualifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {certifications.map(cert => {
            const status = STATUS_META[getStatus(cert)];
            return (
              <li key={cert.id} className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-semibold">{cert.name || "Untitled"}</p>
                  <p className="text-sm text-muted-foreground">Issued by: {cert.issuingBody}</p>
                </div>
                <div className="flex items-center gap-2">
                  {cert.fileUrl && (
                    <Link
                      href={cert.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <FileText className="h-4 w-4" />
                      View
                    </Link>
                  )}
                  <Badge variant="outline" className={status.className}>
                    {status.label}
                  </Badge>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

