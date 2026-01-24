// src/components/dashboard/profile-completeness-card.tsx
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle } from "lucide-react";

interface ProfileCompletenessCardProps {
  completeness: number;
  missingFields: string[];
  optionalFields?: string[];
  profileEditUrl: string;
  title: string;
  description: string;
}

export function ProfileCompletenessCard({
  completeness,
  missingFields,
  optionalFields = [],
  profileEditUrl,
  title,
  description
}: ProfileCompletenessCardProps) {
  if (completeness >= 100) {
    return null;
  }

  return (
    <Card className="border-amber-300/50 bg-amber-50 dark:bg-amber-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
          <AlertTriangle className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription className="text-amber-900/80 dark:text-amber-200/80">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm text-amber-900 dark:text-amber-200">
          <span className="font-medium">Profile Completeness</span>
          <span className="font-bold">{completeness}%</span>
        </div>
        <Progress value={completeness} className="h-2 [&>div]:bg-amber-500" />

        {(missingFields.length > 0 || optionalFields.length > 0) && (
          <div className="space-y-2 text-amber-900/90 dark:text-amber-200/90">
            {missingFields.length > 0 && (
              <div className="text-sm">
                <span className="font-semibold">Still needed:</span>{" "}
                <span className="opacity-90">{missingFields.join(", ")}</span>
              </div>
            )}
            {optionalFields.length > 0 && (
              <div className="text-xs opacity-80">Optional: {optionalFields.join(", ")}</div>
            )}
          </div>
        )}

        <div>
          <Button asChild>
            <Link href={profileEditUrl}>Update Profile</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
