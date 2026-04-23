"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import {
  Button,
  Layout,
  Typography,
  ConfigProvider,
  theme,
  Spin,
  Tag,
  Input,
  Select,
  Grid,
} from "antd";
import { LogoutOutlined, HomeOutlined, SearchOutlined } from "@ant-design/icons";
import Image from "next/image";
import { auth } from "@/lib/firebase";
import { clearUser } from "@/lib/features/auth/authSlice";
import HamburgerMenu from "@/components/HamburgerMenu";
import UserList from "@/components/calls/UserList";
import CallModal from "@/components/calls/CallModal";
import VideoCallWindow from "@/components/calls/VideoCallWindow";
import { subscribeToUsers, FirebaseUser } from "@/lib/services/userService";
import { clearPresence } from "@/lib/services/presenceService";
import styles from "./calls.module.css";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

import { endCall, monitorCall, isUserOnCall } from "@/lib/services/callService";
import { db } from "@/lib/firebase";
import { collection, doc, setDoc, addDoc, onSnapshot, getDoc } from "firebase/firestore";

export default function CallsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!user.isLoading && !user.isAuthenticated) {
      router.push("/login");
    }
  }, [user.isAuthenticated, user.isLoading, router]);

  const [users, setUsers] = useState<FirebaseUser[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const { xs } = Grid.useBreakpoint();


  const [currentCall, setCurrentCall] = useState<{
    userId: string;
    name: string;
    status: 'calling' | 'receiving' | 'active';
  } | null>(null);

  useEffect(() => {
    console.log('currentCall changed:', currentCall);
  }, [currentCall]);


  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);


  const [isVideoEnabled, setIsVideoEnabled] = useState(false);


  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const callUnsubscribe = useRef<(() => void) | null>(null);

  const handleLogout = () => {
    clearPresence();
    auth.signOut();
    dispatch(clearUser());
    router.push("/login");
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.displayName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "online" && user.online) ||
      (statusFilter === "offline" && !user.online);
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    const unsubscribe = subscribeToUsers((firebaseUsers) => {
      setUsers(firebaseUsers);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);


  const initializePeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

  
    pc.ontrack = (event) => {
      if (event.track.kind === 'video' || event.track.kind === 'audio') {
        const remoteStream = event.streams[0];
        setRemoteStream(remoteStream);
      }
    };

    
    pc.onicecandidate = async (event) => {
      if (event.candidate && currentCall) {
        const candidatesRef = collection(doc(db, 'calls', currentCall.userId), 'candidates');
        await addDoc(candidatesRef, event.candidate.toJSON());
      }
    };

    return pc;
  }, [currentCall]);

  const getLocalStream = async (withVideo: boolean = false) => {
    try {
      if (typeof window === 'undefined' || !navigator || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media devices not available');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: withVideo
      });
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('Error accessing media devices:', err);
      throw err;
    }
  };

  const handleCallClick = async (userId: string) => {
    console.log('handleCallClick called for userId:', userId);
    if (currentCall) {
      console.log('Already in a call', currentCall);
      return;
    }
    
    const callee = users.find(u => u.uid === userId);
    if (!callee) {
      console.log('Callee not found');
      return;
    }
    
    if (!user.uid || !user.displayName) {
      console.error('User not properly authenticated', user);
      return;
    }
    console.log('Starting call to', callee.displayName);
    
    try {
      const isBusy = await isUserOnCall(userId);
      if (isBusy) {
        alert('Пользователь уже находится в другом вызове');
        return;
      }
      
      peerConnection.current = initializePeerConnection();
      
      const stream = await getLocalStream();
      stream.getTracks().forEach(track => {
        peerConnection.current?.addTrack(track, stream);
      });
      
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      
      const callRef = doc(db, 'calls', userId);
      await setDoc(callRef, {
        offer: {
          type: offer.type,
          sdp: offer.sdp
        },
        callerId: user.uid,
        callerName: user.displayName,
        timestamp: new Date().getTime(),
        status: 'ringing'
      });
      
      setCurrentCall({
        userId,
        name: callee.displayName,
        status: 'calling'
      });
      
      const answerCallRef = doc(db, 'calls', user.uid);
      console.log('Listening for answer on document:', answerCallRef.path);
      callUnsubscribe.current = onSnapshot(answerCallRef, async (doc) => {
        console.log('Answer document snapshot:', doc.exists());
        if (doc.exists()) {
          const data = doc.data();
          console.log('Answer data:', data);
          // Если есть answer, устанавливаем remote description
          if (data?.answer) {
            console.log('Answer received, setting remote description');
            await peerConnection.current?.setRemoteDescription(new RTCSessionDescription(data.answer));
            setCurrentCall(prev => {
              if (!prev) {
                console.warn('No current call when answer received');
                return null;
              }
              if (prev.status === 'active') {
                console.log('Call already active');
                return prev;
              }
              console.log('Updating call status to active');
              return { ...prev, status: 'active' };
            });
          }
          // Если статус active, обновляем локальный статус
          if (data?.status === 'active') {
            setCurrentCall(prev => {
              if (!prev || prev.status === 'active') return prev;
              console.log('Status updated to active via status field');
              return { ...prev, status: 'active' };
            });
          }
        }
      });
      
    } catch (err) {
      console.error('Error making call:', err);
      setCurrentCall(null);
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }
      alert('Не удалось установить соединение');
    }
  };

  const handleAnswerCall = async () => {
    if (!currentCall || !peerConnection.current || !user.uid) return;
    
    try {
      const stream = await getLocalStream();
      stream.getTracks().forEach(track => {
        peerConnection.current?.addTrack(track, stream);
      });
      
      const callRef = doc(db, 'calls', user.uid);
      const callDoc = await getDoc(callRef);
      const data = callDoc.data();
      if (data?.offer) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.offer));
      }
      
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      
      const answerRef = doc(db, 'calls', currentCall.userId);
      console.log('Writing answer to document:', answerRef.path, answer);
      await setDoc(answerRef, {
        answer: {
          type: answer.type,
          sdp: answer.sdp
        },
        status: 'active'
      }, { merge: true });
      console.log('Answer written successfully');
      
      const candidatesRef = collection(doc(db, 'calls', currentCall.userId), 'candidates');
      onSnapshot(candidatesRef, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            await peerConnection.current?.addIceCandidate(new RTCIceCandidate(data));
          }
        });
      });
      
      setCurrentCall(prev => prev ? { ...prev, status: 'active' } : null);
      
    } catch (err) {
      console.error('Error answering call:', err);
      handleRejectCall();
    }
  };

  const handleRejectCall = async () => {
    if (currentCall) {
      await endCall(currentCall.userId);
    }
    if (callUnsubscribe.current) {
      callUnsubscribe.current();
      callUnsubscribe.current = null;
    }
    setCurrentCall(null);
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
  };

  const handleEndCall = async () => {
    await handleRejectCall();
  };

  const toggleVideo = async () => {
    if (!currentCall || !peerConnection.current || !localStream) return;
    
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoEnabled(videoTrack.enabled);
    } else {
      try {
        const stream = await getLocalStream(true);
        const newVideoTrack = stream.getVideoTracks()[0];
        if (newVideoTrack && peerConnection.current.getSenders()) {
          const videoSender = peerConnection.current.getSenders().find(s => s.track?.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(newVideoTrack);
          } else {
            peerConnection.current.addTrack(newVideoTrack, stream);
          }
          localStream.addTrack(newVideoTrack);
        }
        setIsVideoEnabled(true);
      } catch (err) {
        console.error('Error enabling video:', err);
        alert('Не удалось включить камеру');
      }
    }
  };

  useEffect(() => {
    const uid = user.uid;
    if (!uid) return;
    
    let candidatesUnsubscribe: (() => void) | null = null;
    
    const unsubscribe = monitorCall(uid, (callData) => {
      console.log('monitorCall received data:', callData);
      if (callData && (callData.status === 'ringing' || (callData as any).status === 'calling')) {
        console.log('Incoming call from:', callData.callerName);
        const caller = users.find(u => u.uid === callData.callerId);
        if (caller) {
          setCurrentCall({
            userId: callData.callerId,
            name: callData.callerName,
            status: 'receiving'
          });
          
          peerConnection.current = initializePeerConnection();
          
          const candidatesRef = collection(doc(db, 'calls', uid), 'candidates');
          candidatesUnsubscribe = onSnapshot(candidatesRef, (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
              if (change.type === 'added') {
                const data = change.doc.data();
                await peerConnection.current?.addIceCandidate(new RTCIceCandidate(data));
              }
            });
          });
        }
      } else if (!callData && currentCall?.status === 'receiving') {
        console.log('Call ended or rejected');
        setCurrentCall(null);
        if (candidatesUnsubscribe) {
          candidatesUnsubscribe();
          candidatesUnsubscribe = null;
        }
      }
    });
    
    return () => {
      unsubscribe();
      if (candidatesUnsubscribe) {
        candidatesUnsubscribe();
      }
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
    };
  }, [user.uid, users, currentCall, initializePeerConnection]);

  if (user.isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f111a",
        }}
      >
        <Spin size="large" tip="Загрузка пользователей..." />
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        components: {
          Modal: {
            contentBg: "rgba(28, 31, 46, 0.9)",
            headerBg: "transparent",
            footerBg: "transparent",
          },
          Input: {
            colorBgContainer: "rgba(255, 255, 255, 0.05)",
            colorBorder: "rgba(255, 255, 255, 0.1)",
          },
        },
        token: {
          colorBgBase: "#0f111a",
          colorText: "white",
        },
      }}
    >
      <Layout style={{ minHeight: "100vh", background: "#0f111a" }}>
        <Header
          className="lobby-header"
          style={{
            padding: "16px 24px",
            height: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(28, 31, 46, 0.8)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div
            className="header-left-desktop"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flex: 1,
            }}
          >
            <Image
              src="/logo.png"
              width={48}
              height={48}
              alt="Логотип"
              style={{
                padding: "4px",
                borderRadius: "16px",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                boxShadow: "0 10px 20px rgba(0, 0, 0, 0.35)",
                objectFit: "contain",
              }}
              priority
            />
            <Title
              level={3}
              className="lobby-title"
              style={{
                margin: 0,
                color: "white",
                fontFamily: "'Orbitron', sans-serif",
                fontWeight: 700,
                letterSpacing: "1.5px",
                textShadow:
                  "0 0 8px rgba(255,255,255,0.4), 0 0 25px rgb(156, 43, 231)",
              }}
            >
              Трещотка
            </Title>
          </div>

          <div className="home-button" onClick={() => router.push("/")}>
            {<HomeOutlined />}На главную
          </div>

          <div className="header-mobile">
            <HamburgerMenu onLogout={handleLogout} />
          </div>

          <div
            className="header-right-desktop"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              flex: 1,
              justifyContent: "flex-end",
            }}
          >
            <div
              className="lobby-header-user-info"
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Text strong style={{ color: "#d1d5db" }}>
                Привет, {user.displayName}
              </Text>
              {user.role === "admin" && (
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
              className={styles.logoutButton}
            >
              Выйти
            </Button>
          </div>
        </Header>

        <Content
          style={{
            padding: "16px",
            background: "#0f111a",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "32px",
          }}
        >
          <div
            style={{
              background: "rgba(28, 31, 46, 0.8)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: "24px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              overflow: "hidden",
              padding: "32px",
              maxWidth: "800px",
              width: "100%",
            }}
          >
            <div style={{ marginBottom: "32px" }}>
              <Title level={2} style={{ color: "white", marginBottom: "8px" }}>
                Звонки 1 на 1
              </Title>
              <Text style={{ color: "rgba(255, 255, 255, 0.6)" }}>
                Выберите пользователя из списка для начала звонка
              </Text>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: xs ? "column" : "row",
                gap: "16px",
                marginBottom: "24px",
                flexWrap: "wrap",
              }}
            >
              <Input
                placeholder="Поиск по имени..."
                prefix={<SearchOutlined />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  flex: xs ? "none" : 1,
                  width: xs ? "100%" : "70%",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "white",
                }}
              />
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: xs ? "100%" : "30%" }}
                options={[
                  { value: "all", label: "Все пользователи" },
                  { value: "online", label: "Только онлайн" },
                  { value: "offline", label: "Только оффлайн" },
                ]}
              />
            </div>

            <UserList users={filteredUsers} onCallClick={handleCallClick} currentUserId={user.uid ?? undefined} />

            <div style={{ marginTop: "32px", textAlign: "center" }}>
              <Text type="secondary" style={{ color: "rgba(255, 255, 255, 0.4)" }}>
                Всего зарегистрированных пользователей: {users.length}
              </Text>
            </div>
          </div>

          {/* Модальное окно для входящего вызова */}
          <CallModal
            open={currentCall?.status === 'receiving'}
            onAccept={handleAnswerCall}
            onReject={handleRejectCall}
            callerName={currentCall?.name || ''}
          />

          {/* Окно активного вызова */}
          {(currentCall?.status === 'calling' || currentCall?.status === 'active') && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(0, 0, 0, 0.9)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div style={{ width: '80%', maxWidth: '800px' }}>
                <VideoCallWindow
                  localStream={localStream}
                  remoteStream={remoteStream}
                  isVideoEnabled={isVideoEnabled}
                  isCallActive={currentCall?.status === 'active'}
                  onToggleVideo={toggleVideo}
                  onEndCall={handleEndCall}
                />
              </div>
            </div>
          )}

        </Content>
      </Layout>
    </ConfigProvider>
  );
}
