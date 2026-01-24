"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CustomerRecord } from "@/lib/types/business-owner";
import type {
  ActionResponse,
  createCustomerRecordAction,
  updateCustomerRecordAction,
  recordCustomerInteractionAction,
  deleteCustomerRecordAction
} from "@/app/dashboard/business-owner/actions";
import { Pagination } from "@/components/ui/pagination";
import { formatDateGB } from "@/lib/utils/format-date";

const DEFAULT_CUSTOMER_FORM = {
  name: "",
  email: "",
  phone: "",
  lastServiceDate: "",
  notes: ""
};

type ServerAction<T> = (input: T) => Promise<ActionResponse>;

type CustomerRecordsPanelProps = {
  customers: CustomerRecord[];
  onCreateCustomer: typeof createCustomerRecordAction;
  onUpdateCustomer: typeof updateCustomerRecordAction;
  onRecordInteraction: typeof recordCustomerInteractionAction;
  onDeleteCustomer: typeof deleteCustomerRecordAction;
};

function formatDate(value?: Date | string | number | null) {
  const result = formatDateGB(value ?? null);
  return result ?? "—";
}

export function CustomerRecordsPanel({
  customers,
  onCreateCustomer,
  onUpdateCustomer,
  onRecordInteraction,
  onDeleteCustomer
}: CustomerRecordsPanelProps) {
  const [newCustomer, setNewCustomer] = useState(DEFAULT_CUSTOMER_FORM);
  const [interactionNotes, setInteractionNotes] = useState<Record<string, string>>({});
  const [interactionFollowUps, setInteractionFollowUps] = useState<Record<string, string>>({});
  const [interactionAmounts, setInteractionAmounts] = useState<Record<string, string>>({});
  const [interactionJobs, setInteractionJobs] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const searchParams = useSearchParams();
  const resetFeedback = () => {
    setMessage(null);
    setError(null);
  };

  const sortedCustomers = [...customers].sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0));
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredCustomers = sortedCustomers.filter(customer => {
    if (!normalizedQuery) return true;
    return [customer.name, customer.email ?? "", customer.phone ?? ""].some(value =>
      value.toLowerCase().includes(normalizedQuery)
    );
  });
  const itemsPerPage = 5;
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / itemsPerPage));
  const rawPage = Number(searchParams.get("page") ?? "1");
  const currentPage = Number.isFinite(rawPage) && rawPage > 0 ? Math.min(Math.floor(rawPage), totalPages) : 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + itemsPerPage);

  const handleServerAction = <T,>(action: ServerAction<T>, payload: T, successMessage: string, reset?: () => void) => {
    resetFeedback();
    startTransition(async () => {
      const result = await action(payload);
      if (result.success) {
        setMessage(result.message ?? successMessage);
        reset?.();
      } else {
        setError(result.error);
      }
    });
  };

  const handleCreateCustomer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newCustomer.name) {
      setError("Customer name is required.");
      return;
    }
    handleServerAction(onCreateCustomer as ServerAction<typeof newCustomer>, newCustomer, "Customer created", () => {
      setNewCustomer(DEFAULT_CUSTOMER_FORM);
    });
  };

  const handleDelete = (customerId: string) => {
    if (!confirm("Remove this customer record?")) return;
    handleServerAction(onDeleteCustomer as ServerAction<string>, customerId, "Customer removed");
  };

  const handleContactUpdate = (customer: CustomerRecord, field: "email" | "phone", value: string) => {
    handleServerAction(
      onUpdateCustomer as ServerAction<{ customerId: string; email?: string; phone?: string }>,
      { customerId: customer.id, [field]: value || undefined },
      "Customer updated"
    );
  };

  const handleRecordInteraction = (customer: CustomerRecord) => {
    const note = interactionNotes[customer.id]?.trim();
    if (!note) {
      setError("Enter notes before logging an interaction.");
      return;
    }
    const payload = {
      customerId: customer.id,
      note,
      followUpDate: interactionFollowUps[customer.id] || undefined,
      jobId: interactionJobs[customer.id] || undefined,
      amount: interactionAmounts[customer.id] ? Number(interactionAmounts[customer.id]) : undefined
    };
    handleServerAction(onRecordInteraction as ServerAction<typeof payload>, payload, "Interaction recorded", () => {
      setInteractionNotes(prev => ({ ...prev, [customer.id]: "" }));
      setInteractionFollowUps(prev => ({ ...prev, [customer.id]: "" }));
      setInteractionAmounts(prev => ({ ...prev, [customer.id]: "" }));
      setInteractionJobs(prev => ({ ...prev, [customer.id]: "" }));
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Database</CardTitle>
        <CardDescription>Centralise client notes, recent work, and follow-up reminders.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-muted-foreground">
            {filteredCustomers.length === 1 ? "1 customer found" : `${filteredCustomers.length} customers found`}
          </div>
          <Input
            placeholder="Search by name, email, or phone"
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            className="w-full md:max-w-sm"
          />
        </div>

        {(message || error) && (
          <div
            className={`rounded-md border px-4 py-2 text-sm ${
              message ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"
            }`}>
            {message ?? error}
          </div>
        )}

        <form onSubmit={handleCreateCustomer} className="grid gap-4 md:grid-cols-5">
          <Input
            name="name"
            placeholder="Customer name"
            value={newCustomer.name}
            onChange={event => setNewCustomer(prev => ({ ...prev, name: event.target.value }))}
            required
          />
          <Input
            name="email"
            placeholder="Email"
            value={newCustomer.email}
            onChange={event => setNewCustomer(prev => ({ ...prev, email: event.target.value }))}
          />
          <Input
            name="phone"
            placeholder="Phone"
            value={newCustomer.phone}
            onChange={event => setNewCustomer(prev => ({ ...prev, phone: event.target.value }))}
          />
          <Input
            name="lastServiceDate"
            type="date"
            value={newCustomer.lastServiceDate}
            onChange={event => setNewCustomer(prev => ({ ...prev, lastServiceDate: event.target.value }))}
          />
          <Input
            name="notes"
            placeholder="Notes"
            value={newCustomer.notes}
            onChange={event => setNewCustomer(prev => ({ ...prev, notes: event.target.value }))}
          />
          <div className="md:col-span-5 flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Add customer"}
            </Button>
          </div>
        </form>

        <div className="space-y-4">
          {filteredCustomers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {sortedCustomers.length === 0 ? "No customers added yet." : "No customers match your search."}
            </p>
          ) : (
            paginatedCustomers.map(customer => {
              const recentInteractions = customer.interactionHistory.slice(-2).reverse();
              return (
                <div key={customer.id} className="rounded-lg border border-border p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{customer.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Last service: {formatDate(customer.lastServiceDate)} · Jobs completed: {customer.totalJobs} ·
                        Lifetime spend: £{customer.totalSpend.toFixed(2)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/5"
                      onClick={() => handleDelete(customer.id)}
                      disabled={isPending}>
                      Remove
                    </Button>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <Input
                      defaultValue={customer.email ?? ""}
                      placeholder="Email"
                      onBlur={event => handleContactUpdate(customer, "email", event.target.value)}
                    />
                    <Input
                      defaultValue={customer.phone ?? ""}
                      placeholder="Phone"
                      onBlur={event => handleContactUpdate(customer, "phone", event.target.value)}
                    />
                    <Input value={`Last update: ${formatDate(customer.updatedAt)}`} readOnly className="bg-muted" />
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <Textarea
                      placeholder="Log a new interaction"
                      value={interactionNotes[customer.id] ?? ""}
                      onChange={event => setInteractionNotes(prev => ({ ...prev, [customer.id]: event.target.value }))}
                      className="md:col-span-2"
                    />
                    <Input
                      type="date"
                      value={interactionFollowUps[customer.id] ?? ""}
                      onChange={event =>
                        setInteractionFollowUps(prev => ({ ...prev, [customer.id]: event.target.value }))
                      }
                      placeholder="Follow-up"
                    />
                    <div className="grid gap-2 md:grid-cols-2">
                      <Input
                        placeholder="Job ID"
                        value={interactionJobs[customer.id] ?? ""}
                        onChange={event => setInteractionJobs(prev => ({ ...prev, [customer.id]: event.target.value }))}
                      />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Amount (£)"
                        value={interactionAmounts[customer.id] ?? ""}
                        onChange={event =>
                          setInteractionAmounts(prev => ({ ...prev, [customer.id]: event.target.value }))
                        }
                      />
                    </div>
                    <div className="md:col-span-4 flex justify-end">
                      <Button type="button" onClick={() => handleRecordInteraction(customer)} disabled={isPending}>
                        Log interaction
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <p className="font-medium">Recent notes</p>
                    {recentInteractions.length === 0 ? (
                      <p className="text-muted-foreground">No interactions recorded yet.</p>
                    ) : (
                      recentInteractions.map(interaction => (
                        <div key={interaction.id} className="rounded-md border border-border p-3">
                          <p>{interaction.note}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Logged on {formatDate(interaction.createdAt)}
                            {interaction.followUpDate ? ` · Follow-up ${formatDate(interaction.followUpDate)}` : ""}
                            {interaction.amount ? ` · Amount £${interaction.amount.toFixed(2)}` : ""}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        {filteredCustomers.length > itemsPerPage && <Pagination currentPage={currentPage} totalPages={totalPages} />}
      </CardContent>
    </Card>
  );
}
