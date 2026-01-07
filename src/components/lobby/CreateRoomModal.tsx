'use client'

import { Button, Modal, Form, Input, Space } from 'antd'

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
      title={<span style={{ color: 'white' }}>Создать новую комнату</span>}
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
          name="roomName"
          label={<span style={{ color: '#d1d5db' }}>Название комнаты</span>}
          rules={[{ required: true, message: 'Пожалуйста, введите название комнаты' }]}
        >
          <Input 
            placeholder="Введите название комнаты" 
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
          />
        </Form.Item>
        <Form.Item
          name="password"
          label={<span style={{ color: '#d1d5db' }}>Пароль (опционально)</span>}
        >
          <Input.Password 
            placeholder="Введите пароль (опционально)" 
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
              loading={loading}
            >
              Создать
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  )
}
