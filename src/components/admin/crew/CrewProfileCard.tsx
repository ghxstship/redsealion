'use client';

import React from 'react';
import { CrewProfileWithUser } from '@/types/database';

interface CrewProfileCardProps {
  profile: CrewProfileWithUser;
}

export default function CrewProfileCard({ profile }: CrewProfileCardProps) {
  const initials = profile.user?.full_name
    ? profile.user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??';

  const availabilityColor =
    profile.availability_default === 'available'
      ? 'bg-green-100 text-green-800'
      : profile.availability_default === 'unavailable'
        ? 'bg-red-100 text-red-800'
        : 'bg-yellow-100 text-yellow-800';

  return (
    <div className="bg-white border border-border rounded-lg shadow-sm p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center text-sm font-semibold text-foreground">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground truncate">
            {profile.user?.full_name ?? 'Unknown'}
          </h3>
          {profile.user?.title && (
            <p className="text-xs text-text-secondary truncate">{profile.user.title}</p>
          )}
        </div>
      </div>

      {profile.skills && profile.skills.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {profile.skills.map((skill) => (
            <span
              key={skill}
              className="inline-block px-2 py-0.5 text-xs rounded bg-bg-secondary text-text-secondary"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-xs">
        {profile.hourly_rate != null && (
          <span className="text-text-muted">
            ${Number(profile.hourly_rate).toFixed(2)}/hr
          </span>
        )}
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${availabilityColor}`}>
          {profile.availability_default ?? 'unknown'}
        </span>
      </div>
    </div>
  );
}
