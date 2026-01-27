"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, Suspense } from "react";
import { getRoom, Room } from "@/lib/services/roomService";
import { useSearchParams } from "next/navigation";
import { Spin, Result, Button } from "antd";
import Link from "next/link";

const RoomClient = dynamic(() => import("@/components/RoomClient"), {
  ssr: false,
});

function RoomContent() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get("id");
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) {
        setLoading(false);
        return;
    }
    const fetchRoom = async () => {
      const roomData = await getRoom(roomId);
      setRoom(roomData);
      setLoading(false);
    };
    fetchRoom();
  }, [roomId]);

  if (!roomId) {
     return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Result status="404" title="Error" subTitle="No Room ID provided" extra={<Link href="/lobby"><Button type="primary">Back</Button></Link>} />
        </div>
     );
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spin size="large" fullscreen />
      </div>
    );
  }

  if (!room) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Result status="404" title="404" subTitle="Room not found" extra={<Link href="/lobby"><Button type="primary">На главную</Button></Link>} />
      </div>
    );
  }

  return (
    <RoomClient roomId={roomId} roomName={room.name} creatorId={room.createdBy} />
  );
}

export default function RoomPage() {
    return (
        <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><Spin size="large" /></div>}>
            <RoomContent />
        </Suspense>
    );
}
