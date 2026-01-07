'use client'

import { Button, Modal, Typography } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'

const { Text } = Typography

interface DeleteRoomModalProps {
  open: boolean
  loading: boolean
  onCancel: () => void
  onConfirm: () => void
}

export default function DeleteRoomModal({ open, loading, onCancel, onConfirm }: DeleteRoomModalProps) {
  return (
    <Modal
      title={<span style={{ color: 'white' }}>Удалить комнату?</span>}
      open={open}
      onCancel={onCancel}
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: '22px', marginTop: '4px' }} />
          <Text style={{ color: '#d1d5db' }}>Вы уверены, что хотите удалить эту комнату? Это действие необратимо.</Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button onClick={onCancel}>
            Отмена
          </Button>
          <Button 
            danger 
            type="primary" 
            onClick={onConfirm} 
            loading={loading}
          >
            Да, удалить
          </Button>
        </div>
      </div>
    </Modal>
  )
}
