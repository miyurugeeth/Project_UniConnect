import React, { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export default function IndustrialChat({ room, senderId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  async function fetchMessages() {
    if (!room?.id) return;
    try {
      const res = await fetch(`${API_BASE}/api/industrial/rooms/${room.id}/messages`);
      if (res.ok) {
        setMessages(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch room messages:", err);
    }
  }

  useEffect(() => {
    fetchMessages();
  }, [room?.id]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || !room?.id) return;

    const res = await fetch(`${API_BASE}/api/industrial/rooms/${room.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: room.id,
        senderId: senderId,
        messageText: text.trim(),
      }),
    });

    if (res.ok) {
      setText("");
      await fetchMessages();
    }
  }

  return (
    <div className="industrial-chat-box">
      <h3>{room.industryName} — Industry Chat</h3>
      <div className="industrial-chat-messages">
        {messages.map((m) => (
          <div key={m.id} className="industrial-chat-item">
            <span>{m.messageText}</span>
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} className="industrial-chat-form">
        <input
          type="text"
          placeholder={`Message ${room.industryName} peers...`}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}