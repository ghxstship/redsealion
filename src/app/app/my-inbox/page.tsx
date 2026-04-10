import { createClient } from '@/lib/supabase/server';
import MyInboxTable, { type NotificationRow } from '@/components/admin/my-inbox/MyInboxTable';
import MyInboxHeader from '@/components/admin/my-inbox/MyInboxHeader';

async function getMyNotifications(): Promise<NotificationRow[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('archived', false)
      .order('created_at', { ascending: false })
      .limit(200);

    return notifications || [];
  } catch {
    return [];
  }
}

export default async function MyInboxPage() {
  const notifications = await getMyNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div>
      <MyInboxHeader unreadCount={unreadCount} />
      <MyInboxTable notifications={notifications} />
    </div>
  );
}
