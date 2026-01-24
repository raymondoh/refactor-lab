"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Activity, UserPlus, Calendar } from "lucide-react";
//import { SystemStats } from "@/types/dashboard/activity";
import { Dashboard } from "@/types";

interface SystemOverviewClientProps {
  systemStats: Dashboard.SystemStats;
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center space-x-2 text-muted-foreground">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

export function AdminSystemPreview({ systemStats }: SystemOverviewClientProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Overview</CardTitle>
        <CardDescription>Key metrics about your application</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Total Users" value={systemStats.totalUsers} icon={<Users className="h-5 w-5" />} />
          <StatCard label="Active Users" value={systemStats.activeUsers} icon={<Activity className="h-5 w-5" />} />
          <StatCard label="New Today" value={systemStats.newUsersToday} icon={<UserPlus className="h-5 w-5" />} />
          <StatCard
            label="Total Activities"
            value={systemStats.totalActivities}
            icon={<Calendar className="h-5 w-5" />}
          />
        </div>

        <div className="mt-6 space-y-2">
          <h3 className="text-sm font-medium">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/admin/users"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors h-10">
              Manage Users
            </Link>
            <Link
              href="/admin/activity"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors h-10">
              View all Activity
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
