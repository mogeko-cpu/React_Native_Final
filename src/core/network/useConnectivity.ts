import { useSyncExternalStore } from "react";

import { connectivity } from "./connectivity";

// `true` mientras Roble no responde por falta de red.
export function useIsOffline(): boolean {
  return useSyncExternalStore(
    (onChange) => connectivity.subscribe(onChange),
    () => connectivity.isOffline,
    () => false,
  );
}
