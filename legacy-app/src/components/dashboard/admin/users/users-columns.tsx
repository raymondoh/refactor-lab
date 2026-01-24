// Updated getUserColumns file
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Shield, ShieldAlert, ShieldCheck, UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/utils/date";
import type { SerializedUser } from "@/types/user/common";
import { UserRowActions } from "./UserRowActions";
import { UserAvatar } from "@/components/shared/UserAvatar";

type UserColumnActions = {
  onView?: (id: string) => void;
  onRefreshData?: () => void;
};

function getRoleIcon(role: string | undefined) {
  switch (role) {
    case "admin":
      return <ShieldAlert className="h-4 w-4 text-destructive" />;
    case "moderator":
      return <ShieldCheck className="h-4 w-4 text-yellow-500" />;
    case "support":
      return <Shield className="h-4 w-4 text-muted-foreground" />;
    default:
      return <UserIcon className="h-4 w-4 text-muted-foreground" />;
  }
}

function RegisteredHeader({ column }: { column: any }) {
  return (
    <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
      Registered
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
}

export function getUserColumns({ onView, onRefreshData }: UserColumnActions): ColumnDef<SerializedUser>[] {
  return [
    {
      accessorKey: "name",
      header: "User",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full hover:ring-2 hover:ring-gray-700">
              <UserAvatar src={user?.image} name={user?.name} email={user?.email} className="h-10 w-10" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium truncate max-w-[160px]">
                {user.name || user.username || user.email?.split("@")[0] || "Unknown"}
              </span>
              <span className="text-xs text-muted-foreground truncate max-w-[160px]">{user.email}</span>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = (row.getValue("role") as string) || "user";
        return (
          <div className="flex items-center gap-2">
            {getRoleIcon(role)}
            <Badge variant={role === "admin" ? "destructive" : role === "moderator" ? "outline" : "secondary"}>
              {role}
            </Badge>
          </div>
        );
      }
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = (row.getValue("status") as string) || "active";
        return (
          <Badge variant={status === "active" ? "default" : status === "disabled" ? "destructive" : "outline"}>
            {status}
          </Badge>
        );
      }
    },
    {
      accessorKey: "createdAt",
      header: RegisteredHeader,
      cell: ({ row }) => {
        const date = row.original.createdAt;
        return <span className="text-muted-foreground text-sm">{date ? formatDate(date) : "Unknown"}</span>;
      }
    },
    {
      accessorKey: "lastLoginAt",
      header: "Last Login",
      cell: ({ row }) => {
        const date = row.original.lastLoginAt;
        return (
          <span className="text-muted-foreground text-sm">{date ? formatDate(date, { relative: true }) : "N/A"}</span>
        );
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="text-right">
            <UserRowActions user={user} onActionSuccess={onRefreshData} onView={onView} />
          </div>
        );
      }
    }
  ];
}

// Don't forget to apply `className={getUserRowClass(user)}` in your TableRow!
export function getUserRowClass(user: SerializedUser) {
  if (user.role === "admin") return "bg-destructive/10";
  if (user.role === "moderator") return "bg-yellow-100/10";
  if (user.status === "disabled") return "opacity-60";
  return "";
}
