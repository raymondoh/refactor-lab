// src/components/providers/modal-provider.tsx
"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

const PaymentSuccessModal = dynamic(() => import("@/components/modals/payment-success-modal"), { ssr: false });
const SubscriptionCancelledModal = dynamic(() => import("@/components/modals/subscription-cancelled-modal"), {
  ssr: false
});
const JobPostedModal = dynamic(() => import("@/components/modals/job-posted-modal"), { ssr: false });
const QuoteAcceptedModal = dynamic(() => import("@/components/modals/quote-accepted-modal"), { ssr: false });
const QuoteSentModal = dynamic(() => import("@/components/modals/quote-sent-modal"), { ssr: false });
const ProfileSavedModal = dynamic(() => import("@/components/modals/profile-saved-modal"), { ssr: false });
const UserDeletedModal = dynamic(() => import("@/components/modals/user-delete-modal"), { ssr: false });
const ReviewSubmittedModal = dynamic(() => import("@/components/modals/review-submitted-modal"), { ssr: false });
const CertificationStatusUpdatedModal = dynamic(
  () => import("@/components/modals/certification-status-updated-modal"),
  {
    ssr: false
  }
);
const UserRoleUpdatedModal = dynamic(() => import("@/components/modals/user-role-update-modal"), { ssr: false });
const UserStatusUpdatedModal = dynamic(() => import("@/components/modals/user-status-update-modal"), { ssr: false });
const DepositPaidModal = dynamic(() => import("@/components/modals/deposit-paid-modal"), { ssr: false });
const FinalPaymentModal = dynamic(() => import("@/components/modals/final-payment-modal"), { ssr: false });

export default function ModalProvider() {
  const searchParams = useSearchParams();

  return (
    <>
      {searchParams.get("payment_success") && <PaymentSuccessModal />}
      {searchParams.get("subscription_cancelled") && <SubscriptionCancelledModal />}
      {searchParams.get("job_posted") && <JobPostedModal />}
      {searchParams.get("quote_accepted") && <QuoteAcceptedModal />}
      {searchParams.get("quote_sent") && <QuoteSentModal />}
      {searchParams.get("profile_saved") && <ProfileSavedModal />}
      {searchParams.get("user_deleted") && <UserDeletedModal />}
      {searchParams.get("review_submitted") && <ReviewSubmittedModal />}
      {searchParams.get("certification_status_updated") && <CertificationStatusUpdatedModal />}
      {searchParams.get("user_role_updated") && <UserRoleUpdatedModal />}
      {searchParams.get("user_status_updated") && <UserStatusUpdatedModal />}
      {searchParams.get("deposit_paid") && <DepositPaidModal />}
      {searchParams.get("final_payment_made") && <FinalPaymentModal />}
    </>
  );
}
