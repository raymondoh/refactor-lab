"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Debounces a value by `delayMs` and returns the debounced value.
 * Also returns a `flush()` to immediately sync the debounced value.
 */
export function useDebouncedValue<T>(value: T, delayMs = 450) {
  const [debounced, setDebounced] = useState(value);
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (tRef.current) clearTimeout(tRef.current);
    tRef.current = setTimeout(() => setDebounced(value), delayMs);
    return () => {
      if (tRef.current) clearTimeout(tRef.current);
    };
  }, [value, delayMs]);

  const flush = () => {
    if (tRef.current) clearTimeout(tRef.current);
    setDebounced(value);
  };

  return { debounced, flush };
}
