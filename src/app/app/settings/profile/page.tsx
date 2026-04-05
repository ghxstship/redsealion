'use client';

import { useState, useEffect } from 'react';

function InputField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full rounded-lg border border-border bg-white px-3.5 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 ${
          readOnly ? 'bg-gray-50 text-text-secondary cursor-not-allowed' : ''
        }`}
      />
    </div>
  );
}

export default function ProfileSettingsPage() {
  const [fullName, setFullName] = useState('');
  const [email] = useState('');
  const [phone, setPhone] = useState('');
  const [title, setTitle] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load profile on mount
  useEffect(() => {
    fetch('/api/settings/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setFullName(data.user.full_name || '');
          setPhone(data.user.phone || '');
          setTitle(data.user.title || '');
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, phone, title }),
      });
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Profile</h2>
          <p className="mt-1 text-sm text-text-secondary">Manage your account details.</p>
        </div>
        <div className="rounded-xl border border-border bg-white px-6 py-6 animate-pulse h-48" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Profile</h2>
        <p className="mt-1 text-sm text-text-secondary">Manage your account details.</p>
      </div>

      {/* Personal Information */}
      <div className="rounded-xl border border-border bg-white px-6 py-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">Personal Information</h3>
        <div className="space-y-5">
          <InputField label="Full Name" value={fullName} onChange={setFullName} placeholder="Your full name" />
          <InputField label="Email" value={email} readOnly placeholder="Email address (read-only)" />
          <InputField label="Phone" value={phone} onChange={setPhone} type="tel" placeholder="+1 (555) 000-0000" />
          <InputField label="Title" value={title} onChange={setTitle} placeholder="e.g. Project Manager" />
        </div>
      </div>

      {/* Avatar */}
      <div className="rounded-xl border border-border bg-white px-6 py-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">Avatar</h3>
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 shrink-0 rounded-full bg-gray-100 border border-border flex items-center justify-center">
            <svg className="h-8 w-8 text-text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="rounded-lg border-2 border-dashed border-border bg-gray-50 px-6 py-8 text-center">
              <svg className="mx-auto h-8 w-8 text-text-muted mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
              <p className="text-sm text-text-secondary">
                Drop an image here or{' '}
                <button className="text-foreground font-medium underline underline-offset-2">browse</button>
              </p>
              <p className="text-xs text-text-muted mt-1">PNG, JPG up to 2 MB</p>
            </div>
          </div>
        </div>
      </div>

      {/* Password */}
      <div className="rounded-xl border border-border bg-white px-6 py-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">Password</h3>
        <div className="space-y-5">
          <InputField label="Current Password" value={currentPassword} onChange={setCurrentPassword} type="password" placeholder="Enter current password" />
          <InputField label="New Password" value={newPassword} onChange={setNewPassword} type="password" placeholder="Enter new password" />
          <InputField label="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} type="password" placeholder="Confirm new password" />
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-white hover:bg-foreground/90 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
