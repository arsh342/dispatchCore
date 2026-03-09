/**
 * Messaging Service
 *
 * API client for 1-on-1 chat messaging between dispatchers, drivers, and recipients.
 * Each conversation is scoped to an order + channel (e.g. "dispatcher-driver").
 */

import { get, post, put, qs } from "@/lib/api";

// ── Types ──

export type ChatChannel =
  | "dispatcher-driver"
  | "dispatcher-recipient"
  | "driver-recipient";

export interface OtherParticipant {
  type: "dispatcher" | "driver" | "recipient";
  id: number | null;
  name: string;
  phone?: string;
  email?: string;
}

export interface ConversationLastMessage {
  text: string;
  senderType: string;
  senderName: string;
  time: string;
}

export interface Conversation {
  orderId: number;
  channel: ChatChannel;
  trackingCode: string;
  status: string;
  pickupAddress: string | null;
  deliveryAddress: string | null;
  recipientName: string | null;
  otherParticipant: OtherParticipant;
  lastMessage: ConversationLastMessage | null;
  unreadCount: number;
}

export interface ChatMsg {
  id: number;
  channel: ChatChannel;
  senderType: "dispatcher" | "driver" | "recipient";
  senderId: number | null;
  senderName: string;
  text: string;
  isRead: boolean;
  time: string;
}

// ── API Calls ──

export async function fetchConversations(
  role: "dispatcher" | "driver" | "recipient",
  trackingCode?: string,
): Promise<Conversation[]> {
  const params: Record<string, string> = { role };
  if (trackingCode) params.tracking_code = trackingCode;
  return get<Conversation[]>(`/messages/conversations${qs(params)}`);
}

export async function fetchMessages(
  orderId: number,
  channel: ChatChannel,
  role: string,
  trackingCode?: string,
): Promise<ChatMsg[]> {
  const params: Record<string, string> = { role };
  if (trackingCode) params.tracking_code = trackingCode;
  return get<ChatMsg[]>(`/messages/${orderId}/${channel}${qs(params)}`);
}

export async function sendChatMessage(
  orderId: number,
  channel: ChatChannel,
  body: {
    sender_type: string;
    sender_id?: number | null;
    sender_name: string;
    text: string;
    tracking_code?: string;
  },
): Promise<ChatMsg> {
  return post<ChatMsg>(`/messages/${orderId}/${channel}`, body);
}

export async function markMessagesRead(
  orderId: number,
  channel: ChatChannel,
  role: string,
): Promise<{ markedRead: number }> {
  return put<{ markedRead: number }>(`/messages/${orderId}/${channel}/read`, {
    role,
  });
}
