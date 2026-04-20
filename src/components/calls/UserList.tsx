"use client";

import { Avatar, Button, Card, Typography, Grid, Flex } from "antd";
import { PhoneOutlined, UserOutlined } from "@ant-design/icons";
import { FirebaseUser } from "@/lib/services/userService";
import styles from "./UserList.module.css";

const { Text } = Typography;
const { useBreakpoint } = Grid;

interface UserListProps {
  users: FirebaseUser[];
  onCallClick?: (userId: string) => void;
}

export default function UserList({ users, onCallClick }: UserListProps) {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const handleCallClick = (userId: string) => {
    if (onCallClick) {
      onCallClick(userId);
    } else {
      alert(`Звонок пользователю ${userId} (функционал в разработке)`);
    }
  };

  return (
    <Card
      className={styles.card}
      styles={{
        body: { padding: 0 },
        root: {
          background: 'rgba(28, 31, 46, 0.8)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }
      }}
    >
      <Flex vertical gap={0}>
        {users.map((user) => (
          <div
            key={user.uid}
            className={`${styles.userItem} ${isMobile ? styles.userItemMobile : ""}`}
          >
            <div className={`${styles.userInfo} ${isMobile ? styles.userInfoMobile : ""}`}>
              <div className={styles.avatarContainer}>
                <Avatar
                  size={48}
                  icon={<UserOutlined />}
                  src={user.photoURL}
                  style={{
                    background: user.online
                      ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                      : "rgba(255,255,255,0.1)",
                    border: user.online
                      ? "2px solid rgba(102, 126, 234, 0.5)"
                      : "2px solid rgba(255,255,255,0.1)",
                  }}
                />
                {user.online && <div className={styles.onlineIndicator} />}
              </div>
              <div className={styles.userDetails}>
                <div className={styles.userName}>
                  <Text strong className={styles.userNameText}>
                    {user.displayName}
                  </Text>
                </div>
              </div>
            </div>
            <Button
              type="primary"
              icon={<PhoneOutlined />}
              onClick={() => handleCallClick(user.uid)}
              className={`${styles.callButton} ${isMobile ? styles.callButtonMobile : ""}`}
            >
              Позвонить
            </Button>
          </div>
        ))}
      </Flex>
    </Card>
  );
}