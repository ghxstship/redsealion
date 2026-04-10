'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface ProfileEditFormProps {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
}

export default function ProfileEditForm({
  firstName: initialFirst,
  lastName: initialLast,
  email,
  phone: initialPhone,
  title: initialTitle,
}: ProfileEditFormProps) {
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(initialFirst);
  const [lastName, setLastName] = useState(initialLast);
  const [phone, setPhone] = useState(initialPhone);
  const [title, setTitle] = useState(initialTitle);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Guest';

  async function handleSave() {
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      try {
        const res = await fetch('/api/public/portal-profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            phone,
            title,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? 'Failed to save.');
          return;
        }

        setSuccess(true);
        setEditing(false);
        router.refresh();
      } catch {
        setError('Network error. Please try again.');
      }
    });
  }

  function handleCancel() {
    setFirstName(initialFirst);
    setLastName(initialLast);
    setPhone(initialPhone);
    setTitle(initialTitle);
    setEditing(false);
    setError(null);
    setSuccess(false);
  }

  const inputClass = editing
    ? 'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500'
    : 'w-full rounded-md border border-border bg-gray-50 px-3 py-2 text-sm text-foreground';

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div />
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-medium transition-colors hover:opacity-80"
            style={{ color: 'var(--org-primary)' }}
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              className="rounded-md border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="rounded-md px-3 py-1 text-xs font-medium text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: 'var(--org-primary)' }}
            >
              {isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
          Profile updated successfully.
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">First Name</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            readOnly={!editing}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Last Name</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            readOnly={!editing}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Email</label>
          <input
            type="email"
            defaultValue={email}
            readOnly
            className="w-full rounded-md border border-border bg-gray-50 px-3 py-2 text-sm text-foreground"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            readOnly={!editing}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            readOnly={!editing}
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}
