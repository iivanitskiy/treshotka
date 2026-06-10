"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import {
  Button,
  Layout,
  Typography,
  ConfigProvider,
  theme,
  Spin,
  Tag,
  Input,
  Select,
  Grid,
} from "antd";
import { LogoutOutlined, HomeOutlined, SearchOutlined } from "@ant-design/icons";
import Image from "next/image";
import { auth } from "@/lib/firebase";
import { clearUser } from "@/lib/features/auth/authSlice";
import HamburgerMenu from "@/components/HamburgerMenu";
import UserList from "@/components/calls/UserList";
import IncomingCallModal from "@/components/calls/IncomingCallModal";
import PeerCallView from "@/components/calls/PeerCallView";
import { subscribeToUsers, FirebaseUser } from "@/lib/services/userService";
import { subscribeToBusyUserIds } from "@/lib/services/callService";
import { clearPresence } from "@/lib/services/presenceService";
import { usePeerCall } from "@/hooks/usePeerCall";
import styles from "@/app/calls/calls.module.css";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function CallsClient() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth);

  const [users, setUsers] = useState<FirebaseUser[]>([]);
  const [busyUserIds, setBusyUserIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const { xs } = Grid.useBreakpoint();

  const peerCall = usePeerCall({
    userId: user.uid,
    displayName: user.displayName,
  });

  useEffect(() => {
    if (!user.isLoading && !user.isAuthenticated) {
      router.push("/login");
    }
  }, [user.isAuthenticated, user.isLoading, router]);

  useEffect(() => {
    const unsubscribe = subscribeToUsers((firebaseUsers) => {
      setUsers(firebaseUsers);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    return subscribeToBusyUserIds(setBusyUserIds);
  }, []);

  const handleLogout = () => {
    if (peerCall.isInCall) peerCall.hangUp();
    clearPresence();
    auth.signOut();
    dispatch(clearUser());
    router.push("/login");
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.displayName
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "online" && u.online) ||
      (statusFilter === "offline" && !u.online);
    return matchesSearch && matchesStatus;
  });

  const handleCallClick = (userId: string) => {
    const target = users.find((u) => u.uid === userId);
    if (!target || !user.uid) return;
    void peerCall.startCall({
      uid: target.uid,
      displayName: target.displayName,
    });
  };

  const showCallUi =
    peerCall.phase === "outgoing" ||
    peerCall.phase === "connecting" ||
    peerCall.phase === "connected";

  const statusLabel =
    peerCall.phase === "outgoing"
      ? "Вызов…"
      : peerCall.phase === "connecting"
        ? "Соединение…"
        : "В звонке";

  if (user.isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer} style={{ background: "#0f111a" }}>
        <Spin size="large" tip="Загрузка пользователей..." />
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        components: {
          Modal: {
            contentBg: "rgba(28, 31, 46, 0.95)",
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
      <IncomingCallModal
        call={peerCall.incomingCall}
        open={peerCall.phase === "incoming"}
        onAccept={() => void peerCall.acceptIncoming()}
        onReject={() => void peerCall.rejectIncoming()}
      />

      {showCallUi && peerCall.peer && (
        <PeerCallView
          localStream={peerCall.localStream}
          remoteStream={peerCall.remoteStream}
          peerName={peerCall.peer.displayName}
          statusLabel={statusLabel}
          micOn={peerCall.micOn}
          cameraOn={peerCall.cameraOn}
          onToggleMic={peerCall.toggleMic}
          onToggleCamera={peerCall.toggleCamera}
          onHangUp={peerCall.hangUp}
        />
      )}

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
          <div
            className="header-left-desktop"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flex: 1,
            }}
          >
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

          <div className="home-button" onClick={() => router.push("/")}>
            <HomeOutlined />
            На главную
          </div>

          <div className="header-mobile">
            <HamburgerMenu onLogout={handleLogout} />
          </div>

          <div
            className="header-right-desktop"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              flex: 1,
              justifyContent: "flex-end",
            }}
          >
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
              className={styles.logoutButton}
            >
              Выйти
            </Button>
          </div>
        </Header>

        <Content
          style={{
            padding: "16px",
            background: "#0f111a",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "32px",
          }}
        >
          <div
            style={{
              background: "rgba(28, 31, 46, 0.8)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: "24px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              overflow: "hidden",
              padding: "32px",
              maxWidth: "800px",
              width: "100%",
            }}
          >
            <div style={{ marginBottom: "32px" }}>
              <Title level={2} style={{ color: "white", marginBottom: "8px" }}>
                Звонки 1 на 1
              </Title>
              <Text style={{ color: "rgba(255, 255, 255, 0.6)" }}>
                Выберите пользователя из списка для начала звонка
              </Text>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: xs ? "column" : "row",
                gap: "16px",
                marginBottom: "24px",
                flexWrap: "wrap",
              }}
            >
              <Input
                placeholder="Поиск по имени..."
                prefix={<SearchOutlined />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  flex: xs ? "none" : 1,
                  width: xs ? "100%" : "70%",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "white",
                }}
              />
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: xs ? "100%" : "30%" }}
                options={[
                  { value: "all", label: "Все пользователи" },
                  { value: "online", label: "Только онлайн" },
                  { value: "offline", label: "Только оффлайн" },
                ]}
              />
            </div>

            <UserList
              users={filteredUsers}
              onCallClick={handleCallClick}
              currentUserId={user.uid ?? undefined}
              busyUserIds={busyUserIds}
              selfInCall={peerCall.isInCall}
            />

            <div style={{ marginTop: "32px", textAlign: "center" }}>
              <Text
                type="secondary"
                style={{ color: "rgba(255, 255, 255, 0.4)" }}
              >
                Всего зарегистрированных пользователей: {users.length}
              </Text>
            </div>
          </div>
        </Content>
      </Layout>
    </ConfigProvider>
  );
}
