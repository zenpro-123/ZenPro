import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Returns `false` during SSR and the initial hydration render, then `true` on the
 * client — without calling setState in an effect. Use to gate client-only reads
 * (e.g. `next-themes` `theme`) that would otherwise cause a hydration mismatch.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
