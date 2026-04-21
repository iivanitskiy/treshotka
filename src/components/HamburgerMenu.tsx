"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Drawer, Menu, Button } from "antd";
import {
  MenuOutlined,
  HomeOutlined,
  TeamOutlined,
  UserOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { auth } from "@/lib/firebase";
import { useAppDispatch } from "@/lib/hooks";
import { clearUser } from "@/lib/features/auth/authSlice";
import styles from "./HamburgerMenu.module.css";

interface HamburgerMenuProps {
  onLogout?: () => void;
}

export default function HamburgerMenu({ onLogout }: HamburgerMenuProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const dispatch = useAppDispatch();

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  const handleLogout = () => {
    auth.signOut();
    dispatch(clearUser());
    if (onLogout) onLogout();
    router.push("/login");
  };

  const menuItems = [
    {
      key: "home",
      icon: <HomeOutlined />,
      label: "Главная",
      onClick: () => {
        router.push("/");
        onClose();
      },
    },
    {
      key: "calls",
      icon: <UserOutlined />,
      label: "Звонки 1 на 1",
      onClick: () => {
        router.push("/calls");
        onClose();
      },
    },
    {
      key: "lobby",
      icon: <TeamOutlined />,
      label: "Групповые звонки",
      onClick: () => {
        router.push("/lobby");
        onClose();
      },
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Выйти",
      onClick: handleLogout,
    },
  ];

  return (
    <>
      <Button
        type="text"
        icon={<MenuOutlined />}
        onClick={showDrawer}
        className={styles.hamburgerButton}
      />
      <Drawer
        title="Меню"
        placement="right"
        onClose={onClose}
        open={open}
        size={280}
        styles={{
          body: { padding: 0, background: "rgba(28, 31, 46, 0.9)" },
          header: {
            background: "rgba(28, 31, 46, 0.9)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          },
        }}
      >
        <Menu
          mode="inline"
          items={menuItems}
          style={{
            background: "rgba(28, 31, 46, 0.9)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
          className={`hamburger-menu ${styles.hamburgerMenu}`}
        />
      </Drawer>
    </>
  );
}
