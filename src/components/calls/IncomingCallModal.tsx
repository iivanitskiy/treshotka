"use client";

import { Modal, Button, Avatar, Space, Typography } from "antd";
import { PhoneOutlined, CloseOutlined, UserOutlined } from "@ant-design/icons";
import { CallWithId } from "@/lib/services/callService";

const { Text, Title } = Typography;

interface IncomingCallModalProps {
  call: CallWithId | null;
  open: boolean;
  onAccept: () => void;
  onReject: () => void;
}

export default function IncomingCallModal({
  call,
  open,
  onAccept,
  onReject,
}: IncomingCallModalProps) {
  return (
    <Modal
      open={open}
      footer={null}
      closable={false}
      centered
      width={360}
      styles={{
        mask: { backdropFilter: "blur(4px)" },
      }}
    >
      <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
        <Avatar
          size={72}
          icon={<UserOutlined />}
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            marginBottom: 16,
          }}
        />
        <Title level={4} style={{ color: "white", margin: "0 0 8px" }}>
          Входящий звонок
        </Title>
        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 16 }}>
          {call?.callerName ?? "Неизвестный"}
        </Text>
        <Space
          style={{ marginTop: 32, width: "100%", justifyContent: "center" }}
          size="large"
        >
          <Button
            type="primary"
            danger
            shape="circle"
            size="large"
            icon={<CloseOutlined />}
            onClick={onReject}
            aria-label="Отклонить"
            style={{ width: 56, height: 56 }}
          />
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<PhoneOutlined />}
            onClick={onAccept}
            aria-label="Принять"
            style={{
              width: 56,
              height: 56,
              background: "#22c55e",
              borderColor: "#22c55e",
            }}
          />
        </Space>
      </div>
    </Modal>
  );
}
