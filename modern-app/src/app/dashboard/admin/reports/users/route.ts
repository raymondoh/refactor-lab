import { UsersCollection } from "@/lib/firebase/admin";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";

export async function GET() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode("id,name,email,role,postcode\n"));
      // FIX: Cast the stream to the correct async iterable type.
      // This tells TypeScript that each 'doc' will be a QueryDocumentSnapshot.
      const snapshotStream = UsersCollection().stream() as AsyncIterable<QueryDocumentSnapshot>;
      for await (const doc of snapshotStream) {
        const data = doc.data();
        const row =
          [doc.id, data.name ?? "", data.email ?? "", data.role ?? "", data.location?.postcode ?? ""].join(",") + "\n";
        controller.enqueue(encoder.encode(row));
      }
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=users.csv"
    }
  });
}
