"use client";

import {
  LocalUser,
  RemoteUser,
  usePublish,
  useRemoteUsers,
  useRTCClient,
  ILocalTrack,
} from "agora-rtc-react";
import AgoraRTC, {
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
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

const ActiveCallSession = ({
  appId,
  channelName,
  micOn,
  cameraOn,
  onLeave,
}: {
  appId: string;
  channelName: string;
  micOn: boolean;
  cameraOn: boolean;
  onLeave: () => void;
}) => {
  const client = useRTCClient();
  const [localUid, setLocalUid] = useState<string | number | null>(null);
  const [focusedUid, setFocusedUid] = useState<string | number>("local");
  const [isManualFocus, setIsManualFocus] = useState(false);
  const [speakingUid, setSpeakingUid] = useState<string | number | null>(null);

  const [audioTrack, setAudioTrack] = useState<IMicrophoneAudioTrack | null>(
    null
  );
  const [videoTrack, setVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const tracksRef = useRef<{
    audio: IMicrophoneAudioTrack | null;
    video: ICameraVideoTrack | null;
  }>({ audio: null, video: null });

  useEffect(() => {
    let isMounted = true;

    const initTracks = async () => {
      // Функция с повторными попытками для микрофона
      const createMicWithRetry = async (
        retries = 3,
        delay = 1000
      ): Promise<IMicrophoneAudioTrack> => {
        try {
          return await AgoraRTC.createMicrophoneAudioTrack({
            encoderConfig: "speech_standard", // Используем стандартный профиль
          });
        } catch (err: any) {
          if (
            retries > 0 &&
            (err.name === "NotReadableError" || err.code === "NOT_READABLE")
          ) {
            console.warn(
              `Mic busy, retrying in ${delay}ms... (${retries} left)`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            return createMicWithRetry(retries - 1, delay * 1.5);
          }
          throw err;
        }
      };

      // Инициализируем микрофон
      try {
        const audio = await createMicWithRetry();
        if (!isMounted) {
          audio.stop();
          audio.close();
        } else {
          tracksRef.current.audio = audio;
          setAudioTrack(audio);
        }
      } catch (error) {
        console.error("Failed to create audio track after retries:", error);
      }

      // Инициализируем камеру
      try {
        const video = await AgoraRTC.createCameraVideoTrack({
          encoderConfig: "720p_1",
        });
        if (!isMounted) {
          video.stop();
          video.close();
        } else {
          tracksRef.current.video = video;
          setVideoTrack(video);
        }
      } catch (error) {
        console.error("Failed to create video track:", error);
      }
    };

    // Запускаем инициализацию с небольшой задержкой для стабильности
    const timer = setTimeout(initTracks, 500);

    return () => {
      isMounted = false;
      clearTimeout(timer);

      // Жесткая очистка треков из ref
      if (tracksRef.current.audio) {
        tracksRef.current.audio.stop();
        tracksRef.current.audio.close();
        tracksRef.current.audio = null;
      }
      if (tracksRef.current.video) {
        tracksRef.current.video.stop();
        tracksRef.current.video.close();
        tracksRef.current.video = null;
      }
      // Очищаем стейт
      setAudioTrack(null);
      setVideoTrack(null);
    };
  }, []);

  // Управление состоянием (вкл/выкл) треков
  useEffect(() => {
    if (audioTrack) {
      audioTrack.setEnabled(micOn);
    }
  }, [audioTrack, micOn]);

  useEffect(() => {
    if (videoTrack) {
      videoTrack.setEnabled(cameraOn);
    }
  }, [videoTrack, cameraOn]);

  {
    const publishTracks: ILocalTrack[] = [];
    if (audioTrack) publishTracks.push(audioTrack as unknown as ILocalTrack);
    if (videoTrack) publishTracks.push(videoTrack as unknown as ILocalTrack);
    usePublish(publishTracks);
  }

  const remoteUsers = useRemoteUsers();
  const effectiveFocusedUid =
    focusedUid === "local" || remoteUsers.some((u) => u.uid === focusedUid)
      ? focusedUid
      : "local";

  useEffect(() => {
    let ignore = false;
    client
      .join(appId, channelName, null, null)
      .then((uid) => {
        if (!ignore) setLocalUid(uid);
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Join failed:", err);
          onLeave();
        }
      });

    return () => {
      ignore = true;
      client.leave().catch((err) => console.error("Leave failed:", err));
    };
  }, [appId, channelName, client, onLeave]);

  useEffect(() => {
    if (!client) return;

    client.enableAudioVolumeIndicator();

    const handleVolumeIndicator = (
      volumes: Array<{ level: number; uid: string | number }>
    ) => {
      const loudest = getLoudest(volumes);

      if (loudest && loudest.level > 25) {
        const targetUid =
          loudest.uid === 0 || loudest.uid === localUid ? "local" : loudest.uid;
        setSpeakingUid(targetUid);
        if (!isManualFocus) {
          setFocusedUid(targetUid);
        }
      }
    };

    client.on("volume-indicator", handleVolumeIndicator);

    return () => {
      client.off("volume-indicator", handleVolumeIndicator);
    };
  }, [client, isManualFocus, localUid]);

  const renderSmallVideo = (isLocal: boolean, user?: IAgoraRTCRemoteUser) => {
    if (!isLocal && !user) return null;

    const isFocused = isLocal
      ? effectiveFocusedUid === "local"
      : effectiveFocusedUid === user?.uid;
    const isSpeaking = isLocal
      ? speakingUid === "local"
      : speakingUid === user?.uid;

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
          border: isSpeaking
            ? "2px solid #3b82f6"
            : "1px solid rgba(255, 255, 255, 0.08)",
          position: "relative",
          cursor: "pointer",
          boxShadow: isSpeaking
            ? "0 0 0 3px rgba(59,130,246,0.25), 0 10px 15px -3px rgba(0,0,0,0.3)"
            : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        }}
        className="video-card-small"
      >
        {isLocal ? (
          <LocalUser
            videoTrack={(videoTrack as any) || undefined}
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
          videoTrack={(videoTrack as any) || undefined}
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
    <>
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
    </>
  );
};

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef<number | null>(null);

  const { isRecording, startRecording, stopRecording } = useScreenRecorder({
    channelName,
  });

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

  useEffect(() => {
    const isMobileLandscape = () =>
      window.matchMedia("(orientation: landscape)").matches &&
      Math.max(window.innerWidth, window.innerHeight) <= 900;

    const resetHideTimer = () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      if (isMobileLandscape()) {
        setControlsVisible(true);
        hideTimerRef.current = window.setTimeout(() => {
          setControlsVisible(false);
        }, 3000);
      } else {
        setControlsVisible(true);
      }
    };

    const handlePointer = () => {
      resetHideTimer();
    };

    resetHideTimer();

    const el = containerRef.current;
    window.addEventListener("resize", handlePointer);
    if (el) el.addEventListener("pointerdown", handlePointer);

    return () => {
      window.removeEventListener("resize", handlePointer);
      if (el) el.removeEventListener("pointerdown", handlePointer);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`video-call-container ${isFullscreen ? "fullscreen" : ""}`}
    >
      {activeConnection ? (
        <ActiveCallSession
          appId={appId}
          channelName={channelName}
          micOn={micOn}
          cameraOn={cameraOn}
          onLeave={() => setActiveConnection(false)}
        />
      ) : (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            textAlign: "center",
            justifyContent: "center",
            color: "rgba(255,255,255,0.5)",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div
            style={{
              fontSize: "64px",
              opacity: 0.2,
            }}
          >
            <VideoCameraOutlined />
          </div>
          <div>Нажмите кнопку подключения, чтобы войти в трансляцию</div>
        </div>
      )}

      <div
        className={`video-controls-wrapper ${controlsVisible ? "" : "hidden"}`}
      >
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
