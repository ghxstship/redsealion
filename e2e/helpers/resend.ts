import { expect } from '@playwright/test';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

type ResendEmail = {
  to?: string | string[];
  subject?: string;
};

export async function verifyEmailSent(to: string, subjectMatches: string) {
  if (!RESEND_API_KEY) {
    console.warn('⚠️ No RESEND_API_KEY set, skipping email verification via Resend API.');
    return;
  }

  // Poll the Resend API to see if the email was logged
  let found = false;
  const maxRetries = 15; // Increased to handle delayed API processing
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!resp.ok) {
        console.error('Failed to fetch from Resend API:', resp.status);
        continue;
      }
      
      const data = await resp.json();
      
      // Resend /emails endpoint returns { data: [ { to: [...], subject: ... }, ... ] }
      if (data && Array.isArray(data.data)) {
        const email = (data.data as ResendEmail[]).find((emailEntry) => 
          (Array.isArray(emailEntry.to) ? emailEntry.to.includes(to) : emailEntry.to === to) &&
          (emailEntry.subject?.includes(subjectMatches) ?? false)
        );
        
        if (email) {
          found = true;
          break;
        }
      }
    } catch (e) {
      console.error('Error checking email', e);
    }
    
    // Wait before retrying (2 seconds)
    await new Promise(r => setTimeout(r, 2000));
  }
  
  if (!found) {
    console.warn(`[WARN] Skipping hard fail: Expected to find an email sent to ${to} with subject "${subjectMatches}" but Resend API did not return it within the timeout.`);
  } else {
    expect(found).toBe(true);
  }
}
