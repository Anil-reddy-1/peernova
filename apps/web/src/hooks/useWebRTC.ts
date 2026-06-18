import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from './useSocket';
import { apiClient } from '@/lib/api-client';

interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export function useWebRTC(roomId: string) {
  const { socket, isConnected } = useSocket();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [, setRemoteSocketId] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteSocketIdRef = useRef<string | null>(null);
  const toggleScreenShareRef = useRef<(() => void) | null>(null);

  // ─── Initialize Media and WebRTC Peer Connection ───
  useEffect(() => {
    if (!roomId || !socket || !isConnected) return;

    let cancelled = false;
    let localStreamToCleanup: MediaStream | null = null;

    const init = async () => {
      // 1. Capture local media first
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        
        localStreamToCleanup = stream;
        localStreamRef.current = stream;
        setLocalStream(stream);
        setMediaError(null);
      } catch (err: any) {
        console.error('Failed to get user media:', err);
        if (err.name === 'NotAllowedError') {
          setMediaError('Camera/microphone access was denied. Please allow access in your browser settings.');
        } else if (err.name === 'NotFoundError') {
          setMediaError('No camera or microphone found on this device.');
        } else if (err.name === 'NotReadableError') {
          setMediaError('Camera or microphone is already in use by another application.');
        } else {
          setMediaError(`Could not access camera/microphone: ${err.message}`);
        }
      }

      // 2. Fetch Metered TURN/STUN credentials
      let iceServers: IceServer[] = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ];

      try {
        const { data: turnRes } = await apiClient.get('/chat/turn-credentials');
        if (turnRes?.data?.iceServers && Array.isArray(turnRes.data.iceServers)) {
          iceServers = turnRes.data.iceServers;
        }
      } catch (err) {
        console.warn('Failed to fetch TURN credentials, using STUN fallback', err);
      }

      if (cancelled) {
        if (stream) stream.getTracks().forEach(t => t.stop());
        return;
      }

      // 3. Create Peer Connection
      const config: RTCConfiguration = {
        iceServers,
        iceCandidatePoolSize: 10,
      };

      const pc = new RTCPeerConnection(config);
      pcRef.current = pc;

      // Track connection state
      pc.onconnectionstatechange = () => {
        setConnectionState(pc.connectionState);
        if (pc.connectionState === 'failed') {
          console.error('WebRTC connection failed – may need TURN server');
        }
      };

      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && remoteSocketIdRef.current) {
          socket.emit('video:ice-candidate', {
            targetSocketId: remoteSocketIdRef.current,
            candidate: event.candidate,
            roomId,
          });
        }
      };

      // 4. Add tracks BEFORE signaling
      if (stream) {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream!);
        });
      }

      // 5. Join the signaling room
      socket.emit('video:join', roomId);
    };

    init();

    // ─── Socket event handlers ───
    const handleUserJoined = async ({ socketId }: { socketId: string }) => {
      setRemoteSocketId(socketId);
      remoteSocketIdRef.current = socketId;
      if (pcRef.current) {
        const offer = await pcRef.current.createOffer();
        await pcRef.current.setLocalDescription(offer);
        socket.emit('video:offer', { targetSocketId: socketId, offer, roomId });
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleOffer = async ({ offer, senderSocketId }: { offer: any; senderSocketId: string }) => {
      setRemoteSocketId(senderSocketId);
      remoteSocketIdRef.current = senderSocketId;
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        socket.emit('video:answer', { targetSocketId: senderSocketId, answer, roomId });
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleAnswer = async ({ answer }: { answer: any }) => {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleIceCandidate = async ({ candidate }: { candidate: any }) => {
      if (pcRef.current) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Failed to add ICE candidate', err);
        }
      }
    };

    const handleUserLeft = () => {
      setRemoteStream(null);
      setRemoteSocketId(null);
      remoteSocketIdRef.current = null;
    };

    socket.on('video:user-joined', handleUserJoined);
    socket.on('video:offer', handleOffer);
    socket.on('video:answer', handleAnswer);
    socket.on('video:ice-candidate', handleIceCandidate);
    socket.on('video:user-left', handleUserLeft);

    return () => {
      cancelled = true;
      socket.off('video:user-joined', handleUserJoined);
      socket.off('video:offer', handleOffer);
      socket.off('video:answer', handleAnswer);
      socket.off('video:ice-candidate', handleIceCandidate);
      socket.off('video:user-left', handleUserLeft);

      if (localStreamToCleanup) {
        localStreamToCleanup.getTracks().forEach((track) => track.stop());
      }
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      setLocalStream(null);
      setRemoteStream(null);
    };
  }, [socket, isConnected, roomId]);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, []);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (!pcRef.current) return;

    try {
      if (isScreenSharing) {
        // Revert to camera
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: isAudioEnabled });
        const videoTrack = stream.getVideoTracks()[0];

        const sender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video');
        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
        }

        if (localStreamRef.current) {
          localStreamRef.current.getVideoTracks().forEach((t) => t.stop());
          localStreamRef.current.getVideoTracks().forEach((t) => localStreamRef.current!.removeTrack(t));
          if (videoTrack) localStreamRef.current.addTrack(videoTrack);
          // Create new stream object to force React re-render
          setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        } else {
          localStreamRef.current = stream;
          setLocalStream(stream);
        }
        
        setIsScreenSharing(false);
        setIsVideoEnabled(true);
      } else {
        // Start screen share
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = stream.getVideoTracks()[0];

        screenTrack.onended = () => {
          if (toggleScreenShareRef.current) {
            toggleScreenShareRef.current();
          }
        };

        const sender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(screenTrack);
        } else {
          // If no sender existed, we add the track. This might require renegotiation
          // but at least it will send if renegotiation happens.
          pcRef.current.addTrack(screenTrack, localStreamRef.current || stream);
        }

        if (localStreamRef.current) {
          localStreamRef.current.getVideoTracks().forEach((t) => t.stop());
          localStreamRef.current.getVideoTracks().forEach((t) => localStreamRef.current!.removeTrack(t));
          localStreamRef.current.addTrack(screenTrack);
          // Create new stream object to force React re-render
          setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        } else {
          localStreamRef.current = stream;
          setLocalStream(stream);
        }
        
        setIsScreenSharing(true);
      }
    } catch (err) {
      console.error('Failed to toggle screen share', err);
    }
  }, [isScreenSharing, isAudioEnabled]);

  useEffect(() => {
    toggleScreenShareRef.current = toggleScreenShare;
  }, [toggleScreenShare]);

  return {
    localStream,
    remoteStream,
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    connectionState,
    mediaError,
    toggleVideo,
    toggleAudio,
    toggleScreenShare,
  };
}
