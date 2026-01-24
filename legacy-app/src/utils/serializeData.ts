// utils/serializeData.ts

export function serializeData<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      // Firestore Timestamp shape
      if (
        value &&
        typeof value === "object" &&
        typeof value.seconds === "number" &&
        typeof value.nanoseconds === "number"
      ) {
        return new Date(value.seconds * 1000 + value.nanoseconds / 1000000).toISOString();
      }

      // Native Date
      if (value instanceof Date) {
        return value.toISOString();
      }

      return value;
    })
  );
}
