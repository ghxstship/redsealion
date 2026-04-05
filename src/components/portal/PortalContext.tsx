'use client';

import { createContext, useContext } from 'react';

interface PortalContextValue {
  orgSlug: string;
  orgName: string;
  orgId: string;
}

const PortalContext = createContext<PortalContextValue>({
  orgSlug: '',
  orgName: '',
  orgId: '',
});

export function PortalContextProvider({
  orgSlug,
  orgName,
  orgId,
  children,
}: PortalContextValue & { children: React.ReactNode }) {
  return (
    <PortalContext.Provider value={{ orgSlug, orgName, orgId }}>
      {children}
    </PortalContext.Provider>
  );
}

export function usePortalContext() {
  return useContext(PortalContext);
}
