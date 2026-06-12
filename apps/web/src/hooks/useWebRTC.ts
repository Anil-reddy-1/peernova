import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from './useSocket';
import { apiClient } from '@/lib/api-client';

export function useWebRTC(roomId: string) {
  const { socket, isConnected } = useSocket();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [, setRemoteSocketId] = useState<string | null>(null);
  
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteSocketIdRef = useRef<string | null>(null);
  const toggleScreenShareRef = useRef<(() => void) | null>(null);

  // Initialize Media and Socket listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    let pc: RTCPeerConnection;

    const init = async () => {
      // Get TURN credentials
      const { data: turnRes } = await apiClient.get('/chat/turn-credentials');
      
      const config: RTCConfiguration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          {
            urls: 'turn:YOUR_TURN_SERVER_IP:3478', // Placeholder
            username: turnRes.data.username,
            credential: turnRes.data.credential,
          }
        ]
      };

      pc = new RTCPeerConnection(config);
      pcRef.current = pc;

      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && remoteSocketIdRef.current) {
          socket.emit('video:ice-candidate', {
            targetSocketId: remoteSocketIdRef.current,
            candidate: event.candidate,
            roomId
          });
        }
      };

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        localStreamRef.current = stream;
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
      } catch (err) {
        console.error('Failed to get user media', err);
      }

      socket.emit('video:join', roomId);
    };

    init();

    // Socket listeners
    const handleUserJoined = async ({ socketId }: { socketId: string }) => {
      setRemoteSocketId(socketId);
      remoteSocketIdRef.current = socketId;
      // Create offer
      if (pcRef.current) {
        const offer = await pcRef.current.createOffer();
        await pcRef.current.setLocalDescription(offer);
        socket.emit('video:offer', { targetSocketId: socketId, offer, roomId });
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleOffer = async ({ offer, senderSocketId }: { offer: any, senderSocketId: string }) => {
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
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    socket.on('video:user-joined', handleUserJoined);
    socket.on('video:offer', handleOffer);
    socket.on('video:answer', handleAnswer);
    socket.on('video:ice-candidate', handleIceCandidate);

    return () => {
      socket.off('video:user-joined', handleUserJoined);
      socket.off('video:offer', handleOffer);
      socket.off('video:answer', handleAnswer);
      socket.off('video:ice-candidate', handleIceCandidate);
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (pcRef.current) {
        pcRef.current.close();
      }
    };
  }, [socket, isConnected, roomId]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, [localStream]);

  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, [localStream]);

  const toggleScreenShare = useCallback(async () => {
    if (!pcRef.current) return;

    try {
      if (isScreenSharing) {
        // Revert to camera
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = stream.getVideoTracks()[0];
        
        const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(videoTrack);
        
        setLocalStream(prev => {
          if (prev) {
            prev.getVideoTracks()[0].stop();
            prev.removeTrack(prev.getVideoTracks()[0]);
            prev.addTrack(videoTrack);
          }
          return prev;
        });
        
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
        if (sender) sender.replaceTrack(screenTrack);

        setLocalStream(prev => {
          if (prev) {
            prev.getVideoTracks()[0].stop();
            prev.removeTrack(prev.getVideoTracks()[0]);
            prev.addTrack(screenTrack);
          }
          return prev;
        });

        setIsScreenSharing(true);
      }
    } catch (err) {
      console.error('Failed to toggle screen share', err);
    }
  }, [isScreenSharing]);

  useEffect(() => {
    toggleScreenShareRef.current = toggleScreenShare;
  }, [toggleScreenShare]);

  return {
    localStream,
    remoteStream,
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    toggleVideo,
    toggleAudio,
    toggleScreenShare
  };
}
