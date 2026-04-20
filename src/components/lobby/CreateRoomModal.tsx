'use client'

import { Button, Modal, Form, Input, Space } from 'antd'
import styles from './CreateRoomModal.module.css'

interface CreateRoomModalProps {
  open: boolean
  loading: boolean
  onCancel: () => void
  onCreate: (values: { roomName: string, password?: string }) => Promise<void>
}

export default function CreateRoomModal({ open, loading, onCancel, onCreate }: CreateRoomModalProps) {
  const [form] = Form.useForm()

  const handleFinish = async (values: { roomName: string, password?: string }) => {
    await onCreate(values)
    form.resetFields()
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      title={<span className={styles.modalTitle}>Создать новую комнату</span>}
      open={open}
      onCancel={handleCancel}
      footer={null}
      centered
      className="glass-modal"
      styles={{
        header: { backgroundColor: 'transparent', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.05)' },
        body: { color: 'white' },
        mask: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(15, 17, 26, 0.8)' }
      }}
      closeIcon={<span className={styles.modalCloseIcon} onMouseEnter={(e) => e.currentTarget.style.color = 'white'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>×</span>}
    >
      <Form
        form={form}
        onFinish={handleFinish}
        layout="vertical"
        requiredMark={false}
      >
        <Form.Item
          name="roomName"
          label={<span className={styles.formLabel}>Название комнаты</span>}
          rules={[{ required: true, message: 'Пожалуйста, введите название комнаты' }]}
          className={styles.formItem}
        >
          <Input
            placeholder="Введите название комнаты"
            className={styles.formInput}
          />
        </Form.Item>
        <Form.Item
          name="password"
          label={<span className={styles.formLabel}>Пароль (опционально)</span>}
          className={styles.formItem}
        >
          <Input.Password
            placeholder="Введите пароль (опционально)"
            className={styles.formInput}
          />
        </Form.Item>
        <Form.Item className={styles.formActions}>
          <Space>
            <Button onClick={handleCancel} className={styles.cancelButton}>
              Отмена
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className={styles.createButton}
            >
              Создать
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  )
}
