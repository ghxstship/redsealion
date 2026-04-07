'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import ClientFormModal from '@/components/admin/clients/ClientFormModal';
import TaskFormModal from '@/components/admin/tasks/TaskFormModal';
import LeadFormModal from '@/components/admin/leads/LeadFormModal';
import DealFormModal from '@/components/admin/pipeline/DealFormModal';
import EquipmentFormModal from '@/components/admin/equipment/EquipmentFormModal';

export type GlobalModalType = 'client' | 'task' | 'lead' | 'deal' | 'equipment' | null;

interface GlobalModalContextValue {
  openModal: (type: GlobalModalType) => void;
  closeModal: () => void;
}

const GlobalModalContext = createContext<GlobalModalContextValue | null>(null);

export function GlobalModalProvider({ children }: { children: ReactNode }) {
  const [activeModal, setActiveModal] = useState<GlobalModalType>(null);
  const router = useRouter();

  const handleCreated = () => {
    router.refresh();
  };

  const closeModal = () => setActiveModal(null);

  return (
    <GlobalModalContext.Provider value={{ openModal: setActiveModal, closeModal }}>
      {children}
      
      {/* 
        We render all modals globally. They control their own display state via the `open` prop. 
        Each must implement an early return or null render when open=false for performance.
      */}
      <ClientFormModal 
        open={activeModal === 'client'} 
        onClose={closeModal} 
        onCreated={handleCreated} 
      />
      <TaskFormModal 
        open={activeModal === 'task'} 
        onClose={closeModal} 
        onCreated={handleCreated} 
      />
      <LeadFormModal 
        open={activeModal === 'lead'} 
        onClose={closeModal} 
        onCreated={handleCreated} 
      />
      <DealFormModal 
        open={activeModal === 'deal'} 
        onClose={closeModal} 
        onCreated={handleCreated} 
      />
      <EquipmentFormModal 
        open={activeModal === 'equipment'} 
        onClose={closeModal} 
        onCreated={handleCreated} 
      />
    </GlobalModalContext.Provider>
  );
}

export function useGlobalModals() {
  const context = useContext(GlobalModalContext);
  if (!context) {
    throw new Error('useGlobalModals must be used within a GlobalModalProvider');
  }
  return context;
}
