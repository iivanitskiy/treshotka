"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import {
  createRoom,
  subscribeToRooms,
  deleteRoom,
  Room,
} from "@/lib/services/roomService";
import { auth } from "@/lib/firebase";
import { clearUser } from "@/lib/features/auth/authSlice";
import {
  Button,
  Layout,
  Typography,
  message,
  ConfigProvider,
  theme,
  Spin,
  Tag,
} from "antd";
import { LogoutOutlined, PlusOutlined } from "@ant-design/icons";
import RoomList from "@/components/lobby/RoomList";
import CreateRoomModal from "@/components/lobby/CreateRoomModal";
import PasswordModal from "@/components/lobby/PasswordModal";
import DeleteRoomModal from "@/components/lobby/DeleteRoomModal";
import Image from "next/image";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function LobbyPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const user = useAppSelector((state) => state.auth);
  const router = useRouter();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!user.isLoading && !user.isAuthenticated) {
      router.push("/login");
    }
  }, [user.isAuthenticated, user.isLoading, router]);

  useEffect(() => {
    const unsubscribe = subscribeToRooms((updatedRooms) => {
      setRooms(updatedRooms);
    });
    return () => unsubscribe();
  }, []);

  const handleCreateRoom = async (values: {
    roomName: string;
    password?: string;
  }) => {
    if (!user.uid) return;

    setIsCreating(true);
    try {
      await createRoom(
        values.roomName,
        user.uid,
        user.displayName || "Unknown",
        values.password
      );
      setIsCreateModalOpen(false);
      messageApi.success("Комната успешно создана");
    } catch (error) {
      console.error("Ошибка создания комнаты", error);
      messageApi.error("Ошибка создания комнаты");
    } finally {
      setIsCreating(false);
    }
  };

  const handleEnterRoom = (room: Room) => {
    if (room.password) {
      setSelectedRoom(room);
      setIsPasswordModalOpen(true);
    } else {
      router.push(`/room/${room.id}`);
    }
  };

  const handlePasswordSubmit = (password: string) => {
    if (!selectedRoom) return;

    if (password === selectedRoom.password) {
      setIsPasswordModalOpen(false);
      router.push(`/room/${selectedRoom.id}`);
    } else {
      messageApi.error("Неверный пароль");
    }
  };

  const handleDeleteRoom = (roomId: string) => {
    setRoomToDelete(roomId);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteRoom = async () => {
    if (!roomToDelete) return;

    setIsDeleting(true);
    try {
      await deleteRoom(roomToDelete);
      messageApi.success("Комната успешно удалена");
      setIsDeleteModalOpen(false);
      setRoomToDelete(null);
    } catch (error) {
      console.error("Ошибка удаления комнаты", error);
      messageApi.error("Ошибка удаления комнаты");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = () => {
    auth.signOut();
    dispatch(clearUser());
    router.push("/login");
  };

  if (user.isLoading)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        components: {
          Modal: {
            contentBg: "rgba(28, 31, 46, 0.9)",
            headerBg: "transparent",
            footerBg: "transparent",
          },
          Input: {
            colorBgContainer: "rgba(255, 255, 255, 0.05)",
            colorBorder: "rgba(255, 255, 255, 0.1)",
          },
        },
        token: {
          colorBgBase: "#0f111a",
          colorText: "white",
        },
      }}
    >
      {contextHolder}
      <Layout style={{ minHeight: "100vh", background: "#0f111a" }}>
        <Header
          className="lobby-header"
          style={{
            padding: "16px 24px",
            height: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(28, 31, 46, 0.8)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Image
              src="/logo.png"
              width={48}
              height={48}
              alt="Логотип"
              style={{
                padding: "4px",
                borderRadius: "16px",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                boxShadow: "0 10px 20px rgba(0, 0, 0, 0.35)",
                objectFit: "contain",
              }}
              priority
            />
            <Title
              level={3}
              className="lobby-title"
              style={{
                margin: 0,
                color: "white",
                fontFamily: "'Orbitron', sans-serif",
                fontWeight: 700,
                letterSpacing: "1.5px",
                textShadow:
                  "0 0 8px rgba(255,255,255,0.4), 0 0 25px rgb(156, 43, 231)",
              }}
            >
              Трещотка
            </Title>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              className="lobby-header-user-info"
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Text strong style={{ color: "#d1d5db" }}>
                Привет, {user.displayName}
              </Text>
              {user.role === "admin" && (
                <Tag color="gold" style={{ margin: 0 }}>
                  ADMIN
                </Tag>
              )}
            </div>
            <Button
              type="primary"
              danger
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              Выйти
            </Button>
          </div>
        </Header>

        <Content
          className="lobby-content"
          style={{ padding: "0 32px 24px 32px", background: "#0f111a" }}
        >
          <div
            style={{
              maxWidth: "896px",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            <div
              className="create-room-btn-container"
              style={{
                display: "flex",
                justifyContent: "flex-end",
                paddingTop: "24px",
              }}
            >
              {user.role === "admin" && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  size="large"
                  className="create-room-btn"
                  onClick={() => setIsCreateModalOpen(true)}
                  style={{
                    background: "#22c55e",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                    overflow: "hidden",
                    padding: "24px",
                  }}
                >
                  Создать комнату
                </Button>
              )}
            </div>

            <div
              style={{
                background: "rgba(28, 31, 46, 0.8)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: "24px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                overflow: "hidden",
                padding: "24px",
              }}
            >
              <div style={{ marginBottom: "16px" }}>
                <Title level={4} style={{ color: "white", marginTop: 0 }}>
                  Доступные комнаты
                </Title>
              </div>

              <RoomList
                rooms={rooms}
                currentUserId={user.uid}
                isAdmin={user.role === "admin"}
                onDelete={handleDeleteRoom}
                onEnter={handleEnterRoom}
              />
            </div>
          </div>

          <CreateRoomModal
            open={isCreateModalOpen}
            loading={isCreating}
            onCancel={() => setIsCreateModalOpen(false)}
            onCreate={handleCreateRoom}
          />

          <PasswordModal
            open={isPasswordModalOpen}
            roomName={selectedRoom?.name}
            onCancel={() => {
              setIsPasswordModalOpen(false);
              setSelectedRoom(null);
            }}
            onSubmit={handlePasswordSubmit}
          />

          <DeleteRoomModal
            open={isDeleteModalOpen}
            loading={isDeleting}
            onCancel={() => setIsDeleteModalOpen(false)}
            onConfirm={confirmDeleteRoom}
          />
        </Content>
      </Layout>
    </ConfigProvider>
  );
}
