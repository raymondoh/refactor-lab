// src/componenents/admin/user-table.tsx
"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import type { User } from "@/lib/types/user";
import { formatDateGB, getInitials } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EditUserDialog } from "@/components/admin/edit-user-dialog";
import { PromoteUserDialog } from "@/components/admin/promote-user-dialog";
import { DeleteUserButton } from "@/components/admin/delete-user-button";
import { SuspendUserButton } from "@/components/admin/suspend-user-button";
import SubscriptionBadge from "@/components/subscriptions/subscription-badge";
import type { Tier } from "@/lib/subscription/tier";
import { FeatureUserButton } from "./feature-user-button";

type SortKey = "name" | "email" | "role" | "createdAt";
type RoleFilterValue = "all" | "admin" | "tradesperson" | "customer" | "business_owner" | "manager";

export function UserTable({ users }: { users: User[] }) {
  const [filter, setFilter] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" } | null>(null);
  const [roleFilter, setRoleFilter] = useState<RoleFilterValue>("all");

  const handleSort = (key: SortKey) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const filteredUsers = users
    .filter(user => {
      const name = user.name?.toLowerCase() || `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
      const email = user.email?.toLowerCase() || "";
      const matchesQuery = name.includes(filter.toLowerCase()) || email.includes(filter.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      return matchesQuery && matchesRole;
    })
    .sort((a, b) => {
      if (!sortConfig) return 0;

      const aValue = a[sortConfig.key] ?? "";
      const bValue = b[sortConfig.key] ?? "";

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <Input
          placeholder="Filter by name or email..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="md:max-w-xs"
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Role</span>
          <Select value={roleFilter} onValueChange={value => setRoleFilter(value as RoleFilterValue)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="tradesperson">Tradespeople</SelectItem>
              <SelectItem value="customer">Customers</SelectItem>
              <SelectItem value="business_owner">Business owners</SelectItem>
              <SelectItem value="manager">Managers</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="rounded-md border">
        <div className="relative w-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => handleSort("name")} className="cursor-pointer">
                  <div className="flex items-center">
                    User
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("email")} className="cursor-pointer">
                  <div className="flex items-center">
                    Email
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("role")} className="cursor-pointer">
                  <div className="flex items-center">
                    Role
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead onClick={() => handleSort("createdAt")} className="cursor-pointer">
                  <div className="flex items-center">
                    Joined
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Avatar>
                        <AvatarImage src={user.image || ""} />
                        <AvatarFallback>{getInitials(user.name || user.email || "")}</AvatarFallback>
                      </Avatar>
                      <span>{user.name || `${user.firstName} ${user.lastName}`}</span>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Badge variant={user.isFeatured ? "default" : user.disabled ? "destructive" : "secondary"}>
                        {user.isFeatured ? "Featured" : user.disabled ? "Suspended" : user.role}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <SubscriptionBadge tier={(user.subscriptionTier ?? "basic") as Tier} />
                  </TableCell>
                  <TableCell>{formatDateGB(user.createdAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="subtle" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={e => e.preventDefault()} className="p-0">
                          <EditUserDialog user={user} />
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={e => e.preventDefault()} className="p-0">
                          <PromoteUserDialog user={user} />
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {/* Add the feature button to the dropdown */}
                        <FeatureUserButton user={user} />
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={e => e.preventDefault()} className="p-0">
                          <SuspendUserButton user={user} />
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={e => e.preventDefault()} className="p-0">
                          <DeleteUserButton userId={user.id} />
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
