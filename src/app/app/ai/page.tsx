import { TierGate } from '@/components/shared/TierGate';
import AiChatPanel from '@/components/admin/ai/AiChatPanel';

export default function AiPage() {
  return (
    <TierGate feature="ai_assistant">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          AI Assistant
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Ask questions about your proposals, projects, and business data.
        </p>
      </div>

      <AiChatPanel />
    </TierGate>
  );
}
