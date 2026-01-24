// legacy-app/src/app/api/auth/resend-verification/route.ts
import { NextResponse } from "next/server";
import { resendVerification } from "@/actions/auth/resend-verification";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as { email?: string } | null;

    const email = body?.email?.trim();
    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    // Adapt JSON body to FormData expected by the server action
    const formData = new FormData();
    formData.set("email", email);

    const result = await resendVerification(formData);

    // If your action already returns { success: boolean, ... } keep status consistent:
    const status = result.success ? 200 : 400;
    return NextResponse.json(result, { status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to resend verification";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
