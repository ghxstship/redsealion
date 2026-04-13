'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { fmTransition } from '@/lib/motion';
import { formatCurrency } from '@/lib/utils';
import type { PaymentTerms } from '@/types/database';
import { ChevronDown, AlertCircle, PenLine } from 'lucide-react';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';

interface InvestmentSummaryBarProps {
  coreTotal: number;
  addonTotal: number;
  paymentTerms: PaymentTerms | null;
  assumptions?: string[];
  currency?: string;
  onAccept: (signature: string) => void;
  canApprove?: boolean;
}

function AnimatedNumber({
  value,
  currency = 'USD',
}: {
  value: number;
  currency?: string;
}) {
  const spring = useSpring(value, fmTransition.counter);
  const display = useTransform(spring, (v) => formatCurrency(Math.round(v), currency));
  const [rendered, setRendered] = useState(formatCurrency(value, currency));
  const unsub = useRef<(() => void) | null>(null);

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    unsub.current = display.on('change', (v) => setRendered(v));
    return () => unsub.current?.();
  }, [display]);

  return <span>{rendered}</span>;
}

export default function InvestmentSummaryBar({
  coreTotal,
  addonTotal,
  paymentTerms,
  assumptions = [],
  currency = 'USD',
  onAccept,
  canApprove = true,
}: InvestmentSummaryBarProps) {
  const total = coreTotal + addonTotal;
  const depositPercent = Number(paymentTerms?.depositPercent ?? paymentTerms?.deposit_percent ?? 50);
  const deposit = Math.round(total * (depositPercent / 100));
  const balance = total - deposit;

  const [showAssumptions, setShowAssumptions] = useState(false);
  const [showSignatureFlow, setShowSignatureFlow] = useState(false);
  const [typedSignature, setTypedSignature] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const canSign = typedSignature.trim().length > 2 && agreeToTerms;

  const handleAccept = () => {
    if (!showSignatureFlow) {
      setShowSignatureFlow(true);
      return;
    }
    if (canSign) {
      onAccept(typedSignature.trim());
    }
  };

  const signatureContent = (
    <AnimatePresence>
      {showSignatureFlow && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={fmTransition.enter}
          className="overflow-hidden"
        >
          <div className="pt-4 pb-2">
            <div className="flex items-center gap-2 mb-3">
              <PenLine size={14} className="text-text-muted" />
              <span className="text-xs font-medium text-text-secondary">Type your legal name to sign</span>
            </div>
            <FormInput
              type="text"
              value={typedSignature}
              onChange={(e) => setTypedSignature(e.target.value)}
              placeholder="Full legal name"
              className="w-full rounded-lg border border-border bg-bg-secondary/30 px-3 py-2.5 text-sm font-medium text-foreground placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-org-primary/30"
              style={{ fontFamily: 'cursive, serif' }}
              autoFocus
            />
            {typedSignature.trim().length > 2 && (
              <p
                className="mt-2 text-xl text-center py-2 border-b border-border"
                style={{ fontFamily: 'cursive, serif', color: 'var(--org-primary)' }}
              >
                {typedSignature}
              </p>
            )}
            <label className="flex items-start gap-2 mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="mt-0.5 rounded border-border"
              />
              <span className="text-[10px] text-text-muted leading-snug">
                I agree to the terms, scope, and investment outlined in this proposal.
              </span>
            </label>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const assumptionsContent = assumptions.length > 0 && (
    <div className="mt-4">
      <Button
        type="button"
        onClick={() => setShowAssumptions(!showAssumptions)}
        className="flex items-center gap-1.5 text-[10px] font-medium text-text-muted hover:text-text-secondary transition-colors"
      >
        <AlertCircle size={11} />
        Key Assumptions ({assumptions.length})
        <ChevronDown
          size={11}
          className={`transition-transform ${showAssumptions ? 'rotate-180' : ''}`}
        />
      </Button>
      <AnimatePresence>
        {showAssumptions && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={fmTransition.enter}
            className="mt-2 space-y-1 overflow-hidden"
          >
            {assumptions.map((a, i) => (
              <li key={i} className="text-[10px] text-text-muted pl-3 border-l border-border">
                {a}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <>
      {/* Desktop: fixed right sidebar */}
      <div className="hidden lg:block fixed right-0 top-0 bottom-0 w-80 xl:w-96 z-40 pointer-events-none">
        <div className="h-full flex items-center pr-6 xl:pr-10">
          <motion.div
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5, ...fmTransition.slow }}
            className="w-full bg-background/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl shadow-black/5 p-8 pointer-events-auto"
          >
            <h3 className="text-xs font-medium tracking-[0.2em] uppercase text-text-muted mb-8">
              Investment Summary
            </h3>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-text-secondary">Core Investment</span>
                <span className="text-base font-light text-foreground">
                  <AnimatedNumber value={coreTotal} currency={currency} />
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-addon">Selected Add-Ons</span>
                <span className="text-base font-light text-addon">
                  <AnimatedNumber value={addonTotal} currency={currency} />
                </span>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-semibold text-foreground">Total</span>
                <span className="text-2xl font-light tracking-tight text-foreground">
                  <AnimatedNumber value={total} currency={currency} />
                </span>
              </div>
            </div>

            <div className="space-y-2 mb-8 p-4 rounded-lg bg-bg-secondary">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-text-muted">
                  Deposit ({depositPercent}%)
                </span>
                <span className="text-sm font-medium text-foreground">
                  <AnimatedNumber value={deposit} currency={currency} />
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-text-muted">Balance</span>
                <span className="text-sm text-text-secondary">
                  <AnimatedNumber value={balance} currency={currency} />
                </span>
              </div>
            </div>

            {assumptionsContent}

            {signatureContent}

            {canApprove && (
              <Button
                type="button"
                onClick={handleAccept}
                disabled={showSignatureFlow && !canSign}
                className={`w-full mt-4 py-3.5 rounded-xl text-sm font-semibold tracking-wide text-white transition-[opacity,transform] duration-slow hover:opacity-90 active:scale-[0.98] ${
                  showSignatureFlow && !canSign ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={{ backgroundColor: 'var(--org-primary)' }}
              >
                {showSignatureFlow ? 'Sign & Accept' : 'Accept & Proceed'}
              </Button>
            )}
          </motion.div>
        </div>
      </div>

      {/* Mobile: sticky bottom bar */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.3, ...fmTransition.springGentle }}
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border shadow-[0_-4px_30px_rgba(0,0,0,0.08)]"
      >
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-text-muted mb-0.5">Total Investment</p>
              <p className="text-xl font-light tracking-tight text-foreground">
                <AnimatedNumber value={total} currency={currency} />
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-text-muted uppercase tracking-wider">
                {addonTotal > 0 && (
                  <span className="text-addon">
                    +<AnimatedNumber value={addonTotal} currency={currency} /> add-ons
                  </span>
                )}
              </p>
            </div>
          </div>

          {signatureContent}

          {canApprove && (
            <Button
              type="button"
              onClick={handleAccept}
              disabled={showSignatureFlow && !canSign}
              className={`w-full py-3 rounded-xl text-sm font-semibold tracking-wide text-white transition-[opacity,transform] duration-slow hover:opacity-90 active:scale-[0.98] ${
                showSignatureFlow && !canSign ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              style={{ backgroundColor: 'var(--org-primary)' }}
            >
              {showSignatureFlow ? 'Sign & Accept' : 'Accept & Proceed'}
            </Button>
          )}
        </div>
      </motion.div>
    </>
  );
}
