'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import PersonEditModal from '@/components/admin/people/PersonEditModal';

interface PersonDetailClientProps {
  person: any; // Using any here for brevity, covers all fields 
  onUpdated?: () => void;
}

export default function PersonDetailClient({ person, onUpdated }: PersonDetailClientProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <>
      <div className="flex justify-end -mt-16 mb-8 relative z-10">
        <Button onClick={() => setIsEditModalOpen(true)}>
          Edit Profile
        </Button>
      </div>

      {isEditModalOpen && (
        <PersonEditModal 
          open={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          person={person}
          onSaved={() => {
            if (onUpdated) onUpdated();
            window.location.reload(); 
          }}
        />
      )}
    </>
  );
}
