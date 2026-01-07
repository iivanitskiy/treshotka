'use client'

import { Room } from '@/lib/services/roomService'
import { Button, Empty, Avatar, Space, Typography } from 'antd'
import { DeleteOutlined, LoginOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons'

const { Text } = Typography

interface RoomListProps {
  rooms: Room[]
  currentUserId: string | null
  isAdmin: boolean
  onDelete: (roomId: string) => void
  onEnter: (room: Room) => void
}

export default function RoomList({ rooms, currentUserId, isAdmin, onDelete, onEnter }: RoomListProps) {
  if (rooms.length === 0) {
    return (
      <Empty 
        description={<span style={{ color: '#9ca3af' }}>Нет доступных комнат. Создайте новую!</span>} 
        image={Empty.PRESENTED_IMAGE_SIMPLE} 
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {rooms.map((room) => (
        <div 
          key={room.id} 
          className="room-card"
        >
          <div className="room-card-content">
            <Avatar 
              style={{ backgroundColor: room.password ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)', color: room.password ? '#ef4444' : '#3b82f6', border: '1px solid rgba(255,255,255,0.1)' }} 
              icon={room.password ? <LockOutlined /> : <UnlockOutlined />} 
              size="large"
            />
            <div className="room-card-text">
              <Space>
                <Text strong style={{ fontSize: '18px', color: 'white' }}>{room.name}</Text>
              </Space>
              <Space orientation="vertical" size={0}>
                <Text style={{ color: '#9ca3af', fontSize: '14px' }}>Создал(а) {room.creatorName || room.createdBy}</Text>
                <Text style={{ color: '#6b7280', fontSize: '12px' }}>
                  {room.createdAt?.seconds 
                    ? new Date(room.createdAt.seconds * 1000).toLocaleDateString('ru-RU') 
                    : 'Неизвестная дата'}
                </Text>
              </Space>
            </div>
          </div>
          <div className="room-card-actions">
            {(currentUserId === room.createdBy || isAdmin) && (
              <Button 
                danger 
                icon={<DeleteOutlined />}
                onClick={() => onDelete(room.id)}
                style={{ background: 'rgba(0, 0, 0, 0)' }}
              >
                Удалить
              </Button>
            )}
            <Button 
              type="primary" 
              icon={<LoginOutlined />}
              onClick={() => onEnter(room)}
            >
              Войти
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
