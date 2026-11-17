import { useSyncExternalStore } from "react";

// Hydration gate: false on the server and on the first client render
export function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}