"use client";

import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { signInWithEmailAndPassword } from "firebase/auth";
import Link from "next/link";
import { Button, Form, Input, Typography, Alert, Spin } from "antd";
import Image from "next/image";
import { Russo_One } from "next/font/google";
import {
  LockOutlined,
  MailOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const russoOne = Russo_One({ weight: "400", subsets: ["cyrillic"] });

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const [error, setError] = useState<string | null>(null);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/lobby");
    }
  }, [isAuthenticated, isLoading, router]);

  const onFinish = async (values: { email: string; password: string }) => {
    setError(null);
    setIsLoginLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
    } catch (error: unknown) {
      console.error("Ошибка входа с помощью электронной почты.", error);
      const err = error as { code?: string; message?: string };
      if (err.code === "auth/invalid-credential") {
        setError("Неверный email или пароль.");
      } else {
        setError(err.message || "Произошла ошибка при входе.");
      }
    } finally {
      setIsLoginLoading(false);
    }
  };

  if (isLoading)
    return (
      <div className="auth-container">
        <Spin size="large" />
      </div>
    );

  return (
    <div className="auth-container">
      <div className="auth-stack">
        <h1 className={`${russoOne.className} app-logo-title`}>Трещотка</h1>
        <Image
          src="/logo.png"
          width={150}
          height={150}
          alt="Логотип"
          className="app-logo-image"
          priority
        />
        <div className="auth-card">
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <Title level={2} style={{ marginBottom: 0, color: "white" }}>
              Добро пожаловать
            </Title>
          </div>

          {error && (
            <Alert
              title={error}
              type="error"
              showIcon
              style={{
                marginBottom: "24px",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                borderColor: "rgba(239, 68, 68, 0.2)",
                color: "#fecaca",
              }}
            />
          )}

          <Form
            name="login"
            onFinish={onFinish}
            layout="vertical"
            size="large"
            requiredMark={false}
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: "Пожалуйста, введите ваш email!" },
                {
                  type: "email",
                  message: "Пожалуйста, введите корректный email!",
                },
              ]}
            >
              <Input
                prefix={
                  <MailOutlined style={{ marginRight: 6, color: "#9ca3af" }} />
                }
                placeholder="Email"
                className="auth-input"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: "Пожалуйста, введите ваш пароль!" },
              ]}
            >
              <Input.Password
                prefix={
                  <LockOutlined style={{ marginRight: 6, color: "#9ca3af" }} />
                }
                placeholder="Пароль"
                className="auth-input"
                iconRender={(visible) =>
                  visible ? (
                    <EyeOutlined style={{ color: "#9ca3af" }} />
                  ) : (
                    <EyeInvisibleOutlined style={{ color: "#9ca3af" }} />
                  )
                }
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: "16px" }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoginLoading}
                block
              >
                Войти
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: "center" }}>
            <Text style={{ color: "white" }}>Нет аккаунта? </Text>
            <Link
              href="/register"
              style={{ color: "#3b82f6", transition: "color 0.2s" }}
            >
              Зарегистрироваться
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
