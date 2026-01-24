// src/app/api/contact/route.ts

import { NextResponse } from "next/server";
import { Resend } from "resend";
import * as z from "zod";

// Initialize Resend with your API key from .env
const resend = new Resend(process.env.RESEND_API_KEY);

// Define the schema for input validation using Zod
const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters long." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  subject: z.string().min(5, { message: "Subject must be at least 5 characters long." }),
  message: z.string().min(10, { message: "Message must be at least 10 characters long." })
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate the form data
    const validatedData = contactFormSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json({ error: "Invalid input.", details: validatedData.error.flatten() }, { status: 400 });
    }

    const { name, email, subject, message } = validatedData.data;

    // Send the email using Resend
    const { data, error } = await resend.emails.send({
      from: "Contact Form <onboarding@resend.dev>", // Use a default Resend address for now
      to: ["raymondmhylton@gmail.com"], // <<< YOUR EMAIL ADDRESS HERE
      subject: `New MotoStix Contact Form Submission: ${subject}`,
      replyTo: email, // Set the reply-to as the user's email
      html: `
        <h1>New Contact Form Submission</h1>
        <p>You have received a new message from your website's contact form.</p>
        <hr>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
        <hr>
      `
    });

    if (error) {
      console.error({ error });
      return NextResponse.json({ error: "Error sending message." }, { status: 500 });
    }

    return NextResponse.json({ message: "Message sent successfully!" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
