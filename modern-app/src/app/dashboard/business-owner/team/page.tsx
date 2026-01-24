import { requireSession } from "@/lib/auth/require-session";
import { teamService } from "@/lib/services/team-service";
import { TeamManagementPanel } from "../_components/team-management-panel";
import {
  createTeamMemberAction,
  updateTeamMemberAction,
  assignJobToMemberAction,
  deleteTeamMemberAction
} from "../actions";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export default async function BusinessOwnerTeamPage() {
  const session = await requireSession();
  const members = await teamService.listMembers(session.user.id);

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Team Management"
        description="Invite technicians, toggle availability, and assign work across your business."
      />

      <TeamManagementPanel
        members={members}
        onCreateMember={createTeamMemberAction}
        onUpdateMember={updateTeamMemberAction}
        onAssignJob={assignJobToMemberAction}
        onDeleteMember={deleteTeamMemberAction}
      />
    </div>
  );
}
