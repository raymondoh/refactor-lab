import { requireSession } from "@/lib/auth/require-session";
import { customerService } from "@/lib/services/customer-service";
import { CustomerRecordsPanel } from "../_components/customer-records-panel";
import {
  createCustomerRecordAction,
  updateCustomerRecordAction,
  recordCustomerInteractionAction,
  deleteCustomerRecordAction
} from "../actions";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export default async function BusinessOwnerCustomersPage() {
  const session = await requireSession();
  const customers = await customerService.listCustomers(session.user.id);

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Customer Records"
        description="Build a repeat business pipeline with detailed notes and service history."
      />

      <CustomerRecordsPanel
        customers={customers}
        onCreateCustomer={createCustomerRecordAction}
        onUpdateCustomer={updateCustomerRecordAction}
        onRecordInteraction={recordCustomerInteractionAction}
        onDeleteCustomer={deleteCustomerRecordAction}
      />
    </div>
  );
}
