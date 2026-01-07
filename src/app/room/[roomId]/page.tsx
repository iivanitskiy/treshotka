"use client";

import dynamic from "next/dynamic";
import { use, useEffect, useState } from "react";
import { getRoom, Room } from "@/lib/services/roomService";

import { Spin, Result, Button } from "antd";
import Link from "next/link";

const RoomClient = dynamic(() => import("@/components/RoomClient"), {
  ssr: false,
});

export default function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoom = async () => {
      const roomData = await getRoom(roomId);
      setRoom(roomData);
      setLoading(false);
    };
    fetchRoom();
  }, [roomId]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin size="large" fullscreen />
      </div>
    );
  }

  if (!room) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Result
          status="404"
          title="404"
          subTitle="Room not found"
          extra={
            <Link href="/lobby">
              <Button type="primary">На главную</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <RoomClient
      roomId={roomId}
      roomName={room.name}
      creatorId={room.createdBy}
    />
  );
}
