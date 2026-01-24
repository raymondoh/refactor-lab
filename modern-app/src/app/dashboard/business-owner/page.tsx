// src/app/dashboard/business-owner/page.tsx
import Link from "next/link";
import { requireSession } from "@/lib/auth/require-session";
import type { CustomerRecord } from "@/lib/types/business-owner";
import { teamService } from "@/lib/services/team-service";
import { inventoryService } from "@/lib/services/inventory-service";
import { customerService } from "@/lib/services/customer-service";
import { userService } from "@/lib/services/user-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PerformanceTrendsChart } from "./_components/performance-trends-chart";
import { Users, Boxes, LineChart, Contact, Heart, Star } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import ManageSubscriptionButton from "@/components/subscriptions/manage-subscription-button";
import { formatDateGB } from "@/lib/utils/format-date";
import { logger } from "@/lib/logger";

const LOW_STOCK_THRESHOLD = 5;
const currencyFormatter = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

type MonthlyPerformanceDatum = {
  label: string;
  revenue: number;
  newCustomers: number;
};

function normalizeDate(value?: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value?: Date | string | null) {
  const date = normalizeDate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(date);
}

function buildMonthlyPerformance(customers: CustomerRecord[], months: number = 6): MonthlyPerformanceDatum[] {
  const reference = new Date();
  reference.setHours(0, 0, 0, 0);

  const monthKeys: string[] = [];
  const monthLabels: Record<string, string> = {};
  const monthStats: Record<string, MonthlyPerformanceDatum> = {};

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const date = new Date(reference.getFullYear(), reference.getMonth() - offset, 1);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    monthKeys.push(key);
    monthLabels[key] = new Intl.DateTimeFormat("en-GB", { month: "short" }).format(date);
    monthStats[key] = {
      label: monthLabels[key],
      revenue: 0,
      newCustomers: 0
    };
  }

  customers.forEach(customer => {
    const createdAt = normalizeDate(customer.createdAt);
    if (createdAt) {
      const key = `${createdAt.getFullYear()}-${createdAt.getMonth()}`;
      if (monthStats[key]) {
        monthStats[key].newCustomers += 1;
      }
    }

    customer.interactionHistory.forEach(interaction => {
      const interactionDate = normalizeDate(interaction.createdAt);
      if (!interactionDate || typeof interaction.amount !== "number") {
        return;
      }
      const key = `${interactionDate.getFullYear()}-${interactionDate.getMonth()}`;
      if (monthStats[key]) {
        monthStats[key].revenue += interaction.amount;
      }
    });
  });

  return monthKeys.map(key => monthStats[key]);
}

export default async function BusinessOwnerDashboardPage() {
  const session = await requireSession();

  // 🔍 DEBUGGING LOGS (Remove after fixing)
  console.log("--- DEBUG BUSINESS DASHBOARD ---");
  console.log("User ID:", session.user.id);
  console.log("Firestore Role:", session.user.role);
  console.log("Firestore Tier:", session.user.subscriptionTier);
  console.log("Computed Effective Tier:", session.user.subscriptionTier ?? "basic");
  console.log("--------------------------------");

  logger.info("Rendering Business Owner Dashboard for user ID: %s", session.user.id);
  const ownerId = session.user.id;
  const effectiveTier = session.user.subscriptionTier ?? "basic";

  // ⚡️ OPTIMIZATION: Fetch user profile in parallel with other data
  const [teamMembers, inventoryItems, customers, favoritingCustomers, rawUser] = await Promise.all([
    teamService.listMembers(ownerId),
    inventoryService.listItems(ownerId),
    customerService.listCustomers(ownerId),
    userService.getCustomersWhoFavorited(ownerId),
    userService.getUserById(ownerId)
  ]);

  if (!rawUser) return <div>User not found</div>;

  // 🧹 CLEANUP: Use the new service method
  const user = await userService.ensureSubscriptionDates(rawUser);

  // --- Subscription Date Logic ---
  const subscriptionStatus = user.subscriptionStatus ?? null;
  const cancelAtPeriodEnd = Boolean(user.stripeCancelAtPeriodEnd);
  const currentPeriodEndLabel = user.stripeCurrentPeriodEnd ? formatDateGB(user.stripeCurrentPeriodEnd) : null;

  const totalTeamMembers = teamMembers.length;
  const activeMembers = teamMembers.filter(member => member.active).length;
  const totalAssignedJobs = teamMembers.reduce((total, member) => total + member.assignedJobs.length, 0);

  const lowStockItems = inventoryItems.filter(item => {
    const quantity = item.quantity ?? 0;
    const reorderLevel = item.reorderLevel ?? LOW_STOCK_THRESHOLD;
    const threshold = Math.max(reorderLevel, LOW_STOCK_THRESHOLD);
    return quantity <= threshold;
  });

  const totalInventoryValue = inventoryItems.reduce(
    (total, item) => total + (item.unitCost ?? 0) * (item.quantity ?? 0),
    0
  );

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const upcomingFollowUps = customers
    .flatMap(customer =>
      customer.interactionHistory.map(interaction => ({
        customer,
        interaction,
        followUpDate: normalizeDate(interaction.followUpDate)
      }))
    )
    .filter(entry => entry.followUpDate && entry.followUpDate >= startOfToday)
    .sort(
      (a, b) =>
        (a.followUpDate?.getTime() ?? Number.POSITIVE_INFINITY) -
        (b.followUpDate?.getTime() ?? Number.POSITIVE_INFINITY)
    )
    .slice(0, 3);

  const busiestTechnicians = [...teamMembers].sort((a, b) => b.assignedJobs.length - a.assignedJobs.length).slice(0, 5);

  const recentCustomers = [...customers]
    .sort((a, b) => (normalizeDate(b.updatedAt)?.getTime() ?? 0) - (normalizeDate(a.updatedAt)?.getTime() ?? 0))
    .slice(0, 5);

  const totalCustomers = customers.length;
  const totalFavorites = favoritingCustomers.length;
  const newFavoritesThisWeek = favoritingCustomers.filter(customer => {
    const addedAt = normalizeDate(customer.updatedAt) ?? normalizeDate(customer.createdAt);
    if (!addedAt) return false;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return addedAt >= weekAgo;
  }).length;
  const monthlyPerformance = buildMonthlyPerformance(customers);

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="Business Operations Hub"
        description="Track your team, inventory, and customer relationships from one central place."
      />

      <div className="flex items-center gap-3">
        {(effectiveTier === "pro" || effectiveTier === "basic") && (
          <Link href="/pricing?plan=business">
            <Button size="sm">Upgrade to Business</Button>
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeamMembers}</div>
            <p className="text-xs text-muted-foreground">
              {activeMembers} active · {totalAssignedJobs} jobs assigned
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Threshold ≤{LOW_STOCK_THRESHOLD} units across {inventoryItems.length} SKUs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Contact className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">{upcomingFollowUps.length} follow-ups scheduled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Inventory Value</CardTitle>
            <LineChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currencyFormatter.format(totalInventoryValue)}</div>
            <p className="text-xs text-muted-foreground">Based on recorded unit costs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Favorites</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFavorites}</div>
            <p className="text-xs text-muted-foreground">{newFavoritesThisWeek} new this week</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>Track revenue momentum and new customer acquisition over time.</CardDescription>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link href="/dashboard/business-owner/customers">Log customer activity</Link>
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          <PerformanceTrendsChart data={monthlyPerformance} />
          <p className="text-xs text-muted-foreground">
            Revenue is calculated from recorded customer interactions. Add job values to build a richer history.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Team Capacity Overview</CardTitle>
              <CardDescription>Monitor workload distribution across your technicians.</CardDescription>
            </div>
            <Button asChild variant="secondary" size="sm">
              <Link href="/dashboard/business-owner/team">Manage team</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {teamMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground">You have not added any team members yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Technician Name</TableHead>
                    <TableHead className="text-right">Assigned Jobs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {busiestTechnicians.map(member => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell className="text-right">{member.assignedJobs.length}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Customer Follow-ups</CardTitle>
            <CardDescription>Stay on top of repeat work and customer check-ins.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingFollowUps.length === 0 ? (
              <p className="text-sm text-muted-foreground">No follow-ups scheduled.</p>
            ) : (
              upcomingFollowUps.map(({ customer, interaction, followUpDate }) => (
                <div key={interaction.id} className="rounded-md border border-border p-3">
                  <p className="text-sm font-semibold">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">Due {formatDate(followUpDate)}</p>
                  {interaction.note ? <p className="mt-2 text-sm">{interaction.note}</p> : null}
                </div>
              ))
            )}
            <Button asChild variant="secondary" className="w-full">
              <Link href="/dashboard/business-owner/customers">View customer records</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* --- SUBSCRIPTION CARD (Pro/Business only) --- */}
        {effectiveTier !== "basic" && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Manage Subscription
              </CardTitle>
              <CardDescription>
                Change plan, downgrade, cancel, update payment method, and view invoices via Stripe.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ManageSubscriptionButton className="w-full" />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Customer Activity</CardTitle>
              <CardDescription>Review the latest updates across your client base.</CardDescription>
            </div>
            <Button asChild size="sm">
              <Link href="/dashboard/business-owner/customers">Manage customers</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {totalCustomers === 0 ? (
              <p className="text-sm text-muted-foreground">No customer records yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Assigned Jobs</TableHead>
                    <TableHead className="text-right">Total Spend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentCustomers.map(customer => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{formatDate(customer.updatedAt)}</TableCell>
                      <TableCell className="text-right">{customer.totalJobs}</TableCell>
                      <TableCell className="text-right">{currencyFormatter.format(customer.totalSpend ?? 0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      {/* --- SUBSCRIPTION DETAILS CARD --- */}
      {effectiveTier !== "basic" && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Subscription Status</CardTitle>
            <CardDescription className="text-sm">
              Current Plan: <span className="font-medium capitalize">{effectiveTier}</span> • Status:{" "}
              <span className="font-medium capitalize">{subscriptionStatus ?? "—"}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            {cancelAtPeriodEnd ? (
              <p>
                Your plan is set to cancel and will stay active until{" "}
                <span className="font-medium text-foreground">
                  {currentPeriodEndLabel ?? "the end of the billing period"}
                </span>
                .
              </p>
            ) : currentPeriodEndLabel ? (
              <p>
                Renews on <span className="font-medium text-foreground">{currentPeriodEndLabel}</span>.
              </p>
            ) : (
              <p>Billing cycle info unavailable.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
