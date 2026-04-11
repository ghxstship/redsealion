import { TierGate } from '@/components/shared/TierGate';
import { RoleGate } from '@/components/shared/RoleGate';
import AiChatPanel from '@/components/admin/ai/AiChatPanel';
import PageHeader from '@/components/shared/PageHeader';

export default function AiPage() {
  return (
    <RoleGate resource="ai_assistant">
    <TierGate feature="ai_assistant">
<PageHeader
        title="AI Assistant"
        subtitle="Ask questions about your proposals, projects, and business data."
      />

      <AiChatPanel />
    </TierGate>
    </RoleGate>
  );
}
