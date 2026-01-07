"use client";

import {
  LocalUser,
  RemoteUser,
  useJoin,
  useLocalCameraTrack,
  useLocalMicrophoneTrack,
  usePublish,
  useRemoteUsers,
  useRTCClient,
} from "agora-rtc-react";
import { useState, useEffect, useRef } from "react";
import { Button, Tooltip, Space } from "antd";
import {
  AudioOutlined,
  AudioMutedOutlined,
  VideoCameraOutlined,
  VideoCameraAddOutlined,
  PoweroffOutlined,
  HomeOutlined,
  UserSwitchOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import type { IAgoraRTCRemoteUser } from "agora-rtc-react";
import { useScreenRecorder } from "@/hooks/useScreenRecorder";
import { getLoudest } from "@/lib/utils/audio";

export const VideoCall = ({
  appId,
  channelName,
  canRecord = false,
}: {
  appId: string;
  channelName: string;
  canRecord?: boolean;
}) => {
  const router = useRouter();
  const [activeConnection, setActiveConnection] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const client = useRTCClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [focusedUid, setFocusedUid] = useState<string | number>("local");
  const [isManualFocus, setIsManualFocus] = useState(false);

  const { isRecording, startRecording, stopRecording } = useScreenRecorder({
    channelName,
  });

  const { data: localUid } = useJoin(
    {
      appid: appId,
      channel: channelName,
      token: null,
    },
    activeConnection
  );

  const { localMicrophoneTrack } = useLocalMicrophoneTrack(
    micOn && activeConnection
  );
  const { localCameraTrack } = useLocalCameraTrack(
    cameraOn && activeConnection,
    {
      encoderConfig: "720p_1",
    }
  );

  usePublish([localMicrophoneTrack, localCameraTrack]);

  const remoteUsers = useRemoteUsers();
  const effectiveFocusedUid =
    focusedUid === "local" || remoteUsers.some((u) => u.uid === focusedUid)
      ? focusedUid
      : "local";

  useEffect(() => {
    if (!client || !activeConnection) return;

    client.enableAudioVolumeIndicator();

    const handleVolumeIndicator = (
      volumes: Array<{ level: number; uid: string | number }>
    ) => {
      if (isManualFocus) return;

      const loudest = getLoudest(volumes);

      if (loudest && loudest.level > 25) {
        if (loudest.uid === 0 || loudest.uid === localUid) {
          setFocusedUid("local");
        } else {
          setFocusedUid(loudest.uid);
        }
      }
    };

    client.on("volume-indicator", handleVolumeIndicator);

    return () => {
      client.off("volume-indicator", handleVolumeIndicator);
    };
  }, [client, activeConnection, isManualFocus, localUid]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const renderSmallVideo = (isLocal: boolean, user?: IAgoraRTCRemoteUser) => {
    if (!isLocal && !user) return null;

    const isFocused = isLocal
      ? effectiveFocusedUid === "local"
      : effectiveFocusedUid === user?.uid;

    if (isFocused) return null;

    return (
      <div
        key={isLocal ? "local" : user!.uid}
        onClick={() => {
          setFocusedUid(isLocal ? "local" : user!.uid);
          setIsManualFocus(true);
        }}
        style={{
          width: "180px",
          height: "100px",
          flexShrink: 0,
          background: "#1c1f2e",
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          position: "relative",
          cursor: "pointer",
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        }}
        className="video-card-small"
      >
        {isLocal ? (
          <LocalUser
            audioTrack={localMicrophoneTrack}
            videoTrack={localCameraTrack}
            micOn={micOn}
            cameraOn={cameraOn}
            cover="https://www.agora.io/en/wp-content/uploads/2022/10/3d-spatial-audio-icon.svg"
          >
            <div
              style={{
                position: "absolute",
                bottom: "4px",
                left: "4px",
                background: "rgba(0, 0, 0, 0.6)",
                color: "white",
                padding: "2px 8px",
                borderRadius: "4px",
                fontSize: "10px",
              }}
            >
              Вы
            </div>
          </LocalUser>
        ) : (
          <RemoteUser
            user={user!}
            cover="https://www.agora.io/en/wp-content/uploads/2022/10/3d-spatial-audio-icon.svg"
          >
            <div
              style={{
                position: "absolute",
                bottom: "4px",
                left: "4px",
                background: "rgba(0, 0, 0, 0.6)",
                color: "white",
                padding: "2px 8px",
                borderRadius: "4px",
                fontSize: "10px",
              }}
            >
              User {user!.uid}
            </div>
          </RemoteUser>
        )}
      </div>
    );
  };

  const renderFocusedVideo = () => {
    if (effectiveFocusedUid === "local") {
      return (
        <LocalUser
          audioTrack={localMicrophoneTrack}
          videoTrack={localCameraTrack}
          micOn={micOn}
          cameraOn={cameraOn}
          cover="https://www.agora.io/en/wp-content/uploads/2022/10/3d-spatial-audio-icon.svg"
        >
          <div
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "rgba(0, 0, 0, 0.6)",
              color: "white",
              padding: "4px 12px",
              borderRadius: "9999px",
              fontSize: "12px",
              backdropFilter: "blur(4px)",
            }}
          >
            Вы (Main)
          </div>
        </LocalUser>
      );
    }

    const remoteUser = remoteUsers.find(
      (user) => user.uid === effectiveFocusedUid
    );
    if (remoteUser) {
      return (
        <RemoteUser
          user={remoteUser}
          cover="https://www.agora.io/en/wp-content/uploads/2022/10/3d-spatial-audio-icon.svg"
        >
          <div
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "rgba(0, 0, 0, 0.6)",
              color: "white",
              padding: "4px 12px",
              borderRadius: "9999px",
              fontSize: "12px",
              backdropFilter: "blur(4px)",
            }}
          >
            Пользователь {remoteUser.uid}
          </div>
        </RemoteUser>
      );
    }

    return null;
  };

  return (
    <div
      ref={containerRef}
      className={`video-call-container ${isFullscreen ? "fullscreen" : ""}`}
    >
      <div className="video-call-top-list custom-scrollbar">
        {renderSmallVideo(true)}
        {remoteUsers.map((user) => renderSmallVideo(false, user))}
      </div>

      <div className="video-call-main-window">
        <div className="video-player-container">
          {isManualFocus && (
            <div
              style={{
                position: "absolute",
                top: "16px",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 30,
              }}
            >
              <Button
                type="primary"
                shape="round"
                icon={<UserSwitchOutlined />}
                onClick={() => setIsManualFocus(false)}
                style={{
                  background: "rgba(28, 31, 46, 0.8)",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                Вернуть авто-фокус
              </Button>
            </div>
          )}
          {renderFocusedVideo()}
          <div className="video-channel-name">{channelName}</div>
        </div>
      </div>

      <div className="video-controls-wrapper">
        <div className="video-call-controls">
          <Space size="middle">
            <Tooltip title={micOn ? "Выключить микрофон" : "Включить микрофон"}>
              <Button
                shape="circle"
                icon={micOn ? <AudioOutlined /> : <AudioMutedOutlined />}
                size="large"
                type="text"
                style={{
                  width: "48px",
                  height: "48px",
                  border: "none",
                  background: micOn ? "rgba(255, 255, 255, 0.1)" : "#ef4444",
                  color: "white",
                }}
                onClick={() => setMicOn(!micOn)}
              />
            </Tooltip>

            <Tooltip title={cameraOn ? "Выключить камеру" : "Включить камеру"}>
              <Button
                shape="circle"
                icon={
                  cameraOn ? (
                    <VideoCameraOutlined />
                  ) : (
                    <VideoCameraAddOutlined />
                  )
                }
                size="large"
                type="text"
                style={{
                  width: "48px",
                  height: "48px",
                  border: "none",
                  background: cameraOn ? "rgba(255, 255, 255, 0.1)" : "#ef4444",
                  color: "white",
                }}
                onClick={() => setCameraOn(!cameraOn)}
              />
            </Tooltip>

            <Tooltip title={activeConnection ? "Отключиться" : "Подключиться"}>
              <Button
                type="primary"
                shape="circle"
                icon={<PoweroffOutlined />}
                size="large"
                onClick={() => setActiveConnection(!activeConnection)}
                style={{
                  width: "48px",
                  height: "48px",
                  border: "none",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  background: activeConnection ? "#ef4444" : "#22c55e",
                }}
              />
            </Tooltip>

            {canRecord && (
              <Tooltip
                title={
                  isRecording ? "Остановить запись" : "Записать трансляцию"
                }
              >
                <Button
                  shape="circle"
                  icon={
                    isRecording ? (
                      <StopOutlined />
                    ) : (
                      <div
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          background: "#ef4444",
                        }}
                      />
                    )
                  }
                  size="large"
                  type="text"
                  style={{
                    width: "48px",
                    height: "48px",
                    border: "none",
                    background: isRecording
                      ? "rgba(239, 68, 68, 0.2)"
                      : "rgba(255, 255, 255, 0.1)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onClick={isRecording ? stopRecording : startRecording}
                />
              </Tooltip>
            )}

            <Tooltip
              title={
                isFullscreen
                  ? "Выйти из полноэкранного режима"
                  : "На весь экран"
              }
            >
              <Button
                shape="circle"
                icon={
                  isFullscreen ? (
                    <FullscreenExitOutlined />
                  ) : (
                    <FullscreenOutlined />
                  )
                }
                size="large"
                type="text"
                style={{
                  width: "48px",
                  height: "48px",
                  border: "none",
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "white",
                }}
                onClick={toggleFullscreen}
              />
            </Tooltip>

            <Tooltip title="На главную">
              <Button
                shape="circle"
                icon={<HomeOutlined />}
                size="large"
                type="text"
                style={{
                  width: "48px",
                  height: "48px",
                  border: "none",
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "white",
                }}
                onClick={() => {
                  if (activeConnection) {
                    setActiveConnection(false);
                  }
                  router.push("/lobby");
                }}
              />
            </Tooltip>
          </Space>
        </div>
      </div>
    </div>
  );
};
