interface PortalFooterProps {
  footerText?: string;
  orgName: string;
}

export default function PortalFooter({ footerText, orgName }: PortalFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-6 lg:px-8 py-8">
        <p className="text-xs text-text-muted text-center">
          {footerText || `\u00A9 ${year} ${orgName}. All rights reserved.`}
        </p>
      </div>
    </footer>
  );
}
