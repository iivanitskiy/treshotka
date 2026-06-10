"use client";

import { Avatar, Button, Card, Typography, Grid, Flex } from "antd";
import { PhoneOutlined, UserOutlined } from "@ant-design/icons";
import { FirebaseUser } from "@/lib/services/userService";
import styles from "./UserList.module.css";

const { Text } = Typography;
const { useBreakpoint } = Grid;

function CallActionButton({
  user,
  isMobile,
  isBusy,
  selfInCall,
  onCall,
}: {
  user: FirebaseUser;
  isMobile: boolean;
  isBusy: boolean;
  selfInCall: boolean;
  onCall: () => void;
}) {
  if (isBusy) {
    return (
      <Button
        disabled
        className={`${styles.callButton} ${styles.callButtonBusy} ${isMobile ? styles.callButtonMobile : ""}`}
      >
        Занят
      </Button>
    );
  }

  const disabled = !user.online || selfInCall;

  return (
    <Button
      type="primary"
      icon={<PhoneOutlined />}
      onClick={onCall}
      disabled={disabled}
      className={`${styles.callButton} ${isMobile ? styles.callButtonMobile : ""} ${disabled ? styles.callButtonDisabled : ""}`}
    >
      {selfInCall ? "Разговаривает" : "Позвонить"}
    </Button>
  );
}

interface UserListProps {
  users: FirebaseUser[];
  onCallClick?: (userId: string) => void;
  currentUserId?: string;
  busyUserIds?: Set<string>;
  selfInCall?: boolean;
}

export default function UserList({
  users,
  onCallClick,
  currentUserId,
  busyUserIds = new Set(),
  selfInCall = false,
}: UserListProps) {
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
            {user.uid !== currentUserId && (
              <CallActionButton
                user={user}
                isMobile={isMobile}
                isBusy={busyUserIds.has(user.uid)}
                selfInCall={selfInCall}
                onCall={() => handleCallClick(user.uid)}
              />
            )}
          </div>
        ))}
      </Flex>
    </Card>
  );
}