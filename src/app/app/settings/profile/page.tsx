'use client';

import { useState, useEffect } from 'react';
import { User, Upload } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';

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
        className={`w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 ${
          readOnly ? 'bg-bg-secondary text-text-secondary cursor-not-allowed' : ''
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
  const [saved, setSaved] = useState(false);
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
    setSaved(false);
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, phone, title }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
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
        <Skeleton />
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
      <Card>
        <h3 className="text-sm font-semibold text-foreground mb-5">Personal Information</h3>
        <div className="space-y-5">
          <InputField label="Full Name" value={fullName} onChange={setFullName} placeholder="Your full name" />
          <InputField label="Email" value={email} readOnly placeholder="Email address (read-only)" />
          <InputField label="Phone" value={phone} onChange={setPhone} type="tel" placeholder="+1 (555) 000-0000" />
          <InputField label="Title" value={title} onChange={setTitle} placeholder="e.g. Project Manager" />
        </div>
      </Card>

      {/* Avatar */}
      <Card>
        <h3 className="text-sm font-semibold text-foreground mb-5">Avatar</h3>
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 shrink-0 rounded-full bg-bg-secondary border border-border flex items-center justify-center">
            <User className="h-8 w-8 text-text-muted" />
          </div>
          <div className="flex-1">
            <div className="rounded-lg border-2 border-dashed border-border bg-bg-secondary px-6 py-8 text-center">
              <Upload className="mx-auto h-8 w-8 text-text-muted mb-2" />
              <p className="text-sm text-text-secondary">
                Drop an image here or{' '}
                <button className="text-foreground font-medium underline underline-offset-2">browse</button>
              </p>
              <p className="text-xs text-text-muted mt-1">PNG, JPG up to 2 MB</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Password */}
      <Card>
        <h3 className="text-sm font-semibold text-foreground mb-5">Password</h3>
        <div className="space-y-5">
          <InputField label="Current Password" value={currentPassword} onChange={setCurrentPassword} type="password" placeholder="Enter current password" />
          <InputField label="New Password" value={newPassword} onChange={setNewPassword} type="password" placeholder="Enter new password" />
          <InputField label="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} type="password" placeholder="Confirm new password" />
        </div>
      </Card>

      {/* Save */}
      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="text-sm text-green-600 font-medium">Profile updated</span>
        )}
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
