import { test, expect } from '@playwright/test';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

export async function verifyEmailSent(to: string, subjectMatches: string) {
  if (!RESEND_API_KEY) {
    console.warn('⚠️ No RESEND_API_KEY set, skipping email verification via Resend API.');
    return;
  }

  // Poll the Resend API to see if the email was logged
  let found = false;
  const maxRetries = 5;
  
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
        const email = data.data.find((e: any) => 
          (Array.isArray(e.to) ? e.to.includes(to) : e.to === to) &&
          e.subject.includes(subjectMatches)
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
  
  expect(found, `Expected to find an email sent to ${to} with subject "${subjectMatches}"`).toBe(true);
}
