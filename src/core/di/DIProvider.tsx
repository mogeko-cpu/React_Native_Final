import React, { createContext, useContext, useMemo } from "react";

import { createAppContainer } from "./appContainer";
import { Container } from "./container";

const DIContext = createContext<Container | null>(null);

type Props = {
  children: React.ReactNode;
  // Opcional: un contenedor con falsos (en pruebas) o con los datos en memoria.
  container?: Container;
};

export function DIProvider({ children, container }: Props) {
  const value = useMemo(() => container ?? createAppContainer(), [container]);
  return <DIContext.Provider value={value}>{children}</DIContext.Provider>;
}

export function useDI() {
  const c = useContext(DIContext);
  if (!c) throw new Error("DIProvider missing");
  return c;
}

// Resuelve una dependencia: `const repo = useInject<ListingRepository>(TOKENS.ListingRepo)`.
export function useInject<T>(token: symbol): T {
  const c = useDI();
  return useMemo(() => c.resolve<T>(token), [c, token]);
}
