import { fireEvent, render, screen } from "@testing-library/react";
import { CustomerRecordsPanel } from "./customer-records-panel";
import type { CustomerRecord } from "@/lib/types/business-owner";

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams()
}));

const mockAction = jest.fn(async () => ({ success: true as const, message: "ok" }));

const defaultProps = {
  onCreateCustomer: mockAction,
  onUpdateCustomer: mockAction,
  onRecordInteraction: mockAction,
  onDeleteCustomer: mockAction
};

function buildCustomer(overrides: Partial<CustomerRecord>): CustomerRecord {
  return {
    id: "customer-1",
    ownerId: "owner-1",
    name: "Alpha Plumbing",
    email: "alpha@example.com",
    phone: "01234",
    lastServiceDate: new Date("2024-01-01"),
    totalJobs: 2,
    totalSpend: 150,
    notes: "",
    interactionHistory: [],
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2024-01-02"),
    ...overrides
  };
}

describe("CustomerRecordsPanel", () => {
  beforeEach(() => {
    mockAction.mockClear();
  });

  it("filters customers by search query", () => {
    const customers: CustomerRecord[] = [
      buildCustomer({ id: "customer-1", name: "Alpha Plumbing" }),
      buildCustomer({ id: "customer-2", name: "Bravo Heating", phone: "555-123" })
    ];

    render(<CustomerRecordsPanel customers={customers} {...defaultProps} />);

    expect(screen.getByText("Alpha Plumbing")).toBeInTheDocument();
    expect(screen.getByText("Bravo Heating")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Search by name, email, or phone/i), {
      target: { value: "bravo" }
    });

    expect(screen.getByText("Bravo Heating")).toBeInTheDocument();
    expect(screen.queryByText("Alpha Plumbing")).not.toBeInTheDocument();
    expect(screen.getByText("1 customer found")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Search by name, email, or phone/i), {
      target: { value: "555" }
    });

    expect(screen.getByText("Bravo Heating")).toBeInTheDocument();
    expect(screen.queryByText("Alpha Plumbing")).not.toBeInTheDocument();
  });
});

