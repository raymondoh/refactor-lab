# 🚀 Firebase Starter App

A modern, production-ready boilerplate built with Next.js 15, Firebase, TailwindCSS, and a modular, scalable architecture.  
Designed for rapid full-stack development — secure, flexible, and future-proof.

---

## ✨ Features

- Next.js 15 App Router
- Server Actions + Server Components
- Firebase Authentication & Firestore Integration
- TailwindCSS + shadcn/ui components
- Google OAuth + Email/Password Authentication
- Robust form handling and validation
- Toast notifications for UX feedback
- Skeleton loaders and dynamic UI states
- Secure file uploads to Firebase Storage
- Reusable component library and utilities
- Modular folder structure for scalability
- Ready for production deployment (Vercel or custom hosting)

---

## 🛠️ Project Structure

Key folders to know:

| Folder            | Purpose                                                       |
| :---------------- | :------------------------------------------------------------ |
| `/src/actions`    | Server actions (auth, products, users, etc.)                  |
| `/src/app`        | Main Next.js pages, layouts, routes                           |
| `/src/components` | UI components (form elements, dialogs, cards, etc.)           |
| `/src/firebase`   | Firebase Admin + Client SDK setup                             |
| `/src/lib`        | Utility functions (date helpers, API handlers, etc.)          |
| `/src/providers`  | Context providers (SessionProvider, ThemeProvider, etc.)      |
| `/src/schemas`    | Validation schemas (e.g., with Zod)                           |
| `/src/types`      | TypeScript types for users, products, auth, etc.              |
| `/src/utils`      | Utility helpers (e.g., file uploads, Firebase error handling) |

---

## ⚙️ Getting Started

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env.local` and fill in your environment variables:

```bash
cp .env.example .env.local
# then edit .env.local
```

NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
NEXT_PUBLIC_APP_URL=http://localhost:3000
SITE_URL=http://localhost:3000
SITE_TWITTER=https://twitter.com/example
OG_IMAGE_URL=http://localhost:3000/og.jpg

npm run dev

Technologies Used
Next.js 15 (App Router, Server Actions, RSC)

TailwindCSS + shadcn/ui

Firebase Authentication, Firestore, Storage

Next-Auth (for credential and OAuth authentication)

Zod (optional for form validation)

Sonner (for toast notifications)

Lucide Icons (for UI icons)

TypeScript (full type safety)

📋 Notes
Firebase Emulator Suite setup is recommended for local testing.

Production-ready best practices applied (auth flows, error handling, uploads).

Easily extendable for e-commerce, admin dashboards, SaaS, or community apps.

🙏 Acknowledgments
Big thanks to the Next.js, Firebase, and open-source communities
for the tools and inspiration that made this starter possible.
