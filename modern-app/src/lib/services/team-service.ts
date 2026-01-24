// src/lib/services/team-service.ts
import { config } from "@/lib/config/app-mode";
import { BusinessTeamsCollection } from "@/lib/firebase/admin";
import { logger } from "@/lib/logger";
import type { TeamMember, CreateTeamMemberInput, UpdateTeamMemberInput } from "@/lib/types/business-owner";
import { randomUUID } from "crypto";
import { FieldValue } from "firebase-admin/firestore";

type TeamMemberRecord = Omit<TeamMember, "id" | "createdAt" | "updatedAt"> & {
  createdAt: FirebaseFirestore.Timestamp | Date;
  updatedAt: FirebaseFirestore.Timestamp | Date;
};

interface TeamService {
  listMembers(ownerId: string): Promise<TeamMember[]>;
  createMember(ownerId: string, input: CreateTeamMemberInput): Promise<TeamMember>;
  updateMember(ownerId: string, memberId: string, updates: UpdateTeamMemberInput): Promise<TeamMember>;
  assignJob(ownerId: string, memberId: string, jobId: string): Promise<TeamMember>;
  deleteMember(ownerId: string, memberId: string): Promise<void>;
}

function mapSnapshot(id: string, data: TeamMemberRecord): TeamMember {
  const createdAt = data.createdAt instanceof Date ? data.createdAt : data.createdAt.toDate();
  const updatedAt = data.updatedAt instanceof Date ? data.updatedAt : data.updatedAt.toDate();

  return {
    id,
    ownerId: data.ownerId,
    name: data.name,
    role: data.role,
    email: data.email,
    phone: data.phone,
    active: data.active,
    assignedJobs: data.assignedJobs ?? [],
    certifications: data.certifications ?? [],
    createdAt,
    updatedAt
  };
}

class FirebaseTeamService implements TeamService {
  async listMembers(ownerId: string): Promise<TeamMember[]> {
    const snapshot = await BusinessTeamsCollection().where("ownerId", "==", ownerId).orderBy("createdAt", "asc").get();

    const members = snapshot.docs.map(doc => mapSnapshot(doc.id, doc.data() as TeamMemberRecord));
    // Service returns domain objects with Date fields; API layer can JSON-serialize if needed
    return members;
  }

  async createMember(ownerId: string, input: CreateTeamMemberInput): Promise<TeamMember> {
    const now = new Date();
    const doc = await BusinessTeamsCollection().add({
      ownerId,
      ...input,
      active: true,
      assignedJobs: [],
      createdAt: now,
      updatedAt: now
    });

    const snapshot = await doc.get();
    return mapSnapshot(snapshot.id, snapshot.data() as TeamMemberRecord);
  }

  async updateMember(ownerId: string, memberId: string, updates: UpdateTeamMemberInput): Promise<TeamMember> {
    const ref = BusinessTeamsCollection().doc(memberId);
    const snapshot = await ref.get();

    if (!snapshot.exists) {
      throw new Error("Team member not found");
    }

    const data = snapshot.data() as TeamMemberRecord;
    if (data.ownerId !== ownerId) {
      throw new Error("You do not have permission to update this team member");
    }

    const sanitizedUpdates = { ...updates } as UpdateTeamMemberInput & { updatedAt: Date };
    sanitizedUpdates.updatedAt = new Date();

    await ref.update({ ...sanitizedUpdates });

    const updatedSnapshot = await ref.get();
    return mapSnapshot(updatedSnapshot.id, updatedSnapshot.data() as TeamMemberRecord);
  }

  async assignJob(ownerId: string, memberId: string, jobId: string): Promise<TeamMember> {
    const ref = BusinessTeamsCollection().doc(memberId);
    const snapshot = await ref.get();

    if (!snapshot.exists) {
      throw new Error("Team member not found");
    }

    const data = snapshot.data() as TeamMemberRecord;
    if (data.ownerId !== ownerId) {
      throw new Error("You do not have permission to update this team member");
    }

    await ref.update({
      assignedJobs: FieldValue.arrayUnion(jobId),
      updatedAt: new Date()
    });

    const updatedSnapshot = await ref.get();
    return mapSnapshot(updatedSnapshot.id, updatedSnapshot.data() as TeamMemberRecord);
  }

  async deleteMember(ownerId: string, memberId: string): Promise<void> {
    const ref = BusinessTeamsCollection().doc(memberId);
    const snapshot = await ref.get();
    if (!snapshot.exists) return;

    const data = snapshot.data() as TeamMemberRecord;
    if (data.ownerId !== ownerId) {
      throw new Error("You do not have permission to delete this team member");
    }

    await ref.delete();
  }
}

class MockTeamService implements TeamService {
  private membersByOwner = new Map<string, TeamMember[]>();

  private clone(member: TeamMember): TeamMember {
    return {
      ...member,
      assignedJobs: [...member.assignedJobs],
      certifications: member.certifications ? [...member.certifications] : undefined,
      createdAt: new Date(member.createdAt),
      updatedAt: new Date(member.updatedAt)
    };
  }

  private getCollection(ownerId: string): TeamMember[] {
    if (!this.membersByOwner.has(ownerId)) {
      this.membersByOwner.set(ownerId, []);
    }
    return this.membersByOwner.get(ownerId)!;
  }

  async listMembers(ownerId: string): Promise<TeamMember[]> {
    return this.getCollection(ownerId).map(member => this.clone(member));
  }

  async createMember(ownerId: string, input: CreateTeamMemberInput): Promise<TeamMember> {
    const now = new Date();
    const member: TeamMember = {
      id: randomUUID(),
      ownerId,
      name: input.name,
      role: input.role,
      email: input.email,
      phone: input.phone,
      certifications: input.certifications,
      active: true,
      assignedJobs: [],
      createdAt: now,
      updatedAt: now
    };
    this.getCollection(ownerId).push(member);
    return this.clone(member);
  }

  async updateMember(ownerId: string, memberId: string, updates: UpdateTeamMemberInput): Promise<TeamMember> {
    const members = this.getCollection(ownerId);
    const index = members.findIndex(member => member.id === memberId);
    if (index === -1) throw new Error("Team member not found");

    const existing = members[index];
    const updated: TeamMember = {
      ...existing,
      ...updates,
      assignedJobs: updates.assignedJobs ? [...updates.assignedJobs] : existing.assignedJobs,
      certifications: updates.certifications ?? existing.certifications,
      updatedAt: new Date()
    };

    members[index] = updated;
    return this.clone(updated);
  }

  async assignJob(ownerId: string, memberId: string, jobId: string): Promise<TeamMember> {
    const members = this.getCollection(ownerId);
    const index = members.findIndex(member => member.id === memberId);
    if (index === -1) throw new Error("Team member not found");

    const existing = members[index];
    if (!existing.assignedJobs.includes(jobId)) {
      existing.assignedJobs.push(jobId);
    }
    existing.updatedAt = new Date();
    members[index] = existing;

    return this.clone(existing);
  }

  async deleteMember(ownerId: string, memberId: string): Promise<void> {
    const members = this.getCollection(ownerId);
    const index = members.findIndex(member => member.id === memberId);
    if (index !== -1) {
      members.splice(index, 1);
    }
  }
}

class TeamServiceFactory {
  private static instance: TeamService | null = null;

  static getInstance(): TeamService {
    if (this.instance) return this.instance;

    if (config.isMockMode) {
      logger.info("🔧 TeamServiceFactory: Using MockTeamService");
      this.instance = new MockTeamService();
    } else {
      logger.info("🔧 TeamServiceFactory: Using FirebaseTeamService");
      this.instance = new FirebaseTeamService();
    }

    return this.instance;
  }
}

export const teamService = TeamServiceFactory.getInstance();
export type { TeamService };
