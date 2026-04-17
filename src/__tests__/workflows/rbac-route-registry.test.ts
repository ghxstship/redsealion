/**
 * Route registry + role-landing + surface-partitioning tests.
 * Closes closure tickets C-INT-02 and C-UI-01/03.
 */

import { describe, it, expect } from 'vitest';
import {
  ROUTE_REGISTRY,
  findRoute,
  landingRouteForRole,
  routesBySurface,
  navigableRoutes,
} from '@/config/routes';
import type { ProjectRole } from '@/lib/permissions';

const ALL_ROLES: ProjectRole[] = [
  'executive', 'production', 'management', 'crew', 'staff', 'talent',
  'vendor', 'client', 'sponsor', 'press', 'guest', 'attendee',
];

describe('Route registry — shape', () => {
  it('every entry has path, surface, resource, action', () => {
    for (const r of ROUTE_REGISTRY) {
      expect(r.path).toMatch(/^\//);
      expect(['atlvs','compvss','gvteway','shared']).toContain(r.surface);
      expect(typeof r.resource).toBe('string');
      expect(['view','create','edit','delete']).toContain(r.action);
    }
  });

  it('has no duplicate paths', () => {
    const paths = ROUTE_REGISTRY.map(r => r.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('provides labels for all navigable root routes', () => {
    expect(navigableRoutes().length).toBeGreaterThan(0);
    for (const r of navigableRoutes()) {
      expect(r.label).toBeTruthy();
    }
  });
});

describe('findRoute — pathname matching', () => {
  it('matches a literal path', () => {
    const r = findRoute('/app/pipeline');
    expect(r?.resource).toBe('pipeline');
  });

  it('matches a dynamic segment', () => {
    const r = findRoute('/app/pipeline/abc-123');
    expect(r?.path).toBe('/app/pipeline/[id]');
    expect(r?.resource).toBe('pipeline');
  });

  it('returns undefined for unregistered paths', () => {
    expect(findRoute('/does/not/exist')).toBeUndefined();
  });
});

describe('landingRouteForRole — role-aware home', () => {
  it.each(ALL_ROLES)('returns a string for role %s', (role) => {
    const path = landingRouteForRole(role);
    expect(typeof path).toBe('string');
    expect(path).toMatch(/^\//);
  });

  it('routes consumer roles to /app/events', () => {
    expect(landingRouteForRole('sponsor')).toBe('/app/events');
    expect(landingRouteForRole('press')).toBe('/app/events');
    expect(landingRouteForRole('guest')).toBe('/app/events');
    expect(landingRouteForRole('attendee')).toBe('/app/events');
  });

  it('routes crew + staff to /app/crew', () => {
    expect(landingRouteForRole('crew')).toBe('/app/crew');
    expect(landingRouteForRole('staff')).toBe('/app/crew');
  });

  it('routes vendor to /app/procurement', () => {
    expect(landingRouteForRole('vendor')).toBe('/app/procurement');
  });

  it('routes client to /portal', () => {
    expect(landingRouteForRole('client')).toBe('/portal');
  });
});

describe('routesBySurface', () => {
  it('partitions routes across atlvs/compvss/gvteway/shared', () => {
    const total =
      routesBySurface('atlvs').length +
      routesBySurface('compvss').length +
      routesBySurface('gvteway').length +
      routesBySurface('shared').length;
    expect(total).toBe(ROUTE_REGISTRY.length);
  });

  it('gvteway surface contains portal routes', () => {
    const gvteway = routesBySurface('gvteway');
    expect(gvteway.length).toBeGreaterThan(0);
    expect(gvteway.every(r => r.path.startsWith('/portal'))).toBe(true);
  });
});
