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

  private static isRetryableMediaError(err: unknown): boolean {
    if (!(err instanceof DOMException)) {
      const msg = err instanceof Error ? err.message : String(err);
      return /allocate|in use|busy|NotReadable/i.test(msg);
    }
    return (
      err.name === "NotReadableError" ||
      err.name === "AbortError" ||
      /allocate/i.test(err.message)
    );
  }

  private static mapMediaError(err: unknown, videoRequested: boolean): string {
    const raw = err instanceof Error ? err.message : String(err);
    if (err instanceof DOMException) {
      if (err.name === "NotAllowedError") {
        return "Нет доступа к камере или микрофону";
      }
      if (err.name === "NotFoundError") {
        return videoRequested
          ? "Камера или микрофон не найдены"
          : "Микрофон не найден";
      }
      if (
        err.name === "NotReadableError" ||
        /allocate/i.test(err.message)
      ) {
        return "Камера занята другим приложением или вкладкой. Закройте групповой чат и попробуйте снова";
      }
    }
    if (/allocate/i.test(raw)) {
      return "Не удалось открыть камеру — возможно, она используется в другой вкладке";
    }
    return raw || "Не удалось получить медиа-устройства";
  }

  private async getUserMediaWithRetry(
    constraints: MediaStreamConstraints,
    retries = 3
  ): Promise<MediaStream> {
    let lastError: unknown;
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        lastError = err;
        const retryable = PeerConnectionManager.isRetryableMediaError(err);
        if (!retryable || attempt === retries - 1) break;
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      }
    }
    throw lastError;
  }

  async acquireLocalMedia(
    audio = true,
    video = true
  ): Promise<MediaStream> {
    if (this.localStream?.active) return this.localStream;
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }

    const attempts: MediaStreamConstraints[] = [];
    if (audio && video) {
      attempts.push({ audio: true, video: { facingMode: "user" } });
      attempts.push({ audio: true, video: true });
    } else if (audio) {
      attempts.push({ audio: true, video: false });
    } else if (video) {
      attempts.push({ audio: false, video: true });
    }

    if (audio && video) {
      attempts.push({ audio: true, video: false });
    }

    let lastError: unknown;
    for (const constraints of attempts) {
      try {
        this.localStream = await this.getUserMediaWithRetry(constraints);
        return this.localStream;
      } catch (err) {
        lastError = err;
        const wantsVideo =
          typeof constraints.video === "object"
            ? true
            : Boolean(constraints.video);
        if (!wantsVideo) break;
      }
    }

    throw new Error(
      PeerConnectionManager.mapMediaError(lastError, video)
    );
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

  hasVideoTrack(): boolean {
    return (
      this.localStream?.getVideoTracks().some((t) => t.readyState === "live") ??
      false
    );
  }

  async enableCamera(): Promise<void> {
    if (this.hasVideoTrack()) {
      this.setCameraEnabled(true);
      return;
    }

    const videoStream = await this.getUserMediaWithRetry(
      { video: { facingMode: "user" }, audio: false },
      3
    );
    const videoTrack = videoStream.getVideoTracks()[0];
    if (!videoTrack) throw new Error("Не удалось получить видеопоток");

    if (!this.localStream) {
      this.localStream = new MediaStream();
    }
    this.localStream.addTrack(videoTrack);

    if (this.pc) {
      const videoSender = this.pc
        .getSenders()
        .find((s) => s.track?.kind === "video");
      if (videoSender) {
        await videoSender.replaceTrack(videoTrack);
      } else {
        this.pc.addTrack(videoTrack, this.localStream);
      }
    }
  }

  disableCamera(): void {
    const tracks = [...(this.localStream?.getVideoTracks() ?? [])];
    for (const track of tracks) {
      track.stop();
      this.localStream?.removeTrack(track);
    }
    const videoSender = this.pc
      ?.getSenders()
      .find((s) => s.track?.kind === "video");
    if (videoSender) {
      void videoSender.replaceTrack(null);
    }
  }

  async createRenegotiationOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.pc) throw new Error("PeerConnection не создан");
    const offer = await this.pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await this.pc.setLocalDescription(offer);
    return offer;
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

  async applyAnswer(answer: RTCSessionDescriptionInit): Promise<boolean> {
    if (!this.pc) throw new Error("PeerConnection не создан");
    if (!answer.sdp) return false;

    const { signalingState, remoteDescription } = this.pc;

    if (remoteDescription?.sdp === answer.sdp) return false;

    if (signalingState !== "have-local-offer") return false;

    await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
    await this.flushPendingIce();
    return true;
  }

  async applyRemoteOffer(
    offer: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit | null> {
    if (!this.pc || !offer.sdp) return null;

    if (this.pc.remoteDescription?.sdp === offer.sdp) return null;

    const state = this.pc.signalingState;
    if (state !== "stable" && state !== "have-remote-offer") return null;

    await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
    await this.flushPendingIce();
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return answer;
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
    this.pc?.close();
    this.pc = null;
    this.localStream?.getTracks().forEach((t) => {
      try {
        t.stop();
      } catch {
        /* ignore */
      }
    });
    this.localStream = null;
  }
}
