import type { Tier } from "@/lib/subscription/tier";
import { getEnv } from "@/lib/env";

const env = getEnv();

/** amount is in minor units (pence). returns application_fee_amount (also in pence). */
export function platformFee(amountMinor: number, tier: Tier) {
  const bps = getPlatformFeeBpsForTier(tier);
  return Math.floor((amountMinor * bps) / 10_000);
}

export function getPlatformFeeBpsForTier(tier: Tier): number {
  switch (tier) {
    case "pro":
      return Number(env.STRIPE_PLATFORM_FEE_BPS_PRO ?? 0);
    case "business":
      return Number(env.STRIPE_PLATFORM_FEE_BPS_BUSINESS ?? 0);
    case "basic":
    default:
      return Number(env.STRIPE_PLATFORM_FEE_BPS_BASIC ?? 0);
  }
}

export function getPlatformFeePercentages() {
  const basicBps = Number(env.STRIPE_PLATFORM_FEE_BPS_BASIC ?? 0);
  const proBps = Number(env.STRIPE_PLATFORM_FEE_BPS_PRO ?? 0);
  const businessBps = Number(env.STRIPE_PLATFORM_FEE_BPS_BUSINESS ?? 0);

  const toPercent = (bps: number) => (bps > 0 ? bps / 100 : 0); // 150 bps -> 1.5

  return {
    basic: toPercent(basicBps),
    pro: toPercent(proBps),
    business: toPercent(businessBps)
  };
}
