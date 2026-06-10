"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { message } from "antd";
import { PeerConnectionManager } from "@/lib/webrtc/PeerConnectionManager";
import {
  CALL_RING_TIMEOUT_MS,
  CallWithId,
  createCall,
  deleteCallArtifacts,
  isUserInActiveCall,
  setCallAnswer,
  setCallOffer,
  subscribeToCall,
  subscribeToIncomingCalls,
  subscribeToRemoteIceCandidates,
  updateCallStatus,
  addIceCandidate,
  setUserCallBusy,
  clearUserCallBusy,
} from "@/lib/services/callService";

export type PeerCallPhase =
  | "idle"
  | "outgoing"
  | "incoming"
  | "connecting"
  | "connected"
  | "ended";

export interface PeerCallPeer {
  uid: string;
  displayName: string;
}

export interface UsePeerCallOptions {
  userId: string | null;
  displayName: string | null;
}

export function usePeerCall({ userId, displayName }: UsePeerCallOptions) {
  const [phase, setPhase] = useState<PeerCallPhase>("idle");
  const [incomingCall, setIncomingCall] = useState<CallWithId | null>(null);
  const [activeCall, setActiveCall] = useState<CallWithId | null>(null);
  const [peer, setPeer] = useState<PeerCallPeer | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pcManagerRef = useRef<PeerConnectionManager | null>(null);
  const callIdRef = useRef<string | null>(null);
  const ringTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unsubCallRef = useRef<(() => void) | null>(null);
  const unsubIceRef = useRef<(() => void) | null>(null);
  const cleaningRef = useRef(false);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const incomingCallRef = useRef(incomingCall);
  incomingCallRef.current = incomingCall;
  const peerUidRef = useRef<string | null>(null);

  const clearRingTimer = () => {
    if (ringTimerRef.current) {
      clearTimeout(ringTimerRef.current);
      ringTimerRef.current = null;
    }
  };

  const teardownMedia = useCallback(() => {
    unsubCallRef.current?.();
    unsubCallRef.current = null;
    unsubIceRef.current?.();
    unsubIceRef.current = null;
    pcManagerRef.current?.destroy();
    pcManagerRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    callIdRef.current = null;
    clearRingTimer();
  }, []);

  const finalizeCall = useCallback(
    async (status: "ended" | "rejected" | "missed" | "busy" | "failed") => {
      if (cleaningRef.current) return;
      cleaningRef.current = true;

      const callId = callIdRef.current;
      const idsToClear = new Set<string>();
      if (userId) idsToClear.add(userId);
      if (peerUidRef.current) idsToClear.add(peerUidRef.current);
      peerUidRef.current = null;
      await Promise.all([...idsToClear].map((id) => clearUserCallBusy(id)));

      teardownMedia();

      if (callId) {
        try {
          await updateCallStatus(callId, status);
          setTimeout(() => deleteCallArtifacts(callId), 2000);
        } catch (e) {
          console.error(e);
        }
      }

      setPhase("ended");
      setActiveCall(null);
      setIncomingCall(null);
      setPeer(null);

      setTimeout(() => {
        setPhase("idle");
        cleaningRef.current = false;
      }, 500);
    },
    [teardownMedia, userId]
  );

  const hangUp = useCallback(() => {
    void finalizeCall("ended");
  }, [finalizeCall]);

  const getOrCreateManager = useCallback(() => {
    if (!pcManagerRef.current) {
      pcManagerRef.current = new PeerConnectionManager(
        (stream) => setRemoteStream(stream),
        (candidate) => {
          const callId = callIdRef.current;
          if (callId && userId) {
            void addIceCandidate(callId, userId, candidate);
          }
        },
        (state) => {
          if (state === "connected") setPhase("connected");
          if (state === "failed" || state === "disconnected") {
            message.error("Соединение потеряно");
            void finalizeCall("failed");
          }
        }
      );
    }
    return pcManagerRef.current;
  }, [userId, finalizeCall]);

  const wireCallSignaling = useCallback(
    (callId: string, remoteUserId: string, role: "caller" | "callee") => {
      unsubIceRef.current?.();
      unsubIceRef.current = subscribeToRemoteIceCandidates(
        callId,
        remoteUserId,
        (candidate) => {
          void pcManagerRef.current?.addIceCandidate(candidate);
        }
      );

      unsubCallRef.current?.();
      unsubCallRef.current = subscribeToCall(callId, async (call) => {
        if (!call || !pcManagerRef.current) return;

        if (call.status === "rejected") {
          message.warning("Абонент отклонил звонок");
          void finalizeCall("ended");
          return;
        }
        if (call.status === "busy") {
          message.warning("Абонент занят");
          void finalizeCall("ended");
          return;
        }
        if (call.status === "missed") {
          message.info("Звонок не принят");
          void finalizeCall("ended");
          return;
        }
        if (call.status === "ended" || call.status === "failed") {
          void finalizeCall("ended");
          return;
        }

        if (role === "caller" && call.answer && pcManagerRef.current) {
          try {
            clearRingTimer();
            await pcManagerRef.current.applyAnswer(call.answer);
            setPhase("connected");
          } catch (e) {
            console.error(e);
          }
        }

        if (role === "callee" && call.offer && !call.answer) {
        }
      });
    },
    [finalizeCall]
  );

  const startCall = useCallback(
    async (callee: PeerCallPeer) => {
      if (!userId || !displayName) return;
      if (phase !== "idle") return;

      setError(null);
      setPeer(callee);
      setPhase("outgoing");

      try {
        const [selfBusy, peerBusy] = await Promise.all([
          isUserInActiveCall(userId),
          isUserInActiveCall(callee.uid),
        ]);

        if (selfBusy) {
          message.warning("Вы уже в звонке");
          setPhase("idle");
          setPeer(null);
          return;
        }
        if (peerBusy) {
          message.warning(`${callee.displayName} занят`);
          setPhase("idle");
          setPeer(null);
          return;
        }

        const callId = await createCall({
          callerId: userId,
          callerName: displayName,
          calleeId: callee.uid,
          calleeName: callee.displayName,
        });
        callIdRef.current = callId;
        peerUidRef.current = callee.uid;
        await setUserCallBusy(userId, true);

        const manager = getOrCreateManager();
        const stream = await manager.acquireLocalMedia(true, true);
        setLocalStream(stream);

        const offer = await manager.createOffer();
        await setCallOffer(callId, offer);

        wireCallSignaling(callId, callee.uid, "caller");
        setPhase("connecting");

        ringTimerRef.current = setTimeout(() => {
          void (async () => {
            message.info("Нет ответа — звонок сброшен");
            await updateCallStatus(callId, "missed");
            void finalizeCall("missed");
          })();
        }, CALL_RING_TIMEOUT_MS);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Не удалось начать звонок";
        setError(msg);
        message.error(msg);
        void finalizeCall("failed");
      }
    },
    [
      userId,
      displayName,
      phase,
      getOrCreateManager,
      wireCallSignaling,
      finalizeCall,
    ]
  );

  const acceptIncoming = useCallback(async () => {
    const call = incomingCall;
    if (!call || !userId) return;

    clearRingTimer();
    callIdRef.current = call.id;
    peerUidRef.current = call.callerId;
    await setUserCallBusy(userId, true);
    setPeer({ uid: call.callerId, displayName: call.callerName });
    setPhase("connecting");
    setIncomingCall(null);

    try {
      const manager = getOrCreateManager();
      const stream = await manager.acquireLocalMedia(true, true);
      setLocalStream(stream);

      let offer = call.offer;
      if (!offer) {
        const { getCall } = await import("@/lib/services/callService");
        for (let i = 0; i < 20 && !offer; i++) {
          await new Promise((r) => setTimeout(r, 300));
          const fresh = await getCall(call.id);
          offer = fresh?.offer ?? undefined;
        }
      }
      if (!offer) {
        throw new Error("Нет SDP offer от звонящего — попробуйте снова");
      }

      const answer = await manager.createAnswer(offer);
      await setCallAnswer(call.id, answer);
      wireCallSignaling(call.id, call.callerId, "callee");
      setActiveCall({ ...call, status: "accepted", answer });
      setPhase("connected");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Ошибка при принятии";
      message.error(msg);
      await updateCallStatus(call.id, "failed");
      void finalizeCall("failed");
    }
  }, [incomingCall, userId, getOrCreateManager, wireCallSignaling, finalizeCall]);

  const rejectIncoming = useCallback(async () => {
    const call = incomingCall;
    if (!call) return;
    clearRingTimer();
    try {
      await updateCallStatus(call.id, "rejected");
      setTimeout(() => deleteCallArtifacts(call.id), 2000);
    } catch (e) {
      console.error(e);
    }
    setIncomingCall(null);
    setPhase("idle");
  }, [incomingCall]);

  useEffect(() => {
    if (!userId) return;

    const unsub = subscribeToIncomingCalls(userId, async (call) => {
      if (!call) {
        setIncomingCall(null);
        setPhase((p) => (p === "incoming" ? "idle" : p));
        return;
      }

      if (incomingCallRef.current?.id === call.id) return;

      const currentPhase = phaseRef.current;
      if (currentPhase !== "idle") {
        await updateCallStatus(call.id, "busy");
        return;
      }

      const busy = await isUserInActiveCall(userId);
      if (busy) {
        await updateCallStatus(call.id, "busy");
        return;
      }

      setIncomingCall(call);
      setPhase("incoming");
    });

    return () => unsub();
  }, [userId]);

  useEffect(() => {
    return () => {
      if (callIdRef.current && phase !== "idle") {
        void updateCallStatus(callIdRef.current, "ended").catch(() => {});
      }
      teardownMedia();
    };
  }, [teardownMedia, phase]);

  const toggleMic = useCallback(() => {
    setMicOn((prev) => {
      pcManagerRef.current?.setMicEnabled(!prev);
      return !prev;
    });
  }, []);

  const toggleCamera = useCallback(() => {
    setCameraOn((prev) => {
      pcManagerRef.current?.setCameraEnabled(!prev);
      return !prev;
    });
  }, []);

  return {
    phase,
    incomingCall,
    activeCall,
    peer,
    localStream,
    remoteStream,
    micOn,
    cameraOn,
    error,
    startCall,
    acceptIncoming,
    rejectIncoming,
    hangUp,
    toggleMic,
    toggleCamera,
    isInCall: phase === "connecting" || phase === "connected" || phase === "outgoing",
  };
}
