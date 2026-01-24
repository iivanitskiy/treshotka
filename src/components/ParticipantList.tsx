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
    <div className="participant-list-container">
      <div className="participant-list-header">
        <Text className="participant-list-title">В сети ({participants.length})</Text>
      </div>
      <div className="participant-list-scroll-area custom-scrollbar">
        <div className="participant-list-content">
          {participants.map((item) => (
            <div key={item.uid} className="participant-item">
              <Avatar
                src={item.photoURL}
                icon={<UserOutlined />}
                className="participant-avatar"
                size="large"
              />
              <div className="participant-info">
                <Text className="participant-name">{item.displayName}</Text>
                <Text className="participant-role">Участник</Text>
              </div>
            </div>
          ))}
          {participants.length === 0 && (
            <div className="participant-empty">Нет участников</div>
          )}
        </div>
      </div>
    </div>
  );
}
