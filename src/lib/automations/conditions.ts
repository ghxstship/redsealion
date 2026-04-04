/**
 * Automation condition evaluator.
 *
 * Evaluates a list of conditions against an event payload to determine
 * whether an automation should fire. Conditions are AND'd together.
 *
 * @module lib/automations/conditions
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'is_empty'
  | 'is_not_empty'
  | 'in'
  | 'not_in'
  | 'starts_with'
  | 'ends_with';

export interface AutomationCondition {
  field: string;
  operator: ConditionOperator;
  value?: unknown;
}

// ---------------------------------------------------------------------------
// Evaluator
// ---------------------------------------------------------------------------

/**
 * Evaluate all conditions against the payload. All conditions must pass (AND logic).
 */
export function evaluateConditions(
  conditions: Array<Record<string, unknown>>,
  payload: Record<string, unknown>,
): boolean {
  for (const raw of conditions) {
    const condition: AutomationCondition = {
      field: (raw.field as string) ?? '',
      operator: (raw.operator as ConditionOperator) ?? 'equals',
      value: raw.value,
    };

    if (!evaluateSingleCondition(condition, payload)) {
      return false;
    }
  }

  return true;
}

function evaluateSingleCondition(
  condition: AutomationCondition,
  payload: Record<string, unknown>,
): boolean {
  const fieldValue = getNestedValue(payload, condition.field);
  const compareValue = condition.value;

  switch (condition.operator) {
    case 'equals':
      return String(fieldValue) === String(compareValue);

    case 'not_equals':
      return String(fieldValue) !== String(compareValue);

    case 'contains':
      return String(fieldValue ?? '').toLowerCase().includes(String(compareValue ?? '').toLowerCase());

    case 'not_contains':
      return !String(fieldValue ?? '').toLowerCase().includes(String(compareValue ?? '').toLowerCase());

    case 'greater_than':
      return Number(fieldValue) > Number(compareValue);

    case 'less_than':
      return Number(fieldValue) < Number(compareValue);

    case 'is_empty':
      return fieldValue == null || fieldValue === '' || (Array.isArray(fieldValue) && fieldValue.length === 0);

    case 'is_not_empty':
      return fieldValue != null && fieldValue !== '' && !(Array.isArray(fieldValue) && fieldValue.length === 0);

    case 'in':
      if (Array.isArray(compareValue)) {
        return compareValue.includes(fieldValue);
      }
      return false;

    case 'not_in':
      if (Array.isArray(compareValue)) {
        return !compareValue.includes(fieldValue);
      }
      return true;

    case 'starts_with':
      return String(fieldValue ?? '').toLowerCase().startsWith(String(compareValue ?? '').toLowerCase());

    case 'ends_with':
      return String(fieldValue ?? '').toLowerCase().endsWith(String(compareValue ?? '').toLowerCase());

    default:
      return true;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Get a nested value from an object using dot notation (e.g., "task.status").
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}
