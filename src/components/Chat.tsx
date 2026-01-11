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

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const isLandscapeMobile = window.matchMedia("(max-height: 500px) and (orientation: landscape)").matches;
      setIsMobile(window.innerWidth <= 768 || isLandscapeMobile);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
      console.error("Ошибка при отправке сообщения", error);
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
          padding: isMobile ? "12px 12px 0 12px" : "16px",
          display: "flex",
          flexDirection: "column",
          gap: isMobile ? "10px" : "16px",
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
                  maxWidth: isMobile ? "90%" : "85%",
                  alignItems: isMe ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "2px",
                    paddingLeft: "4px",
                    paddingRight: "4px",
                  }}
                >
                  {!isMe && (
                    <Text style={{ fontSize: isMobile ? "10px" : "12px", color: "#9ca3af" }}>
                      {msg.senderName}
                    </Text>
                  )}
                </div>
                <div
                  style={{
                    padding: isMobile ? "8px 12px" : "10px 16px",
                    borderRadius: "16px",
                    backdropFilter: "blur(4px)",
                    background: isMe ? "#3b82f6" : "rgba(255, 255, 255, 0.1)",
                    color: isMe ? "white" : "#f3f4f6",
                    fontSize: isMobile ? "14px" : "14px",
                    lineHeight: isMobile ? "1.4" : "1.5",
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

      <div style={{ padding: isMobile ? "10px 12px" : "16px", paddingTop: isMobile ? "8px" : "8px" }}>
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
              height: isMobile ? "36px" : "40px",
              fontSize: isMobile ? "13px" : "14px",
            }}
          />
          <Button
            type="primary"
            shape="circle"
            icon={<SendOutlined />}
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            style={{ 
              background: "white", 
              color: "#3b82f6",
              width: isMobile ? "36px" : "32px",
              height: isMobile ? "36px" : "32px",
              minWidth: isMobile ? "36px" : "32px",
            }}
          />
        </div>
      </div>
    </div>
  );
}
