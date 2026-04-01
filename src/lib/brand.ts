import type { BrandConfig } from '@/types/database';

/**
 * Converts a BrandConfig into CSS custom properties
 * that can be applied via a style prop to brand a portal.
 */
export function getBrandCSSVariables(
  brandConfig: BrandConfig
): Record<string, string> {
  return {
    '--org-primary': brandConfig.primaryColor,
    '--org-secondary': brandConfig.secondaryColor,
    '--org-accent': brandConfig.accentColor,
    '--background': brandConfig.backgroundColor,
    '--font-heading': brandConfig.fontHeading,
    '--font-body': brandConfig.fontBody,
  };
}

/**
 * Returns sensible default brand configuration
 * used when an organization has not customized their portal.
 */
export function getDefaultBrandConfig(): BrandConfig {
  return {
    primaryColor: '#1A1A1A',
    secondaryColor: '#555555',
    accentColor: '#1A1A1A',
    backgroundColor: '#FFFFFF',
    fontHeading: 'Inter, system-ui, sans-serif',
    fontBody: 'Inter, system-ui, sans-serif',
    portalTitle: 'Client Portal',
    companyTagline: '',
    footerText: '',
    emailFromName: '',
    emailReplyTo: '',
  };
}
