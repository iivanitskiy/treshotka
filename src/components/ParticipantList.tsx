"use client";

import { useEffect, useState } from "react";
import {
  subscribeToParticipants,
  Participant,
} from "@/lib/services/roomService";
import { Avatar, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";

const { Text } = Typography;

export default function ParticipantList({ roomId }: { roomId: string }) {
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToParticipants(roomId, (users) => {
      setParticipants(users);
    });
    return () => unsubscribe();
  }, [roomId]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px", paddingBottom: "8px" }}>
        <Text
          style={{
            color: "white",
            fontSize: "14px",
            fontWeight: 500,
            paddingLeft: "8px",
          }}
        >
          В сети ({participants.length})
        </Text>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }} className="custom-scrollbar">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "8px",
            paddingTop: 0,
            gap: "4px",
          }}
        >
          {participants.map((item) => (
            <div key={item.uid} className="participant-item">
              <Avatar
                src={item.photoURL}
                icon={<UserOutlined />}
                style={{
                  background:
                    "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(168, 85, 247, 0.2))",
                  color: "#60a5fa",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  flexShrink: 0,
                }}
                size="large"
              />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                  overflow: "hidden",
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {item.displayName}
                </Text>
                <Text
                  style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}
                >
                  Участник
                </Text>
              </div>
            </div>
          ))}
          {participants.length === 0 && (
            <div
              style={{
                padding: "32px",
                textAlign: "center",
                color: "#9ca3af",
                fontSize: "14px",
              }}
            >
              Нет участников
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
