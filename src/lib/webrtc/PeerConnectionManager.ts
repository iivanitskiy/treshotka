import { PEER_CONNECTION_CONFIG } from "./config";

export type IceCandidateHandler = (candidate: RTCIceCandidateInit) => void;

export class PeerConnectionManager {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private pendingIce: RTCIceCandidateInit[] = [];

  constructor(
    private readonly onRemoteStream: (stream: MediaStream) => void,
    private readonly onIceCandidate: IceCandidateHandler,
    private readonly onConnectionStateChange?: (state: RTCPeerConnectionState) => void
  ) {}

  get connection(): RTCPeerConnection | null {
    return this.pc;
  }

  get stream(): MediaStream | null {
    return this.localStream;
  }

  async acquireLocalMedia(
    audio = true,
    video = true
  ): Promise<MediaStream> {
    if (this.localStream) return this.localStream;

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio,
        video: video
          ? { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }
          : false,
      });
      return this.localStream;
    } catch (err) {
      const message =
        err instanceof DOMException
          ? err.name === "NotAllowedError"
            ? "Нет доступа к камере или микрофону"
            : err.name === "NotFoundError"
              ? "Камера или микрофон не найдены"
              : err.message
          : "Не удалось получить медиа-устройства";
      throw new Error(message);
    }
  }

  createPeerConnection(): RTCPeerConnection {
    if (this.pc) return this.pc;

    this.pc = new RTCPeerConnection(PEER_CONNECTION_CONFIG);

    this.pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) this.onRemoteStream(remoteStream);
    };

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.onIceCandidate(event.candidate.toJSON());
      }
    };

    this.pc.onconnectionstatechange = () => {
      if (this.pc) this.onConnectionStateChange?.(this.pc.connectionState);
    };

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.pc!.addTrack(track, this.localStream!);
      });
    }

    return this.pc;
  }

  attachLocalTracks(): void {
    if (!this.pc || !this.localStream) return;
    const senders = this.pc.getSenders();
    this.localStream.getTracks().forEach((track) => {
      const existing = senders.find((s) => s.track?.kind === track.kind);
      if (existing) {
        existing.replaceTrack(track).catch(console.error);
      } else {
        this.pc!.addTrack(track, this.localStream!);
      }
    });
  }

  setMicEnabled(enabled: boolean): void {
    this.localStream?.getAudioTracks().forEach((t) => {
      t.enabled = enabled;
    });
  }

  setCameraEnabled(enabled: boolean): void {
    this.localStream?.getVideoTracks().forEach((t) => {
      t.enabled = enabled;
    });
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const pc = this.createPeerConnection();
    this.attachLocalTracks();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return offer;
  }

  async createAnswer(
    remoteOffer: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit> {
    const pc = this.createPeerConnection();
    this.attachLocalTracks();
    await pc.setRemoteDescription(new RTCSessionDescription(remoteOffer));
    await this.flushPendingIce();
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
  }

  async applyAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.pc) throw new Error("PeerConnection не создан");
    await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
    await this.flushPendingIce();
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!candidate.candidate) return;
    if (!this.pc?.remoteDescription) {
      this.pendingIce.push(candidate);
      return;
    }
    try {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.warn("ICE candidate skipped:", e);
    }
  }

  private async flushPendingIce(): Promise<void> {
    const queue = [...this.pendingIce];
    this.pendingIce = [];
    for (const c of queue) {
      await this.addIceCandidate(c);
    }
  }

  destroy(): void {
    this.pendingIce = [];
    this.pc?.getSenders().forEach((sender) => {
      try {
        sender.track?.stop();
      } catch {
      }
    });
    this.pc?.close();
    this.pc = null;

    this.localStream?.getTracks().forEach((t) => t.stop());
    this.localStream = null;
  }
}
