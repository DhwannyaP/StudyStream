export class WebRTCManager {
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private remoteStreams: Map<string, MediaStream> = new Map();
  private onRemoteStreamAdded?: (userId: string, stream: MediaStream) => void;
  private onRemoteStreamRemoved?: (userId: string) => void;
  private onIceCandidateCreated?: (
    userId: string,
    candidate: RTCIceCandidateInit
  ) => void;

  constructor() {
    this.onRemoteStreamAdded = undefined;
    this.onRemoteStreamRemoved = undefined;
  }

  async initializeLocalStream(): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: true,
      });
      return this.localStream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      throw error;
    }
  }

  async createPeerConnection(userId: string): Promise<RTCPeerConnection> {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    };

    const peerConnection = new RTCPeerConnection(configuration);

    // Add local stream to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, this.localStream!);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      this.remoteStreams.set(userId, remoteStream);
      this.onRemoteStreamAdded?.(userId, remoteStream);
    };

    // Handle local ICE
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        const ice: RTCIceCandidateInit = event.candidate.toJSON();
        this.onIceCandidateCreated?.(userId, ice);
      }
    };

    // Handle ICE connection state changes
    peerConnection.oniceconnectionstatechange = () => {
      if (peerConnection.iceConnectionState === "disconnected") {
        this.removePeerConnection(userId);
      }
    };

    this.peerConnections.set(userId, peerConnection);
    return peerConnection;
  }

  async createOffer(userId: string): Promise<RTCSessionDescriptionInit> {
    const peerConnection = await this.createPeerConnection(userId);
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    return offer;
  }

  async createAnswer(
    userId: string,
    offer: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit> {
    const peerConnection = await this.createPeerConnection(userId);
    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    return answer;
  }

  async setRemoteAnswer(
    userId: string,
    answer: RTCSessionDescriptionInit
  ): Promise<void> {
    const peerConnection = this.peerConnections.get(userId);
    if (peerConnection) {
      await peerConnection.setRemoteDescription(answer);
    }
  }

  async addIceCandidate(
    userId: string,
    candidate: RTCIceCandidateInit
  ): Promise<void> {
    const peerConnection = this.peerConnections.get(userId);
    if (peerConnection) {
      await peerConnection.addIceCandidate(candidate);
    }
  }

  removePeerConnection(userId: string): void {
    const peerConnection = this.peerConnections.get(userId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(userId);
    }

    const remoteStream = this.remoteStreams.get(userId);
    if (remoteStream) {
      this.remoteStreams.delete(userId);
      this.onRemoteStreamRemoved?.(userId);
    }
  }

  toggleAudio(): void {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  }

  toggleVideo(): void {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  }

  async startScreenShare(): Promise<MediaStream> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      // Replace video track in all peer connections
      const videoTrack = screenStream.getVideoTracks()[0];
      for (const [userId, peerConnection] of this.peerConnections) {
        const sender = peerConnection
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
      }

      return screenStream;
    } catch (error) {
      console.error("Error starting screen share:", error);
      throw error;
    }
  }

  stopCall(): void {
    // Close all peer connections
    for (const [userId] of this.peerConnections) {
      this.removePeerConnection(userId);
    }

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
  }

  onRemoteStream(
    callback: (userId: string, stream: MediaStream) => void
  ): void {
    this.onRemoteStreamAdded = callback;
  }

  onRemoteStreamEnded(callback: (userId: string) => void): void {
    this.onRemoteStreamRemoved = callback;
  }

  onIceCandidate(
    callback: (userId: string, candidate: RTCIceCandidateInit) => void
  ): void {
    this.onIceCandidateCreated = callback;
  }
}

let webrtcManager: WebRTCManager | null = null;

export function getWebRTCManager(): WebRTCManager {
  if (!webrtcManager) {
    webrtcManager = new WebRTCManager();
  }
  return webrtcManager;
}
