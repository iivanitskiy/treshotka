"use client";

import { useEffect, useMemo } from "react";
import { useAppSelector } from "@/lib/hooks";
import { joinRoom, leaveRoom } from "@/lib/services/roomService";
import AgoraRTC from "agora-rtc-react";
import { AgoraRTCProvider, useRTCClient } from "agora-rtc-react";
import { Layout, Tabs } from "antd";
import { VideoCall } from "./VideoCall";
import Chat from "./Chat";
import ParticipantList from "./ParticipantList";
import styles from "./RoomClient.module.css";

const { Content, Sider } = Layout;

export default function RoomClient({
  roomId,
  roomName,
  creatorId,
}: {
  roomId: string;
  roomName: string;
  creatorId: string;
}) {
  const user = useAppSelector((state) => state.auth);
  const canRecord = user.role === "admin" || user.uid === creatorId;
  const agoraAppId = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";

  const agoraClient = useMemo(
    () => AgoraRTC.createClient({ codec: "vp8", mode: "rtc" }),
    []
  );
  const client = useRTCClient(agoraClient);

  useEffect(() => {
    if (user.uid && user.displayName) {
      joinRoom(roomId, {
        uid: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });

      let hasLeftRoom = false;
      
      const leaveRoomIfNeeded = () => {
        if (!hasLeftRoom && user.uid) {
          hasLeftRoom = true;
          leaveRoom(roomId, user.uid);
        }
      };

      const handleBeforeUnload = (event: BeforeUnloadEvent) => {
        leaveRoomIfNeeded();
        
        event.preventDefault();
        event.returnValue = '';
      };

      const handlePageHide = (event: PageTransitionEvent) => {
        if (!event.persisted) {
          leaveRoomIfNeeded();
        }
      };

      window.addEventListener("beforeunload", handleBeforeUnload);
      window.addEventListener("pagehide", handlePageHide);

      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
        window.removeEventListener("pagehide", handlePageHide);
        leaveRoomIfNeeded();
      };
    }
  }, [roomId, user.uid, user.displayName, user.photoURL]);

  if (!agoraAppId) return <div>Отсутствует Agora App ID в .env.local</div>;

  return (
    <AgoraRTCProvider client={client}>
      <Layout
        className={`room-layout ${styles.roomLayout}`}
      >
        <Content
          className={`room-content ${styles.roomContent}`}
        >
          <div className="video-wrapper">
            <VideoCall
              appId={agoraAppId}
              channelName={roomName}
              roomId={roomId}
              user={user}
              canRecord={canRecord}
            />
          </div>
        </Content>
        <Sider
          className={`room-sider ${styles.roomSidebar}`}
          width={400}
          theme="light"
        >
          <div className="glass-panel">
            <Tabs
              defaultActiveKey="chat"
              className="custom-tabs"
              items={[
                {
                  label: "Чат",
                  key: "chat",
                  children: <Chat roomId={roomId} />,
                },
                {
                  label: "Участники",
                  key: "participants",
                  children: <ParticipantList roomId={roomId} />,
                },
              ]}
            />
          </div>
        </Sider>
      </Layout>
    </AgoraRTCProvider>
  );
}
