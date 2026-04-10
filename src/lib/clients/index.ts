import { CONTACT_ROLE_OPTIONS } from '@/lib/clients/contact-roles';

export { CONTACT_ROLE_OPTIONS };
export type ContactRole = (typeof CONTACT_ROLE_OPTIONS)[number]['value'];
