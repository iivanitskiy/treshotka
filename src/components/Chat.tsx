"use client";

import { useState, useEffect, useRef } from "react";
import { useAppSelector } from "@/lib/hooks";
import {
  sendMessage,
  subscribeToMessages,
  Message,
} from "@/lib/services/chatService";
import { Input, Button, Typography } from "antd";
import { SendOutlined } from "@ant-design/icons";

const { Text } = Typography;

export default function Chat({
  roomId,
}: {
  roomId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const user = useAppSelector((state) => state.auth);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToMessages(roomId, (msgs) => {
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user.uid || !user.displayName) return;

    try {
      await sendMessage(roomId, newMessage, user.uid, user.displayName);
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <div
        ref={chatContainerRef}
        className="custom-scrollbar"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {messages.map((msg) => {
          const isMe = msg.senderId === user.uid;
          return (
            <div
              key={msg.id}
              style={{
                display: "flex",
                width: "100%",
                justifyContent: isMe ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  maxWidth: "85%",
                  alignItems: isMe ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "4px",
                    paddingLeft: "4px",
                    paddingRight: "4px",
                  }}
                >
                  {!isMe && (
                    <Text style={{ fontSize: "12px", color: "#9ca3af" }}>
                      {msg.senderName}
                    </Text>
                  )}
                </div>
                <div
                  style={{
                    padding: "10px 16px",
                    borderRadius: "16px",
                    backdropFilter: "blur(4px)",
                    background: isMe ? "#3b82f6" : "rgba(255, 255, 255, 0.1)",
                    color: isMe ? "white" : "#f3f4f6",
                    borderBottomRightRadius: isMe ? "2px" : "16px",
                    borderBottomLeftRadius: isMe ? "16px" : "2px",
                    border: isMe
                      ? "none"
                      : "1px solid rgba(255, 255, 255, 0.05)",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: "16px", paddingTop: "8px" }}>
        <div
          className="chat-input"
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onPressEnter={handleSendMessage}
            placeholder="Написать сообщение..."
            style={{
              borderRadius: "9999px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "white",
              height: "40px",
            }}
          />
          <Button
            type="primary"
            shape="circle"
            icon={<SendOutlined />}
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            style={{ background: "white", color: "#3b82f6" }}
          />
        </div>
      </div>
    </div>
  );
}
