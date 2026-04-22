"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Flex, Typography } from "antd";
import { PhoneOutlined, VideoCameraOutlined, VideoCameraAddOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface VideoCallWindowProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isVideoEnabled: boolean;
  isCallActive: boolean;
  onToggleVideo: () => void;
  onEndCall: () => void;
}

export default function VideoCallWindow({
  localStream,
  remoteStream,
  isVideoEnabled,
  isCallActive,
  onToggleVideo,
  onEndCall
}: VideoCallWindowProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (!isCallActive) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Text type="secondary">Ожидание соединения...</Text>
      </div>
    );
  }

  return (
    <Flex vertical gap="middle" style={{ height: '100%' }}>
      <div style={{ position: 'relative', flex: 1, background: '#000', borderRadius: '8px' }}>
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }}
        />
        {isVideoEnabled && localStream && (
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 120,
              height: 90,
              borderRadius: '8px',
              objectFit: 'cover'
            }}
          />
        )}
      </div>
      <Flex justify="center" gap="middle">
        <Button
          type="primary"
          danger

          icon={<PhoneOutlined />}
          onClick={onEndCall}
        >
          Завершить
        </Button>
        <Button
          type="default"
          icon={isVideoEnabled ? <VideoCameraOutlined /> : <VideoCameraAddOutlined />}
          onClick={onToggleVideo}
        >
          {isVideoEnabled ? "Отключить видео" : "Включить видео"}
        </Button>
      </Flex>
    </Flex>
  );
}