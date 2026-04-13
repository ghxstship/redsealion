'use client';
import Checkbox from '@/components/ui/Checkbox';

import { useState } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormSelect from '@/components/ui/FormSelect';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';

interface ContactFormData {
  first_name: string;
  last_name: string;
  title: string;
  email: string;
  phone: string;
  role: string;
  is_decision_maker: boolean;
}

interface ContactFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ContactFormData) => void;
  initialData?: Partial<ContactFormData>;
}

export default function ContactForm({ open, onClose, onSubmit, initialData }: ContactFormProps) {
  const [form, setForm] = useState<ContactFormData>({
    first_name: initialData?.first_name ?? '',
    last_name: initialData?.last_name ?? '',
    title: initialData?.title ?? '',
    email: initialData?.email ?? '',
    phone: initialData?.phone ?? '',
    role: initialData?.role ?? 'primary',
    is_decision_maker: initialData?.is_decision_maker ?? false,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(form);
    onClose();
  }

  return (
    <ModalShell open={open} onClose={onClose} title={initialData ? 'Edit Contact' : 'Add Contact'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <FormLabel>First Name</FormLabel>
            <FormInput type="text" required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          </div>
          <div>
            <FormLabel>Last Name</FormLabel>
            <FormInput type="text" required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          </div>
        </div>

        <div>
          <FormLabel>Title</FormLabel>
          <FormInput type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>

        <div>
          <FormLabel>Email</FormLabel>
          <FormInput type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>

        <div>
          <FormLabel>Phone</FormLabel>
          <FormInput type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>

        <div>
          <FormLabel>Role</FormLabel>
          <FormSelect value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="primary">Primary</option>
            <option value="billing">Billing</option>
            <option value="creative">Creative</option>
            <option value="operations">Operations</option>
          </FormSelect>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="is_decision_maker" checked={form.is_decision_maker}
            onChange={(e) => setForm({ ...form, is_decision_maker: e.target.checked })}
            className="h-4 w-4 rounded border-border text-foreground focus:ring-foreground/10" />
          <FormLabel htmlFor="is_decision_maker">Decision maker</FormLabel>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">{initialData ? 'Save Changes' : 'Add Contact'}</Button>
        </div>
      </form>
    </ModalShell>
  );
}
