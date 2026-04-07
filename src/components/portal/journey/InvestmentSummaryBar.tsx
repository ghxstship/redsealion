'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { fmTransition } from '@/lib/motion';
import { formatCurrency } from '@/lib/utils';
import type { PaymentTerms } from '@/types/database';

interface InvestmentSummaryBarProps {
  coreTotal: number;
  addonTotal: number;
  paymentTerms: PaymentTerms | null;
  currency?: string;
  onAccept: () => void;
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
  currency = 'USD',
  onAccept,
  canApprove = true,
}: InvestmentSummaryBarProps) {
  const total = coreTotal + addonTotal;
  const depositPercent = paymentTerms?.depositPercent ?? 50;
  const deposit = Math.round(total * (depositPercent / 100));
  const balance = total - deposit;

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

            {canApprove && (
              <button
                type="button"
                onClick={onAccept}
                className="w-full py-3.5 rounded-xl text-sm font-semibold tracking-wide text-white transition-[opacity,transform] duration-slow hover:opacity-90 active:scale-[0.98]"
                style={{ backgroundColor: 'var(--org-primary)' }}
              >
                Accept &amp; Proceed
              </button>
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
          {canApprove && (
            <button
              type="button"
              onClick={onAccept}
              className="w-full py-3 rounded-xl text-sm font-semibold tracking-wide text-white transition-[opacity,transform] duration-slow hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: 'var(--org-primary)' }}
            >
              Accept &amp; Proceed
            </button>
          )}
        </div>
      </motion.div>
    </>
  );
}
