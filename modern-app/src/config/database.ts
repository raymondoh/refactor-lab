export const dbConfig = {
  provider: "firebase", // Could be "supabase", "prisma", etc.

  firebase: {
    projectId: process.env.AUTH_FIREBASE_PROJECT_ID,
    clientEmail: process.env.AUTH_FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.AUTH_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")
  }
} as const;
