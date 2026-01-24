// src/lib/bootstrap/env.server.ts
import "server-only";
import { validateEnv } from "@/lib/env";

// Always validate on the server at startup.
// In prod it throws; in dev it only warns (per your validateEnv implementation).
validateEnv();
