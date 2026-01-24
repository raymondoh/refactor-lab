import { JobsCollection } from "@/lib/firebase/admin";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";

export async function GET() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode("id,title,status,postcode,createdAt\n"));
      // FIX: Cast the stream to the correct async iterable type.
      // This tells TypeScript that each 'doc' will be a QueryDocumentSnapshot.
      const snapshotStream = JobsCollection().stream() as AsyncIterable<QueryDocumentSnapshot>;
      for await (const doc of snapshotStream) {
        const data = doc.data();
        const createdAt =
          data.createdAt instanceof Date
            ? data.createdAt.toISOString()
            : (data.createdAt?.toDate?.().toISOString() ?? "");
        const row =
          [doc.id, String(data.title).replace(/,/g, ""), data.status, data.location?.postcode ?? "", createdAt].join(
            ","
          ) + "\n";
        controller.enqueue(encoder.encode(row));
      }
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=jobs.csv"
    }
  });
}
