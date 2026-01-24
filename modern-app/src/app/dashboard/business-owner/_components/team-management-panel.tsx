"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { TeamMember } from "@/lib/types/business-owner";
import type { ActionResponse } from "@/app/dashboard/business-owner/actions";

const DEFAULT_MEMBER_FORM = { name: "", role: "", email: "", phone: "" };

type ServerAction<T> = (input: T) => Promise<ActionResponse>;

type TeamManagementPanelProps = {
  members: TeamMember[];
  onCreateMember: (input: typeof DEFAULT_MEMBER_FORM) => Promise<ActionResponse>;
  onUpdateMember: (input: { memberId: string; active: boolean }) => Promise<ActionResponse>;
  onAssignJob: (input: { memberId: string; jobId: string }) => Promise<ActionResponse>;
  onDeleteMember: (memberId: string) => Promise<ActionResponse>;
};

export function TeamManagementPanel({
  members,
  onCreateMember,
  onUpdateMember,
  onAssignJob,
  onDeleteMember
}: TeamManagementPanelProps) {
  const [newMember, setNewMember] = useState(DEFAULT_MEMBER_FORM);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sortedMembers = useMemo(() => [...members].sort((a, b) => a.name.localeCompare(b.name)), [members]);

  const resetFeedback = () => {
    setMessage(null);
    setError(null);
  };

  const handleServerAction = <T,>(action: ServerAction<T>, payload: T, successMessage: string, reset?: () => void) => {
    resetFeedback();
    startTransition(() => {
      (async () => {
        const result = await action(payload);
        if (result.success) {
          setMessage(result.message ?? successMessage);
          reset?.();
        } else {
          setError(result.error);
        }
      })();
    });
  };

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newMember.name || !newMember.role) {
      setError("Name and role are required.");
      return;
    }
    handleServerAction(onCreateMember as ServerAction<typeof newMember>, newMember, "Team member created", () => {
      setNewMember(DEFAULT_MEMBER_FORM);
    });
  };

  const handleAssign = (memberId: string) => {
    const jobId = assignments[memberId]?.trim();
    if (!jobId) {
      setError("Enter a job ID before assigning.");
      return;
    }
    handleServerAction(
      onAssignJob as ServerAction<{ memberId: string; jobId: string }>,
      { memberId, jobId },
      "Job assigned",
      () => {
        setAssignments(prev => ({ ...prev, [memberId]: "" }));
      }
    );
  };

  const handleToggleActive = (member: TeamMember) => {
    handleServerAction(
      onUpdateMember as ServerAction<{ memberId: string; active: boolean }>,
      { memberId: member.id, active: !member.active },
      "Team member updated"
    );
  };

  const handleDelete = (memberId: string) => {
    if (!confirm("Remove this team member?")) return;
    handleServerAction(onDeleteMember as ServerAction<string>, memberId, "Team member removed");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Your Team</CardTitle>
        <CardDescription>Add new technicians, toggle availability, and assign work.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {(message || error) && (
          <div
            className={`rounded-md border px-4 py-2 text-sm ${
              message ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"
            }`}>
            {message ?? error}
          </div>
        )}

        <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-4">
          <Input
            name="name"
            placeholder="Full name"
            value={newMember.name}
            onChange={event => setNewMember(prev => ({ ...prev, name: event.target.value }))}
            required
          />
          <Input
            name="role"
            placeholder="Role (e.g. Senior Plumber)"
            value={newMember.role}
            onChange={event => setNewMember(prev => ({ ...prev, role: event.target.value }))}
            required
          />
          <Input
            name="email"
            placeholder="Email"
            value={newMember.email}
            onChange={event => setNewMember(prev => ({ ...prev, email: event.target.value }))}
          />
          <Input
            name="phone"
            placeholder="Phone"
            value={newMember.phone}
            onChange={event => setNewMember(prev => ({ ...prev, phone: event.target.value }))}
          />
          <div className="md:col-span-4 flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Add team member"}
            </Button>
          </div>
        </form>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Assigned Jobs</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    No team members yet.
                  </TableCell>
                </TableRow>
              ) : (
                sortedMembers.map(member => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.role}</TableCell>
                    <TableCell>
                      <Button
                        variant={member.active ? "secondary" : "subtle"}
                        size="sm"
                        type="button"
                        onClick={() => handleToggleActive(member)}
                        disabled={isPending}>
                        {member.active ? "Set inactive" : "Set active"}
                      </Button>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                        {member.assignedJobs.length === 0 ? "—" : member.assignedJobs.join(", ")}
                      </div>
                    </TableCell>
                    <TableCell className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Job ID"
                          value={assignments[member.id] ?? ""}
                          onChange={event => setAssignments(prev => ({ ...prev, [member.id]: event.target.value }))}
                        />
                        <Button type="button" onClick={() => handleAssign(member.id)} disabled={isPending}>
                          Assign
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="subtle"
                        className="text-destructive"
                        onClick={() => handleDelete(member.id)}
                        disabled={isPending}>
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
