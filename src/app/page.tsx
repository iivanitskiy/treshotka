'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { Spin, ConfigProvider, theme, Typography, Layout, Button, Tag } from 'antd'
import { UserOutlined, TeamOutlined, LogoutOutlined } from '@ant-design/icons'
import Image from 'next/image'
import { auth } from '@/lib/firebase'
import { clearUser } from '@/lib/features/auth/authSlice'

const { Title, Text } = Typography
const { Header, Content } = Layout

export default function Home() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { isAuthenticated, isLoading, displayName, role, uid } = useAppSelector((state) => state.auth)

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login')
      }
    }
  }, [isAuthenticated, isLoading, router])

  const handleOneOnOneClick = () => {
    router.push('/calls')
  }

  const handleGroupCallsClick = () => {
    router.push('/lobby')
  }

  const handleLogout = () => {
    auth.signOut()
    dispatch(clearUser())
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" fullscreen />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        components: {
          Modal: {
            contentBg: 'rgba(28, 31, 46, 0.9)',
            headerBg: 'transparent',
            footerBg: 'transparent',
          },
          Input: {
            colorBgContainer: 'rgba(255, 255, 255, 0.05)',
            colorBorder: 'rgba(255, 255, 255, 0.1)',
          },
        },
        token: {
          colorBgBase: '#0f111a',
          colorText: 'white',
        },
      }}
    >
      <Layout style={{ minHeight: '100vh', background: '#0f111a' }}>
        <Header
          className="lobby-header"
          style={{
            padding: '16px 24px',
            height: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(28, 31, 46, 0.8)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Image
              src="/logo.png"
              width={48}
              height={48}
              alt="Логотип"
              style={{
                padding: '4px',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 10px 20px rgba(0, 0, 0, 0.35)',
                objectFit: 'contain',
              }}
              priority
            />
            <Title
              level={3}
              className="lobby-title"
              style={{
                margin: 0,
                color: 'white',
                fontFamily: "'Orbitron', sans-serif",
                fontWeight: 700,
                letterSpacing: '1.5px',
                textShadow:
                  '0 0 8px rgba(255,255,255,0.4), 0 0 25px rgb(156, 43, 231)',
              }}
            >
              Трещотка
            </Title>
          </div>
          
          <div></div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              className="lobby-header-user-info"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Text strong style={{ color: '#d1d5db' }}>
                Привет, {displayName}
              </Text>
              {role === 'admin' && (
                <Tag color="gold" style={{ margin: 0 }}>
                  ADMIN
                </Tag>
              )}
            </div>
            <Button
              type="primary"
              danger
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              Выйти
            </Button>
          </div>
        </Header>

        <Content
          style={{
            padding: '32px',
            background: '#0f111a',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '48px',
            flex: 1,
          }}
        >
          <div style={{
            display: 'flex',
            width: '100%',
            maxWidth: '1200px',
            height: '500px',
            gap: '24px',
            borderRadius: '32px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}>
            <button
              onClick={handleOneOnOneClick}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '24px',
                background: 'rgba(28, 31, 46, 0.8)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRight: '0.5px solid rgba(255, 255, 255, 0.05)',
                cursor: 'pointer',
                padding: '40px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
              }}
              className="home-choice-button"
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(168, 85, 247, 0.1))',
                opacity: 0,
                transition: 'opacity 0.3s ease',
                zIndex: 0,
              }} />
              <div style={{ 
                fontSize: '4rem',
                color: '#60a5fa',
                zIndex: 1,
                transition: 'all 0.3s ease',
              }}>
                <UserOutlined />
              </div>
              <Title level={2} style={{ 
                margin: 0, 
                color: 'white',
                fontFamily: "'Orbitron', sans-serif",
                fontWeight: 600,
                zIndex: 1,
                transition: 'all 0.3s ease',
              }}>
                Звонки<br></br>1 на 1
              </Title>
              <Text style={{ 
                color: 'rgba(255, 255, 255, 0.6)', 
                textAlign: 'center',
                fontSize: '1rem',
                zIndex: 1,
                transition: 'all 0.3s ease',
              }}>
                Приватные звонки с одним собеседником
              </Text>
            </button>

            <button
              onClick={handleGroupCallsClick}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '24px',
                background: 'rgba(28, 31, 46, 0.8)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderLeft: '0.5px solid rgba(255, 255, 255, 0.05)',
                cursor: 'pointer',
                padding: '40px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
              }}
              className="home-choice-button"
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(59, 130, 246, 0.1))',
                opacity: 0,
                transition: 'opacity 0.3s ease',
                zIndex: 0,
              }} />
              <div style={{ 
                fontSize: '4rem',
                color: '#22c55e',
                zIndex: 1,
                transition: 'all 0.3s ease',
              }}>
                <TeamOutlined />
              </div>
              <Title level={2} style={{ 
                margin: 0, 
                color: 'white',
                fontFamily: "'Orbitron', sans-serif",
                fontWeight: 600,
                zIndex: 1,
                transition: 'all 0.3s ease',
              }}>
                Групповые<br></br>звонки
              </Title>
              <Text style={{ 
                color: 'rgba(255, 255, 255, 0.6)', 
                textAlign: 'center',
                fontSize: '1rem',
                zIndex: 1,
                transition: 'all 0.3s ease',
              }}>
                Конференции с несколькими участниками
              </Text>
            </button>
          </div>

          <Text style={{ 
            color: 'rgba(255, 255, 255, 0.4)', 
            textAlign: 'center',
            fontSize: '0.9rem',
            maxWidth: '600px',
          }}>
            Выберите тип звонка, чтобы продолжить. Для приватных разговоров используйте «Звонки 1 на 1», для встреч с коллегами или друзьями — «Групповые звонки».
          </Text>
        </Content>
      </Layout>

      <style jsx global>{`
        .home-choice-button:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }
        
        .home-choice-button:hover > div:first-child {
          opacity: 1;
        }
        
        .home-choice-button:hover > div:nth-child(2) {
          transform: scale(1.1);
        }
        
        .home-choice-button:hover h2 {
          text-shadow: 0 0 12px rgba(255,255,255,0.3);
        }
        
        .home-choice-button:hover span {
          color: rgba(255, 255, 255, 0.8) !important;
        }
        
        @media (max-width: 768px) {
          .home-choice-button {
            padding: 24px !important;
          }
          
          .home-choice-button h2 {
            font-size: 1.5rem !important;
          }
        }
        
        @media (max-width: 640px) {
          .home-choice-button {
            padding: 20px !important;
          }
          
          .home-choice-button h2 {
            font-size: 1.25rem !important;
          }
        }
      `}</style>
    </ConfigProvider>
  )
}
