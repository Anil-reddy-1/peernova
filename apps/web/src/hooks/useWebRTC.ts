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
  const makingOfferRef = useRef(false);

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
          const hasTurn = iceServers.some((s: IceServer) => {
            const urls = Array.isArray(s.urls) ? s.urls : [s.urls];
            return urls.some(u => u.startsWith('turn:') || u.startsWith('turns:'));
          });
          if (hasTurn) {
            console.log('✅ WebRTC: Got TURN + STUN servers');
          } else {
            console.warn('⚠️ WebRTC: STUN-only – cross-network calls may fail');
          }
        }
      } catch (err) {
        console.warn('⚠️ WebRTC: Failed to fetch TURN credentials, using STUN fallback', err);
      }

      if (cancelled) {
        if (stream) stream.getTracks().forEach(t => t.stop());
        return;
      }

      if (iceServers.length > 0) {
        console.log('📹 Using ICE Servers:', iceServers.map(s => s.urls).flat());
      }
      
      // 3. Create Peer Connection
      const pc = new RTCPeerConnection({ iceServers });
      pcRef.current = pc;

      // ─── PC event handlers ───
      pc.onconnectionstatechange = () => {
        console.log(`📹 connectionState → ${pc.connectionState}`);
        setConnectionState(pc.connectionState);
      };

      pc.oniceconnectionstatechange = () => {
        console.log(`📹 iceConnectionState → ${pc.iceConnectionState}`);
      };

      pc.onsignalingstatechange = () => {
        console.log(`📹 signalingState → ${pc.signalingState}`);
      };

      pc.ontrack = (event) => {
        console.log(`📹 ontrack: kind=${event.track.kind} readyState=${event.track.readyState} streams=${event.streams?.length || 0}`);
        if (event.streams && event.streams[0]) {
          // Force a new reference so React re-renders and updates srcObject
          setRemoteStream(new MediaStream(event.streams[0].getTracks()));
        } else {
          setRemoteStream((prev) => {
            const s = prev || new MediaStream();
            if (!s.getTrackById(event.track.id)) {
              s.addTrack(event.track);
            }
            return new MediaStream(s.getTracks());
          });
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          if (remoteSocketIdRef.current) {
            console.log(`📹 Sending ICE candidate to ${remoteSocketIdRef.current}`);
            socket.emit('video:ice-candidate', {
              targetSocketId: remoteSocketIdRef.current,
              candidate: event.candidate,
              roomId,
            });
          } else {
            console.warn('📹 ICE candidate generated but remoteSocketIdRef is null!');
          }
        } else {
          console.log('📹 ICE candidate gathering complete');
        }
      };

      // 4. Add local tracks via addTrack (NOT addTransceiver)
      if (stream) {
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });
        console.log(`📹 Added ${stream.getTracks().length} local tracks via addTrack`);
      } else {
        pc.addTransceiver('audio', { direction: 'recvonly' });
        pc.addTransceiver('video', { direction: 'recvonly' });
        console.log('📹 No local media – set up recvonly transceivers');
      }

      // 5. Join the signaling room
      socket.emit('video:join', roomId);
      console.log(`📹 Emitted video:join for room ${roomId}`);
    };

    init();

    // ─── Socket signaling handlers ───────────────────────────────

    const handleUserJoined = async ({ socketId, userId }: { socketId: string; userId?: string }) => {
      try {
        console.log(`📹 video:user-joined  socket=${socketId}  uid=${userId ?? '?'}`);

        setRemoteStream(null);
        setRemoteSocketId(socketId);
        remoteSocketIdRef.current = socketId;
        pendingCandidatesRef.current = [];

        const pc = pcRef.current;
        if (!pc) {
          console.error('📹 PeerConnection not ready when user joined');
          return;
        }

        makingOfferRef.current = true;
        try {
          const offer = await pc.createOffer(); // removed iceRestart
          await pc.setLocalDescription(offer);
          socket.emit('video:offer', {
            targetSocketId: socketId,
            offer: pc.localDescription,
            roomId,
          });
          console.log('📹 Offer sent');
        } finally {
          makingOfferRef.current = false;
        }
      } catch (err) {
        makingOfferRef.current = false;
        console.error('📹 handleUserJoined error:', err);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleOffer = async ({ offer, senderSocketId }: { offer: any; senderSocketId: string }) => {
      try {
        console.log(`📹 video:offer from ${senderSocketId}`);
        const pc = pcRef.current;
        if (!pc) return;

        const offerCollision = makingOfferRef.current || pc.signalingState !== 'stable';
        if (offerCollision) {
          console.log('📹 Glare detected — rolling back local offer');
          await Promise.all([
            pc.setLocalDescription({ type: 'rollback' }),
          ]);
        }

        setRemoteSocketId(senderSocketId);
        remoteSocketIdRef.current = senderSocketId;

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        console.log(`📹 Remote offer set  signalingState=${pc.signalingState}`);

        // Flush queued ICE candidates
        if (pendingCandidatesRef.current.length > 0) {
          console.log(`📹 Flushing ${pendingCandidatesRef.current.length} queued ICE candidates`);
          for (const c of pendingCandidatesRef.current) {
            try { 
              await pc.addIceCandidate(new RTCIceCandidate(c)); 
              console.log('📹 Added queued ICE candidate successfully');
            } catch (e) { 
              console.error('📹 Failed to add queued ICE candidate', e);
            }
          }
          pendingCandidatesRef.current = [];
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('video:answer', {
          targetSocketId: senderSocketId,
          answer: pc.localDescription,
          roomId,
        });
        console.log(`📹 Answer sent  signalingState=${pc.signalingState}`);
      } catch (err) {
        console.error('📹 handleOffer error:', err);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleAnswer = async ({ answer }: { answer: any }) => {
      try {
        console.log('📹 video:answer received');
        const pc = pcRef.current;
        if (!pc) return;

        if (pc.signalingState !== 'have-local-offer') {
          console.warn(`📹 Ignoring stale answer (signalingState=${pc.signalingState})`);
          return;
        }

        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log(`📹 Remote answer set  signalingState=${pc.signalingState}`);

        // Flush queued ICE candidates
        if (pendingCandidatesRef.current.length > 0) {
          console.log(`📹 Flushing ${pendingCandidatesRef.current.length} queued ICE candidates`);
          for (const c of pendingCandidatesRef.current) {
            try { 
              await pc.addIceCandidate(new RTCIceCandidate(c)); 
              console.log('📹 Added queued ICE candidate successfully');
            } catch (e) { 
              console.error('📹 Failed to add queued ICE candidate', e);
            }
          }
          pendingCandidatesRef.current = [];
        }
      } catch (err) {
        console.error('📹 handleAnswer error:', err);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleIceCandidate = async ({ candidate, senderSocketId }: { candidate: any, senderSocketId: string }) => {
      try {
        console.log(`📹 video:ice-candidate received from ${senderSocketId}`);
        const pc = pcRef.current;
        if (!pc) {
          console.warn('📹 Received ICE candidate but PC is null');
          return;
        }

        if (pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          console.log('📹 Added ICE candidate successfully');
        } else {
          console.log('📹 Queuing ICE candidate (remoteDescription not set yet)');
          pendingCandidatesRef.current.push(candidate);
        }
      } catch (err) {
        console.error('📹 ICE candidate error:', err);
      }
    };

    const handleUserLeft = ({ socketId }: { socketId: string }) => {
      console.log(`📹 video:user-left  socket=${socketId}`);
      // Only react if the leaving user is our current peer
      if (remoteSocketIdRef.current === socketId || !remoteSocketIdRef.current) {
        setRemoteStream(null);
        setRemoteSocketId(null);
        remoteSocketIdRef.current = null;
        pendingCandidatesRef.current = [];
        setConnectionState('new');
      }
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

      // ── Tell the server / remote peer we are leaving ──
      socket.emit('video:leave', roomId);

      if (localStreamToCleanup) {
        localStreamToCleanup.getTracks().forEach((track) => track.stop());
      }
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      pendingCandidatesRef.current = [];
      remoteSocketIdRef.current = null;
      makingOfferRef.current = false;
      setLocalStream(null);
      setRemoteStream(null);
      setConnectionState('new');
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

        const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(screenTrack);
        }

        if (localStreamRef.current) {
          localStreamRef.current.getVideoTracks().forEach((t) => t.stop());
          localStreamRef.current.getVideoTracks().forEach((t) => localStreamRef.current!.removeTrack(t));
          localStreamRef.current.addTrack(screenTrack);
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
  }, [isScreenSharing, isAudioEnabled, selectedVideoDeviceId]);

  useEffect(() => {
    toggleScreenShareRef.current = toggleScreenShare;
  }, [toggleScreenShare]);

  const switchDevice = useCallback(async (kind: 'videoinput' | 'audioinput', deviceId: string) => {
    if (!pcRef.current || !localStreamRef.current) return;
    
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
      
      // Stop the old track first to release the hardware lock
      if (oldTrack) {
        oldTrack.stop();
        localStreamRef.current.removeTrack(oldTrack);
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const newTrack = kind === 'videoinput' ? stream.getVideoTracks()[0] : stream.getAudioTracks()[0];
      
      if (newTrack) {
        localStreamRef.current.addTrack(newTrack);
        if (trackKind === 'video') newTrack.enabled = isVideoEnabled;
        if (trackKind === 'audio') newTrack.enabled = isAudioEnabled;
        
        const sender = pcRef.current.getSenders().find(s => s.track?.kind === trackKind);
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
