'use client'

import { Button, Modal, Form, Input, Space } from 'antd'
import styles from './PasswordModal.module.css'

interface PasswordModalProps {
  open: boolean
  roomName?: string
  onCancel: () => void
  onSubmit: (password: string) => void
}

export default function PasswordModal({ open, roomName, onCancel, onSubmit }: PasswordModalProps) {
  const [form] = Form.useForm()

  const handleFinish = (values: { password: string }) => {
    onSubmit(values.password)
    form.resetFields()
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      title={<span className={styles.modalTitle}>{`Введите пароль для "${roomName}"`}</span>}
      open={open}
      onCancel={handleCancel}
      footer={null}
      centered
      className={styles.modalContent}
      styles={{ 
        header: { backgroundColor: 'transparent', borderBottom: '1px solid rgba(255,255,255,0.05)' }, 
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
          name="password"
          label={<span className={styles.formLabel}>Пароль</span>}
          rules={[{ required: true, message: 'Пожалуйста, введите пароль' }]}
          className={styles.formItem}
        >
          <Input.Password 
            placeholder="Введите пароль комнаты" 
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
              className={styles.submitButton}
            >
              Войти в комнату
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  )
}
