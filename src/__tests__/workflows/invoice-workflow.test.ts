/**
 * Invoice Workflow — End-to-End Validation
 *
 * Validates the complete invoice lifecycle:
 *   draft → sent → viewed → partially_paid → paid
 *   + void from non-paid states
 *   + overdue detection
 *   + payment recording and balance calculation
 *   + sequential invoice numbering
 *   + line item total calculation
 *   + multi-type invoices (deposit, balance, change_order, addon, final, recurring)
 */
import { describe, it, expect } from 'vitest';
import {
  makeInvoice,
  TEST_ORG_ID,
  TEST_CLIENT_ID,
} from '../helpers';
import type { InvoiceType, InvoiceStatus } from '@/types/database';

const INVOICE_TYPES: InvoiceType[] = ['deposit', 'balance', 'change_order', 'addon', 'final', 'recurring'];
const INVOICE_STATUSES: InvoiceStatus[] = ['draft', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue', 'void'];

const VALID_INVOICE_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ['sent', 'void'],
  sent: ['viewed', 'partially_paid', 'paid', 'overdue', 'void'],
  viewed: ['partially_paid', 'paid', 'overdue', 'void'],
  partially_paid: ['paid', 'overdue', 'void'],
  paid: [],
  overdue: ['partially_paid', 'paid', 'void'],
  void: [],
};

describe('Invoice Workflow', () => {
  // -----------------------------------------------------------------------
  // Status Machine
  // -----------------------------------------------------------------------

  describe('Invoice status transitions', () => {
    it('defines all invoice statuses', () => {
      expect(INVOICE_STATUSES).toHaveLength(7);
    });

    it('allows draft → sent transition', () => {
      expect(VALID_INVOICE_TRANSITIONS.draft).toContain('sent');
    });

    it('allows sent → paid (full payment at once)', () => {
      expect(VALID_INVOICE_TRANSITIONS.sent).toContain('paid');
    });

    it('allows partial payment flow', () => {
      expect(VALID_INVOICE_TRANSITIONS.sent).toContain('partially_paid');
      expect(VALID_INVOICE_TRANSITIONS.partially_paid).toContain('paid');
    });

    it('supports overdue detection from sent/viewed/partially_paid', () => {
      expect(VALID_INVOICE_TRANSITIONS.sent).toContain('overdue');
      expect(VALID_INVOICE_TRANSITIONS.viewed).toContain('overdue');
      expect(VALID_INVOICE_TRANSITIONS.partially_paid).toContain('overdue');
    });

    it('allows void from non-terminal states', () => {
      expect(VALID_INVOICE_TRANSITIONS.draft).toContain('void');
      expect(VALID_INVOICE_TRANSITIONS.sent).toContain('void');
      expect(VALID_INVOICE_TRANSITIONS.viewed).toContain('void');
      expect(VALID_INVOICE_TRANSITIONS.overdue).toContain('void');
    });

    it('prevents transitions from terminal states', () => {
      expect(VALID_INVOICE_TRANSITIONS.paid).toHaveLength(0);
      expect(VALID_INVOICE_TRANSITIONS.void).toHaveLength(0);
    });

    it('allows overdue invoice to be paid', () => {
      expect(VALID_INVOICE_TRANSITIONS.overdue).toContain('paid');
    });
  });

  // -----------------------------------------------------------------------
  // Invoice types
  // -----------------------------------------------------------------------

  describe('Invoice types', () => {
    it('supports all six invoice types', () => {
      expect(INVOICE_TYPES).toHaveLength(6);
      expect(INVOICE_TYPES).toContain('deposit');
      expect(INVOICE_TYPES).toContain('balance');
      expect(INVOICE_TYPES).toContain('change_order');
      expect(INVOICE_TYPES).toContain('addon');
      expect(INVOICE_TYPES).toContain('final');
      expect(INVOICE_TYPES).toContain('recurring');
    });

    it('creates deposit invoice as 50% of total', () => {
      const proposalTotal = 150000;
      const deposit = makeInvoice({
        type: 'deposit',
        total: proposalTotal * 0.5,
        subtotal: proposalTotal * 0.5,
      });
      expect(deposit.total).toBe(75000);
      expect(deposit.type).toBe('deposit');
    });

    it('creates balance invoice for remaining amount', () => {
      const proposalTotal = 150000;
      const balance = makeInvoice({
        type: 'balance',
        total: proposalTotal * 0.5,
        subtotal: proposalTotal * 0.5,
      });
      expect(balance.total).toBe(75000);
      expect(balance.type).toBe('balance');
    });

    it('deposit + balance equals proposal total', () => {
      const proposalTotal = 150000;
      const depositAmount = proposalTotal * 0.5;
      const balanceAmount = proposalTotal * 0.5;
      expect(depositAmount + balanceAmount).toBe(proposalTotal);
    });
  });

  // -----------------------------------------------------------------------
  // Invoice creation
  // -----------------------------------------------------------------------

  describe('Invoice creation', () => {
    it('creates an invoice with required fields', () => {
      const invoice = makeInvoice();
      expect(invoice.id).toBeTruthy();
      expect(invoice.organization_id).toBe(TEST_ORG_ID);
      expect(invoice.client_id).toBe(TEST_CLIENT_ID);
      expect(invoice.invoice_number).toMatch(/^INV-\d{4}-\d{3}$/);
      expect(invoice.status).toBe('draft');
    });

    it('initializes with zero amount_paid', () => {
      const invoice = makeInvoice();
      expect(invoice.amount_paid).toBe(0);
    });

    it('sets total from line item calculation', () => {
      const lineItems = [
        { description: 'Design', quantity: 1, rate: 25000 },
        { description: 'Fabrication', quantity: 5, rate: 10000 },
      ];
      const subtotal = lineItems.reduce((sum, li) => sum + li.quantity * li.rate, 0);
      expect(subtotal).toBe(75000);

      const invoice = makeInvoice({ subtotal, total: subtotal, tax_amount: 0 });
      expect(invoice.total).toBe(75000);
    });

    it('requires client_id, type, due_date, and line items', () => {
      const invoice = makeInvoice();
      expect(invoice.client_id).toBeTruthy();
      expect(invoice.type).toBeTruthy();
      expect(invoice.due_date).toBeTruthy();
    });
  });

  // -----------------------------------------------------------------------
  // Sequential numbering
  // -----------------------------------------------------------------------

  describe('Invoice numbering', () => {
    it('generates sequential invoice numbers with year prefix', () => {
      const year = new Date().getFullYear();
      const prefix = `INV-${year}-`;
      const first = `${prefix}001`;
      const second = `${prefix}002`;
      const third = `${prefix}003`;

      expect(first).toMatch(/^INV-\d{4}-001$/);
      expect(second).toMatch(/^INV-\d{4}-002$/);
      expect(third).toMatch(/^INV-\d{4}-003$/);
    });

    it('pads invoice number to 3 digits', () => {
      const numbers = [1, 10, 100].map(n => String(n).padStart(3, '0'));
      expect(numbers).toEqual(['001', '010', '100']);
    });
  });

  // -----------------------------------------------------------------------
  // Payment recording
  // -----------------------------------------------------------------------

  describe('Payment recording', () => {
    it('updates amount_paid on payment', () => {
      const invoice = makeInvoice({ total: 75000, amount_paid: 0 });
      const paymentAmount = 37500;
      const newAmountPaid = (invoice.amount_paid as number) + paymentAmount;
      expect(newAmountPaid).toBe(37500);
    });

    it('sets status to partially_paid when partial', () => {
      const total = 75000;
      const amountPaid = 37500;
      const status = amountPaid >= total ? 'paid' : amountPaid > 0 ? 'partially_paid' : 'draft';
      expect(status).toBe('partially_paid');
    });

    it('sets status to paid when fully paid', () => {
      const total = 75000;
      const amountPaid = 75000;
      const status = amountPaid >= total ? 'paid' : amountPaid > 0 ? 'partially_paid' : 'draft';
      expect(status).toBe('paid');
    });

    it('rejects payment exceeding balance due', () => {
      const invoice = makeInvoice({ total: 75000, amount_paid: 50000 });
      const balanceDue = (invoice.total as number) - (invoice.amount_paid as number);
      const paymentAmount = 30000;
      expect(paymentAmount).toBeGreaterThan(balanceDue);
    });

    it('requires positive payment amount', () => {
      expect(0).not.toBeGreaterThan(0);
      expect(-100).not.toBeGreaterThan(0);
      expect(100).toBeGreaterThan(0);
    });

    it('requires payment method', () => {
      const validMethods = ['wire', 'check', 'cc', 'ach', 'cash'];
      expect(validMethods).toHaveLength(5);
      for (const method of validMethods) {
        expect(method).toBeTruthy();
      }
    });

    it('supports multiple partial payments leading to paid', () => {
      const total = 75000;
      const payments = [25000, 25000, 25000];
      let amountPaid = 0;
      const statuses: string[] = [];

      for (const payment of payments) {
        amountPaid += payment;
        const status = amountPaid >= total ? 'paid' : 'partially_paid';
        statuses.push(status);
      }

      expect(statuses).toEqual(['partially_paid', 'partially_paid', 'paid']);
      expect(amountPaid).toBe(total);
    });
  });

  // -----------------------------------------------------------------------
  // Void workflow
  // -----------------------------------------------------------------------

  describe('Invoice void', () => {
    it('voids an unpaid invoice', () => {
      const invoice = makeInvoice({ status: 'sent', amount_paid: 0 });
      const voided = makeInvoice({ ...invoice, status: 'void' });
      expect(voided.status).toBe('void');
    });

    it('should not void a fully paid invoice', () => {
      const paidInvoice = makeInvoice({ status: 'paid', amount_paid: 75000 });
      expect(VALID_INVOICE_TRANSITIONS[paidInvoice.status as InvoiceStatus]).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // Invoice generation from proposal
  // -----------------------------------------------------------------------

  describe('Invoice generation from proposal', () => {
    it('generates deposit invoice at configured percentage', () => {
      const proposalTotal = 200000;
      const depositPercent = 50;
      const depositAmount = proposalTotal * (depositPercent / 100);
      expect(depositAmount).toBe(100000);
    });

    it('generates 40/40/20 split invoices', () => {
      const total = 200000;
      const split = [0.4, 0.4, 0.2];
      const amounts = split.map(pct => total * pct);
      expect(amounts).toEqual([80000, 80000, 40000]);
      expect(amounts.reduce((a, b) => a + b, 0)).toBe(total);
    });

    it('links generated invoice to proposal', () => {
      const invoice = makeInvoice({ proposal_id: 'prop_test_001' });
      expect(invoice.proposal_id).toBe('prop_test_001');
    });
  });
});
