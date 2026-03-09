/**
 * Employed Driver Messages Page
 *
 * Real-time chat with dispatchers and recipients for assigned orders.
 */

import { useSearchParams } from "react-router-dom";
import { EmployedDriverSidebar } from "@/components/dashboard/employed-driver-sidebar";
import ChatPanel from "@/components/chat/ChatPanel";
import type { ChatChannel } from "@/services/messaging";
import { useTheme } from "@/hooks/useTheme";

export default function EmployedDriverMessagesPage() {
  const driverId = localStorage.getItem("dc_driver_id");
  const driverName = localStorage.getItem("dc_user_name") || "Driver";
  const { isDark, setIsDark } = useTheme();
  const [searchParams] = useSearchParams();
  const initialOrderId = searchParams.get("orderId")
    ? Number(searchParams.get("orderId"))
    : undefined;
  const initialChannel = searchParams.get("channel") as ChatChannel | undefined;

  return (
    <div className="flex h-screen bg-background">
      <EmployedDriverSidebar isDark={isDark} setIsDark={setIsDark} />
      <main className="flex-1 flex flex-col p-4 overflow-hidden">
        <ChatPanel
          role="driver"
          senderId={driverId ? Number(driverId) : null}
          senderName={driverName}
          bubbleColor="bg-primary/90"
          bubbleText="text-white"
          initialOrderId={initialOrderId}
          initialChannel={initialChannel}
        />
      </main>
    </div>
  );
}
