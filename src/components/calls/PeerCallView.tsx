"use client";

import { useEffect, useRef } from "react";
import { Button, Space, Tooltip } from "antd";
import {
  AudioOutlined,
  AudioMutedOutlined,
  VideoCameraOutlined,
  VideoCameraAddOutlined,
  PoweroffOutlined,
} from "@ant-design/icons";
import styles from "./PeerCallView.module.css";

interface PeerCallViewProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerName: string;
  statusLabel: string;
  micOn: boolean;
  cameraOn: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onHangUp: () => void;
}

function VideoElement({
  stream,
  muted,
  className,
}: {
  stream: MediaStream | null;
  muted?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (stream) {
      el.srcObject = stream;
    } else {
      el.srcObject = null;
    }
    return () => {
      if (el) el.srcObject = null;
    };
  }, [stream]);

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted={muted}
      className={className}
    />
  );
}

export default function PeerCallView({
  localStream,
  remoteStream,
  peerName,
  statusLabel,
  micOn,
  cameraOn,
  onToggleMic,
  onToggleCamera,
  onHangUp,
}: PeerCallViewProps) {
  return (
    <div className={styles.overlay}>
      <div className={styles.videos}>
        <div className={styles.statusBar}>
          {statusLabel} — {peerName}
        </div>
        {remoteStream ? (
          <VideoElement
            stream={remoteStream}
            className={styles.remoteVideo}
          />
        ) : (
          <div className={styles.placeholder}>Ожидание видео…</div>
        )}
        <div className={styles.localPip}>
          {localStream ? (
            <VideoElement stream={localStream} muted />
          ) : (
            <div className={styles.placeholder} style={{ fontSize: 12 }}>
              Камера
            </div>
          )}
        </div>
      </div>

      <div className={styles.controls}>
        <Space size="middle">
          <Tooltip title={micOn ? "Выключить микрофон" : "Включить микрофон"}>
            <Button
              className={styles.controlBtn}
              shape="circle"
              icon={micOn ? <AudioOutlined /> : <AudioMutedOutlined />}
              onClick={onToggleMic}
              style={{
                background: micOn ? "rgba(255,255,255,0.15)" : "#ef4444",
                color: "white",
                border: "none",
              }}
            />
          </Tooltip>
          <Tooltip title={cameraOn ? "Выключить камеру" : "Включить камеру"}>
            <Button
              className={styles.controlBtn}
              shape="circle"
              icon={
                cameraOn ? <VideoCameraOutlined /> : <VideoCameraAddOutlined />
              }
              onClick={onToggleCamera}
              style={{
                background: cameraOn ? "rgba(255,255,255,0.15)" : "#ef4444",
                color: "white",
                border: "none",
              }}
            />
          </Tooltip>
          <Tooltip title="Завершить звонок">
            <Button
              className={`${styles.controlBtn} ${styles.hangUpBtn}`}
              shape="circle"
              type="primary"
              danger
              icon={<PoweroffOutlined />}
              onClick={onHangUp}
            />
          </Tooltip>
        </Space>
      </div>
    </div>
  );
}
