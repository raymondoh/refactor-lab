import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NotificationBell from "../notification-bell";
import "@testing-library/jest-dom";

jest.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { id: "user1" } } })
}));

jest.mock("@/lib/firebase/client", () => ({
  getFirebaseDb: jest.fn(() => ({})),
  // Return a mock user so the listener is set up during tests
  ensureFirebaseAuth: jest.fn(() => Promise.resolve({ uid: "user1" }))
}));

const mockOnSnapshot = jest.fn();

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: (...args: any[]) => mockOnSnapshot(...args)
}));

describe("NotificationBell", () => {
  beforeEach(() => {
    mockOnSnapshot.mockImplementation((q, onNext) => {
      onNext({
        forEach: (cb: any) =>
          cb({
            id: "1",
            data: () => ({
              type: "test",
              message: "Hello",
              read: false,
              createdAt: { toDate: () => new Date() }
            })
          })
      });
      return jest.fn();
    });
  });

  it("shows notifications", async () => {
    render(<NotificationBell />);
    await waitFor(() => expect(mockOnSnapshot).toHaveBeenCalled());
    const button = screen.getByRole("button");
    await userEvent.click(button);
    expect(await screen.findByText("Hello")).toBeInTheDocument();
  });
});

