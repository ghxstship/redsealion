'use client';

import { createContext, useContext } from 'react';

type PortalType = 'client' | 'contractor';

interface PortalContextValue {
  orgSlug: string;
  orgName: string;
  orgId: string;
  portalType: PortalType;
  userId?: string;
  crewProfileId?: string;
}

const PortalContext = createContext<PortalContextValue>({
  orgSlug: '',
  orgName: '',
  orgId: '',
  portalType: 'client',
});

export function PortalContextProvider({
  orgSlug,
  orgName,
  orgId,
  portalType = 'client',
  userId,
  crewProfileId,
  children,
}: PortalContextValue & { children: React.ReactNode }) {
  return (
    <PortalContext.Provider value={{ orgSlug, orgName, orgId, portalType, userId, crewProfileId }}>
      {children}
    </PortalContext.Provider>
  );
}

export function usePortalContext() {
  return useContext(PortalContext);
}
