// This file is part of a Next.js application that handles subscription requests to a Mailchimp audience.
// It uses the Mailchimp Marketing API to add subscribers to a specific audience.
// src/app/api/mailchimp/subscribe/route.ts

import { NextResponse } from "next/server";
import mailchimp from "@mailchimp/mailchimp_marketing";
import * as z from "zod";

mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_SERVER_PREFIX
});

const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;

const subscribeSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." })
});

type MailchimpErrorShape = {
  response?: {
    body?: {
      title?: string;
      detail?: string;
      status?: number;
    };
  };
};

export async function POST(req: Request) {
  if (!audienceId) {
    return NextResponse.json({ error: "Mailchimp Audience ID is not configured." }, { status: 500 });
  }

  try {
    const raw = (await req.json()) as unknown;
    const email = typeof raw === "object" && raw !== null && "email" in raw ? (raw as { email?: unknown }).email : null;

    const validatedData = subscribeSchema.safeParse({ email });

    if (!validatedData.success) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    const response = await mailchimp.lists.addListMember(audienceId, {
      email_address: validatedData.data.email,
      status: "subscribed"
    });

    // If successful, Mailchimp returns a member object with an id.
    const memberId = (response as mailchimp.lists.MembersSuccessResponse).id;

    return NextResponse.json({ message: "Thank you for subscribing!", memberId }, { status: 200 });
  } catch (error: unknown) {
    const mc = (typeof error === "object" && error !== null ? (error as MailchimpErrorShape) : undefined) ?? undefined;

    // Mailchimp returns "Member Exists" in response.body.title
    if (mc?.response?.body?.title === "Member Exists") {
      return NextResponse.json({ message: "You are already subscribed!" }, { status: 200 });
    }

    // Log helpful info (without assuming error shape)
    console.error("Mailchimp API Error:", mc?.response?.body ?? error);

    return NextResponse.json({ error: "Failed to subscribe. Please try again later." }, { status: 500 });
  }
}
