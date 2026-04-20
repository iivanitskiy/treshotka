'use client'

import { Button, Modal, Typography } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import styles from './DeleteRoomModal.module.css'

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
      title={<span className={styles.modalTitle}>Удалить комнату?</span>}
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
      closeIcon={<span className={styles.modalCloseIcon} onMouseEnter={(e) => e.currentTarget.style.color = 'white'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>×</span>}
    >
      <div className={styles.warningContainer}>
        <div className={styles.warningHeader}>
          <ExclamationCircleOutlined className={styles.warningIcon} />
          <Text className={styles.warningText}>Вы уверены, что хотите удалить эту комнату? Это действие необратимо.</Text>
        </div>
        <div className={styles.actionsContainer}>
          <Button onClick={onCancel} className={styles.cancelButton}>
            Отмена
          </Button>
          <Button
            danger
            type="primary"
            onClick={onConfirm}
            loading={loading}
            className={styles.deleteButton}
          >
            Да, удалить
          </Button>
        </div>
      </div>
    </Modal>
  )
}
