import type { TeamMember, InventoryItem, CustomerRecord } from "@/lib/types/business-owner";

describe("business owner services (mock)", () => {
  const ownerId = "owner-test";

  beforeEach(() => {
    jest.resetModules();
    process.env.NEXT_PUBLIC_APP_MODE = "mock";
  });

  afterEach(() => {
    delete (global as { mockTeams?: TeamMember[] }).mockTeams;
    delete (global as { mockInventory?: InventoryItem[] }).mockInventory;
    delete (global as { mockCustomers?: CustomerRecord[] }).mockCustomers;
  });

  it("manages team members and assignments", async () => {
    const { teamService } = await import("@/lib/services/team-service");

    const created = await teamService.createMember(ownerId, {
      name: "Alex Rivers",
      role: "Lead Engineer",
      email: "alex@example.com"
    });

    expect(created.id).toBeDefined();
    expect(created.active).toBe(true);

    await teamService.assignJob(ownerId, created.id, "job-123");

    await teamService.updateMember(ownerId, created.id, { active: false, phone: "01234 567890" });

    const afterUpdate = await teamService.listMembers(ownerId);
    expect(afterUpdate).toHaveLength(1);
    expect(afterUpdate[0].assignedJobs).toContain("job-123");
    expect(afterUpdate[0].active).toBe(false);
    expect(afterUpdate[0].phone).toBe("01234 567890");

    await teamService.deleteMember(ownerId, created.id);
    const finalState = await teamService.listMembers(ownerId);
    expect(finalState).toHaveLength(0);
  });

  it("tracks inventory adjustments", async () => {
    const { inventoryService } = await import("@/lib/services/inventory-service");

    const created = await inventoryService.createItem(ownerId, {
      name: "Copper Pipe 22mm",
      sku: "CP-22",
      quantity: 10,
      reorderLevel: 4,
      unitCost: 7.5
    });

    expect(created.quantity).toBe(10);

    await inventoryService.adjustQuantity(ownerId, created.id, -3);
    await inventoryService.updateItem(ownerId, created.id, { notes: "Restock scheduled" });

    const items = await inventoryService.listItems(ownerId);
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(7);
    expect(items[0].notes).toBe("Restock scheduled");

    await inventoryService.deleteItem(ownerId, created.id);
    expect(await inventoryService.listItems(ownerId)).toHaveLength(0);
  });

  it("records customer interactions", async () => {
    const { customerService } = await import("@/lib/services/customer-service");

    const created = await customerService.createCustomer(ownerId, {
      name: "Greenfield Apartments",
      email: "manager@greenfield.test"
    });

    await customerService.recordInteraction(ownerId, created.id, {
      note: "Completed annual boiler service",
      jobId: "job-200",
      amount: 180,
      followUpDate: new Date("2024-03-10T00:00:00.000Z"),
      createdBy: "Test User"
    });

    await customerService.updateCustomer(ownerId, created.id, { phone: "0207 123 4567", totalJobs: 5, totalSpend: 900 });

    const customers = await customerService.listCustomers(ownerId);
    expect(customers).toHaveLength(1);
    expect(customers[0].totalJobs).toBe(5);
    expect(customers[0].totalSpend).toBe(900);
    expect(customers[0].interactionHistory).toHaveLength(1);
    expect(customers[0].interactionHistory[0].note).toContain("annual boiler service");
    expect(customers[0].interactionHistory[0].followUpDate).toBeInstanceOf(Date);
    expect(customers[0].interactionHistory[0].followUpDate?.toISOString()).toBe("2024-03-10T00:00:00.000Z");

    await customerService.deleteCustomer(ownerId, created.id);
    expect(await customerService.listCustomers(ownerId)).toHaveLength(0);
  });
});
