"use client";
// test page for Firestore rules

import { collection, doc, getDocFromServer, getDocsFromServer } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

export default function RulesTest() {
  if (process.env.NODE_ENV !== "development") return notFound();
  const db = getFirebaseDb();

  // Helpful: confirms env flag is set
  console.log("USE_EMULATORS =", process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS);

  // 1. ADD THIS GUARD CLAUSE 🛑
  // This prevents the error by ensuring 'db' is valid before any buttons are rendered.
  if (!db) {
    return <div className="p-6">Initializing Firebase... (Check console if stuck)</div>;
  }

  async function run(label: string, fn: () => Promise<any>) {
    try {
      const result = await fn();
      console.log(`${label}: ✅ ALLOWED`, result);
      alert(`${label}: ✅ ALLOWED`);
    } catch (e: any) {
      console.error(`${label}: ❌ BLOCKED`, e);
      alert(`${label}: ❌ BLOCKED\n\n${e?.code ?? ""}\n${e?.message ?? String(e)}`);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Firestore Rules Test</h1>
      {/* ... rest of your JSX is fine now because 'db' is guaranteed to exist ... */}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Button
          onClick={() =>
            run("LIST /users (server)", async () => {
              // Now TypeScript knows 'db' cannot be null here
              await getDocsFromServer(collection(db, "users"));
            })
          }>
          Test LIST /users
        </Button>

        <Button
          onClick={() =>
            run("GET featuredUser1 (server)", async () => {
              await getDocFromServer(doc(db, "users", "featuredUser1"));
            })
          }>
          Test GET featuredUser1
        </Button>

        <Button
          onClick={() =>
            run("GET normalUser1 (server)", async () => {
              await getDocFromServer(doc(db, "users", "normalUser1"));
            })
          }>
          Test GET normalUser1
        </Button>
      </div>
    </div>
  );
}
