/**
 * ChatPanel — Shared real-time chat component (channel-based 1-on-1)
 *
 * Used by dispatcher, driver, and recipient message pages.
 * Handles conversation list (grouped by order+channel), message display, and sending.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageSquare,
  Send,
  Package,
  MapPin,
  User,
  Truck,
  Users,
  Search,
  Loader2,
} from "lucide-react";
import LoadingPackage from "@/components/ui/loading-package";
import {
  fetchConversations,
  fetchMessages,
  sendChatMessage,
  markMessagesRead,
  type Conversation,
  type ConversationBucket,
  type ChatMsg,
  type ChatChannel,
} from "@/services/shared/messaging";
import { useOrderMessages } from "@/hooks/realtime/useSocket";
import { ApiRequestError } from "@/lib/api";

// ── Props ──

interface ChatPanelProps {
  role: "dispatcher" | "driver" | "recipient";
  /** For recipient: the tracking code from the URL */
  trackingCode?: string;
  /** Sender identity info */
  senderId: number | null;
  senderName: string;
  /** Theme color for "my" message bubbles */
  bubbleColor?: string;
  bubbleText?: string;
  /** Pre-select a specific order + channel */
  initialOrderId?: number;
  initialChannel?: ChatChannel;
}

// ── Helpers ──

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function formatTime(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function participantIcon(type: string) {
  if (type === "driver") return Truck;
  if (type === "recipient") return User;
  return Users;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function channelLabel(channel: string, role: string): string {
  const other = channel.split("-").find((p) => p !== role);
  if (other === "driver") return "Driver";
  if (other === "recipient") return "Recipient";
  if (other === "dispatcher") return "Dispatcher";
  return channel;
}

function conversationKey(orderId: number, channel: ChatChannel): string {
  return `${orderId}:${channel}`;
}

function isArchivedStatus(status?: string | null): boolean {
  return status === "DELIVERED" || status === "CANCELLED";
}

// ── Component ──

export default function ChatPanel({
  role,
  trackingCode,
  senderId,
  senderName,
  bubbleColor = "bg-primary",
  bubbleText = "text-white",
  initialOrderId,
  initialChannel,
}: ChatPanelProps) {
  const initialKey =
    initialOrderId && initialChannel
      ? conversationKey(initialOrderId, initialChannel)
      : null;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeBucket, setActiveBucket] =
    useState<ConversationBucket>("active");
  const [activeKey, setActiveKey] = useState<string | null>(initialKey);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeOrderId = activeKey ? Number(activeKey.split(":")[0]) : null;
  const activeChannel = activeKey
    ? (activeKey.split(":").slice(1).join(":") as ChatChannel)
    : null;

  // ── Load conversations ──
  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const convos = await fetchConversations(role, trackingCode, activeBucket);
      setConversations(convos);
      const hasActiveConversation =
        !!activeKey &&
        convos.some(
          (convo) => conversationKey(convo.orderId, convo.channel) === activeKey,
        );

      if (
        !hasActiveConversation &&
        convos.length > 0 &&
        (!initialKey || activeKey !== initialKey)
      ) {
        const first = convos[0];
        setActiveKey(conversationKey(first.orderId, first.channel));
      } else if (
        !hasActiveConversation &&
        convos.length === 0 &&
        (!initialKey || activeKey !== initialKey)
      ) {
        setActiveKey(null);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoading(false);
    }
  }, [role, trackingCode, activeBucket, activeKey]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (
      loading ||
      activeBucket !== "active" ||
      !initialKey ||
      activeKey !== initialKey ||
      conversations.some(
        (convo) => conversationKey(convo.orderId, convo.channel) === initialKey,
      )
    ) {
      return;
    }

    let cancelled = false;

    const loadArchivedConversation = async () => {
      try {
        const archivedConvos = await fetchConversations(
          role,
          trackingCode,
          "archived",
        );
        if (cancelled) return;
        if (
          archivedConvos.some(
            (convo) =>
              conversationKey(convo.orderId, convo.channel) === initialKey,
          )
        ) {
          setActiveBucket("archived");
          setConversations(archivedConvos);
        }
      } catch (err) {
        console.error("Failed to load archived conversations:", err);
      }
    };

    loadArchivedConversation();

    return () => {
      cancelled = true;
    };
  }, [
    loading,
    activeBucket,
    initialKey,
    activeKey,
    conversations,
    role,
    trackingCode,
  ]);

  // ── Load messages for active conversation ──
  const loadMessages = useCallback(async () => {
    if (!activeOrderId || !activeChannel) return;
    setMsgLoading(true);
    try {
      const msgs = await fetchMessages(
        activeOrderId,
        activeChannel,
        role,
        trackingCode,
      );
      setMessages(msgs);
      await markMessagesRead(activeOrderId, activeChannel, role);
      setConversations((prev) =>
        prev.map((c) =>
          c.orderId === activeOrderId && c.channel === activeChannel
            ? { ...c, unreadCount: 0 }
            : c,
        ),
      );
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setMsgLoading(false);
    }
  }, [activeOrderId, activeChannel, role, trackingCode]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // ── Auto-scroll to bottom ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setSendError(null);
  }, [activeKey, activeBucket]);

  // ── Real-time new messages ──
  useOrderMessages(
    activeOrderId,
    {
      onMessage: (msg) => {
        if (
          msg.orderId === activeOrderId &&
          (msg.channel === activeChannel || !msg.channel)
        ) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [
              ...prev,
              {
                ...msg,
                channel: (msg.channel || activeChannel) as ChatChannel,
              },
            ];
          });
          if (msg.senderType !== role && activeChannel) {
            markMessagesRead(msg.orderId, activeChannel, role);
          }
        }
        // Update conversation last message
        setConversations((prev) =>
          prev.map((c) =>
            c.orderId === msg.orderId &&
            (c.channel === msg.channel || c.channel === activeChannel)
              ? {
                  ...c,
                  lastMessage: {
                    text: msg.text,
                    senderType: msg.senderType,
                    senderName: msg.senderName,
                    time: msg.time,
                  },
                  unreadCount:
                    c.orderId === activeOrderId && c.channel === activeChannel
                      ? 0
                      : c.unreadCount + (msg.senderType !== role ? 1 : 0),
                }
              : c,
          ),
        );
      },
    },
    activeChannel ?? undefined,
  );

  // ── Send message ──
  const handleSend = async () => {
    if (!newMessage.trim() || !activeOrderId || !activeChannel) return;
    const text = newMessage.trim();
    setNewMessage("");
    setSendError(null);

    try {
      const sent = await sendChatMessage(activeOrderId, activeChannel, {
        sender_type: role,
        sender_id: senderId,
        sender_name: senderName,
        text,
        tracking_code: trackingCode,
      });
      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });
      // If this was a new conversation, reload the conversation list
      if (isNewConversation) {
        const convos = await fetchConversations(role, trackingCode, activeBucket);
        setConversations(convos);
      }
    } catch (err) {
      if (
        err instanceof ApiRequestError &&
        err.message === "Chat is closed for completed orders"
      ) {
        setSendError("This chat is closed because the order is completed.");
        setActiveBucket("archived");
      } else {
        setSendError("Failed to send message. Please try again.");
      }
      console.error("Failed to send message:", err);
      setNewMessage(text);
    }
  };

  // ── Filter conversations ──
  const filtered = search
    ? conversations.filter(
        (c) =>
          c.trackingCode.toLowerCase().includes(search.toLowerCase()) ||
          c.recipientName?.toLowerCase().includes(search.toLowerCase()) ||
          c.otherParticipant?.name
            ?.toLowerCase()
            .includes(search.toLowerCase()) ||
          c.deliveryAddress?.toLowerCase().includes(search.toLowerCase()),
      )
    : conversations;

  const activeConversation = conversations.find(
    (c) => c.orderId === activeOrderId && c.channel === activeChannel,
  );
  const isArchivedConversation =
    !!activeConversation?.status && isArchivedStatus(activeConversation.status);
  const isReadOnly =
    isArchivedConversation ||
    (activeBucket === "archived" && !!activeOrderId && !!activeChannel);

  // When navigated via deep-link (initialOrderId+initialChannel) but no messages exist yet
  const isNewConversation =
    !activeConversation &&
    !!activeOrderId &&
    !!activeChannel &&
    !!initialOrderId &&
    !!initialChannel;

  const otherRoleLabel =
    activeChannel?.split("-").find((p) => p !== role) ?? "";

  const isMe = (msg: ChatMsg) => msg.senderType === role;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingPackage text="Loading messages..." delay={650} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 h-[calc(100vh-4rem)] bg-card rounded-3xl border border-border overflow-hidden">
      {/* ── Conversation sidebar ── */}
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Messages
          </h2>
          <div className="flex items-center gap-2 mb-3">
            {(["active", "archived"] as ConversationBucket[]).map((bucket) => (
              <button
                key={bucket}
                type="button"
                onClick={() => setActiveBucket(bucket)}
                className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
                  activeBucket === bucket
                    ? "bg-primary text-white"
                    : "bg-secondary text-muted-foreground hover:bg-muted"
                }`}
              >
                {bucket === "active" ? "Active" : "Archived"}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-full bg-muted focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-6 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {activeBucket === "active"
                  ? "No active conversations"
                  : "No archived conversations"}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {activeBucket === "active"
                  ? "Messages appear here while orders are still in progress"
                  : "Completed order chats move here after delivery or cancellation"}
              </p>
            </div>
          ) : (
            filtered.map((convo) => {
              const key = `${convo.orderId}:${convo.channel}`;
              const isActive = key === activeKey;
              const displayName =
                convo.otherParticipant?.name ||
                convo.recipientName ||
                "Unknown";
              const Icon = participantIcon(convo.otherParticipant?.type || "");

              return (
                <button
                  key={key}
                  onClick={() => setActiveKey(key)}
                  className={`w-full px-4 py-3 flex items-start gap-3 transition-colors text-left ${
                    isActive
                      ? "bg-primary/5 border-l-2 border-primary"
                      : "hover:bg-muted border-l-2 border-transparent"
                  }`}
                >
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {getInitials(displayName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-medium text-foreground truncate">
                        {displayName}
                      </span>
                      {convo.lastMessage && (
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">
                          {timeAgo(convo.lastMessage.time)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground truncate">
                        #{convo.trackingCode.slice(0, 8)} ·{" "}
                        {channelLabel(convo.channel, role)}
                      </span>
                    </div>
                    {convo.lastMessage && (
                      <p className="text-xs text-muted-foreground truncate">
                        {convo.lastMessage.senderType === role
                          ? "You: "
                          : `${convo.lastMessage.senderName.split(" ")[0]}: `}
                        {convo.lastMessage.text}
                      </p>
                    )}
                  </div>
                  {convo.unreadCount > 0 && (
                    <span className="h-5 min-w-5 px-1.5 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {convo.unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Chat area ── */}
      <div className="flex-1 flex flex-col">
        {!activeConversation && !isNewConversation ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Select a conversation to start chatting
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {getInitials(
                    activeConversation?.otherParticipant?.name ||
                      otherRoleLabel.charAt(0).toUpperCase() +
                        otherRoleLabel.slice(1) ||
                      "?",
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {activeConversation?.otherParticipant?.name ||
                      otherRoleLabel.charAt(0).toUpperCase() +
                        otherRoleLabel.slice(1) ||
                      "New Conversation"}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {activeConversation ? (
                      <>
                        <Package className="h-3 w-3" />
                        <span>
                          #{activeConversation.trackingCode.slice(0, 8)}
                        </span>
                        <span>·</span>
                        <span className="capitalize">
                          {channelLabel(activeConversation.channel, role)}
                        </span>
                        {activeConversation.deliveryAddress && (
                          <>
                            <span>·</span>
                            <MapPin className="h-3 w-3" />
                            <span className="truncate max-w-[200px]">
                              {activeConversation.deliveryAddress}
                            </span>
                          </>
                        )}
                      </>
                    ) : (
                      <span className="capitalize">
                        New chat · {channelLabel(activeChannel!, role)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {msgLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No messages yet
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Send a message to start the conversation
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const mine = isMe(msg);
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] ${mine ? "items-end" : "items-start"}`}
                      >
                        {!mine && (
                          <p className="text-xs text-muted-foreground mb-1 ml-1">
                            {msg.senderName}{" "}
                            <span className="text-muted-foreground/60">
                              · {msg.senderType}
                            </span>
                          </p>
                        )}
                        <div
                          className={`px-4 py-2.5 rounded-3xl ${
                            mine
                              ? `${bubbleColor} ${bubbleText} rounded-br-md`
                              : "bg-secondary text-foreground rounded-bl-md"
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{msg.text}</p>
                        </div>
                        <p
                          className={`text-[10px] mt-1 ${mine ? "text-right mr-1" : "ml-1"} text-muted-foreground`}
                        >
                          {formatTime(msg.time)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {isReadOnly ? (
              <div className="px-5 py-4 border-t border-border bg-muted/30">
                <p className="text-sm font-medium text-foreground">
                  Chat closed after completion
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Archived conversations stay visible here, but new messages are
                  disabled once the order is delivered or cancelled.
                </p>
              </div>
            ) : (
              <div className="px-5 py-3.5 border-t border-border">
                {sendError && (
                  <div className="mb-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {sendError}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && !e.shiftKey && handleSend()
                    }
                    className="flex-1 px-4 py-2.5 text-sm border border-border rounded-full bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!newMessage.trim()}
                    className={`p-2.5 rounded-full transition-colors ${
                      newMessage.trim()
                        ? `${bubbleColor} ${bubbleText} hover:opacity-90`
                        : "bg-secondary text-muted-foreground cursor-not-allowed"
                    }`}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
