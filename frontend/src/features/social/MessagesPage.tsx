import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/primitives";
import { timeAgo } from "@/lib/format";
import { Avatar } from "./Avatar";
import { useChatRooms, useChatMessages, useSendMessage } from "./hooks";

export function MessagesPage() {
  const { t } = useTranslation();
  const { data: rooms = [], isLoading } = useChatRooms();
  const [activeId, setActiveId] = useState<number | null>(null);
  const { data: messages = [] } = useChatMessages(activeId);
  const send = useSendMessage(activeId);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-select the first room.
  useEffect(() => {
    if (activeId == null && rooms.length) setActiveId(rooms[0].id);
  }, [rooms, activeId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const active = rooms.find((r) => r.id === activeId);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">{t("pages.messages")}</h1>
        <p className="text-sm text-muted">{t("pages.messagesSubtitle")}</p>
      </header>

      <div className="grid h-[70vh] gap-4 md:grid-cols-[300px_1fr]">
        {/* Rooms */}
        <Card className="overflow-y-auto p-2">
          {isLoading && <p className="p-4 text-sm text-muted">{t("common.loading")}</p>}
          {!isLoading && rooms.length === 0 && (
            <p className="p-4 text-sm text-muted">{t("messages.noConversations")}</p>
          )}
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => setActiveId(room.id)}
              className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                room.id === activeId ? "bg-accent/15" : "hover:bg-white/5"
              }`}
            >
              {room.other_user && <Avatar user={room.other_user} size={40} linked={false} />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{room.other_user?.full_name}</p>
                <p className="truncate text-xs text-muted">{room.last_message || t("messages.noMessages")}</p>
              </div>
              {room.unread > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                  {room.unread}
                </span>
              )}
            </button>
          ))}
        </Card>

        {/* Thread */}
        <Card className="flex flex-col p-0">
          {active ? (
            <>
              <div className="flex items-center gap-3 border-b border-border p-4">
                {active.other_user && <Avatar user={active.other_user} size={36} />}
                <p className="font-semibold">{active.other_user?.full_name}</p>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.is_mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                        m.is_mine ? "bg-accent text-white" : "bg-white/8 text-text"
                      }`}
                    >
                      {m.content}
                      <span className="mt-1 block text-[10px] opacity-60">{timeAgo(m.created_at)}</span>
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (draft.trim()) {
                    send.mutate(draft);
                    setDraft("");
                  }
                }}
                className="flex gap-2 border-t border-border p-3"
              >
                <input
                  className="input"
                  placeholder={t("messages.typeMessage")}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button className="btn-primary px-5" disabled={send.isPending}>
                  {t("common.send")}
                </button>
              </form>
            </>
          ) : (
            <div className="grid flex-1 place-items-center text-muted">
              {t("messages.selectConversation")}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
