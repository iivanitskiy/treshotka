"use client";

import { useState, useEffect, useRef } from "react";
import {
  Room,
  subscribeToParticipantCount,
  getParticipantCount,
} from "@/lib/services/roomService";
import { Empty, Avatar, Space, Typography } from "antd";
import {
  DeleteOutlined,
  LoginOutlined,
  LockOutlined,
  UnlockOutlined,
  UserOutlined,
} from "@ant-design/icons";
import styles from "./RoomList.module.css";

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
          <span className={styles.emptyStateText}>
            Нет доступных комнат. Создайте новую!
          </span>
        }
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <div className={styles.roomList}>
      {rooms.map((room) => (
        <div key={room.id} className="room-card">
          <div className="room-card-content">
            <div className={styles.roomHeader}>
              <Avatar
                className={room.password ? styles.roomAvatarLocked : styles.roomAvatarUnlocked}
                icon={room.password ? <LockOutlined /> : <UnlockOutlined />}
                size="large"
              />
              <Space>
                {participantCounts[room.id] !== null && (
                  <Space className={styles.participantCountBadge}>
                    <UserOutlined className={styles.roomIcon} />
                    <Text className={styles.participantCountText}>
                      {participantCounts[room.id]}
                    </Text>
                  </Space>
                )}
              </Space>
            </div>
            <div className="room-card-text">
              <Space>
                <Text strong className={styles.roomTitle}>
                  {room.name}
                </Text>
              </Space>
              <Space orientation="vertical" size={0}>
                <Text className={styles.roomCreator}>
                  Создал(а) {room.creatorName || room.createdBy}
                </Text>
                <Text className={styles.roomDate}>
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
              <div
                onClick={() => onDelete(room.id)}
                className={styles.deleteButtonTransparent}
              >
                <DeleteOutlined /> Удалить
              </div>
            )}
            <div
              className={styles.joinButton}
              onClick={() => onEnter(room)}
            >
              <LoginOutlined/> Войти
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
