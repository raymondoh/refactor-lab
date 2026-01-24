import { mockAuthService } from "../mock-auth-service";

describe("MockAuthService", () => {
  beforeEach(() => {
    // Clear the global storage before each test
    (global as any).mockUsers?.clear();
    (global as any).mockUsersInitialized = false;
  });

  describe("createUser", () => {
    it("creates a new user successfully", async () => {
      const user = await mockAuthService.createUser("test@example.com", "password123", "Test User");

      expect(user).toMatchObject({
        email: "test@example.com",
        name: "Test User",
        emailVerified: null,
        role: "admin"
      });
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it("throws error when user already exists", async () => {
      await mockAuthService.createUser("test@example.com", "password123", "Test User");

      await expect(mockAuthService.createUser("test@example.com", "password456", "Another User")).rejects.toThrow(
        "User already exists"
      );
    });
  });

  describe("validateCredentials", () => {
    it("validates existing user credentials", async () => {
      const createdUser = await mockAuthService.createUser("test@example.com", "password123", "Test User");

      const validatedUser = await mockAuthService.validateCredentials("test@example.com", "anypassword");

      expect(validatedUser).toMatchObject({
        id: createdUser.id,
        email: "test@example.com",
        name: "Test User"
      });
    });

    it("returns null for non-existent user", async () => {
      const user = await mockAuthService.validateCredentials("newuser@example.com", "password123");
      expect(user).toBeNull();
    });

    it("returns null for invalid email format", async () => {
      const user = await mockAuthService.validateCredentials("invalid-email", "password123");
      expect(user).toBeNull();
    });
  });

  describe("getUserById", () => {
    it("returns user by ID", async () => {
      const createdUser = await mockAuthService.createUser("test@example.com", "password123", "Test User");

      const foundUser = await mockAuthService.getUserById(createdUser.id);

      expect(foundUser).toMatchObject({
        id: createdUser.id,
        email: "test@example.com",
        name: "Test User"
      });
    });

    it("returns null for non-existent ID", async () => {
      const user = await mockAuthService.getUserById("non-existent-id");
      expect(user).toBeNull();
    });
  });

  describe("getUserByEmail", () => {
    it("returns user by email", async () => {
      const createdUser = await mockAuthService.createUser("test@example.com", "password123", "Test User");

      const foundUser = await mockAuthService.getUserByEmail("test@example.com");

      expect(foundUser).toMatchObject({
        id: createdUser.id,
        email: "test@example.com",
        name: "Test User"
      });
    });

    it("returns null for non-existent email", async () => {
      const user = await mockAuthService.getUserByEmail("nonexistent@example.com");
      expect(user).toBeNull();
    });
  });

  describe("updateUser", () => {
    it("updates user successfully", async () => {
      const createdUser = await mockAuthService.createUser("test@example.com", "password123", "Test User");

      const updatedUser = await mockAuthService.updateUser(createdUser.id, {
        name: "Updated Name"
      });

      expect(updatedUser).toMatchObject({
        id: createdUser.id,
        email: "test@example.com",
        name: "Updated Name"
      });
      expect(updatedUser?.updatedAt!.getTime()).toBeGreaterThanOrEqual(createdUser.updatedAt!.getTime());
    });

    it("returns null for non-existent user", async () => {
      const result = await mockAuthService.updateUser("non-existent-id", { name: "New Name" });
      expect(result).toBeNull();
    });
  });

  describe("verifyUserEmail", () => {
    it("verifies user email successfully", async () => {
      await mockAuthService.createUser("test@example.com", "password123", "Test User");

      const result = await mockAuthService.verifyUserEmail("test@example.com");
      expect(result).toBe(true);

      const user = await mockAuthService.getUserByEmail("test@example.com");
      expect(user?.emailVerified).toBeTruthy();
    });

    it("returns false for non-existent email", async () => {
      const result = await mockAuthService.verifyUserEmail("nonexistent@example.com");
      expect(result).toBe(false);
    });
  });

  describe("deleteUser", () => {
    it("deletes user successfully", async () => {
      const createdUser = await mockAuthService.createUser("test@example.com", "password123", "Test User");

      const result = await mockAuthService.deleteUser(createdUser.id);
      expect(result).toBe(true);

      const deletedUser = await mockAuthService.getUserById(createdUser.id);
      expect(deletedUser).toBeNull();
    });

    it("returns false for non-existent user", async () => {
      const result = await mockAuthService.deleteUser("non-existent-id");
      expect(result).toBe(false);
    });
  });
});
