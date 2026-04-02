import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildSystemPrompt } from '@/lib/ai/prompts';
import { gatherContext } from '@/lib/ai/context';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Gather context from the organization data
    const context = await gatherContext(supabase, user.id);
    const systemPrompt = buildSystemPrompt(context);

    // In production, this would call an AI API.
    // For now, return a placeholder response.
    const response = `Based on your organization data, here is what I found:\n\n` +
      `You have ${context.proposalCount} proposals and ${context.teamSize} team members. ` +
      `I can help you analyze trends, draft proposal content, or answer questions about your projects.\n\n` +
      `(AI integration pending - this is a preview of the assistant interface.)`;

    return NextResponse.json({
      response,
      systemPrompt: systemPrompt.substring(0, 100) + '...',
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
