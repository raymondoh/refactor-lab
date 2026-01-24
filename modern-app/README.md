# Plumbers Portal

Plumbers Portal is a full-stack marketplace that connects homeowners with vetted tradespeople (plumbers, heating engineers, etc.). It includes:

- Public marketing site with SEO-optimised city/service pages
- Customer & tradesperson dashboards
- Job board + quotes system
- Stripe-powered subscriptions & job payments
- Algolia-backed search for tradespeople and jobs
- Admin tools for moderation, disputes, and featured profiles

---

## Table of Contents

- [Plumbers Portal](#plumbers-portal)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Roles & Subscription Tiers](#roles--subscription-tiers)
  - [Tech Stack](#tech-stack)
  - [Architecture Overview](#architecture-overview)
  - [Environments](#environments)
  - [Getting Started](#getting-started)
    - [1. Clone & install](#1-clone--install)
    - [2. Environment variables](#2-environment-variables)
    - [3. Local dev (DEV mode)](#3-local-dev-dev-mode)
    - [4. Local production simulation](#4-local-production-simulation)
    - [5. Firebase Functions](#5-firebase-functions)
  - [Key Scripts](#key-scripts)
  - [Stripe & Payments](#stripe--payments)
  - [Search (Algolia)](#search-algolia)
  - [Security & Auth Patterns](#security--auth-patterns)
  - [Testing & QA](#testing--qa)
  - [Documentation](#documentation)
  - [Troubleshooting](#troubleshooting)
  - [License](#license)

---

## Features

**Customers**

- Register, verify email, login/logout
- Create jobs, edit/cancel jobs
- Receive quotes, compare and accept
- Pay **deposit** and **final payment** via Stripe Checkout
- Message tradespeople
- Leave reviews after job completion

**Tradespeople**

- Onboarding with business profile, specialties, service areas
- Stripe Connect Express onboarding for payouts
- Job board with filters & search
- Submit quotes (with Basic plan quote limit)
- Manage assigned jobs and messaging
- Upgrade to **Pro** or **Business** plans via Stripe subscription

**Admin**

- View/search users, jobs, quotes
- Manage featured profiles
- Review disputes (if enabled)
- Moderate accounts and jobs
- View payments & subscription status

---

## Roles & Subscription Tiers

- `customer`
- `tradesperson`
- `business_owner` (optional / future)
- `admin`

Subscription tiers:

- `basic` – default, limited quotes/month
- `pro` – enhanced job visibility and features
- `business` – higher-end tier for larger firms

Quote limits:

- **Basic tradespeople**: 5 quotes per calendar month  
  Limit enforced on the server in `jobService.createQuote()`.

---

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, React Server Components
- **UI**: Tailwind CSS, shadcn/ui, custom components
- **Auth**: Firebase Auth + NextAuth (server-authoritative)
- **Data**: Firebase Firestore (+ Admin SDK)
- **Storage**: Firebase Storage for profile/job images
- **Payments**: Stripe Billing & Connect
- **Search**: Algolia (users + jobs indices)
- **Rate limiting / security**: Redis (Upstash) and middleware
- **Emails**: Resend (transactional & notifications)

---

## Architecture Overview

High-level:

- **App Router** with server components for data-heavy pages
- **Server Actions / API Routes** for writes & sensitive operations
- **Firestore** as primary source of truth
- **Algolia** as a read-optimised index for jobs & tradespeople
- **Stripe** for:
  - Tradesperson subscriptions (Checkout + webhooks)
  - Customer → tradesperson job payments (PaymentIntents with destination charges)
- **Strict auth guards**:
  - `requireSession()` for authentication
  - `requireRole("admin")` (and similar) for protected actions

---

## Environments

Two Firebase + Vercel environments:

- **Development**
  - Firebase: `plumbers-portal-dev`
  - Vercel: Preview/Development environment
- **Production**
  - Firebase: `plumbers-portal`
  - Vercel: Production

Environment files (local):

- `.env.dev` → development configuration
- `.env.prod` → production configuration
- `.env.local` → **generated**, not edited by hand

Switch using:

```bash
npm run use:dev   # copies .env.dev -> .env.local
npm run use:prod  # copies .env.prod -> .env.local
```

Health check:

GET /api/health – prints key env values (project IDs, site URLs, maintenance mode flag, etc.)

Getting Started

1. Clone & install
   git clone <repo-url> plumbers-portal
   cd plumbers-portal
   npm install

2. Environment variables

Create:

.env.dev

.env.prod

Using your Firebase, Stripe, Algolia, Redis, Resend, etc. values.
Keep .env.example in sync as a reference only (no secrets committed).

At minimum you will need:

Firebase client & admin config

Stripe secret + webhook secret + price IDs

Algolia App ID + keys + index names

Resend API key

NextAuth + site URL config

3. Local dev (DEV mode)
   npm run use:dev
   npm run dev

# visit http://localhost:3000

Expected /api/health:

Firebase project: plumbers-portal-dev

Site URL: http://localhost:3000

Maintenance mode: "false" (unless you turned it on)

4. Local production simulation
   npm run use:prod
   npm run build
   npm start

The app now behaves like live production but runs locally (good for serious QA).

5. Firebase Functions

Deploy Cloud Functions (Stripe webhooks, Algolia sync, etc.):

# To DEV

firebase use plumbers-portal-dev
npm run deploy:functions

# To PROD

firebase use plumbers-portal
npm run deploy:functions

Always check Firebase logs after deploying.

Key Scripts

Common package.json scripts (names may vary slightly):

npm run dev # Start local dev server
npm run build # Build for production
npm start # Run built app
npm run lint # Lint codebase
npm run type-check # TypeScript checks
npm run use:dev # Copy .env.dev -> .env.local
npm run use:prod # Copy .env.prod -> .env.local
npm run deploy:functions # Deploy Firebase Cloud Functions

Stripe & Payments

Subscriptions (Pro/Business)

Stripe Checkout (mode: subscription)

Webhooks update:

subscriptionTier

subscriptionStatus

stripeCustomerId

Job Payments (Customer ↔ Tradesperson)

PaymentIntents with transfer_data[destination] and application_fee_amount

1.5% platform fee via STRIPE_PLATFORM_FEE_BPS=150

Webhooks mark deposit/final payment as paid in Firestore

For full details, see the Stripe Integration section in the docs.

Search (Algolia)

Firestore = source of truth

Algolia indices:

plumbers (tradespeople)

jobs (jobs)

Cloud Functions / sync scripts mirror Firestore → Algolia on changes

Featured profiles and job board both read via Algolia, with Firestore fallback

Security & Auth Patterns

Server is the source of truth:

All sensitive operations run on the server

Routes guarded with requireSession() and requireRole()

Input validation with zod

Responses from mutating routes marked no-store to avoid caching

Stripe:

Imports from @/lib/stripe/server

Webhooks verified with STRIPE_WEBHOOK_SECRET

Firestore:

Security rules enforce user ownership & role-based access

All API responses that include Firestore data use a serializer to avoid raw Timestamp objects leaking to the client.

Testing & QA

A comprehensive QA and pre-launch plan is maintained (manual + automated checks), including:

Authentication & onboarding (customer + tradesperson)

Job lifecycle (creation → quote → assignment → deposit → completion → final payment → review)

Messaging & notifications

Subscriptions & billing portal

Algolia search + Firestore fallback

Admin workflows (moderation, disputes, featured profiles)

SEO, performance, and responsive layout checks

Error and recovery scenarios (network issues, expired sessions, webhook retries)

For the full checklist, test cases, and launch gates, see the Master QA & Launch Handbook in the docs section below.

Documentation

Primary docs live as PDFs (or in /docs):

Master QA & Launch Handbook

Executive Summary

DevOps Technical Handbook

Stripe Integration Guide

Environment Variable Master Manual

Algolia Indexing & Sync Guide

Email & Modal Triggers Maps

Tip: keep these in a docs/ folder and link them here, e.g.:

docs/plumbers_portal_master_handbook.pdf

docs/plumbers_portal_devops_handbook.pdf

Troubleshooting

Common issues:

Wrong Firebase project / env

Check /api/health output

Confirm you ran npm run use:dev or npm run use:prod

Stripe webhooks not firing

Verify the correct endpoint + secret in Stripe Dashboard

Check Cloud Functions logs

Algolia search empty / featured not showing

Confirm indices plumbers / jobs exist

Run sync/backfill script

Check Algolia dashboard logs and records

Auth/permissions errors

Check Firestore security rules

Ensure server routes use requireSession() and role checks
