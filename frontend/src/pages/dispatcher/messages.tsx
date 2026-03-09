/**
 * Dispatcher Messages Page
 *
 * Real-time chat with drivers and recipients for all company orders.
 */

import { useSearchParams } from "react-router-dom";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import ChatPanel from "@/components/chat/ChatPanel";
import type { ChatChannel } from "@/services/messaging";
import { useTheme } from "@/hooks/useTheme";

export default function MessagesPage() {
  const userId = localStorage.getItem("dc_user_id");
  const userName = localStorage.getItem("dc_user_name") || "Dispatcher";
  const { isDark, setIsDark } = useTheme();
  const [searchParams] = useSearchParams();
  const initialOrderId = searchParams.get("orderId")
    ? Number(searchParams.get("orderId"))
    : undefined;
  const initialChannel = searchParams.get("channel") as ChatChannel | undefined;

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar isDark={isDark} setIsDark={setIsDark} />
      <main className="flex-1 flex flex-col p-4 overflow-hidden">
        <ChatPanel
          role="dispatcher"
          senderId={userId ? Number(userId) : null}
          senderName={userName}
          bubbleColor="bg-primary"
          bubbleText="text-white"
          initialOrderId={initialOrderId}
          initialChannel={initialChannel}
        />
      </main>
    </div>
  );
}
