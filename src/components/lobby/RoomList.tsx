"use client";

import { useState, useEffect, useRef } from "react";
import {
  Room,
  subscribeToParticipantCount,
  getParticipantCount,
} from "@/lib/services/roomService";
import { Button, Empty, Avatar, Space, Typography } from "antd";
import {
  DeleteOutlined,
  LoginOutlined,
  LockOutlined,
  UnlockOutlined,
  UserOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

interface RoomListProps {
  rooms: Room[];
  currentUserId: string | null;
  isAdmin: boolean;
  onDelete: (roomId: string) => void;
  onEnter: (room: Room) => void;
}

export default function RoomList({
  rooms,
  currentUserId,
  isAdmin,
  onDelete,
  onEnter,
}: RoomListProps) {
  const [participantCounts, setParticipantCounts] = useState<
    Record<string, number | null>
  >({});
  const unsubscribeRefs = useRef<Record<string, () => void>>({});

  useEffect(() => {
    rooms.forEach((room) => {
      if (participantCounts[room.id] === undefined) {
        setParticipantCounts((prev) => ({
          ...prev,
          [room.id]: null,
        }));

        getParticipantCount(room.id).then((count) => {
          setParticipantCounts((prev) => ({
            ...prev,
            [room.id]: count,
          }));
        });
      }
    });

    rooms.forEach((room) => {
      if (!unsubscribeRefs.current[room.id]) {
        const unsubscribe = subscribeToParticipantCount(room.id, (count) => {
          setParticipantCounts((prev) => ({
            ...prev,
            [room.id]: count,
          }));
        });
        unsubscribeRefs.current[room.id] = unsubscribe;
      }
    });

    const currentRoomIds = new Set(rooms.map((r) => r.id));
    Object.keys(unsubscribeRefs.current).forEach((roomId) => {
      if (!currentRoomIds.has(roomId)) {
        const unsubscribe = unsubscribeRefs.current[roomId];
        if (unsubscribe) {
          unsubscribe();
        }
        delete unsubscribeRefs.current[roomId];
        setParticipantCounts((prev) => {
          const newCounts = { ...prev };
          delete newCounts[roomId];
          return newCounts;
        });
      }
    });

    return () => {
      Object.values(unsubscribeRefs.current).forEach((unsubscribe) =>
        unsubscribe(),
      );
      unsubscribeRefs.current = {};
    };
  }, [rooms]);

  if (rooms.length === 0) {
    return (
      <Empty
        description={
          <span style={{ color: "#9ca3af" }}>
            Нет доступных комнат. Создайте новую!
          </span>
        }
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {rooms.map((room) => (
        <div key={room.id} className="room-card">
          <div className="room-card-content">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Avatar
                style={{
                  backgroundColor: room.password
                    ? "rgba(239, 68, 68, 0.2)"
                    : "rgba(59, 130, 246, 0.2)",
                  color: room.password ? "#ef4444" : "#3b82f6",
                  border: "1px solid rgba(255,255,255,0.1)",
                  flexShrink: 0,
                }}
                icon={room.password ? <LockOutlined /> : <UnlockOutlined />}
                size="large"
              />
              <Space>
                {participantCounts[room.id] !== null && (
                  <Space
                    style={{
                      backgroundColor: "rgba(15, 17, 26, 0.07)",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      border: "1px solid rgba(59, 130, 246, 0.3)",
                      marginTop: "8px",
                    }}
                  >
                    <UserOutlined
                      style={{ fontSize: "12px", color: "#93c5fd" }}
                    />
                    <Text
                      style={{
                        fontSize: "14px",
                        color: "#93c5fd",
                        marginLeft: "4px",
                      }}
                    >
                      {participantCounts[room.id]}
                    </Text>
                  </Space>
                )}
              </Space>
            </div>
            <div className="room-card-text">
              <Space>
                <Text strong style={{ fontSize: "18px", color: "white" }}>
                  {room.name}
                </Text>
              </Space>
              <Space orientation="vertical" size={0}>
                <Text style={{ color: "#9ca3af", fontSize: "14px" }}>
                  Создал(а) {room.creatorName || room.createdBy}
                </Text>
                <Text style={{ color: "#6b7280", fontSize: "12px" }}>
                  {room.createdAt?.seconds
                    ? new Date(
                        room.createdAt.seconds * 1000,
                      ).toLocaleDateString("ru-RU")
                    : "Неизвестная дата"}
                </Text>
              </Space>
            </div>
          </div>
          <div className="room-card-actions">
            {(currentUserId === room.createdBy || isAdmin) && (
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => onDelete(room.id)}
                style={{ background: "rgba(0, 0, 0, 0)" }}
              >
                Удалить
              </Button>
            )}
            <Button
              type="primary"
              icon={<LoginOutlined />}
              onClick={() => onEnter(room)}
            >
              Войти
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
