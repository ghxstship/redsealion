'use client';

import React, { useState } from 'react';
import CreateOrderModal from './CreateOrderModal';
import { Plus } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function NewOrderButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 focus:outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2 transition-colors"
      >
        <Plus className="w-4 h-4 mr-2" />
        New Order
      </Button>
      <CreateOrderModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
