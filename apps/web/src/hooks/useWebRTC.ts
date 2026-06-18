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

  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string>('');
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string>('');

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteSocketIdRef = useRef<string | null>(null);
  const toggleScreenShareRef = useRef<(() => void) | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

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

        // Enumerate devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        setVideoDevices(devices.filter((d) => d.kind === 'videoinput'));
        setAudioDevices(devices.filter((d) => d.kind === 'audioinput'));
        
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const settings = videoTrack.getSettings();
          if (settings.deviceId) setSelectedVideoDeviceId(settings.deviceId);
        }
        
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          const settings = audioTrack.getSettings();
          if (settings.deviceId) setSelectedAudioDeviceId(settings.deviceId);
        }
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
        setRemoteStream((prev) => {
          const stream = prev || new MediaStream();
          if (!stream.getTracks().includes(event.track)) {
            stream.addTrack(event.track);
          }
          return new MediaStream(stream.getTracks());
        });
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

      // 4. Setup transceivers BEFORE signaling to guarantee connection establishes
      // even if user has no camera/microphone (e.g. permission denied or Device In Use)
      const audioTransceiver = pc.addTransceiver('audio', { direction: 'sendrecv' });
      const videoTransceiver = pc.addTransceiver('video', { direction: 'sendrecv' });

      if (stream) {
        const audioTrack = stream.getAudioTracks()[0];
        const videoTrack = stream.getVideoTracks()[0];
        if (audioTrack) audioTransceiver.sender.replaceTrack(audioTrack);
        if (videoTrack) videoTransceiver.sender.replaceTrack(videoTrack);
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
        
        // Flush pending candidates
        while (pendingCandidatesRef.current.length > 0) {
          const candidate = pendingCandidatesRef.current.shift();
          if (candidate) {
            try {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.error('Failed to add queued candidate', e);
            }
          }
        }

        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        socket.emit('video:answer', { targetSocketId: senderSocketId, answer, roomId });
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleAnswer = async ({ answer }: { answer: any }) => {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        
        // Flush pending candidates
        while (pendingCandidatesRef.current.length > 0) {
          const candidate = pendingCandidatesRef.current.shift();
          if (candidate) {
            try {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.error('Failed to add queued candidate', e);
            }
          }
        }
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleIceCandidate = async ({ candidate }: { candidate: any }) => {
      if (pcRef.current) {
        if (pcRef.current.remoteDescription) {
          try {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error('Failed to add ICE candidate', err);
          }
        } else {
          // Queue candidate if remote description is not set yet
          pendingCandidatesRef.current.push(candidate);
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
        const constraints: MediaStreamConstraints = { 
          video: selectedVideoDeviceId ? { deviceId: { exact: selectedVideoDeviceId } } : true, 
          audio: isAudioEnabled 
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
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

        const sender = pcRef.current.getTransceivers().find(t => t.receiver.track.kind === 'video')?.sender;
        if (sender) {
          await sender.replaceTrack(screenTrack);
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

  const switchDevice = useCallback(async (kind: 'videoinput' | 'audioinput', deviceId: string) => {
    if (!pcRef.current || !localStreamRef.current) return;
    
    // If currently screen sharing and switching camera, just save the ID for when screen sharing ends
    if (kind === 'videoinput' && isScreenSharing) {
      setSelectedVideoDeviceId(deviceId);
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {};
      if (kind === 'videoinput') {
        constraints.video = { deviceId: { exact: deviceId } };
      } else {
        constraints.audio = { deviceId: { exact: deviceId } };
      }

      const trackKind = kind === 'videoinput' ? 'video' : 'audio';
      const oldTrack = localStreamRef.current.getTracks().find(t => t.kind === trackKind);
      
      // Stop the old track first to release the hardware lock (fixes NotReadableError on some OS)
      if (oldTrack) {
        oldTrack.stop();
        localStreamRef.current.removeTrack(oldTrack);
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const newTrack = kind === 'videoinput' ? stream.getVideoTracks()[0] : stream.getAudioTracks()[0];
      
      if (newTrack) {
        localStreamRef.current.addTrack(newTrack);
        // Ensure track enabled state matches current UI state
        if (trackKind === 'video') newTrack.enabled = isVideoEnabled;
        if (trackKind === 'audio') newTrack.enabled = isAudioEnabled;
        
        const sender = pcRef.current.getTransceivers().find(t => t.receiver.track.kind === trackKind)?.sender;
        if (sender) {
          await sender.replaceTrack(newTrack);
        }
      }
      
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      
      if (kind === 'videoinput') {
        setSelectedVideoDeviceId(deviceId);
      } else {
        setSelectedAudioDeviceId(deviceId);
      }
    } catch (err) {
      console.error('Failed to switch device:', err);
    }
  }, [isScreenSharing, isVideoEnabled, isAudioEnabled]);

  return {
    localStream,
    remoteStream,
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    connectionState,
    mediaError,
    videoDevices,
    audioDevices,
    selectedVideoDeviceId,
    selectedAudioDeviceId,
    toggleVideo,
    toggleAudio,
    toggleScreenShare,
    switchDevice,
  };
}
