"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Heading, Subheading } from "~/components/ui/heading";
import { Strong, Text } from "~/components/ui/text";
import { api } from "~/trpc/react";

export default function AppPage() {
  const params = useSearchParams();
  const id = params.get("id");
  const router = useRouter();

  const createChat = api.chat.createChat.useMutation();
  const getChat = api.chat.getById.useQuery({ id: id ?? "" }, { enabled: !!id });
  const addMessage = api.chat.addMessage.useMutation();

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ id?: string; role: string; content: string }[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (getChat.data) {
      setMessages(getChat.data.messages ?? []);
    } else if (!id) {
      setMessages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getChat.data, id]);

  async function callAI(payload: { role: "user" | "assistant"; content: string }[]) {
    try {
      const res = await fetch("/api/chat/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payload }),
      });
      if (!res.ok) {
        console.error("AI call failed", await res.text());
        return null;
      }
      const { reply } = await res.json();
      return reply as string | null;
    } catch (err) {
      console.error("AI call error:", err);
      return null;
    }
  }

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setSending(true);

    try {
      if (!id) {
        // create chat with initial message (server will create the user message)
        const created = await createChat.mutateAsync({ title: undefined, initialMessage: text });
        // navigate to created chat
        router.push(`?id=${created.id}`);
        // show initial user message
        setMessages(created.messages ?? [{ role: "user", content: text }]);

        // call AI with the created messages (initial user message included)
        const payload = (created.messages ?? [{ role: "user", content: text }]).map((m: any) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));
        const reply = await callAI(payload);
        if (reply) {
          await addMessage.mutateAsync({ chatId: created.id, role: "assistant", content: reply });
          setMessages((ms) => [...ms, { role: "assistant", content: reply }]);
        }

        // ensure query fetch updated chat
        await getChat.refetch();
      } else {
        // existing chat: persist user message
        await addMessage.mutateAsync({ chatId: id, role: "user", content: text });
        setMessages((m) => [...m, { role: "user", content: text }]);

        // build payload from server messages (fallback to local messages)
        const history = (getChat.data?.messages ?? messages).map((m: any) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));
        history.push({ role: "user", content: text });

        const reply = await callAI(history);
        if (reply) {
          await addMessage.mutateAsync({ chatId: id, role: "assistant", content: reply });
          setMessages((m) => [...m, { role: "assistant", content: reply }]);
        }

        await getChat.refetch();
      }
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <Heading>Chat</Heading>
      <Subheading>{id ? "Rozmowa" : "Nie wybrano czatu"}</Subheading>

      {!id && (
        <Text>
          Zacznij nowy czat. <Strong>Witamy!</Strong>
        </Text>
      )}

      <div style={{ overflow: "auto", padding: 12, border: "1px solid rgba(255,255,255,0.04)", marginTop: 12, maxHeight: 420 }}>
        {getChat.isLoading && <div className="opacity-50">Ladowanie</div>}
        {!getChat.isLoading && messages.length === 0 && <div className="opacity-50">Brak wiadomosci.</div>}
        {messages.map((m, i) => (
          <div key={i} style={{ 
        marginBottom: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: m.role === 'user' ? 'flex-end' : 'flex-start'
          }}>
        <div style={{ fontSize: 12, opacity: 0.6 }}>{m.role}</div>
        <div style={{ 
          padding: 8, 
          background: m.role === "user" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.24)", 
          borderRadius: 6,
          maxWidth: '70%'
        }} className="text-white">
          {m.content}
        </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={id ? "Napisz wiadomosc" : "Zacznij czat"}
          className="text-white min-h-[44px] w-full resize-none border-none bg-blue-500 p-4 shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0 flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={sending}
        />
        <button onClick={handleSend} className="text-white" disabled={sending}>
          {sending ? "Wysylanie" : "Wyslij"}
        </button>
      </div>
    </div>
  );
}