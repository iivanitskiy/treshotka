"use client";

import { useState, useEffect, useRef, type MouseEvent as ReactMouseEvent } from "react";
import { useAppSelector } from "@/lib/hooks";
import {
  sendMessage,
  subscribeToMessages,
  deleteMessage,
  Message,
} from "@/lib/services/chatService";
import { Input, Button, Typography } from "antd";
import { DeleteOutlined, SendOutlined } from "@ant-design/icons";
import { Timestamp } from "firebase/firestore";
import styles from "./Chat.module.css";

const { Text } = Typography;

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatMessageTime(createdAt: Message["createdAt"] | undefined): string {
  if (!createdAt || typeof (createdAt as Timestamp).toDate !== "function") return "";
  try {
    const date = (createdAt as Timestamp).toDate();
    const now = new Date();
    const time = date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
    if (isSameCalendarDay(date, now)) return time;
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = String(date.getFullYear());
    return `${dd}.${mm}.${yyyy}, ${time}`;
  } catch {
    return "";
  }
}

export default function Chat({
  roomId,
}: {
  roomId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
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

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-chat-message-id]")) return;
      setSelectedMessageId(null);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user.uid || !user.displayName) return;

    try {
      await sendMessage(roomId, newMessage, user.uid, user.displayName);
      setNewMessage("");
    } catch (error) {
      console.error("Ошибка при отправке сообщения", error);
    }
  };

  const handleDeleteMessage = async (messageId: string, e: ReactMouseEvent<HTMLElement>) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await deleteMessage(roomId, messageId);
      setSelectedMessageId(null);
    } catch (error) {
      console.error("Ошибка при удалении сообщения", error);
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
          const canDelete =
            Boolean(user.uid) &&
            (msg.senderId === user.uid || user.role === "admin");
          const isSelected = selectedMessageId === msg.id;
          const timeLabel = formatMessageTime(msg.createdAt);
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
                data-chat-message-id={msg.id}
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
                    <Text className={isMobile ? `${styles.senderName} ${styles.senderNameMobile}` : styles.senderName}>
                      {msg.senderName}
                    </Text>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: isMe ? "row-reverse" : "row",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  {canDelete && isSelected && (
                    <Button
                      type="text"
                      size="small"
                      aria-label="Удалить сообщение"
                      icon={
                        <DeleteOutlined
                          className={isMobile ? `${styles.deleteIcon} ${styles.deleteIconMobile}` : styles.deleteIcon}
                        />
                      }
                      onClick={(e) => handleDeleteMessage(msg.id, e)}
                      style={{
                        flexShrink: 0,
                        width: isMobile ? "32px" : "36px",
                        height: isMobile ? "32px" : "36px",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    />
                  )}
                  <div
                    role={canDelete ? "button" : undefined}
                    tabIndex={canDelete ? 0 : undefined}
                    onClick={() => {
                      if (!canDelete) return;
                      setSelectedMessageId((prev) => (prev === msg.id ? null : msg.id));
                    }}
                    onKeyDown={(e) => {
                      if (!canDelete) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedMessageId((prev) => (prev === msg.id ? null : msg.id));
                      }
                    }}
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
                      boxShadow: isSelected
                        ? isMe
                          ? "0 0 0 2px rgba(255, 255, 255, 0.75), 0 0 12px rgba(59, 130, 246, 0.55)"
                          : "0 0 0 2px rgba(96, 165, 250, 0.85), 0 0 12px rgba(147, 197, 253, 0.2)"
                        : undefined,
                      cursor: canDelete ? "pointer" : "default",
                      outline: "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "stretch",
                        gap: "4px",
                        minWidth: 0,
                      }}
                    >
                      <span className={styles.messageText}>{msg.text}</span>
                      {timeLabel ? (
                        <span
                          style={{
                            alignSelf: "flex-end",
                            fontSize: isMobile ? "10px" : "11px",
                            lineHeight: 1.2,
                            color: isMe ? "rgba(255, 255, 255, 0.72)" : "rgba(156, 163, 175, 0.95)",
                            marginTop: "2px",
                            userSelect: "none",
                          }}
                        >
                          {timeLabel}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ 
        paddingLeft: isMobile ? "12px" : "16px",
        paddingRight: isMobile ? "12px" : "16px",
        paddingBottom: isMobile ? "10px" : "16px",
        paddingTop: "8px"
      }}>
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
