"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Space, Tooltip } from "antd";
import {
  AudioOutlined,
  AudioMutedOutlined,
  VideoCameraOutlined,
  VideoCameraAddOutlined,
  PoweroffOutlined,
} from "@ant-design/icons";
import styles from "./PeerCallView.module.css";

const STATUS_HIDE_MS = 5000;

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

interface PipPosition {
  x: number;
  y: number;
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
  const videosRef = useRef<HTMLDivElement>(null);
  const pipRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    pipX: number;
    pipY: number;
  } | null>(null);

  const [pipPos, setPipPos] = useState<PipPosition | null>(null);
  const [pipDragging, setPipDragging] = useState(false);
  const [statusVisible, setStatusVisible] = useState(true);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clampPipPosition = useCallback((x: number, y: number): PipPosition => {
    const container = videosRef.current;
    const pip = pipRef.current;
    if (!container || !pip) return { x, y };

    const maxX = Math.max(0, container.clientWidth - pip.offsetWidth);
    const maxY = Math.max(0, container.clientHeight - pip.offsetHeight);
    return {
      x: Math.min(maxX, Math.max(0, x)),
      y: Math.min(maxY, Math.max(0, y)),
    };
  }, []);

  const getDefaultPipPosition = useCallback((): PipPosition | null => {
    const container = videosRef.current;
    const pip = pipRef.current;
    if (!container || !pip) return null;

    const margin = window.innerWidth >= 768 ? 24 : 16;
    const bottomOffset = window.innerWidth >= 768 ? 120 : 100;
    return clampPipPosition(
      container.clientWidth - pip.offsetWidth - margin,
      container.clientHeight - pip.offsetHeight - bottomOffset
    );
  }, [clampPipPosition]);

  const resetStatusTimer = useCallback(() => {
    setStatusVisible(true);
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
    }
    statusTimerRef.current = setTimeout(() => {
      setStatusVisible(false);
    }, STATUS_HIDE_MS);
  }, []);

  useEffect(() => {
    resetStatusTimer();

    const onActivity = () => resetStatusTimer();
    window.addEventListener("pointerdown", onActivity);
    window.addEventListener("touchstart", onActivity);
    window.addEventListener("keydown", onActivity);

    return () => {
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("touchstart", onActivity);
      window.removeEventListener("keydown", onActivity);
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current);
      }
    };
  }, [resetStatusTimer]);

  useEffect(() => {
    resetStatusTimer();
  }, [statusLabel, peerName, resetStatusTimer]);

  useEffect(() => {
    const placePip = () => {
      const defaults = getDefaultPipPosition();
      if (defaults) {
        setPipPos((prev) =>
          prev ? clampPipPosition(prev.x, prev.y) : defaults
        );
      }
    };

    placePip();
    window.addEventListener("resize", placePip);
    return () => window.removeEventListener("resize", placePip);
  }, [getDefaultPipPosition, clampPipPosition]);

  const onPipPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pipPos) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      pipX: pipPos.x,
      pipY: pipPos.y,
    };
    setPipDragging(true);
    resetStatusTimer();
  };

  const onPipPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPipPos(
      clampPipPosition(
        dragRef.current.pipX + dx,
        dragRef.current.pipY + dy
      )
    );
  };

  const onPipPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setPipDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.videos} ref={videosRef}>
        <div
          className={`${styles.statusBar} ${statusVisible ? "" : styles.statusBarHidden}`}
        >
          {statusLabel} — {peerName}
        </div>
        <div className={styles.remoteStage}>
          {remoteStream ? (
            <VideoElement
              stream={remoteStream}
              className={styles.remoteVideo}
            />
          ) : (
            <div className={styles.placeholder}>Ожидание видео…</div>
          )}
        </div>
        <div
          ref={pipRef}
          className={`${styles.localPip} ${pipDragging ? styles.localPipDragging : ""}`}
          style={
            pipPos
              ? { left: pipPos.x, top: pipPos.y, right: "auto", bottom: "auto" }
              : undefined
          }
          onPointerDown={onPipPointerDown}
          onPointerMove={onPipPointerMove}
          onPointerUp={onPipPointerUp}
          onPointerCancel={onPipPointerUp}
        >
          {localStream && cameraOn ? (
            <VideoElement stream={localStream} muted />
          ) : (
            <div className={styles.pipPlaceholder}>
              <VideoCameraAddOutlined />
              <span>Камера выкл.</span>
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
