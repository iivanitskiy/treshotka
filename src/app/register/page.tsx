"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppDispatch } from "@/lib/hooks";
import { setUser } from "@/lib/features/auth/authSlice";
import { Button, Form, Input, Typography, Alert } from "antd";
import Image from "next/image";
import { Russo_One } from "next/font/google";
import {
  LockOutlined,
  MailOutlined,
  UserOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const russoOne = Russo_One({ weight: "400", subsets: ["cyrillic"] });

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const dispatch = useAppDispatch();

  const onFinish = async (values: {
    email: string;
    password: string;
    name: string;
  }) => {
    setError(null);
    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: values.name,
      });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: values.name,
        role: "user",
        createdAt: new Date().toISOString(),
      });

      dispatch(
        setUser({
          uid: user.uid,
          email: user.email,
          displayName: values.name,
          photoURL: user.photoURL,
          role: "user",
        })
      );

      router.push("/lobby");
    } catch (err: unknown) {
      console.error("Ошибка регистрации:", err);
      const error = err as { code?: string; message?: string };
      if (error.code === "auth/email-already-in-use") {
        setError("Этот email уже зарегистрирован.");
      } else if (error.code === "auth/weak-password") {
        setError("Пароль должен содержать минимум 6 символов.");
      } else {
        setError(error.message || "Ошибка регистрации.");
      }
    } finally {
      setIsLoading(false);
    }
  };

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
              Создать аккаунт
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
            name="register"
            onFinish={onFinish}
            layout="vertical"
            size="large"
            requiredMark={false}
          >
            <Form.Item
              name="name"
              rules={[
                { required: true, message: "Пожалуйста, введите ваше имя!" },
              ]}
            >
              <Input
                prefix={
                  <UserOutlined style={{ marginRight: 6, color: "#9ca3af" }} />
                }
                placeholder="Имя пользователя"
                className="auth-input"
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "white",
                }}
              />
            </Form.Item>

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
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "white",
                }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: "Пожалуйста, введите ваш пароль!" },
                {
                  min: 6,
                  message: "Пароль должен содержать минимум 6 символов.",
                },
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
                loading={isLoading}
                block
              >
                Зарегистрироваться
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: "center" }}>
            <Text style={{ color: "white" }}>Уже есть аккаунт? </Text>
            <Link
              href="/login"
              style={{ color: "#3b82f6", transition: "color 0.2s" }}
            >
              Войти
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
