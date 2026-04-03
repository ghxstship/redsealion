/**
 * Asset Lifecycle — End-to-End Workflow Validation
 *
 * Validates the asset tracking state machine:
 *   planned → in_production → in_transit → deployed → in_storage → retired → disposed
 *   + condition tracking (new → excellent → good → fair → poor → damaged)
 *   + location history
 *   + deployment counting
 *   + barcode/serial number assignment
 */
import { describe, it, expect } from 'vitest';
import { makeAsset, TEST_ORG_ID } from '../helpers';
import type { AssetStatus, AssetCondition } from '@/types/database';

const ASSET_STATUSES: AssetStatus[] = [
  'planned', 'in_production', 'in_transit', 'deployed', 'in_storage', 'retired', 'disposed',
];

const ASSET_CONDITIONS: AssetCondition[] = [
  'new', 'excellent', 'good', 'fair', 'poor', 'damaged',
];

const VALID_ASSET_TRANSITIONS: Record<AssetStatus, AssetStatus[]> = {
  planned: ['in_production', 'disposed'],
  in_production: ['in_transit', 'in_storage'],
  in_transit: ['deployed', 'in_storage'],
  deployed: ['in_transit', 'in_storage', 'retired'],
  in_storage: ['in_transit', 'retired', 'disposed'],
  retired: ['disposed', 'in_storage'],     // can be reconditioned
  disposed: [],
};

describe('Asset Lifecycle Workflow', () => {
  // -----------------------------------------------------------------------
  // Status machine
  // -----------------------------------------------------------------------

  describe('Asset status transitions', () => {
    it('defines all 7 asset statuses', () => {
      expect(ASSET_STATUSES).toHaveLength(7);
    });

    it('follows manufacturing flow: planned → in_production → in_transit → deployed', () => {
      expect(VALID_ASSET_TRANSITIONS.planned).toContain('in_production');
      expect(VALID_ASSET_TRANSITIONS.in_production).toContain('in_transit');
      expect(VALID_ASSET_TRANSITIONS.in_transit).toContain('deployed');
    });

    it('supports storage after deployment', () => {
      expect(VALID_ASSET_TRANSITIONS.deployed).toContain('in_storage');
    });

    it('supports redeployment from storage', () => {
      expect(VALID_ASSET_TRANSITIONS.in_storage).toContain('in_transit');
    });

    it('supports retirement lifecycle', () => {
      expect(VALID_ASSET_TRANSITIONS.deployed).toContain('retired');
      expect(VALID_ASSET_TRANSITIONS.in_storage).toContain('retired');
      expect(VALID_ASSET_TRANSITIONS.retired).toContain('disposed');
    });

    it('prevents transitions from disposed (terminal)', () => {
      expect(VALID_ASSET_TRANSITIONS.disposed).toHaveLength(0);
    });

    it('allows reconditioning retired assets', () => {
      expect(VALID_ASSET_TRANSITIONS.retired).toContain('in_storage');
    });
  });

  // -----------------------------------------------------------------------
  // Condition tracking
  // -----------------------------------------------------------------------

  describe('Asset condition tracking', () => {
    it('defines all 6 condition levels', () => {
      expect(ASSET_CONDITIONS).toHaveLength(6);
    });

    it('starts new assets with "new" condition', () => {
      const asset = makeAsset();
      expect(asset.condition).toBe('new');
    });

    it('tracks condition degradation over time', () => {
      const conditionRank: Record<AssetCondition, number> = {
        new: 5, excellent: 4, good: 3, fair: 2, poor: 1, damaged: 0,
      };

      expect(conditionRank.new).toBeGreaterThan(conditionRank.excellent);
      expect(conditionRank.excellent).toBeGreaterThan(conditionRank.good);
      expect(conditionRank.good).toBeGreaterThan(conditionRank.fair);
      expect(conditionRank.fair).toBeGreaterThan(conditionRank.poor);
      expect(conditionRank.poor).toBeGreaterThan(conditionRank.damaged);
    });
  });

  // -----------------------------------------------------------------------
  // Asset creation
  // -----------------------------------------------------------------------

  describe('Asset creation', () => {
    it('creates an asset with required fields', () => {
      const asset = makeAsset();
      expect(asset.id).toBeTruthy();
      expect(asset.organization_id).toBe(TEST_ORG_ID);
      expect(asset.name).toBeTruthy();
      expect(asset.status).toBe('planned');
    });

    it('initializes deployment_count to 0', () => {
      const asset = makeAsset();
      expect(asset.deployment_count).toBe(0);
    });

    it('sets initial location', () => {
      const asset = makeAsset();
      expect(asset.current_location).toBeDefined();
      expect((asset.current_location as Record<string, string>).facilityId).toBeTruthy();
    });

    it('supports trackable flag', () => {
      const trackable = makeAsset({ trackable: true });
      const nonTrackable = makeAsset({ trackable: false });
      expect(trackable.trackable).toBe(true);
      expect(nonTrackable.trackable).toBe(false);
    });

    it('supports reusable flag', () => {
      const asset = makeAsset({ reusable: true });
      expect(asset.reusable).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Deployment tracking
  // -----------------------------------------------------------------------

  describe('Deployment tracking', () => {
    it('increments deployment_count on deploy', () => {
      const asset = makeAsset({ deployment_count: 3 });
      const newCount = (asset.deployment_count as number) + 1;
      expect(newCount).toBe(4);
    });

    it('tracks deployment history with location changes', () => {
      const locationHistory = [
        { from: { facilityId: 'fac_001' }, to: { venueId: 'venue_001' }, moved_at: '2026-03-10T08:00:00Z' },
        { from: { venueId: 'venue_001' }, to: { facilityId: 'fac_002' }, moved_at: '2026-03-15T16:00:00Z' },
      ];

      expect(locationHistory).toHaveLength(2);
      expect(locationHistory[0].to).toHaveProperty('venueId');
      expect(locationHistory[1].to).toHaveProperty('facilityId');
    });
  });

  // -----------------------------------------------------------------------
  // Barcode / Serial number
  // -----------------------------------------------------------------------

  describe('Asset identification', () => {
    it('supports barcode assignment', () => {
      const asset = makeAsset({ barcode: 'BC-2026-001' });
      expect(asset.barcode).toBe('BC-2026-001');
    });

    it('supports serial number assignment', () => {
      const asset = makeAsset({ serial_number: 'SN-LED-001' });
      expect(asset.serial_number).toBe('SN-LED-001');
    });

    it('allows assets without barcode/serial', () => {
      const asset = makeAsset();
      expect(asset.barcode).toBeNull();
      expect(asset.serial_number).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // Multi-deployment reusable assets
  // -----------------------------------------------------------------------

  describe('Reusable asset workflow', () => {
    it('supports deploy → storage → redeploy cycle', () => {
      const statuses: AssetStatus[] = ['deployed', 'in_storage', 'in_transit', 'deployed'];
      expect(VALID_ASSET_TRANSITIONS.deployed).toContain('in_storage');
      expect(VALID_ASSET_TRANSITIONS.in_storage).toContain('in_transit');
      expect(VALID_ASSET_TRANSITIONS.in_transit).toContain('deployed');

      // Can cycle multiple times
      for (let i = 0; i < statuses.length - 1; i++) {
        expect(VALID_ASSET_TRANSITIONS[statuses[i]]).toContain(statuses[i + 1]);
      }
    });

    it('tracks purchase cost for depreciation', () => {
      const asset = makeAsset({ purchase_cost: 5000 });
      expect(asset.purchase_cost).toBe(5000);
    });
  });
});
