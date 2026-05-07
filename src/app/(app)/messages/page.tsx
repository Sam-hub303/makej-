"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getMatchesForWorker, getMatchesForEmployer, getMessages, sendMessage, subscribeToMessages } from "@/lib/queries";
import { useNotifications } from "@/components/NotificationProvider";


interface Chat {
  id: string;
  company: string;
  position: string;
  lastMessage: string;
  time: string;
  unread: number;
  status: string;
  avatar: string;
  online: boolean;
  participantId: string;
}

interface ChatMessage {
  id: string;
  sender: "company" | "user";
  text: string;
  time: string;
  type?: "shift_offer";
  data?: { date: string; time: string; pay: string; location: string };
}

function ShiftOfferCard({ offer }: { offer: NonNullable<ChatMessage["data"]> }) {
  if (!offer) return null;
  return (
    <div className="shift-card bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 rounded-2xl p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center justify-center size-8 rounded-full bg-primary/30 text-primary">
          {/* @ts-expect-error - web component */}
          <iconify-icon icon="solar:calendar-bold" class="size-4" />
        </div>
        <span className="font-bold text-primary">Nabídka směny</span>
      </div>
      <div className="space-y-2 mb-4">
        {[
          { icon: "solar:calendar-bold", text: offer.date },
          { icon: "solar:clock-bold", text: offer.time },
          { icon: "solar:wallet-bold", text: offer.pay, cls: "text-secondary font-bold" },
          { icon: "solar:map-point-bold", text: offer.location },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            {/* @ts-expect-error - web component */}
            <iconify-icon icon={item.icon} class="size-4 text-muted-foreground" />
            <span className={item.cls || "text-foreground font-medium"}>{item.text}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button className="flex-1 px-4 py-2 bg-card/80 border border-border/50 rounded-xl text-muted-foreground hover:bg-destructive/20 hover:border-destructive/50 hover:text-destructive transition-all text-sm font-medium">
          Odmítnout
        </button>
        <button className="flex-1 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-xl hover:scale-105 active:scale-95 transition-all text-sm font-bold shadow-lg">
          Přijmout
        </button>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.type === "shift_offer" && message.data) return <ShiftOfferCard offer={message.data} />;
  const isUser = message.sender === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} message-bubble w-full`}>
      <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${isUser ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground" : "bg-card/80 border border-border/50 text-foreground backdrop-blur-sm"}`}>
        <p className="text-sm font-medium whitespace-pre-wrap break-words">{message.text}</p>
        {message.time && <p className={`text-xs mt-1 ${isUser ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{message.time}</p>}
      </div>
    </div>
  );
}

function ChatWindow({ chat, messages, onBack, onSendMessage }: {
  chat: Chat;
  messages: ChatMessage[];
  onBack: () => void;
  onSendMessage: (text: string) => void;
}) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage("");
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full chat-enter absolute inset-0 bg-background z-20">
      <div className="flex items-center justify-between px-4 py-3 bg-card/80 border-b border-border/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center justify-center size-8 rounded-full bg-muted/50 hover:bg-muted transition-colors">
            {/* @ts-expect-error - web component */}
            <iconify-icon icon="solar:alt-arrow-left-bold" class="size-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="flex items-center justify-center size-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 text-2xl">{chat.avatar}</div>
              {chat.online && <div className="absolute bottom-0 right-0 size-3 bg-secondary rounded-full border-2 border-card" />}
            </div>
            <div>
              <h3 className="font-heading font-bold text-foreground">{chat.company}</h3>
              <p className="text-sm text-muted-foreground">{chat.position}</p>
            </div>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/20 border-muted/50">
          Aktivní
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m) => <MessageBubble key={m.id} message={m} />)}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 bg-card/80 border-t border-border/50 backdrop-blur-sm pb-safe">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Napiš zprávu..."
            className="flex-1 px-4 py-3 bg-background border border-border/50 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button onClick={handleSend} className="flex items-center justify-center size-12 rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:scale-105 active:scale-95 transition-all">
            {/* @ts-expect-error - web component */}
            <iconify-icon icon="solar:paperplane-bold" class="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const { user, profile } = useAuth();
  const { openPanel, unreadCount, openChatMatchId, clearOpenChat } = useNotifications();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [allMessages, setAllMessages] = useState<Record<string, ChatMessage[]>>({});
  const [loading, setLoading] = useState(true);

  // Auto-open specific chat when navigating from a notification
  useEffect(() => {
    if (!openChatMatchId || chats.length === 0) return;
    const chat = chats.find((c) => c.id === openChatMatchId);
    if (chat) {
      setSelectedChat(chat);
      clearOpenChat();
    }
  }, [openChatMatchId, chats, clearOpenChat]);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });
  };

  useEffect(() => {
    if (!user || !profile) return;

    const loadChats = async () => {
      setLoading(true);
      
      let newChats: Chat[] = [];
      const msgs: Record<string, ChatMessage[]> = {};

      if (profile.role === "worker") {
        const matches = await getMatchesForWorker(user.id);
        // Only show chats for accepted matches
        newChats = matches
          .filter((m: any) => m.status === "accepted")
          .map((m: any) => ({
            id: m.id,
            company: m.employer?.company_name || m.employer?.name || "Zaměstnavatel",
            position: m.job.title,
            lastMessage: "Nová shoda!",
            time: formatTime(m.created_at),
            unread: 0,
            status: m.status,
            avatar: (m.employer?.company_name || m.employer?.name || "Z").charAt(0),
            online: true,
            participantId: m.employer?.id || "",
          }));
      } else {
        const matches = await getMatchesForEmployer(user.id);
        // Only show chats for accepted matches
        newChats = matches
          .filter((m: any) => m.status === "accepted")
          .map((m: any) => ({
            id: m.id,
            company: m.worker?.name || "Brigádník",
            position: m.job.title,
            lastMessage: "Nová shoda!",
            time: formatTime(m.created_at),
            unread: 0,
            status: m.status,
            avatar: (m.worker?.name || "B").charAt(0),
            online: true,
            participantId: m.worker?.id || "",
          }));
      }

      for (const chat of newChats) {
        const chatMsgs = await getMessages(chat.id);
        msgs[chat.id] = chatMsgs.map((m: any) => ({
          id: m.id,
          sender: m.sender_id === user.id ? "user" : "company",
          text: m.text,
          time: formatTime(m.created_at),
        }));
        
        if (chatMsgs.length > 0) {
          const lastM = chatMsgs[chatMsgs.length - 1];
          chat.lastMessage = lastM.text;
          chat.time = formatTime(lastM.created_at);
        }
      }

      setChats(newChats);
      setAllMessages(msgs);
      setLoading(false);
    };

    loadChats();
  }, [user, profile]);

  useEffect(() => {
    if (!user || chats.length === 0) return;

    const subscriptions = chats.map(chat =>
      subscribeToMessages(chat.id, (payload: any) => {
        const isFromMe = payload.sender_id === user.id;

        // Skip echo of own messages — already added optimistically in handleSendMessage
        if (isFromMe) return;

        const newMsg: ChatMessage = {
          id: payload.id.toString(),
          sender: "company",
          text: payload.text,
          time: formatTime(payload.created_at || new Date().toISOString()),
        };

        setAllMessages(prev => ({
          ...prev,
          [chat.id]: [...(prev[chat.id] || []), newMsg]
        }));

        setChats(prev => prev.map(c => 
          c.id === chat.id 
            ? { 
                ...c, 
                lastMessage: payload.text, 
                time: newMsg.time,
                unread: !isFromMe && selectedChat?.id !== chat.id ? c.unread + 1 : c.unread
              } 
            : c
        ));
      })
    );

    return () => {
      subscriptions.forEach(async (subPromise) => {
        const channel = await subPromise;
        channel.unsubscribe();
      });
    };
  }, [chats.length, user, selectedChat?.id]);

  const handleSendMessage = async (chatId: string, text: string) => {
    if (!user) return;
    
    const tempId = `temp-${Date.now()}`;
    const tempMsg: ChatMessage = {
      id: tempId,
      sender: "user",
      text,
      time: formatTime(new Date().toISOString())
    };

    setAllMessages(prev => ({ ...prev, [chatId]: [...(prev[chatId] || []), tempMsg] }));
    
    await sendMessage(chatId, user.id, text);
  };

  return (
    <>
      <header className="flex items-center justify-between px-6 py-4 z-10">
        <h1 className="font-heading text-3xl font-extrabold tracking-tighter text-foreground">
          Zprávy
        </h1>
        <button onClick={openPanel} className="flex items-center justify-center size-10 rounded-full bg-card border border-border/50 hover:bg-muted transition-colors relative">
          {/* @ts-expect-error - web component */}
          <iconify-icon icon="solar:bell-bold" class="text-foreground size-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-destructive text-white text-[10px] font-black rounded-full flex items-center justify-center border border-background">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </header>

      <main className="flex-1 relative overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : selectedChat ? (
          <ChatWindow 
            chat={selectedChat} 
            messages={allMessages[selectedChat.id] || []} 
            onBack={() => {
              setSelectedChat(null);
              setChats(prev => prev.map(c => c.id === selectedChat.id ? { ...c, unread: 0 } : c));
            }} 
            onSendMessage={(text) => handleSendMessage(selectedChat.id, text)} 
          />
        ) : chats.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center h-full text-center px-6">
            <div className="size-24 rounded-full bg-muted/30 flex items-center justify-center mb-4">
              {/* @ts-expect-error - web component */}
              <iconify-icon icon="solar:chat-round-dots-bold" class="size-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold mb-2">Zatím žádné zprávy</h2>
            <p className="text-muted-foreground text-sm">Až najdeš první shodu s nabídkou, objeví se chat přímo tady.</p>
          </div>
        ) : (
          <div className="h-full flex-1 overflow-y-auto w-full">
            {chats.map((chat) => (
              <div 
                key={chat.id} 
                onClick={() => {
                  setSelectedChat(chat);
                  setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unread: 0 } : c));
                }} 
                className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer border-b border-border/20 w-full"
              >
                <div className="flex items-center justify-center size-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 text-2xl flex-shrink-0">{chat.avatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-foreground truncate">{chat.company}</h3>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{chat.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{chat.position}</p>
                  <p className="text-sm text-foreground/70 truncate mt-1">{chat.lastMessage}</p>
                </div>
                {chat.unread > 0 && <div className="flex items-center justify-center size-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">{chat.unread}</div>}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
