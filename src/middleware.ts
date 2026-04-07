import { updateSession } from '@/lib/supabase/middleware';
import type { NextRequest } from 'next/server';
import { LOCALE_COOKIE, LOCALE_HEADER, DEFAULT_LOCALE, hasLocale } from '@/lib/i18n/config';

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  // Forward the user's locale preference as a response header
  // so server components can read it without an additional DB call.
  const localeCookie = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = localeCookie && hasLocale(localeCookie) ? localeCookie : DEFAULT_LOCALE;
  response.headers.set(LOCALE_HEADER, locale);

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
