import type { Certification } from "@/lib/types/certification";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, ShieldCheck, FileText } from "lucide-react";

interface CertificationListProps {
  certifications: Certification[];
}

export default function CertificationList({ certifications }: CertificationListProps) {
  if (!certifications || certifications.length === 0) {
    return null; // Don't render anything if there are no certifications
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
          {certifications.map(cert => (
            <li key={cert.id} className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-semibold">{cert.name}</p>
                <p className="text-sm text-muted-foreground">Issued by: {cert.issuingBody}</p>
              </div>
              <div className="flex items-center gap-2">
                {cert.fileUrl && (
                  <a
                    href={cert.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    View
                  </a>
                )}
                {cert.verified && (
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800">
                    <ShieldCheck className="h-4 w-4 mr-1.5" />
                    Verified
                  </Badge>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
