"use client";

import { useEffect } from "react";
import { collection, getDocs, query, limit, orderBy } from "firebase/firestore";
import { db } from "@/firebase/client/firebase-client-init";
import { useSearch } from "@/contexts/SearchContext";

interface SearchDataLoaderProps {
  collections?: string[];
  maxItems?: number;
  searchFields?: string[];
}

export function SearchDataLoader({
  // Default to only products collection
  collections = ["products"],
  maxItems = 500,
  searchFields = ["name", "title", "description", "category"]
}: SearchDataLoaderProps) {
  const { setSearchableData } = useSearch();

  useEffect(() => {
    async function fetchData() {
      try {
        console.log("Fetching product data for search...");
        const allData: any[] = [];

        // Fetch data from each collection (should only be products)
        for (const collectionName of collections) {
          try {
            // Skip any non-product collections for security
            if (collectionName !== "products") {
              console.warn(`Skipping non-product collection: ${collectionName} for security reasons`);
              continue;
            }

            const dataQuery = query(collection(db, collectionName), orderBy("createdAt", "desc"), limit(maxItems));

            const snapshot = await getDocs(dataQuery);
            const items = snapshot.docs.map(doc => ({
              id: doc.id,
              _collection: collectionName,
              type: collectionName.slice(0, -1), // Remove 's' from end for type
              ...doc.data()
            }));

            console.log(`Loaded ${items.length} products for search`);
            allData.push(...items);
          } catch (err) {
            console.error(`Error fetching from ${collectionName}:`, err);
          }
        }

        // Initialize search with the data
        setSearchableData(allData, {
          keys: searchFields,
          threshold: 0.3,
          includeMatches: true,
          ignoreLocation: true
        });

        console.log("Search initialized with", allData.length, "products");
      } catch (err) {
        console.error("Error fetching search data:", err);

        // Initialize with empty data if fetching fails
        setSearchableData([], {
          keys: searchFields,
          threshold: 0.3,
          includeMatches: true,
          ignoreLocation: true
        });
      }
    }

    fetchData();
  }, [collections, maxItems, searchFields, setSearchableData]);

  // This component doesn't render anything
  return null;
}
