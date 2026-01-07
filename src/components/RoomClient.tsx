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
  const client = useRTCClient(agoraClient as any);

  useEffect(() => {
    if (user.uid && user.displayName) {
      joinRoom(roomId, {
        uid: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });
    }
    return () => {
      if (user.uid) {
        leaveRoom(roomId, user.uid);
      }
    };
  }, [roomId, user.uid, user.displayName, user.photoURL]);

  if (!agoraAppId) return <div>Отсутствует Agora App ID в .env.local</div>;

  return (
    <AgoraRTCProvider client={client}>
      <Layout
        className="room-layout"
        style={{ height: "100vh", background: "transparent" }}
      >
        <Content
          className="room-content"
          style={{ padding: "24px", display: "flex", flexDirection: "column" }}
        >
          <div className="video-wrapper">
            <VideoCall
              appId={agoraAppId}
              channelName={roomName}
              canRecord={canRecord}
            />
          </div>
        </Content>
        <Sider
          className="room-sider"
          width={400}
          theme="light"
          style={{ background: "transparent", padding: "24px", paddingLeft: 0 }}
        >
          <div className="glass-panel">
            <Tabs
              defaultActiveKey="chat"
              className="custom-tabs"
              items={[
                {
                  label: "Чат",
                  key: "chat",
                  children: <Chat roomId={roomId} roomName={roomName} />,
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
