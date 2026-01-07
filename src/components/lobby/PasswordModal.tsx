'use client'

import { Button, Modal, Form, Input, Space } from 'antd'

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
      title={<span style={{ color: 'white' }}>Введите пароль для &quot;{roomName}&quot;</span>}
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
      closeIcon={<span style={{ color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.color = 'white'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>×</span>}
    >
      <Form
        form={form}
        onFinish={handleFinish}
        layout="vertical"
        requiredMark={false}
      >
        <Form.Item
          name="password"
          label={<span style={{ color: '#d1d5db' }}>Пароль</span>}
          rules={[{ required: true, message: 'Пожалуйста, введите пароль' }]}
        >
          <Input.Password 
            placeholder="Введите пароль комнаты" 
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
          />
        </Form.Item>
        <Form.Item style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 0 }}>
          <Space>
            <Button onClick={handleCancel}>
              Отмена
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
            >
              Войти в комнату
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  )
}
