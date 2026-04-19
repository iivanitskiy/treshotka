"use client";

import { useEffect } from "react";
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
} from "antd";
import { UserOutlined, LogoutOutlined, HomeOutlined } from "@ant-design/icons";
import Image from "next/image";
import { auth } from "@/lib/firebase";
import { clearUser } from "@/lib/features/auth/authSlice";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function CallsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!user.isLoading && !user.isAuthenticated) {
      router.push("/login");
    }
  }, [user.isAuthenticated, user.isLoading, router]);

  const handleLogout = () => {
    auth.signOut();
    dispatch(clearUser());
    router.push("/login");
  };

  if (user.isLoading) {
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
  }

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
                    {<HomeOutlined />}На главную
                  </div>
        
                  <div
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
                    >
                      Выйти
                    </Button>
                  </div>
                </Header>

        <Content
          style={{
            padding: "32px",
            background: "#0f111a",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
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
              padding: "48px",
              maxWidth: "600px",
              width: "100%",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "4rem",
                color: "#60a5fa",
                marginBottom: "24px",
              }}
            >
              <UserOutlined />
            </div>
            <Title level={3} style={{ color: "white", marginBottom: "16px" }}>
              Функционал звонков 1 на 1
            </Title>
            <Text
              style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "1rem" }}
            >
              Этот раздел находится в разработке. Здесь будет реализован
              функционал для приватных видеозвонков с одним собеседником.
            </Text>
            <div
              style={{
                marginTop: "32px",
                display: "flex",
                gap: "16px",
                justifyContent: "center",
              }}
            >
              <Button
                type="primary"
                size="large"
                onClick={() => alert("Функционал в разработке")}
                style={{
                  background: "#3b82f6",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                Начать звонок
              </Button>
              <Button
                type="default"
                size="large"
                onClick={() => router.push("/")}
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "white",
                }}
              >
                Назад
              </Button>
            </div>
          </div>

          <Text
            style={{
              color: "rgba(255, 255, 255, 0.4)",
              textAlign: "center",
              maxWidth: "600px",
            }}
          >
            В будущем здесь появится возможность создавать приватные звонки,
            приглашать собеседников по ссылке и использовать расширенные
            настройки аудио/видео.
          </Text>
        </Content>
      </Layout>
    </ConfigProvider>
  );
}
