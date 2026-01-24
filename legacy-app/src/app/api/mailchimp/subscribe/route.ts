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

const audienceId = process.env.MAILCHIMP_AUDIENCE_ID!;

const subscribeSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." })
});

export async function POST(req: Request) {
  if (!audienceId) {
    return NextResponse.json({ error: "Mailchimp Audience ID is not configured." }, { status: 500 });
  }

  try {
    const { email } = await req.json();
    const validatedData = subscribeSchema.safeParse({ email });

    if (!validatedData.success) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    // --- THIS IS THE NEW LOGIC ---
    // We assume this call will either succeed and return a valid member object,
    // or it will throw an error which will be handled by our catch block.
    const response = await mailchimp.lists.addListMember(audienceId, {
      email_address: validatedData.data.email,
      status: "subscribed"
    });

    // If the code reaches here, it was successful. We can safely access the 'id'.
    // Explicitly cast 'response' to 'mailchimp.lists.MembersSuccessResponse'
    // to assure TypeScript that 'id' will exist here.
    const memberId = (response as mailchimp.lists.MembersSuccessResponse).id;
    return NextResponse.json({ message: "Thank you for subscribing!", memberId: memberId }, { status: 200 });
    // ----------------------------
  } catch (error: any) {
    // Check if the error is because the member already exists.
    if (error.response?.body?.title === "Member Exists") {
      return NextResponse.json(
        { message: "You are already subscribed!" },
        { status: 200 } // Return 200 OK because it's not a server failure.
      );
    }

    // Handle all other errors.
    console.error("Mailchimp API Error:", error.response?.body || error);
    return NextResponse.json({ error: "Failed to subscribe. Please try again." }, { status: 500 });
  }
}
