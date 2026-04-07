import { TierGate } from '@/components/shared/TierGate';
import AiChatPanel from '@/components/admin/ai/AiChatPanel';
import PageHeader from '@/components/shared/PageHeader';

export default function AiPage() {
  return (
    <TierGate feature="ai_assistant">
<PageHeader
        title="AI Assistant"
        subtitle="Ask questions about your proposals, projects, and business data."
      />

      <AiChatPanel />
    </TierGate>
  );
}
