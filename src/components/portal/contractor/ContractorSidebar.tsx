'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePortalContext } from '../PortalContext';
import {
  IconNavDashboard,
  IconNavMarketplace,
  IconNavSchedule,
  IconNavTime,
  IconNavCompliance,
} from '@/components/ui/Icons';
import { User, FileText } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  /** Permission key from CONTRACTOR_PORTAL_PERMISSIONS */
  permission?: string;
}

const contractorNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '',
    icon: <IconNavDashboard size={18} />,
  },
  {
    label: 'Jobs',
    href: '/jobs',
    icon: <IconNavMarketplace size={18} />,
    permission: 'work_orders.view',
  },
  {
    label: 'Bookings',
    href: '/bookings',
    icon: <IconNavSchedule size={18} />,
    permission: 'bookings.view',
  },
  {
    label: 'Time',
    href: '/time',
    icon: <IconNavTime size={18} />,
    permission: 'time_entries.view',
  },
  {
    label: 'Documents',
    href: '/documents',
    icon: <FileText size={18} strokeWidth={1.5} />,
    permission: 'documents.view',
  },
  {
    label: 'Compliance',
    href: '/compliance',
    icon: <IconNavCompliance size={18} />,
    permission: 'compliance.view',
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: <User size={18} strokeWidth={1.5} />,
    permission: 'profile.view',
  },
];

export default function ContractorSidebar() {
  const pathname = usePathname();
  const { orgSlug, orgName } = usePortalContext();
  const basePath = `/portal/${orgSlug}/contractor`;

  return (
    <aside
      className={`
        fixed top-0 left-0 z-40 h-screen w-64
        bg-background/80 backdrop-blur-xl backdrop-saturate-150
        border-r border-border/60
        flex flex-col
        transition-transform duration-normal ease-in-out
        -translate-x-full md:translate-x-0
      `}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600">
          <span className="text-white text-xs font-semibold tracking-tight">
            {orgSlug.slice(0, 2).toUpperCase()}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-base font-semibold tracking-tight text-foreground">
            {orgName || 'Portal'}
          </span>
          <span className="text-[10px] font-medium text-emerald-600 uppercase tracking-wider">
            Contractor
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {contractorNavItems.map((item) => {
            const href = `${basePath}${item.href}`;
            const isActive = item.href === ''
              ? pathname === basePath
              : pathname.startsWith(href);

            return (
              <li key={item.label}>
                <Link
                  href={href}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                    transition-colors duration-fast
                    ${isActive
                      ? 'bg-bg-tertiary text-foreground'
                      : 'text-text-secondary hover:bg-bg-secondary hover:text-foreground'
                    }
                  `}
                >
                  <span className={isActive ? 'text-foreground' : 'text-text-muted'}>
                    {item.icon}
                  </span>
                  <span className="flex-1">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4 text-center">
        <p className="text-[10px] text-text-muted">
          Powered by FlyteDeck
        </p>
      </div>
    </aside>
  );
}
