"use client";

import { Modal, Button, Typography } from "antd";

const { Title } = Typography;

interface CallModalProps {
  open: boolean;
  onAccept: () => void;
  onReject: () => void;
  callerName: string;
}

export default function CallModal({ open, onAccept, onReject, callerName }: CallModalProps) {
  return (
    <Modal
      open={open}
      title={<Title level={4}>Входящий звонок</Title>}
      footer={null}
      closable={false}
      centered
    >
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <Title level={5}>{callerName} звонит вам</Title>
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <Button type="primary" onClick={onAccept}>
            Ответить
          </Button>
          <Button danger onClick={onReject}>
            Отклонить
          </Button>
        </div>
      </div>
    </Modal>
  );
}