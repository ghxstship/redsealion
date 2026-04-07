/**
 * Production Advancing Module — Barrel Export
 *
 * @module lib/advances
 */

// Types
export type {
  CatalogTreeNode,
  CatalogItemWithVariants,
  CartItem,
  CartAction,
  CartModifierSelection,
  AdvanceWithItems,
  CollaboratorWithSubmission,
  StatusTransition,
  AdvanceFilters,
  CreateAdvanceRequest,
  AddLineItemRequest,
  UpdateAdvanceRequest,
  InviteCollaboratorRequest,
  GenerateAccessCodeRequest,
} from './types';

// Constants
export {
  INTERNAL_TRANSITIONS,
  COLLECTION_TRANSITIONS,
  getValidTransitions,
  FULFILLMENT_PIPELINE,
  FULFILLMENT_TERMINAL,
  ADVANCE_STATUS_CONFIG,
  FULFILLMENT_STATUS_CONFIG,
  ADVANCE_TYPE_CONFIG,
  PRIORITY_CONFIG,
  TIER_LIMITS,
  ADVANCE_LIST_TABS,
} from './constants';

// Validations
export {
  validateStatusTransition,
  validateCreateAdvance,
  validateAddLineItem,
  validateModifierSelections,
  isSubmissionDeadlinePassed,
  validateQuantityRules,
} from './validations';

// Utils
export {
  calculateModifierTotal,
  calculateLineTotal,
  calculateCartSubtotal,
  formatCents,
  formatAdvanceNumber,
  formatUnitOfMeasure,
  buildCatalogTree,
  generateAccessCode,
  cartReducer,
  formatAdvanceDate,
  getDeadlineCountdown,
} from './utils';
